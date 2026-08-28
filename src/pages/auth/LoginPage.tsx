import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Building2, ShieldCheck } from 'lucide-react'
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

type LoginMode = 'choice' | 'admin'

export function LoginPage() {
  const login = useLogin()
  const [mode, setMode] = useState<LoginMode>(isSsoConfigured ? 'choice' : 'admin')
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // ต้องขอ scope profile ด้วย ไม่งั้น Azure AD จะไม่ใส่ given_name/family_name มาใน ID token เลย
        // แม้จะตั้ง optional claims ไว้ที่ฝั่ง Azure App registration แล้วก็ตาม
        scopes: 'openid profile email',
      },
    })
    // ไม่ต้อง setSsoLoading(false) ตอนสำเร็จ — เบราว์เซอร์จะ redirect ออกจากหน้านี้ไปเลย
    if (error) {
      setSsoLoading(false)
      toast.error(getErrorMessage(error, 'เชื่อมต่อ Microsoft SSO ไม่สำเร็จ'))
    }
  }

  if (mode === 'choice') {
    return (
      <Card>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">เลือกวิธีเข้าสู่ระบบ</p>
        <div className="space-y-3">
          <button
            type="button"
            disabled={ssoLoading}
            onClick={onSsoLogin}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Building2 size={20} />
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                {ssoLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วยอีเมลบริษัท'}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Microsoft (SSO)</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('admin')}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-800 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <ShieldCheck size={20} />
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">เข้าสู่ระบบด้วยแอดมิน</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">ชื่อผู้ใช้และรหัสผ่าน</span>
            </span>
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      {isSsoConfigured && (
        <button
          type="button"
          onClick={() => setMode('choice')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ArrowLeft size={14} />
          กลับไปเลือกวิธีเข้าสู่ระบบ
        </button>
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
