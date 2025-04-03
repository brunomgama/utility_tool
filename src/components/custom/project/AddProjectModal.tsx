"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProjectSchema } from "@/types/project"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectDetailsForm } from "./ProjectDetailsForm"
import { ProjectRolesForm } from "./ProjectRolesForm"
import { ProjectSummary } from "./ProjectSummary"
import {ProjectRoleSchema} from "@/types/project_role";

export type ProjectFormData = {
    client: string
    project_name: string
    angebotsnummer: string
    frame_contract: string
    purchase_order: string
    period_start: Date
    status: string
    link_to_project_folder: string
    project_lead: string
    roles: ProjectRoleSchema[]
}

export default function AddProjectModal({ open, onClose, onProjectCreated }:
                        { open: boolean, onClose: () => void, onProjectCreated: (projects: ProjectSchema[]) => void }) {

    const [currentStep, setCurrentStep] = useState<"details" | "roles" | "summary">("details")
    const [formData, setFormData] = useState<ProjectFormData>({
        client: "",
        project_name: "",
        angebotsnummer: "",
        frame_contract: "",
        purchase_order: "",
        period_start: new Date(),
        status: "Active",
        link_to_project_folder: "",
        project_lead: "",
        roles: [{ id: "1", role: "Developer", man_days: 0, hourly_rate: 0 }],
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleDetailsSubmit = (detailsData: Partial<ProjectFormData>) => {
        setFormData((prev) => ({ ...prev, ...detailsData }))
        setCurrentStep("roles")
    }

    const handleRolesSubmit = (roles: ProjectRoleSchema[]) => {
        setFormData((prev) => ({ ...prev, roles }))
        setCurrentStep("summary")
    }

    const calculateTotalBudget = () => {
        return formData.roles.reduce((total, role) => {
            return total + role.man_days * 8 * role.hourly_rate
        }, 0)
    }

    const calculateTotalManDays = () => {
        return formData.roles.reduce((total, role) => total + role.man_days, 0)
    }

    const calculateEndDate = () => {
        const startDate = new Date(formData.period_start)
        const maxManDays = formData.roles.reduce((max, role) => Math.max(max, role.man_days), 0)

        const endDate = new Date(startDate)
        let daysAdded = 0

        while (daysAdded < maxManDays) {
            endDate.setDate(endDate.getDate() + 1)

            const day = endDate.getDay()
            if (day !== 0 && day !== 6) {
                daysAdded++
            }
        }

        return endDate
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const totalBudget = calculateTotalBudget()
            const totalManDays = calculateTotalManDays()
            const endDate = calculateEndDate()

            const { data, error } = await supabase
                .from("projects")
                .insert([
                    {
                        id: formData.angebotsnummer,
                        client: formData.client,
                        project_name: formData.project_name,
                        angebotsnummer: formData.angebotsnummer,
                        frame_contract: formData.frame_contract,
                        purchase_order: formData.purchase_order,
                        period_start: formData.period_start.toISOString(),
                        period_end: endDate.toISOString(),
                        status: formData.status,
                        link_to_project_folder: formData.link_to_project_folder,
                        project_lead: formData.project_lead,
                        revenue: totalBudget,
                        man_days: totalManDays,
                        target_margin: 0.3,
                        completed_days: 0,
                        budget: totalBudget,
                    },
                ])

                .select()

            if (error) {
                throw error
            }

            const projectId = data[0].id
            const roleInserts = formData.roles.map((role) => ({
                project_id: projectId,
                role: role.role,
                man_days: role.man_days,
                hourly_rate: role.hourly_rate,
            }))

            const { error: rolesError } = await supabase.from("project_roles").insert(roleInserts)

            if (rolesError) {
                throw rolesError
            }

            const { data: updatedProjects, error: fetchError } = await supabase.from("projects").select("*")

            if (fetchError) {
                throw fetchError
            }

            const parsedProjects = updatedProjects.map((project: ProjectSchema) => ({
                ...project,
                target_margin:
                    typeof project.target_margin === "string" ? Number.parseFloat(project.target_margin) : project.target_margin,
                revenue: typeof project.revenue === "string" ? Number.parseFloat(project.revenue) : project.revenue,
                man_days: typeof project.man_days === "string" ? Number.parseFloat(project.man_days) : project.man_days,
                period_start: new Date(project.period_start),
                period_end: new Date(project.period_end),
            }))

            onProjectCreated(parsedProjects)
            onClose()
        } catch (error) {
            console.error("Error creating project:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="flex flex-col w-full max-w-[90%] min-w-[90%] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>

                <Tabs value={currentStep} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger
                            value="details"
                            disabled={currentStep !== "details"}
                            className={currentStep === "details" ? "text-primary" : ""}
                        >
                            Project Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="roles"
                            disabled={currentStep !== "roles"}
                            className={currentStep === "roles" ? "text-primary" : ""}
                        >
                            Project Roles
                        </TabsTrigger>
                        <TabsTrigger
                            value="summary"
                            disabled={currentStep !== "summary"}
                            className={currentStep === "summary" ? "text-primary" : ""}
                        >
                            Summary
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-4">
                        <ProjectDetailsForm initialData={formData} onSubmit={handleDetailsSubmit} />
                    </TabsContent>

                    <TabsContent value="roles" className="mt-4 flex flex-col h-[calc(90vh-120px)] overflow-hidden">
                    <ProjectRolesForm
                            roles={formData.roles}
                            onSubmit={handleRolesSubmit}
                            onBack={() => setCurrentStep("details")}
                        />
                    </TabsContent>

                    <TabsContent value="summary" className="mt-4">
                        <ProjectSummary
                            formData={formData}
                            totalBudget={calculateTotalBudget()}
                            totalManDays={calculateTotalManDays()}
                            endDate={calculateEndDate()}
                            onBack={() => setCurrentStep("roles")}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}