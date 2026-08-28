export const ROLE_LABELS_TH: Record<string, string> = {
  it_admin: 'ผู้ดูแลระบบ (IT)',
  employee: 'พนักงาน',
  hr: 'ฝ่ายบุคคล (HR)',
}

export function translateRoleName(roleName: string): string {
  return ROLE_LABELS_TH[roleName] ?? roleName
}
