"use client"

import {Calendar, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Search, User, Users, Plus, Trash2, Edit, FileText, Link2, Clipboard, DollarSign} from "lucide-react"
import {type ColumnDef,flexRender,getCoreRowModel,getFilteredRowModel,getPaginationRowModel,getSortedRowModel,useReactTable,} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter,} from "@/components/ui/dialog"
import { useSidebar } from "@/context/sidebar-context"
import { TbBuildingCommunity } from "react-icons/tb"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useId, useMemo, useState } from "react"
import { getUserInitialsByName, getUserName} from "@/lib/user_name"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {eachMonthOfInterval, endOfMonth, format, getMonth, getYear, startOfMonth} from "date-fns"
import { supabase } from "@/lib/supabase"
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,} from "@/components/ui/alert-dialog"
import {UserSchema} from "@/types/user";
import {formatDate} from "@/lib/date_formater";
import {formatCurrency} from "@/lib/currency_formater";
import {ProjectSchema} from "@/types/project";
import {ProjectRoleSchema} from "@/types/project_role";
import {AllocationSchema} from "@/types/allocation";
import {TimeTrackingSchema} from "@/types/time_tracking";
import AddProjectModal from "@/components/custom/project/AddProjectModal";
import * as React from "react";
import {formatPercentage} from "@/lib/percentage_formater";

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

