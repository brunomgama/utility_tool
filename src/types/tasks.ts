export type TasksSchema = {
    id: string
    title: string
    type: "Bug" | "Feature" | "Task" | "Improvement" | "Epic";
    priority: "Lowest" | "Low" | "Medium" | "High" | "Highest"
    labels: string[]
    epic_id?: string
    description: string
    assignee_id?: string
    reporter_id: string
    status: "on_hold" | "blocked" | "in_progress" | "review" | "done"
    created_at: Date
    updated_at: Date
    due_date?: Date
    estimated_hours?: number
    actual_hours?: number
    comments: CommentSchema[]
    attachments: AttachmentSchema[]
    related_task_ids: string[]
    subtask_ids: string[]
}

export type AttachmentSchema = {
    id: string
    task_id: string
    name: string
    url: string
    type: string
    size: number
    uploaded_at: Date
    uploaded_by_id: string
}

export type CommentSchema = {
    id: string
    task_id: string
    user_id: string
    content: string
    created_at: Date
}