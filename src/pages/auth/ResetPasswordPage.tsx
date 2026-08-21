import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useResetPassword } from '@/hooks/useAuth'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/errorMessage'

const schema = z
  .object({
    newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const resetPassword = useResetPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: FormValues) {
    resetPassword.mutate(
      { token, newPassword: values.newPassword },
      {
        onSuccess: () => toast.success('ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง'),
        onError: (error) => toast.error(getErrorMessage(error, 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ')),
      },
    )
  }

  if (!token) {
    return (
      <Card>
        <p className="text-sm text-red-600">ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง</p>
        <Link to="/forgot-password" className="mt-4 inline-block text-sm text-brand-600 hover:underline dark:text-brand-400">
          ขอลิงก์รีเซ็ตรหัสผ่านใหม่
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสผ่านใหม่</label>
          <PasswordInput {...register('newPassword')} autoFocus placeholder="อย่างน้อย 8 ตัวอักษร" />
          {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ยืนยันรหัสผ่านใหม่</label>
          <PasswordInput {...register('confirmPassword')} placeholder="••••••••" />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
        </Button>
      </form>
    </Card>
  )
}
