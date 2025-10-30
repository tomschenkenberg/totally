"use client"

import { Players } from "@/lib/atoms/players"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useAtomValue } from "jotai"
import { playersAtom, getNumberOfRoundsAtom } from "@/lib/atoms/players"

type TableDataRow = {
    round: number | string
    [playerId: string]: number | string
}

function getColumns(players: Players): ColumnDef<TableDataRow>[] {
    const playerColumns = Object.entries(players).map(([id, player]) => ({
        accessorKey: id,
        header: player.name.slice(0, 2)
    }))

    const roundColumn: ColumnDef<TableDataRow> = {
        accessorKey: "round",
        header: "#",
        cell: (info) => info.getValue()
    }

    return [roundColumn, ...playerColumns]
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const router = useRouter()
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="text-right">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, index) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={index === table.getRowModel().rows.length - 1 ? "total-row" : ""}
                                onClick={() => {
                                    if (index === table.getRowModel().rows.length - 1) return
                                    const roundNumber = parseInt(row.id) + 1
                                    router.push(`/round/${roundNumber}`)
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-right font-mono px-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-gray-200">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default function ScoresTable() {
    const players = useAtomValue(playersAtom)
    const rounds = useAtomValue(getNumberOfRoundsAtom)
    const data: TableDataRow[] = Array.from({ length: rounds }, (_, roundIndex) => {
        const round = roundIndex + 1
        const roundData: TableDataRow = { round }

        Object.entries(players).forEach(([id, player]) => {
            roundData[id] = player.scores[round] || 0
        })

        return roundData
    })

    // Add total scores row
    const totalScoresRow: TableDataRow = { round: "" }
    Object.entries(players).forEach(([id, player]) => {
        totalScoresRow[id] = Object.values(player.scores).reduce((sum, score) => sum + score, 0)
    })

    data.push(totalScoresRow)

    return <DataTable columns={getColumns(players)} data={data} />
}
