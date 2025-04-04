import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils";
import {formatDate} from "@/lib/date_formater";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Plus, Trash2, User} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {type ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent} from "@/components/ui/card";
import {eachMonthOfInterval, endOfMonth, format, getMonth, getYear, startOfMonth} from "date-fns";
import * as React from "react";
import {formatCurrency} from "@/lib/currency_formater";
import {ProjectSchema} from "@/types/project";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {getUserInitialsByName} from "@/lib/user_name";
import {Progress} from "@/components/ui/progress";
import {UserSchema} from "@/types/user";
import {useId, useMemo, useState} from "react";
import {TimeTrackingSchema} from "@/types/time_tracking";
import {ProjectRoleSchema} from "@/types/project_role";
import {AllocationSchema} from "@/types/allocation";
import ProjectExpandedRow from "@/components/custom/project/ProjectExpandedRow";
import {CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis} from "recharts";
import {ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from "@/components/ui/chart";

type projectAllocations = {
    user: UserSchema | undefined
    id: string
    project_id: string
    user_id: string
    start_date: Date
    end_date: Date
    percentage: number
    role: string
}

type ProjectRoleAllocationData = {
    projectId: string
    projectName: string
    client: string
    projectRole: string
    staffing: string
    area: string
    team: string
    rateHourly: number
    rateDaily: number
    monthlyData: {
        [key: string]: {
            calculatedDays: number
            calculatedRevenue: number
            actualHours: number
            allocatedPercentage: number
            actualRevenue: number
        }
    }
}

interface ProjectDetailDialogProps {
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    selectedProject: ProjectSchema | null;
    projectAllocations: projectAllocations[];
    setSelectedAllocation: (allocation: projectAllocations) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    setAddAllocationOpen: (open: boolean) => void;
    availableUsers: UserSchema[];
    availableUnassignedRoles: ProjectRoleSchema[];

    timeEntries: TimeTrackingSchema[]
    projectRoles: Record<string, ProjectRoleSchema[]>
    allocations: AllocationSchema[]
    users: UserSchema[]
}

export default function ProjectDetailDialog({modalOpen, setModalOpen, selectedProject,
                                                projectAllocations, setSelectedAllocation,
                                                setDeleteConfirmOpen, setAddAllocationOpen, availableUsers, availableUnassignedRoles,
                                                timeEntries, projectRoles, allocations, users
                                            }:ProjectDetailDialogProps ) {
    const id = useId()

    const [year, setYear] = useState<number>(2025)
    const previousYear = () => setYear(year - 1)
    const nextYear = () => setYear(year + 1)

    const months = useMemo(() => {
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31)

        return eachMonthOfInterval({ start: startDate, end: endDate }).map((month) => {
            const start = startOfMonth(month)
            const end = endOfMonth(month)
            let workingDays = 0
            const current = new Date(start)

            while (current <= end) {
                const day = current.getDay()
                if (day !== 0 && day !== 6) workingDays++
                current.setDate(current.getDate() + 1)
            }

            return {
                month,
                daysInMonth: end.getDate(),
                workingDays,
            }
        })
    }, [year])
    const projectRoleAllocations = useMemo(() => {
        if (!selectedProject) return []

        const projectRolesForProject = projectRoles[selectedProject.id] || []
        const result: ProjectRoleAllocationData[] = []

        projectRolesForProject.forEach((projectRole) => {
            const allocationsForRole = allocations.filter(
                (allocation) => allocation.project_id === selectedProject.id && allocation.role === projectRole.id,
            )

            allocationsForRole.forEach((allocation) => {
                const user = users.find((u) => u.id === allocation.user_id)
                if (!user) return

                const monthlyData: ProjectRoleAllocationData["monthlyData"] = {}

                months.forEach(({ month, workingDays }) => {
                    const monthKey = format(month, "yyyy-MM")
                    const monthStart = startOfMonth(month)
                    const monthEnd = endOfMonth(month)

                    const isActive = allocation.start_date <= monthEnd && (!allocation.end_date || allocation.end_date >= monthStart)

                    if (!isActive) {
                        monthlyData[monthKey] = {
                            calculatedDays: 0,
                            calculatedRevenue: 0,
                            actualHours: 0,
                            allocatedPercentage: 0,
                            actualRevenue: 0,
                        }
                        return
                    }

                    const allocatedDays = workingDays * allocation.percentage
                    const dailyRate = projectRole.hourly_rate * 8
                    const calculatedRevenue = allocatedDays * dailyRate

                    const entriesInMonth = timeEntries.filter(
                        (entry) =>
                            entry.project_id === selectedProject.id &&
                            entry.user_id === user.id &&
                            getMonth(entry.date) === getMonth(month) &&
                            getYear(entry.date) === getYear(month),
                    )

                    const actualHours = entriesInMonth.reduce((sum, e) => sum + e.hours, 0)
                    const actualRevenue = actualHours * projectRole.hourly_rate

                    monthlyData[monthKey] = {
                        calculatedDays: allocatedDays,
                        calculatedRevenue,
                        actualHours,
                        allocatedPercentage: allocation.percentage * 100,
                        actualRevenue,
                    }
                })

                result.push({
                    projectId: selectedProject.id,
                    projectName: selectedProject.project_name,
                    client: selectedProject.client,
                    projectRole: projectRole.role,
                    staffing: user.name,
                    area: user.department,
                    team: user.location,
                    rateHourly: projectRole.hourly_rate,
                    rateDaily: projectRole.hourly_rate * 8,
                    monthlyData,
                })
            })
        })

        return result
    }, [selectedProject, projectRoles, allocations, users, months, timeEntries])
    const monthlyTotals = useMemo(() => {
        const totals: Record<
            string, {
                calculatedDays: number
                calculatedRevenue: number
                actualHours: number
                actualRevenue: number
            }> = {}

        months.forEach(({ month }) => {
            const key = format(month, "yyyy-MM")
            totals[key] = {
                calculatedDays: 0,
                calculatedRevenue: 0,
                actualHours: 0,
                actualRevenue: 0,
            }
        })

        projectRoleAllocations.forEach((alloc) => {
            Object.entries(alloc.monthlyData).forEach(([monthKey, data]) => {
                totals[monthKey].calculatedDays += data.calculatedDays
                totals[monthKey].calculatedRevenue += data.calculatedRevenue
                totals[monthKey].actualHours += data.actualHours
                totals[monthKey].actualRevenue += data.actualRevenue
            })
        })

        return totals
    }, [projectRoleAllocations, months])
    const [selectedMonth] = useState<number>(new Date().getMonth())
    const getTimeTrackingStatsForMonth = (projectId: string, month: number, year: number) => {
        const projectEntries = timeEntries.filter(
            (entry) =>
                entry.project_id === projectId &&
                getMonth(entry.date) === month &&
                getYear(entry.date) === year
        )

        const billedHours = projectEntries.reduce((sum, entry) => sum + entry.hours, 0)
        const approvedHours = projectEntries
            .filter((entry) => entry.status === "Approved")
            .reduce((sum, entry) => sum + entry.hours, 0)

        return {
            billedHours,
            approvedHours,
            unapprovedHours: billedHours - approvedHours,
        }
    }

    const availableRoles = useMemo(() => {
        if (!selectedProject) return []
        return projectRoles[selectedProject.id] || []
    }, [selectedProject, projectRoles])

    const columns: ColumnDef<(typeof projectAllocations)[0]>[] = [
        {
            accessorFn: (row) => row.user?.name,
            id: "name",
            header: "Name",
            cell: ({ row }) => {
                const name = row.original.user?.name || ""
                return (
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitialsByName(name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{name}</div>
                    </div>
                )
            },
        },
        {
            accessorFn: (row) => row.user?.email,
            id: "email",
            header: "Email",
        },
        {
            accessorFn: (row) => row.role,
            id: "role",
            header: "Project Role",
            cell: ({ row }) => {
                const roleId = row.original.role
                const roleName = availableRoles.find((r) => r.id === roleId)?.role || roleId
                return <span>{roleName}</span>
            },
        },
        {
            accessorFn: (row) => row.user?.department,
            id: "department",
            header: "Department",
        },
        {
            accessorFn: (row) => row.percentage,
            id: "allocation",
            header: "Allocation",
            cell: ({ row }) => {
                const percentage = row.original.percentage * 100
                return (
                    <div className="flex items-center gap-2">
                        <Progress value={percentage} className="h-2 w-20" />
                        <span>{percentage}%</span>
                    </div>
                )
            },
        },
        {
            accessorFn: (row) => row.start_date,
            id: "period",
            header: "Starting Date",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-1 text-sm">
                        <span>{formatDate(row.original.start_date)}</span>
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAllocation(row.original)
                                setDeleteConfirmOpen(true)
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: projectAllocations,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 5,
            },
        },
    })

    const chartData = useMemo(() => {
        if (Object.keys(monthlyTotals).length === 0) return []

        return Object.keys(monthlyTotals)
            .sort()
            .map((monthKey) => {
                const [year, monthNum] = monthKey.split("-")
                const date = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1)
                const monthName = format(date, "MMM")

                const { calculatedDays, actualHours } = monthlyTotals[monthKey]
                const actualDays = actualHours / 8

                return {
                    month: monthName,
                    calculated: Number(calculatedDays.toFixed(0)),
                    actual: Number(actualDays.toFixed(0)),
                }
            })
    }, [monthlyTotals])

    const chartConfig = {
        calculated: {
            label: "Calculated (Days)",
            color: "hsl(215, 14%, 34%)",
        },
        actual: {
            label: "Actual (Days)",
            color: "hsl(142, 76%, 36%)",
        },
    } satisfies ChartConfig

    const values = chartData.map((d) => Math.max(d.calculated, d.actual))

    const sorted = [...values].sort((a, b) => a - b)
    const safeMax = sorted[Math.floor(sorted.length * 0.95)] || 10
    
    return(
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="min-w-[95vw] w-screen max-w-[95vw] p-6 flex flex-col h-screen items-start min-h-[90vh] max-h-[90vh] overflow-auto">
                {selectedProject && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DialogTitle>{selectedProject.project_name}</DialogTitle>
                                    <Badge
                                        className={cn(
                                            selectedProject.status === "Active"
                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : selectedProject.status === "Inactive"
                                                    ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                    : selectedProject.status === "Pending"
                                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                        : "bg-blue-100 text-blue-800 hover:bg-blue-100")}>
                                        {selectedProject.status}
                                    </Badge>
                                </div>
                            </div>
                            <DialogDescription>
                                {selectedProject.client} • {formatDate(selectedProject.period_start)} -{" "}
                                {formatDate(selectedProject.period_end)}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid grid-cols-3 mb-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="team">Team</TabsTrigger>
                                <TabsTrigger value="details">Tracking Analysis</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                <ProjectExpandedRow project={selectedProject} projectRoles={projectRoles}
                                                    users={users} availableRoles={availableRoles}
                                                    projectAllocations={projectAllocations}/>
                            </TabsContent>

                            <TabsContent value="team" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Allocated Team Members
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Filter team members..."
                                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                                            className="max-w-sm"
                                        />
                                        <Button
                                            onClick={() => setAddAllocationOpen(true)}
                                            disabled={availableUsers.length === 0 || availableUnassignedRoles.length === 0}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Team Member
                                        </Button>
                                    </div>
                                </div>

                                {projectAllocations.length > 0 ? (
                                    <>
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    {table.getHeaderGroups().map((headerGroup) => (
                                                        <TableRow key={headerGroup.id}>
                                                            {headerGroup.headers.map((header) => (
                                                                <TableHead key={header.id}>
                                                                    {header.isPlaceholder
                                                                        ? null
                                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                                </TableHead>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableHeader>
                                                <TableBody>
                                                    {table.getRowModel().rows?.length ? (
                                                        table.getRowModel().rows.map((row) => (
                                                            <TableRow key={row.id}>
                                                                {row.getVisibleCells().map((cell) => (
                                                                    <TableCell key={cell.id}>
                                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                                No team members found.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="flex justify-between">
                                            <div className="flex gap-3">
                                                <Label htmlFor={id}>Rows per page</Label>
                                                <Select
                                                    value={table.getState().pagination.pageSize.toString()}
                                                    onValueChange={(value) => table.setPageSize(Number(value))}
                                                >
                                                    <SelectTrigger id={id} className="w-fit">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[5, 10, 25, 50].map((pageSize) => (
                                                            <SelectItem key={pageSize} value={pageSize.toString()}>
                                                                {pageSize}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => table.firstPage()}
                                                    disabled={!table.getCanPreviousPage()}
                                                >
                                                    <ChevronFirst size={16} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => table.previousPage()}
                                                    disabled={!table.getCanPreviousPage()}
                                                >
                                                    <ChevronLeft size={16} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => table.nextPage()}
                                                    disabled={!table.getCanNextPage()}
                                                >
                                                    <ChevronRight size={16} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => table.lastPage()}
                                                    disabled={!table.getCanNextPage()}
                                                >
                                                    <ChevronLast size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-center items-center h-40 border rounded-md bg-muted/20">
                                        <p className="text-muted-foreground">No team members allocated to this project.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="details" className="space-y-4">
                                <div className="mb-4 flex items-center justify-end">
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={previousYear}
                                                className="px-3">
                                            <ChevronLeft className="h-4 w-4 mr-1"/>
                                        </Button>
                                        <Button variant="outline" size="sm" className="px-3 bg-muted">
                                            {year}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={nextYear} className="px-3">
                                            <ChevronRight className="h-4 w-4 ml-1"/>
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    {(() => {
                                        const {
                                            billedHours,
                                            approvedHours,
                                            unapprovedHours
                                        } = getTimeTrackingStatsForMonth(
                                            selectedProject.id,
                                            selectedMonth,
                                            year
                                        )

                                        return (
                                            <>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-sm text-blue-700">Total Billed
                                                            Hours</p>
                                                        <p className="text-2xl font-bold">{billedHours.toFixed(1)}h</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-sm text-green-700">Approved Hours</p>
                                                        <p className="text-2xl font-bold">{approvedHours.toFixed(1)}h</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-sm text-yellow-700">Unapproved
                                                            Hours</p>
                                                        <p className="text-2xl font-bold">{unapprovedHours.toFixed(1)}h</p>
                                                    </CardContent>
                                                </Card>
                                            </>
                                        )
                                    })()}
                                </div>

                                <div className="flex flex-col h-full space-y-12">
                                    <ChartContainer config={chartConfig} className="h-[15rem]">
                                    <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                            <XAxis
                                                dataKey="month"
                                                tick={{fontSize: 12}}
                                                tickMargin={8}
                                            />
                                            <YAxis
                                                domain={[0, safeMax]}
                                                tick={{fontSize: 12}}
                                                tickFormatter={(value) => `${value}MD`}
                                                tickMargin={8}
                                            />

                                            <ReferenceLine y={75} stroke="hsl(0, 84%, 60%)" strokeWidth={2}/>
                                            <ChartTooltip content={<ChartTooltipContent/>}/>
                                            <Line
                                                type="monotone"
                                                dataKey="calculated"
                                                stroke="var(--color-calculated)"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                                activeDot={{r: 6}}
                                            />
                                            <Line
                                                type="natural"
                                                dataKey="actual"
                                                stroke="var(--color-actual)"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{r: 6}}
                                            />
                                        </LineChart>
                                    </ChartContainer>

                                    <div className="flex justify-center">
                                        <div className="relative overflow-hidden" style={{maxWidth: "100%"}}>
                                            <div className="overflow-auto max-h-[500px]" style={{maxWidth: "100%"}}>
                                                <Table className="border-collapse">
                                                    <TableHeader className="sticky top-0 bg-background z-20">
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead
                                                                className="text-left font-medium sticky left-0 bg-muted/100 z-30 whitespace-nowrap">
                                                            </TableHead>
                                                            {months.map(({month, workingDays}) => (
                                                                <TableHead
                                                                    key={format(month, "yyyy-MM")}
                                                                    colSpan={5}
                                                                    className="text-center border-l whitespace-nowrap"
                                                                    style={{
                                                                        borderLeft: month.getMonth() > 0 ? "2px solid var(--border)" : "",
                                                                    }}
                                                                >
                                                                    <div>{format(month, "MMMM yyyy")}</div>
                                                                    <div
                                                                        className="text-xs text-muted-foreground">Days: {workingDays}</div>
                                                                </TableHead>
                                                            ))}
                                                        </TableRow>
                                                        <TableRow className="bg-muted/30">
                                                            <TableHead
                                                                className="sticky left-0 bg-muted/100 z-30 whitespace-nowrap w-[30rem]">
                                                                <div className="flex w-full">
                                                                    <div
                                                                        className="text-left text-xs font-medium w-[12rem]">Project
                                                                        Role
                                                                    </div>
                                                                    <div
                                                                        className="text-left text-xs font-medium w-[8rem]">Staffing
                                                                    </div>
                                                                    <div
                                                                        className="text-left text-xs font-medium w-[5rem]">Rate
                                                                        (h)
                                                                    </div>
                                                                    <div
                                                                        className="text-left text-xs font-medium w-[5rem]">Rate
                                                                        (d)
                                                                    </div>
                                                                </div>
                                                            </TableHead>
                                                            {months.map(({month}) => (
                                                                <React.Fragment key={format(month, "yyyy-MM")}>
                                                                    <TableHead
                                                                        className="text-center border-l text-xs font-medium whitespace-nowrap"
                                                                        style={{
                                                                            borderLeft: month.getMonth() > 0 ? "2px solid var(--border)" : "",
                                                                        }}
                                                                    >
                                                                        Calculation (Days)
                                                                    </TableHead>
                                                                    <TableHead
                                                                        className="text-center text-xs font-medium whitespace-nowrap">
                                                                        Calculation (Revenue)
                                                                    </TableHead>
                                                                    <TableHead
                                                                        className="text-center text-xs font-medium whitespace-nowrap">
                                                                        Actual
                                                                    </TableHead>
                                                                    <TableHead
                                                                        className="text-center text-xs font-medium whitespace-nowrap">
                                                                        Allocated
                                                                    </TableHead>
                                                                    <TableHead
                                                                        className="text-center text-xs font-medium whitespace-nowrap">
                                                                        Revenue
                                                                    </TableHead>
                                                                </React.Fragment>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {projectRoleAllocations.map((allocation, index) => (
                                                            <TableRow
                                                                key={`${allocation.projectId}-${allocation.projectRole}-${allocation.staffing}-${index}`}
                                                                className="hover:bg-muted/20"
                                                            >
                                                                <TableCell
                                                                    className="sticky left-0 bg-background z-10 p-2 whitespace-nowrap w-[30rem]">
                                                                    <div className="flex w-full">
                                                                        <div
                                                                            className="text-sm truncate w-[12rem]">{allocation.projectRole}</div>
                                                                        <div
                                                                            className="text-sm truncate w-[8rem]">{allocation.staffing}</div>
                                                                        <div
                                                                            className="text-sm truncate w-[5rem]">{formatCurrency(allocation.rateHourly)}</div>
                                                                        <div
                                                                            className="text-sm truncate w-[5rem]">{formatCurrency(allocation.rateDaily)}</div>
                                                                    </div>
                                                                </TableCell>
                                                                {months.map(({month}) => {
                                                                    const monthKey = format(month, "yyyy-MM")
                                                                    const monthData = allocation.monthlyData[monthKey] || {
                                                                        calculatedDays: 0,
                                                                        calculatedRevenue: 0,
                                                                        actualHours: 0,
                                                                        allocatedPercentage: 0,
                                                                        actualRevenue: 0,
                                                                    }

                                                                    return (
                                                                        <React.Fragment key={monthKey}>
                                                                            <TableCell
                                                                                className="text-center p-2 whitespace-nowrap"
                                                                                style={{
                                                                                    borderLeft: month.getMonth() > 0 ? "2px solid var(--border)" : "",
                                                                                }}
                                                                            >
                                                                                {monthData.calculatedDays.toFixed(1)}
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className="text-center p-2 whitespace-nowrap">
                                                                                {formatCurrency(monthData.calculatedRevenue)}
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className="text-center p-2 whitespace-nowrap">
                                                                                {monthData.actualHours > 0 ? `${monthData.actualHours.toFixed(1)}h` : "0.0h"}
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className="text-center p-2 whitespace-nowrap">
                                                                                {monthData.allocatedPercentage > 0 ? `${monthData.allocatedPercentage}%` : "0%"}
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className="text-center p-2 whitespace-nowrap">
                                                                                {formatCurrency(monthData.actualRevenue)}
                                                                            </TableCell>
                                                                        </React.Fragment>
                                                                    )
                                                                })}
                                                            </TableRow>
                                                        ))}

                                                        {/* Totals row - always at the bottom */}
                                                        <TableRow
                                                            className="bg-muted/100 font-medium sticky bottom-0 z-20">
                                                            <TableCell
                                                                className="sticky left-0 bg-muted/100 z-30 p-2 whitespace-nowrap">
                                                                TOTAL
                                                            </TableCell>
                                                            {months.map(({month}) => {
                                                                const monthKey = format(month, "yyyy-MM")
                                                                const totals = monthlyTotals[monthKey]

                                                                return (
                                                                    <React.Fragment key={monthKey}>
                                                                        <TableCell
                                                                            className="text-center p-2 whitespace-nowrap"
                                                                            style={{
                                                                                borderLeft: month.getMonth() > 0 ? "2px solid var(--border)" : "",
                                                                            }}
                                                                        >
                                                                            {totals.calculatedDays.toFixed(1)}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className="text-center p-2 whitespace-nowrap">
                                                                            {formatCurrency(totals.calculatedRevenue)}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className="text-center p-2 whitespace-nowrap">
                                                                            {totals.actualHours > 0 ? `${totals.actualHours.toFixed(1)}h` : "0.0h"}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className="text-center p-2 whitespace-nowrap">-</TableCell>
                                                                        <TableCell
                                                                            className="text-center p-2 whitespace-nowrap">
                                                                            {formatCurrency(totals.actualRevenue)}
                                                                        </TableCell>
                                                                    </React.Fragment>
                                                                )
                                                            })}
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}