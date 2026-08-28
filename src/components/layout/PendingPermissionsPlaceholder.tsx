import { useEffect } from 'react'
import { Hourglass } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { EmptyState } from '@/components/ui/EmptyState'

// polling สำรอง เผื่อ SSE (useNotificationsStream) หลุด/ต่อไม่ติดชั่วคราว — ปกติจะได้ค่าใหม่จาก
// notification 'permissions_updated' ที่ยิงมาทันทีตอน admin กด assign role (ดู RolesPermissionsService)
const FALLBACK_POLL_MS = 8_000

// แสดงแทน <Outlet/> ตรงๆ ใน AppLayout เมื่อ user ผูก employee แล้วแต่ admin ยังไม่ได้กำหนด role ให้
// (permissions ว่างเปล่า) — ให้ sidebar/topbar ใช้งานได้ตามปกติ ไม่ต้องเด้งไปหน้าแยกต่างหาก และไม่โดน
// toast "ไม่มีสิทธิ์เข้าถึงหน้านี้" ของ PermissionRoute เพราะ Outlet (และ PermissionRoute ข้างใน) ไม่ถูก mount เลย
export function PendingPermissionsPlaceholder() {
  const user = useAuthStore((s) => s.user)
  const { refetch } = useCurrentUser()

  useEffect(() => {
    const interval = setInterval(() => refetch(), FALLBACK_POLL_MS)
    return () => clearInterval(interval)
  }, [refetch])

  return (
    <EmptyState
      icon={Hourglass}
      message={`บันทึกข้อมูลพนักงานของ ${user?.employee?.fullName ?? user?.fullName ?? user?.username} เรียบร้อยแล้ว — รอผู้ดูแลระบบกำหนดสิทธิ์การใช้งานให้ หน้านี้จะอัปเดตให้เองอัตโนมัติเมื่อได้รับสิทธิ์แล้ว`}
    />
  )
}
