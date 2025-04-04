export type UserSchema = {
    id: string;
    name: string;
    email: string;
    location: string;
    role: "Admin" | "User";
    department: string;
    status: "Active" | "Inactive" | "Pending";
};

export type UserAllocation = {
    id: string
    user_id: string
    project_id: string
    percentage: number
    role: string
    start_date: string
    end_date: string
    project?: {
        id: string
        projectName: string
        client: string
        status: string
    }
}

export type UserNewAllocation = {
    user_id: string,
    role_id: string,
    role_name: string,
    percentage: number,
    start_date: Date,
    end_date: Date | null
}