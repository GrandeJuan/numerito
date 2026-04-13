import type { ReactNode } from 'react';
import { CARD_CLASSES, TABLE_CLASSES } from '@/lib/design-tokens';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  footer?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No se encontraron resultados.',
  footer,
}: DataTableProps<T>) {
  return (
    <div className={`${CARD_CLASSES.full} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b border-gray-200 dark:border-white/10 ${TABLE_CLASSES.header}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${col.align === 'right' ? 'text-right' : 'text-left'} py-3 px-4 ${TABLE_CLASSES.headerText}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                className={`border-b border-[#e2e8f0]/50 dark:border-white/5 ${TABLE_CLASSES.rowHover}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-[#45474c] dark:text-[#a0a3a8]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
