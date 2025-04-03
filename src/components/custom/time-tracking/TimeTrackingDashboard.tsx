"use client"

import {addDays,addMonths,eachDayOfInterval, endOfDay,endOfMonth,format,isSameDay,isSameMonth,isToday,isWeekend, isWithinInterval,startOfDay,startOfMonth,startOfWeek,subMonths,} from "date-fns"
import {CalendarIcon,Check,ChevronLeft,ChevronRight,Clock,Edit2,FileText,Plus,Trash2,X,Calendar,} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getUserInitialsByName } from "@/lib/user_name"
import {UserSchema} from "@/types/user";
import {ProjectSchema} from "@/types/project";
import {TimeTrackingSchema} from "@/types/time_tracking";
import {useSidebar} from "@/context/sidebar-context";

type TimeOffPeriod = {
    id: string
    employee: {
        attributes: {
            email: { value: string }
            first_name: { value: string }
            last_name: { value: string }
        }
    }
    status: string
    start_date: string
    end_date: string
    days_count: number
    time_off_type: {
        attributes: {
            name: string
            category: string
        }
    }
}

export default function TimeTrackingDashboard({session}:
                                                  { session: { user: { sub: string; email?: string; name?: string } } }) {
    const { isCollapsed } = useSidebar()

    const [currentUser, setCurrentUser] = useState<UserSchema | null>(null)
    const [allUsers, setAllUsers] = useState<UserSchema[]>([])
    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])
    const [timeOffs, setTimeOffs] = useState<TimeOffPeriod[]>([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
    const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<TimeTrackingSchema | null>(null)
    const [loading, setLoading] = useState(false)
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [newEntry, setNewEntry] = useState<Partial<TimeTrackingSchema>>({
        project_id: "",
        date: new Date(),
        hours: 0,
        description: "",
        status: "Draft",
        tags: [],
        billable: true,
    })

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const { data, error } = await supabase.from("users").select("*").eq("id", session.user.sub).single()

                if (error) {
                    console.error("Error fetching current user", error)
                    return
                }

                setCurrentUser(data)
                setSelectedUser(data.id)
                setIsAdmin(data.role === "Admin")
            } catch (error) {
                console.error("Error in fetchCurrentUser:", error)
            }
        }

        fetchCurrentUser()
    }, [session])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { data: usersData, error: userError } = await supabase.from("users").select("*")

            let projectIds: string[] = []

            if (!isAdmin && currentUser) {
                const { data: userAllocations, error: allocError } = await supabase
                    .from("allocations")
                    .select("project_id")
                    .eq("user_id", currentUser.id)

                if (allocError) {
                    console.error("Error fetching allocations", allocError)
                } else {
                    projectIds = userAllocations.map((a) => a.project_id)
                }
            } else if (isAdmin && selectedUser && selectedUser !== "all") {
                const { data: userAllocations, error: allocError } = await supabase
                    .from("allocations")
                    .select("project_id")
                    .eq("user_id", selectedUser)

                if (allocError) {
                    console.error("Error fetching allocations", allocError)
                } else {
                    projectIds = userAllocations.map((a) => a.project_id)
                }
            }

            let projectsQuery = supabase.from("projects").select("*")

            if (projectIds.length > 0) {
                projectsQuery = projectsQuery.in("id", projectIds)
            }

            const { data: projectsData, error: projectError } = await projectsQuery

            if (userError || projectError) {
                console.error("Failed fetching users/projects", userError, projectError)
                return
            }

            const formattedProjects = projectsData.map((project) => ({
                ...project,
                period_start: new Date(project.period_start),
                period_end: new Date(project.period_end),
            }))

            setAllUsers(usersData)
            setProjects(formattedProjects)

            const { data: tagsData } = await supabase.from("time_tracking").select("tags").not("tags", "is", null)

            if (tagsData) {
                const allTags = tagsData.flatMap((entry) => entry.tags || [])
                const uniqueTags = [...new Set(allTags)]
                setAvailableTags(uniqueTags)
            }
        } catch (error) {
            console.error("Error in fetchData:", error)
        } finally {
            setLoading(false)
        }
    }, [isAdmin, currentUser, selectedUser])

    const fetchTimeEntries = useCallback(async () => {
        try {
            setLoading(true)
            let query = supabase.from("time_tracking").select("*").order("date", { ascending: false })

            if (!isAdmin) {
                query = query.eq("user_id", currentUser?.id)
            } else if (selectedUser !== "all") {
                query = query.eq("user_id", selectedUser)
            }

            if (selectedProject !== "all" && selectedProject) {
                query = query.eq("project_id", selectedProject)
            }

            const { data, error } = await query
            if (error) {
                console.error("Error fetching time entries", error)
                return
            }

            const formattedEntries = data.map((entry) => ({
                ...entry,
                date: new Date(entry.date),
            }))

            setTimeEntries(formattedEntries)
        } catch (error) {
            console.error("Error in fetchTimeEntries:", error)
        } finally {
            setLoading(false)
        }
    }, [isAdmin, currentUser?.id, selectedUser, selectedProject])

    const fetchTimeOffs = useCallback(async () => {
        try {
            let startDate, endDate

            if (viewMode === "day") {
                startDate = format(currentDate, "yyyy-MM-dd")
                endDate = format(currentDate, "yyyy-MM-dd")
            } else if (viewMode === "week") {
                const start = startOfWeek(currentDate, { weekStartsOn: 1 })
                const end = addDays(start, 6)
                startDate = format(start, "yyyy-MM-dd")
                endDate = format(end, "yyyy-MM-dd")
            } else {
                const start = startOfMonth(currentDate)
                const end = endOfMonth(currentDate)
                startDate = format(start, "yyyy-MM-dd")
                endDate = format(end, "yyyy-MM-dd")
            }

            const response = await fetch(`/api/fetch-personio-timeoffs?start_date=${startDate}&end_date=${endDate}`)
            const result = await response.json()

            if (!result.success) {
                console.error("Error fetching time offs:", result.error)
                return
            }

            const formattedTimeOffs: TimeOffPeriod[] = result.data.map((timeOff: { attributes: {
                    id: string
                    status: string
                    start_date: string
                    end_date: string
                    days_count: number
                    time_off_type: {
                        attributes: {
                            name: string
                            category: string
                        }
                    }
                    employee: {
                        attributes: {
                            email: string
                            first_name: string
                            last_name: string
                        }
                    }
                } }) => ({
                id: timeOff.attributes.id,
                status: timeOff.attributes.status,
                start_date: timeOff.attributes.start_date,
                end_date: timeOff.attributes.end_date,
                days_count: timeOff.attributes.days_count,
                time_off_type: {
                    attributes: {
                        name: timeOff.attributes.time_off_type.attributes.name,
                        category: timeOff.attributes.time_off_type.attributes.category,
                    },
                },
                employee: {
                    attributes: {
                        email: timeOff.attributes.employee.attributes.email,
                        first_name: timeOff.attributes.employee.attributes.first_name,
                        last_name: timeOff.attributes.employee.attributes.last_name,
                    },
                },
            }))

            setTimeOffs(formattedTimeOffs)
        } catch (error) {
            console.error("Error fetching time offs:", error)
        }
    }, [currentDate, viewMode])

    useEffect(() => {
        if (currentUser) {
            fetchData()
        }
    }, [currentUser, fetchData])

    useEffect(() => {
        if (currentUser && (isAdmin ? selectedUser !== "" : true)) {
            fetchTimeEntries()
        }
    }, [currentUser, isAdmin, selectedUser, selectedProject, fetchTimeEntries])

    useEffect(() => {
        if (currentUser) {
            fetchTimeOffs()
        }

    }, [currentUser, currentDate, viewMode, fetchTimeOffs])

    const getUserById = (id: string) => allUsers.find((u) => u.id === id)

    const getProjectById = (id: string) => projects.find((p) => p.id === id)

    const handleSaveEntry = async () => {
        if (!newEntry.project_id || !newEntry.hours || newEntry.hours <= 0 || !currentUser) return

        try {
            setLoading(true)
            const dateOnly = format(newEntry.date!, "yyyy-MM-dd")

            const payload = {
                user_id: isAdmin ? selectedUser : currentUser.id,
                project_id: newEntry.project_id,
                date: dateOnly,
                hours: newEntry.hours,
                description: newEntry.description || "",
                status: newEntry.status || "Draft",
                tags: newEntry.tags || [],
                billable: newEntry.billable || true,
            }

            let error = null
            if (selectedEntry) {
                const res = await supabase.from("time_tracking").update(payload).eq("id", selectedEntry.id)
                error = res.error
            } else {
                const res = await supabase.from("time_tracking").insert(payload)
                error = res.error
            }

            if (error) {
                console.error("Error saving entry", error)
                return
            }

            setIsEntryDialogOpen(false)
            setSelectedEntry(null)
            fetchTimeEntries()
        } catch (error) {
            console.error("Error in handleSaveEntry:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteEntry = async (entryId: string) => {
        try {
            setLoading(true)
            const { error } = await supabase.from("time_tracking").delete().eq("id", entryId)

            if (error) {
                console.error("Error deleting entry", error)
                return
            }

            setTimeEntries((prev) => prev.filter((entry) => entry.id !== entryId))
        } catch (error) {
            console.error("Error in handleDeleteEntry:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTag = () => {
        if (tagInput && !newEntry.tags?.includes(tagInput)) {
            setNewEntry((prev) => ({
                ...prev,
                tags: [...(prev.tags || []), tagInput],
            }))

            if (!availableTags.includes(tagInput)) {
                setAvailableTags((prev) => [...prev, tagInput])
            }

            setTagInput("")
        }
    }

    const handleRemoveTag = (tag: string) => {
        setNewEntry((prev) => ({
            ...prev,
            tags: prev.tags?.filter((t) => t !== tag),
        }))
    }

    const handleBulkApprove = async () => {
        try {
            setLoading(true)
            const entriesToApprove = getEntriesForCurrentView().filter((entry) => entry.status === "Submitted")

            if (entriesToApprove.length === 0) return

            const ids = entriesToApprove.map((e) => e.id)

            const { error } = await supabase.from("time_tracking").update({ status: "Approved" }).in("id", ids)

            if (error) {
                console.error("Failed to approve entries:", error)
                return
            }

            setTimeEntries((prev) => prev.map((entry) => (ids.includes(entry.id) ? { ...entry, status: "Approved" } : entry)))
        } catch (error) {
            console.error("Error in handleBulkApprove:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitAll = async () => {
        if (!currentUser) return

        try {
            setLoading(true)
            const entriesToSubmit = getEntriesForCurrentView().filter(
                (entry) => entry.status === "Draft" && entry.user_id === currentUser.id,
            )

            if (entriesToSubmit.length === 0) {
                return
            }

            const { error } = await supabase
                .from("time_tracking")
                .update({ status: "Submitted" })
                .in(
                    "id",
                    entriesToSubmit.map((e) => e.id),
                )

            if (error) {
                console.error("Failed to submit entries", error)
                return
            }

            setTimeEntries((prev) =>
                prev.map((entry) =>
                    entriesToSubmit.some((e) => e.id === entry.id) ? { ...entry, status: "Submitted" } : entry,
                ),
            )
        } catch (error) {
            console.error("Error in handleSubmitAll:", error)
        } finally {
            setLoading(false)
        }
    }

    const navigateToPreviousPeriod = () => {
        if (viewMode === "day") {
            setCurrentDate((prev) => addDays(prev, -1))
        } else if (viewMode === "week") {
            setCurrentDate((prev) => addDays(prev, -7))
        } else {
            setCurrentDate((prev) => subMonths(prev, 1))
        }
    }

    const navigateToNextPeriod = () => {
        if (viewMode === "day") {
            setCurrentDate((prev) => addDays(prev, 1))
        } else if (viewMode === "week") {
            setCurrentDate((prev) => addDays(prev, 7))
        } else {
            setCurrentDate((prev) => addMonths(prev, 1))
        }
    }

    const navigateToToday = () => {
        setCurrentDate(new Date())
    }

    const getDaysForCurrentView = () => {
        if (viewMode === "day") {
            return [currentDate]
        } else if (viewMode === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 })
            return Array.from({ length: 7 }, (_, i) => addDays(start, i))
        } else {
            const start = startOfMonth(currentDate)
            const end = endOfMonth(currentDate)
            return eachDayOfInterval({ start, end })
        }
    }

    const getEntriesForCurrentView = () => {
        const days = getDaysForCurrentView()

        return timeEntries.filter((entry) => {
            if (
                (!isAdmin && entry.user_id !== currentUser?.id) ||
                (isAdmin && selectedUser && selectedUser !== "all" && entry.user_id !== selectedUser)
            ) {
                return false
            }

            if (selectedProject && selectedProject !== "all" && entry.project_id !== selectedProject) {
                return false
            }

            return days.some((day) => isSameDay(new Date(entry.date), day))
        })
    }

    const getTimeOffsForCurrentView = () => {
        const days = getDaysForCurrentView()
        const userEmail = currentUser?.email?.toLowerCase() || ""

        return timeOffs.filter((timeOff) => {
            const timeOffEmail = timeOff.employee.attributes.email.value.toLowerCase()

            if (isAdmin) {
                if (selectedUser !== "all") {
                    const selectedUserEmail = allUsers.find((u) => u.id === selectedUser)?.email?.toLowerCase()
                    if (selectedUserEmail !== timeOffEmail) {
                        return false
                    }
                }
            } else {
                if (timeOffEmail !== userEmail) {
                    return false
                }
            }

            const startDate = startOfDay(new Date(timeOff.start_date))
            const endDate = endOfDay(new Date(timeOff.end_date))

            return days.some((day) => isWithinInterval(day, { start: startDate, end: endDate }))
        })
    }

    const isTimeOffDay = (date: Date, userEmail?: string) => {
        const email = userEmail || currentUser?.email || ""

        return timeOffs.some((timeOff) => {
            if (email && timeOff.employee.attributes.email.value !== email) {
                return false
            }

            const startDate = new Date(timeOff.start_date)
            const endDate = new Date(timeOff.end_date)

            return date >= startDate && date <= endDate
        })
    }

    const getTimeOffForDay = (date: Date, userEmail?: string) => {
        const email = userEmail?.toLowerCase() || currentUser?.email?.toLowerCase() || ""

        return timeOffs.find((timeOff) => {
            const timeOffEmail = timeOff.employee.attributes.email.value.toLowerCase()

            if (timeOffEmail !== email) {
                return false
            }

            const startDate = startOfDay(new Date(timeOff.start_date))
            const endDate = endOfDay(new Date(timeOff.end_date))

            return isWithinInterval(date, { start: startDate, end: endDate })
        })
    }

    const groupEntriesByDate = (entries: TimeTrackingSchema[]) => {
        const grouped: Record<string, TimeTrackingSchema[]> = {}

        entries.forEach((entry) => {
            const dateKey = format(new Date(entry.date), "yyyy-MM-dd")
            if (!grouped[dateKey]) {
                grouped[dateKey] = []
            }
            grouped[dateKey].push(entry)
        })

        return grouped
    }

    const getTotalHoursForDate = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd")
        const entriesForDate = groupEntriesByDate(getEntriesForCurrentView())[dateKey] || []
        return entriesForDate.reduce((sum, entry) => sum + entry.hours, 0)
    }

    const getTotalHoursForCurrentView = () => {
        return getEntriesForCurrentView().reduce((sum, entry) => sum + entry.hours, 0)
    }

    const handleAddEntry = (date: Date) => {
        if (!currentUser) return

        setSelectedEntry(null)
        setNewEntry({
            user_id: selectedUser || currentUser.id,
            project_id: selectedProject !== "all" ? selectedProject : "",
            date: new Date(date),
            hours: 0,
            description: "",
            status: "Draft",
            billable: true,
            tags: [],
        })
        setIsEntryDialogOpen(true)
    }

    const handleEditEntry = (entry: TimeTrackingSchema) => {
        setSelectedEntry(entry)
        setNewEntry({
            ...entry,
            date: new Date(entry.date),
        })
        setIsEntryDialogOpen(true)
    }

    const renderTimeEntryCard = (entry: TimeTrackingSchema) => {
        const project = getProjectById(entry.project_id)
        const user = getUserById(entry.user_id)

        return (
            <Card
                key={entry.id}
                className={cn(
                    "mb-2 shadow-sm",
                    entry.status === "Approved"
                        ? "border-green-200"
                        : entry.status === "Rejected"
                            ? "border-red-200"
                            : entry.status === "Submitted"
                                ? "border-purple-200"
                                : "border-gray-200",
                )}
            >
                <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="font-medium">{project?.project_name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">{entry.description}</div>
                            <div className="flex items-center gap-1 flex-wrap">
                                {entry.tags?.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="font-bold">{entry.hours}h</div>
                            <Badge
                                className={cn(
                                    "mt-1",
                                    entry.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : entry.status === "Rejected"
                                            ? "bg-red-100 text-red-800"
                                            : entry.status === "Submitted"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-gray-100 text-gray-800",
                                )}
                            >
                                {entry.status}
                            </Badge>
                        </div>
                    </div>

                    {isAdmin && user && user.id !== currentUser?.id && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">{getUserInitialsByName(user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{user.name}</span>
                        </div>
                    )}

                    <div className="flex justify-end mt-2">
                        {(entry.user_id === currentUser?.id || isAdmin) && entry.status !== "Approved" && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 15 15"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                        >
                                            <path
                                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                                                fill="currentColor"
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                            ></path>
                                        </svg>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteEntry(entry.id)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderTimeOffBadge = (timeOff: TimeOffPeriod) => {
        const type = timeOff.time_off_type.attributes.name
        const category = timeOff.time_off_type.attributes.category

        return (
            <Badge
                className={cn(
                    "text-xs",
                    type === "Paid Vacation"
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-400 hover:text-purple-50"
                        : type === "Unpaid Leave"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-400 hover:text-yellow-50"
                            : category === "vacation"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-400 hover:text-blue-50"
                                : category === "sick_leave"
                                    ? "bg-red-100 text-red-800 hover:bg-red-400 hover:text-red-50"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-400 hover:text-gray-50",
                )}
            >
                {type}
            </Badge>
        )
    }

    const renderDayView = () => {
        const entries = getEntriesForCurrentView()
        const entriesByDate = groupEntriesByDate(entries)
        const dateKey = format(currentDate, "yyyy-MM-dd")
        const dayEntries = entriesByDate[dateKey] || []
        const timeOff = getTimeOffForDay(currentDate)

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
                        {timeOff && renderTimeOffBadge(timeOff)}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddEntry(currentDate)} disabled={!!timeOff}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Time
                    </Button>
                </div>

                {timeOff ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md bg-muted/20">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Time Off Day</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            You are on {timeOff.time_off_type.attributes.name} today. No time entries can be added.
                        </p>
                    </div>
                ) : dayEntries.length > 0 ? (
                    <div className="space-y-2">
                        {dayEntries.map((entry) => renderTimeEntryCard(entry))}

                        <div className="flex justify-between items-center pt-2 border-t">
                            <div className="text-sm font-medium">Total Hours</div>
                            <div className="font-bold">{getTotalHoursForDate(currentDate)}h</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md bg-muted/20">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Time Entries</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            No time entries recorded for this day. Click &quot;Add Time&quot; to log your hours.
                        </p>
                        <Button className="mt-4" onClick={() => handleAddEntry(currentDate)}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add Time Entry
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    const renderWeekView = () => {
        const weekDays = getDaysForCurrentView()
        const entries = getEntriesForCurrentView()
        const entriesByDate = groupEntriesByDate(entries)

        const startDate = weekDays[0]
        const endDate = weekDays[weekDays.length - 1]

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                        {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => handleAddEntry(new Date())}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Time
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, index) => {
                        const dateKey = format(day, "yyyy-MM-dd")
                        const dayEntries = entriesByDate[dateKey] || []
                        const isWeekendDay = isWeekend(day)
                        const totalHours = dayEntries.reduce((sum, entry) => sum + entry.hours, 0)
                        const timeOff = getTimeOffForDay(day)

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "border rounded-md p-2 min-h-[150px]",
                                    isWeekendDay ? "bg-muted/20" : "",
                                    isToday(day) ? "border-primary" : "",
                                    timeOff ? "bg-blue-50/50" : "",
                                )}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className={cn("text-sm font-medium", isToday(day) ? "text-primary" : "")}>
                                        {format(day, "EEE, MMM d")}
                                    </div>
                                    {!isWeekendDay && !timeOff && (
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleAddEntry(day)}>
                                            <Plus className="h-4 w-4" />
                                            <span className="sr-only">Add</span>
                                        </Button>
                                    )}
                                </div>

                                {timeOff && <div className="mb-2">{renderTimeOffBadge(timeOff)}</div>}

                                {dayEntries.length > 0 ? (
                                    <div className="space-y-2">
                                        {dayEntries.slice(0, 2).map((entry) => {
                                            const project = getProjectById(entry.project_id)

                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={cn(
                                                        "text-xs p-1 rounded cursor-pointer",
                                                        entry.status === "Draft"
                                                            ? "bg-gray-200 text-gray-700"
                                                            : entry.status === "Submitted"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : entry.status === "Approved"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-primary/10",
                                                    )}
                                                    onClick={() => handleEditEntry(entry)}
                                                >
                                                    <div className="font-medium truncate">{project?.project_name}</div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                                            {entry.status}
                                                        </Badge>
                                                        <span>{entry.hours}h</span>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {dayEntries.length > 2 && (
                                            <div className="text-xs text-center text-muted-foreground">+{dayEntries.length - 2} more</div>
                                        )}

                                        <div className="text-xs font-medium text-right pt-1 border-t">Total: {totalHours}h</div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[80px] text-xs text-muted-foreground">
                                        {timeOff ? timeOff.time_off_type.attributes.name : isWeekendDay ? "Weekend" : "No entries"}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-sm font-medium">Total Hours for Week</div>
                    <div className="font-bold">{getTotalHoursForCurrentView()}h</div>
                </div>
            </div>
        )
    }

    const renderMonthView = () => {
        const entries = getEntriesForCurrentView()
        const entriesByDate = groupEntriesByDate(entries)

        const firstDayOfMonth = startOfMonth(currentDate)
        const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 })

        const weeks = []
        let currentWeek = []

        for (let i = 0; i < 42; i++) {
            const day = addDays(firstDayOfCalendar, i)

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
            }

            currentWeek.push(day)

            if (i === 41) {
                weeks.push(currentWeek)
            }
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{format(currentDate, "MMMM yyyy")}</h3>
                    <Button variant="outline" size="sm" onClick={() => handleAddEntry(new Date())}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Time
                    </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-7 bg-muted/50">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                            <div key={day} className="p-2 text-center font-medium text-sm">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div>
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="grid grid-cols-7 border-t">
                                {week.map((day, dayIndex) => {
                                    const dateKey = format(day, "yyyy-MM-dd")
                                    const dayEntries = entriesByDate[dateKey] || []
                                    const isCurrentMonth = isSameMonth(day, currentDate)
                                    const isTodayDay = isToday(day)
                                    const totalHours = dayEntries.reduce((sum, entry) => sum + entry.hours, 0)
                                    const email = isAdmin
                                        ? allUsers.find((u) => u.id === selectedUser)?.email
                                        : currentUser?.email

                                    const timeOff = getTimeOffForDay(day, email)

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={cn(
                                                "min-h-[100px] p-1 border-r last:border-r-0",
                                                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                                isTodayDay && "bg-blue-50",
                                                isWeekend(day) && "bg-muted/10",
                                                timeOff && isCurrentMonth && "bg-blue-50/50",
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={cn("text-sm font-medium p-1", isTodayDay && "text-primary")}>
                                                  {format(day, "d")}
                                                </span>
                                                {isCurrentMonth && !isWeekend(day) && !timeOff && (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleAddEntry(day)}>
                                                        <Plus className="h-3 w-3" />
                                                        <span className="sr-only">Add</span>
                                                    </Button>
                                                )}
                                            </div>

                                            {timeOff && <div className="mb-1">{renderTimeOffBadge(timeOff)}</div>}

                                            {dayEntries.length > 0 && (
                                                <div className="mt-1">
                                                    {totalHours > 0 && <div className="text-xs font-medium text-right mb-1">{totalHours}h</div>}

                                                    {dayEntries.slice(0, 2).map((entry, i) => {
                                                        const project = getProjectById(entry.project_id)
                                                        const projectName = project?.project_name ?? ""

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={cn(
                                                                    "text-xs p-1 mb-1 rounded truncate cursor-pointer",
                                                                    entry.status === "Draft"
                                                                        ? "bg-gray-200 text-gray-700"
                                                                        : entry.status === "Submitted"
                                                                            ? "bg-purple-100 text-purple-800"
                                                                            : entry.status === "Approved"
                                                                                ? "bg-green-100 text-green-800"
                                                                                : "bg-primary/10",
                                                                )}
                                                                onClick={() => handleEditEntry(entry)}
                                                            >
                                                                {projectName.length > 15 ? `${projectName.slice(0, 15)}...` : projectName}
                                                            </div>
                                                        )
                                                    })}

                                                    {dayEntries.length > 2 && (
                                                        <div className="text-xs text-center text-muted-foreground">
                                                            +{dayEntries.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-sm font-medium">Total Hours for Month</div>
                    <div className="font-bold">{getTotalHoursForCurrentView()}h</div>
                </div>
            </div>
        )
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? "ml-[3rem]" : "ml-[15rem]"} p-6`}>
            <div className="p-6">
                <div className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-xl font-semibold">Time Tracking</h2>
                        </div>

                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <Button variant="outline" onClick={handleBulkApprove}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve Submitted
                                </Button>
                            )}

                            <Button variant="outline" onClick={handleSubmitAll}>
                                <FileText className="mr-2 h-4 w-4" />
                                Submit All Drafts
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Filters</CardTitle>
                                {!isAdmin ? (
                                    <CardDescription>Select project</CardDescription>
                                ) : (
                                    <CardDescription>Select user and a project</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isAdmin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="user">User</Label>
                                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                                            <SelectTrigger id="user">
                                                <SelectValue placeholder="Select a user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                {allUsers.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="w-full">
                                    <Label htmlFor="project">Project</Label>
                                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                                        <SelectTrigger id="project" className="w-full">
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Projects</SelectItem>
                                            {projects
                                                .filter((p) => p.status === "Active" || p.status === "Pending")
                                                .map((project) => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.project_name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>View Mode</Label>
                                    <div className="flex border rounded-md overflow-hidden">
                                        <Button
                                            variant={viewMode === "day" ? "default" : "ghost"}
                                            className="flex-1 rounded-none"
                                            onClick={() => setViewMode("day")}
                                        >
                                            Day
                                        </Button>
                                        <Button
                                            variant={viewMode === "week" ? "default" : "ghost"}
                                            className="flex-1 rounded-none"
                                            onClick={() => setViewMode("week")}
                                        >
                                            Week
                                        </Button>
                                        <Button
                                            variant={viewMode === "month" ? "default" : "ghost"}
                                            className="flex-1 rounded-none"
                                            onClick={() => setViewMode("month")}
                                        >
                                            Month
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Navigation</Label>
                                    <div className="flex items-center justify-between">
                                        <Button variant="outline" size="sm" onClick={navigateToPreviousPeriod}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="w-[180px]">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {viewMode === "day" && format(currentDate, "MMM d, yyyy")}
                                                    {viewMode === "week" &&
                                                        `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")}`}
                                                    {viewMode === "month" && format(currentDate, "MMMM yyyy")}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={currentDate}
                                                    onSelect={(date) => date && setCurrentDate(date)}
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t">
                                                    <Button onClick={navigateToToday} size="sm" className="w-full">
                                                        Today
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Button variant="outline" size="sm" onClick={navigateToNextPeriod}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="text-sm font-medium mb-2">Summary</div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Total Hours:</span>
                                            <span className="font-bold">{getTotalHoursForCurrentView()}h</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Entries:</span>
                                            <span className="font-bold">{getEntriesForCurrentView().length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Projects:</span>
                                            <span className="font-bold">
                                              {new Set(getEntriesForCurrentView().map((e) => e.project_id)).size}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Time Offs:</span>
                                            <span className="font-bold">{getTimeOffsForCurrentView().length}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-3">
                            <CardContent className="pt-6">
                                {viewMode === "day" && renderDayView()}
                                {viewMode === "week" && renderWeekView()}
                                {viewMode === "month" && renderMonthView()}
                            </CardContent>
                        </Card>
                    </div>

                    <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{selectedEntry ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
                                <DialogDescription>
                                    {selectedEntry
                                        ? "Update your time entry details below."
                                        : "Enter the details of your time entry below."}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="entry-date">Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newEntry.date ? format(new Date(newEntry.date), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={newEntry.date ? new Date(newEntry.date) : undefined}
                                                    onSelect={(date) => date && setNewEntry({ ...newEntry, date })}
                                                    initialFocus
                                                    disabled={(date) => isTimeOffDay(date)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="entry-hours">Hours</Label>
                                        <Input
                                            id="entry-hours"
                                            type="number"
                                            min="0.25"
                                            step="0.25"
                                            max="24"
                                            value={newEntry.hours || ""}
                                            onChange={(e) =>
                                                setNewEntry({
                                                    ...newEntry,
                                                    hours: Number.parseFloat(e.target.value) || 0,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label htmlFor="entry-project">Project</Label>
                                    <Select
                                        value={newEntry.project_id || ""}
                                        onValueChange={(value) =>
                                            setNewEntry({
                                                ...newEntry,
                                                project_id: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger id="entry-project" className={"w-full"}>
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects
                                                .filter((p) => p.status === "Active" || p.status === "Pending")
                                                .map((project) => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.project_name} ({project.client})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="entry-description">Description</Label>
                                    <Textarea
                                        id="entry-description"
                                        placeholder="Describe the work you did"
                                        value={newEntry.description || ""}
                                        onChange={(e) =>
                                            setNewEntry({
                                                ...newEntry,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {newEntry.tags?.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                                {tag}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a tag"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleAddTag()
                                                }
                                            }}
                                        />
                                        <Button type="button" size="sm" onClick={handleAddTag}>
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {availableTags
                                            .filter((tag) => !newEntry.tags?.includes(tag))
                                            .slice(0, 5)
                                            .map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-secondary"
                                                    onClick={() => {
                                                        setNewEntry((prev) => ({
                                                            ...prev,
                                                            tags: [...(prev.tags || []), tag],
                                                        }))
                                                    }}
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="entry-billable"
                                        checked={newEntry.billable ?? true}
                                        onChange={(e) =>
                                            setNewEntry({
                                                ...newEntry,
                                                billable: e.target.checked,
                                            })
                                        }
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="entry-billable" className="text-sm font-normal">
                                        Billable time
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEntry} disabled={loading}>
                                    {loading && (
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    {selectedEntry ? "Update Entry" : "Save Entry"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}

