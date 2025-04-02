"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import {AlertCircle, CalendarIcon, CheckCircle2, Clock, Edit, FileText, Flag, Link, MoreHorizontal, PanelRight, PauseCircle, Plus, Search, Trash2, Users, XCircle,} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileX } from "lucide-react"
import {useEffect, useMemo, useState} from "react";
import {EpicSchema} from "@/types/epics";
import {supabase} from "@/lib/supabase";
import {CommentSchema, TasksSchema} from "@/types/tasks";
import {UserSchema} from "@/types/user";

// Types
type TaskStatus = "on_hold" | "blocked" | "in_progress" | "review" | "done"
type TaskPriority = "lowest" | "low" | "medium" | "high" | "highest"
type TaskType = "bug" | "feature" | "task" | "improvement" | "epic"

// Form schema for creating/editing tasks
const taskFormSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters." }),
    type: z.enum(["bug", "feature", "task", "improvement", "epic"]),
    priority: z.enum(["lowest", "low", "medium", "high", "highest"]),
    labels: z.array(z.string()).optional(),
    epicId: z.string().optional(),
    description: z.string().min(5, { message: "Description must be at least 5 characters." }),
    assigneeId: z.string().optional(),
    dueDate: z.date().optional(),
    estimatedHours: z.number().min(0).optional(),
})

// Helper functions
const getInitials = (name: string) => {
    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
}

const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
        case "on_hold":
            return "On Hold"
        case "blocked":
            return "Blocked"
        case "in_progress":
            return "In Progress"
        case "review":
            return "Review"
        case "done":
            return "Done"
        default:
            return "Unknown"
    }
}

const getStatusColor = (status: TaskStatus) => {
    switch (status) {
        case "on_hold":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        case "blocked":
            return "bg-red-100 text-red-800 hover:bg-red-100"
        case "in_progress":
            return "bg-blue-100 text-blue-800 hover:bg-blue-100"
        case "review":
            return "bg-purple-100 text-purple-800 hover:bg-purple-100"
        case "done":
            return "bg-green-100 text-green-800 hover:bg-green-100"
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
}

const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
        case "lowest":
            return "Lowest"
        case "low":
            return "Low"
        case "medium":
            return "Medium"
        case "high":
            return "High"
        case "highest":
            return "Highest"
        default:
            return "Unknown"
    }
}

const getPriorityIcon = (priority: TaskPriority) => {
    const flagClasses = "h-4 w-4"

    switch (priority) {
        case "lowest":
            return <Flag className={cn(flagClasses, "text-gray-400")} />
        case "low":
            return <Flag className={cn(flagClasses, "text-blue-400")} />
        case "medium":
            return <Flag className={cn(flagClasses, "text-green-400")} />
        case "high":
            return <Flag className={cn(flagClasses, "text-orange-400")} />
        case "highest":
            return <Flag className={cn(flagClasses, "text-red-400")} />
        default:
            return null
    }
}

const getTypeLabel = (type: TaskType) => {
    switch (type) {
        case "bug":
            return "Bug"
        case "feature":
            return "Feature"
        case "task":
            return "Task"
        case "improvement":
            return "Improvement"
        case "epic":
            return "Epic"
        default:
            return "Unknown"
    }
}

const getTypeIcon = (type: TaskType) => {
    const iconClasses = "h-4 w-4"

    switch (type) {
        case "bug":
            return <AlertCircle className={cn(iconClasses, "text-red-500")} />
        case "feature":
            return <Flag className={cn(iconClasses, "text-purple-500")} />
        case "task":
            return <CheckCircle2 className={cn(iconClasses, "text-blue-500")} />
        case "improvement":
            return <ArrowUpCircle className={cn(iconClasses, "text-green-500")} />
        case "epic":
            return <Layers className={cn(iconClasses, "text-yellow-500")} />
        default:
            return null
    }
}

// Arrow up circle icon component
function ArrowUpCircle(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m16 12-4-4-4 4" />
            <path d="M12 16V8" />
        </svg>
    )
}

