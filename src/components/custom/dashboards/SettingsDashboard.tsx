"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {AlertTriangle, Bell, Clock, Download, HelpCircle, Info, Key, Lock, Mail, Save, Settings, Shield, FileText,} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {useEffect, useState} from "react";
import {UserSchema} from "@/types/user";
import {supabase} from "@/lib/supabase";
import {getUserInitialsByName} from "@/lib/user_name";
import {useSidebar} from "@/context/sidebar-context";

const notificationsFormSchema = z.object({
    emailNotifications: z.boolean().default(true),
    reminderNotifications: z.boolean().default(true),
    approvalNotifications: z.boolean().default(true),
    weeklyReportNotifications: z.boolean().default(false),
    reminderTime: z.string().optional(),
})

const timeTrackingFormSchema = z.object({
    defaultWorkingHours: z.coerce.number().min(1).max(24).default(8),
    workWeekDays: z.array(z.string()).default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
    timeFormat: z.enum(["12h", "24h"]).default("24h"),
    dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("YYYY-MM-DD"),
    defaultView: z.enum(["day", "week", "month"]).default("week"),
    autoSubmitEntries: z.boolean().default(false),
})

const securityFormSchema = z.object({
    twoFactorAuth: z.boolean().default(false),
    sessionTimeout: z.enum(["15m", "30m", "1h", "4h", "8h"]).default("4h"),
    allowMultipleSessions: z.boolean().default(true),
})

const adminFormSchema = z.object({
    requireApproval: z.boolean().default(true),
    allowOvertime: z.boolean().default(true),
    allowTimeEditing: z.enum(["anytime", "sameDay", "sameWeek", "never"]).default("sameWeek"),
    lockPastEntries: z.boolean().default(false),
    lockPastEntriesDays: z.coerce.number().min(1).max(90).default(30),
})

