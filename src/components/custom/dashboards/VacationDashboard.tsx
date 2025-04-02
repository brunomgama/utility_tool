"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {SearchIcon, CheckCircleIcon, ClockIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon,} from "lucide-react"
import type { TimeOffPeriod } from "@/types/vacation"
import {useSidebar} from "@/context/sidebar-context";
import {TbBeach } from "react-icons/tb";
import * as React from "react";
import {addDays, addMonths, format, isSameDay, isSameMonth, isWithinInterval, parseISO, startOfMonth, startOfWeek, subMonths} from "date-fns";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export default function VacationDashboard() {
    const { isCollapsed } = useSidebar();

    const [vacationData, setVacationData] = useState<TimeOffPeriod[]>([])
    const [filteredData, setFilteredData] = useState<TimeOffPeriod[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")

    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

    useEffect(() => {
        const loadData = async () => {
            const start = format(startOfMonth(subMonths(currentMonth, 1)), "yyyy-MM-dd")
            const end = format(startOfMonth(addMonths(currentMonth, 2)), "yyyy-MM-dd")

            try {
                const res = await fetch(`/api/fetch-personio-timeoffs?start_date=${start}&end_date=${end}`)
                const data = await res.json()

                console.log(data)

                if (data.success) {
                    setVacationData(data.data)
                    setFilteredData(data.data)
                }
            } catch (error) {
                console.error("Error fetching vacation data:", error)
            }
        }

        loadData()
    }, [currentMonth])


    useEffect(() => {
        let result = vacationData

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (item) =>
                    item.attributes.employee.attributes.first_name.value.toLowerCase().includes(query) ||
                    item.attributes.employee.attributes.last_name.value.toLowerCase().includes(query) ||
                    item.attributes.employee.attributes.email.value.toLowerCase().includes(query),
            )
        }

        if (statusFilter !== "all") {
            result = result.filter((item) => item.attributes.status === statusFilter)
        }

        if (typeFilter !== "all") {
            result = result.filter((item) => item.attributes.time_off_type.attributes.category === typeFilter)
        }

        setFilteredData(result)
    }, [searchQuery, statusFilter, typeFilter, vacationData])

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

    const goToPreviousMonth = () => {
        const newMonth = subMonths(currentMonth, 1)
        setCurrentMonth(newMonth)
        setSelectedDate(startOfMonth(newMonth))
    }

    const goToNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1)
        setCurrentMonth(newMonth)
        setSelectedDate(startOfMonth(newMonth))
    }


    const goToToday = () => {
        setCurrentMonth(new Date())
        setSelectedDate(new Date())
    }

    const selectedDateVacations = selectedDate
        ? filteredData.filter((vacation) => {
            const startDate = parseISO(vacation.attributes.start_date)
            const endDate = parseISO(vacation.attributes.end_date)
            return (
                isWithinInterval(selectedDate, { start: startDate, end: endDate }) ||
                isSameDay(selectedDate, startDate) ||
                isSameDay(selectedDate, endDate)
            )
        })
        : []

    const renderMonthView = () => {
        const firstDayOfMonth = startOfMonth(currentMonth)
        const firstDayOfCalendar = startOfWeek(firstDayOfMonth, {weekStartsOn: 1})

        const weeks = []
        let currentWeek = []

        for (let i = 0; i < 42; i++) {
            const day = addDays(firstDayOfCalendar, i)

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
            }

            currentWeek.push(day)

            if (i === 41) {
                weeks.push(currentWeek)
            }
        }

        return (
            <div className="space-y-4">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 bg-muted/50 rounded-t-md">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <div key={day} className="p-2 text-center font-medium text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 border-t">
                        {week.map((day, dayIndex) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth)
                            const isTodayDay = isSameDay(day, new Date())

                            const dayVacations = filteredData.filter((vac) => {
                                const start = parseISO(vac.attributes.start_date)
                                const end = parseISO(vac.attributes.end_date)
                                return (
                                    isWithinInterval(day, { start, end }) ||
                                    isSameDay(day, start) ||
                                    isSameDay(day, end)
                                )
                            })

                            return (
                                <div
                                    key={dayIndex}
                                    className={cn(
                                        "min-h-[120px] p-1 border-r last:border-r-0 text-xs flex flex-col",
                                        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                        isTodayDay && "bg-blue-50"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn("text-sm font-medium", isTodayDay && "text-primary")}>
                                          {format(day, "d")}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-hidden flex flex-col gap-1">
                                        {dayVacations.slice(0, 2).map((vacation, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "px-1 py-0.5 rounded truncate cursor-default",
                                                    vacation.attributes.status === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : vacation.attributes.status === "pending"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-red-100 text-red-800"
                                                )}
                                                title={`${vacation.attributes.employee.attributes.first_name.value} ${vacation.attributes.employee.attributes.last_name.value}`}
                                            >
                                                {vacation.attributes.employee.attributes.first_name.value}
                                            </div>
                                        ))}

                                        {dayVacations.length > 2 && (
                                            <div className="text-[10px] text-muted-foreground text-center">
                                                +{dayVacations.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        )
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

                    <div className="p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                                    <ChevronLeftIcon className="h-4 w-4"/>
                                </Button>
                                <Button variant="outline" onClick={goToToday}>
                                    Today
                                </Button>
                                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                    <ChevronRightIcon className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                            <div className="md:col-span-5">
                                {renderMonthView()}
                            </div>

                            <div className="md:col-span-2">
                                <Card className="h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => selectedDate && setSelectedDate(addDays(selectedDate, -1))}
                                                disabled={!selectedDate}
                                            >
                                                <ChevronLeftIcon className="h-4 w-4"/>
                                            </Button>

                                            <h3 className="font-medium text-center text-sm flex-1">
                                                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                                            </h3>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => selectedDate && setSelectedDate(addDays(selectedDate, 1))}
                                                disabled={!selectedDate}
                                            >
                                                <ChevronRightIcon className="h-4 w-4"/>
                                            </Button>
                                        </div>

                                        {selectedDateVacations.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">No vacation requests
                                                for this date</div>
                                        ) : (
                                            <div className="space-y-3 h-full overflow-y-auto pr-2">
                                                {selectedDateVacations.map((vacation) => (
                                                    <Card key={vacation.attributes.id} className="p-3 text-sm">
                                                        <div className="flex items-start gap-3">
                                                            <div className="bg-gray-100 rounded-full p-2">
                                                                <UserIcon className="h-4 w-4"/>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="font-medium truncate">
                                                                        {vacation.attributes.employee.attributes.first_name.value}{" "}
                                                                        {vacation.attributes.employee.attributes.last_name.value}
                                                                    </div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`ml-2 flex items-center gap-1 ${
                                                                            vacation.attributes.status === "approved"
                                                                                ? "bg-green-50"
                                                                                : vacation.attributes.status === "pending"
                                                                                    ? "bg-amber-50"
                                                                                    : vacation.attributes.status === "rejected"
                                                                                        ? "bg-red-50"
                                                                                        : ""
                                                                        }`}
                                                                    >
                                                                        {getStatusIcon(vacation.attributes.status)}
                                                                        <span
                                                                            className="capitalize">{vacation.attributes.status}</span>
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-muted-foreground text-xs mt-1">
                                                                    {format(parseISO(vacation.attributes.start_date), "MMM d")} -{" "}
                                                                    {format(parseISO(vacation.attributes.end_date), "MMM d, yyyy")}
                                                                </div>
                                                                <div className="mt-1 flex items-center justify-between">
                                                                <span
                                                                    className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                                                  {vacation.attributes.time_off_type.attributes.name}
                                                                </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                  {vacation.attributes.days_count} day{vacation.attributes.days_count !== 1 ? "s" : ""}
                                                                </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end text-sm text-muted-foreground">
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