// Layers icon component
function Layers(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
            <path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 12.5" />
            <path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 17.5" />
        </svg>
    )
}

export default function TasksDashboard({ session }: { session: { user: { sub: string; email?: string; name?: string } } }) {
    const [tasks, setTasks] = useState<TasksSchema[]>([])
    const [epics, setEpics] = useState<EpicSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])


    const [selectedTask, setSelectedTask] = useState<TasksSchema | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isAddCommentDialogOpen, setIsAddCommentDialogOpen] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [filterAssignee, setFilterAssignee] = useState<string | "all">("all")
    const [filterType, setFilterType] = useState<TaskType | "all">("all")
    const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all")
    const [filterEpic, setFilterEpic] = useState<string | "all">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const [currentUser, setCurrentUser] = useState<UserSchema | null>(null)

    useEffect(() => {
        if (users.length === 0) return;

        const userFromSession = users.find((user) => user.id === session.user.sub)
        if (userFromSession) {
            setCurrentUser(userFromSession)
        }
    }, [users, session])

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: tasksData }, { data: epicsData },
                { data: usersData }] = await Promise.all([
                supabase.from("tasks").select("*"),
                supabase.from("epics").select("*"),
                supabase.from("users").select("*"),
            ])

            if (!tasksData || !epicsData || !usersData) {
                console.error("Failed to fetch data from Supabase")
                return
            }

            setTasks(tasksData)
            setEpics(epicsData)
            setUsers(usersData)
        }

        fetchData()
    }, [])

    const getEpicById = (epicId: string) => {
        return epics.find((epic) => epic.id === epicId)
    }

    const getUserById = (userId: string) => {
        return users.find((user) => user.id === userId)
    }

    const getTaskById = (taskId: string) => {
        return tasks.find((task) => task.id === taskId)
    }

    // Create task form
    const form = useForm<z.infer<typeof taskFormSchema>>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: "",
            type: "task",
            priority: "medium",
            labels: [],
            description: "",
            estimatedHours: 0,
        },
    })

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isCreateDialogOpen) {
            form.reset({
                title: "",
                type: "task",
                priority: "medium",
                labels: [],
                description: "",
                assigneeId: currentUser?.id || "",
                estimatedHours: 0,
            })
        }
    }, [isCreateDialogOpen, form, currentUser])

    // Set form values when editing a task
    useEffect(() => {
        if (!isEditDialogOpen || !selectedTask) return

        form.reset({
            title: selectedTask.title || "",
            type: selectedTask.type.toLowerCase() as TaskType,
            priority: selectedTask.priority.toLowerCase() as TaskPriority,
            labels: selectedTask.labels || [],
            epicId: selectedTask.epic_id || "",
            description: selectedTask.description || "",
            assigneeId: selectedTask.assignee_id || "",
            dueDate: selectedTask.due_date ? new Date(selectedTask.due_date) : undefined,
            estimatedHours: selectedTask.estimated_hours ?? 0,
        })
    }, [isEditDialogOpen, selectedTask, form])

    // Filter tasks based on current filters
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const type = task.type?.toLowerCase() as TaskType
            const priority = task.priority?.toLowerCase() as TaskPriority

            const isAssigneeMatch = filterAssignee === "all" || task.assignee_id === filterAssignee
            const isTypeMatch = filterType === "all" || type === filterType
            const isPriorityMatch = filterPriority === "all" || priority === filterPriority
            const isEpicMatch = filterEpic === "all" || task.epic_id === filterEpic
            const isSearchMatch =
                searchQuery === "" ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase())

            return isAssigneeMatch && isTypeMatch && isPriorityMatch && isEpicMatch && isSearchMatch
        })
    }, [tasks, filterAssignee, filterType, filterPriority, filterEpic, searchQuery])

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, TasksSchema[]> = {
            on_hold: [],
            blocked: [],
            in_progress: [],
            review: [],
            done: [],
        }

        filteredTasks.forEach((task) => {
            const statusKey = task.status?.toLowerCase() as TaskStatus
            if (grouped[statusKey]) {
                grouped[statusKey].push(task)
            } else {
                console.warn("Unknown status:", task.status)
            }
        })

        return grouped
    }, [filteredTasks])

    const capitalize = (value: string) => {
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    const onSubmit = (data: z.infer<typeof taskFormSchema>) => {
        setIsSaving(true)

        const normalizedData = {
            ...data,
            type: capitalize(data.type) as TasksSchema["type"],
            priority: capitalize(data.priority) as TasksSchema["priority"],
        }

        setTimeout(() => {
            if (isEditDialogOpen && selectedTask) {
                // Update existing task
                const updatedTasks: TasksSchema[] = tasks.map((task) => {
                    if (task.id === selectedTask.id) {
                        return {
                            ...task,
                            ...normalizedData,
                            updated_at: new Date(),
                        }
                    }
                    return task
                })

                setTasks(updatedTasks)
                setIsEditDialogOpen(false)
            } else {
                const newTask: TasksSchema = {
                    id: `task-${Date.now()}`,
                    ...normalizedData,
                    status: "on_hold",
                    reporter_id: currentUser?.id || "",
                    created_at: new Date(),
                    updated_at: new Date(),
                    comments: [],
                    attachments: [],
                    related_task_ids: [],
                    subtask_ids: [],
                    labels: data.labels ?? [],
                }

                setTasks([...tasks, newTask])
                setIsCreateDialogOpen(false)
            }

            setIsSaving(false)
        }, 1000)
    }

    // Handle task deletion
    const handleDeleteTask = () => {
        if (!selectedTask) return

        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            const updatedTasks = tasks.filter((task) => task.id !== selectedTask.id)
            setTasks(updatedTasks)
            setIsDeleteDialogOpen(false)
            setSelectedTask(null)

            setIsSaving(false)
        }, 1000)
    }

    // Handle adding a new comment
    const handleAddComment = () => {
        if (!selectedTask || !newComment.trim()) return

        const newCommentObj: CommentSchema = {
            id: `comment-${Date.now()}`,
            task_id: selectedTask.id,
            user_id: currentUser!.id,
            content: newComment,
            created_at: new Date(),
        }

        const updatedTasks = tasks.map((task) => {
            if (task.id === selectedTask.id) {
                return {
                    ...task,
                    comments: [...task.comments, newCommentObj],
                    updatedAt: new Date(),
                }
            }
            return task
        })

        setTasks(updatedTasks)

        // Update selected task
        const updatedTask = updatedTasks.find((t) => t.id === selectedTask.id)
        if (updatedTask) {
            setSelectedTask(updatedTask)
        }

        setNewComment("")
        setIsAddCommentDialogOpen(false)
    }

    // Handle status change
    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        const updatedTasks = tasks.map((task) => {
            if (task.id === taskId) {
                return {
                    ...task,
                    status: newStatus,
                    updatedAt: new Date(),
                }
            }
            return task
        })

        setTasks(updatedTasks)
    }

    console.log("currentUser", currentUser)

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">Task Board</h1>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search tasks..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Select value={filterAssignee} onValueChange={(value) => setFilterAssignee(value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Assignees</SelectItem>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterType} onValueChange={(value) => setFilterType(value as TaskType | "all")}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="bug">Bug</SelectItem>
                                    <SelectItem value="feature">Feature</SelectItem>
                                    <SelectItem value="task">Task</SelectItem>
                                    <SelectItem value="improvement">Improvement</SelectItem>
                                    <SelectItem value="epic">Epic</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterPriority}
                                onValueChange={(value) => setFilterPriority(value as TaskPriority | "all")}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="lowest">Lowest</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="highest">Highest</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterEpic} onValueChange={(value) => setFilterEpic(value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Epic" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Epics</SelectItem>
                                    {epics.map((epic) => (
                                        <SelectItem key={epic.id} value={epic.id}>
                                            {epic.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Task Board with Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-6 mb-4">
                    <TabsTrigger value="all" className="font-medium">
                        All Tasks
                    </TabsTrigger>
                    <TabsTrigger value="on_hold" className="font-medium flex items-center gap-1">
                        <PauseCircle className="h-4 w-4 text-yellow-500" />
                        <span>On Hold</span>
                        <Badge variant="outline" className="ml-1">
                            {tasksByStatus.on_hold.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="blocked" className="font-medium flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Blocked</span>
                        <Badge variant="outline" className="ml-1">
                            {tasksByStatus.blocked.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="in_progress" className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>In Progress</span>
                        <Badge variant="outline" className="ml-1">
                            {tasksByStatus.in_progress.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="review" className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>Review</span>
                        <Badge variant="outline" className="ml-1">
                            {tasksByStatus.review.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="done" className="font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Done</span>
                        <Badge variant="outline" className="ml-1">
                            {tasksByStatus.done.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(tasksByStatus).flatMap(([, tasks]) =>
                            tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    assignee={getUserById(task.assignee_id || "")}
                                    epic={getEpicById(task.epic_id || "")}
                                    onView={() => {
                                        setSelectedTask(task)
                                        setIsViewDialogOpen(true)
                                    }}
                                    onEdit={() => {
                                        setSelectedTask(task)
                                        setIsEditDialogOpen(true)
                                    }}
                                    onDelete={() => {
                                        setSelectedTask(task)
                                        setIsDeleteDialogOpen(true)
                                    }}
                                    onStatusChange={handleStatusChange}
                                />
                            )),
                        )}
                        {Object.values(tasksByStatus).flat().length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                                <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No tasks found</h3>
                                <p className="text-muted-foreground">Try adjusting your filters or create a new task.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="on_hold">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {tasksByStatus.on_hold.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                assignee={getUserById(task.assignee_id || "")}
                                epic={getEpicById(task.epic_id || "")}
                                onView={() => {
                                    setSelectedTask(task)
                                    setIsViewDialogOpen(true)
                                }}
                                onEdit={() => {
                                    setSelectedTask(task)
                                    setIsEditDialogOpen(true)
                                }}
                                onDelete={() => {
                                    setSelectedTask(task)
                                    setIsDeleteDialogOpen(true)
                                }}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                        {tasksByStatus.on_hold.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                                <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No tasks in On Hold status</h3>
                                <p className="text-muted-foreground">Create a new task or change the status of existing tasks.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="blocked">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {tasksByStatus.blocked.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                assignee={getUserById(task.assignee_id || "")}
                                epic={getEpicById(task.epic_id || "")}
                                onView={() => {
                                    setSelectedTask(task)
                                    setIsViewDialogOpen(true)
                                }}
                                onEdit={() => {
                                    setSelectedTask(task)
                                    setIsEditDialogOpen(true)
                                }}
                                onDelete={() => {
                                    setSelectedTask(task)
                                    setIsDeleteDialogOpen(true)
                                }}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                        {tasksByStatus.blocked.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                                <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No blocked tasks</h3>
                                <p className="text-muted-foreground">All clear! There are no blocked tasks at the moment.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="in_progress">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {tasksByStatus.in_progress.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                assignee={getUserById(task.assignee_id || "")}
                                epic={getEpicById(task.epic_id || "")}
                                onView={() => {
                                    setSelectedTask(task)
                                    setIsViewDialogOpen(true)
                                }}
                                onEdit={() => {
                                    setSelectedTask(task)
                                    setIsEditDialogOpen(true)
                                }}
                                onDelete={() => {
                                    setSelectedTask(task)
                                    setIsDeleteDialogOpen(true)
                                }}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                        {tasksByStatus.in_progress.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                                <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No tasks in progress</h3>
                                <p className="text-muted-foreground">Move some tasks to In Progress to see them here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="review">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {tasksByStatus.review.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                assignee={getUserById(task.assignee_id || "")}
                                epic={getEpicById(task.epic_id || "")}
                                onView={() => {
                                    setSelectedTask(task)
                                    setIsViewDialogOpen(true)
                                }}
                                onEdit={() => {
                                    setSelectedTask(task)
                                    setIsEditDialogOpen(true)
                                }}
                                onDelete={() => {
                                    setSelectedTask(task)
                                    setIsDeleteDialogOpen(true)
                                }}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                        {tasksByStatus.review.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                                <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No tasks in review</h3>
                                <p className="text-muted-foreground">Complete some tasks and move them to review.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="done">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {tasksByStatus.done.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                assignee={getUserById(task.assignee_id || "")}
                                epic={getEpicById(task.epic_id || "")}
                                onView={() => {
                                    setSelectedTask(task)
                                    setIsViewDialogOpen(true)
                                }}
                                onEdit={() => {
                                    setSelectedTask(task)
                                    setIsEditDialogOpen(true)
                                }}
                                onDelete={() => {
                                    setSelectedTask(task)
                                    setIsDeleteDialogOpen(true)
                                }}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                        {tasksByStatus.done.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                                <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No completed tasks</h3>
                                <p className="text-muted-foreground">Complete tasks and move them to Done to see them here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Task Dialog */}
            <Dialog
                open={isCreateDialogOpen || isEditDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateDialogOpen(false)
                        setIsEditDialogOpen(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditDialogOpen ? "Edit Task" : "Create New Task"}</DialogTitle>
                        <DialogDescription>
                            {isEditDialogOpen ? "Update the details of your task." : "Add a new task to the board."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter task title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || "task"}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="bug">Bug</SelectItem>
                                                    <SelectItem value="feature">Feature</SelectItem>
                                                    <SelectItem value="task">Task</SelectItem>
                                                    <SelectItem value="improvement">Improvement</SelectItem>
                                                    <SelectItem value="epic">Epic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || "medium"}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="lowest">Lowest</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="highest">Highest</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="assigneeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assignee</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || ""} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select assignee" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="">Unassigned</SelectItem>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="epicId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Epic</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || ""} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select epic" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {epics.map((epic) => (
                                                        <SelectItem key={epic.id} value={epic.id}>
                                                            {epic.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Due Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>No due date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    {/* Calendar component would go here */}
                                                    <div className="p-3">
                                                        <Input
                                                            type="date"
                                                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                            onChange={(e) => {
                                                                const date = e.target.value ? new Date(e.target.value) : undefined
                                                                field.onChange(date)
                                                            }}
                                                        />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="estimatedHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated Hours</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="labels"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Labels</FormLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {["frontend", "backend", "design", "bug", "feature", "documentation", "testing"].map((label) => (
                                                <Badge
                                                    key={label}
                                                    variant={field.value?.includes(label) ? "default" : "outline"}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        field.value?.includes(label) ? "bg-primary" : "bg-muted hover:bg-muted/80",
                                                    )}
                                                    onClick={() => {
                                                        const currentLabels = field.value || []
                                                        if (currentLabels.includes(label)) {
                                                            field.onChange(currentLabels.filter((l) => l !== label))
                                                        } else {
                                                            field.onChange([...currentLabels, label])
                                                        }
                                                    }}
                                                >
                                                    {label}
                                                </Badge>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe the task" className="min-h-[100px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateDialogOpen(false)
                                        setIsEditDialogOpen(false)
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : isEditDialogOpen ? (
                                        "Update Task"
                                    ) : (
                                        "Create Task"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* View Task Dialog */}
            <Dialog
                open={isViewDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsViewDialogOpen(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[700px]">
                    {selectedTask && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <DialogTitle className="flex items-center gap-2">
                                        {getTypeIcon(selectedTask.type.toLowerCase() as TaskType)}
                                        <span>{selectedTask.title}</span>
                                    </DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(getStatusColor(selectedTask.status))}>
                                            {getStatusLabel(selectedTask.status)}
                                        </Badge>
                                    </div>
                                </div>
                                <DialogDescription>
                                    {selectedTask.id} • Created {format(new Date(selectedTask.created_at), "PPP")}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Description</h4>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            <p className="text-sm whitespace-pre-line">{selectedTask.description}</p>
                                        </div>
                                    </div>

                                    {/* Comments section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-medium">Comments</h4>
                                            <Button variant="outline" size="sm" onClick={() => setIsAddCommentDialogOpen(true)}>
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Comment
                                            </Button>
                                        </div>

                                        {Array.isArray(selectedTask.comments) && selectedTask.comments.length > 0 ? (
                                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                                {selectedTask.comments.map((comment) => {
                                                    const commentUser = getUserById(comment.user_id)
                                                    return (
                                                        <div key={comment.id} className="p-3 border rounded-md">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">
                                                                        {commentUser ? getInitials(commentUser.name) : "??"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="text-sm font-medium">{commentUser?.name || "Unknown User"}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {format(new Date(comment.created_at), "PPP 'at' p")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm">{comment.content}</p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                                                No comments yet
                                            </div>
                                        )}
                                    </div>

                                    {/* Attachments section */}
                                    {Array.isArray(selectedTask.attachments) && selectedTask.attachments.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Attachments</h4>
                                            <div className="space-y-2">
                                                {selectedTask.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-md">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{attachment.name}</span>
                                                        </div>
                                                        <Button variant="ghost" size="sm">
                                                            Download
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Related tasks */}
                                    {Array.isArray(selectedTask.related_task_ids) && selectedTask.related_task_ids.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Related Tasks</h4>
                                            <div className="space-y-2">
                                                {selectedTask.related_task_ids.map((taskId) => {
                                                    const relatedTask = getTaskById(taskId)
                                                    return relatedTask ? (
                                                        <div key={taskId} className="flex items-center gap-2 p-2 border rounded-md">
                                                            {getTypeIcon(relatedTask.type.toLowerCase() as TaskType)}
                                                            <span className="text-sm">{relatedTask.title}</span>
                                                        </div>
                                                    ) : null
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtasks */}
                                    {Array.isArray(selectedTask.subtask_ids) && selectedTask.subtask_ids.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Subtasks</h4>
                                            <div className="space-y-2">
                                                {selectedTask.subtask_ids.map((taskId) => {
                                                    const subtask = getTaskById(taskId)
                                                    return subtask ? (
                                                        <div key={taskId} className="flex items-center gap-2 p-2 border rounded-md">
                                                            {getTypeIcon(subtask.type.toLowerCase() as TaskType)}
                                                            <span className="text-sm">{subtask.title}</span>
                                                            <Badge className={cn(getStatusColor(subtask.status))}>
                                                                {getStatusLabel(subtask.status)}
                                                            </Badge>
                                                        </div>
                                                    ) : null
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Details</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Type:</span>
                                                <span className="font-medium flex items-center gap-1">
                                                  {getTypeIcon(selectedTask.type.toLowerCase() as TaskType)} {getTypeLabel(selectedTask.type.toLowerCase() as TaskType)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Priority:</span>
                                                <span className="font-medium flex items-center gap-1">
                                                  {getPriorityIcon(selectedTask.priority.toLowerCase() as TaskPriority)} {getPriorityLabel(selectedTask.priority.toLowerCase() as TaskPriority)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Status:</span>
                                                <Badge className={cn(getStatusColor(selectedTask.status))}>
                                                    {getStatusLabel(selectedTask.status)}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Assignee:</span>
                                                <span className="font-medium">
                                                  {selectedTask.assignee_id
                                                      ? getUserById(selectedTask.assignee_id)?.name || "Unknown"
                                                      : "Unassigned"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Reporter:</span>
                                                <span className="font-medium">{getUserById(selectedTask.reporter_id)?.name || "Unknown"}</span>
                                            </div>
                                            {selectedTask.epic_id && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Epic:</span>
                                                    <span className="font-medium">{getEpicById(selectedTask.epic_id)?.title || "Unknown"}</span>
                                                </div>
                                            )}
                                            {selectedTask.due_date && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Due Date:</span>
                                                    <span className="font-medium">{format(new Date(selectedTask.due_date), "PPP")}</span>
                                                </div>
                                            )}
                                            {selectedTask.estimated_hours !== undefined && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Estimated:</span>
                                                    <span className="font-medium">{selectedTask.estimated_hours} hours</span>
                                                </div>
                                            )}
                                            {selectedTask.actual_hours !== undefined && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Actual:</span>
                                                    <span className="font-medium">{selectedTask.actual_hours} hours</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Created:</span>
                                                <span className="font-medium">{format(new Date(selectedTask.created_at), "PPP")}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Updated:</span>
                                                <span className="font-medium">{format(new Date(selectedTask.updated_at), "PPP")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    {selectedTask.labels.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Labels</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTask.labels.map((label) => (
                                                    <Badge key={label} variant="outline">
                                                        {label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsViewDialogOpen(false)
                                        setIsEditDialogOpen(true)
                                    }}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Task
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Comment Dialog */}
            <Dialog
                open={isAddCommentDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddCommentDialogOpen(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                        <DialogDescription>Add a comment to this task.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="comment">Comment</Label>
                            <Textarea
                                id="comment"
                                placeholder="Enter your comment"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCommentDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                            Add Comment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Task Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsDeleteDialogOpen(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTask && (
                        <div className="py-4">
                            <div className="p-4 border rounded-md">
                                <h4 className="font-medium">{selectedTask.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedTask.description.length > 100
                                        ? `${selectedTask.description.substring(0, 100)}...`
                                        : selectedTask.description}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTask} disabled={isSaving}>
                            {isSaving ? "Deleting..." : "Delete Task"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface TaskCardProps {
    task: TasksSchema
    assignee: UserSchema | undefined
    epic: EpicSchema | undefined
    onView: () => void
    onEdit: () => void
    onDelete: () => void
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

function TaskCard({ task, assignee, epic, onView, onEdit, onDelete, onStatusChange }: TaskCardProps) {
    return (
        <Card className="hover:border-primary transition-colors" onClick={onView}>
            <CardContent className="p-3">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1">
                            {getTypeIcon(task.type.toLowerCase() as TaskType)}
                            <span className="text-xs text-muted-foreground">{task.id}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onView}>
                                    <PanelRight className="mr-2 h-4 w-4" />
                                    View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onEdit}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {/* Status Change Menu */}
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "on_hold")}
                                    disabled={task.status === "on_hold"}
                                    className={task.status === "on_hold" ? "bg-muted" : ""}
                                >
                                    <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                    On Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "blocked")}
                                    disabled={task.status === "blocked"}
                                    className={task.status === "blocked" ? "bg-muted" : ""}
                                >
                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                    Blocked
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "in_progress")}
                                    disabled={task.status === "in_progress"}
                                    className={task.status === "in_progress" ? "bg-muted" : ""}
                                >
                                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                    In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "review")}
                                    disabled={task.status === "review"}
                                    className={task.status === "review" ? "bg-muted" : ""}
                                >
                                    <Users className="mr-2 h-4 w-4 text-purple-500" />
                                    Review
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "done")}
                                    disabled={task.status === "done"}
                                    className={task.status === "done" ? "bg-muted" : ""}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Done
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-sm cursor-pointer hover:text-primary">
                            {task.title}
                        </h3>
                        <Badge className={cn(getStatusColor(task.status), "shrink-0")}>{getStatusLabel(task.status)}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {task.labels.slice(0, 3).map((label) => (
                            <Badge key={label} variant="outline" className="text-xs">
                                {label}
                            </Badge>
                        ))}
                        {task.labels.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{task.labels.length - 3}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            {getPriorityIcon(task.priority.toLowerCase() as TaskPriority)}
                            <span>{getPriorityLabel(task.priority.toLowerCase() as TaskPriority)}</span>
                        </div>

                        {task.due_date && (
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{format(new Date(task.due_date), "MMM d")}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                        {assignee ? (
                            <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px]">{getInitials(assignee.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{assignee.name}</span>
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">Unassigned</div>
                        )}

                        {epic && (
                            <div
                                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-sm"
                                style={{ backgroundColor: `${epic.color}20`, color: epic.color }}
                            >
                                <Link className="h-3 w-3" />
                                <span>{epic.title}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

