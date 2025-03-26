"use client";

import { useId, useRef, useState } from "react";
import {ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState, useReactTable, getCoreRowModel,
    getSortedRowModel, getPaginationRowModel, getFilteredRowModel, getFacetedUniqueValues, flexRender} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, CircleX, Columns3, ListFilter} from "lucide-react";
import { cn } from "@/lib/utils";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

type Props<T> = {
    data: T[];
    columns: ColumnDef<T>[];
    globalFilterKey?: keyof T;
    renderActions?: React.ReactNode;
    viewCondition: boolean;
    rowSelection?: Record<string, boolean>;
    onRowSelectionChange?: (updater: any) => void;
};


export default function GenericTable<T>({ data, columns, globalFilterKey, renderActions, viewCondition, rowSelection, onRowSelectionChange }: Props<T>) {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange,
        state: {
            sorting,
            pagination,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="transition-all duration-300 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    {globalFilterKey && (
                        <div className="relative">
                            <Input
                                id={`${id}-input`}
                                ref={inputRef}
                                className={cn(
                                    "peer min-w-60 ps-9",
                                    Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9",
                                )}
                                value={(table.getColumn("name")?.getFilterValue() ?? "") as string}
                                onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                                placeholder="Filter by name or email..."
                                type="text"
                                aria-label="Filter by name or email"
                            />
                            <div
                                className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                <ListFilter size={16} strokeWidth={2} aria-hidden="true"/>
                            </div>
                            {Boolean(table.getColumn("name")?.getFilterValue()) && (
                                <button
                                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Clear filter"
                                    onClick={() => {
                                        table.getColumn("name")?.setFilterValue("");
                                        if (inputRef.current) {
                                            inputRef.current.focus();
                                        }
                                    }}
                                >
                                    <CircleX size={16} strokeWidth={2} aria-hidden="true"/>
                                </button>
                            )}
                        </div>
                    )}

                    {viewCondition && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Columns3
                                        className="-ms-1 me-2 opacity-60"
                                        size={16}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    />
                                    View
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                onSelect={(event) => event.preventDefault()}
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {renderActions && <div>{renderActions}</div>}
            </div>

            <div className="overflow-hidden rounded-lg border mb-4">
                <Table className="table-fixed">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} style={{width: header.getSize()}}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center h-24">
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
    );
}
