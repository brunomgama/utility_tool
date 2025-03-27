"use client"

import {ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Filter, Search, Users} from "lucide-react"
import {type ColumnDef, type ColumnFiltersState, type SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import {Fragment, useEffect, useId, useState} from "react";
import {useSidebar} from "@/context/sidebar-context";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ProjectResumedSchema} from "@/types/project";
import {UserSchema} from "@/types/user";
import {AllocationSchema} from "@/types/allocation";
import {supabase} from "@/lib/supabase";
import {TbUsers} from "react-icons/tb";
import * as React from "react";
import {getInitials} from "@/lib/initial";
import {getCountryFlag} from "@/lib/flag";

export default function UsersPage() {
    const id = useId();
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const { isCollapsed } = useSidebar();
    const [users, setUsers] = useState<UserSchema[]>([])
    const [projects, setProjects] = useState<ProjectResumedSchema[]>([])
    const [allocations, setAllocations] = useState<(AllocationSchema & { project?: ProjectResumedSchema })[]>([])
    const [loading, setLoading] = useState(true)

    const columns: ColumnDef<UserSchema>[] = [
        {
            id: "expander",
            header: () => null,
            cell: ({ row }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            const newExpanded = { ...expanded }
                            newExpanded[row.id] = !expanded[row.id]
                            setExpanded(newExpanded)
                        }}
                        className="p-0 h-8 w-8"
                    >
                        {expanded[row.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                )
            },
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const name = row.getValue("name") as string
                return (
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{name}</div>
                    </div>
                )
            },
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "location",
            header: "Location",
            cell: ({ row }) => {
                const location = row.getValue("location") as string
                const flag = getCountryFlag(location)

                return (
                    <div className="flex items-center gap-2">
                        {flag && <span>{flag}</span>}
                        <span>{location}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "role",
            header: "Role",
        },
        {
            accessorKey: "department",
            header: "Department",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        className={cn(
                            status === "Active"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : status === "Inactive"
                                    ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                        )}
                    >
                        {status}
                    </Badge>
                )
            },
        },
    ]

    const table = useReactTable({
        data: users,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        filterFns: {
            statusFilter: (row, columnId, filterValue: string[]) => {
                if (filterValue.length === 0) return true
                return filterValue.includes(row.getValue(columnId))
            },
        },
    })

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)

            const [{ data: usersData, error: usersError }, { data: projectsData, error: projectsError }, { data: allocationsData, error: allocationsError }] = await Promise.all([
                supabase.from("users").select("id, name, email, location, role, department, status"),
                supabase.from("projects").select("id, project_name, client, status"),
                supabase.from("allocations").select("*"),
            ])

            if (usersError || projectsError || allocationsError) {
                console.error("Fetch error", { usersError, projectsError, allocationsError })
                setLoading(false)
                return
            }

            const enrichedAllocations = allocationsData!.map((allocation: AllocationSchema) => {
                const projectMatch = projectsData!.find((p: any) => p.id === allocation.project_id)

                const project: ProjectResumedSchema | undefined = projectMatch
                    ? {
                        id: projectMatch.id,
                        project_name: projectMatch.project_name,
                        client: projectMatch.client,
                        status: projectMatch.status,
                    }
                    : undefined

                return { ...allocation, project }
            })

            setUsers(usersData!)
            setProjects(projectsData!)
            setAllocations(enrichedAllocations)
            setLoading(false)
        }

        fetchData()
    }, [])

    useEffect(() => {
        if (statusFilter.length > 0) {
            table.getColumn("status")?.setFilterValue(statusFilter)
        } else {
            table.getColumn("status")?.setFilterValue(undefined)
        }
    }, [statusFilter, table])

    const renderExpandedRow = (user: UserSchema) => {
        const userAllocations = allocations.filter((a) => a.user_id === user.id)

        return (
            <div className="p-4 bg-muted/50 rounded-md">
                {userAllocations.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Project Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userAllocations.map((allocation) => (
                                    <TableRow key={allocation.id}>
                                        <TableCell>{allocation.project?.id}</TableCell>
                                        <TableCell>{allocation.project?.client}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "text-xs",
                                                    allocation.project?.status === "Active"
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                        : allocation.project?.status === "Inactive"
                                                            ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                            : allocation.project?.status === "Pending"
                                                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                                : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                                )}
                                            >
                                                {allocation.project?.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground py-3 text-center">No allocations found for this user.</div>
                )}
            </div>
        )
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbUsers className="h-5 w-5 text-muted-foreground"/>
                        <h2 className="text-xl font-semibold">Users</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search users..."
                                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                                className="pl-8 w-[250px]"
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-1">
                                    <Filter className="h-4 w-4"/>
                                    Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                                {["Active", "Inactive", "Pending"].map((status) => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={statusFilter.includes(status)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setStatusFilter([...statusFilter, status])
                                            } else {
                                                setStatusFilter(statusFilter.filter((s) => s !== status))
                                            }
                                        }}
                                    >
                                        {status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <TableRow
                                            data-state={row.getIsSelected() && "selected"}
                                            className={cn(
                                                "cursor-pointer transition-colors hover:bg-muted/50",
                                                expanded[row.id] && "bg-muted/50",
                                            )}
                                            onClick={() => {
                                                // Toggle expanded state when row is clicked
                                                const newExpanded = {...expanded}
                                                newExpanded[row.id] = !expanded[row.id]
                                                setExpanded(newExpanded)
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                            ))}
                                        </TableRow>
                                        {expanded[row.id] && (
                                            <TableRow className="bg-transparent">
                                                <TableCell colSpan={columns.length} className="p-0">
                                                    <div
                                                        className="overflow-hidden transition-all duration-300 ease-in-out">
                                                        {renderExpandedRow(row.original)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-between">
                    <div className="flex gap-3">
                        <Label htmlFor={id}>Rows per page</Label>
                        <Select
                            value={table.getState().pagination.pageSize.toString()}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger id={id} className="w-fit">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={pageSize.toString()}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => table.firstPage()}
                                disabled={!table.getCanPreviousPage()}>
                            <ChevronFirst size={16}/>
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}>
                            <ChevronLeft size={16}/>
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}>
                            <ChevronRight size={16}/>
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => table.lastPage()}
                                disabled={!table.getCanNextPage()}>
                            <ChevronLast size={16}/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

