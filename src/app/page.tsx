import HomeDashboard from "@/components/custom/dashboards/HomeDashboard";
import {validate_user} from "@/lib/validate_user";

export default async function Home() {
    await validate_user();

    return (
        <main className="container mx-auto py-6">
            <HomeDashboard />
        </main>
    )
}

