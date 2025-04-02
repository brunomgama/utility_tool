import {auth0} from "@/lib/auth0";
import {redirect} from "next/navigation";
import AllocationsDashboard from "@/components/custom/dashboards/AllocationDashboard";

export default async function AllocationPage() {
    const session = await auth0.getSession();

    if (!session) {
        return (
            redirect("/auth/login")
        );
    }

    return (
        <div>
            <AllocationsDashboard />
        </div>
    )
}