"use client"

import * as React from "react"
import {
    ChevronDown,
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Clipboard,
    FileText,
    Link2,
    Users,
    Briefcase,
    DollarSign,
} from "lucide-react"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSidebar } from "@/context/sidebar-context"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useId, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ProjectSchema } from "@/types/project"
import { TbAddressBook } from "react-icons/tb"
import { formatCurrency } from "@/lib/currency_formater"
import { formatPercentage } from "@/lib/percentage_formater"
import AddProjectModal from "@/components/custom/project/AddProjectModal"
import type { UserSchema } from "@/types/user"
import { formatDate } from "@/lib/date_formater"
import { getUserName } from "@/lib/user_name"
import {ProjectRoleSchema} from "@/types/project_role";

export default function ProjectsDashboard() {
    const id = useId()
    const { isCollapsed } = useSidebar()
    const [openCreateModal, setOpenCreateModal] = useState(false)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])
    const [projectRoles, setProjectRoles] = useState<Record<string, ProjectRoleSchema[]>>({})
    const [loading, setLoading] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase.from("projects").select("*")

            if (error) {
                console.error("Error fetching projects:", error)
            } else {
                const parsedData: ProjectSchema[] = data.map((project: ProjectSchema) => ({
                    ...project,
                    target_margin:
                        typeof project.target_margin === "string"
                            ? Number.parseFloat(project.target_margin)
                            : project.target_margin,
                    revenue: typeof project.revenue === "string" ? Number.parseFloat(project.revenue) : project.revenue,
                    man_days: typeof project.man_days === "string" ? Number.parseFloat(project.man_days) : project.man_days,
                    period_start: new Date(project.period_start),
                    period_end: new Date(project.period_end),
                }))
                setProjects(parsedData)
            }
        }

        const fetchUsers = async () => {
            const { data, error } = await supabase.from("users").select("*")

            if (error) {
                console.error("Error fetching users:", error)
            } else {
                setUsers(data)
            }
        }

        fetchUsers()
        fetchProjects()
    }, [])

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from("users").select("*")

            if (error) {
                console.error("Error fetching users:", error)
            } else {
                setUsers(data)
            }
        }

        fetchUsers()
    }, [])

    const fetchProjectRoles = async (projectId: string) => {
        if (projectRoles[projectId] || loading[projectId]) return

        setLoading((prev) => ({ ...prev, [projectId]: true }))

        const { data, error } = await supabase.from("project_roles").select("*").eq("project_id", projectId)

        if (error) {
            console.error("Error fetching project roles:", error)
        } else {
            setProjectRoles((prev) => ({
                ...prev,
                [projectId]: data,
            }))
        }

        setLoading((prev) => ({ ...prev, [projectId]: false }))
    }

    const columns: ColumnDef<ProjectSchema>[] = [
        {
            id: "expander",
            header: () => null,
            cell: ({ row }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            const newExpanded = { ...expanded }
                            newExpanded[row.id] = !expanded[row.id]
                            setExpanded(newExpanded)

                            if (!expanded[row.id]) {
                                fetchProjectRoles(row.original.id)
                            }
                        }}
                        className="p-0 h-8 w-8"
                    >
                        {expanded[row.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                )
            },
        },
        {
            accessorKey: "id",
            header: "Project ID",
            cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "client",
            header: "Client",
        },
        {
            accessorKey: "project_name",
            header: "Project Name",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        className={cn(
                            status === "Active"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : status === "Inactive"
                                    ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                    : status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                        )}
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "revenue",
            header: "Revenue",
            cell: ({ row }) => {
                return <div>{formatCurrency(row.getValue("revenue"))}</div>
            },
        },
    ]

    const table = useReactTable({
        data: projects,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    const renderExpandedRow = (project: ProjectSchema) => {
        const roles = projectRoles[project.id] || []
        const isLoading = loading[project.id]

        const totalRoleManDays = roles.reduce((sum, role) => sum + (role.man_days || 0), 0)
        const avgHourlyRate = roles.length
            ? roles.reduce((sum, role) => sum + (role.hourly_rate || 0), 0) / roles.length
            : 0

        const completedPercentage = project.man_days > 0 ? (project.completed_days / project.man_days) * 100 : 0

        const budgetUtilization = project.budget > 0 ? ((project.revenue - project.budget) / project.budget) * 100 : 0

        return (
            <div className="p-4 bg-muted/50 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Project Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Project Name:</span>
                                    <span className="text-sm font-medium">{project.project_name}</span>

                                    <span className="text-sm text-muted-foreground">Angebotsnummer:</span>
                                    <span className="text-sm">{project.angebotsnummer}</span>

                                    <span className="text-sm text-muted-foreground">Frame Contract:</span>
                                    <span className="text-sm">{project.frame_contract || "—"}</span>

                                    <span className="text-sm text-muted-foreground">Purchase Order:</span>
                                    <span className="text-sm">{project.purchase_order}</span>
                                </div>

                                {project.technologies && project.technologies.length > 0 && (
                                    <div className="mt-2 pt-2 border-t">
                                        <span className="text-sm text-muted-foreground block mb-1">Technologies:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {project.technologies.map((tech, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2 pt-2 border-t">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Link2 className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={project.link_to_project_folder}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate"
                                        >
                                            Project Folder
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Project Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Project Lead:</span>
                                    <span className="text-sm font-medium">{getUserName(users, project.project_lead)}</span>

                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <span className="text-sm">
                                        <Badge className={cn("mt-1",
                                            project.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : project.status === "Inactive" ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                    : project.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                        : "bg-blue-100 text-blue-800 hover:bg-blue-100")}>
                                                  {project.status}
                                        </Badge>
                                    </span>
                                </div>

                                <div className="mt-2 pt-2 border-t">
                                    <div className="grid grid-cols-2 gap-1">
                                        <span className="text-sm text-muted-foreground">Period Start:</span>
                                        <span className="text-sm">{formatDate(project.period_start)}</span>

                                        <span className="text-sm text-muted-foreground">Period End:</span>
                                        <span className="text-sm">{formatDate(project.period_end)}</span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t">
                                    <span className="text-sm text-muted-foreground">Progress:</span>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${Math.min(completedPercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span>{project.completed_days} days completed</span>
                                        <span>{Math.round(completedPercentage)}%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Clipboard className="h-4 w-4 text-muted-foreground" />
                                Financial Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Revenue:</span>
                                    <span className="text-sm font-medium">{formatCurrency(project.revenue)}</span>

                                    <span className="text-sm text-muted-foreground">Budget:</span>
                                    <span className="text-sm">{formatCurrency(project.budget)}</span>

                                    <span className="text-sm text-muted-foreground">Budget Utilization:</span>
                                    <span className={cn("text-sm", budgetUtilization > 0 ? "text-green-600" : "text-red-600")}>
                                        {budgetUtilization > 0 ? "+" : ""} {budgetUtilization.toFixed(1)}%
                                    </span>

                                    <span className="text-sm text-muted-foreground">Man Days:</span>
                                    <span className="text-sm">{project.man_days}</span>

                                    <span className="text-sm text-muted-foreground">Target Margin:</span>
                                    <span className="text-sm">{formatPercentage(project.target_margin)}</span>

                                    <span className="text-sm text-muted-foreground">Value per Day:</span>
                                    <span className="text-sm">{formatCurrency(project.revenue / project.man_days)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            Project Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            </div>
                        ) : roles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Man Days</TableHead>
                                            <TableHead>Hourly Rate</TableHead>
                                            <TableHead>Total Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">{role.role}</TableCell>
                                                <TableCell>{role.man_days}</TableCell>
                                                <TableCell>{formatCurrency(role.hourly_rate)}/hr</TableCell>
                                                <TableCell>{formatCurrency(role.man_days * 8 * role.hourly_rate)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50">
                                            <TableCell className="font-medium">Total</TableCell>
                                            <TableCell className="font-medium">{totalRoleManDays}</TableCell>
                                            <TableCell className="font-medium">Avg: {formatCurrency(avgHourlyRate)}/hr</TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(roles.reduce((sum, role) => sum + role.man_days * 8 * role.hourly_rate, 0))}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">No roles defined for this project.</div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Users className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-700">Total Roles</p>
                                <p className="text-xl font-bold">{roles.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <DollarSign className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-green-700">Revenue</p>
                                <p className="text-xl font-bold">{formatCurrency(project.revenue)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                                <Clipboard className="h-5 w-5 text-purple-700" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-700">Man Days</p>
                                <p className="text-xl font-bold">{project.man_days} days</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <>
            {openCreateModal && (
                <AddProjectModal
                    open={openCreateModal}
                    onClose={() => setOpenCreateModal(false)}
                    onProjectCreated={(newProjects) => setProjects(newProjects)}
                />
            )}

            <div className={`transition-all duration-300 ${isCollapsed ? "ml-[3rem]" : "ml-[15rem]"} p-6`}>
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TbAddressBook className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-xl font-semibold">Projects</h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Filter by client..."
                                value={(table.getColumn("client")?.getFilterValue() as string) ?? ""}
                                onChange={(event) => table.getColumn("client")?.setFilterValue(event.target.value)}
                                className="max-w-sm"
                            />
                            <Input
                                placeholder="Filter by project name..."
                                value={(table.getColumn("project_name")?.getFilterValue() as string) ?? ""}
                                onChange={(event) => table.getColumn("project_name")?.setFilterValue(event.target.value)}
                                className="max-w-sm"
                            />
                            <Button onClick={() => setOpenCreateModal(true)}>Add Project</Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <React.Fragment key={row.id}>
                                            <TableRow
                                                data-state={row.getIsSelected() && "selected"}
                                                className={cn(
                                                    "cursor-pointer transition-colors hover:bg-muted/50",
                                                    expanded[row.id] && "bg-muted/50",
                                                )}
                                                onClick={() => {
                                                    const newExpanded = { ...expanded }
                                                    newExpanded[row.id] = !expanded[row.id]
                                                    setExpanded(newExpanded)

                                                    if (!expanded[row.id]) {
                                                        fetchProjectRoles(row.original.id)
                                                    }
                                                }}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            {expanded[row.id] && (
                                                <TableRow className="bg-transparent">
                                                    <TableCell colSpan={columns.length} className="p-0">
                                                        <div className="overflow-hidden transition-all duration-300 ease-in-out">
                                                            {renderExpandedRow(row.original)}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
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
                            <Button size="icon" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                <ChevronRight size={16} />
                            </Button>
                            <Button size="icon" variant="outline" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
                                <ChevronLast size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

