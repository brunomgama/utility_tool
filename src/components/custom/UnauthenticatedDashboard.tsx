"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import {
    ArrowRight,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    ClipboardList,
    Globe,
    Laptop,
    type LucideIcon,
    MessageSquare,
    Shield,
    Star,
    Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

// Testimonial type
type Testimonial = {
    name: string
    role: string
    company: string
    image?: string
    content: string
}

// Feature type
type Feature = {
    title: string
    description: string
    icon: LucideIcon
}

// Pricing plan type
type PricingPlan = {
    name: string
    price: string
    description: string
    features: string[]
    popular?: boolean
}

// FAQ type
type FAQ = {
    question: string
    answer: string
}

// Sample data
const testimonials: Testimonial[] = [
    {
        name: "Sarah Johnson",
        role: "Project Manager",
        company: "TechCorp Inc.",
        image: "/placeholder.svg?height=100&width=100",
        content:
            "This platform has transformed how our team tracks time and manages projects. The intuitive interface and powerful analytics have increased our productivity by 35%.",
    },
    {
        name: "Michael Chen",
        role: "CTO",
        company: "Innovate Solutions",
        image: "/placeholder.svg?height=100&width=100",
        content:
            "After trying multiple project management tools, this is the only one that met all our needs. The resource allocation features are particularly impressive.",
    },
    {
        name: "Emma Rodriguez",
        role: "Team Lead",
        company: "Creative Design Studio",
        image: "/placeholder.svg?height=100&width=100",
        content:
            "The time tracking capabilities have made billing clients and managing team workloads so much easier. I can't imagine going back to our old system.",
    },
]

const features: Feature[] = [
    {
        title: "Intuitive Time Tracking",
        description:
            "Effortlessly track time with our user-friendly interface. Log hours, add descriptions, and categorize entries with just a few clicks.",
        icon: Clock,
    },
    {
        title: "Comprehensive Project Management",
        description:
            "Manage projects from inception to completion. Set budgets, track progress, and monitor resource allocation all in one place.",
        icon: ClipboardList,
    },
    {
        title: "Resource Allocation",
        description:
            "Optimize your team's workload with visual resource allocation tools. Prevent burnout and ensure projects are adequately staffed.",
        icon: Users,
    },
    {
        title: "Powerful Analytics",
        description:
            "Gain insights with detailed reports and dashboards. Make data-driven decisions to improve efficiency and profitability.",
        icon: BarChart3,
    },
    {
        title: "Team Collaboration",
        description:
            "Foster teamwork with built-in collaboration tools. Share updates, assign tasks, and communicate within the platform.",
        icon: MessageSquare,
    },
    {
        title: "Calendar Integration",
        description:
            "Sync with your favorite calendar apps. View schedules, deadlines, and important milestones in one unified view.",
        icon: Calendar,
    },
]

const pricingPlans: PricingPlan[] = [
    {
        name: "Starter",
        price: "$9",
        description: "Perfect for freelancers and individuals",
        features: ["Time tracking", "Basic reporting", "Up to 5 projects", "1 user", "Email support"],
    },
    {
        name: "Professional",
        price: "$29",
        description: "Ideal for small teams and growing businesses",
        features: [
            "Everything in Starter",
            "Advanced analytics",
            "Unlimited projects",
            "Up to 10 users",
            "Resource allocation",
            "Priority support",
        ],
        popular: true,
    },
    {
        name: "Enterprise",
        price: "$79",
        description: "For large organizations with complex needs",
        features: [
            "Everything in Professional",
            "Custom reporting",
            "Unlimited users",
            "API access",
            "SSO integration",
            "Dedicated account manager",
            "24/7 phone support",
        ],
    },
]

const faqs: FAQ[] = [
    {
        question: "How does the time tracking work?",
        answer:
            "Our time tracking system allows you to log hours manually or use the timer feature. You can categorize entries by project, add descriptions, and even track billable vs. non-billable hours. The system also supports bulk editing and approval workflows.",
    },
    {
        question: "Can I export reports for billing?",
        answer:
            "Yes, you can generate and export detailed reports in various formats including PDF, Excel, and CSV. These reports can be customized to include specific date ranges, projects, clients, or team members.",
    },
    {
        question: "Is there a mobile app available?",
        answer:
            "We offer mobile apps for both iOS and Android platforms, allowing you to track time, manage projects, and view reports on the go. The mobile apps sync seamlessly with the web application.",
    },
    {
        question: "How secure is my data?",
        answer:
            "We take security seriously. Your data is encrypted both in transit and at rest. We use industry-standard security protocols, regular security audits, and maintain compliance with GDPR, CCPA, and other privacy regulations.",
    },
    {
        question: "Can I integrate with other tools?",
        answer:
            "Yes, our platform offers integrations with popular tools like Slack, Microsoft Teams, Jira, Asana, QuickBooks, and many more. We also provide an API for custom integrations with your existing systems.",
    },
]

