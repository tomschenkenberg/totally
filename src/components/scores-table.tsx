"use client";

import { Player, Players, usePlayerStore } from "@/lib/store";
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

type TableDataRow = {
  round: number | string; // Round number or 'Total'
  [playerId: string]: number | string; // Scores for each player, indexed by player ID
};

function getData(players: Players): TableDataRow[] {
  const rounds = usePlayerStore.getState().getNumberOfRounds();
  const data: TableDataRow[] = Array.from(
    { length: rounds },
    (_, roundIndex) => {
      const round = roundIndex + 1;
      const roundData: TableDataRow = { round }; // Round number

      Object.entries(players).forEach(([id, player]) => {
        roundData[id] = player.scores[round] || 0; // Access scores by round number
      });

      return roundData;
    }
  );

  // Add total scores row
  const totalScoresRow: TableDataRow = { round: "Total" };
  Object.entries(players).forEach(([id, player]) => {
    totalScoresRow[id] = Object.values(player.scores).reduce(
      (sum, score) => sum + score,
      0
    );
  });

  data.push(totalScoresRow);
  return data;
}

function getColumns(players: Players): ColumnDef<any>[] {
  const playerColumns = Object.entries(players).map(([id, player]) => ({
    accessorKey: id,
    header: player.name.slice(0, 2),
  }));

  const roundColumn: ColumnDef<any> = {
    accessorKey: "round",
    header: "#",
    cell: (info) => info.getValue(),
  };

  return [roundColumn, ...playerColumns]; // Adding the round column as the first column
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
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
                className={
                  index === table.getRowModel().rows.length - 1
                    ? "total-row"
                    : ""
                }
                onClick={() => {
                  const roundNumber = parseInt(row.id) + 1;
                  router.push(`/round/${roundNumber}`);
                }}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-right">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
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
  );
}

export default function ScoresTable() {
  const players = usePlayerStore((state) => state.players);
  const data = getData(players);

  return <DataTable columns={getColumns(players)} data={data} />;
}
