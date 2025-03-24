"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useSidebar } from "@/context/sidebar-context";

export default function Home() {
    const { isCollapsed } = useSidebar();

    return (
        <main
            className={`transition-all duration-300 ${
                isCollapsed ? "ml-[3.05rem]" : "ml-[15rem]"
            } p-6`}
        >
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold">Card {i + 1}</h2>
                            <p className="text-sm text-muted-foreground">
                                This is a description for card {i + 1}.
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    );
}