// Stats data
const stats = [
    { value: "10,000+", label: "Active Users" },
    { value: "25,000+", label: "Projects Managed" },
    { value: "1M+", label: "Hours Tracked" },
    { value: "99.9%", label: "Uptime" },
]

export default function UnauthenticatedDashboard() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Navigation */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary"/>
                        <span className="text-xl font-bold">TimeTrack</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="#features" className="text-sm font-medium hover:text-primary">Features</Link>
                        <Link href="#testimonials"
                              className="text-sm font-medium hover:text-primary">Testimonials</Link>
                        <Link href="#pricing" className="text-sm font-medium hover:text-primary">Pricing</Link>
                        <Link href="#faq" className="text-sm font-medium hover:text-primary">FAQ</Link>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild>
                            <Link href="/login">Log in</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Sign up</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted">
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid gap-8 md:grid-cols-2 items-center">
                            <div className="space-y-6">
                                <Badge className="mb-4" variant="outline">
                                    New Features Available
                                </Badge>
                                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                                    Track Time, <br/>
                                    <span className="text-primary">Boost Productivity</span>
                                </h1>
                                <p className="text-xl text-muted-foreground">
                                    Streamline your workflow with our intuitive time tracking and project management
                                    platform. Designed
                                    for teams of all sizes.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button size="lg" asChild>
                                        <Link href="/signup">
                                            Get Started <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href="/demo">Request Demo</Link>
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <Avatar key={i} className="border-2 border-background">
                                                <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${i}`}/>
                                                <AvatarFallback>U{i}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Trusted by <span
                                        className="font-medium text-foreground">10,000+</span> professionals
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="relative rounded-lg border bg-background p-2 shadow-lg">
                                    <div className="rounded-md bg-muted p-1">
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500"/>
                                            <div className="h-2 w-2 rounded-full bg-yellow-500"/>
                                            <div className="h-2 w-2 rounded-full bg-green-500"/>
                                            <div className="ml-auto text-xs text-muted-foreground">Dashboard</div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-4 gap-4">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="rounded-md bg-muted/80 p-4">
                                                        <div className="h-2 w-12 rounded-md bg-muted-foreground/20"/>
                                                        <div
                                                            className="mt-2 h-4 w-8 rounded-md bg-muted-foreground/30"/>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2 rounded-md bg-muted/80 p-4">
                                                    <div className="flex items-end gap-1 h-24">
                                                        {[30, 60, 45, 80, 55, 70, 35].map((h, i) => (
                                                            <div key={i} className="w-full bg-primary/20 rounded-t-sm">
                                                                <div className="bg-primary rounded-t-sm"
                                                                     style={{height: `${h}%`}}/>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="rounded-md bg-muted/80 p-4">
                                                    <div className="relative h-24 w-full">
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center">
                                                            <div className="h-16 w-16 rounded-full bg-primary/20">
                                                                <div
                                                                    className="h-full w-full rounded-full bg-background"
                                                                    style={{clipPath: "polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)"}}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-md bg-muted/80 p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-muted-foreground/20"/>
                                                    <div className="space-y-1">
                                                        <div className="h-2 w-24 rounded-md bg-muted-foreground/20"/>
                                                        <div className="h-2 w-16 rounded-md bg-muted-foreground/20"/>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <div className="h-6 w-16 rounded-md bg-primary/50"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div
                                    className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl"/>
                                <div
                                    className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl"/>
                            </div>
                        </div>
                    </div>
                    {/* Background decorative elements */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/5 to-secondary/5"/>
                </section>

                {/* Trusted By Section */}
                <section className="py-12 border-y bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-medium text-muted-foreground">
                                Trusted by companies worldwide
                            </h2>
                        </div>
                        <div className="flex flex-wrap justify-center text-center items-center gap-8 md:gap-16">
                            {["Acme Inc", "TechCorp", "Globex", "Initech", "Umbrella"].map((company) => (
                                <div
                                    key={company}
                                    className="text-2xl font-bold text-muted-foreground/50 min-w-[120px]"
                                >
                                    {company}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center justify-center">
                            {stats.map((stat, index) => (
                                <div key={index} className="space-y-2 mx-auto">
                                    <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                                    <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="mb-4">Features</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Everything you need to manage time and projects
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Our comprehensive platform provides all the tools you need to track time, manage
                                projects, and optimize your team's productivity.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                            {features.map((feature, index) => (
                                <Card
                                    key={index}
                                    className="bg-background border-2 transition-all hover:border-primary/50 hover:shadow-md"
                                >
                                    <CardHeader>
                                        <div
                                            className="p-2 w-12 h-12 rounded-lg bg-primary/10 mb-4 flex items-center justify-center">
                                            <feature.icon className="h-6 w-6 text-primary"/>
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="mb-4">How It Works</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, yet powerful
                                workflow</h2>
                            <p className="text-lg text-muted-foreground">
                                Our platform is designed to be intuitive and easy to use, while providing powerful
                                features for teams of all sizes.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Connecting line */}
                            <div
                                className="hidden md:block absolute top-8 left-1/2 w-[80%] translate-x-[-50%] h-0.5 bg-muted-foreground/20 z-0"/>

                            <div className="grid md:grid-cols-3 gap-12 relative z-10">
                                {[
                                    {
                                        step: "1",
                                        title: "Track Time",
                                        description: "Log hours manually or use the timer. Categorize by project and add descriptions.",
                                        icon: Clock,
                                    },
                                    {
                                        step: "2",
                                        title: "Analyze Data",
                                        description: "View detailed reports and dashboards to gain insights into your team's productivity.",
                                        icon: BarChart3,
                                    },
                                    {
                                        step: "3",
                                        title: "Optimize Workflow",
                                        description: "Make data-driven decisions to improve efficiency and resource allocation.",
                                        icon: Users,
                                    },
                                ].map((item, index) => (
                                    <div key={index} className="flex flex-col items-center text-center">
                                        <div
                                            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-6">
                                            {item.step}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="mb-4">Testimonials</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">What our customers
                                say</h2>
                            <p className="text-lg text-muted-foreground">
                                Don't just take our word for it. Here's what professionals and teams have to say about
                                our platform.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 justify-center">
                            {testimonials.map((testimonial, index) => (
                                <Card key={index} className="bg-background max-w-md mx-auto">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={testimonial.image} alt={testimonial.name}/>
                                                <AvatarFallback>
                                                    {testimonial.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{testimonial.name}</CardTitle>
                                                <CardDescription>
                                                    {testimonial.role}, {testimonial.company}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="pt-4 text-muted-foreground">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-4 w-4 text-yellow-500 inline-block mr-1"
                                                    fill="currentColor"
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-4">{testimonial.content}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="mb-4">Pricing</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, transparent
                                pricing</h2>
                            <p className="text-lg text-muted-foreground">
                                Choose the plan that's right for you. All plans include a 14-day free trial.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 justify-center">
                            {pricingPlans.map((plan, index) => (
                                <Card
                                    key={index}
                                    className={cn(
                                        "flex flex-col max-w-md",
                                        plan.popular && "border-primary shadow-lg relative"
                                    )}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            <span className="text-muted-foreground ml-1">/month</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-2">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center">
                                                    <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0"/>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full">Get Started</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <p className="text-muted-foreground">
                                Need a custom plan?{" "}
                                <Link href="/contact" className="text-primary font-medium hover:underline">
                                    Contact us
                                </Link>{" "}
                                for enterprise pricing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="mb-4">FAQ</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Frequently asked questions
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Find answers to common questions about our platform.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto justify-center">
                            {faqs.map((faq, index) => (
                                <div key={index} className="space-y-2">
                                    <h3 className="text-xl font-medium">{faq.question}</h3>
                                    <p className="text-muted-foreground">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Ready to boost your productivity?
                            </h2>
                            <p className="text-xl opacity-90 mb-8">
                                Join thousands of professionals and teams who trust our platform for time tracking and
                                project management.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary" asChild>
                                    <Link href="/signup">
                                        Get Started <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10"
                                    asChild
                                >
                                    <Link href="/demo">Request Demo</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-12 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <ClipboardList className="h-6 w-6 text-primary"/>
                                <span className="text-xl font-bold">TimeTrack</span>
                            </div>
                            <p className="text-muted-foreground mb-4 max-w-xs">
                                Streamline your workflow with our intuitive time tracking and project management
                                platform.
                            </p>
                            <div className="flex gap-4">
                                {[Globe, MessageSquare, Shield, Laptop].map((Icon, i) => (
                                    <Button key={i} size="icon" variant="ghost">
                                        <Icon className="h-5 w-5"/>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div>
                            <h3 className="font-medium mb-4">Product</h3>
                            <ul className="space-y-2">
                                {["Features", "Pricing", "Integrations", "Changelog", "Roadmap"].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="text-muted-foreground hover:text-foreground">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4">Company</h3>
                            <ul className="space-y-2">
                                {["About", "Customers", "Careers", "Blog", "Contact"].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="text-muted-foreground hover:text-foreground">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4">Resources</h3>
                            <ul className="space-y-2">
                                {["Documentation", "Guides", "Support", "API", "Community"].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="text-muted-foreground hover:text-foreground">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <Separator className="my-8"/>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} TimeTrack. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            {["Privacy Policy", "Terms of Service", "Cookies"].map((item) => (
                                <Link
                                    key={item}
                                    href="#"
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    {item}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    )
}

