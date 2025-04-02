import VacationDashboard from "@/components/custom/dashboards/VacationDashboard";
import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";

export default async function TimeoffsPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return <VacationDashboard />;
}