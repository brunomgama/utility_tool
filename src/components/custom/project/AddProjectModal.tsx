"use client"

import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ProjectSchema } from "@/types/project"
import * as React from "react";
import {useEffect, useState} from "react";
import {UserSchema} from "@/types/user";

type AddProjectModalProps = {
    open: boolean
    onClose: () => void
    onProjectCreated: (projects: ProjectSchema[]) => void
}

export default function AddProjectModal({ open, onClose, onProjectCreated }: AddProjectModalProps) {
    const [selectedUser, setSelectedUser] = useState("")
    const [users, setUsers] = useState<UserSchema[]>([])

    useEffect(() => {
        async function fetchUsers() {
            const { data: users, error } = await supabase.from("users").select("*")
            if (error) {
                alert("Error fetching users: " + error.message)
            } else {
                setUsers(users)
            }
        }

        fetchUsers()
    }, []);

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Add New Project</h2>
                    <Button variant="ghost" onClick={onClose}>✕</Button>
                </div>

                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        const form = e.currentTarget
                        const formData = new FormData(form)

                        console.log("project_lead", selectedUser)

                        const newProject = {
                            id: formData.get("angebotsnummer"),
                            project_lead: selectedUser,
                            angebotsnummer: formData.get("angebotsnummer"),
                            client: formData.get("client"),
                            frame_contract: formData.get("frame_contract"),
                            purchase_order: formData.get("purchase_order"),
                            project_name: formData.get("project_name"),
                            link_to_project_folder: formData.get("link_to_project_folder"),
                            target_margin: parseFloat(formData.get("target_margin") as string) || 0,
                            revenue: parseFloat(formData.get("revenue") as string),
                            man_days: parseFloat(formData.get("man_days") as string),
                            completed_days: parseFloat(formData.get("completed_days") as string) || 0,
                            budget: parseFloat(formData.get("budget") as string) || 0,
                            description: formData.get("description"),
                            period_start: formData.get("period_start"),
                            period_end: formData.get("period_end"),
                            status: formData.get("status"),
                            technologies: (formData.get("technologies") as string)?.split(",").map(t => t.trim()) ?? [],
                        }

                        const { error } = await supabase.from("projects").insert([newProject])
                        if (error) {
                            alert("Error creating project: " + error.message)
                        } else {
                            form.reset()
                            onClose()

                            const { data, error: fetchError } = await supabase.from("projects").select("*")
                            if (!fetchError && data) {
                                const parsed = data.map((project: ProjectSchema) => ({
                                    ...project,
                                    target_margin: typeof project.target_margin === "string" ? parseFloat(project.target_margin) : project.target_margin,
                                    revenue: typeof project.revenue === "string" ? parseFloat(project.revenue) : project.revenue,
                                    man_days: typeof project.man_days === "string" ? parseFloat(project.man_days) : project.man_days,
                                    period_start: new Date(project.period_start),
                                    period_end: new Date(project.period_end),
                                }))
                                onProjectCreated(parsed)
                            }
                        }
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="client">Client</Label>
                            <Input name="client" required/>
                        </div>
                        <div>
                            <Label htmlFor="project_name">Project Name</Label>
                            <Input name="project_name" required/>
                        </div>
                        <div className={"w-full"}>
                            <Label htmlFor="project_lead">Project Lead (User ID)</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className={"w-full"}>
                                    <SelectValue placeholder="All Users"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="angebotsnummer">Angebotsnummer</Label>
                            <Input name="angebotsnummer"/>
                        </div>
                        <div>
                            <Label htmlFor="frame_contract">Frame Contract</Label>
                            <Input name="frame_contract"/>
                        </div>
                        <div>
                            <Label htmlFor="purchase_order">Purchase Order</Label>
                            <Input name="purchase_order"/>
                        </div>
                        <div>
                            <Label htmlFor="link_to_project_folder">Project Folder URL</Label>
                            <Input name="link_to_project_folder"/>
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input name="description"/>
                        </div>
                        <div className={"w-full"}>
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue="Active">
                                <SelectTrigger className={"w-full"}>
                                    <SelectValue placeholder="Select status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Finished">Finished</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="target_margin">Target Margin (%)</Label>
                            <Input name="target_margin" type="number" step="0.01" defaultValue={0}/>
                        </div>
                        <div>
                            <Label htmlFor="revenue">Revenue (€)</Label>
                            <Input name="revenue" type="number" step="0.01"/>
                        </div>
                        <div>
                            <Label htmlFor="budget">Budget (€)</Label>
                            <Input name="budget" type="number" step="0.01" defaultValue={0}/>
                        </div>
                        <div>
                            <Label htmlFor="man_days">Man Days</Label>
                            <Input name="man_days" type="number"/>
                        </div>
                        <div>
                            <Label htmlFor="completed_days">Completed Days</Label>
                            <Input name="completed_days" type="number" defaultValue={0}/>
                        </div>
                        <div>
                            <Label htmlFor="period_start">Period Start</Label>
                            <Input name="period_start" type="date"/>
                        </div>
                        <div>
                            <Label htmlFor="period_end">Period End</Label>
                            <Input name="period_end" type="date"/>
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                            <Input name="technologies"/>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Create Project</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}