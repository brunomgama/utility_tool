"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/currency_formater"
import {project_roles} from "@/types/roles";
import {ProjectRoleSchema} from "@/types/project_role";

interface ProjectRolesFormProps {
    roles: ProjectRoleSchema[]
    onSubmit: (roles: ProjectRoleSchema[]) => void
    onBack: () => void
}

export function ProjectRolesForm({ roles, onSubmit, onBack }: ProjectRolesFormProps) {
    const [formRoles, setFormRoles] = useState<ProjectRoleSchema[]>(roles)

    const addRole = () => {
        const newId = crypto.randomUUID()
        setFormRoles([...formRoles, { id: newId, role: "Developer", man_days: 0, hourly_rate: 0 }])
    }

    const removeRole = (id: string) => {
        if (formRoles.length > 1) {
            setFormRoles(formRoles.filter((role) => role.id !== id))
        }
    }

    const updateRole = (id: string, field: keyof ProjectRoleSchema, value: string | number) => {
        setFormRoles(formRoles.map((role) => (role.id === id ? { ...role, [field]: value } : role)))
    }

    const calculateTotalBudget = () => {
        return formRoles.reduce((total, role) => {
            return total + role.man_days * 8 * role.hourly_rate
        }, 0)
    }

    const calculateTotalManDays = () => {
        const total = formRoles.reduce((total, role) => total + role.man_days, 0)
        return Number(total.toFixed(2))
    }

    const handleSubmit = () => {
        onSubmit(formRoles)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Roles and Rates</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[45vh] scrollbar-thin scrollbar-thumb-muted-foreground/30">
                <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Man Days</TableHead>
                                <TableHead>Hourly Rate (€)</TableHead>
                                <TableHead>Daily Rate (€)</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formRoles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="w-[240px] truncate">
                                        <Select value={role.role} onValueChange={(value) => updateRole(role.id, "role", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {project_roles.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={role.man_days === 0 ? "" : role.man_days}
                                            onChange={(e) =>
                                                updateRole(role.id, "man_days", Number.parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={role.hourly_rate === 0 ? "" : role.hourly_rate}
                                            onChange={(e) =>
                                                updateRole(role.id, "hourly_rate", Number.parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="text"
                                            readOnly
                                            tabIndex={-1}
                                            value={(role.hourly_rate * 8).toFixed(2)}
                                            className="bg-muted text-muted-foreground pointer-events-none"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{formatCurrency(role.man_days * 8 * role.man_days)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRole(role.id)}
                                            disabled={formRoles.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button variant="outline" size="sm" className="mt-4" onClick={addRole}>
                        <Plus className="h-4 w-4 mr-2" /> Add Role
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Total Man Days</Label>
                            <div className="text-2xl font-bold mt-1">{calculateTotalManDays()}</div>
                        </div>
                        <div>
                            <Label>Total Budget</Label>
                            <div className="text-2xl font-bold mt-1">{formatCurrency(calculateTotalBudget())}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={handleSubmit}>Next</Button>
            </div>
        </div>
    )
}