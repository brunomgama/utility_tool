"use client"

import * as React from "react"
import {Calendar, CheckCircle2, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Search, User, Users,} from "lucide-react"
import {type ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {useSidebar} from "@/context/sidebar-context";
import {TbBuildingCommunity} from "react-icons/tb";
import {ProjectSchema} from "@/types/project";
import {supabase} from "@/lib/supabase";
import {UserSchema} from "@/types/user";
import {AllocationSchema} from "@/types/allocation";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useEffect, useId, useMemo, useState} from "react";
import {getUserInitialsById, getUserName} from "@/lib/user_name";

export default function AllocationsDashboard() {
    const id = useId();
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])
    const [allocations, setAllocations] = useState<AllocationSchema[]>([])
    const [selectedProject, setSelectedProject] = useState<ProjectSchema | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const { isCollapsed } = useSidebar()
    const getInitials = (name: string) => name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    const formatDate = (date: Date) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date)
    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount)
    const getProjectProgress = (project: ProjectSchema) => Math.round((project.completed_days / project.man_days) * 100)

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: usersData }, { data: projectsData }, { data: allocationsData }] =
                await Promise.all([
                    supabase.from("users").select("*"),
                    supabase.from("projects").select("*"),
                    supabase.from("allocations").select("*"),
                ])

            if (!usersData || !projectsData || !allocationsData) {
                console.error("Failed to fetch data from Supabase")
                return
            }

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
                end_date: new Date(a.end_date),
            }))

            setProjects(formattedProjects)
            setUsers(usersData)
            setAllocations(formattedAllocations)
        }

        fetchData()
    }, [])

    function getProjectAllocations(
        projectId: string,
        allocations: AllocationSchema[],
        users: UserSchema[]
    ) {
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

    const handleProjectSelect = (project: ProjectSchema) => {
        setSelectedProject(project)
        setModalOpen(true)
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
                            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(name)}</AvatarFallback>
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
            header: "Allocation Period",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-1 text-sm">
                        <span>{formatDate(row.original.start_date)}</span>
                        <span>-</span>
                        <span>{formatDate(row.original.end_date)}</span>
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

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbBuildingCommunity className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Project Allocations</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search projects..." value={searchTerm}
                                   onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-[250px]"/>
                        </div>

                        <Tabs defaultValue="all" className="w-[300px]">
                            <TabsList className="grid grid-cols-4">
                                <TabsTrigger value="all" onClick={() => setStatusFilter([])} className="text-xs">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="active" onClick={() => setStatusFilter(["Active"])} className="text-xs">
                                    Active
                                </TabsTrigger>
                                <TabsTrigger value="pending" onClick={() => setStatusFilter(["Pending"])} className="text-xs">
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger value="finished" onClick={() => setStatusFilter(["Finished"])} className="text-xs">
                                    Finished
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

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
                                    <div className="text-sm text-muted-foreground line-clamp-2">{project.description}</div>
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

                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="min-w-[95vw] w-screen max-w-[95vw] p-6">
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
                                        <TabsTrigger value="details">Details</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-2xl font-bold">{projectAllocations.length}</div>
                                                        <Users className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-2xl font-bold">{getProjectProgress(selectedProject)}%</div>
                                                            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <Progress value={getProjectProgress(selectedProject)} className="h-2" />
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Man Days</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-2xl font-bold">
                                                            {selectedProject.completed_days} / {selectedProject.man_days}
                                                        </div>
                                                        <Calendar className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Project Description</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm">{selectedProject.description}</p>
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Project Manager</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                                {getUserInitialsById(users, selectedProject.project_lead || "")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="font-medium">{getUserName(users, selectedProject.project_lead)}</div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Budget</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-xl font-bold">{formatCurrency(selectedProject.budget || 0)}</div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="team" className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Allocated Team Members
                                            </h4>
                                            <Input
                                                placeholder="Filter team members..."
                                                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                                                className="max-w-sm"
                                            />
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
                                                                    <TableCell colSpan={columns.length}
                                                                               className="h-24 text-center">
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
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {[5, 10, 25, 50].map((pageSize) => (
                                                                    <SelectItem key={pageSize}
                                                                                value={pageSize.toString()}>
                                                                        {pageSize}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button size="icon" variant="outline"
                                                                onClick={() => table.firstPage()}
                                                                disabled={!table.getCanPreviousPage()}>
                                                            <ChevronFirst size={16}/>
                                                        </Button>
                                                        <Button size="icon" variant="outline"
                                                                onClick={() => table.previousPage()}
                                                                disabled={!table.getCanPreviousPage()}>
                                                            <ChevronLeft size={16}/>
                                                        </Button>
                                                        <Button size="icon" variant="outline"
                                                                onClick={() => table.nextPage()}
                                                                disabled={!table.getCanNextPage()}>
                                                            <ChevronRight size={16}/>
                                                        </Button>
                                                        <Button size="icon" variant="outline"
                                                                onClick={() => table.lastPage()}
                                                                disabled={!table.getCanNextPage()}>
                                                            <ChevronLast size={16}/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                className="flex justify-center items-center h-40 border rounded-md bg-muted/20">
                                                <p className="text-muted-foreground">No team members allocated to this
                                                    project.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="details" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Project Information</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-sm text-muted-foreground">Project ID</div>
                                                        <div className="text-sm font-medium">{selectedProject.id}</div>

                                                        <div className="text-sm text-muted-foreground">Client</div>
                                                        <div
                                                            className="text-sm font-medium">{selectedProject.client}</div>

                                                        <div className="text-sm text-muted-foreground">Status</div>
                                                        <div
                                                            className="text-sm font-medium">{selectedProject.status}</div>

                                                        <div className="text-sm text-muted-foreground">Start Date</div>
                                                        <div
                                                            className="text-sm font-medium">{formatDate(selectedProject.period_start)}</div>

                                                        <div className="text-sm text-muted-foreground">End Date</div>
                                                        <div className="text-sm font-medium">{formatDate(selectedProject.period_end)}</div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Resources</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-sm text-muted-foreground">Man Days</div>
                                                        <div className="text-sm font-medium">{selectedProject.man_days}</div>

                                                        <div className="text-sm text-muted-foreground">Completed</div>
                                                        <div className="text-sm font-medium">{selectedProject.completed_days}</div>

                                                        <div className="text-sm text-muted-foreground">Progress</div>
                                                        <div className="text-sm font-medium">{getProjectProgress(selectedProject)}%</div>

                                                        <div className="text-sm text-muted-foreground">Budget</div>
                                                        <div className="text-sm font-medium">{formatCurrency(selectedProject.budget || 0)}</div>

                                                        <div className="text-sm text-muted-foreground">Team Size</div>
                                                        <div className="text-sm font-medium">{projectAllocations.length} members</div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Technologies</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedProject.technologies?.length && selectedProject.technologies.map((tech, index) => (
                                                        <Badge key={index} variant="outline" className="bg-muted/50">
                                                            {tech}
                                                        </Badge>
                                                    ))}

                                                    {!selectedProject.technologies?.length && (
                                                        <p className="text-sm text-muted-foreground">No technologies specified.</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

