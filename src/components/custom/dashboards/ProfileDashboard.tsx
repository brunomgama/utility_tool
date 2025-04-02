"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {Save} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {useEffect, useState} from "react";
import {UserSchema} from "@/types/user";
import {supabase} from "@/lib/supabase";
import {departments} from "@/types/department";
import {TbUser} from "react-icons/tb";
import {useSidebar} from "@/context/sidebar-context";

// Form schemas
const profileFormSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    bio: z.string().max(160).optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
})

export default function ProfileDashboard({ session }: { session: { user: { sub: string; email?: string; name?: string } } }) {
    const [currentUser, setCurrentUser] = useState<UserSchema | null>(null)
    const { isCollapsed } = useSidebar();

    const [isSaving, setIsSaving] = React.useState(false)

    // Profile form
    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            email: "",
            bio: "",
            jobTitle: "",
            department: "",
            location: "",
        },
    })

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

                profileForm.reset({
                    name: data.name || "",
                    email: data.email || "",
                    bio: "",
                    jobTitle: data.role || "",
                    department: data.department || "",
                    location: data.location || "",
                })
            }
        }

        fetchCurrentUser()
    }, [session, profileForm])

    // Handle profile form submission
    function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
        setIsSaving(true)

        // Simulate API call
        setTimeout(() => {
            console.log("Profile data:", data)
            setIsSaving(false)
        }, 1000)
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="container mx-auto py-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbUser className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-2xl font-bold">Profile</h1>
                    </div>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <div className="flex flex-col md:flex-row gap-6">

                        {/* Content */}
                        <div className="flex-1 space-y-6">
                            {/* Profile Settings */}
                            {currentUser && (
                                <TabsContent value="profile" className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold">Profile Settings</h2>
                                            <p className="text-sm text-muted-foreground">Manage your personal information and preferences</p>
                                        </div>
                                    </div>

                                    <Form {...profileForm}>
                                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Personal Information</CardTitle>
                                                    <CardDescription>Update your personal details and contact information</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex flex-col md:flex-row gap-4">
                                                        <div className="flex-1">
                                                            <FormField
                                                                control={profileForm.control}
                                                                name="name"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Full Name</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Your name" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <FormField
                                                                control={profileForm.control}
                                                                name="email"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Email</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Your email" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row gap-4">
                                                        <div className="flex-1">
                                                            <FormField
                                                                control={profileForm.control}
                                                                name="jobTitle"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Job Title</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Your job title" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex-1 w-full">
                                                            <FormField
                                                                control={profileForm.control}
                                                                name="department"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Department</FormLabel>
                                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                            <FormControl>
                                                                                <SelectTrigger className={"w-full"}>
                                                                                    <SelectValue placeholder="Select department" />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                {departments.map((dept) => (
                                                                                    <SelectItem key={dept} value={dept}>
                                                                                        {dept}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    <FormField
                                                        control={profileForm.control}
                                                        name="location"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Location</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="City, Country" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={profileForm.control}
                                                        name="bio"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Bio</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Tell us a little about yourself"
                                                                        className="resize-none"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Brief description for your profile. Maximum 160 characters.
                                                                </FormDescription>
                                                                <FormMessage />
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
                            )}
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

