"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ListIcon, SearchIcon, RefreshCwIcon, CheckCircleIcon, ClockIcon, XCircleIcon,} from "lucide-react"
import VacationList from "./vacation-list"
import VacationCalendar from "./vacation-calendar"
import type { TimeOffPeriod } from "@/types/vacation"
import {useSidebar} from "@/context/sidebar-context";
import {TbBeach } from "react-icons/tb";
import * as React from "react";

export default function VacationChecker() {
    const { isCollapsed } = useSidebar();

    const [activeTab, setActiveTab] = useState("calendar")
    const [vacationData, setVacationData] = useState<TimeOffPeriod[]>([])
    const [filteredData, setFilteredData] = useState<TimeOffPeriod[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                const res = await fetch('/api/fetch-personio-timeoffs')
                const data = await res.json()

                console.log(data)

                if (data.success) {
                    setVacationData(data.data)
                    setFilteredData(data.data)
                }
            } catch (error) {
                console.error("Error fetching vacation data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    useEffect(() => {
        // Apply filters whenever filter criteria change
        let result = vacationData

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (item) =>
                    item.attributes.employee.attributes.first_name.value.toLowerCase().includes(query) ||
                    item.attributes.employee.attributes.last_name.value.toLowerCase().includes(query) ||
                    item.attributes.employee.attributes.email.value.toLowerCase().includes(query),
            )
        }

        // Apply status filter
        if (statusFilter !== "all") {
            result = result.filter((item) => item.attributes.status === statusFilter)
        }

        // Apply type filter
        if (typeFilter !== "all") {
            result = result.filter((item) => item.attributes.time_off_type.attributes.category === typeFilter)
        }

        setFilteredData(result)
    }, [searchQuery, statusFilter, typeFilter, vacationData])

    const refreshData = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/fetch-personio-timeoffs')
            const data = await res.json()

            if (data.success) {
                setVacationData(data.data)
                setFilteredData(data.data)
            }
        } catch (error) {
            console.error("Error refreshing vacation data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />
            case "pending":
                return <ClockIcon className="h-4 w-4 text-amber-500" />
            case "rejected":
                return <XCircleIcon className="h-4 w-4 text-red-500" />
            default:
                return null
        }
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="container mx-auto py-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbBeach className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-2xl font-bold">Vacation Checker</h1>
                    </div>
                </div>

                <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={refreshData} disabled={isLoading}>
                            <RefreshCwIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}/>
                            <span className="sr-only">Refresh</span>
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Vacation Type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="paid_vacation">Paid Vacation</SelectItem>
                                <SelectItem value="unpaid_vacation">Unpaid Vacation</SelectItem>
                                <SelectItem value="sick_leave">Sick Leave</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b px-4 py-2">
                            <TabsList className="grid w-full sm:w-80 grid-cols-2">
                                <TabsTrigger value="calendar" className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4"/>
                                    <span>Calendar View</span>
                                </TabsTrigger>
                                <TabsTrigger value="list" className="flex items-center gap-2">
                                    <ListIcon className="h-4 w-4"/>
                                    <span>List View</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="calendar" className="p-0 m-0">
                            <VacationCalendar vacations={filteredData} isLoading={isLoading}
                                              getStatusIcon={getStatusIcon}/>
                        </TabsContent>

                        <TabsContent value="list" className="p-0 m-0">
                            <VacationList vacations={filteredData} isLoading={isLoading} getStatusIcon={getStatusIcon}/>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {filteredData.length} of {vacationData.length} vacation requests
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1 bg-amber-50">
                            <ClockIcon className="h-3 w-3 text-amber-500"/>
                            <span>Pending</span>
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                            <CheckCircleIcon className="h-3 w-3 text-green-500"/>
                            <span>Approved</span>
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 bg-red-50">
                            <XCircleIcon className="h-3 w-3 text-red-500"/>
                            <span>Rejected</span>
                        </Badge>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}

