import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useLogout } from './useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function useLogoutFlow() {
  const logout = useLogout()
  const clear = useAuthStore((s) => s.clear)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => setShowModal(true) })
  }

  function finish() {
    clear()
    queryClient.clear()
    navigate('/login')
  }

  const modal = (
    <Modal open={showModal} onClose={finish} title="ออกจากระบบ">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
        <p className="text-sm text-slate-600 dark:text-slate-300">ออกจากระบบเรียบร้อยแล้ว</p>
        <Button onClick={finish} className="w-full">
          ตกลง
        </Button>
      </div>
    </Modal>
  )

  return { handleLogout, isPending: logout.isPending, modal }
}
