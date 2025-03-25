export type ProjectSchema = {
    id: string;
    projectLead: number;
    angebotsnummer: string;
    client: string;
    frameContract: string;
    purchaseOrder: string;
    projectName: string;
    linkToProjectFolder: string;
    targetMargin: number;
    revenue: number;
    manDays: number;
    status: "Active" | "Inactive" | "Pending" | "Finished";
    name: string;
    periodStart: Date;
    periodEnd: Date;
};