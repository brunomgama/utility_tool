import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import * as React from "react";
import {Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

interface ProjectTabStatusProps {
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setStatusFilter: React.Dispatch<React.SetStateAction<string[]>>;
    setOpenCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ProjectTabStatus({ searchTerm, setSearchTerm, setStatusFilter, setOpenCreateModal }: ProjectTabStatusProps ) {
    return (
        <>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[15rem]"/>
            </div>

            <Tabs defaultValue="all" className="w-[15rem]">
                <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="all" onClick={() => setStatusFilter([])} className="text-xs">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="active" onClick={() => setStatusFilter(["Active"])} className="text-xs">
                        Active
                    </TabsTrigger>
                    <TabsTrigger value="pending" onClick={() => setStatusFilter(["Pending"])} className="text-xs">
                        Pending
                    </TabsTrigger>
                    <TabsTrigger value="finished" onClick={() => setStatusFilter(["Finished"])} className="text-xs">
                        Finished
                    </TabsTrigger>

                </TabsList>
            </Tabs>

            <Button onClick={() => setOpenCreateModal(true)}>Add Project</Button>
        </>
    )
}