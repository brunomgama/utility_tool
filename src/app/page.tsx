import Dashboard from "@/components/custom/Dashboard";
import {auth0} from "@/lib/auth0";
import {redirect} from "next/navigation";

export default async function Home() {
    const session = await auth0.getSession();

    if (!session) {
        return (
            redirect("/auth/login")
        );
    }

    return (
        <main className="container mx-auto py-6">
            <Dashboard/>
        </main>
    )
}

