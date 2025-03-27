"use client"
import { format, subDays } from "date-fns"
import { Activity, CheckCircle2, Clock, ClipboardList, DollarSign, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {useEffect, useState} from "react";
import {UserSchema} from "@/types/user";
import {supabase} from "@/lib/supabase";
import {ProjectSchema} from "@/types/project";
import {AllocationSchema} from "@/types/allocation";
import {TimeTrackingSchema} from "@/types/time_tracking";

const getInitials = (name: string) => {
    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(amount)
}

const formatDate = (date: Date) => {
    return format(date, "MMM d, yyyy")
}

export default function DashboardPage() {

    const [users, setUsers] = useState<UserSchema[]>([])
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [allocations, setAllocations] = useState<(AllocationSchema & { project?: ProjectSchema })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            const [{ data: usersData }, { data: projectsData }, { data: allocationsData }, { data: techData }, { data: timeEntriesData }] =
                await Promise.all([
                    supabase.from("users").select("*"),
                    supabase.from("projects").select("*"),
                    supabase.from("allocations").select("*"),
                    supabase.from("project_technologies").select("*"),
                    supabase.from("time_tracking").select("*"),
                ])

            if (!usersData || !projectsData || !allocationsData || !techData || !timeEntriesData) {
                setError("Failed to fetch data from Supabase")
                setLoading(false)
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
                technologies: techData.filter((t) => t.project_id === p.id).map((t) => t.technology),
            }))

            const formattedAllocations = allocationsData.map((a) => ({
                ...a,
                percentage: Number(a.percentage),
                start_date: new Date(a.start_date),
                end_date: new Date(a.end_date),
            }))

            const formattedTimeEntries = timeEntriesData.map((entry) => ({
                ...entry,
                date: new Date(entry.date),
            }))


            setTimeEntries(formattedTimeEntries)
            setProjects(formattedProjects)
            setUsers(usersData)
            setAllocations(formattedAllocations)
            setLoading(false)
        }

        fetchData()
    }, [])

    const activeProjects = projects.filter((p) => p.status === "Active").length
    const totalUsers = users.filter((u) => u.status === "Active").length
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalManDays = projects.reduce((sum, p) => sum + p.man_days, 0)
    const completedManDays = projects.reduce((sum, p) => sum + p.completed_days, 0)
    const completionPercentage = Math.round((completedManDays / totalManDays) * 100)

    const approvedHours = timeEntries.filter((e) => e.status === "Approved").reduce((sum, e) => sum + e.hours, 0)

    const pendingHours = timeEntries
        .filter((e) => e.status === "Submitted" || e.status === "Draft")
        .reduce((sum, e) => sum + e.hours, 0)

    const projectStatusCounts = {
        Active: projects.filter((p) => p.status === "Active").length,
        Pending: projects.filter((p) => p.status === "Pending").length,
        Finished: projects.filter((p) => p.status === "Finished").length,
        Inactive: projects.filter((p) => p.status === "Inactive").length,
    }

    const statusColors = {
        Active: "bg-green-500",
        Pending: "bg-yellow-500",
        Finished: "bg-blue-500",
        Inactive: "bg-gray-500",
    }

    const timeEntriesByProject = projects
        .map((project) => {
            const projectEntries = timeEntries.filter((e) => e.project_id === project.id)
            const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0)
            return {
                id: project.id,
                name: project.project_name,
                hours: Math.round(totalHours * 10) / 10,
            }
        })
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5)

    const maxProjectHours = Math.max(...timeEntriesByProject.map((p) => p.hours))

    const timeEntriesByDay = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), i)
        const dayEntries = timeEntries.filter(
            (e) =>
                e.date.getDate() === date.getDate() &&
                e.date.getMonth() === date.getMonth() &&
                e.date.getFullYear() === date.getFullYear(),
        )
        const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0)
        return {
            date,
            day: format(date, "EEE"),
            dayOfMonth: format(date, "d"),
            hours: Math.round(totalHours * 10) / 10,
        }
    }).reverse()

    const maxDailyHours = Math.max(...timeEntriesByDay.map((d) => d.hours))

    const userAllocationData = users
        .filter((user) => user.status === "Active")
        .map((user) => {
            const userAllocations = allocations.filter((a) => a.user_id === user.id)
            const totalAllocation = userAllocations.reduce((sum, a) => sum + a.percentage, 0)
            return {
                id: user.id,
                name: user.name,
                allocation: Math.min(totalAllocation, 1) * 100, // Cap at 100%
            }
        })
        .sort((a, b) => b.allocation - a.allocation)
        .slice(0, 7)

    const departmentCounts = users.reduce(
        (acc, user) => {
            const dept = user.department || "Unassigned"
            acc[dept] = (acc[dept] || 0) + 1
            return acc
        },
        {} as Record<string, number>,
    )

    const departmentColors = {
        Engineering: "bg-blue-500",
        "Project Management": "bg-green-500",
        Design: "bg-purple-500",
        Business: "bg-yellow-500",
        Operations: "bg-red-500",
        "Quality Assurance": "bg-indigo-500",
        Unassigned: "bg-gray-500",
    }

    const recentActivities = [
        ...timeEntries.map((entry) => ({
            type: "time-entry" as const,
            date: entry.date,
            data: entry,
        })),
        ...allocations.map((allocation) => ({
            type: "allocation" as const,
            date: allocation.start_date,
            data: allocation,
        })),
    ]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5)

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Dashboard</h2>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeProjects}</div>
                                <p className="text-xs text-muted-foreground">out of {projects.length} total projects</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">
                                    across {Object.keys(departmentCounts).length} departments
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                                <p className="text-xs text-muted-foreground">across all active projects</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Completion</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{completionPercentage}%</div>
                                <div className="mt-2">
                                    <Progress value={completionPercentage} className="h-2" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {completedManDays} of {totalManDays} man days
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Time Tracking Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Time Tracking Trend</CardTitle>
                                <CardDescription>Daily hours logged over the past 14 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-end space-x-2">
                                    {timeEntriesByDay.map((day, index) => (
                                        <div key={index} className="flex flex-col items-center flex-1">
                                            <div
                                                className="w-full bg-primary/20 rounded-t-sm relative"
                                                style={{
                                                    height: `${(day.hours / (maxDailyHours || 1)) * 220}px`,
                                                    minHeight: day.hours > 0 ? "4px" : "0px",
                                                }}
                                            >
                                                {day.hours > 0 && <div className="absolute inset-0 bg-primary opacity-60 rounded-t-sm" />}
                                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                                                    {day.hours > 0 ? `${day.hours}h` : ""}
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-center">
                                                <div className="font-medium">{day.day}</div>
                                                <div className="text-muted-foreground">{day.dayOfMonth}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Project Status</CardTitle>
                                <CardDescription>Distribution by status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-center">
                                    <div className="relative w-40 h-40">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            {Object.entries(projectStatusCounts).map(([status, count], index) => {
                                                const total = projects.length
                                                const percentage = (count / total) * 100
                                                const startAngle =
                                                    index === 0
                                                        ? 0
                                                        : Object.entries(projectStatusCounts)
                                                            .slice(0, index)
                                                            .reduce((sum, [_, c]) => sum + (c / total) * 360, 0)
                                                const endAngle = startAngle + (percentage / 100) * 360

                                                // Calculate SVG arc path
                                                const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
                                                const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
                                                const x2 = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180))
                                                const y2 = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180))

                                                const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

                                                return (
                                                    <path
                                                        key={status}
                                                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                                        className={statusColors[status as keyof typeof statusColors] || "bg-gray-500"}
                                                        fill="currentColor"
                                                    />
                                                )
                                            })}
                                            <circle cx="50" cy="50" r="25" fill="white" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-2">
                                    {Object.entries(projectStatusCounts).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div
                                                    className={`w-3 h-3 rounded-full mr-2 ${statusColors[status as keyof typeof statusColors] || "bg-gray-500"}`}
                                                />
                                                <span className="text-sm">{status}</span>
                                            </div>
                                            <div className="text-sm font-medium">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity and Hours Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest updates and entries</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivities.map((activity, index) => {
                                        if (activity.type === "time-entry") {
                                            const entry = activity.data
                                            const user = users.find((u) => u.id === entry.user_id)
                                            const project = projects.find((p) => p.id === entry.project_id)

                                            return (
                                                <div key={index} className="flex items-start gap-4">
                                                    <Avatar className="mt-1">
                                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                                            {getInitials(user?.name || "")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium">{user?.name} logged time</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {entry.hours} hours on {project?.project_name}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {entry.status}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Hours Summary</CardTitle>
                                <CardDescription>Time tracking status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-medium">Approved Hours</span>
                                        </div>
                                        <span className="font-bold">{approvedHours.toFixed(1)}</span>
                                    </div>
                                    <Progress value={(approvedHours / (approvedHours + pendingHours)) * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm font-medium">Pending Hours</span>
                                        </div>
                                        <span className="font-bold">{pendingHours.toFixed(1)}</span>
                                    </div>
                                    <Progress value={(pendingHours / (approvedHours + pendingHours)) * 100} className="h-2" />
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Top Projects by Hours</h4>
                                    <div className="space-y-2">
                                        {timeEntriesByProject.map((project, index) => (
                                            <div key={index} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm truncate max-w-[200px]">{project.name}</span>
                                                    <span className="text-sm font-medium">{project.hours}h</span>
                                                </div>
                                                <Progress value={(project.hours / maxProjectHours) * 100} className="h-1.5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Hours Distribution</CardTitle>
                                <CardDescription>Hours logged per project</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {timeEntriesByProject.map((project, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{project.name}</span>
                                                <span className="text-sm">{project.hours}h</span>
                                            </div>
                                            <div className="w-full h-8 bg-muted rounded-sm overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${(project.hours / maxProjectHours) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Project Completion</CardTitle>
                                <CardDescription>Progress by project</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {projects
                                        .filter((p) => p.status === "Active" || p.status === "Pending")
                                        .sort((a, b) => b.completed_days / b.man_days - a.completed_days / a.man_days)
                                        .slice(0, 5)
                                        .map((project, index) => {
                                            const progress = Math.round((project.completed_days / project.man_days) * 100)
                                            return (
                                                <div key={index} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">{project.project_name}</span>
                                                        <span className="text-sm">{progress}%</span>
                                                    </div>
                                                    <Progress value={progress} className="h-2" />
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>{project.client}</span>
                                                        <span>
                                                          {project.completed_days} / {project.man_days} days
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Project Timeline</CardTitle>
                            <CardDescription>Active projects schedule</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {projects
                                    .filter((p) => p.status === "Active")
                                    .sort((a, b) => a.period_start.getTime() - b.period_start.getTime())
                                    .map((project, index) => {
                                        const totalDays = (project.period_end.getTime() - project.period_start.getTime()) / (1000 * 60 * 60 * 24)
                                        const elapsedDays = (new Date().getTime() - project.period_start.getTime()) / (1000 * 60 * 60 * 24)
                                        const timeProgress = Math.min(Math.max(Math.round((elapsedDays / totalDays) * 100), 0), 100)

                                        return (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-medium">{project.project_name}</h4>
                                                        <p className="text-xs text-muted-foreground">{project.client}</p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            timeProgress > 75
                                                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                                                : timeProgress > 50
                                                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                                    : "bg-green-100 text-green-800 hover:bg-green-100",
                                                        )}
                                                    >
                                                        {timeProgress}% time elapsed
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span>{formatDate(project.period_start)}</span>
                                                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full",
                                                                timeProgress > 75 ? "bg-red-500" : timeProgress > 50 ? "bg-yellow-500" : "bg-green-500",
                                                            )}
                                                            style={{ width: `${timeProgress}%` }}
                                                        />
                                                    </div>
                                                    <span>{formatDate(project.period_end)}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Allocation</CardTitle>
                                <CardDescription>Current allocation percentage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {userAllocationData.map((user, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{user.name}</span>
                                                <span className="text-sm">{user.allocation.toFixed(0)}%</span>
                                            </div>
                                            {/*<Progress*/}
                                            {/*    value={user.allocation}*/}
                                            {/*    className="h-2"*/}
                                            {/*    indicatorClassName={cn(*/}
                                            {/*        user.allocation > 100*/}
                                            {/*            ? "bg-red-500"*/}
                                            {/*            : user.allocation > 80*/}
                                            {/*                ? "bg-yellow-500"*/}
                                            {/*                : "bg-green-500",*/}
                                            {/*    )}*/}
                                            {/*/>*/}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Department Distribution</CardTitle>
                                <CardDescription>Users by department</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative w-full aspect-square">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            {Object.entries(departmentCounts).map(([dept, count], index) => {
                                                const total = users.length
                                                const percentage = (count / total) * 100
                                                const startAngle =
                                                    index === 0
                                                        ? 0
                                                        : Object.entries(departmentCounts)
                                                            .slice(0, index)
                                                            .reduce((sum, [_, c]) => sum + (c / total) * 360, 0)
                                                const endAngle = startAngle + (percentage / 100) * 360

                                                // Calculate SVG arc path
                                                const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
                                                const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
                                                const x2 = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180))
                                                const y2 = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180))

                                                const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

                                                return (
                                                    <path
                                                        key={dept}
                                                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                                        className={departmentColors[dept as keyof typeof departmentColors] || "bg-gray-500"}
                                                        fill="currentColor"
                                                    />
                                                )
                                            })}
                                            <circle cx="50" cy="50" r="25" fill="white" />
                                        </svg>
                                    </div>

                                    <div className="space-y-2">
                                        {Object.entries(departmentCounts).map(([dept, count]) => (
                                            <div key={dept} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div
                                                        className={`w-3 h-3 rounded-full mr-2 ${departmentColors[dept as keyof typeof departmentColors] || "bg-gray-500"}`}
                                                    />
                                                    <span className="text-xs">{dept}</span>
                                                </div>
                                                <div className="text-xs font-medium">{count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Utilization</CardTitle>
                            <CardDescription>Active users and their current projects</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {users
                                    .filter((user) => user.status === "Active")
                                    .slice(0, 5)
                                    .map((user, index) => {
                                        const userAllocations = allocations.filter(
                                            (a) => a.user_id === user.id && new Date() >= a.start_date && new Date() <= a.end_date,
                                        )

                                        const totalAllocation = userAllocations.reduce((sum, a) => sum + a.percentage, 0)

                                        return (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="text-sm font-medium">{user.name}</h4>
                                                        <p className="text-xs text-muted-foreground">{user.role || "No role specified"}</p>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                totalAllocation > 1
                                                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                                                    : totalAllocation > 0.8
                                                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                                        : totalAllocation > 0
                                                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                            : "bg-gray-100 text-gray-800 hover:bg-gray-100",
                                                            )}
                                                        >
                                                            {Math.round(totalAllocation * 100)}% allocated
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="pl-10 space-y-2">
                                                    {userAllocations.length > 0 ? (
                                                        userAllocations.map((allocation, i) => {
                                                            const project = projects.find((p) => p.id === allocation.project_id)
                                                            return (
                                                                <div key={i} className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                                        <span>{project?.project_name}</span>
                                                                    </div>
                                                                    <span>{Math.round(allocation.percentage * 100)}%</span>
                                                                </div>
                                                            )
                                                        })
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">No current allocations</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

