"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { supabase } from "@/lib/supabase";
import { ProjectSchema } from "@/types/project";
import { cn } from "@/lib/utils";
import GenericTable from "@/components/custom/GenericTable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ellipsis } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// 📝 Create Project Modal
function CreateProjectModal({ onProjectAdded }: { onProjectAdded: (project: ProjectSchema) => void }) {
    const [open, setOpen] = useState(false);
    // Form state – adjust as needed
    const [projectLead, setProjectLead] = useState<number>(0);
    const [angebotsnummer, setAngebotsnummer] = useState("");
    const [client, setClient] = useState("");
    const [frameContract, setFrameContract] = useState("");
    const [purchaseOrder, setPurchaseOrder] = useState("");
    const [projectName, setProjectName] = useState("");
    const [linkToProjectFolder, setLinkToProjectFolder] = useState("");
    const [targetMargin, setTargetMargin] = useState<number>(0);
    const [revenue, setRevenue] = useState<number>(0);
    const [manDays, setManDays] = useState<number>(0);
    const [status, setStatus] = useState<"Active" | "Inactive" | "Pending" | "Finished">("Active");
    const [name, setName] = useState("");
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Create a payload using lower-case keys to match your DB columns
        const payload = {
            projectlead: projectLead,
            angebotsnummer,
            client,
            framecontract: frameContract,
            purchaseorder: purchaseOrder,
            projectname: projectName,
            linktoprojectfolder: linkToProjectFolder,
            targetmargin: targetMargin,
            revenue,
            mandays: manDays,
            status,
            name,
            periodstart: new Date(periodStart),
            periodend: new Date(periodEnd),
        };

        const { data, error } = await supabase
            .from("projects")
            .insert([payload])
            .single();

        if (!error && data) {
            // Transform the response so that the keys match your type (camelCase)
            const transformed: ProjectSchema = {
                id: data.id,
                projectLead: data.projectlead,
                angebotsnummer: data.angebotsnummer,
                client: data.client,
                frameContract: data.framecontract,
                purchaseOrder: data.purchaseorder,
                projectName: data.projectname,
                linkToProjectFolder: data.linktoprojectfolder,
                targetMargin: data.targetmargin,
                revenue: data.revenue,
                manDays: data.mandays,
                status: data.status,
                name: data.name,
                periodStart: data.periodstart,
                periodEnd: data.periodend,
            };

            onProjectAdded(transformed);
            // Clear fields
            setProjectLead(0);
            setAngebotsnummer("");
            setClient("");
            setFrameContract("");
            setPurchaseOrder("");
            setProjectName("");
            setLinkToProjectFolder("");
            setTargetMargin(0);
            setRevenue(0);
            setManDays(0);
            setStatus("Active");
            setName("");
            setPeriodStart("");
            setPeriodEnd("");
            setOpen(false);
        } else {
            console.error("Error creating project:", error);
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Add Project</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>Fill in the project details below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <Input
                        type="number"
                        value={projectLead}
                        onChange={(e) => setProjectLead(Number(e.target.value))}
                        placeholder="Project Lead (ID)"
                        required
                    />
                    <Input
                        value={angebotsnummer}
                        onChange={(e) => setAngebotsnummer(e.target.value)}
                        placeholder="Angebotsnummer"
                        required
                    />
                    <Input
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="Client"
                        required
                    />
                    <Input
                        value={frameContract}
                        onChange={(e) => setFrameContract(e.target.value)}
                        placeholder="Frame Contract"
                    />
                    <Input
                        value={purchaseOrder}
                        onChange={(e) => setPurchaseOrder(e.target.value)}
                        placeholder="Purchase Order"
                    />
                    <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project Name"
                        required
                    />
                    <Input
                        value={linkToProjectFolder}
                        onChange={(e) => setLinkToProjectFolder(e.target.value)}
                        placeholder="Link to Project Folder"
                    />
                    <Input
                        type="number"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(Number(e.target.value))}
                        placeholder="Target Margin"
                    />
                    <Input
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(Number(e.target.value))}
                        placeholder="Revenue"
                    />
                    <Input
                        type="number"
                        value={manDays}
                        onChange={(e) => setManDays(Number(e.target.value))}
                        placeholder="Man Days"
                    />
                    <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Finished">Finished</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        required
                    />
                    <Input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        placeholder="Period Start"
                        required
                    />
                    <Input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        placeholder="Period End"
                        required
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ✏️ Edit Project Modal
function EditProjectModal({
                              initialProject,
                              onProjectUpdated,
                              open,
                              onOpenChange,
                          }: {
    initialProject: ProjectSchema;
    onProjectUpdated: (project: ProjectSchema) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [projectLead, setProjectLead] = useState(initialProject.projectLead);
    const [angebotsnummer, setAngebotsnummer] = useState(initialProject.angebotsnummer);
    const [client, setClient] = useState(initialProject.client);
    const [frameContract, setFrameContract] = useState(initialProject.frameContract);
    const [purchaseOrder, setPurchaseOrder] = useState(initialProject.purchaseOrder);
    const [projectName, setProjectName] = useState(initialProject.projectName);
    const [linkToProjectFolder, setLinkToProjectFolder] = useState(initialProject.linkToProjectFolder);
    const [targetMargin, setTargetMargin] = useState(initialProject.targetMargin);
    const [revenue, setRevenue] = useState(initialProject.revenue);
    const [manDays, setManDays] = useState(initialProject.manDays);
    const [status, setStatus] = useState(initialProject.status);
    const [name, setName] = useState(initialProject.name);
    const [periodStart, setPeriodStart] = useState(
        initialProject.periodStart ? new Date(initialProject.periodStart).toISOString().split("T")[0] : ""
    );
    const [periodEnd, setPeriodEnd] = useState(
        initialProject.periodEnd ? new Date(initialProject.periodEnd).toISOString().split("T")[0] : ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            projectlead: projectLead,
            angebotsnummer,
            client,
            framecontract: frameContract,
            purchaseorder: purchaseOrder,
            projectname: projectName,
            linktoprojectfolder: linkToProjectFolder,
            targetmargin: targetMargin,
            revenue,
            mandays: manDays,
            status,
            name,
            periodstart: new Date(periodStart),
            periodend: new Date(periodEnd),
        };

        const { data, error } = await supabase
            .from("projects")
            .update(payload)
            .eq("id", initialProject.id)
            .single();

        if (!error && data) {
            const transformed: ProjectSchema = {
                id: data.id,
                projectLead: data.projectlead,
                angebotsnummer: data.angebotsnummer,
                client: data.client,
                frameContract: data.framecontract,
                purchaseOrder: data.purchaseorder,
                projectName: data.projectname,
                linkToProjectFolder: data.linktoprojectfolder,
                targetMargin: data.targetmargin,
                revenue: data.revenue,
                manDays: data.mandays,
                status: data.status,
                name: data.name,
                periodStart: data.periodstart,
                periodEnd: data.periodend,
            };
            onProjectUpdated(transformed);
        } else {
            console.error("Error updating project:", error);
        }
        setIsSubmitting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* input fields here as in original code */}
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Update"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ❌ Delete Project Modal
function DeleteProjectModal({
                                project,
                                onProjectDeleted,
                                open,
                                onOpenChange,
                            }: {
    project: ProjectSchema;
    onProjectDeleted: (projectId: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const { error } = await supabase.from("projects").delete().eq("id", project.id);
        if (!error) {
            onProjectDeleted(project.id);
            onOpenChange(false);
        } else {
            console.error("Delete error:", error);
        }
        setIsDeleting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{project.projectName}</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 🎯 Main Project Page
export default function ProjectPage() {
    const [projects, setProjects] = useState<ProjectSchema[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const [projectsRes, usersRes] = await Promise.all([
                supabase.from("projects").select("*"),
                supabase.from("users").select("id, name"),
            ]);

            if (projectsRes.error) {
                console.error("Error fetching projects:", projectsRes.error);
                return;
            }

            if (usersRes.error) {
                console.error("Error fetching users:", usersRes.error);
                return;
            }

            const usersMap = new Map(usersRes.data.map((u) => [u.id, u.name]));

            const enrichedProjects = projectsRes.data.map((project: any) => ({
                ...project,
                frameContract: project.framecontract,
                purchaseOrder: project.purchaseorder,
                projectName: project.projectname,
                projectFolder: project.linktoprojectfolder,
                periodStart: project.periodstart,
                periodEnd: project.periodend,
                projectLeadName: usersMap.get(project.projectlead) || "Unknown",
                projectLead: project.projectlead,
            }));

            setProjects(enrichedProjects);
            setLoading(false);
        })();
    }, []);


    const columns: ColumnDef<ProjectSchema>[] = [
        // 1) Row selection checkbox
        {
            id: "select",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={(e) => row.toggleSelected(e.target.checked)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 28,
        },

        // 2) id
        {
            header: "ID",
            accessorKey: "id",
            size: 150,
            cell: ({ row }) => <span>{row.getValue("id")}</span>,
        },

        // 3) projectLead
        {
            header: "Project Lead",
            accessorKey: "projectLeadName",
            cell: ({ row }) => (
                <div className="max-w-[180px] truncate">
                    {row.getValue("projectLeadName")}
                </div>
            ),
            size: 180,
        },
        // 4) angebotsnummer
        {
            header: "Angebotsnummer",
            accessorKey: "angebotsnummer",
            size: 150,
        },

        // 5) client
        {
            header: "Client",
            accessorKey: "client",
            size: 180,
        },

        // 6) frameContract
        {
            header: "Frame Contract",
            accessorKey: "frameContract",
            size: 160,
        },

        // 7) purchaseOrder
        {
            header: "Purchase Order",
            accessorKey: "purchaseOrder",
            size: 150,
        },

        // 8) projectName
        {
            header: "Project Name",
            accessorKey: "projectName",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("projectName")}</div>
            ),
            size: 180,
        },

        // 9) linkToProjectFolder
        {
            header: "Project Folder",
            accessorKey: "projectFolder",
            cell: ({ row }) => {
                const url = row.getValue<string>("projectFolder");
                return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Open Folder
                    </a>
                ) : (
                    <span className="text-muted-foreground">No link</span>
                );
            },
            size: 160,
        },

        // 10) targetMargin
        {
            header: "Target Margin",
            accessorKey: "targetMargin",
            size: 100,
        },

        // 11) revenue
        {
            header: "Revenue",
            accessorKey: "revenue",
            size: 100,
        },

        // 12) manDays
        {
            header: "Man Days",
            accessorKey: "manDays",
            size: 80,
        },

        // 13) status
        {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => (
                <Badge
                    className={cn(
                        row.getValue("status") === "Inactive" && "bg-muted-foreground/60 text-primary-foreground"
                    )}
                >
                    {row.getValue("status")}
                </Badge>
            ),
            size: 120,
        },

        // 14) name
        {
            header: "Name",
            accessorKey: "name",
            size: 140,
        },

        // 15) periodStart
        {
            header: "Period Start",
            accessorKey: "periodStart",
            cell: ({ row }) => {
                const dateVal = row.getValue<Date>("periodStart");
                return dateVal ? new Date(dateVal).toLocaleDateString() : "";
            },
            size: 120,
        },

        // 16) periodEnd
        {
            header: "Period End",
            accessorKey: "periodEnd",
            cell: ({ row }) => {
                const dateVal = row.getValue<Date>("periodEnd");
                return dateVal ? new Date(dateVal).toLocaleDateString() : "";
            },
            size: 120,
        },

        // 17) Actions (edit/delete)
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const [editOpen, setEditOpen] = useState(false);
                const [deleteOpen, setDeleteOpen] = useState(false);
                return (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex justify-end">
                                    <Button size="icon" variant="ghost" className="shadow-none" aria-label="Edit project">
                                        <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
                                    </Button>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>Archive</DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem>Move to folder</DropdownMenuItem>
                                                <DropdownMenuItem>Advanced options</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>Share</DropdownMenuItem>
                                    <DropdownMenuItem>Add to favorites</DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <EditProjectModal
                            initialProject={row.original}
                            open={editOpen}
                            onOpenChange={setEditOpen}
                            onProjectUpdated={(updatedProject) => {
                            }}
                        />
                        <DeleteProjectModal
                            project={row.original}
                            open={deleteOpen}
                            onOpenChange={setDeleteOpen}
                            onProjectDeleted={(projectId) => {
                            }}
                        />
                    </>
                );
            },
        },
    ];


    return (
        <GenericTable<ProjectSchema>
            data={projects}
            columns={columns}
            globalFilterKey="projectName"
            renderActions={<CreateProjectModal onProjectAdded={(p) => setProjects((prev) => [...prev, p])} />}
        />
    );
}
