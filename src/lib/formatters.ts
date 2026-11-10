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

// แยกวัน/เวลาตามเวลาไทยเสมอ ไม่ขึ้นกับ timezone ที่ตั้งไว้ในเครื่องผู้ใช้
const BANGKOK_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

function bangkokParts(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const parts = Object.fromEntries(BANGKOK_PARTS.formatToParts(d).map((p) => [p.type, p.value]))
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: parts.hour, minute: parts.minute }
}

export function formatThaiDate(date: string | Date): string {
  const { year, month, day } = bangkokParts(date)
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`
}

export function formatThaiDateTime(date: string | Date): string {
  const { hour, minute } = bangkokParts(date)
  return `${formatThaiDate(date)} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} น.`
}

// ชื่อผู้ขอเบิก + ผู้รับ (ถ้า HR เบิกให้คนอื่น) สำหรับคอลัมน์ "ผู้ขอเบิก" ในตาราง
export function requesterLabel(r: {
  requestedByEmployee?: { fullName: string } | null
  requestedForEmployee?: { fullName: string } | null
}): string {
  const requester = r.requestedByEmployee?.fullName ?? '-'
  return r.requestedForEmployee ? `${requester} → ${r.requestedForEmployee.fullName}` : requester
}
