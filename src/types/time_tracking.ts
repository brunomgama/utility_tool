export type TimeTrackingSchema = {
    id: string
    user_id: string
    project_id: string
    date: Date
    hours: number
    description: string
    status: "Draft" | "Submitted" | "Approved" | "Rejected"
    tags?: string[],
    billable?: boolean
}