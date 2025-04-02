"use client";

import { useEffect, useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { supabase } from "@/lib/supabase";
import { UserSchema } from "@/types/user";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ellipsis } from "lucide-react";
import { TbUsersPlus } from "react-icons/tb";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuShortcut,
    DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// 🔎 Filtering functions
const multiColumnFilterFn = (row: any, filterValue: string) => {
    const searchableRowContent = `${row.original.name} ${row.original.email}`.toLowerCase();
    return searchableRowContent.includes(filterValue.toLowerCase());
};

const statusFilterFn = (row: any, columnId: string, filterValue: string[]) => {
    if (!filterValue?.length) return true;
    const status = row.getValue(columnId) as string;
    return filterValue.includes(status);
};

// 🌍 Flag Helper
function getFlagFromLocation(location: string) {
    const code = location.split(", ")[1];
    const flags: Record<string, string> = {
        DE: "🇩🇪",
        PT: "🇵🇹",
    };
    return flags[code] || "🌍";
}

// 📝 Add User Modal
function AddUserModal({ onUserAdded }: { onUserAdded: (user: UserSchema) => void }) {
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

        if (!error && data) {
            const newUser = { ...data, flag: getFlagFromLocation(location) };
            onUserAdded(newUser);
            setName("");
            setEmail("");
            setLocation("");
            setStatus("Active");
            setOpen(false);
        } else {
            console.error("Error adding user:", error);
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <TbUsersPlus className="mr-2" />
                    Add user
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Fill in the information below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" required />
                        <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
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

// ✏️ Edit Modal
function EditUserModal({initialUser, onUserUpdated, open, onOpenChange,
                       }: { initialUser: UserSchema; onUserUpdated: (user: UserSchema) => void; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const [name, setName] = useState(initialUser.name);
    const [email, setEmail] = useState(initialUser.email);
    const [location, setLocation] = useState(initialUser.location);
    const [status, setStatus] = useState(initialUser.status);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = await supabase
            .from("users")
            .update({ name, email, location, status })
            .eq("id", initialUser.id)
            .single();

        if (!error && data) {
            onUserUpdated({ ...data, flag: getFlagFromLocation(data.location) });
        } else {
            console.error("Update error:", error);
        }
        setIsSubmitting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                        <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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

// ❌ Delete Modal
function DeleteUserModal({user, onUserDeleted, open, onOpenChange
                        }: { user: UserSchema; onUserDeleted: (userId: string) => void; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const { error } = await supabase.from("users").delete().eq("id", user.id);
        if (!error) {
            onUserDeleted(user.id);
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
                        Are you sure you want to delete <strong>{user.name}</strong>?
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

// 🎯 Main Page
export default function UserPage() {
    const [users, setUsers] = useState<UserSchema[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, email, location, status")
                .order("name", { ascending: true });

            if (!error && data) {
                const enriched = data.map((u) => ({
                    ...u,
                    flag: getFlagFromLocation(u.location),
                }));
                setUsers(enriched);
            } else {
                console.error("Fetch error:", error);
            }
            setLoading(false);
        })();
    }, []);

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
                                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                        Edit
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
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                                    Delete
                                    <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <EditUserModal
                            initialUser={row.original}
                            open={editOpen}
                            onOpenChange={setEditOpen}
                            onUserUpdated={(user) => {
                                setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
                            }}
                        />
                        <DeleteUserModal
                            user={row.original}
                            open={deleteOpen}
                            onOpenChange={setDeleteOpen}
                            onUserDeleted={(userId) => {
                                setUsers((prev) => prev.filter((u) => u.id !== userId));
                            }}
                        />
                    </>
                );
            },
        },
    ];

    return (
        <GenericTable<UserSchema>
            data={users}
            columns={columns}
            globalFilterKey="name"
            renderActions={<AddUserModal onUserAdded={(u) => setUsers((prev) => [...prev, u])} />}
        />
    );
}
