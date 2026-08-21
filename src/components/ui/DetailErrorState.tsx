import { AxiosError } from 'axios'
import { ErrorState } from './ErrorState'

interface DetailErrorStateProps {
  error?: unknown
  onRetry?: () => void
  notFoundMessage?: string
}

// ครอบคลุมทั้ง 404 จริง (axios throw) และกรณี query สำเร็จแต่ data เป็น undefined
// (เช่น id ไม่ตรง record ไหนเลย) — ทั้งสองแบบแสดงเป็น "ไม่พบข้อมูล" เหมือนกัน ส่วน error อื่นๆ
// (network/500) ถึงจะโชว์ปุ่มลองใหม่
export function DetailErrorState({ error, onRetry, notFoundMessage = 'ไม่พบข้อมูลที่ต้องการ' }: DetailErrorStateProps) {
  const notFound = !error || (error instanceof AxiosError && error.response?.status === 404)
  return (
    <div className="py-10">
      <ErrorState message={notFound ? notFoundMessage : undefined} onRetry={notFound ? undefined : onRetry} />
    </div>
  )
}
