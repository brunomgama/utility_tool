import TimeSheetAnalysisDashboard from "@/components/custom/dashboards/TimeSheetAnalysisDashboard";
import {validate_user} from "@/lib/validate_user";
import {MessageLoading} from "@/components/custom/spinner/Loading";

export default async function TimesheetsPage() {
    const session = await validate_user();

    if(!session) {
        return (
            <main className="flex items-center justify-center min-h-screen">
                <MessageLoading/>
            </main>
        );
    }

    return <TimeSheetAnalysisDashboard />;
}
