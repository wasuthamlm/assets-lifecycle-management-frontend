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
          <tr className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-3 py-2.5 font-medium">
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
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-4 w-full max-w-[10rem] animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
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
                'border-b border-slate-50 last:border-0 dark:border-slate-800/60 ' +
                (onRowClick ? 'cursor-pointer transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-800/60' : '')
              }
            >
              {columns.map((col) => (
                <td key={col.key} className={'whitespace-nowrap px-3 py-3 text-slate-700 dark:text-slate-200 ' + (col.className ?? '')}>
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
