"use client"

import * as React from "react"
import {ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Clipboard, FileText, Link2, Users} from "lucide-react"
import {type ColumnDef, type ColumnFiltersState, type SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {useSidebar} from "@/context/sidebar-context";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useEffect, useId, useState} from "react";
import {supabase} from "@/lib/supabase";
import {ProjectSchema} from "@/types/project";
import {TbAddressBook} from "react-icons/tb";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount)
}

const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("de-DE", { style: "percent", minimumFractionDigits: 1 }).format(value)
}

const formatDate = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Invalid date";
    }
    return new Intl.DateTimeFormat("de-DE").format(date);
}

export default function ProjectsTable() {
    const id = useId();
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const { isCollapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectSchema[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("projects")
                .select("*")

            if (error) {
                console.error("Error fetching projects:", error);
            }
            else {
                const parsedData: ProjectSchema[] = data.map((project: any) => ({
                    ...project,

                    id: project.id,
                    project_lead: project.project_lead,
                    angebotsnummer: project.angebotsnummer,
                    client: project.client,
                    frame_contract: project.frame_contract,
                    purchase_order: project.purchase_order,
                    project_name: project.project_name,
                    link_to_project_folder: project.link_to_project_folder,
                    target_margin: typeof project.target_margin === "string" ? parseFloat(project.target_margin) : project.target_margin,
                    revenue: typeof project.revenue === "string" ? parseFloat(project.revenue) : project.revenue,
                    man_days: typeof project.man_days === "string" ? parseFloat(project.man_days) : project.man_days,
                    status: project.status,
                    name: project.name,
                    period_start: new Date(project.period_start),
                    period_end: new Date(project.period_end),
                }));
                setProjects(parsedData);
            }
            setLoading(false);
        };

        fetchProjects();
    }, []);

    const columns: ColumnDef<ProjectSchema>[] = [
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
            accessorKey: "id",
            header: "Project ID",
            cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "client",
            header: "Client",
        },
        {
            accessorKey: "projectName",
            header: "Project Name",
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
                                    : status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                        )}
                    >
                        {status}
                    </Badge>
                )
            },
        },
    ]

    const table = useReactTable({
        data: projects,
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
    })

    const renderExpandedRow = (project: ProjectSchema) => {
        return (
            <div className="p-4 bg-muted/50 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="text-sm font-medium flex items-center gap-2 mb-4">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Project Details
                            </h3>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Full Name:</span>
                                    <span className="text-sm">{project.name}</span>

                                    <span className="text-sm text-muted-foreground">Angebotsnummer:</span>
                                    <span className="text-sm">{project.angebotsnummer}</span>

                                    <span className="text-sm text-muted-foreground">Frame Contract:</span>
                                    <span className="text-sm">{project.frame_contract}</span>

                                    <span className="text-sm text-muted-foreground">Purchase Order:</span>
                                    <span className="text-sm">{project.purchase_order}</span>
                                </div>

                                <div className="mt-2 pt-2 border-t">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Link2 className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={project.link_to_project_folder}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate"
                                        >
                                            Project Folder
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="text-sm font-medium flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Project Management
                            </h3>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Project Lead ID:</span>
                                    <span className="text-sm">{project.project_lead}</span>

                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <span className="text-sm">
                    <Badge
                        className={cn(
                            "mt-1",
                            project.status === "Active"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : project.status === "Inactive"
                                    ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                    : project.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                        )}
                    >
                      {project.status}
                    </Badge>
                  </span>
                                </div>

                                <div className="mt-2 pt-2 border-t">
                                    <div className="grid grid-cols-2 gap-1">
                                        <span className="text-sm text-muted-foreground">Period Start:</span>
                                        <span className="text-sm">{formatDate(project.period_start)}</span>

                                        <span className="text-sm text-muted-foreground">Period End:</span>
                                        <span className="text-sm">{formatDate(project.period_end)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="text-sm font-medium flex items-center gap-2 mb-4">
                                <Clipboard className="h-4 w-4 text-muted-foreground" />
                                Financial Details
                            </h3>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-sm text-muted-foreground">Revenue:</span>
                                    <span className="text-sm font-medium">{formatCurrency(project.revenue)}</span>

                                    <span className="text-sm text-muted-foreground">Man Days:</span>
                                    <span className="text-sm">{project.man_days}</span>

                                    <span className="text-sm text-muted-foreground">Target Margin:</span>
                                    <span className="text-sm">{formatPercentage(project.target_margin)}</span>

                                    <span className="text-sm text-muted-foreground">Est. Value per Day:</span>
                                    <span className="text-sm">{formatCurrency(project.revenue / project.man_days)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TbAddressBook className="h-5 w-5 text-muted-foreground"/>
                        <h2 className="text-xl font-semibold">Projects</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Filter by client..."
                            value={(table.getColumn("client")?.getFilterValue() as string) ?? ""}
                            onChange={(event) => table.getColumn("client")?.setFilterValue(event.target.value)}
                            className="max-w-sm"
                        />
                        <Input
                            placeholder="Filter by project name..."
                            value={(table.getColumn("projectName")?.getFilterValue() as string) ?? ""}
                            onChange={(event) => table.getColumn("projectName")?.setFilterValue(event.target.value)}
                            className="max-w-sm"
                        />
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
                                    <React.Fragment key={row.id}>
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
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
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