export function generateNextDocNo(existingNos: string[], prefix: string): string {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)

  let max = 0
  for (const no of existingNos) {
    const match = no.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }

  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`
}
