"use client"

import {Calendar,  Users} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSidebar } from "@/context/sidebar-context"
import { TbBuildingCommunity } from "react-icons/tb"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {UserSchema} from "@/types/user";
import {formatDate} from "@/lib/date_formater";
import {ProjectSchema} from "@/types/project";
import {ProjectRoleSchema} from "@/types/project_role";
import {AllocationSchema} from "@/types/allocation";
import {TimeTrackingSchema} from "@/types/time_tracking";
import AddProjectModal from "@/components/custom/project/AddProjectModal";
import * as React from "react";
import ProjectTabStatus from "@/components/custom/project/ProjectTabStatus";
import MessageLoading from "@/components/custom/spinner/Loading";
import ProjectDeleteMemberDialog from "@/components/custom/project/ProjectDeleteMemberDialog";
import ProjectAllocationDialog from "@/components/custom/project/ProjectAllocationDialog";
import ProjectDetailDialog from "@/components/custom/project/ProjectDetailDialog";

export default function ProjectDashboard() {
    const { isCollapsed } = useSidebar()

    const [projects, setProjects] = useState<ProjectSchema[]>([])
    const [users, setUsers] = useState<UserSchema[]>([])
    const [allocations, setAllocations] = useState<AllocationSchema[]>([])
    const [projectRoles, setProjectRoles] = useState<Record<string, ProjectRoleSchema[]>>({})
    const [selectedProject, setSelectedProject] = useState<ProjectSchema | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [addAllocationOpen, setAddAllocationOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [selectedAllocation, setSelectedAllocation] = useState<AllocationSchema | null>(null)
    const [loading, setLoading] = useState(false)

    const [timeEntries, setTimeEntries] = useState<TimeTrackingSchema[]>([])

    const [openCreateModal, setOpenCreateModal] = useState(false)

    const [newAllocation, setNewAllocation] = useState({
        user_id: "",
        role_id: "",
        role_name: "",
        percentage: 100,
        start_date: new Date(),
        end_date: null as Date | null,
    })

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [
                    { data: usersData, error: usersError },
                    { data: projectsData, error: projectsError },
                    { data: allocationsData, error: allocationsError },
                    { data: timeEntriesData, error: timeEntriesError },
                ] = await Promise.all([
                    supabase.from("users").select("*"),
                    supabase.from("projects").select("*"),
                    supabase.from("allocations").select("*"),
                    supabase.from("time_tracking").select("*"),
                ])

                if (usersError) throw usersError
                if (projectsError) throw projectsError
                if (allocationsError) throw allocationsError
                if (timeEntriesError) throw timeEntriesError

                const userMap = Object.fromEntries(usersData.map((u) => [u.id, u]))

                const formattedProjects = projectsData.map((p) => ({
                    ...p,
                    completed_days: Number(p.completed_days),
                    budget: Number(p.budget),
                    man_days: Number(p.man_days),
                    target_margin: Number(p.target_margin),
                    revenue: Number(p.revenue),
                    period_start: new Date(p.period_start),
                    period_end: new Date(p.period_end),
                    projectManager: userMap[p.project_lead]?.name || "Unknown",
                    technologies: p.technologies ?? [],
                }))

                const formattedAllocations = allocationsData.map((a) => ({
                    ...a,
                    percentage: Number(a.percentage),
                    start_date: new Date(a.start_date),
                    end_date: a.end_date ? new Date(a.end_date) : null,
                }))

                const formattedTimeEntries = timeEntriesData
                    ? timeEntriesData.map((entry) => ({
                        ...entry,
                        date: new Date(entry.date),
                        hours: Number(entry.hours),
                    }))
                    : []

                setProjects(formattedProjects)
                setUsers(usersData)
                setAllocations(formattedAllocations)
                setTimeEntries(formattedTimeEntries)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        const fetchProjectRoles = async (projectId: string) => {
            if (!projectId || projectRoles[projectId]) return

            try {
                const { data, error } = await supabase.from("project_roles").select("*").eq("project_id", projectId)

                if (error) throw error

                setProjectRoles((prev) => ({
                    ...prev,
                    [projectId]: data.map((role) => ({
                        ...role,
                        man_days: Number(role.man_days),
                        hourly_rate: Number(role.hourly_rate),
                    })),
                }))
            } catch (error) {
                console.error("Error fetching project roles:", error)
            }
        }

        if (selectedProject) {
            fetchProjectRoles(selectedProject.id)
        }
    }, [selectedProject, projectRoles])

    function getProjectAllocations(projectId: string, allocations: AllocationSchema[], users: UserSchema[]) {
        const projectAllocations = allocations.filter((a) => a.project_id === projectId)
        return projectAllocations.map((allocation) => ({
            ...allocation,
            user: users.find((u) => u.id === allocation.user_id),
        }))
    }

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesSearch =
                project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.client.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status)
            return matchesSearch && matchesStatus
        })
    }, [projects, searchTerm, statusFilter])

    const projectAllocations = useMemo(() => {
        if (!selectedProject) return []
        return getProjectAllocations(selectedProject.id, allocations, users)
    }, [selectedProject, allocations, users])

    const availableUnassignedRoles = useMemo(() => {
        if (!selectedProject) return []

        const roles = projectRoles[selectedProject.id] || []

        const assignedRoles = new Set(projectAllocations.map((allocation) => allocation.role))

        return roles.filter((role) => !assignedRoles.has(role.role))
    }, [selectedProject, projectRoles, projectAllocations])

    const availableUsers = useMemo(() => {
        if (!selectedProject) return []

        const allocatedUserIds = new Set(projectAllocations.map((allocation) => allocation.user_id))

        return users.filter((user) => !allocatedUserIds.has(user.id) && user.status === "Active")
    }, [selectedProject, projectAllocations, users])

    const handleProjectSelect = async (project: ProjectSchema) => {
        setSelectedProject(project)
        setModalOpen(true)
    }

    const getProjectProgress = (project: ProjectSchema) => {
        const projectHours = timeEntries
            .filter((entry) => entry.project_id === project.id &&
                (entry.status === "Approved")).reduce((sum, entry) => sum + entry.hours, 0)


        console.log(timeEntries)

        const totalHours = project.man_days * 8
        return totalHours > 0 ? Math.round((projectHours / totalHours) * 100) : 0
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? "ml-[3rem]" : "ml-[15rem]"} p-6`}>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbBuildingCommunity className="h-5 w-5 text-muted-foreground"/>
                        <h2 className="text-xl font-semibold">Project Allocations</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <ProjectTabStatus searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                                          setStatusFilter={setStatusFilter} setOpenCreateModal={setOpenCreateModal} />
                    </div>
                </div>

                {loading && projects.length === 0 ? (
                    <MessageLoading />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map((project) => (
                            <Card key={project.id} className="cursor-pointer transition-all hover:border-primary"
                                onClick={() => handleProjectSelect(project)}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{project.project_name}</CardTitle>
                                            <CardDescription>{project.client}</CardDescription>
                                        </div>
                                        <Badge
                                            className={cn(
                                                project.status === "Active"
                                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                    : project.status === "Inactive"
                                                        ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                        : project.status === "Pending"
                                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                            )}
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>Progress</span>
                                                <span>{getProjectProgress(project)}%</span>
                                            </div>
                                            <Progress value={getProjectProgress(project)} className="h-2" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDate(project.period_start)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{getProjectAllocations(project.id, allocations, users).length} users</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {filteredProjects.length === 0 && (
                            <div className="col-span-full flex justify-center items-center h-40 border rounded-md bg-muted/20">
                                <p className="text-muted-foreground">No projects found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {openCreateModal && (
                    <AddProjectModal open={openCreateModal} onClose={() => setOpenCreateModal(false)}
                        onProjectCreated={(newProjects) => setProjects(newProjects)} />
                )}

                <ProjectDetailDialog modalOpen={modalOpen} setModalOpen={setModalOpen}
                                     selectedProject={selectedProject} projectAllocations={projectAllocations}
                                     setSelectedAllocation={setSelectedAllocation} setDeleteConfirmOpen={setDeleteConfirmOpen}
                                     setAddAllocationOpen={setAddAllocationOpen} availableUsers={availableUsers}
                                     availableUnassignedRoles={availableUnassignedRoles} timeEntries={timeEntries}
                                     projectRoles={projectRoles} allocations={allocations} users={users}/>

                <ProjectAllocationDialog addAllocationOpen={addAllocationOpen}
                                         setAddAllocationOpen={setAddAllocationOpen} selectedProject={selectedProject}
                                         newAllocation={newAllocation} setNewAllocation={setNewAllocation} availableUsers={availableUsers}
                                         availableUnassignedRoles={availableUnassignedRoles} users={users} allocations={allocations} setAllocations={setAllocations}/>

                <ProjectDeleteMemberDialog deleteConfirmOpen={deleteConfirmOpen} setDeleteConfirmOpen={setDeleteConfirmOpen}
                                           users={users} selectedAllocation={selectedAllocation} setAllocations={setAllocations} allocations={allocations} setSelectedAllocation={setSelectedAllocation}/>
            </div>
        </div>
    )
}

