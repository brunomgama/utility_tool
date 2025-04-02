import {TaskSchema} from "@/types/tasks";

export type GoalSchema = {
    id: string
    title: string
    description: string | null
    period_evaluation: "monthly" | "quarterly" | "yearly"
    level: "individual" | "team" | "department"
    status: "not_started" | "in_progress" | "completed" | "cancelled"
    priority: "low" | "medium" | "high" | "critical"
    progress: number
    start_date: Date
    end_date: Date
    owner_id: string
    team_id?: string | null
    department_id?: string | null
    created_at: Date
    updated_at: Date
    tasks?: TaskSchema[]
}
