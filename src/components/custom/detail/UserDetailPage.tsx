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
import {useEffect, useState} from "react";
import {UserSchema} from "@/types/user";
import {getInitials} from "@/lib/initial";
import {supabase} from "@/lib/supabase";

export default function UserDetailPage({ userId }: { userId: string }) {
    const [user, setUser] = useState<UserSchema | null>(null)
    const [userAllocations, setUserAllocations] = useState<any[]>([])
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()

    const processedUserId = userId.replace("%7C", "|")

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("id", processedUserId)
                .single()

            if (userError || !userData) return
            setUser(userData)

            const { data: allocationsData, error: allocationsError } = await supabase
                .from("allocations")
                .select("id, user_id, project_id")
                .eq("user_id", processedUserId)

            if (allocationsError || !allocationsData) return

            const projectIds = allocationsData.map((a) => a.project_id)

            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("id, project_name, client, status")
                .in("id", projectIds)

            if (projectsError || !projectsData) return

            const enrichedAllocations = allocationsData.map((allocation) => {
                const project = projectsData.find((p) => p.id === allocation.project_id)
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

        fetchUserData()
    }, [userId])

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
                {/* User Profile Card */}
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

                {/* Project Allocations */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="allocations" className="w-full">
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="allocations">Project Allocations</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        </TabsList>

                        <TabsContent value="allocations" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Allocations</CardTitle>
                                    <CardDescription>Projects this user is currently allocated to</CardDescription>
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
        </div>
    )
}

