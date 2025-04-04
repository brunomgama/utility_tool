import HomeDashboard from "@/components/custom/dashboards/HomeDashboard";
import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";

export default async function Home() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return (
        <main className="container mx-auto py-6">
            <HomeDashboard />
        </main>
    )
}

