import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { useChangePassword } from '@/hooks/useAuth'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/errorMessage'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ChangePasswordPage() {
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: FormValues) {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => toast.success('เปลี่ยนรหัสผ่านสำเร็จ'),
        onError: (error) => toast.error(getErrorMessage(error, 'เปลี่ยนรหัสผ่านไม่สำเร็จ')),
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <KeyRound size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">ต้องเปลี่ยนรหัสผ่าน</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              บัญชีนี้ยังใช้รหัสผ่านชั่วคราวอยู่ กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งานต่อ
            </p>
          </div>
        </div>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสผ่านปัจจุบัน</label>
              <PasswordInput {...register('currentPassword')} placeholder="••••••••" autoFocus />
              {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสผ่านใหม่</label>
              <PasswordInput {...register('newPassword')} placeholder="อย่างน้อย 8 ตัวอักษร" />
              {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ยืนยันรหัสผ่านใหม่</label>
              <PasswordInput {...register('confirmPassword')} placeholder="••••••••" />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
