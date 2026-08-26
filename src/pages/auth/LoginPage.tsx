import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useLogin } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/errorMessage'
import { isSsoConfigured, supabase } from '@/lib/supabase'

const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const login = useLogin()
  const [ssoLoading, setSsoLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  function onSubmit(values: LoginForm) {
    login.mutate(values, {
      onError: (error) => toast.error(getErrorMessage(error, 'เข้าสู่ระบบไม่สำเร็จ')),
    })
  }

  async function onSsoLogin() {
    if (!supabase) return
    setSsoLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    // ไม่ต้อง setSsoLoading(false) ตอนสำเร็จ — เบราว์เซอร์จะ redirect ออกจากหน้านี้ไปเลย
    if (error) {
      setSsoLoading(false)
      toast.error(getErrorMessage(error, 'เชื่อมต่อ Microsoft SSO ไม่สำเร็จ'))
    }
  }

  return (
    <Card>
      {isSsoConfigured && (
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={ssoLoading}
            onClick={onSsoLogin}
          >
            {ssoLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วยอีเมลบริษัท (Microsoft)'}
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            หรือ
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อผู้ใช้</label>
          <Input {...register('username')} autoFocus placeholder="username" />
          {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสผ่าน</label>
            <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <PasswordInput {...register('password')} placeholder="••••••••" />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>
      </form>
    </Card>
  )
}
