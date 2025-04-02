"use client"

import * as React from "react"
import {addMonths, format, getMonth, getYear, subMonths} from "date-fns"
import { BarChart, Calendar, ChevronLeft, ChevronRight, Download, FileText, PieChart, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {useEffect, useMemo, useState} from "react";
import {UserSchema} from "@/types/user";
import {ProjectSchema} from "@/types/project";
import {supabase} from "@/lib/supabase";
import {TimeTrackingSchema} from "@/types/time_tracking";
import {useSidebar} from "@/context/sidebar-context";
import {getUserInitialsByName} from "@/lib/user_name";

export default function TimeAnalyticsPage() {
    const { isCollapsed } = useSidebar();

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedProject, setSelectedProject] = useState("")
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("")

    const [users, setUsers] = useState<UserSchema[]>([])
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const { data: usersData, error: usersError } = await supabase.from("users").select("*")
            const { data: projectsData, error: projectsError } = await supabase.from("projects").select("*")
            const { data: timeEntriesData, error: timeEntriesError } = await supabase.from("time_tracking").select("*")

            if (usersError || projectsError || timeEntriesError) {
                console.error("Error loading data", usersError, projectsError, timeEntriesError)
            } else {
                setUsers(usersData)
                setProjects(projectsData)
                setTimeEntries(timeEntriesData)
            }
        }

        fetchData()
    }, [])

    const getUserById = (id: string) => users.find((u) => u.id === id)
    const getProjectById = (id: string) => projects.find((p) => p.id === id)

    const getFilteredEntries = () => {
        return timeEntries.filter((entry) => {
            const entryMonth = getMonth(new Date(entry.date))
            const entryYear = getYear(new Date(entry.date))
            const currentMonth = getMonth(currentDate)
            const currentYear = getYear(currentDate)

            if (entryMonth !== currentMonth || entryYear !== currentYear) return false
            if (selectedProject && selectedProject !== "all" && entry.project_id !== selectedProject) return false
            if (selectedUser && selectedUser !== "all" && entry.user_id !== selectedUser) return false

            if (selectedDepartment && selectedDepartment !== "all") {
                const user = getUserById(entry.user_id)
                if (!user || user.department !== selectedDepartment) return false
            }

            return true
        })
    }

    const filteredEntries = getFilteredEntries()

    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const billableHours = filteredEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0)
    const billablePercentage = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

    const approvedHours = filteredEntries.filter((e) => e.status === "Approved").reduce((sum, e) => sum + e.hours, 0)
    const approvedPercentage = totalHours > 0 ? (approvedHours / totalHours) * 100 : 0

    const departments = useMemo(() => {
        return Array.from(new Set(users.map((u) => u.department || "Unassigned")))
    }, [users])

    const hoursBy = (keyFn: (entry: TimeTrackingSchema) => string) => {
        const map: Record<string, number> = {}
        filteredEntries.forEach((entry) => {
            const key = keyFn(entry)
            map[key] = (map[key] || 0) + entry.hours
        })
        return Object.entries(map)
            .map(([key, hours]) => ({
                key,
                hours,
                percentage: (hours / totalHours) * 100,
            }))
            .sort((a, b) => b.hours - a.hours)
    }

    const hoursByProject = hoursBy((e) => e.project_id).map((h) => ({
        ...h,
        project: getProjectById(h.key),
    }))

    const hoursByUser = hoursBy((e) => e.user_id).map((h) => ({
        ...h,
        user: getUserById(h.key),
    }))

    const hoursByDepartment = hoursBy((e) => getUserById(e.user_id)?.department || "Unassigned").map((h) => ({
        ...h,
        department: h.key,
    }))

    const hoursByTag = (() => {
        const map: Record<string, number> = {}
        filteredEntries.forEach((entry) => {
            entry.tags?.forEach((tag) => {
                map[tag] = (map[tag] || 0) + entry.hours
            })
        })
        return Object.entries(map)
            .map(([tag, hours]) => ({ tag, hours, percentage: (hours / totalHours) * 100 }))
            .sort((a, b) => b.hours - a.hours)
    })()

    const goToPreviousMonth = () => {
        setCurrentDate((prevDate) => subMonths(prevDate, 1))
    }

    const goToCurrentMonth = () => {
        setCurrentDate(new Date())
    }

    const goToNextMonth = () => {
        setCurrentDate((prevDate) => addMonths(prevDate, 1))
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Time Analytics</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous Month
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                            <Calendar className="h-4 w-4 mr-1" />
                            Current Month
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToNextMonth}>
                            Next Month
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <CardDescription>Refine analytics data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Time Period</label>
                                <div className="text-sm font-bold">{format(currentDate, "MMMM yyyy")}</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Project</label>
                                <Select
                                    value={selectedProject || "all"}
                                    onValueChange={(value) => setSelectedProject(value === "all" ? "" : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Projects"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Projects</SelectItem>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.project_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>


                            <div className="space-y-2">
                                <label className="text-sm font-medium">User</label>
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Users"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Departments"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem key={department} value={department}>
                                                {department}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setSelectedProject("")
                                        setSelectedUser("")
                                        setSelectedDepartment("")
                                    }}
                                >
                                    Reset Filters
                                </Button>
                            </div>

                            <div className="pt-4 border-t">
                                <Button variant="outline" className="w-full" onClick={() => {
                                }}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Export Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-3 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
                                    <p className="text-xs text-muted-foreground mt-1">From {filteredEntries.length} time entries</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{billableHours.toFixed(1)}h</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${billablePercentage}%` }} />
                                        </div>
                                        <span className="text-xs font-medium">{billablePercentage.toFixed(0)}%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{approvedHours.toFixed(1)}h</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${approvedPercentage}%` }} />
                                        </div>
                                        <span className="text-xs font-medium">{approvedPercentage.toFixed(0)}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="projects">
                            <TabsList className="grid grid-cols-4 mb-4">
                                <TabsTrigger value="projects">By Project</TabsTrigger>
                                <TabsTrigger value="users">By User</TabsTrigger>
                                <TabsTrigger value="departments">By Department</TabsTrigger>
                                <TabsTrigger value="tags">By Tag</TabsTrigger>
                            </TabsList>

                            <TabsContent value="projects" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Hours by Project</CardTitle>
                                        <CardDescription>
                                            Distribution of hours across projects for {format(currentDate, "MMMM yyyy")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hoursByProject.length > 0 ? (
                                            <div className="space-y-6">
                                                {/* Chart visualization */}
                                                <div className="h-[200px] flex items-end space-x-2">
                                                    {hoursByProject.slice(0, 6).map((item, index) => {
                                                        const projectName = item.project?.project_name || "Unnamed Project"

                                                        return (
                                                            <div key={index} className="flex flex-col items-center flex-1">
                                                                <div
                                                                    className="w-full bg-primary/20 rounded-t-sm relative"
                                                                    style={{
                                                                        height: `${(item.hours / hoursByProject[0].hours) * 180}px`,
                                                                        minHeight: item.hours > 0 ? "4px" : "0px",
                                                                    }}
                                                                >
                                                                    <div className="absolute inset-0 bg-primary opacity-60 rounded-t-sm" />
                                                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                                                                        {item.hours.toFixed(1)}h
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-xs text-center truncate w-full px-1">
                                                                    {projectName.length > 15 ? `${projectName.slice(0, 15)}...` : projectName}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}

                                                </div>

                                                {/* Table view */}
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Project</TableHead>
                                                            <TableHead>Client</TableHead>
                                                            <TableHead className="text-right">Hours</TableHead>
                                                            <TableHead className="text-right">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {hoursByProject.map((item) => (
                                                            <TableRow key={item.project?.id ?? item.key}>
                                                                <TableCell className="font-medium">{item.project?.project_name}</TableCell>
                                                                <TableCell>{item.project?.client}</TableCell>
                                                                <TableCell className="text-right">{item.hours.toFixed(1)}h</TableCell>
                                                                <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium">No Data Available</h3>
                                                <p className="text-muted-foreground max-w-sm mt-2">
                                                    There are no time entries matching your current filters.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="users" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Hours by User</CardTitle>
                                        <CardDescription>
                                            Distribution of hours across users for {format(currentDate, "MMMM yyyy")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hoursByUser.length > 0 ? (
                                            <div className="space-y-6">
                                                {/* Table view */}
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>User</TableHead>
                                                            <TableHead>Department</TableHead>
                                                            <TableHead className="text-right">Hours</TableHead>
                                                            <TableHead className="text-right">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {hoursByUser.map((item) => (
                                                            <TableRow key={item.user?.id ?? item.key}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarFallback className="text-xs">
                                                                                {getUserInitialsByName(item.user?.name || "")}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="font-medium">{item.user?.name ?? "Unknown User"}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{item.user?.department ?? "Unassigned"}</TableCell>
                                                                <TableCell className="text-right">{item.hours.toFixed(1)}h</TableCell>
                                                                <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium">No Data Available</h3>
                                                <p className="text-muted-foreground max-w-sm mt-2">
                                                    There are no time entries matching your current filters.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="departments" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Hours by Department</CardTitle>
                                        <CardDescription>
                                            Distribution of hours across departments for {format(currentDate, "MMMM yyyy")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hoursByDepartment.length > 0 ? (
                                            <div className="space-y-6">
                                                {/* Pie chart visualization */}
                                                <div className="flex justify-center">
                                                    <div className="relative w-60 h-60">
                                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                                            {hoursByDepartment.map((item, index) => {
                                                                const colors = [
                                                                    "fill-blue-500",
                                                                    "fill-green-500",
                                                                    "fill-purple-500",
                                                                    "fill-yellow-500",
                                                                    "fill-red-500",
                                                                    "fill-indigo-500",
                                                                ]
                                                                const colorClass = colors[index % colors.length]

                                                                // Calculate start and end angles
                                                                const startAngle =
                                                                    hoursByDepartment.slice(0, index).reduce((sum, d) => sum + d.percentage, 0) * 3.6 - 90

                                                                const endAngle = startAngle + item.percentage * 3.6

                                                                // Convert to radians
                                                                const startRad = (startAngle * Math.PI) / 180
                                                                const endRad = (endAngle * Math.PI) / 180

                                                                // Calculate points
                                                                const x1 = 50 + 40 * Math.cos(startRad)
                                                                const y1 = 50 + 40 * Math.sin(startRad)
                                                                const x2 = 50 + 40 * Math.cos(endRad)
                                                                const y2 = 50 + 40 * Math.sin(endRad)

                                                                // Determine if the arc should be drawn as a large arc
                                                                const largeArcFlag = item.percentage > 50 ? 1 : 0

                                                                return (
                                                                    <path
                                                                        key={index}
                                                                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                                                        className={colorClass}
                                                                    />
                                                                )
                                                            })}
                                                            <circle cx="50" cy="50" r="25" fill="white" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Legend */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    {hoursByDepartment.map((item, index) => {
                                                        const colors = [
                                                            "bg-blue-500",
                                                            "bg-green-500",
                                                            "bg-purple-500",
                                                            "bg-yellow-500",
                                                            "bg-red-500",
                                                            "bg-indigo-500",
                                                        ]
                                                        const colorClass = colors[index % colors.length]

                                                        return (
                                                            <div key={index} className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                                                                <div className="flex-1 flex justify-between items-center">
                                                                    <span className="text-sm">{item.department}</span>
                                                                    <span className="text-sm font-medium">{item.hours.toFixed(1)}h</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium">No Data Available</h3>
                                                <p className="text-muted-foreground max-w-sm mt-2">
                                                    There are no time entries matching your current filters.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="tags" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Hours by Tag</CardTitle>
                                        <CardDescription>
                                            Distribution of hours across tags for {format(currentDate, "MMMM yyyy")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hoursByTag.length > 0 ? (
                                            <div className="space-y-6">
                                                {/* Bar chart visualization */}
                                                <div className="space-y-3">
                                                    {hoursByTag.slice(0, 8).map((item, index) => (
                                                        <div key={index} className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <Badge variant="outline">{item.tag}</Badge>
                                                                <span className="text-sm font-medium">{item.hours.toFixed(1)}h</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium">No Data Available</h3>
                                                <p className="text-muted-foreground max-w-sm mt-2">
                                                    There are no time entries with tags matching your current filters.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}

