"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm} from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, ArrowRight, CheckCircle, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {useCallback, useMemo} from "react";
import {supabase} from "@/lib/supabase";

// User schema type
export type UserSchema = {
    id: string
    name: string
    email: string
    location: string
    role: "Admin" | "User"
    department: string
    status: "Active" | "Inactive" | "Pending"
}

// Sample departments
const departments = [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Customer Support",
    "Human Resources",
    "Finance",
    "Operations",
    "Legal",
]

// Form validation schema
const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    location: z.string().min(2, { message: "Location is required." }),
    department: z.string().min(1, { message: "Please select a department." }),
    role: z.enum(["Admin", "User"], {
        required_error: "Please select a role.",
    }),
})

type FormValues = z.infer<typeof formSchema>

// Onboarding steps
type Step = {
    id: string
    title: string
    description: string
}

const steps: Step[] = [
    {
        id: "personal",
        title: "Personal Information",
        description: "Provide your basic information to get started.",
    },
    {
        id: "work",
        title: "Work Details",
        description: "Tell us about your role and department.",
    },
    {
        id: "review",
        title: "Review Information",
        description: "Review your information before submitting.",
    },
    {
        id: "complete",
        title: "Onboarding Complete",
        description: "Your account has been set up successfully.",
    },
]

export default function OnboardingForm({email, auth_id}: { email: string, auth_id: string }) {
    const [currentStep, setCurrentStep] = React.useState(0)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const router = useRouter()

    // Initialize form with default values
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        values: {
            name: "",
            email,
            location: "",
            department: "",
            role: "User",
        },
    })

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true)

        try {
            const newUser: UserSchema = {
                id: auth_id,
                ...data,
                status: "Pending",
            }

            const { error } = await supabase.from("users").insert(newUser)

            if (error) {
                console.error("Supabase insert error:", error)
                return
            }

            setCurrentStep(3)
        } catch (error) {
            console.error("Unexpected error:", error)
        } finally {
            setIsSubmitting(false)
        }
    }



    // Navigate to next step
    const nextStep = () => {
        const isLastStep = currentStep === steps.length - 2

        if (isLastStep) {
            form.handleSubmit(onSubmit)()
        } else {
            setCurrentStep((prev) => prev + 1)
        }
    }

    // Navigate to previous step
    const prevStep = () => {
        setCurrentStep((prev) => prev - 1)

        console.log(form.getValues())
    }

    // Check if current step fields are valid
    const isCurrentStepValid = () => {
        const currentStepId = steps[currentStep].id

        if (currentStepId === "personal") {
            const name = form.watch("name")
            const email = form.watch("email")
            return name.length >= 2 && /\S+@\S+\.\S+/.test(email)
        }

        if (currentStepId === "work") {
            const location = form.watch("location")
            const department = form.watch("department")
            const role = form.watch("role")
            return location.length > 1 && department && role
        }

        return true
    }

    const renderStepContent = useCallback(() => {
        const currentStepId = steps[currentStep].id

        if (currentStepId === "personal") {
            return (
                <div key={"personal"}>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <FormItem className="mb-4">
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormDescription>Enter your full name as it appears on official documents.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="john.doe@company.com" type="email" {...field} disabled />
                                </FormControl>
                                <FormDescription>This will be used for communication and as your login.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )
        }

        if (currentStepId === "work") {
            return (
                <div key={"work"}>
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem className="mb-4">
                                <FormLabel>Location</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={"w-full"}>
                                            <SelectValue placeholder="Select a location" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Portugal, PT">🇵🇹 Portugal, PT</SelectItem>
                                        <SelectItem value="Germany, DE">🇩🇪 Germany, DE</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>Select your main work location.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                            <FormItem className="mb-4">
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={"w-full"}>
                                            <SelectValue placeholder="Select a department" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {departments.map((department) => (
                                            <SelectItem key={department} value={department}>
                                                {department}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>Select the department you'll be working in.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select disabled onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={"w-full"}>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="User">User</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>This determines your access level within the system.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )
        }

        if (currentStepId === "review") {
            const values = form.getValues()

            return (
                <div key={"review"} className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Name</div>
                                <div className="font-medium">{values.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="font-medium">{values.email}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Work Details</h3>
                        <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Location</div>
                                <div className="font-medium">{values.location}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Department</div>
                                <div className="font-medium">{values.department}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Role</div>
                                <div className="font-medium">{values.role}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        <p>
                            Please review your information carefully. Once submitted, your account will be created and pending
                            approval from an administrator.
                        </p>
                    </div>
                </div>
            )
        }

        if (currentStepId === "complete") {
            return (
                <div key={"complete"} className="flex flex-col items-center justify-center py-6 space-y-6 text-center">
                    <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Account Created Successfully</h3>
                        <p className="text-muted-foreground">
                            Your account has been created and is pending approval from an administrator. You'll receive an email once
                            your account is activated.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/")}>Return to Login</Button>
                </div>
            )
        }
    }, [currentStep, form.getValues()])

    return (
        <div className="flex min-h-screen bg-muted/30 items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                {/* Progress indicator */}
                <div className="mb-8">
                    <div className="flex justify-between">
                        {steps.slice(0, -1).map((step, index) => (
                            <div key={step.id} className="flex flex-col items-center">

                                {currentStep === 3 ? (
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-green-500 ${
                                            index < currentStep
                                                ? "text-primary-foreground"
                                                : index === currentStep
                                                    ? "border-primary text-primary"
                                                    : "border-muted-foreground/30 text-muted-foreground/30"
                                        }`}
                                    >
                                        {index < currentStep ? <CheckCircle className="h-5 w-5"/> :
                                            <span>{index + 1}</span>}
                                    </div>
                                ) : (
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                            index < currentStep
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : index === currentStep
                                                    ? "border-primary text-primary"
                                                    : "border-muted-foreground/30 text-muted-foreground/30"
                                        }`}
                                    >
                                        {index < currentStep ? <CheckCircle className="h-5 w-5"/> :
                                            <span>{index + 1}</span>}
                                    </div>
                                )}
                                <span
                                    className={`mt-2 text-sm ${index <= currentStep ? "text-foreground" : "text-muted-foreground/30"}`}
                                >
                                  {step.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="relative mt-4">
                        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted-foreground/30"/>
                        {currentStep === 3 ? (
                            <div
                                className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-green-500 transition-all duration-300"/>
                        ) : (
                            <div
                                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"
                                style={{width: `${(currentStep / (steps.length - 2)) * 100}%`}}
                            />
                        )}
                    </div>

                    {/*<div className="relative mt-4">*/}
                    {/*    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted-foreground/30"/>*/}
                    {/*    <div*/}
                    {/*        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"*/}
                    {/*        style={{width: `${(currentStep / (steps.length - 2)) * 100}%`}}*/}
                    {/*    />*/}
                    {/*</div>*/}
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary"/>
                            <CardTitle>{steps[currentStep].title}</CardTitle>
                        </div>
                        <CardDescription>{steps[currentStep].description}</CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent>{renderStepContent()}</CardContent>
                            {currentStep < steps.length - 1 && (
                                <CardFooter className="flex justify-between mt-10">
                                    <Button type="button" variant="outline" onClick={prevStep}
                                            disabled={currentStep === 0}>
                                        <ArrowLeft className="mr-2 h-4 w-4"/>
                                        Back
                                    </Button>
                                    <Button type="button" onClick={nextStep}
                                            disabled={!isCurrentStepValid() || isSubmitting}>
                                        {currentStep === steps.length - 2 ? (
                                            isSubmitting ? (
                                                <>
                                                    <div
                                                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                                    Creating Account
                                                </>
                                            ) : (
                                                <>
                                                    Complete
                                                    <CheckCircle className="ml-2 h-4 w-4"/>
                                                </>
                                            )
                                        ) : (
                                            <>
                                                Next
                                                <ArrowRight className="ml-2 h-4 w-4"/>
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            )}
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
    )
}

