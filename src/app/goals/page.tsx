import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";
import GoalsDashboard from "@/components/custom/dashboards/GoalsDashboard";

export default async function GoalsPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    // return <GoalsDashboard session={session}/>;
    return <GoalsDashboard />;
}
