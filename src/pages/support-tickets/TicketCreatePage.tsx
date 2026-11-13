import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateSupportTicketMutation } from '@/hooks/useSupportTickets'
import { useMyAssignmentsQuery } from '@/hooks/useAssignments'
import { useAuthStore } from '@/stores/auth.store'
import { supportTicketsService } from '@/api/services/support-tickets.service'
import type { CreateTicketDto } from '@/api/types/support-ticket.types'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { TicketForm, toDeviceOptions } from '@/components/support/TicketForm'
import { getErrorMessage } from '@/lib/errorMessage'

export function TicketCreatePage() {
  usePageTitle('แจ้งปัญหา IT')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const employee = user?.employee
  const create = useCreateSupportTicketMutation()
  const { data: myAssignments = [] } = useMyAssignmentsQuery()
  const [isUploading, setIsUploading] = useState(false)
  const deviceOptions = useMemo(() => toDeviceOptions(myAssignments), [myAssignments])

  if (!user?.employeeId) {
    return <EmptyState message="บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน จึงแจ้งปัญหาไม่ได้" />
  }

  function onSubmit(dto: CreateTicketDto, files: File[]) {
    create.mutate(dto, {
      onSuccess: async (ticket) => {
        // รูปอัปโหลดหลังสร้าง ticket ได้ id แล้วเท่านั้น — อัปไม่ผ่านไม่ถือว่าแจ้งไม่สำเร็จ แนบเพิ่มในหน้ารายละเอียดได้
        if (files.length) {
          setIsUploading(true)
          const results = await Promise.allSettled(files.map((f) => supportTicketsService.uploadAttachment(ticket.ticketId, f)))
          setIsUploading(false)
          if (results.some((r) => r.status === 'rejected')) {
            toast.warning('แนบรูปบางไฟล์ไม่สำเร็จ — แนบเพิ่มได้ในหน้ารายละเอียด')
          }
        }
        toast.success(`ส่งเรื่องแล้ว เลขที่ ${ticket.ticketNo}`)
        navigate(`/support-tickets/${ticket.ticketId}`, { replace: true })
      },
      onError: (error) => toast.error(getErrorMessage(error, 'ส่งเรื่องไม่สำเร็จ')),
    })
  }

  return (
    <div>
      <BackLink />
      <Card>
        <TicketForm
          reporter={{
            fullName: employee?.fullName ?? user.fullName,
            departmentName: employee?.department?.departmentName,
            divisionName: employee?.department?.parentDepartmentName,
            phone: employee?.phone,
          }}
          deviceOptions={deviceOptions}
          // เปิดมาจากปุ่ม "แจ้งปัญหา" ในหน้ารายการของฉัน → เลือกอุปกรณ์ไว้ให้ + เดาประเภทเป็นฮาร์ดแวร์
          presetAssetId={searchParams.get('assetId') ?? ''}
          isSubmitting={create.isPending || isUploading}
          submitLabel={isUploading ? 'กำลังอัปโหลดรูป...' : create.isPending ? 'กำลังส่ง...' : 'ส่งเรื่องแจ้ง'}
          onSubmit={onSubmit}
          onCancel={() => navigate(-1)}
        />
      </Card>
    </div>
  )
}
