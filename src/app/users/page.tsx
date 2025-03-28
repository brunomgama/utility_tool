import UsersDashboard from "@/components/custom/dashboards/UsersDashboard";
import {auth0} from "@/lib/auth0";
import {redirect} from "next/navigation";

export default async function UsersPage() {
    const session = await auth0.getSession();

    if (!session) {
        return (
            redirect("/auth/login")
        );
    }

    return (
        <div>
            <UsersDashboard />
        </div>
    )
}

