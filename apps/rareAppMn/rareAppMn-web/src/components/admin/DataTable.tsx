"use client";

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onEdit,
  onDelete,
  emptyMessage,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-border-ink py-12 text-center text-sm text-ink-soft">
        {emptyMessage ?? "No records yet."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-border-ink bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-paper-deep text-[11px] uppercase tracking-[0.08em] text-ink-soft">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-ink">
          {rows.map((row) => (
            <tr key={getRowId(row)} className="hover:bg-paper-deep/40">
              {columns.map((col) => (
                <td key={col.header} className="px-4 py-3 align-top">
                  {col.render(row)}
                </td>
              ))}
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="mr-4 text-xs font-medium uppercase tracking-wide text-ink underline underline-offset-2"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="text-xs font-medium uppercase tracking-wide text-accent underline underline-offset-2"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
