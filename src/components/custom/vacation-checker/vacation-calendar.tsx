"use client"

import type React from "react"

import { useState } from "react"
import { format, parseISO, isWithinInterval, addMonths, subMonths, isSameDay, addDays, isSameMonth, startOfMonth, startOfWeek } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ChevronLeftIcon, ChevronRightIcon, UserIcon } from "lucide-react"
import type { TimeOffPeriod } from "@/types/vacation"
import {cn} from "@/lib/utils";

interface VacationCalendarProps {
    vacations: TimeOffPeriod[]
    isLoading: boolean
    getStatusIcon: (status: string) => React.ReactNode
}

export default function VacationCalendar({ vacations, isLoading, getStatusIcon }: VacationCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

    const goToPreviousMonth = () => {
        setCurrentMonth((prev) => subMonths(prev, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, 1))
    }

    const goToToday = () => {
        setCurrentMonth(new Date())
        setSelectedDate(new Date())
    }

    // Get vacations for the selected date
    const selectedDateVacations = selectedDate
        ? vacations.filter((vacation) => {
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
        const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 })

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

                            const dayVacations = vacations.filter((vac) => {
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

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-10 w-32"/>
                    <div className="flex space-x-2">
                        <Skeleton className="h-10 w-10"/>
                        <Skeleton className="h-10 w-10"/>
                        <Skeleton className="h-10 w-10"/>
                    </div>
                </div>
                <Skeleton className="h-[500px] w-full"/>
            </div>
        )
    }

    return (
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
                        <ChevronRightIcon className="h-4 w-4" />
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
                            <h3 className="font-medium mb-3">
                                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                            </h3>

                            {selectedDateVacations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No vacation requests for this date</div>
                            ) : (
                                <div className="space-y-3 h-full overflow-y-auto pr-2">
                                    {selectedDateVacations.map((vacation) => (
                                        <Card key={vacation.attributes.id} className="p-3 text-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-gray-100 rounded-full p-2">
                                                    <UserIcon className="h-4 w-4" />
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
                                                            <span className="capitalize">{vacation.attributes.status}</span>
                                                        </Badge>
                                                    </div>
                                                    <div className="text-muted-foreground text-xs mt-1">
                                                        {format(parseISO(vacation.attributes.start_date), "MMM d")} -{" "}
                                                        {format(parseISO(vacation.attributes.end_date), "MMM d, yyyy")}
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between">
                                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
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
    )
}

