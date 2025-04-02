"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, CheckCircle, ClipboardList, Mail, MapPin, Shield, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,} from "@/components/ui/alert-dialog"
import {useEffect, useMemo, useState} from "react";
import {UserAllocation, UserSchema} from "@/types/user";
import {getInitials} from "@/lib/naming_initials";
import {supabase} from "@/lib/supabase";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {project_roles} from "@/types/roles";

export default function UserDetailPage({ userId }: { userId: string }) {
    const [user, setUser] = useState<UserSchema | null>(null)
    const [userAllocations, setUserAllocations] = useState<UserAllocation[]>([])
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()

    const [showAllocateDialog, setShowAllocateDialog] = useState(false)
    const [projects, setProjects] = useState<{ id: string; project_name: string }[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("2999-12-31")
    const [percentage, setPercentage] = useState<number>(0)
    const [projectRole, setProjectRole] = useState<string>("")

    const processedUserId = useMemo(() => userId.replace("%7C", "|"), [userId])

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: userData, error: userError } = await supabase
                .from("users").select("*")
                .eq("id", processedUserId).single()

            if (userError || !userData) return
            setUser(userData)

            const { data: allocationsData, error: allocationsError } = await supabase
                .from("allocations").select("id, user_id, project_id, percentage, role, start_date, end_date")
                .eq("user_id", processedUserId)

            if (allocationsError || !allocationsData) return

            const projectIds = allocationsData.map((a) => a.project_id)

            const { data: projectsData, error: projectsError } = await supabase
                .from("projects").select("id, project_name, client, status")
                .in("id", projectIds)

            if (projectsError || !projectsData) return

            const enrichedAllocations = allocationsData.map((allocation) => {
                const project = projectsData.find((p) => p.id === allocation.project_id)
                return {
                    ...allocation,
                    project: project
                        ? {
                            id: project.id,
                            projectName: project.project_name,
                            client: project.client,
                            status: project.status,
                        }
                        : undefined,
                }
            })

            setUserAllocations(enrichedAllocations)
        }

        fetchUserData()
    }, [processedUserId])

    useEffect(() => {
        if (showAllocateDialog) {
            supabase
                .from("projects")
                .select("id, project_name")
                .then(({ data }) => {
                    if (data) setProjects(data)
                })
        }
    }, [showAllocateDialog])

    const handleAllocate = async () => {
        if (!selectedProjectId || !user) return

        console.log("Allocating user to project:", selectedProjectId)
        console.log("User ID:", processedUserId)

        const { error } = await supabase.from("allocations").insert({
            user_id: user.id,
            project_id: selectedProjectId,
            start_date: startDate,
            end_date: endDate || null,
            percentage,
            role: projectRole,
        })

        if (error) {
            console.error("Error allocating user:", error)
            return
        }

        setShowAllocateDialog(false)
        setSelectedProjectId(null)
        setStartDate("")
        setEndDate("")
        setPercentage(0)
        setProjectRole("")

        const { data: newAllocations, error: allocationsError } = await supabase
            .from("allocations").select("id, user_id, project_id, percentage, role, start_date, end_date")
            .eq("user_id", processedUserId)

        if (!allocationsError && newAllocations) {
            const projectIds = newAllocations.map((a) => a.project_id)
            const { data: newProjects } = await supabase
                .from("projects").select("id, project_name, client, status")
                .in("id", projectIds)

            const enrichedAllocations = newAllocations.map((allocation) => {
                const project = newProjects?.find((p) => p.id === allocation.project_id)
                return {
                    ...allocation,
                    project: project ? {
                        id: project.id,
                        projectName: project.project_name,
                        client: project.client,
                        status: project.status,
                    } : undefined,
                }
            })

            setUserAllocations(enrichedAllocations)
        }
    }

    const handleActivateUser = async () => {
        if (!user) return
        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("users").update({ status: "Active" })
                .eq("id", user.id)

            if (error) {
                console.error("Error updating user status:", error)
                return
            }
            setUser({ ...user, status: "Active" })

        } catch (error) {
            console.error("Unexpected error:", error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeactivateUser = async () => {
        if (!user) return
        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("users").update({ status: "Inactive" })
                .eq("id", user.id)

            if (error) {
                console.error("Error updating user status:", error)
                return
            }
            setUser({ ...user, status: "Inactive" })

        } catch (error) {
            console.error("Unexpected error:", error)
        } finally {
            setIsUpdating(false)
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <div className="text-lg font-medium">User not found</div>
                    <p className="text-muted-foreground">The requested user could not be found.</p>
                    <Button className="mt-4" onClick={() => router.push("/users")}>
                        Back to Users
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => router.push("/users")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">User Details</h1>
                </div>
                <div className="flex items-center gap-2">
                    {user.status === "Pending" && (
                        <Button onClick={handleActivateUser} disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Activating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate User
                                </>
                            )}
                        </Button>
                    )}

                    {user.status === "Active" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline">Deactivate User</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to deactivate this user? They will no longer be able to access the system.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeactivateUser}
                                        className="bg-red-400 text-white hover:bg-red-600"
                                    >
                                        {isUpdating ? "Deactivating..." : "Deactivate"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {user.status === "Inactive" && (
                        <Button onClick={handleActivateUser} disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Activating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate User
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle>Profile</CardTitle>
                            <Badge
                                className={cn(
                                    user.status === "Active"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : user.status === "Inactive"
                                            ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                                )}
                            >
                                {user.status}
                            </Badge>
                        </div>
                        <CardDescription>User information and details</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center pt-6">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-muted-foreground">{user.role}</p>

                        <div className="w-full mt-6 space-y-4">
                            <div className="flex items-start gap-2">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">Email</div>
                                    <div>{user.email}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">Location</div>
                                    <div>{user.location}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">Department</div>
                                    <div>{user.department}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">Role</div>
                                    <div>{user.role}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">User ID</div>
                                    <div className="font-mono text-sm">{user.id}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2">
                    <Tabs defaultValue="allocations" className="w-full">
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="allocations">Project Allocations</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        </TabsList>

                        <TabsContent value="allocations" className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Project Allocations</CardTitle>
                                        <CardDescription>Projects this user is currently allocated to</CardDescription>
                                    </div>
                                    <Button onClick={() => setShowAllocateDialog(true)}>
                                        + Allocate to Project
                                    </Button>
                                </CardHeader>

                                <CardContent>
                                    {userAllocations.length > 0 ? (
                                        <div className="border rounded-md overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Project</TableHead>
                                                        <TableHead>Client</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Percentage</TableHead>
                                                        <TableHead>Allocation ID</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {userAllocations.map((allocation) => (
                                                        <TableRow key={allocation.id}>
                                                            <TableCell className="font-medium">{allocation.project?.projectName}</TableCell>
                                                            <TableCell>{allocation.project?.client}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={cn(
                                                                        allocation.project?.status === "Active"
                                                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                            : allocation.project?.status === "Inactive"
                                                                                ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                                                : allocation.project?.status === "Pending"
                                                                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                                                    : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                                                    )}
                                                                >
                                                                    {allocation.project?.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{(allocation.percentage*100)}%</TableCell>
                                                            <TableCell className="font-mono text-xs">{allocation.id}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-medium">No Project Allocations</h3>
                                            <p className="text-muted-foreground max-w-sm mt-2">
                                                This user is not currently allocated to any projects.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Log</CardTitle>
                                    <CardDescription>Recent user activity and system events</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { date: "2023-03-25", event: "User account created", type: "system" },
                                            { date: "2023-03-25", event: "Added to ERP System Implementation project", type: "project" },
                                            { date: "2023-03-28", event: "First login", type: "auth" },
                                            { date: "2023-04-02", event: "Added to Cloud Migration project", type: "project" },
                                            { date: "2023-04-15", event: "Password changed", type: "auth" },
                                        ].map((activity, index) => (
                                            <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                                                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <p className="font-medium">{activity.event}</p>
                                                        <Badge variant="outline">{activity.type}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
                <DialogContent className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Allocate to a Project</DialogTitle>
                    </DialogHeader>

                    <Select onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.project_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2 text-sm"
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2 text-sm"
                        onChange={(e) => setEndDate(e.target.value)}
                        value={endDate}
                        placeholder="End Date"
                    />

                    <div className="relative w-full">
                        <input
                            type="number"
                            min={1}
                            max={100}
                            className="w-full border rounded px-3 py-2 pr-10 text-sm"
                            placeholder="Allocation Percentage"
                            onChange={(e) => {
                                const value = Number(e.target.value)
                                setPercentage(value / 100)
                            }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                            %
                        </span>
                    </div>

                    <Select onValueChange={(value) => setProjectRole(value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a role"/>
                        </SelectTrigger>
                        <SelectContent>
                            {project_roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DialogFooter>
                        <Button
                            onClick={handleAllocate}
                            disabled={!selectedProjectId || !startDate || !percentage || !projectRole}
                            className="w-full"
                        >
                            Confirm Allocation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}

