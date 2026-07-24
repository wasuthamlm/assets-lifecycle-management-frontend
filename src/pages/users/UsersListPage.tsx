import { useUsersQuery } from '@/hooks/useUsers'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import type { User } from '@/api/types/user.types'

export function UsersListPage() {
  usePageTitle('บัญชีผู้ใช้งาน')
  const { data: users = [], isLoading } = useUsersQuery()

  const columns: DataTableColumn<User>[] = [
    { key: 'username', header: 'ชื่อผู้ใช้', render: (u) => <span className="font-medium">{u.username}</span> },
    { key: 'employee', header: 'พนักงาน', render: (u) => u.employee?.fullName ?? '-' },
    { key: 'email', header: 'อีเมล', render: (u) => u.email ?? '-' },
    {
      key: 'status',
      header: 'สถานะ',
      render: (u) => (
        <span className={u.isActive ? 'text-emerald-600' : 'text-slate-400'}>{u.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}</span>
      ),
    },
  ]

  return (
    <Card className="p-0">
      <div className="p-4">
        <DataTable columns={columns} rows={users} rowKey={(u) => u.userId} isLoading={isLoading} />
      </div>
    </Card>
  )
}
