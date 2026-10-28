import type { Assignment } from '@/api/types/assignment.types'

// วันนี้ตามเวลาไทยในรูป YYYY-MM-DD (en-CA ให้รูปแบบนี้พอดี)
function todayThai(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
}

// dueDate เป็นคอลัมน์ date ล้วน — ห้ามเทียบด้วย new Date(dueDate) < new Date() เพราะจะได้เที่ยงคืน UTC (= 07:00 น. ไทย)
// ทำให้ขึ้น "เกินกำหนด" ตั้งแต่เช้าวันกำหนดคืน; เทียบเป็นสตริงวันที่ไทยแทน ให้ตรงกับ isPastDueDateThai ฝั่ง backend
export function isAssignmentOverdue(a: Pick<Assignment, 'dueDate' | 'returnedDate'>): boolean {
  return !!a.dueDate && !a.returnedDate && a.dueDate.slice(0, 10) < todayThai()
}
