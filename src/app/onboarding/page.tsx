import OnboardingForm from "@/components/custom/OnboardingForm";
import {auth0} from "@/lib/auth0";
import MessageLoading from "@/components/custom/spinner/Loading";

export default async function TimesheetsPage() {
    const session = await auth0.getSession();
    const email = session?.user.email;

    if(!session || !email || session!.user.sub === undefined) { return ( <MessageLoading/> ); }

    return <OnboardingForm email={email} auth_id={session!.user.sub}/>;
}
