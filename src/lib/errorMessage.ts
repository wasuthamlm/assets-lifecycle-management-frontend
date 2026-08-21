import { AxiosError } from 'axios'
import type { ApiErrorShape } from '@/api/types/common.types'

export function getErrorMessage(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
    }
    const message = (error.response.data as ApiErrorShape | undefined)?.message
    if (message) return Array.isArray(message) ? message.join(', ') : message
  }
  return fallback
}
