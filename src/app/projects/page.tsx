import { validate_user } from "@/lib/validate_user"
import MessageLoading from "@/components/custom/spinner/Loading"
import ProjectsDashboard from "@/components/custom/project/ProjectDashboard";

export default async function ProjectsTable() {
    const session = await validate_user()

    if (!session) {
        return <MessageLoading />
    }

    return (
        <div>
            <ProjectsDashboard />
        </div>
    )
}

