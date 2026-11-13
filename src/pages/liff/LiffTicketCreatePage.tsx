import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { lineService } from '@/api/services/line.service'
import type { Assignment } from '@/api/types/assignment.types'
import type { CreateTicketDto, SupportTicket } from '@/api/types/support-ticket.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TicketForm, toDeviceOptions } from '@/components/support/TicketForm'
import { closeLiff, liff } from '@/lib/liff'
import { handleLiffError, useLiffSession } from './LiffLayout'

/** ฟอร์มแจ้งปัญหาใน LINE — ฟิลด์ชุดเดียวกับหน้าเว็บ ticket ที่ได้จะมี source = 'line' (backend ตั้งให้) */
export function LiffTicketCreatePage() {
  const { idToken, user } = useLiffSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [created, setCreated] = useState<SupportTicket | null>(null)
  const deviceOptions = useMemo(() => toDeviceOptions(assignments), [assignments])

  useEffect(() => {
    // ไม่มีสิทธิ์ asset.view ก็ยังแจ้งได้ — แค่ไม่มีรายการของที่ถืออยู่ให้เลือก พิมพ์ชื่ออุปกรณ์เองแทน
    lineService.myAssignments(idToken).then(setAssignments, () => setAssignments([]))
  }, [idToken])

  async function onSubmit(dto: CreateTicketDto, files: File[]) {
    setIsSubmitting(true)
    try {
      const ticket = await lineService.createTicket(idToken, dto)
      if (files.length) {
        setIsUploading(true)
        const results = await Promise.allSettled(files.map((f) => lineService.uploadAttachment(idToken, ticket.ticketId, f)))
        if (results.some((r) => r.status === 'rejected')) toast.warning('แนบรูปบางไฟล์ไม่สำเร็จ — แนบเพิ่มได้ในเว็บ')
      }
      setCreated(ticket)
    } catch (err) {
      handleLiffError(err, 'ส่งเรื่องไม่สำเร็จ')
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  if (created) {
    return (
      <Card className="text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-[#06C755]" />
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">ส่งเรื่องแล้ว</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">เลขที่ {created.ticketNo}</p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">ทีม IT จะแจ้งความคืบหน้ากลับทาง LINE นี้</p>
        <div className="mt-5 flex flex-col gap-2">
          {liff.isInClient() && <Button onClick={closeLiff}>ปิดหน้านี้</Button>}
          <Link to="/liff/support/mine" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            ดูเรื่องที่ฉันแจ้ง
          </Link>
          <Button variant="ghost" onClick={() => setCreated(null)}>
            แจ้งเรื่องอื่นเพิ่ม
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <TicketForm
        reporter={{
          fullName: user.employee?.fullName ?? user.fullName,
          departmentName: user.employee?.department?.departmentName,
          divisionName: user.employee?.department?.parentDepartmentName,
          phone: user.employee?.phone,
        }}
        deviceOptions={deviceOptions}
        isSubmitting={isSubmitting}
        submitLabel={isUploading ? 'กำลังอัปโหลดรูป...' : isSubmitting ? 'กำลังส่ง...' : 'ส่งเรื่องแจ้ง'}
        onSubmit={(dto, files) => void onSubmit(dto, files)}
      />
    </Card>
  )
}
