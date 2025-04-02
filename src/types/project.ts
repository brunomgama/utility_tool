export type ProjectSchema = {
    id: string;
    status: "Active" | "Inactive" | "Pending" | "Finished";
    client: string;
    name: string;
    periodStart: Date;
    periodEnd: Date;
    projectLead: number;
};