export default function SettingsDashboard({ session }: { session: { user: { sub: string; email?: string; name?: string } } }) {
    const [currentUser, setCurrentUser] = useState<UserSchema | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const { isCollapsed } = useSidebar();

    const router = useRouter()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.sub)
                .single()

            if (error) {
                console.error("Error fetching current user", error)
            } else {
                setCurrentUser(data)
                setIsAdmin(data.role === "Admin")
            }
        }

        fetchCurrentUser()
    }, [session])


    // Notifications form
    const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
        resolver: zodResolver(notificationsFormSchema),
        defaultValues: {
            emailNotifications: true,
            reminderNotifications: true,
            approvalNotifications: true,
            weeklyReportNotifications: false,
            reminderTime: "09:00",
        },
    })

    // Time tracking form
    const timeTrackingForm = useForm<z.infer<typeof timeTrackingFormSchema>>({
        resolver: zodResolver(timeTrackingFormSchema),
        defaultValues: {
            defaultWorkingHours: 8,
            workWeekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            timeFormat: "24h",
            dateFormat: "YYYY-MM-DD",
            defaultView: "week",
            autoSubmitEntries: false,
        },
    })

    // Security form
    const securityForm = useForm<z.infer<typeof securityFormSchema>>({
        resolver: zodResolver(securityFormSchema),
        defaultValues: {
            twoFactorAuth: false,
            sessionTimeout: "4h",
            allowMultipleSessions: true,
        },
    })

    // Admin form
    const adminForm = useForm<z.infer<typeof adminFormSchema>>({
        resolver: zodResolver(adminFormSchema),
        defaultValues: {
            requireApproval: true,
            allowOvertime: true,
            allowTimeEditing: "sameWeek",
            lockPastEntries: false,
            lockPastEntriesDays: 30,
        },
    })

    // Handle notifications form submission
    function onNotificationsSubmit(data: z.infer<typeof notificationsFormSchema>) {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            console.log("Notifications data:", data)
            setIsSaving(false)
        }, 1000)
    }

    // Handle time tracking form submission
    function onTimeTrackingSubmit(data: z.infer<typeof timeTrackingFormSchema>) {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            console.log("Time tracking data:", data)
            setIsSaving(false)
        }, 1000)
    }

    // Handle security form submission
    function onSecuritySubmit(data: z.infer<typeof securityFormSchema>) {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            console.log("Security data:", data)
            setIsSaving(false)
        }, 1000)
    }

    // Handle admin form submission
    function onAdminSubmit(data: z.infer<typeof adminFormSchema>) {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            console.log("Admin data:", data)
            setIsSaving(false)
        }, 1000)
    }

    // Handle password change
    function onPasswordChange(data: { currentPassword: string; newPassword: string }) {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            console.log("Password data:", data)
            setIsSaving(false)
            setIsPasswordDialogOpen(false)
        }, 1000)
    }

    // Handle account deletion
    function onDeleteAccount() {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false)
            setIsDeleteDialogOpen(false)

            // Redirect to login page after a short delay
            setTimeout(() => {
                router.push("/")
            }, 2000)
        }, 1500)
    }

    // Handle data export
    function onExportData() {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false)
            setIsExportDialogOpen(false)
        }, 1500)
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="container mx-auto py-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-2xl font-bold">Settings</h1>
                    </div>
                </div>

                <Tabs defaultValue="notifications" className="w-full">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="md:w-1/4">
                            <div className="space-y-1">
                                {currentUser && (
                                    <div className="flex items-center gap-3 mb-6">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="text-xs">
                                                {getUserInitialsByName(currentUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{currentUser.name}</div>
                                            <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                                        </div>
                                    </div>
                                )}

                                <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                                    <TabsTrigger value="notifications" className="justify-start px-3 py-2 h-9 font-normal">
                                        <Bell className="h-4 w-4 mr-2" />
                                        Notifications
                                    </TabsTrigger>
                                    <TabsTrigger value="time-tracking" className="justify-start px-3 py-2 h-9 font-normal">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Time Tracking
                                    </TabsTrigger>
                                    <TabsTrigger value="security" className="justify-start px-3 py-2 h-9 font-normal">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Security
                                    </TabsTrigger>
                                    {isAdmin && (
                                        <TabsTrigger value="admin" className="justify-start px-3 py-2 h-9 font-normal">
                                            <Shield className="h-4 w-4 mr-2" />
                                            Admin Settings
                                        </TabsTrigger>
                                    )}
                                    <TabsTrigger value="account" className="justify-start px-3 py-2 h-9 font-normal">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Account
                                    </TabsTrigger>
                                    <TabsTrigger value="help" className="justify-start px-3 py-2 h-9 font-normal">
                                        <HelpCircle className="h-4 w-4 mr-2" />
                                        Help & Support
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-6">
                            {/* Notifications Settings */}
                            <TabsContent value="notifications" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold">Notification Settings</h2>
                                        <p className="text-sm text-muted-foreground">Manage how and when you receive notifications</p>
                                    </div>
                                </div>

                                <Form {...notificationsForm}>
                                    <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Email Notifications</CardTitle>
                                                <CardDescription>Configure which email notifications you want to receive</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={notificationsForm.control}
                                                    name="emailNotifications"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                                                <FormDescription>
                                                                    Receive email notifications about your time entries and approvals
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={notificationsForm.control}
                                                    name="reminderNotifications"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Daily Reminders</FormLabel>
                                                                <FormDescription>Receive daily reminders to submit your time entries</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={notificationsForm.control}
                                                    name="reminderTime"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Reminder Time</FormLabel>
                                                            <FormControl>
                                                                <Input type="time" {...field} />
                                                            </FormControl>
                                                            <FormDescription>Set the time when you want to receive daily reminders</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={notificationsForm.control}
                                                    name="approvalNotifications"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Approval Notifications</FormLabel>
                                                                <FormDescription>
                                                                    Receive notifications when your time entries are approved or rejected
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={notificationsForm.control}
                                                    name="weeklyReportNotifications"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Weekly Reports</FormLabel>
                                                                <FormDescription>Receive weekly summary reports of your time entries</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                            <CardFooter className="flex justify-end">
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
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </form>
                                </Form>
                            </TabsContent>

                            {/* Time Tracking Settings */}
                            <TabsContent value="time-tracking" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold">Time Tracking Settings</h2>
                                        <p className="text-sm text-muted-foreground">Customize your time tracking preferences</p>
                                    </div>
                                </div>

                                <Form {...timeTrackingForm}>
                                    <form onSubmit={timeTrackingForm.handleSubmit(onTimeTrackingSubmit)} className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Time Tracking Preferences</CardTitle>
                                                <CardDescription>Configure how you track and display time</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={timeTrackingForm.control}
                                                    name="defaultWorkingHours"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Default Working Hours Per Day</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="1" max="24" step="0.5" {...field} />
                                                            </FormControl>
                                                            <FormDescription>Set your standard working hours per day</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={timeTrackingForm.control}
                                                    name="workWeekDays"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Work Week Days</FormLabel>
                                                            <div className="flex flex-wrap gap-2">
                                                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                                                                    (day) => (
                                                                        <Badge
                                                                            key={day}
                                                                            variant={field.value.includes(day) ? "default" : "outline"}
                                                                            className={cn(
                                                                                "cursor-pointer",
                                                                                field.value.includes(day) ? "bg-primary" : "bg-muted hover:bg-muted/80",
                                                                            )}
                                                                            onClick={() => {
                                                                                if (field.value.includes(day)) {
                                                                                    field.onChange(field.value.filter((d) => d !== day))
                                                                                } else {
                                                                                    field.onChange([...field.value, day])
                                                                                }
                                                                            }}
                                                                        >
                                                                            {day.substring(0, 3)}
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            </div>
                                                            <FormDescription>Select the days that make up your work week</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={timeTrackingForm.control}
                                                        name="timeFormat"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Time Format</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select time format" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                                                                        <SelectItem value="24h">24-hour (13:30)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={timeTrackingForm.control}
                                                        name="dateFormat"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Date Format</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select date format" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <FormField
                                                    control={timeTrackingForm.control}
                                                    name="defaultView"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Default Calendar View</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select default view" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="day">Day</SelectItem>
                                                                    <SelectItem value="week">Week</SelectItem>
                                                                    <SelectItem value="month">Month</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription>Choose your preferred calendar view when tracking time</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={timeTrackingForm.control}
                                                    name="autoSubmitEntries"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Auto-Submit Time Entries</FormLabel>
                                                                <FormDescription>
                                                                    Automatically submit time entries at the end of each day
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                            <CardFooter className="flex justify-end">
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
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </form>
                                </Form>
                            </TabsContent>

                            {/* Security Settings */}
                            <TabsContent value="security" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold">Security Settings</h2>
                                        <p className="text-sm text-muted-foreground">Manage your account security and authentication</p>
                                    </div>
                                </div>

                                <Form {...securityForm}>
                                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Security Preferences</CardTitle>
                                                <CardDescription>Configure your account security settings</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={securityForm.control}
                                                    name="twoFactorAuth"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                                                                <FormDescription>Add an extra layer of security to your account</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={securityForm.control}
                                                    name="sessionTimeout"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Session Timeout</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select timeout period" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="15m">15 minutes</SelectItem>
                                                                    <SelectItem value="30m">30 minutes</SelectItem>
                                                                    <SelectItem value="1h">1 hour</SelectItem>
                                                                    <SelectItem value="4h">4 hours</SelectItem>
                                                                    <SelectItem value="8h">8 hours</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription>Set how long until your session expires due to inactivity</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={securityForm.control}
                                                    name="allowMultipleSessions"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Allow Multiple Sessions</FormLabel>
                                                                <FormDescription>Allow logging in from multiple devices simultaneously</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="pt-2">
                                                    <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                                                        <Key className="mr-2 h-4 w-4" />
                                                        Change Password
                                                    </Button>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-end">
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
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </form>
                                </Form>
                            </TabsContent>

                            {/* Admin Settings */}
                            {isAdmin && (
                                <TabsContent value="admin" className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold">Admin Settings</h2>
                                            <p className="text-sm text-muted-foreground">Configure system-wide settings for all users</p>
                                        </div>
                                    </div>

                                    <Form {...adminForm}>
                                        <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Time Tracking Policies</CardTitle>
                                                    <CardDescription>Configure organization-wide time tracking policies</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={adminForm.control}
                                                        name="requireApproval"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel className="text-base">Require Time Entry Approval</FormLabel>
                                                                    <FormDescription>Require manager approval for all time entries</FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={adminForm.control}
                                                        name="allowOvertime"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel className="text-base">Allow Overtime</FormLabel>
                                                                    <FormDescription>
                                                                        Allow users to log more than their standard working hours
                                                                    </FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={adminForm.control}
                                                        name="allowTimeEditing"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Time Entry Editing Policy</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select editing policy" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="anytime">Allow editing anytime</SelectItem>
                                                                        <SelectItem value="sameDay">Allow editing same day only</SelectItem>
                                                                        <SelectItem value="sameWeek">Allow editing within same week</SelectItem>
                                                                        <SelectItem value="never">Disallow editing after submission</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormDescription>Set when users can edit their time entries</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={adminForm.control}
                                                        name="lockPastEntries"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel className="text-base">Lock Past Entries</FormLabel>
                                                                    <FormDescription>
                                                                        Prevent editing time entries older than the specified number of days
                                                                    </FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {adminForm.watch("lockPastEntries") && (
                                                        <FormField
                                                            control={adminForm.control}
                                                            name="lockPastEntriesDays"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Lock Entries Older Than (Days)</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="number" min="1" max="90" {...field} />
                                                                    </FormControl>
                                                                    <FormDescription>Time entries older than this many days will be locked</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </CardContent>
                                                <CardFooter className="flex justify-end">
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
                                                        ) : (
                                                            <>
                                                                <Save className="mr-2 h-4 w-4" />
                                                                Save Changes
                                                            </>
                                                        )}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </form>
                                    </Form>
                                </TabsContent>
                            )}

                            {/* Account Settings */}
                            <TabsContent value="account" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold">Account Settings</h2>
                                        <p className="text-sm text-muted-foreground">Manage your account and data</p>
                                    </div>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Data Management</CardTitle>
                                        <CardDescription>Export or delete your account data</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Export Your Data
                                            </Button>
                                            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                Delete Account
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Language & Region</CardTitle>
                                        <CardDescription>Configure your language and regional preferences</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="language">Language</Label>
                                                <Select defaultValue="en">
                                                    <SelectTrigger id="language">
                                                        <SelectValue placeholder="Select language" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="en">English</SelectItem>
                                                        <SelectItem value="de">German</SelectItem>
                                                        <SelectItem value="fr">French</SelectItem>
                                                        <SelectItem value="es">Spanish</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="timezone">Timezone</Label>
                                                <Select defaultValue="Europe/Berlin">
                                                    <SelectTrigger id="timezone">
                                                        <SelectValue placeholder="Select timezone" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Europe/Berlin">Europe/Berlin (GMT+1)</SelectItem>
                                                        <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                                                        <SelectItem value="America/New_York">America/New York (GMT-5)</SelectItem>
                                                        <SelectItem value="America/Los_Angeles">America/Los Angeles (GMT-8)</SelectItem>
                                                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            {/* Help & Support */}
                            <TabsContent value="help" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold">Help & Support</h2>
                                        <p className="text-sm text-muted-foreground">Get help with using the time tracking system</p>
                                    </div>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Documentation & Resources</CardTitle>
                                        <CardDescription>Access guides and documentation to help you use the system</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Button variant="outline" className="justify-start">
                                                <FileText className="mr-2 h-4 w-4" />
                                                User Guide
                                            </Button>
                                            <Button variant="outline" className="justify-start">
                                                <HelpCircle className="mr-2 h-4 w-4" />
                                                FAQ
                                            </Button>
                                            <a href="https://github.com/brunomgama/utility_tool/deployments/Production"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-start px-4 py-2 border
                                                rounded-md text-sm font-medium hover:bg-accent transition-colors
                                                border-input text-foreground bg-background">
                                                <Info className="mr-2 h-4 w-4"/>
                                                System Updates
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contact Support</CardTitle>
                                        <CardDescription>Get in touch with our support team</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="support-message">Message</Label>
                                            <Textarea
                                                id="support-message"
                                                placeholder="Describe your issue or question"
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Message
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>System Information</CardTitle>
                                        <CardDescription>Details about the current system version</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Version</span>
                                                <span>1.0.1</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Support Email</span>
                                                <span>bmogama@gmail.com</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>

                {/* Password Change Dialog */}
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                                Enter your current password and a new password to update your credentials.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => onPasswordChange({ currentPassword: "password", newPassword: "newpassword" })}>
                                {isSaving ? "Updating..." : "Update Password"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Account Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete Account</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete your account? This action cannot be undone and all your data will be
                                permanently removed.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Warning</h4>
                                        <p className="text-sm">
                                            Deleting your account will remove all your time entries, reports, and personal data from the system.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                                <Input id="confirm-delete" placeholder="DELETE" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={onDeleteAccount}>
                                {isSaving ? "Deleting..." : "Delete Account"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Export Data Dialog */}
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Export Your Data</DialogTitle>
                            <DialogDescription>Choose a format to export all your time tracking data.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Export Format</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button variant="outline" className="justify-center" onClick={() => onExportData()}>
                                        CSV
                                    </Button>
                                    <Button variant="outline" className="justify-center" onClick={() => onExportData()}>
                                        Excel
                                    </Button>
                                    <Button variant="outline" className="justify-center" onClick={() => onExportData()}>
                                        JSON
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Date Range</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="from-date" className="text-xs">
                                            From
                                        </Label>
                                        <Input id="from-date" type="date" />
                                    </div>
                                    <div>
                                        <Label htmlFor="to-date" className="text-xs">
                                            To
                                        </Label>
                                        <Input id="to-date" type="date" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Include</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="cursor-pointer bg-muted">
                                        Time Entries
                                    </Badge>
                                    <Badge variant="outline" className="cursor-pointer bg-muted">
                                        Projects
                                    </Badge>
                                    <Badge variant="outline" className="cursor-pointer bg-muted">
                                        Reports
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => onExportData()}>{isSaving ? "Exporting..." : "Export Data"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

