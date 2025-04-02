"use client"

import type React from "react"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontalIcon, UserIcon, EyeIcon, MailIcon } from "lucide-react"
import type { TimeOffPeriod } from "@/types/vacation"

interface VacationListProps {
    vacations: TimeOffPeriod[]
    isLoading: boolean
    getStatusIcon: (status: string) => React.ReactNode
}

export default function VacationList({ vacations, isLoading, getStatusIcon }: VacationListProps) {
    const [sortField, setSortField] = useState<string>("start_date")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const sortedVacations = [...vacations].sort((a, b) => {
        let valueA, valueB

        switch (sortField) {
            case "employee":
                valueA =
                    `${a.attributes.employee.attributes.first_name.value} ${a.attributes.employee.attributes.last_name.value}`.toLowerCase()
                valueB =
                    `${b.attributes.employee.attributes.first_name.value} ${b.attributes.employee.attributes.last_name.value}`.toLowerCase()
                break
            case "start_date":
                valueA = new Date(a.attributes.start_date).getTime()
                valueB = new Date(b.attributes.start_date).getTime()
                break
            case "end_date":
                valueA = new Date(a.attributes.end_date).getTime()
                valueB = new Date(b.attributes.end_date).getTime()
                break
            case "days_count":
                valueA = a.attributes.days_count
                valueB = b.attributes.days_count
                break
            case "status":
                valueA = a.attributes.status
                valueB = b.attributes.status
                break
            case "type":
                valueA = a.attributes.time_off_type.attributes.name
                valueB = b.attributes.time_off_type.attributes.name
                break
            default:
                valueA = a.attributes.start_date
                valueB = b.attributes.start_date
        }

        const comparison =
            typeof valueA === "string" ? valueA.localeCompare(valueB as string) : (valueA as number) - (valueB as number)

        return sortDirection === "asc" ? comparison : -comparison
    })

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSort("employee")}>
                            <div className="flex items-center">
                                Employee
                                {sortField === "employee" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("start_date")}>
                            <div className="flex items-center">
                                Start Date
                                {sortField === "start_date" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("end_date")}>
                            <div className="flex items-center">
                                End Date
                                {sortField === "end_date" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("days_count")}>
                            <div className="flex items-center">
                                Days
                                {sortField === "days_count" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                            <div className="flex items-center">
                                Type
                                {sortField === "type" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                            <div className="flex items-center">
                                Status
                                {sortField === "status" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                            </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedVacations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                No vacation requests found
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedVacations.map((vacation) => (
                            <TableRow key={vacation.attributes.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-gray-100 rounded-full p-1.5">
                                            <UserIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {vacation.attributes.employee.attributes.first_name.value}{" "}
                                                {vacation.attributes.employee.attributes.last_name.value}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {vacation.attributes.employee.attributes.email.value}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{format(parseISO(vacation.attributes.start_date), "MMM d, yyyy")}</TableCell>
                                <TableCell>{format(parseISO(vacation.attributes.end_date), "MMM d, yyyy")}</TableCell>
                                <TableCell>{vacation.attributes.days_count}</TableCell>
                                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                    {vacation.attributes.time_off_type.attributes.name}
                  </span>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`flex items-center gap-1 ${
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
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontalIcon className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="flex items-center gap-2">
                                                <EyeIcon className="h-4 w-4" />
                                                <span>View Details</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="flex items-center gap-2">
                                                <MailIcon className="h-4 w-4" />
                                                <span>Contact Employee</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

