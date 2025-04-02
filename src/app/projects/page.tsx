"use client";

import { useEffect, useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TbFolderPlus } from "react-icons/tb";
import { supabase } from "@/lib/supabase";
import GenericTable from "@/components/custom/GenericTable";
import { ProjectSchema } from "@/types/project";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ellipsis } from "lucide-react";

// Filtering Functions
const multiColumnFilterFn = (row: any, columnId: string, filterValue: string) => {
    const searchableRowContent = `${row.original.client} ${row.original.name}`.toLowerCase();
    return searchableRowContent.includes(filterValue.toLowerCase());
};

const statusFilterFn = (row: any, columnId: string, filterValue: string[]) => {
    if (!filterValue?.length) return true;
    const status = row.getValue(columnId) as string;
    return filterValue.includes(status);
};

// Columns Definition for ProjectSchema
const columns: ColumnDef<ProjectSchema>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
    },
    {
        header: "ID",
        accessorKey: "id",
        cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Client",
        accessorKey: "client",
        cell: ({ row }) => <div className="font-medium">{row.getValue("client")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
            <Badge className={cn(row.getValue("status") === "Inactive" && "bg-muted-foreground/60 text-primary-foreground")}>
                {row.getValue("status")}
            </Badge>
        ),
        size: 100,
        filterFn: statusFilterFn,
    },
    {
        header: "Period Start",
        accessorKey: "periodStart",
        cell: ({ row }) => {
            const date = new Date(row.getValue("periodStart"));
            return date.toLocaleDateString();
        },
        size: 120,
    },
    {
        header: "Period End",
        accessorKey: "periodEnd",
        cell: ({ row }) => {
            const date = new Date(row.getValue("periodEnd"));
            return date.toLocaleDateString();
        },
        size: 120,
    },
    {
        header: "Project Lead",
        // We now display the joined user's name
        cell: ({ row }) => <div>{row.original.projectlead?.name}</div>,
        size: 150,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<ProjectSchema> }) {
    return (
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
                    <DropdownMenuItem>
                        <span>Edit</span>
                        <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <span>Duplicate</span>
                        <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <span>Archive</span>
                        <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                    </DropdownMenuItem>
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
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <span>Delete</span>
                    <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// AddProjectModal Component
type AddProjectModalProps = {
    onProjectAdded: (project: ProjectSchema) => void;
};

function AddProjectModal({ onProjectAdded }: AddProjectModalProps) {
    const [open, setOpen] = useState(false);
    const [id, setId] = useState("");
    const [client, setClient] = useState("");
    const [name, setName] = useState("");
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");
    const [projectLead, setProjectLead] = useState(""); // now a UUID string
    const [status, setStatus] = useState<"Active" | "Inactive" | "Pending" | "Finished">("Active");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        async function fetchUsers() {
            const { data, error } = await supabase
                .from("users")
                .select("id, name")
                .order("name", { ascending: true });
            if (error) {
                console.error("Error fetching users:", error);
            } else {
                setUsers(data || []);
            }
        }
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = await supabase
            .from("projects")
            .insert([
                {
                    id,
                    client,
                    name,
                    periodstart: periodStart,
                    periodend: periodEnd,
                    projectlead: projectLead,
                    status,
                },
            ])
            .single();

        if (error) {
            console.error("Error adding project:", error);
        } else if (data) {
            const newProject: ProjectSchema = {
                ...data,
                periodStart: data.periodstart ? new Date(data.periodstart) : new Date(),
                periodEnd: data.periodend ? new Date(data.periodend) : new Date(),
                projectLead: data.projectlead,
            };
            onProjectAdded(newProject);
            setId("");
            setClient("");
            setName("");
            setPeriodStart("");
            setPeriodEnd("");
            setProjectLead("");
            setStatus("Active");
        }
        setIsSubmitting(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)}>
                    <TbFolderPlus />
                    Add Project
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="id">ID</label>
                            <Input
                                id="id"
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="client">Client</label>
                            <Input
                                id="client"
                                type="text"
                                value={client}
                                onChange={(e) => setClient(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="name">Project Name</label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="periodStart">Period Start</label>
                            <Input
                                id="periodStart"
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="periodEnd">Period End</label>
                            <Input
                                id="periodEnd"
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full">
                            <label htmlFor="projectLead">Project Lead</label>
                            <Select value={projectLead} onValueChange={(value) => setProjectLead(value)}>
                                <SelectTrigger id="projectLead" className="input w-full">
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full">
                            <label htmlFor="status">Status</label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setStatus(value as "Active" | "Inactive" | "Pending" | "Finished")
                                }
                            >
                                <SelectTrigger id="status" className="input w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Finished">Finished</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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

// ProjectPage Component
export default function ProjectPage() {
    const [projects, setProjects] = useState<ProjectSchema[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjects() {
            const { data, error } = await supabase
                .from("projects")
                .select("id, status, client, name, periodstart, periodend, projectlead (name)")
                .order("name", { ascending: true });

            if (error) {
                console.error("Error fetching projects:", error);
            } else if (data) {
                const enriched = data.map((project) => ({
                    ...project,
                    periodStart: project.periodstart ? new Date(project.periodstart) : new Date(),
                    periodEnd: project.periodend ? new Date(project.periodend) : new Date(),
                }));
                setProjects(enriched);
            }
            setLoading(false);
        }
        fetchProjects();
    }, []);

    return (
        <GenericTable<ProjectSchema>
            data={projects}
            columns={columns}
            globalFilterKey="name"
            renderActions={
                <AddProjectModal onProjectAdded={(newProject) => setProjects((prev) => [...prev, newProject])} />
            }
        />
    );
}