export default function ProjectDashboard() {
    const id = useId()
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])
    const [allocations, setAllocations] = useState<AllocationSchema[]>([])
    const [projectRoles, setProjectRoles] = useState<Record<string, ProjectRoleSchema[]>>({})
    const [selectedProject, setSelectedProject] = useState<ProjectSchema | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [addAllocationOpen, setAddAllocationOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [editAllocationOpen, setEditAllocationOpen] = useState(false)
    const [selectedAllocation, setSelectedAllocation] = useState<AllocationSchema | null>(null)
    const [loading, setLoading] = useState(false)
    const { isCollapsed } = useSidebar()
    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])

    const [openCreateModal, setOpenCreateModal] = useState(false)

    const [newAllocation, setNewAllocation] = useState({
        user_id: "",
        role_id: "",
        role_name: "",
        percentage: 100,
        start_date: new Date(),
        end_date: null as Date | null,
    })

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [
                    { data: usersData, error: usersError },
                    { data: projectsData, error: projectsError },
                    { data: allocationsData, error: allocationsError },
                    { data: timeEntriesData, error: timeEntriesError },
                ] = await Promise.all([
                    supabase.from("users").select("*"),
                    supabase.from("projects").select("*"),
                    supabase.from("allocations").select("*"),
                    supabase.from("time_tracking").select("*"),
                ])

                if (usersError) throw usersError
                if (projectsError) throw projectsError
                if (allocationsError) throw allocationsError
                if (timeEntriesError) throw timeEntriesError

                const userMap = Object.fromEntries(usersData.map((u) => [u.id, u]))

                const formattedProjects = projectsData.map((p) => ({
                    ...p,
                    completed_days: Number(p.completed_days),
                    budget: Number(p.budget),
                    man_days: Number(p.man_days),
                    target_margin: Number(p.target_margin),
                    revenue: Number(p.revenue),
                    period_start: new Date(p.period_start),
                    period_end: new Date(p.period_end),
                    projectManager: userMap[p.project_lead]?.name || "Unknown",
                    technologies: p.technologies ?? [],
                }))

                const formattedAllocations = allocationsData.map((a) => ({
                    ...a,
                    percentage: Number(a.percentage),
                    start_date: new Date(a.start_date),
                    end_date: a.end_date ? new Date(a.end_date) : null,
                }))

                const formattedTimeEntries = timeEntriesData
                    ? timeEntriesData.map((entry) => ({
                        ...entry,
                        date: new Date(entry.date),
                        hours: Number(entry.hours),
                    }))
                    : []

                setProjects(formattedProjects)
                setUsers(usersData)
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

    useEffect(() => {
        const fetchProjectRoles = async (projectId: string) => {
            if (!projectId || projectRoles[projectId]) return

            try {
                const { data, error } = await supabase.from("project_roles").select("*").eq("project_id", projectId)

                if (error) throw error

                setProjectRoles((prev) => ({
                    ...prev,
                    [projectId]: data.map((role) => ({
                        ...role,
                        man_days: Number(role.man_days),
                        hourly_rate: Number(role.hourly_rate),
                    })),
                }))
            } catch (error) {
                console.error("Error fetching project roles:", error)
            }
        }

        if (selectedProject) {
            fetchProjectRoles(selectedProject.id)
        }
    }, [selectedProject, projectRoles])

    function getProjectAllocations(projectId: string, allocations: AllocationSchema[], users: UserSchema[]) {
        const projectAllocations = allocations.filter((a) => a.project_id === projectId)
        return projectAllocations.map((allocation) => ({
            ...allocation,
            user: users.find((u) => u.id === allocation.user_id),
        }))
    }

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesSearch =
                project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.client.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status)
            return matchesSearch && matchesStatus
        })
    }, [projects, searchTerm, statusFilter])

    const projectAllocations = useMemo(() => {
        if (!selectedProject) return []
        return getProjectAllocations(selectedProject.id, allocations, users)
    }, [selectedProject, allocations, users])

    const availableRoles = useMemo(() => {
        if (!selectedProject) return []
        const roles = projectRoles[selectedProject.id] || []
        return roles
    }, [selectedProject, projectRoles])

    const availableUnassignedRoles = useMemo(() => {
        if (!selectedProject) return []

        const roles = projectRoles[selectedProject.id] || []

        const assignedRoles = new Set(projectAllocations.map((allocation) => allocation.role))

        return roles.filter((role) => !assignedRoles.has(role.role))
    }, [selectedProject, projectRoles, projectAllocations])

    const availableUsers = useMemo(() => {
        if (!selectedProject) return []

        const allocatedUserIds = new Set(projectAllocations.map((allocation) => allocation.user_id))

        return users.filter((user) => !allocatedUserIds.has(user.id) && user.status === "Active")
    }, [selectedProject, projectAllocations, users])

    const handleProjectSelect = async (project: ProjectSchema) => {
        setSelectedProject(project)
        setModalOpen(true)
    }

    const getProjectProgress = (project: ProjectSchema) => {
        const projectHours = timeEntries
            .filter((entry) => entry.project_id === project.id &&
                (entry.status === "Approved")).reduce((sum, entry) => sum + entry.hours, 0)


        console.log(timeEntries)

        const totalHours = project.man_days * 8
        return totalHours > 0 ? Math.round((projectHours / totalHours) * 100) : 0
    }

    // const getTrackedManDays = (project: ProjectSchema) => {
    //     const hours = timeEntries
    //         .filter((entry) => entry.project_id === project.id && entry.status === "Approved")
    //         .reduce((sum, entry) => sum + entry.hours, 0)
    //
    //     return hours / 8
    // }

    const handleAddAllocation = async () => {
        if (!selectedProject || !newAllocation.user_id || !newAllocation.role_name || !newAllocation.start_date) {
            return
        }

        try {
            setLoading(true)

            const { data, error } = await supabase
                .from("allocations")
                .insert({
                    project_id: selectedProject.id,
                    user_id: newAllocation.user_id,
                    role: newAllocation.role_id,
                    percentage: newAllocation.percentage / 100,
                    start_date: format(newAllocation.start_date, "yyyy-MM-dd"),
                    end_date: newAllocation.end_date ? format(newAllocation.end_date, "yyyy-MM-dd") : null,
                })
                .select()

            if (error) throw error

            const newAllocationData = {
                ...data[0],
                percentage: Number(data[0].percentage),
                start_date: new Date(data[0].start_date),
                end_date: data[0].end_date ? new Date(data[0].end_date) : null,
                user: users.find((u) => u.id === data[0].user_id),
            }

            setAllocations([...allocations, newAllocationData])

            setNewAllocation({
                user_id: "",
                role_id: "",
                role_name: "",
                percentage: 100,
                start_date: new Date(),
                end_date: new Date(),
            })

            setAddAllocationOpen(false)
        } catch (error) {
            console.error("Error adding allocation:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAllocation = async () => {
        if (!selectedAllocation) return

        try {
            setLoading(true)
            const { error } = await supabase.from("allocations").delete().eq("id", selectedAllocation.id)

            if (error) throw error

            setAllocations(allocations.filter((a) => a.id !== selectedAllocation.id))

            setDeleteConfirmOpen(false)
            setSelectedAllocation(null)
        } catch (error) {
            console.error("Error removing allocation:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditAllocation = async () => {
        if (!selectedAllocation) return

        try {
            setLoading(true)

            const { error } = await supabase
                .from("allocations")
                .update({
                    role: selectedAllocation.role,
                    percentage: selectedAllocation.percentage / 100,
                    start_date: format(selectedAllocation.start_date, "yyyy-MM-dd"),
                    end_date: selectedAllocation.end_date ? format(selectedAllocation.end_date, "yyyy-MM-dd") : null,
                })
                .eq("id", selectedAllocation.id)

            if (error) throw error

            setAllocations(allocations.map((a) => (a.id === selectedAllocation.id ? selectedAllocation : a)))

            setEditAllocationOpen(false)
            setSelectedAllocation(null)
        } catch (error) {
            console.error("Error updating allocation:", error)
        } finally {
            setLoading(false)
        }
    }

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
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAllocation({ ...row.original })
                                setEditAllocationOpen(true)
                            }}
                        >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
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

    const renderExpandedRow = (project: ProjectSchema) => {
        const roles = projectRoles[project.id] || []

        const completedPercentage = project.man_days > 0 ? (project.completed_days / project.man_days) * 100 : 0

        const budgetUtilization = project.budget > 0 ? ((project.revenue - project.budget) / project.budget) * 100 : 0

        return (
            <div className="p-4 bg-muted/50 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Users className="h-5 w-5 text-blue-700"/>
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
                                <DollarSign className="h-5 w-5 text-green-700"/>
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
                                <Clipboard className="h-5 w-5 text-purple-700"/>
                            </div>
                            <div>
                                <p className="text-sm text-purple-700">Man Days</p>
                                <p className="text-xl font-bold">{project.man_days} days</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground"/>
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
                                        <Link2 className="h-4 w-4 text-muted-foreground"/>
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
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                Project Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Project Lead:</span>
                                    <span
                                        className="text-sm font-medium">{getUserName(users, project.project_lead)}</span>

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
                                            style={{width: `${Math.min(completedPercentage, 100)}%`}}
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
                                <Clipboard className="h-4 w-4 text-muted-foreground"/>
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
                                    <span
                                        className={cn("text-sm", budgetUtilization > 0 ? "text-green-600" : "text-red-600")}>
                                        {budgetUtilization > 0 ? "+" : ""} {budgetUtilization.toFixed(1)}%
                                    </span>

                                    <span className="text-sm text-muted-foreground">Man Days:</span>
                                    <span className="text-sm">{project.man_days}</span>

                                    <span className="text-sm text-muted-foreground">Target Margin:</span>
                                    <span className="text-sm">{formatPercentage(project.target_margin)}</span>

                                    <span className="text-sm text-muted-foreground">Value per Day:</span>
                                    <span
                                        className="text-sm">{formatCurrency(project.revenue / project.man_days)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Project Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {availableRoles.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Role</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Man Days</TableHead>
                                                <TableHead>Hourly Rate</TableHead>
                                                <TableHead>Total Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {availableRoles.map((role) => {
                                                const allocation = projectAllocations.find((a) => a.role === role.id)
                                                const assignedUser = allocation?.user

                                                return (
                                                    <TableRow key={role.id}>
                                                        <TableCell className="font-medium">{role.role}</TableCell>
                                                        <TableCell>
                                                            {assignedUser ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarFallback className="text-xs">
                                                                            {getUserInitialsByName(assignedUser.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{assignedUser.name}</span>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className="text-muted-foreground text-sm">Unassigned</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{role.man_days}</TableCell>
                                                        <TableCell>{formatCurrency(role.hourly_rate)}/hr</TableCell>
                                                        <TableCell>{formatCurrency(role.man_days * 8 * role.hourly_rate)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                    No roles defined for this project.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const [year, setYear] = useState<number>(2025)
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
            string,
            {
                calculatedDays: number
                calculatedRevenue: number
                actualHours: number
                actualRevenue: number
            }
        > = {}

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

    const previousYear = () => setYear(year - 1)
    const nextYear = () => setYear(year + 1)

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

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? "ml-[3rem]" : "ml-[15rem]"} p-6`}>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbBuildingCommunity className="h-5 w-5 text-muted-foreground"/>
                        <h2 className="text-xl font-semibold">Project Allocations</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[250px]"
                            />
                        </div>

                        <Tabs defaultValue="all" className="w-[300px]">
                            <TabsList className="grid grid-cols-4">
                                <TabsTrigger value="all" onClick={() => setStatusFilter([])} className="text-xs">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="active" onClick={() => setStatusFilter(["Active"])}
                                             className="text-xs">
                                    Active
                                </TabsTrigger>
                                <TabsTrigger value="pending" onClick={() => setStatusFilter(["Pending"])}
                                             className="text-xs">
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger value="finished" onClick={() => setStatusFilter(["Finished"])} className="text-xs">
                                    Finished
                                </TabsTrigger>

                            </TabsList>
                        </Tabs>

                        <Button onClick={() => setOpenCreateModal(true)}>Add Project</Button>
                    </div>
                </div>

                {loading && projects.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-sm text-muted-foreground">Loading projects...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map((project) => (
                            <Card
                                key={project.id}
                                className="cursor-pointer transition-all hover:border-primary"
                                onClick={() => handleProjectSelect(project)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{project.project_name}</CardTitle>
                                            <CardDescription>{project.client}</CardDescription>
                                        </div>
                                        <Badge
                                            className={cn(
                                                project.status === "Active"
                                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                    : project.status === "Inactive"
                                                        ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                        : project.status === "Pending"
                                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                            )}
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>Progress</span>
                                                <span>{getProjectProgress(project)}%</span>
                                            </div>
                                            <Progress value={getProjectProgress(project)} className="h-2" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDate(project.period_start)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{getProjectAllocations(project.id, allocations, users).length} users</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {filteredProjects.length === 0 && (
                            <div className="col-span-full flex justify-center items-center h-40 border rounded-md bg-muted/20">
                                <p className="text-muted-foreground">No projects found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {openCreateModal && (
                    <AddProjectModal
                        open={openCreateModal}
                        onClose={() => setOpenCreateModal(false)}
                        onProjectCreated={(newProjects) => setProjects(newProjects)}
                    />
                )}

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
                                                                : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                                )}
                                            >
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
                                        {renderExpandedRow(selectedProject)}
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
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={addAllocationOpen} onOpenChange={setAddAllocationOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>Allocate a team member
                                to {selectedProject?.project_name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="user">Team Member</Label>
                                <Select
                                    value={newAllocation.user_id}
                                    onValueChange={(value) => setNewAllocation({...newAllocation, user_id: value})}
                                >
                                    <SelectTrigger id="user" className={"w-full"}>
                                        <SelectValue placeholder="Select a team member"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name} ({user.department})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Project Role</Label>
                                <Select
                                    value={newAllocation.role_id}
                                    onValueChange={(value) => {
                                        const selectedRole = availableUnassignedRoles.find((r) => r.id === value)
                                        setNewAllocation({
                                            ...newAllocation,
                                            role_id: value,
                                            role_name: selectedRole?.role || "",
                                        })
                                    }}
                                >
                                    <SelectTrigger id="role" className="w-full">
                                        <SelectValue placeholder="Select a role"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUnassignedRoles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                    {availableUnassignedRoles.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            All roles have been assigned. No roles available.
                                        </p>
                                    )}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="percentage">Allocation Percentage</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="percentage"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={newAllocation.percentage}
                                        onChange={(e) =>
                                            setNewAllocation({
                                                ...newAllocation,
                                                percentage: Number.parseInt(e.target.value) || 100
                                            })
                                        }
                                    />
                                    <span>%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline"
                                                    className="w-full justify-start text-left font-normal">
                                                <Calendar className="mr-2 h-4 w-4"/>
                                                {newAllocation.start_date ? format(newAllocation.start_date, "PPP") :
                                                    <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarComponent
                                                mode="single"
                                                selected={newAllocation.start_date}
                                                onSelect={(date) => date && setNewAllocation({
                                                    ...newAllocation,
                                                    start_date: date
                                                })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddAllocationOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddAllocation} disabled={loading}>
                                {loading && (
                                    <div
                                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                )}
                                Add Team Member
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={editAllocationOpen} onOpenChange={setEditAllocationOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Allocation</DialogTitle>
                            <DialogDescription>Update team member allocation details</DialogDescription>
                        </DialogHeader>
                        {selectedAllocation && (
                            <div className="space-y-4 py-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getUserInitialsByName(getUserName(users, selectedAllocation?.user_id) || "")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div
                                            className="font-medium">{getUserName(users, selectedAllocation?.user_id)}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Project Role</Label>
                                    <Select
                                        value={selectedAllocation.role}
                                        onValueChange={(value) => setSelectedAllocation({
                                            ...selectedAllocation,
                                            role: value
                                        })}
                                    >
                                        <SelectTrigger id="edit-role">
                                            <SelectValue placeholder="Select a role"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map((role) => (
                                                <SelectItem key={role.id} value={role.role}>
                                                    {role.role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-percentage">Allocation Percentage</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="edit-percentage"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={selectedAllocation.percentage * 100}
                                            onChange={(e) =>
                                                setSelectedAllocation({
                                                    ...selectedAllocation,
                                                    percentage: Number.parseInt(e.target.value) || 100,
                                                })
                                            }
                                        />
                                        <span>%</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline"
                                                        className="w-full justify-start text-left font-normal">
                                                    <Calendar className="mr-2 h-4 w-4"/>
                                                    {format(selectedAllocation.start_date, "PPP")}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={selectedAllocation.start_date}
                                                    onSelect={(date) =>
                                                        date && setSelectedAllocation({
                                                            ...selectedAllocation,
                                                            start_date: date
                                                        })
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditAllocationOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditAllocation} disabled={loading}>
                                {loading && (
                                    <div
                                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to
                                remove {getUserName(users, selectedAllocation?.user_id || "")} from this project? This
                                action cannot
                                be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAllocation}
                                className="bg-red-400 text-destructive-foreground text-white hover:bg-red-600"
                            >
                                {loading && (
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

