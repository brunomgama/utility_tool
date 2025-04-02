export type ProjectSchema = {
    id: string;
    project_lead: string;
    angebotsnummer: string;
    client: string;
    frame_contract: string;
    purchase_order: string;
    project_name: string;
    link_to_project_folder: string;
    target_margin: number;
    revenue: number;
    man_days: number;
    status: "Active" | "Inactive" | "Pending" | "Finished";
    name: string;
    description: string
    completed_days: number
    budget: number
    period_start: Date;
    period_end: Date;
    technologies?: string[],
};

export type ProjectResumedSchema = {
    id: string
    project_name: string
    client: string
    status: "Active" | "Inactive" | "Pending" | "Finished"
}

export const ProjectStatusColors: Record<string, string> = {
    Active: "#22C55E",
    Pending: "#EAB308",
    Finished: "#3B82F6",
    Inactive: "#6B7280",
}