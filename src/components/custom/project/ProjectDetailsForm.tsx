"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ProjectFormData } from "./AddProjectModal"
import type { UserSchema } from "@/types/user"

const formSchema = z.object({
    client: z.string().min(2, { message: "Client name is required" }),
    project_name: z.string().min(2, { message: "Project name is required" }),
    angebotsnummer: z.string().optional(),
    frame_contract: z.string().optional(),
    purchase_order: z.string().optional(),
    period_start: z.date(),
    status: z.string(),
    link_to_project_folder: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    description: z.string().optional(),
    project_lead: z.string(),
})

interface ProjectDetailsFormProps {
    initialData: Partial<ProjectFormData>
    onSubmit: (data: Partial<ProjectFormData>) => void
}

export function ProjectDetailsForm({ initialData, onSubmit }: ProjectDetailsFormProps) {
    const [users, setUsers] = useState<UserSchema[]>([])

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from("users").select("*")
            if (error) {
                console.error("Error fetching users:", error)
            } else {
                setUsers(data)
            }
        }

        fetchUsers()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client: initialData.client || "",
            project_name: initialData.project_name || "",
            angebotsnummer: initialData.angebotsnummer || "",
            frame_contract: initialData.frame_contract || "",
            purchase_order: initialData.purchase_order || "",
            period_start: initialData.period_start || new Date(),
            status: initialData.status || "Active",
            link_to_project_folder: initialData.link_to_project_folder || "",
            project_lead: initialData.project_lead || "",
        },
    })

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="client"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client</FormLabel>
                                <FormControl>
                                    <Input placeholder="Client name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="project_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Project name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="angebotsnummer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Angebotsnummer</FormLabel>
                                <FormControl>
                                    <Input placeholder="Angebotsnummer" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="frame_contract"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frame Contract</FormLabel>
                                <FormControl>
                                    <Input placeholder="Frame contract" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="purchase_order"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purchase Order</FormLabel>
                                <FormControl>
                                    <Input placeholder="Purchase order" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="period_start"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Contract Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={"w-full"}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="project_lead"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Lead</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={"w-full"}>
                                            <SelectValue placeholder="Select project lead" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
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
                        name="link_to_project_folder"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Folder URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit">Next</Button>
                </div>
            </form>
        </Form>
    )
}

