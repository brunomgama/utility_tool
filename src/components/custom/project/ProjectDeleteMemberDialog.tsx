import {AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from "@/components/ui/alert-dialog";
import {getUserName} from "@/lib/user_name";
import * as React from "react";
import {UserSchema} from "@/types/user";
import {supabase} from "@/lib/supabase";
import {AllocationSchema} from "@/types/allocation";

interface ProjectDeleteMemberDialogProps {
    deleteConfirmOpen: boolean;
    setDeleteConfirmOpen: (open: boolean) => void;
    selectedAllocation: AllocationSchema | null;
    users: UserSchema[];
    setAllocations: (allocations: AllocationSchema[]) => void;
    allocations: AllocationSchema[];
    setSelectedAllocation: (allocation: AllocationSchema | null) => void;
}

export default function ProjectDeleteMemberDialog({deleteConfirmOpen, setDeleteConfirmOpen,
                                                      users, selectedAllocation, setAllocations, allocations, setSelectedAllocation}: ProjectDeleteMemberDialogProps) {

    const handleDeleteAllocation = async () => {
        if (!selectedAllocation) return

        try {
            const { error } = await supabase.from("allocations").delete().eq("id", selectedAllocation.id)

            if (error) throw error

            setAllocations(allocations.filter((a) => a.id !== selectedAllocation.id))

            setDeleteConfirmOpen(false)
            setSelectedAllocation(null)
        } catch (error) {
            console.error("Error removing allocation:", error)
        }
    }

    return (
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove {getUserName(users, selectedAllocation?.user_id || "")} from this project? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllocation} className="bg-red-400 text-destructive-foreground text-white hover:bg-red-600">
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}