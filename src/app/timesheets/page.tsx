import { auth0 } from "@/lib/auth0";
import TimeTrackingDashboard from "@/components/custom/dashboards/TimeTrackingDashboard";
import {redirect} from "next/navigation";

export default async function TimesheetsPage() {
    const session = await auth0.getSession();

    if (!session) {
        return (
            redirect("/auth/login")
        );
    }

    return <TimeTrackingDashboard session={session} />;
}
