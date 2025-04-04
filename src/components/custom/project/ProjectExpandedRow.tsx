import {ProjectSchema} from "@/types/project";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Clipboard, DollarSign, FileText, Link2, Users} from "lucide-react";
import {formatCurrency} from "@/lib/currency_formater";
import {Badge} from "@/components/ui/badge";
import {getUserInitialsByName, getUserName} from "@/lib/user_name";
import {cn} from "@/lib/utils";
import {formatDate} from "@/lib/date_formater";
import {formatPercentage} from "@/lib/percentage_formater";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import * as React from "react";
import {ProjectRoleSchema} from "@/types/project_role";
import {UserSchema} from "@/types/user";

type projectAllocations = {
    user: UserSchema | undefined
    id: string
    project_id: string
    user_id: string
    start_date: Date
    end_date: Date
    percentage: number
    role: string
}

interface ProjectExpandedRowProps {
    project: ProjectSchema
    projectRoles: Record<string, ProjectRoleSchema[]>;
    users: UserSchema[]
    availableRoles: ProjectRoleSchema[]
    projectAllocations: projectAllocations[];
}

export default function ProjectExpandedRow({project, projectRoles, users, availableRoles, projectAllocations}: ProjectExpandedRowProps) {
    const roles = projectRoles[project.id] || []

    const completedPercentage = project.man_days > 0 ? (project.completed_days / project.man_days) * 100 : 0

    const budgetUtilization = project.budget > 0 ? ((project.revenue - project.budget) / project.budget) * 100 : 0

    return (
        <div className="p-4 bg-muted/50 rounded-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Users className="h-5 w-5 text-blue-700"/>
                        </div>
                        <div>
                            <p className="text-sm text-blue-700">Total Roles</p>
                            <p className="text-xl font-bold">{roles.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <DollarSign className="h-5 w-5 text-green-700"/>
                        </div>
                        <div>
                            <p className="text-sm text-green-700">Revenue</p>
                            <p className="text-xl font-bold">{formatCurrency(project.revenue)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                            <Clipboard className="h-5 w-5 text-purple-700"/>
                        </div>
                        <div>
                            <p className="text-sm text-purple-700">Man Days</p>
                            <p className="text-xl font-bold">{project.man_days} days</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground"/>
                            Project Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-1">
                                <span className="text-sm text-muted-foreground">Project Name:</span>
                                <span className="text-sm font-medium">{project.project_name}</span>

                                <span className="text-sm text-muted-foreground">Angebotsnummer:</span>
                                <span className="text-sm">{project.angebotsnummer}</span>

                                <span className="text-sm text-muted-foreground">Frame Contract:</span>
                                <span className="text-sm">{project.frame_contract || "—"}</span>

                                <span className="text-sm text-muted-foreground">Purchase Order:</span>
                                <span className="text-sm">{project.purchase_order}</span>
                            </div>

                            {project.technologies && project.technologies.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                    <span className="text-sm text-muted-foreground block mb-1">Technologies:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {project.technologies.map((tech, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-2 pt-2 border-t">
                                <div className="flex items-center gap-2 text-sm">
                                    <Link2 className="h-4 w-4 text-muted-foreground"/>
                                    <a href={project.link_to_project_folder}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline truncate">
                                        Project Folder
                                    </a>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground"/>
                            Project Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-1">
                                <span className="text-sm text-muted-foreground">Project Lead:</span>
                                <span className="text-sm font-medium">{getUserName(users, project.project_lead)}</span>

                                <span className="text-sm text-muted-foreground">Status:</span>
                                <span className="text-sm">
                                        <Badge className={cn("mt-1",
                                            project.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : project.status === "Inactive" ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                    : project.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                        : "bg-blue-100 text-blue-800 hover:bg-blue-100")}>
                                                  {project.status}
                                        </Badge>
                                </span>
                            </div>

                            <div className="mt-2 pt-2 border-t">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Period Start:</span>
                                    <span className="text-sm">{formatDate(project.period_start)}</span>

                                    <span className="text-sm text-muted-foreground">Period End:</span>
                                    <span className="text-sm">{formatDate(project.period_end)}</span>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t">
                                <span className="text-sm text-muted-foreground">Progress:</span>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{width: `${Math.min(completedPercentage, 100)}%`}}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span>{project.completed_days} days completed</span>
                                    <span>{Math.round(completedPercentage)}%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clipboard className="h-4 w-4 text-muted-foreground"/>
                            Financial Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-1">
                                <span className="text-sm text-muted-foreground">Revenue:</span>
                                <span className="text-sm font-medium">{formatCurrency(project.revenue)}</span>

                                <span className="text-sm text-muted-foreground">Budget:</span>
                                <span className="text-sm">{formatCurrency(project.budget)}</span>

                                <span className="text-sm text-muted-foreground">Budget Utilization:</span>
                                <span className={cn("text-sm", budgetUtilization > 0 ? "text-green-600" : "text-red-600")}>
                                    {budgetUtilization > 0 ? "+" : ""} {budgetUtilization.toFixed(1)}%
                                </span>

                                <span className="text-sm text-muted-foreground">Man Days:</span>
                                <span className="text-sm">{project.man_days}</span>

                                <span className="text-sm text-muted-foreground">Target Margin:</span>
                                <span className="text-sm">{formatPercentage(project.target_margin)}</span>

                                <span className="text-sm text-muted-foreground">Value per Day:</span>
                                <span
                                    className="text-sm">{formatCurrency(project.revenue / project.man_days)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Project Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {availableRoles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Man Days</TableHead>
                                            <TableHead>Hourly Rate</TableHead>
                                            <TableHead>Total Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {availableRoles.map((role) => {
                                            const allocation = projectAllocations.find((a) => a.role === role.id)
                                            const assignedUser = allocation?.user

                                            return (
                                                <TableRow key={role.id}>
                                                    <TableCell className="font-medium">{role.role}</TableCell>
                                                    <TableCell>
                                                        {assignedUser ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">
                                                                        {getUserInitialsByName(assignedUser.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>{assignedUser.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">Unassigned</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{role.man_days}</TableCell>
                                                    <TableCell>{formatCurrency(role.hourly_rate)}/hr</TableCell>
                                                    <TableCell>{formatCurrency(role.man_days * 8 * role.hourly_rate)}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                No roles defined for this project.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}