"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {format, isAfter, isBefore, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addMonths, addQuarters, addYears, subMonths, subQuarters, subYears,} from "date-fns"
import {CalendarIcon, Check, ChevronLeft, ChevronRight, Clock, Edit, MoreHorizontal, Plus, Target, Trash2,} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {useEffect, useMemo, useState} from "react";
import {DepartmentSchema} from "@/types/department";
import {supabase} from "@/lib/supabase";
import {TeamSchema} from "@/types/team";
import {GoalSchema} from "@/types/goals";
import {TaskSchema} from "@/types/tasks";
import {getInitials} from "@/lib/naming_initials";
import {UserSchema} from "@/types/user";

type GoalPeriod = "monthly" | "quarterly" | "yearly"
type GoalLevel = "individual" | "team" | "department"
type GoalStatus = "not_started" | "in_progress" | "completed" | "cancelled"
type GoalPriority = "low" | "medium" | "high" | "critical"

const goalFormSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }),
    period_evaluation: z.enum(["monthly", "quarterly", "yearly"]),
    level: z.enum(["individual", "team", "department"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    start_date: z.date(),
    end_date: z.date(),
    owner_id: z.string().min(1, { message: "Owner is required." }),
    team_id: z.string().optional(),
    department_id: z.string().optional(),
})

const getStatusColor = (status: GoalStatus) => {
    switch (status) {
        case "not_started":
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
        case "in_progress":
            return "bg-blue-100 text-blue-800 hover:bg-blue-100"
        case "completed":
            return "bg-green-100 text-green-800 hover:bg-green-100"
        case "cancelled":
            return "bg-red-100 text-red-800 hover:bg-red-100"
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
}

const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
        case "low":
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
        case "medium":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        case "high":
            return "bg-orange-100 text-orange-800 hover:bg-orange-100"
        case "critical":
            return "bg-red-100 text-red-800 hover:bg-red-100"
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
}

const getPeriodLabel = (period: GoalPeriod) => {
    switch (period) {
        case "monthly":
            return "Monthly"
        case "quarterly":
            return "Quarterly"
        case "yearly":
            return "Yearly"
        default:
            return "Unknown"
    }
}

const getLevelLabel = (level: GoalLevel) => {
    switch (level) {
        case "individual":
            return "Individual"
        case "team":
            return "Team"
        case "department":
            return "Department"
        default:
            return "Unknown"
    }
}

const getStatusLabel = (status: GoalStatus) => {
    switch (status) {
        case "not_started":
            return "Not Started"
        case "in_progress":
            return "In Progress"
        case "completed":
            return "Completed"
        case "cancelled":
            return "Cancelled"
        default:
            return "Unknown"
    }
}

const getPriorityLabel = (priority: GoalPriority) => {
    switch (priority) {
        case "low":
            return "Low"
        case "medium":
            return "Medium"
        case "high":
            return "High"
        case "critical":
            return "Critical"
        default:
            return "Unknown"
    }
}

