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
import { Ellipsis } from "lucide-react";
import { supabase } from "@/lib/supabase";
import GenericTable from "@/components/custom/GenericTable";
import { UserSchema } from "@/types/user";

// Import Dialog components (assuming your UI library exposes these)
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";

// FILTERING FUNCTIONS
const multiColumnFilterFn = (row: any, columnId: string, filterValue: string) => {
    const searchableRowContent = `${row.original.name} ${row.original.email}`.toLowerCase();
    return searchableRowContent.includes(filterValue.toLowerCase());
};

const statusFilterFn = (row: any, columnId: string, filterValue: string[]) => {
    if (!filterValue?.length) return true;
    const status = row.getValue(columnId) as string;
    return filterValue.includes(status);
};

// TABLE COLUMNS
const columns: ColumnDef<UserSchema>[] = [
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
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Email",
        accessorKey: "email",
        size: 220,
    },
    {
        header: "Location",
        accessorKey: "location",
        cell: ({ row }) => (
            <div>
                <span className="text-lg leading-none">{row.original.flag}</span> {row.getValue("location")}
            </div>
        ),
        size: 180,
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
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<UserSchema> }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex justify-end">
                    <Button size="icon" variant="ghost" className="shadow-none" aria-label="Edit item">
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
                                <DropdownMenuItem>Move to project</DropdownMenuItem>
                                <DropdownMenuItem>Move to folder</DropdownMenuItem>
                                <DropdownMenuSeparator />
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

function getFlagFromLocation(location: string) {
    const code = location.split(", ")[1];
    const flags: Record<string, string> = {
        DE: "🇩🇪",
        PT: "🇵🇹",
    };
    return flags[code] || "🌍";
}

type AddUserModalProps = {
    onUserAdded: (user: UserSchema) => void;
};

function AddUserModal({ onUserAdded }: AddUserModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState<"Active" | "Inactive" | "Pending">("Active");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = await supabase
            .from("users")
            .insert([{ name, email, location, status }])
            .single();

        if (error) {
            console.error("Error adding user:", error);
        } else if (data) {
            const newUser: UserSchema = { ...data, flag: getFlagFromLocation(location) };
            onUserAdded(newUser);
            setName("");
            setEmail("");
            setLocation("");
            setStatus("Active");
            setOpen(false);
        }
        setIsSubmitting(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)}>
                    Add user
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Fill in the information below to add a new user.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="location">Location</label>
                            <input
                                id="location"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) =>
                                    setStatus(e.target.value as "Active" | "Inactive" | "Pending")
                                }
                                className="input"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                            </select>
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

// UserPage Component
export default function UserPage() {
    const [users, setUsers] = useState<UserSchema[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, email, location, status")
                .order("name", { ascending: true });

            if (error) {
                console.error("Error fetching users:", error);
            } else {
                const enriched = data.map((user) => ({
                    ...user,
                    flag: getFlagFromLocation(user.location),
                }));
                setUsers(enriched);
            }
            setLoading(false);
        }
        fetchUsers();
    }, []);

    return (
        <GenericTable<UserSchema>
            data={users}
            columns={columns}
            globalFilterKey="name"
            renderActions={
                <AddUserModal onUserAdded={(newUser) => setUsers((prev) => [...prev, newUser])} />
            }
        />
    );
}
