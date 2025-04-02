export type DepartmentSchema = {
    id: string
    name: string
}

// TODO: TO BE DELETED AND REPLACE BY THE API CALL
export const departments = [
    "Software Engineering 1",
    "Software Engineering 2",
    "Near Shore",
    "IT",
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
    "Legal",
]

export const departmentColors: Record<string, string> = {
    "Software Engineering 1": "#3B82F6",
    "Software Engineering 2": "#6366F1",
    "Near Shore": "#06B6D4",
    "IT": "#10B981",
    "Sales": "#F59E0B",
    "Human Resources": "#EC4899",
    "Finance": "#8B5CF6",
    "Operations": "#F97316",
    "Legal": "#EF4444",
}
