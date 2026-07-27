import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useEmployeesQuery } from '@/hooks/useEmployees'
import { useDepartmentsQuery, useLocationsQuery, useVendorsQuery } from '@/hooks/useMasterData'
import { AssignmentType, HolderType } from '@/api/types/common.types'
import { ASSIGNMENT_TYPE_LABEL, HOLDER_TYPE_LABEL } from '@/lib/constants'
import { optionalDateString } from '@/lib/zodHelpers'
import type { IssueAssetDto } from '@/api/types/assignment.types'

const formSchema = z.object({
  assignmentType: z.nativeEnum(AssignmentType),
  holderType: z.nativeEnum(HolderType),
  holderId: z.coerce.number().int().positive('กรุณาเลือกผู้รับ'),
  dueDate: optionalDateString(),
  notes: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

interface IssueAssetFormProps {
  assetId: number
  onSubmit: (dto: IssueAssetDto) => void
  isSubmitting?: boolean
}

export function IssueAssetForm({ assetId, onSubmit, isSubmitting }: IssueAssetFormProps) {
  const { data: employees = [] } = useEmployeesQuery()
  const { data: departments = [] } = useDepartmentsQuery()
  const { data: locations = [] } = useLocationsQuery()
  const { data: vendors = [] } = useVendorsQuery()

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignmentType: AssignmentType.PERMANENT,
      holderType: HolderType.EMPLOYEE,
    },
  })

  const holderType = watch('holderType')
  const assignmentType = watch('assignmentType')

  function submit(values: FormValues) {
    onSubmit({
      assetId,
      assignmentType: values.assignmentType,
      holderType: values.holderType,
      holderId: values.holderId,
      dueDate: values.dueDate || undefined,
      notes: values.notes,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ประเภทการเบิก-จ่าย</label>
        <Select {...register('assignmentType')}>
          {Object.values(AssignmentType).map((t) => (
            <option key={t} value={t}>
              {ASSIGNMENT_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ประเภทผู้รับ</label>
        <Select {...register('holderType')}>
          {Object.values(HolderType).map((t) => (
            <option key={t} value={t}>
              {HOLDER_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้รับ</label>
        {holderType === HolderType.EMPLOYEE && (
          <Select {...register('holderId')}>
            <option value="">เลือกพนักงาน</option>
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.fullName}
              </option>
            ))}
          </Select>
        )}
        {holderType === HolderType.DEPARTMENT && (
          <Select {...register('holderId')}>
            <option value="">เลือกแผนก</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </Select>
        )}
        {holderType === HolderType.LOCATION && (
          <Select {...register('holderId')}>
            <option value="">เลือกสถานที่</option>
            {locations.map((l) => (
              <option key={l.locationId} value={l.locationId}>
                {l.locationName}
              </option>
            ))}
          </Select>
        )}
        {holderType === HolderType.VENDOR && (
          <Select {...register('holderId')}>
            <option value="">เลือกผู้ขาย</option>
            {vendors.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.vendorName}
              </option>
            ))}
          </Select>
        )}
        {errors.holderId && <p className="mt-1 text-xs text-red-600">{errors.holderId.message}</p>}
      </div>

      {assignmentType !== AssignmentType.PERMANENT && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">กำหนดคืน</label>
          <Input type="date" {...register('dueDate')} />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมายเหตุ</label>
        <Textarea rows={2} {...register('notes')} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเบิก-จ่าย'}
      </Button>
    </form>
  )
}
