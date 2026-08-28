import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

// บัญชีที่ login ผ่าน Microsoft SSO ครั้งแรกจะยังไม่มี employee ผูกอยู่ (employeeId เป็น null) —
// บังคับให้กรอกข้อมูลพนักงานของตัวเองก่อนใช้งานหน้าอื่น (ดู AuthService.completeEmployeeProfile ฝั่ง backend)
export function RequireEmployeeProfile() {
  const user = useAuthStore((s) => s.user)

  if (user && !user.employeeId) {
    return <Navigate to="/complete-profile" replace />
  }

  return <Outlet />
}
