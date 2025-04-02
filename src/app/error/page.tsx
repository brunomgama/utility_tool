import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative mx-auto">
                    <div className="animate-pulse-ring absolute inset-0 rounded-full border-4 border-primary opacity-75"></div>
                    <div className="animate-float relative bg-background rounded-full p-6 shadow-lg">
                        <AlertCircle className="h-16 w-16 text-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground mt-2 animate-appear animation-delay-100">Page Not Found</h2>
                <p className="text-muted-foreground mt-4 animate-appear animation-delay-200">
                    Oops! The page you&rsquo;re looking for seems to have wandered off into the digital wilderness.
                </p>

                <div className="mt-8 animate-appear animation-delay-300">
                    <Link href="/">
                        <Button size="lg" className="group">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

