"use client"

import * as React from "react"
import {addDays, addMonths, format, getDay, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths} from "date-fns"
import { CalendarIcon, Check, ChevronLeft, ChevronRight, Clock, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {useSidebar} from "@/context/sidebar-context";
import {TimeTrackingSchema} from "@/types/time_tracking";
import {useEffect, useMemo, useState} from "react";
import {supabase} from "@/lib/supabase";
import {UserSchema} from "@/types/user";
import {ProjectSchema} from "@/types/project";

const getInitials = (name: string) => {
    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
}

export default function TimeTrackingPage() {
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])
    const [weeklyHours, setWeeklyHours] = useState<{ [key: string]: number }>({})
    const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({})
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()))
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedDateEntries, setSelectedDateEntries] = useState<TimeTrackingSchema[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { isCollapsed } = useSidebar()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            const [{ data: usersData }, { data: projectsData }, { data: allocationsData }, { data: techData }] =
                await Promise.all([
                    supabase.from("users").select("*"),
                    supabase.from("projects").select("*"),
                    supabase.from("allocations").select("*"),
                    supabase.from("project_technologies").select("*"),
                ])

            if (!usersData || !projectsData || !allocationsData || !techData) {
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

            setProjects(formattedProjects)
            setUsers(usersData)
            setLoading(false)
        }

        fetchData()
    }, [])
    
    const weekDays = useMemo(() => {
        const days = []
        for (let i = 0; i < 7; i++) {
            days.push(addDays(currentWeekStart, i))
        }
        return days
    }, [currentWeekStart])

    const formatDateDisplay = (date: Date) => {
        return format(date, "EEE, MMM d")
    }

    const formatDateKey = (date: Date) => {
        return format(date, "yyyy-MM-dd")
    }

    const goToPreviousWeek = () => {
        setCurrentWeekStart(addDays(currentWeekStart, -7))
    }

    const goToNextWeek = () => {
        setCurrentWeekStart(addDays(currentWeekStart, 7))
    }

    const goToCurrentWeek = () => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    }

    const goToPreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1))
    }

    const handleHourChange = (date: Date, hours: string) => {
        const dateKey = formatDateKey(date)
        const parsedHours = Number.parseFloat(hours)

        if (isNaN(parsedHours) || parsedHours < 0) {
            setWeeklyHours({ ...weeklyHours, [dateKey]: 0 })
        } else if (parsedHours > 24) {
            setWeeklyHours({ ...weeklyHours, [dateKey]: 24 })
        } else {
            setWeeklyHours({ ...weeklyHours, [dateKey]: parsedHours })
        }
    }

    const handleDescriptionChange = (date: Date, description: string) => {
        const dateKey = formatDateKey(date)
        setDescriptions({ ...descriptions, [dateKey]: description })
    }

    const totalWeeklyHours = useMemo(() => {
        return Object.values(weeklyHours).reduce((sum, hours) => sum + hours, 0)
    }, [weeklyHours])

    const saveTimeEntries = () => {
        if (!selectedUser || !selectedProject) {
            // toast({
            //     title: "Error",
            //     description: "Please select both a user and a project.",
            //     variant: "destructive",
            // })
            return
        }

        const newEntries: TimeTrackingSchema[] = []

        for (const dateKey in weeklyHours) {
            if (weeklyHours[dateKey] > 0) {
                const date = new Date(dateKey)
                newEntries.push({
                    id: `TE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    user_id: selectedUser,
                    project_id: selectedProject,
                    date,
                    hours: weeklyHours[dateKey],
                    description: descriptions[dateKey] || "",
                    status: "Submitted",
                })
            }
        }

        if (newEntries.length === 0) {
            // toast({
            //     title: "Error",
            //     description: "Please enter hours for at least one day.",
            //     variant: "destructive",
            // })
            return
        }

        setTimeEntries([...timeEntries, ...newEntries])

        setWeeklyHours({})
        setDescriptions({})

        // toast({
        //     title: "Success",
        //     description: "Time entries saved successfully.",
        // })
    }

    const existingEntries = useMemo(() => {
        if (!selectedUser || !selectedProject) return []

        const weekEnd = addDays(currentWeekStart, 6)

        return timeEntries.filter(
            (entry) =>
                entry.user_id === selectedUser &&
                entry.project_id === selectedProject &&
                entry.date >= currentWeekStart &&
                entry.date <= weekEnd,
        )
    }, [selectedUser, selectedProject, currentWeekStart, timeEntries])

    useEffect(() => {
        const hours: { [key: string]: number } = {}
        const descs: { [key: string]: string } = {}

        existingEntries.forEach((entry) => {
            const dateKey = formatDateKey(entry.date)
            hours[dateKey] = entry.hours
            descs[dateKey] = entry.description
        })

        setWeeklyHours(hours)
        setDescriptions(descs)
    }, [existingEntries])

    const getUserName = (userId: string) => {
        const user = users.find((u) => u.id === userId)
        return user ? user.name : "Unknown User"
    }

    const getProjectName = (projectId: string) => {
        const project = projects.find((p) => p.id === projectId)
        return project ? project.project_name : "Unknown Project"
    }

    const calendarDays = useMemo(() => {
        const days = []
        const monthStart = startOfMonth(currentMonth)
        const firstDayOfMonth = getDay(monthStart)

        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })

        for (let i = 0; i < 42; i++) {
            const day = addDays(startDate, i)
            days.push(day)
        }

        return days
    }, [currentMonth])

    const entriesByDate = useMemo(() => {
        const grouped: { [key: string]: TimeTrackingSchema[] } = {}

        timeEntries.forEach((entry) => {
            const dateKey = formatDateKey(entry.date)
            if (!grouped[dateKey]) {
                grouped[dateKey] = []
            }
            grouped[dateKey].push(entry)
        })

        return grouped
    }, [timeEntries])

    const getTotalHoursForDate = (date: Date) => {
        const dateKey = formatDateKey(date)
        const entries = entriesByDate[dateKey] || []
        return entries.reduce((sum, entry) => sum + entry.hours, 0)
    }

    const handleDayClick = (date: Date) => {
        const dateKey = formatDateKey(date)
        const entries = entriesByDate[dateKey] || []

        setSelectedDate(date)
        setSelectedDateEntries(entries)
        setIsDialogOpen(true)
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Time Tracking</h2>
                    </div>
                </div>

                <Tabs defaultValue="entry" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="entry">Time Entry</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    {/* Time Entry Tab */}
                    <TabsContent value="entry" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Time Sheet</CardTitle>
                                <CardDescription>
                                    Enter your hours for the week of {format(currentWeekStart, "MMMM d, yyyy")} to{" "}
                                    {format(addDays(currentWeekStart, 6), "MMMM d, yyyy")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* User and Project Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user">User</Label>
                                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                                            <SelectTrigger id="user">
                                                <SelectValue placeholder="Select a user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="project">Project</Label>
                                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                                            <SelectTrigger id="project">
                                                <SelectValue placeholder="Select a project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects
                                                    .filter((p) => p.status === "Active")
                                                    .map((project) => (
                                                        <SelectItem key={project.id} value={project.id}>
                                                            {project.project_name} ({project.client})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Week Navigation */}
                                <div className="flex items-center justify-between">
                                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous Week
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        Current Week
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                                        Next Week
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>

                                {/* Weekly Calendar */}
                                <div className="border rounded-md overflow-hidden">
                                    <div className="grid grid-cols-1 divide-y">
                                        {weekDays.map((day, index) => {
                                            const dateKey = formatDateKey(day)
                                            const isWeekend = getDay(day) === 0 || getDay(day) === 6

                                            return (
                                                <div
                                                    key={dateKey}
                                                    className={cn("grid grid-cols-12 p-3 gap-4 items-center", isWeekend && "bg-muted/30")}
                                                >
                                                    <div className="col-span-3 md:col-span-2">
                                                        <div className="font-medium">{formatDateDisplay(day)}</div>
                                                        {isWeekend && <div className="text-xs text-muted-foreground">Weekend</div>}
                                                    </div>

                                                    <div className="col-span-3 md:col-span-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="24"
                                                            step="0.5"
                                                            placeholder="0.0"
                                                            value={weeklyHours[dateKey] || ""}
                                                            onChange={(e) => handleHourChange(day, e.target.value)}
                                                            className={cn("w-full", isWeekend && "bg-muted/50")}
                                                            disabled={isWeekend}
                                                        />
                                                    </div>

                                                    <div className="col-span-6 md:col-span-8">
                                                        <Input
                                                            type="text"
                                                            placeholder="Description of work done"
                                                            value={descriptions[dateKey] || ""}
                                                            onChange={(e) => handleDescriptionChange(day, e.target.value)}
                                                            className={cn("w-full", isWeekend && "bg-muted/50")}
                                                            disabled={isWeekend}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="flex justify-between items-center p-3 border rounded-md bg-muted/20">
                                    <div className="font-medium">Total Hours:</div>
                                    <div className="text-lg font-bold">{totalWeeklyHours.toFixed(1)}</div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={saveTimeEntries}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Time Entries
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* History Tab with Calendar View */}
                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Time Entry History</CardTitle>
                                <CardDescription>View your time entries in a calendar format</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between">
                                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous Month
                                    </Button>
                                    <h3 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
                                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                                        Next Month
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>

                                {/* Calendar */}
                                <div className="border rounded-md overflow-hidden">
                                    {/* Calendar Header */}
                                    <div className="grid grid-cols-7 bg-muted/50">
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                            <div key={day} className="p-2 text-center font-medium">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 auto-rows-fr">
                                        {calendarDays.slice(0, 35).map((day, index) => {
                                            const dateKey = formatDateKey(day)
                                            const isCurrentMonth = isSameMonth(day, currentMonth)
                                            const isToday = isSameDay(day, new Date())
                                            const entries = entriesByDate[dateKey] || []
                                            const hasEntries = entries.length > 0
                                            const totalHours = getTotalHoursForDate(day)

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "border p-1 min-h-[80px] relative",
                                                        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                                        isToday && "bg-blue-50",
                                                        hasEntries && isCurrentMonth && "cursor-pointer hover:bg-muted/20",
                                                    )}
                                                    onClick={() => {
                                                        if (hasEntries && isCurrentMonth) {
                                                            handleDayClick(day)
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                      <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                                                        {format(day, "d")}
                                                      </span>
                                                        {hasEntries && isCurrentMonth && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {totalHours.toFixed(1)}h
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {hasEntries && isCurrentMonth && (
                                                        <div className="mt-1 space-y-1">
                                                            {entries.slice(0, 2).map((entry, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="text-xs p-1 rounded bg-primary/10 truncate"
                                                                    title={`${getProjectName(entry.project_id)} - ${entry.hours}h`}
                                                                >
                                                                    {getProjectName(entry.project_id).slice(0, 15)}
                                                                    {getProjectName(entry.project_id).length > 15 && "..."}
                                                                </div>
                                                            ))}
                                                            {entries.length > 2 && (
                                                                <div className="text-xs text-muted-foreground text-center">
                                                                    +{entries.length - 2} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex items-center justify-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-blue-50 border"></div>
                                        <span>Today</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-primary/10 border"></div>
                                        <span>Has Time Entries</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-muted/20 border"></div>
                                        <span>Other Month</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Day Detail Dialog */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent className="max-w-3xl">
                                {selectedDate && (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle>Time Entries for {format(selectedDate, "MMMM d, yyyy")}</DialogTitle>
                                            <DialogDescription>
                                                {selectedDateEntries.length} entries,{" "}
                                                {selectedDateEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} hours total
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4">
                                            {selectedDateEntries.length > 0 ? (
                                                <div className="border rounded-md overflow-hidden">
                                                    <table className="w-full">
                                                        <thead>
                                                        <tr className="bg-muted/50">
                                                            <th className="text-left p-3">User</th>
                                                            <th className="text-left p-3">Project</th>
                                                            <th className="text-left p-3">Hours</th>
                                                            <th className="text-left p-3">Description</th>
                                                            <th className="text-left p-3">Status</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                        {selectedDateEntries.map((entry) => (
                                                            <tr key={entry.id} className="hover:bg-muted/20">
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarFallback className="text-xs">
                                                                                {getInitials(getUserName(entry.user_id))}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span>{getUserName(entry.user_id)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">{getProjectName(entry.project_id)}</td>
                                                                <td className="p-3">{entry.hours.toFixed(1)}</td>
                                                                <td className="p-3">{entry.description}</td>
                                                                <td className="p-3">
                                                                    <div
                                                                        className={cn(
                                                                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                                            entry.status === "Approved"
                                                                                ? "bg-green-100 text-green-800"
                                                                                : entry.status === "Rejected"
                                                                                    ? "bg-red-100 text-red-800"
                                                                                    : entry.status === "Submitted"
                                                                                        ? "bg-blue-100 text-blue-800"
                                                                                        : "bg-yellow-100 text-yellow-800",
                                                                        )}
                                                                    >
                                                                        {entry.status === "Approved" && <Check className="h-3 w-3 mr-1" />}
                                                                        {entry.status}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center items-center h-40 border rounded-md bg-muted/20">
                                                    <p className="text-muted-foreground">No time entries found for this date.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

