import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Calendar} from "lucide-react";
import {format} from "date-fns";
import {Calendar as CalendarComponent} from "@/components/ui/calendar";
import * as React from "react";
import {UserNewAllocation, UserSchema} from "@/types/user";
import {ProjectSchema} from "@/types/project";
import {ProjectRoleSchema} from "@/types/project_role";
import {supabase} from "@/lib/supabase";
import {AllocationSchema} from "@/types/allocation";

interface ProjectAllocationDialogProps {
    addAllocationOpen: boolean;
    setAddAllocationOpen: (open: boolean) => void;
    selectedProject: ProjectSchema | null;
    newAllocation: UserNewAllocation
    setNewAllocation: (allocation: UserNewAllocation) => void;
    availableUsers: UserSchema[];
    availableUnassignedRoles: ProjectRoleSchema[];
    users: UserSchema[];
    allocations: AllocationSchema[];
    setAllocations: (allocations: AllocationSchema[]) => void;
}

export default function ProjectAllocationDialog({addAllocationOpen, setAddAllocationOpen, selectedProject,
                                                    newAllocation, setNewAllocation, availableUsers,
                                                    availableUnassignedRoles, users, allocations, setAllocations}:
    ProjectAllocationDialogProps) {

    const handleAddAllocation = async () => {
        if (!selectedProject || !newAllocation.user_id || !newAllocation.role_name || !newAllocation.start_date) {
            return
        }

        try {
            const { data, error } = await supabase
                .from("allocations")
                .insert({
                    project_id: selectedProject.id,
                    user_id: newAllocation.user_id,
                    role: newAllocation.role_id,
                    percentage: newAllocation.percentage / 100,
                    start_date: format(newAllocation.start_date, "yyyy-MM-dd"),
                    end_date: newAllocation.end_date ? format(newAllocation.end_date, "yyyy-MM-dd") : null,
                })
                .select()

            if (error) throw error

            const newAllocationData = {
                ...data[0],
                percentage: Number(data[0].percentage),
                start_date: new Date(data[0].start_date),
                end_date: data[0].end_date ? new Date(data[0].end_date) : null,
                user: users.find((u) => u.id === data[0].user_id),
            }

            setAllocations([...allocations, newAllocationData])

            setNewAllocation({
                user_id: "",
                role_id: "",
                role_name: "",
                percentage: 100,
                start_date: new Date(),
                end_date: new Date(),
            })

            setAddAllocationOpen(false)
        } catch (error) {
            console.error("Error adding allocation:", error)
        }
    }

    return (
        <Dialog open={addAllocationOpen} onOpenChange={setAddAllocationOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Allocate a team member to {selectedProject?.project_name}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Team Member</Label>
                        <Select
                            value={newAllocation.user_id}
                            onValueChange={(value) => setNewAllocation({...newAllocation, user_id: value})}>
                            <SelectTrigger id="user" className={"w-full"}>
                                <SelectValue placeholder="Select a team member"/>
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.department})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Project Role</Label>
                        <Select
                            value={newAllocation.role_id}
                            onValueChange={(value) => {
                                const selectedRole = availableUnassignedRoles.find((r) => r.id === value)
                                setNewAllocation({
                                    ...newAllocation,
                                    role_id: value,
                                    role_name: selectedRole?.role || "",
                                })
                            }}>
                            <SelectTrigger id="role" className="w-full">
                                <SelectValue placeholder="Select a role"/>
                            </SelectTrigger>
                            <SelectContent>
                                {availableUnassignedRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                            {availableUnassignedRoles.length === 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    All roles have been assigned. No roles available.
                                </p>
                            )}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="percentage">Allocation Percentage</Label>
                        <div className="flex items-center gap-2">
                            <Input id="percentage" type="number"
                                min={1} max={100} value={newAllocation.percentage}
                                onChange={(e) =>
                                    setNewAllocation({
                                        ...newAllocation,
                                        percentage: Number.parseInt(e.target.value) || 100
                                    })
                                }
                            />
                            <span>%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <Calendar className="mr-2 h-4 w-4"/>
                                        {newAllocation.start_date ? format(newAllocation.start_date, "PPP") :
                                            <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent mode="single"
                                        selected={newAllocation.start_date}
                                        onSelect={(date) => date && setNewAllocation({
                                            ...newAllocation,
                                            start_date: date
                                        })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAddAllocationOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddAllocation}>
                        Add Team Member
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}