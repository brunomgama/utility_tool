"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectFormData } from "./AddProjectModal"
import { formatCurrency } from "@/lib/currency_formater"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { UserSchema } from "@/types/user"

interface NewProjectSummaryProps {
    formData: ProjectFormData
    totalBudget: number
    totalManDays: number
    endDate: Date
    onBack: () => void
    onSubmit: () => void
    isSubmitting: boolean
}

export function ProjectSummary({formData, totalBudget, totalManDays, endDate, onBack, onSubmit, isSubmitting,}: NewProjectSummaryProps) {
    const [projectLead, setProjectLead] = useState<UserSchema | null>(null)

    useEffect(() => {
        const fetchProjectLead = async () => {
            if (formData.project_lead) {
                const { data, error } = await supabase.from("users").select("*").eq("id", formData.project_lead).single()

                if (!error && data) {
                    setProjectLead(data)
                }
            }
        }

        fetchProjectLead()
    }, [formData.project_lead])

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Summary</CardTitle>
                    <CardDescription>Review the project details before creating</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Project Details</h3>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <span className="text-sm font-medium">Client:</span>
                                    <span className="text-sm">{formData.client}</span>

                                    <span className="text-sm font-medium">Project Name:</span>
                                    <span className="text-sm">{formData.project_name}</span>

                                    <span className="text-sm font-medium">Angebotsnummer:</span>
                                    <span className="text-sm">{formData.angebotsnummer || "—"}</span>

                                    <span className="text-sm font-medium">Frame Contract:</span>
                                    <span className="text-sm">{formData.frame_contract || "—"}</span>

                                    <span className="text-sm font-medium">Purchase Order:</span>
                                    <span className="text-sm">{formData.purchase_order || "—"}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Project Management</h3>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <span className="font-medium">Status:</span>
                                    <span>{formData.status}</span>

                                    {projectLead && (
                                        <>
                                            <span className="font-medium">Project Lead:</span>
                                            <span>{projectLead.name}</span>
                                        </>
                                    )}

                                    <span className="font-medium">Start Date:</span>
                                    <span>{format(formData.period_start, "PPP")}</span>

                                    <span className="font-medium">End Date (Calculated):</span>
                                    <span>{format(endDate, "PPP")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Project Roles</h3>
                                <div className="mt-2 space-y-2">
                                    {formData.roles.map((role, index) => (
                                        <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                                            <span>{role.role}</span>
                                            <span>
                                                {Number(role.man_days.toFixed(2))} days × {formatCurrency(role.hourly_rate)}/hr
                                              </span>
                                            <span className="font-medium">{formatCurrency(role.man_days * 8 * role.hourly_rate)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-medium text-muted-foreground">Financial Summary</h3>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <span className="text-sm font-medium">Total Man Days:</span>
                                    <span className="text-sm">{totalManDays}</span>

                                    <span className="text-sm font-medium">Total Budget:</span>
                                    <span className="text-sm font-bold">{formatCurrency(totalBudget)}</span>

                                    <span className="text-sm font-medium">Avg. Daily Rate:</span>
                                    <span className="text-sm">{totalManDays > 0 ? formatCurrency(totalBudget / totalManDays) : "—"}</span>

                                    <span className="text-sm font-medium">Target Margin:</span>
                                    <span className="text-sm">30%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={onSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Create Project"
                    )}
                </Button>
            </div>
        </div>
    )
}