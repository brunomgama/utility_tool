import UsersDashboard from "@/components/custom/dashboards/UsersDashboard";
import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";

export default async function UsersPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return (
        <div>
            <UsersDashboard />
        </div>
    )
}

