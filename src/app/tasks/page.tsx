import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";
import TasksDashboard from "@/components/custom/dashboards/TasksDashboard";

export default async function TasksPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return <TasksDashboard session={session}/>;
}