export default function GoalsDashboardPage() {

    const [departments, setDepartments] = useState<DepartmentSchema[]>([])
    const [teams, setTeams] = useState<TeamSchema[]>([])
    const [goals, setGoals] = useState<GoalSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])

    const [selectedGoal, setSelectedGoal] = useState<GoalSchema | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [currentPeriod, setCurrentPeriod] = useState<GoalPeriod>("quarterly")
    const [currentDate, setCurrentDate] = useState<Date>(new Date())

    const [filterLevel] = useState<GoalLevel | "all">("all")
    const [filterStatus] = useState<GoalStatus | "all">("all")
    const [filterOwner] = useState<string | "all">("all")
    const [searchQuery] = useState("")

    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const [{ data: departmentsData }, { data: teamsData }, { data: goalsData }, { data: usersData }] = await Promise.all([
                supabase.from("departments").select("*"),
                supabase.from("teams").select("*"),
                supabase.from("goals").select("*, tasks:tasks(*)"),
                supabase.from("users").select("*"),
            ])

            if (!departmentsData || !teamsData || !goalsData || !usersData) {
                console.error("Failed to fetch data from Supabase")
                return
            }

            const updatedGoals = updateGoalProgressAndStatus(goalsData)

            setDepartments(departmentsData)
            setTeams(teamsData)
            setGoals(updatedGoals)
            setUsers(usersData)
        }

        fetchData()
    }, [])

    const getDepartmentById = (department_id: string) => {
        return departments.find((dept) => dept.id === department_id)
    }

    const getTeamById = (team_id: string) => {
        return teams.find((team) => team.id === team_id)
    }

    const getUserById = (userId: string) => {
        return users.find((user) => user.id === userId)
    }

    const updateGoalProgressAndStatus = (goalsFromDb: GoalSchema[]) => {
        return goalsFromDb.map((goal) => {
            const total = goal.tasks?.length ?? 0
            const completed = goal.tasks?.filter((t) => t.completed).length ?? 0
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            let status: GoalStatus = goal.status
            if (progress === 100) {
                status = "completed"
            } else if (progress > 0) {
                status = "in_progress"
            } else {
                status = "not_started"
            }

            return {
                ...goal,
                progress,
                status,
            }
        })
    }

    const form = useForm<z.infer<typeof goalFormSchema>>({
        resolver: zodResolver(goalFormSchema),
    })

    useEffect(() => {
        if (isCreateDialogOpen) {
            form.reset({
                title: "",
                description: "",
                period_evaluation: "quarterly",
                level: "individual",
                priority: "medium",
                start_date: new Date(),
                end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                owner_id: users[0].id,
            })
        }
    }, [isCreateDialogOpen, form])

    useEffect(() => {
        if (isEditDialogOpen && selectedGoal) {
            form.reset({
                title: selectedGoal.title,
                description: selectedGoal.description ?? "",
                period_evaluation: selectedGoal.period_evaluation,
                level: selectedGoal.level,
                priority: selectedGoal.priority,
                start_date: new Date(selectedGoal.start_date),
                end_date: new Date(selectedGoal.end_date),
                owner_id: selectedGoal.owner_id,
                team_id: selectedGoal.team_id ?? undefined,
                department_id: selectedGoal.department_id ?? undefined,
            })
        }
    }, [isEditDialogOpen, selectedGoal, form])

    const handlePeriodChange = (period: GoalPeriod) => {
        setCurrentPeriod(period)
    }

    const navigateToPreviousPeriod = () => {
        if (currentPeriod === "monthly") {
            setCurrentDate(subMonths(currentDate, 1))
        } else if (currentPeriod === "quarterly") {
            setCurrentDate(subQuarters(currentDate, 1))
        } else {
            setCurrentDate(subYears(currentDate, 1))
        }
    }

    const navigateToNextPeriod = () => {
        if (currentPeriod === "monthly") {
            setCurrentDate(addMonths(currentDate, 1))
        } else if (currentPeriod === "quarterly") {
            setCurrentDate(addQuarters(currentDate, 1))
        } else {
            setCurrentDate(addYears(currentDate, 1))
        }
    }

    const navigateToCurrentPeriod = () => {
        setCurrentDate(new Date())
    }

    const getPeriodRangeLabel = () => {
        if (currentPeriod === "monthly") {
            return format(currentDate, "MMMM yyyy")
        } else if (currentPeriod === "quarterly") {
            const quarter = Math.floor(currentDate.getMonth() / 3) + 1
            return `Q${quarter} ${format(currentDate, "yyyy")}`
        } else {
            return format(currentDate, "yyyy")
        }
    }

    const getPeriodDateRange = () => {
        if (currentPeriod === "monthly") {
            return {
                start: startOfMonth(currentDate),
                end: endOfMonth(currentDate),
            }
        } else if (currentPeriod === "quarterly") {
            return {
                start: startOfQuarter(currentDate),
                end: endOfQuarter(currentDate),
            }
        } else {
            return {
                start: startOfYear(currentDate),
                end: endOfYear(currentDate),
            }
        }
    }

    const filteredGoals = useMemo(() => {
        const { start, end } = getPeriodDateRange()

        return goals.filter((goal) => {
            // Filter by period
            const goalStart = new Date(goal.start_date)
            const goalEnd = new Date(goal.end_date)

            const isPeriodMatch =
                (isBefore(goalStart, end) || goalStart.getTime() === end.getTime()) &&
                (isAfter(goalEnd, start) || goalEnd.getTime() === start.getTime())

            // Filter by level
            const isLevelMatch = filterLevel === "all" || goal.level === filterLevel

            // Filter by status
            const isStatusMatch = filterStatus === "all" || goal.status === filterStatus

            // Filter by owner
            const isOwnerMatch = filterOwner === "all" || goal.owner_id === filterOwner

            // Filter by search query
            const isSearchMatch =
                searchQuery === "" ||
                goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (goal.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())

            return isPeriodMatch && isLevelMatch && isStatusMatch && isOwnerMatch && isSearchMatch
        })
    }, [goals, currentPeriod, currentDate, filterLevel, filterStatus, filterOwner, searchQuery])

    const onSubmit = (data: z.infer<typeof goalFormSchema>) => {
        setIsSaving(true)

        const formattedData = {
            ...data,
            start_date: data.start_date,
            end_date: data.end_date,
            updatedAt: new Date(),
        }

        if (isEditDialogOpen && selectedGoal) {
            const updatedGoals: GoalSchema[] = goals.map((goal) => {
                if (goal.id === selectedGoal.id) {
                    return {
                        ...goal,
                        ...formattedData,
                    }
                }
                return goal
            })

            setGoals(updatedGoals)
            setIsEditDialogOpen(false)
        } else {
            const newGoal: GoalSchema = {
                id: `goal-${Date.now()}`,
                ...formattedData,
                status: "not_started",
                progress: 0,
                created_at: new Date(),
                updated_at: new Date(),
            }

            setGoals([...goals, newGoal])
            setIsCreateDialogOpen(false)
        }

        setTimeout(() => {
            setIsSaving(false)
        }, 1000)
    }

    const handleDeleteGoal = () => {
        if (!selectedGoal) return

        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            const updatedGoals = goals.filter((goal) => goal.id !== selectedGoal.id)
            setGoals(updatedGoals)
            setIsDeleteDialogOpen(false)
            setSelectedGoal(null)

            setIsSaving(false)
        }, 1000)
    }

    const handleTaskToggle = (goalId: string, taskId: string, completed: boolean) => {
        const updatedGoals = goals.map((goal) => {
            if (goal.id === goalId) {
                const updatedTasks = (goal.tasks ?? []).map((task) => {
                        if (task.id === taskId) {
                        return { ...task, completed }
                    }
                    return task
                })

                // Calculate new progress
                const totalTasks = updatedTasks.length
                const completedTasks = updatedTasks.filter((task) => task.completed).length
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                // Update status if all tasks are completed
                let status = goal.status
                if (progress === 100 && goal.status !== "completed") {
                    status = "completed"
                } else if (progress < 100 && goal.status === "completed") {
                    status = "in_progress"
                }

                return {
                    ...goal,
                    tasks: updatedTasks,
                    progress,
                    status,
                    updatedAt: new Date(),
                }
            }
            return goal
        })

        setGoals(updatedGoals)

        // Update selected goal if it's the one being modified
        if (selectedGoal && selectedGoal.id === goalId) {
            const updatedGoal = updatedGoals.find((g) => g.id === goalId)
            if (updatedGoal) {
                setSelectedGoal({
                    ...updatedGoal,
                    team_id: updatedGoal.team_id ?? undefined,
                    department_id: updatedGoal.department_id ?? undefined,
                    description: updatedGoal.description ?? "",
                    tasks: updatedGoal.tasks ?? [],
                })
            }
        }
    }

    const handleAddTask = () => {
        if (!selectedGoal || !newTaskTitle.trim()) return

        const newTask: TaskSchema = {
            id: `task-${Date.now()}`,
            title: newTaskTitle,
            completed: false,
            goalId: selectedGoal.id,
            created_at: new Date(),
            updated_at: new Date(),
        }

        const updatedGoals = goals.map((goal) => {
            if (goal.id === selectedGoal.id) {
                const updatedTasks = [...(goal.tasks ?? []), newTask]

                // Calculate new progress
                const totalTasks = updatedTasks.length
                const completedTasks = updatedTasks.filter((task) => task.completed).length
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                // Update status if needed
                let status = goal.status
                if (goal.status === "not_started") {
                    status = "in_progress"
                }

                return {
                    ...goal,
                    tasks: updatedTasks,
                    progress,
                    status,
                    updatedAt: new Date(),
                }
            }
            return goal
        })

        setGoals(updatedGoals)

        const updatedGoal = updatedGoals.find((g) => g.id === selectedGoal.id)
        if (updatedGoal) {
            setSelectedGoal({
                ...updatedGoal,
                team_id: updatedGoal.team_id ?? undefined,
                department_id: updatedGoal.department_id ?? undefined,
                description: updatedGoal.description ?? "",
                tasks: updatedGoal.tasks ?? [],
            })
        }

        setNewTaskTitle("")
        setIsAddTaskDialogOpen(false)
    }

    const handleDeleteTask = (goalId: string, taskId: string) => {
        const updatedGoals = goals.map((goal) => {
            if (goal.id === goalId) {
                const currentTasks = goal.tasks ?? []
                const updatedTasks = currentTasks.filter((task) => task.id !== taskId)

                // Calculate new progress
                const totalTasks = updatedTasks.length
                const completedTasks = updatedTasks.filter((task) => task.completed).length
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                return {
                    ...goal,
                    tasks: updatedTasks,
                    progress,
                    updatedAt: new Date(),
                }
            }
            return goal
        })

        setGoals(updatedGoals)

        // Update selected goal if it's the one being modified
        if (selectedGoal && selectedGoal.id === goalId) {
            const updatedGoal = updatedGoals.find((g) => g.id === goalId)
            if (updatedGoal) {
                setSelectedGoal({
                    ...updatedGoal,
                    team_id: updatedGoal.team_id ?? undefined,
                    department_id: updatedGoal.department_id ?? undefined,
                    description: updatedGoal.description ?? "",
                    tasks: updatedGoal.tasks ?? [],
                })
            }
        }
    }

    const handleUpdateGoalStatus = (goalId: string, status: GoalStatus) => {
        const updatedGoals = goals.map((goal) => {
            if (goal.id === goalId) {
                // If marking as completed, set progress to 100%
                const progress = status === "completed" ? 100 : goal.progress

                return {
                    ...goal,
                    status,
                    progress: status === "completed" ? 100 : progress,
                    updatedAt: new Date(),
                }
            }
            return goal
        })

        setGoals(updatedGoals)

        // Update selected goal if it's the one being modified
        if (selectedGoal && selectedGoal.id === goalId) {
            const updatedGoal = updatedGoals.find((g) => g.id === goalId)
            if (updatedGoal) {
                setSelectedGoal({
                    ...updatedGoal,
                    team_id: updatedGoal.team_id ?? undefined,
                    department_id: updatedGoal.department_id ?? undefined,
                    description: updatedGoal.description ?? "",
                    tasks: updatedGoal.tasks ?? [],
                })
            }
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">Goals</h1>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Goal
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-2/3 space-y-4">
                    {/* Period selector */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={navigateToPreviousPeriod}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-lg font-medium min-w-[150px] text-center">{getPeriodRangeLabel()}</div>
                                    <Button variant="outline" size="sm" onClick={navigateToNextPeriod}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={navigateToCurrentPeriod}>
                                        Today
                                    </Button>
                                </div>
                                <Tabs
                                    defaultValue="quarterly"
                                    value={currentPeriod}
                                    onValueChange={(value) => handlePeriodChange(value as GoalPeriod)}
                                    className="w-full sm:w-auto"
                                >
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                        <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Goals list */}
                    <div className="space-y-4">
                        {filteredGoals.length > 0 ? (
                            filteredGoals.map((goal) => {
                                const owner = getUserById(goal.owner_id)
                                const team = goal.team_id ? getTeamById(goal.team_id) : null
                                const department = goal.department_id ? getDepartmentById(goal.department_id) : null

                                return (
                                    <Card key={goal.id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Progress bar */}
                                                <div
                                                    className={cn("w-full md:w-1 h-1 md:h-auto", {
                                                        "bg-red-500": goal.progress <= 33,
                                                        "bg-yellow-400": goal.progress > 33 && goal.progress <= 66,
                                                        "bg-green-500": goal.progress > 66,
                                                    })}
                                                />

                                                <div className="flex-1 p-4">
                                                    <div className="flex flex-col md:flex-row justify-between gap-2">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-medium">{goal.title}</h3>
                                                                <Badge
                                                                    className={cn(getStatusColor(goal.status))}>{getStatusLabel(goal.status)}</Badge>
                                                                <Badge className={cn(getPriorityColor(goal.priority))}>
                                                                    {getPriorityLabel(goal.priority)}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedGoal({
                                                                        ...goal,
                                                                        description: goal.description ?? "",
                                                                        tasks: goal.tasks ?? [],
                                                                        team_id: goal.team_id ?? undefined,
                                                                        department_id: goal.department_id ?? undefined,
                                                                    })
                                                                    setIsViewDialogOpen(true)
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm"
                                                                            className="h-8 w-8 p-0">
                                                                        <span className="sr-only">Open menu</span>
                                                                        <MoreHorizontal className="h-4 w-4"/>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedGoal({
                                                                                ...goal,
                                                                                description: goal.description ?? "",
                                                                                tasks: goal.tasks ?? [],
                                                                                team_id: goal.team_id ?? undefined,
                                                                                department_id: goal.department_id ?? undefined,
                                                                            })
                                                                            setIsEditDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4"/>
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator/>
                                                                    {goal.status !== "completed" && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleUpdateGoalStatus(goal.id, "completed")}>
                                                                            <Check className="mr-2 h-4 w-4"/>
                                                                            Mark as Completed
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {goal.status === "completed" && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleUpdateGoalStatus(goal.id, "in_progress")}>
                                                                            <Clock className="mr-2 h-4 w-4"/>
                                                                            Mark as In Progress
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator/>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedGoal({
                                                                                ...goal,
                                                                                description: goal.description ?? "",
                                                                                tasks: goal.tasks ?? [],
                                                                                team_id: goal.team_id ?? undefined,
                                                                                department_id: goal.department_id ?? undefined,
                                                                            })
                                                                            setIsDeleteDialogOpen(true)
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-col sm:flex-row justify-between">
                                                        <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
                                                            <Badge
                                                                variant="outline">{getPeriodLabel(goal.period_evaluation)}</Badge>
                                                            <Badge variant="outline">{getLevelLabel(goal.level)}</Badge>
                                                            {team && <Badge variant="outline">Team: {team.name}</Badge>}
                                                            {department && <Badge
                                                                variant="outline">Dept: {department.name}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm text-muted-foreground">
                                                                {format(new Date(goal.start_date), "MMM d")} -{" "}
                                                                {format(new Date(goal.end_date), "MMM d, yyyy")}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">
                                                                        {owner ? getInitials(owner.name) : "??"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm">{owner?.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium">Progress</span>
                                                            <span
                                                                className="text-sm font-medium">{goal.progress}%</span>
                                                        </div>
                                                        <Progress
                                                            value={goal.progress}
                                                            className={cn("h-2", {
                                                                " [&>div]:bg-red-500": goal.progress <= 33,
                                                                " [&>div]:bg-yellow-500": goal.progress > 33 && goal.progress <= 66,
                                                                " [&>div]:bg-green-500": goal.progress > 66,
                                                            })}
                                                        />
                                                    </div>

                                                    {/* Tasks preview */}
                                                    {(goal.tasks?.length ?? 0) > 0 && (
                                                        <div className="mt-4">
                                                            <div className="text-sm font-medium mb-2">
                                                                Tasks
                                                                ({(goal.tasks ?? []).filter((t) => t.completed).length}/{goal.tasks?.length})
                                                            </div>
                                                            <div className="space-y-1">
                                                                {(goal.tasks ?? []).slice(0, 3).map((task) => (
                                                                    <div key={task.id}
                                                                         className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            id={`task-${task.id}`}
                                                                            checked={task.completed}
                                                                            onCheckedChange={(checked) =>
                                                                                handleTaskToggle(goal.id, task.id, checked as boolean)
                                                                            }
                                                                        />
                                                                        <label
                                                                            htmlFor={`task-${task.id}`}
                                                                            className={cn("text-sm", task.completed && "line-through text-muted-foreground")}
                                                                        >
                                                                            {task.title}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                                {(goal.tasks?.length ?? 0) > 3 && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        +{(goal.tasks?.length ?? 0) - 3} more tasks
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Target className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-medium">No goals found</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No goals match your current filters. Try adjusting your filters or create a new goal.
                                    </p>
                                    <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Goal
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="md:w-1/3 space-y-4">
                    {/* Summary card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>Overview of goals for {getPeriodRangeLabel()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Total Goals</span>
                                        <span className="text-sm font-medium">{filteredGoals.length}</span>
                                    </div>
                                    <Separator />
                                </div>

                                <div>
                                    <div className="text-sm font-medium mb-2">By Status</div>
                                    <div className="space-y-2">
                                        {["not_started", "in_progress", "completed", "cancelled"].map((status) => {
                                            const count = filteredGoals.filter((g) => g.status === status).length
                                            const percentage = filteredGoals.length > 0 ? Math.round((count / filteredGoals.length) * 100) : 0

                                            return (
                                                <div key={status} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>{getStatusLabel(status as GoalStatus)}</span>
                                                        <span>{count} ({percentage}%)</span>
                                                    </div>
                                                    <Progress
                                                        value={percentage}
                                                        className={cn("h-2", {
                                                            " [&>div]:bg-red-500": percentage <= 33,
                                                            " [&>div]:bg-yellow-500": percentage > 33 && percentage <= 66,
                                                            " [&>div]:bg-green-500": percentage > 66,
                                                        })}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-medium mb-2">By Level</div>
                                    <div className="space-y-2">
                                        {["individual", "team", "department"].map((level) => {
                                            const count = filteredGoals.filter((g) => g.level === level).length
                                            const percentage = filteredGoals.length > 0 ? Math.round((count / filteredGoals.length) * 100) : 0

                                            return (
                                                <div key={level} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>{getLevelLabel(level as GoalLevel)}</span>
                                                        <span>
                              {count} ({percentage}%)
                            </span>
                                                    </div>
                                                    <Progress
                                                        value={percentage}
                                                        className={cn("h-2", {
                                                            " [&>div]:bg-red-500": percentage <= 33,
                                                            " [&>div]:bg-yellow-500": percentage > 33 && percentage <= 66,
                                                            " [&>div]:bg-green-500": percentage > 66,
                                                        })}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-medium mb-2">By Priority</div>
                                    <div className="flex flex-wrap gap-2">
                                        {["low", "medium", "high", "critical"].map((priority) => {
                                            const count = filteredGoals.filter((g) => g.priority === priority).length

                                            return (
                                                <Badge key={priority} className={cn(getPriorityColor(priority as GoalPriority))}>
                                                    {getPriorityLabel(priority as GoalPriority)}: {count}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top contributors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Contributors</CardTitle>
                            <CardDescription>Users with the most goals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {users
                                    .map((user) => ({
                                        user,
                                        count: filteredGoals.filter((g) => g.owner_id === user.id).length,
                                        completed: filteredGoals.filter((g) => g.owner_id === user.id && g.status === "completed").length,
                                    }))
                                    .filter((item) => item.count > 0)
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, 5)
                                    .map(({ user, count, completed }) => (
                                        <div key={user.id} className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.role}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{count} goals</p>
                                                <p className="text-xs text-muted-foreground">{completed} completed</p>
                                            </div>
                                        </div>
                                    ))}

                                {filteredGoals.length === 0 && (
                                    <div className="text-sm text-muted-foreground text-center py-2">No data available</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create/Edit Goal Dialog */}
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
                        <DialogTitle>{isEditDialogOpen ? "Edit Goal" : "Create New Goal"}</DialogTitle>
                        <DialogDescription>
                            {isEditDialogOpen ? "Update the details of your goal." : "Add a new goal to track your progress."}
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
                                            <Input placeholder="Enter goal title" {...field} />
                                        </FormControl>
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
                                            <Textarea placeholder="Describe your goal" className="min-h-[100px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <FormField
                                    control={form.control}
                                    name="period_evaluation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Period</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl className={"w-full"}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select period" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Level</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl className={"w-full"}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="individual">Individual</SelectItem>
                                                    <SelectItem value="team">Team</SelectItem>
                                                    <SelectItem value="department">Department</SelectItem>
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
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
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
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                                                                const date = e.target.value ? new Date(e.target.value) : new Date()
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

                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
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
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                                                                const date = e.target.value ? new Date(e.target.value) : new Date()
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl className={"w-full"}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="owner_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Owner</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl className={"w-full"}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select owner" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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

                            {form.watch("level") === "team" && (
                                <FormField
                                    control={form.control}
                                    name="team_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Team</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select team" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {teams.map((team) => (
                                                        <SelectItem key={team.id} value={team.id}>
                                                            {team.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {(form.watch("level") === "team" || form.watch("level") === "department") && (
                                <FormField
                                    control={form.control}
                                    name="department_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select department" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.id} value={dept.id}>
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

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
                                        "Update Goal"
                                    ) : (
                                        "Create Goal"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* View Goal Dialog */}
            <Dialog
                open={isViewDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsViewDialogOpen(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[600px]">
                    {selectedGoal && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <DialogTitle>{selectedGoal.title}</DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(getStatusColor(selectedGoal.status))}>
                                            {getStatusLabel(selectedGoal.status)}
                                        </Badge>
                                        <Badge className={cn(getPriorityColor(selectedGoal.priority))}>
                                            {getPriorityLabel(selectedGoal.priority)}
                                        </Badge>
                                    </div>
                                </div>
                                <DialogDescription>{selectedGoal.description}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Period</h4>
                                        <p className="text-sm">{getPeriodLabel(selectedGoal.period_evaluation)}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Level</h4>
                                        <p className="text-sm">{getLevelLabel(selectedGoal.level)}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Start Date</h4>
                                        <p className="text-sm">{format(new Date(selectedGoal.start_date), "PPP")}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">End Date</h4>
                                        <p className="text-sm">{format(new Date(selectedGoal.end_date), "PPP")}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-1">Owner</h4>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-xs">
                                                {getUserById(selectedGoal.owner_id)
                                                    ? getInitials(getUserById(selectedGoal.owner_id)!.name)
                                                    : "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{getUserById(selectedGoal.owner_id)?.name || "Unknown"}</span>
                                    </div>
                                </div>

                                {selectedGoal.team_id && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Team</h4>
                                        <p className="text-sm">{getTeamById(selectedGoal.team_id)?.name || "Unknown"}</p>
                                    </div>
                                )}

                                {selectedGoal.department_id && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Department</h4>
                                        <p className="text-sm">{getDepartmentById(selectedGoal.department_id)?.name || "Unknown"}</p>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-medium">Progress</h4>
                                        <span className="text-sm font-medium">{selectedGoal.progress}%</span>
                                    </div>
                                    <Progress
                                        value={selectedGoal.progress}
                                        className={cn("h-2", {
                                            " [&>div]:bg-red-500": selectedGoal.progress <= 33,
                                            " [&>div]:bg-yellow-500": selectedGoal.progress > 33 && selectedGoal.progress <= 66,
                                            " [&>div]:bg-green-500": selectedGoal.progress > 66,
                                        })}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">Tasks</h4>
                                        <Button variant="outline" size="sm" onClick={() => setIsAddTaskDialogOpen(true)}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Task
                                        </Button>
                                    </div>

                                    {(selectedGoal.tasks?.length ?? 0) > 0 ? (
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                            {(selectedGoal.tasks ?? []).map((task) => (
                                                <div key={task.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`view-task-${task.id}`}
                                                            checked={task.completed}
                                                            onCheckedChange={(checked) =>
                                                                handleTaskToggle(selectedGoal.id, task.id, checked as boolean)
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`view-task-${task.id}`}
                                                            className={cn("text-sm", task.completed && "line-through text-muted-foreground")}
                                                        >
                                                            {task.title}
                                                        </label>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleDeleteTask(selectedGoal.id, task.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="sr-only">Delete task</span>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                                            No tasks added yet
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
                                    Edit Goal
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Task Dialog */}
            <Dialog
                open={isAddTaskDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddTaskDialogOpen(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Task</DialogTitle>
                        <DialogDescription>Add a new task to track progress towards this goal.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Task Title</Label>
                            <Input
                                id="task-title"
                                placeholder="Enter task title"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                            Add Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Goal Dialog */}
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
                        <DialogTitle>Delete Goal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this goal? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedGoal && (
                        <div className="py-4">
                            <div className="p-4 border rounded-md">
                                <h4 className="font-medium">{selectedGoal.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{selectedGoal.description}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteGoal} disabled={isSaving}>
                            {isSaving ? "Deleting..." : "Delete Goal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

