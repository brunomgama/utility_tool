import ProjectDashboard from "@/components/custom/project/ProjectDashboard";
import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";

export default async function AllocationPage() {
    const session = await validate_user();

    if(!session) { return (<MessageLoading/>); }

    return (
        <div>
            <ProjectDashboard />
        </div>
    )
}