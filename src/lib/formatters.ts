const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value)
}

export function formatThaiDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${buddhistYear}`
}

// ชื่อผู้ขอเบิก + ผู้รับ (ถ้า HR เบิกให้คนอื่น) สำหรับคอลัมน์ "ผู้ขอเบิก" ในตาราง
export function requesterLabel(r: {
  requestedByEmployee?: { fullName: string } | null
  requestedForEmployee?: { fullName: string } | null
}): string {
  const requester = r.requestedByEmployee?.fullName ?? '-'
  return r.requestedForEmployee ? `${requester} → ${r.requestedForEmployee.fullName}` : requester
}
