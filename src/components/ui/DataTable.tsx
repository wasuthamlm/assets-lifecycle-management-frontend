import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

const SKELETON_ROWS = 5

export function DataTable<T>({ columns, rows, rowKey, isLoading, emptyMessage, onRowClick }: DataTableProps<T>) {
  if (!isLoading && rows.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:rounded-tl-lg last:rounded-tr-lg dark:bg-slate-800/50 dark:text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        {isLoading ? (
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <div className="h-4 w-full max-w-[10rem] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={
                  'border-b border-slate-50 last:border-0 dark:border-slate-800/40 ' +
                  (onRowClick
                    ? 'cursor-pointer transition-colors duration-150 hover:bg-brand-50/40 dark:hover:bg-brand-500/5'
                    : '')
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={'whitespace-nowrap px-4 py-3.5 text-slate-700 dark:text-slate-200 ' + (col.className ?? '')}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  )
}
