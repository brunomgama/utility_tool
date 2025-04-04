"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { format, getMonth, getYear, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { ChevronLeft, ChevronRight, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency_formater"
import { useSidebar } from "@/context/sidebar-context"

// Type definitions
type UserSchema = {
    id: string
    name: string
    email: string
    location: string
    role: string
    department: string
    status: string
}

type ProjectSchema = {
    id: string
    project_name: string
    client: string
    status: string
    project_lead: string
    man_days: number
    completed_days: number
    budget: number
    period_start: Date
    period_end: Date
    revenue: number
    target_margin: number
}

type ProjectRoleSchema = {
    id: string
    project_id: string
    role: string
    man_days: number
    hourly_rate: number
}

type AllocationSchema = {
    id: string
    project_id: string
    user_id: string
    start_date: Date
    end_date: Date | null
    percentage: number
    role: string
}

type TimeTrackingSchema = {
    id: string
    project_id: string
    user_id: string
    date: Date
    hours: number
    description: string
    status: string
    tags?: string[]
    billable: boolean
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

export default function TimeSheetAnalysis() {
    const { isCollapsed } = useSidebar()

    const [year, setYear] = useState<number>(2025)
    const [selectedProjects, setSelectedProjects] = useState<string[]>([])
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true)
    const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)

    const [users, setUsers] = useState<UserSchema[]>([])
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [projectRoles, setProjectRoles] = useState<ProjectRoleSchema[]>([])
    const [allocations, setAllocations] = useState<AllocationSchema[]>([])
    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [
                    { data: usersData, error: usersError },
                    { data: projectsData, error: projectsError },
                    { data: projectRolesData, error: projectRolesError },
                    { data: allocationsData, error: allocationsError },
                    { data: timeEntriesData, error: timeEntriesError },
                ] = await Promise.all([
                    supabase.from("users").select("*"),
                    supabase.from("projects").select("*"),
                    supabase.from("project_roles").select("*"),
                    supabase.from("allocations").select("*"),
                    supabase.from("time_tracking").select("*"),
                ])

                if (usersError) throw usersError
                if (projectsError) throw projectsError
                if (projectRolesError) throw projectRolesError
                if (allocationsError) throw allocationsError
                if (timeEntriesError) throw timeEntriesError

                const formattedProjects = projectsData.map((project) => ({
                    ...project,
                    period_start: new Date(project.period_start),
                    period_end: new Date(project.period_end),
                    man_days: Number(project.man_days),
                    completed_days: Number(project.completed_days),
                    budget: Number(project.budget),
                    revenue: Number(project.revenue),
                    target_margin: Number(project.target_margin),
                }))

                const formattedProjectRoles = projectRolesData.map((role) => ({
                    ...role,
                    man_days: Number(role.man_days),
                    hourly_rate: Number(role.hourly_rate),
                }))

                const formattedAllocations = allocationsData.map((allocation) => ({
                    ...allocation,
                    start_date: new Date(allocation.start_date),
                    end_date: allocation.end_date ? new Date(allocation.end_date) : null,
                    percentage: Number(allocation.percentage),
                }))

                const formattedTimeEntries = timeEntriesData.map((entry) => ({
                    ...entry,
                    date: new Date(entry.date),
                    hours: Number(entry.hours),
                }))

                setUsers(usersData)
                setProjects(formattedProjects)
                setProjectRoles(formattedProjectRoles)
                setAllocations(formattedAllocations)
                setTimeEntries(formattedTimeEntries)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const months = useMemo(() => {
        const startDate = new Date(year, 0, 1) // January 1st of selected year
        const endDate = new Date(year, 11, 31) // December 31st of selected year

        return eachMonthOfInterval({ start: startDate, end: endDate }).map((month) => {
            const start = startOfMonth(month)
            const end = endOfMonth(month)

            // Calculate working days (excluding weekends)
            let workingDays = 0
            const currentDate = new Date(start)

            while (currentDate <= end) {
                const dayOfWeek = currentDate.getDay()
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    // Not Sunday and not Saturday
                    workingDays++
                }
                currentDate.setDate(currentDate.getDate() + 1)
            }

            return {
                month,
                daysInMonth: end.getDate(),
                workingDays,
            }
        })
    }, [year])

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            if (showOnlyActive && project.status !== "Active") {
                return false
            }

            if (selectedProjects.length > 0 && !selectedProjects.includes(project.id)) {
                return false
            }

            return true
        })
    }, [projects, selectedProjects, showOnlyActive])

    const projectRoleAllocations = useMemo(() => {
        const result: ProjectRoleAllocationData[] = []

        filteredProjects.forEach((project) => {
            const projectRolesForProject = projectRoles.filter((role) => role.project_id === project.id)

            projectRolesForProject.forEach((projectRole) => {
                // Find allocations for this project and role
                const allocationsForRole = allocations.filter(
                    (allocation) => allocation.project_id === project.id && allocation.role === projectRole.id,
                )

                allocationsForRole.forEach((allocation) => {
                    const user = users.find((u) => u.id === allocation.user_id)

                    if (!user) return

                    // Skip if filtered by department
                    if (selectedDepartments.length > 0 && !selectedDepartments.includes(user.department)) {
                        return
                    }

                    // Skip if filtered by user
                    if (selectedUsers.length > 0 && !selectedUsers.includes(user.id)) {
                        return
                    }

                    // Calculate monthly data
                    const monthlyData: ProjectRoleAllocationData["monthlyData"] = {}

                    months.forEach(({ month, workingDays }) => {
                        const monthKey = format(month, "yyyy-MM")
                        const monthStart = startOfMonth(month)
                        const monthEnd = endOfMonth(month)

                        // Check if allocation is active in this month
                        const isActiveInMonth =
                            allocation.start_date <= monthEnd && (!allocation.end_date || allocation.end_date >= monthStart)

                        if (!isActiveInMonth) {
                            monthlyData[monthKey] = {
                                calculatedDays: 0,
                                calculatedRevenue: 0,
                                actualHours: 0,
                                allocatedPercentage: 0,
                                actualRevenue: 0,
                            }
                            return
                        }

                        // Calculate allocated days based on percentage
                        const allocatedDays = workingDays * allocation.percentage

                        // Calculate revenue
                        const dailyRate = projectRole.hourly_rate * 8 // Assuming 8 hours per day
                        const calculatedRevenue = allocatedDays * dailyRate

                        // Get actual hours from time entries
                        const entriesInMonth = timeEntries.filter(
                            (entry) =>
                                entry.project_id === project.id &&
                                entry.user_id === user.id &&
                                getMonth(entry.date) === getMonth(month) &&
                                getYear(entry.date) === getYear(month),
                        )

                        const actualHours = entriesInMonth.reduce((sum, entry) => sum + entry.hours, 0)
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
                        projectId: project.id,
                        projectName: project.project_name,
                        client: project.client,
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
        })

        return result
    }, [filteredProjects, projectRoles, allocations, users, months, selectedDepartments, selectedUsers, timeEntries])

    const monthlyTotals = useMemo(() => {
        const totals: Record<
            string,
            {
                calculatedDays: number
                calculatedRevenue: number
                actualHours: number
                actualRevenue: number
            }
        > = {}

        months.forEach(({ month }) => {
            const monthKey = format(month, "yyyy-MM")
            totals[monthKey] = {
                calculatedDays: 0,
                calculatedRevenue: 0,
                actualHours: 0,
                actualRevenue: 0,
            }
        })

        projectRoleAllocations.forEach((allocation) => {
            Object.entries(allocation.monthlyData).forEach(([monthKey, data]) => {
                totals[monthKey].calculatedDays += data.calculatedDays
                totals[monthKey].calculatedRevenue += data.calculatedRevenue
                totals[monthKey].actualHours += data.actualHours
                totals[monthKey].actualRevenue += data.actualRevenue
            })
        })

        return totals
    }, [projectRoleAllocations, months])

    const departments = useMemo(() => {
        return Array.from(new Set(users.map((user) => user.department)))
    }, [users])

    // const chartData = useMemo(() => {
    //     if (Object.keys(monthlyTotals).length === 0) return []
    //
    //     return Object.keys(monthlyTotals)
    //         .sort()
    //         .map((monthKey) => {
    //             const [year, monthNum] = monthKey.split("-")
    //             const date = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1)
    //             const monthName = format(date, "MMM")
    //
    //             const { calculatedDays, actualHours } = monthlyTotals[monthKey]
    //             const actualDays = actualHours / 8
    //
    //             return {
    //                 month: monthName,
    //                 calculated: calculatedDays,
    //                 actual: actualDays,
    //             }
    //         })
    //         .filter((d) => d.calculated > 0 || d.actual > 0) // <--- filter months with no data
    // }, [monthlyTotals])

    // const chartConfig = {
    //     calculated: {
    //         label: "Calculated (Days)",
    //         color: "hsl(215, 14%, 34%)",
    //     },
    //     actual: {
    //         label: "Actual (Days)",
    //         color: "hsl(142, 76%, 36%)",
    //     },
    // } satisfies ChartConfig

    // const trendPercentage = useMemo(() => {
    //     if (chartData.length < 2) return 0
    //
    //     const lastMonth = chartData[chartData.length - 1]
    //     const previousMonth = chartData[chartData.length - 2]
    //
    //     if (!lastMonth || !previousMonth || previousMonth.actual === 0) return 0
    //
    //     const actualDiff = lastMonth.actual - previousMonth.actual
    //     const percentChange = (actualDiff / previousMonth.actual) * 100
    //
    //     return percentChange
    // }, [chartData])

    const previousYear = () => setYear(year - 1)
    const nextYear = () => setYear(year + 1)

    const handleExport = () => {
        // In a real implementation, this would generate a PDF
        console.log("Exporting data to PDF...")
        setExportDialogOpen(false)
    }

    const toggleProjectSelection = (projectId: string) => {
        setSelectedProjects((prev) =>
            prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
        )
    }

    const toggleDepartmentSelection = (department: string) => {
        setSelectedDepartments((prev) =>
            prev.includes(department) ? prev.filter((d) => d !== department) : [...prev, department],
        )
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
    }

    const resetFilters = () => {
        setSelectedProjects([])
        setSelectedDepartments([])
        setSelectedUsers([])
        setShowOnlyActive(true)
    }

    const generateEmptyRows = () => {
        // Determine how many empty rows to add (minimum 5)
        const minEmptyRows = 3
        const emptyRowsCount = Math.max(minEmptyRows, 3 - projectRoleAllocations.length)

        return Array.from({ length: emptyRowsCount }).map((_, index) => (
            <TableRow key={`empty-row-${index}`} className="h-10">
                <TableCell className="sticky left-0 bg-background z-10 p-2">
                    <div className="grid grid-cols-4 gap-2 opacity-0">
                        <div className="text-sm">Empty</div>
                        <div className="text-sm">Empty</div>
                        <div className="text-sm">€0.00</div>
                        <div className="text-sm">€0.00</div>
                    </div>
                </TableCell>
                {months.map(({ month }) => {
                    const monthKey = format(month, "yyyy-MM")
                    return (
                        <React.Fragment key={`${monthKey}-empty-${index}`}>
                            <TableCell className="text-center border-l p-2"></TableCell>
                            <TableCell className="text-center p-2"></TableCell>
                            <TableCell className="text-center p-2"></TableCell>
                            <TableCell className="text-center p-2"></TableCell>
                            <TableCell className="text-center p-2"></TableCell>
                        </React.Fragment>
                    )
                })}
            </TableRow>
        ))
    }

    // const values = chartData.map((d) => Math.max(d.calculated, d.actual))

    // const sorted = [...values].sort((a, b) => a - b)
    // const safeMax = sorted[Math.floor(sorted.length * 0.95)] || 10

    // const yAxisMax = safeMax * 1.2

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? "ml-[3rem]" : "ml-[15rem]"} p-6`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Time Sheet Analysis</h2>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={previousYear} className="px-3">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" className="px-3 bg-muted">
                        {year}
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextYear} className="px-3">
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button onClick={() => setExportDialogOpen(true)} className="ml-2">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1">
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Time Period</Label>
                            <div className="text-sm font-bold">{year}</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Projects</Label>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedProjects([])}>
                                    Clear
                                </Button>
                            </div>
                            <ScrollArea className="h-40 border rounded-md p-2">
                                <div className="space-y-2">
                                    {projects.map((project) => (
                                        <div key={project.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`project-${project.id}`}
                                                checked={selectedProjects.includes(project.id)}
                                                onCheckedChange={() => toggleProjectSelection(project.id)}
                                            />
                                            <Label htmlFor={`project-${project.id}`} className="text-sm cursor-pointer flex-1 truncate">
                                                {project.project_name}
                                            </Label>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    project.status === "Active"
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                }
                                            >
                                                {project.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Departments</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => setSelectedDepartments([])}
                                >
                                    Clear
                                </Button>
                            </div>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                <div className="space-y-2">
                                    {departments.map((department) => (
                                        <div key={department} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`department-${department}`}
                                                checked={selectedDepartments.includes(department)}
                                                onCheckedChange={() => toggleDepartmentSelection(department)}
                                            />
                                            <Label htmlFor={`department-${department}`} className="text-sm cursor-pointer">
                                                {department}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Team Members</Label>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedUsers([])}>
                                    Clear
                                </Button>
                            </div>
                            <ScrollArea className="h-40 border rounded-md p-2">
                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                            />
                                            <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer">
                                                {user.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="active-only"
                                checked={showOnlyActive}
                                onCheckedChange={(checked) => setShowOnlyActive(!!checked)}
                            />
                            <Label htmlFor="active-only">Show only active projects</Label>
                        </div>

                        <div className="pt-4 border-t">
                            <Button variant="outline" className="w-full" onClick={resetFilters}>
                                <Filter className="h-4 w-4 mr-2" />
                                Reset Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Time Sheet Analysis</CardTitle>
                        <p className="text-sm text-muted-foreground">Project allocations, rates, and revenue for {year}</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p className="text-sm text-muted-foreground">Loading data...</p>
                                </div>
                            </div>
                        ) : projectRoleAllocations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <h3 className="text-lg font-medium">No Data Available</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    There are no project allocations matching your current filters.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {/* Chart Section */}
                                {/*<Card className="mb-4 shadow-none border-none">*/}
                                {/*    <CardContent className="p-0">*/}
                                {/*        <div className="h-[25vh] w-full">*/}
                                {/*            <ChartContainer config={chartConfig}>*/}
                                {/*                <ResponsiveContainer width="100%" height="100%">*/}
                                {/*                    <LineChart*/}
                                {/*                        data={chartData}*/}
                                {/*                        margin={{top: 20, right: 30, left: 20, bottom: 10}}*/}
                                {/*                    >*/}
                                {/*                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>*/}
                                {/*                        <XAxis*/}
                                {/*                            dataKey="month"*/}
                                {/*                            tick={{fontSize: 10}}*/}
                                {/*                            tickMargin={4}*/}
                                {/*                        />*/}
                                {/*                        <YAxis*/}
                                {/*                            domain={[0, yAxisMax]}*/}
                                {/*                            tick={{fontSize: 10}}*/}
                                {/*                            tickFormatter={(value) => `${value}MD`}*/}
                                {/*                            tickMargin={4}*/}
                                {/*                        />*/}
                                {/*                        <ReferenceLine y={75} stroke="hsl(0, 84%, 60%)"*/}
                                {/*                                       strokeWidth={2}/>*/}
                                {/*                        <ChartTooltip content={<ChartTooltipContent/>}/>*/}
                                {/*                        <Line*/}
                                {/*                            type="monotone"*/}
                                {/*                            dataKey="calculated"*/}
                                {/*                            stroke="var(--color-calculated)"*/}
                                {/*                            strokeWidth={2}*/}
                                {/*                            strokeDasharray="5 5"*/}
                                {/*                            dot={false}*/}
                                {/*                            activeDot={{r: 6}}*/}
                                {/*                        />*/}
                                {/*                        <Line*/}
                                {/*                            type="natural"*/}
                                {/*                            dataKey="actual"*/}
                                {/*                            stroke="var(--color-actual)"*/}
                                {/*                            strokeWidth={2}*/}
                                {/*                            dot={false}*/}
                                {/*                            activeDot={{r: 6}}*/}
                                {/*                        />*/}
                                {/*                    </LineChart>*/}
                                {/*                </ResponsiveContainer>*/}
                                {/*            </ChartContainer>*/}
                                {/*        </div>*/}
                                {/*    </CardContent>*/}
                                {/*</Card>*/}

                                {/* Table Section */}
                                <div className="flex justify-center">
                                    <div className="relative overflow-hidden" style={{ maxWidth: "100%" }}>
                                        <div className="overflow-auto max-h-[500px]" style={{ maxWidth: "100%" }}>
                                            <Table className="border-collapse">
                                                <TableHeader className="sticky top-0 bg-background z-20">
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead className="text-left font-medium sticky left-0 bg-muted/100 z-30 whitespace-nowrap">
                                                        </TableHead>
                                                        {months.map(({ month, workingDays }) => (
                                                            <TableHead
                                                                key={format(month, "yyyy-MM")}
                                                                colSpan={5}
                                                                className="text-center border-l whitespace-nowrap"
                                                                style={{
                                                                    borderLeft: month.getMonth() > 0 ? "2px solid var(--border)" : "",
                                                                }}
                                                            >
                                                                <div>{format(month, "MMMM yyyy")}</div>
                                                                <div className="text-xs text-muted-foreground">Days: {workingDays}</div>
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                    <TableRow className="bg-muted/30">
                                                        <TableHead className="sticky left-0 bg-muted/100 z-30 whitespace-nowrap w-[30rem]">
                                                            <div className="flex w-full">
                                                                <div className="text-left text-xs font-medium w-[12rem]">Project Role</div>
                                                                <div className="text-left text-xs font-medium w-[8rem]">Staffing</div>
                                                                <div className="text-left text-xs font-medium w-[5rem]">Rate (h)</div>
                                                                <div className="text-left text-xs font-medium w-[5rem]">Rate (d)</div>
                                                            </div>
                                                        </TableHead>
                                                        {months.map(({ month }) => (
                                                            <React.Fragment key={format(month, "yyyy-MM")}>
                                                                <TableHead
                                                                    className="text-center border-l text-xs font-medium whitespace-nowrap"
                                                                    style={{
                                                                        borderLeft: month.getMonth() > 0 ? "2px solid var(--border)" : "",
                                                                    }}
                                                                >
                                                                    Calculation (Days)
                                                                </TableHead>
                                                                <TableHead className="text-center text-xs font-medium whitespace-nowrap">
                                                                    Calculation (Revenue)
                                                                </TableHead>
                                                                <TableHead className="text-center text-xs font-medium whitespace-nowrap">
                                                                    Actual
                                                                </TableHead>
                                                                <TableHead className="text-center text-xs font-medium whitespace-nowrap">
                                                                    Allocated
                                                                </TableHead>
                                                                <TableHead className="text-center text-xs font-medium whitespace-nowrap">
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
                                                            <TableCell className="sticky left-0 bg-background z-10 p-2 whitespace-nowrap w-[30rem]">
                                                                <div className="flex w-full">
                                                                    <div className="text-sm truncate w-[12rem]">{allocation.projectRole}</div>
                                                                    <div className="text-sm truncate w-[8rem]">{allocation.staffing}</div>
                                                                    <div className="text-sm truncate w-[5rem]">{formatCurrency(allocation.rateHourly)}</div>
                                                                    <div className="text-sm truncate w-[5rem]">{formatCurrency(allocation.rateDaily)}</div>
                                                                </div>
                                                            </TableCell>
                                                            {months.map(({ month }) => {
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
                                                                        <TableCell className="text-center p-2 whitespace-nowrap">
                                                                            {formatCurrency(monthData.calculatedRevenue)}
                                                                        </TableCell>
                                                                        <TableCell className="text-center p-2 whitespace-nowrap">
                                                                            {monthData.actualHours > 0 ? `${monthData.actualHours.toFixed(1)}h` : "0.0h"}
                                                                        </TableCell>
                                                                        <TableCell className="text-center p-2 whitespace-nowrap">
                                                                            {monthData.allocatedPercentage > 0 ? `${monthData.allocatedPercentage}%` : "0%"}
                                                                        </TableCell>
                                                                        <TableCell className="text-center p-2 whitespace-nowrap">
                                                                            {formatCurrency(monthData.actualRevenue)}
                                                                        </TableCell>
                                                                    </React.Fragment>
                                                                )
                                                            })}
                                                        </TableRow>
                                                    ))}

                                                    {/* Empty rows to fill the space */}
                                                    {generateEmptyRows()}

                                                    {/* Totals row - always at the bottom */}
                                                    <TableRow className="bg-muted/100 font-medium sticky bottom-0 z-20">
                                                        <TableCell className="sticky left-0 bg-muted/100 z-30 p-2 whitespace-nowrap">
                                                            TOTAL
                                                        </TableCell>
                                                        {months.map(({ month }) => {
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
                                                                    <TableCell className="text-center p-2 whitespace-nowrap">
                                                                        {formatCurrency(totals.calculatedRevenue)}
                                                                    </TableCell>
                                                                    <TableCell className="text-center p-2 whitespace-nowrap">
                                                                        {totals.actualHours > 0 ? `${totals.actualHours.toFixed(1)}h` : "0.0h"}
                                                                    </TableCell>
                                                                    <TableCell className="text-center p-2 whitespace-nowrap">-</TableCell>
                                                                    <TableCell className="text-center p-2 whitespace-nowrap">
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
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Time Sheet Analysis</DialogTitle>
                        <DialogDescription>Choose your export options below</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Export Format</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="include-pdf" defaultChecked />
                                <Label htmlFor="include-pdf">PDF Document</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="include-excel" />
                                <Label htmlFor="include-excel">Excel Spreadsheet</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Include Details</Label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="include-calculations" defaultChecked />
                                    <Label htmlFor="include-calculations">Calculated allocations</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="include-actual" defaultChecked />
                                    <Label htmlFor="include-actual">Actual hours</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="include-revenue" defaultChecked />
                                    <Label htmlFor="include-revenue">Revenue calculations</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

