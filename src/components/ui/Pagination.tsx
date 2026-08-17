import { Button } from './Button'

interface PaginationProps {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalItems === 0) return null
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-800/80">
      <span>
        ทั้งหมด {totalItems} รายการ · หน้า {page}/{totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ก่อนหน้า
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          ถัดไป
        </Button>
      </div>
    </div>
  )
}
