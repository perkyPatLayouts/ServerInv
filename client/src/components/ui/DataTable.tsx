import { flexRender, getCoreRowModel, useReactTable, ColumnDef, getSortedRowModel, SortingState, Row } from "@tanstack/react-table";
import { useState, ReactNode } from "react";

interface Props<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  /** Card renderer. When provided, cards are the default view with a toggle to table. */
  renderCard?: (row: Row<T>) => ReactNode;
  /** Default sort state for both table and card views. */
  defaultSort?: SortingState;
}

export default function DataTable<T>({ data, columns, renderCard, defaultSort }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSort || []);
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

  /** Sortable columns (exclude action/utility columns without accessorKey). */
  const sortableColumns = table.getAllColumns().filter((c) => c.getCanSort() && c.columnDef.header && typeof c.columnDef.header === "string");

  const currentSortId = sorting[0]?.id || "";
  const currentSortDesc = sorting[0]?.desc || false;

  return (
    <>
      {renderCard && (
        <div className="flex items-center justify-between mb-3 gap-2">
          {/* Sort dropdown — visible in card view */}
          {view === "cards" && sortableColumns.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-text-secondary whitespace-nowrap">Sort by</label>
              <select
                value={currentSortId}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) { setSorting([]); return; }
                  setSorting([{ id, desc: currentSortDesc }]);
                }}
                className="rounded border border-border bg-surface text-text-primary px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">None</option>
                {sortableColumns.map((col) => (
                  <option key={col.id} value={col.id}>{col.columnDef.header as string}</option>
                ))}
              </select>
              {currentSortId && (
                <button
                  onClick={() => setSorting([{ id: currentSortId, desc: !currentSortDesc }])}
                  className="px-1.5 py-1 text-xs rounded border border-border bg-surface text-text-secondary hover:bg-surface-hover"
                  title={currentSortDesc ? "Descending" : "Ascending"}
                >
                  {currentSortDesc ? "↓" : "↑"}
                </button>
              )}
            </div>
          )}

          <div className="flex rounded border border-border overflow-hidden text-xs ml-auto">
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
