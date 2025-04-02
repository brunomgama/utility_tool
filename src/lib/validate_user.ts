import {auth0} from "@/lib/auth0";
import {redirect} from "next/navigation";
import {supabase} from "@/lib/supabase";

export const validate_user = async () => {
    const session = await auth0.getSession();
    if (!session) {
        redirect("/auth/login")
    }

    const user_id = session.user.sub;

    const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", user_id)
        .single();

    if (error || !user) {
        redirect("/onboarding")
    }

    return session;
}