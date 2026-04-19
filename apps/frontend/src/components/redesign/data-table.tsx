import type { ReactNode } from 'react';

export interface Column<T> {
  header: ReactNode;
  key?: keyof T;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  footer?: ReactNode;
  /** Function to derive a stable key per row. Falls back to index. */
  rowKey?: (row: T, index: number) => string | number;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  footer,
  rowKey,
  emptyMessage = 'Sin datos.',
}: DataTableProps<T>) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="px-4 py-[10px] text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] whitespace-nowrap"
                  style={{ textAlign: c.align || 'left' }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[var(--text-3)] text-[12.5px]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((r, ri) => (
                <tr
                  key={rowKey ? rowKey(r, ri) : ri}
                  className={`transition-colors hover:bg-[var(--surface-2)] ${
                    ri === rows.length - 1 ? '' : 'border-b border-[var(--border)]'
                  }`}
                >
                  {columns.map((c, ci) => {
                    const value = c.render
                      ? c.render(r)
                      : c.key
                        ? (r[c.key] as ReactNode)
                        : null;
                    return (
                      <td
                        key={ci}
                        className="px-4 py-[11px] text-[var(--text-2)] align-middle"
                        style={{ textAlign: c.align || 'left' }}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="px-4 py-[10px] border-t border-[var(--border)] text-[11.5px] text-[var(--text-3)] flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
