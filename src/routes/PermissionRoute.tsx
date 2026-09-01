import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { useCurrentUser } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'

interface PermissionRouteProps {
  permission: string | string[]
  /** เมื่อ permission เป็น array — 'any' (ค่าเริ่มต้น) แปลว่ามีข้อใดข้อหนึ่งก็พอ, 'all' แปลว่าต้องมีครบทุกข้อ
   * (ใช้ 'all' กับหน้าที่มีหลายการกระทำผูกกับคนละ permission เช่น /approvals ที่ต้องมีทั้ง requisition.approve
   * และ requisition.view_all ถึงจะโหลดรายการที่รออนุมัติได้จริง ไม่ใช่แค่ approve อย่างเดียว) */
  mode?: 'any' | 'all'
  /** ปิดกั้น role เหล่านี้แม้จะผ่าน permission ก็ตาม (เช่น employee มี asset.view แต่ไม่ควรเข้าประกัน/ประวัติการเคลื่อนไหว) */
  excludeRoles?: string[]
}

export function PermissionRoute({ permission, mode = 'any', excludeRoles }: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  // ใช้ queryKey เดียวกับ CurrentUserBootstrap ใน App.tsx — ไม่ยิง fetch ซ้ำ แค่ subscribe cache เดิม
  // เพื่อรู้ isError/refetch ตอน /auth/me ล้มเหลว (เช่น backend ต่อไม่ติด)
  const { isError, refetch } = useCurrentUser()

  const allowed = Array.isArray(permission)
    ? mode === 'all'
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission)
  const excluded = !!excludeRoles?.some((r) => user?.roles?.includes(r))
  const denied = !!user && (!allowed || excluded)

  useEffect(() => {
    if (denied) {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', { id: `permission-denied-${location.pathname}` })
    }
  }, [denied, location.pathname])

  // เพิ่งมี accessToken แต่ /auth/me ยังโหลดไม่เสร็จ — permissions ยังว่างอยู่จริงๆ
  // ต้องรอก่อน ไม่งั้นจะโดน redirect ไป /my-items ทั้งที่มีสิทธิ์ (flash-redirect ตอน login ทุกครั้ง)
  if (accessToken && !user) {
    if (isError) {
      return (
        <div className="py-20">
          <ErrorState message="โหลดข้อมูลผู้ใช้งานไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ" onRetry={refetch} />
        </div>
      )
    }
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (denied) {
    return <Navigate to="/my-items" replace />
  }

  return <Outlet />
}
