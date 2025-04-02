export type UserSchema = {
    id: string;
    name: string;
    email: string;
    location: string;
    role: "Admin" | "User";
    department: string;
    status: "Active" | "Inactive" | "Pending";
};