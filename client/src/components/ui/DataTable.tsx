import { flexRender, getCoreRowModel, useReactTable, ColumnDef, getSortedRowModel, SortingState, Row } from "@tanstack/react-table";
import { useState, ReactNode } from "react";

interface Props<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  /** Card renderer. When provided, cards are the default view with a toggle to table. */
  renderCard?: (row: Row<T>) => ReactNode;
}

export default function DataTable<T>({ data, columns, renderCard }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [view, setView] = useState<"cards" | "table">(renderCard ? "cards" : "table");
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <>
      {renderCard && (
        <div className="flex justify-end mb-3">
          <div className="flex rounded border border-border overflow-hidden text-xs">
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 ${view === "cards" ? "bg-accent text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
            >
              Cards
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 ${view === "table" ? "bg-accent text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
            >
              Table
            </button>
          </div>
        </div>
      )}

      {view === "table" && (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-alt">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="px-3 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-text-secondary">
                    No data
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-hover">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 text-sm text-text-primary">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "cards" && renderCard && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.length === 0 && (
            <p className="text-center text-sm text-text-secondary py-8 col-span-full">No data</p>
          )}
          {rows.map((row) => (
            <div key={row.id}>{renderCard(row)}</div>
          ))}
        </div>
      )}
    </>
  );
}
