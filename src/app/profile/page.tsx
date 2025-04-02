import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";
import ProfileDashboard from "@/components/custom/dashboards/ProfileDashboard";

export default async function ProfilePage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return <ProfileDashboard session={session}/>;
}
