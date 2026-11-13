import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { lineService, type LineConfig } from '@/api/services/line.service'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/errorMessage'

/**
 * เชื่อมบัญชีกับแชท LINE OA: กด "ขอรหัส" → พิมพ์รหัส 6 หลักในแชท → บอทผูกให้
 * ซ่อนทั้งการ์ดถ้า backend ยังไม่เปิดแชทบอท (ไม่ได้ตั้ง LINE_MESSAGING_CHANNEL_SECRET)
 */
export function LineLinkCard() {
  const [config, setConfig] = useState<LineConfig | null>(null)
  const [linked, setLinked] = useState<boolean | null>(null)
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    lineService.config().then(setConfig, () => setConfig(null))
  }, [])

  useEffect(() => {
    if (!config?.chatEnabled) return
    lineService.linkStatus().then((s) => setLinked(s.linked), () => setLinked(null))
  }, [config?.chatEnabled])

  // ระหว่างแสดงรหัส เช็คสถานะทุก 3 วินาที — พิมพ์รหัสในแชทเสร็จ การ์ดจะเปลี่ยนเป็น "เชื่อมแล้ว" เอง
  useEffect(() => {
    if (!code) return
    const timer = setInterval(async () => {
      if (Date.now() > new Date(code.expiresAt).getTime()) return setCode(null)
      try {
        const s = await lineService.linkStatus()
        if (s.linked) {
          setLinked(true)
          setCode(null)
          toast.success('เชื่อมบัญชี LINE เรียบร้อย')
        }
      } catch {
        // ลองใหม่รอบถัดไป
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [code])

  if (!config?.chatEnabled || linked === null) return null

  async function requestCode() {
    setIsBusy(true)
    try {
      setCode(await lineService.linkCode())
    } catch (err) {
      toast.error(getErrorMessage(err, 'ขอรหัสไม่สำเร็จ'))
    } finally {
      setIsBusy(false)
    }
  }

  async function unlink() {
    setIsBusy(true)
    try {
      await lineService.unlink()
      setLinked(false)
      toast.success('ยกเลิกการเชื่อมต่อ LINE แล้ว')
    } catch (err) {
      toast.error(getErrorMessage(err, 'ยกเลิกไม่สำเร็จ'))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle size={18} className="text-[#06C755]" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">แจ้งปัญหา IT ผ่านแชท LINE</h3>
      </div>

      {linked ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">✅ เชื่อมต่อแล้ว — พิมพ์อาการในแชท OA ได้เลย</p>
          <Button variant="ghost" onClick={() => void unlink()} disabled={isBusy}>
            ยกเลิกการเชื่อมต่อ
          </Button>
        </div>
      ) : code ? (
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            1. {config.addFriendUrl ? (
              <a href={config.addFriendUrl} target="_blank" rel="noreferrer" className="font-medium text-[#05a347] hover:underline">
                เพิ่มเพื่อน LINE OA
              </a>
            ) : (
              'เพิ่มเพื่อน LINE OA ของฝ่าย IT'
            )}
          </p>
          <p>2. พิมพ์รหัสนี้ในแชท (หมดอายุใน 10 นาที)</p>
          <p className="select-all rounded-xl bg-slate-100 py-3 text-center font-mono text-3xl font-bold tracking-[0.3em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            {code.code}
          </p>
          <p className="text-xs text-slate-400">หน้านี้จะอัปเดตเองเมื่อเชื่อมต่อสำเร็จ</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">เชื่อมบัญชีครั้งเดียว แล้วแจ้งปัญหาด้วยการพิมพ์ในแชท LINE</p>
          <Button onClick={() => void requestCode()} loading={isBusy}>
            ขอรหัสเชื่อมต่อ
          </Button>
        </div>
      )}
    </Card>
  )
}
