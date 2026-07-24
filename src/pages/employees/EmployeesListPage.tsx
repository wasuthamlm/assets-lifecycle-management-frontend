import { useState } from 'react'
import { useEmployeesQuery } from '@/hooks/useEmployees'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import type { Employee } from '@/api/types/employee.types'

export function EmployeesListPage() {
  usePageTitle('ผู้ใช้งาน/พนักงาน')
  const { data: employees = [], isLoading } = useEmployeesQuery()
  const [search, setSearch] = useState('')

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Employee>[] = [
    { key: 'code', header: 'รหัสพนักงาน', render: (e) => <span className="font-medium">{e.employeeCode}</span> },
    { key: 'name', header: 'ชื่อ-นามสกุล', render: (e) => e.fullName },
    { key: 'department', header: 'แผนก', render: (e) => e.department?.departmentName ?? '-' },
    { key: 'position', header: 'ตำแหน่ง', render: (e) => e.position ?? '-' },
    { key: 'email', header: 'อีเมล', render: (e) => e.email ?? '-' },
    { key: 'phone', header: 'เบอร์โทร', render: (e) => e.phone ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหารหัสพนักงานหรือชื่อ..."
        className="max-w-xs"
      />
      <Card className="p-0">
        <div className="p-4">
          <DataTable columns={columns} rows={filtered} rowKey={(e) => e.employeeId} isLoading={isLoading} />
        </div>
      </Card>
    </div>
  )
}
