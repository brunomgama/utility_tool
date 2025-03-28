import {auth0} from "@/lib/auth0";
import {redirect} from "next/navigation";
import ProjectsDashboard from "@/components/custom/dashboards/ProjectDashboard";

export default async function ProjectsTable() {
    const session = await auth0.getSession();

    if (!session) {
        return (
            redirect("/auth/login")
        );
    }

    return (
        <div>
            <ProjectsDashboard />
        </div>
    )
}