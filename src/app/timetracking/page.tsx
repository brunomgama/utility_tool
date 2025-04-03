import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";
import TimeTrackingDashboard from "@/components/custom/time-tracking/TimeTrackingDashboard";

export default async function TimeTrackingPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return <TimeTrackingDashboard session={session}/>;
}
