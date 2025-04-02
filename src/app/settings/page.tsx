import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";
import SettingsDashboard from "@/components/custom/dashboards/SettingsDashboard";

export default async function SettingsPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return <SettingsDashboard session={session}/>;
}
