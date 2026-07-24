import { useState } from 'react'
import { useRolesQuery, usePermissionsQuery } from '@/hooks/useRolesPermissions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'
import type { Permission, Role } from '@/api/types/roles-permissions.types'

type Tab = 'roles' | 'permissions'

export function RolesPermissionsPage() {
  usePageTitle('สิทธิ์การใช้งาน')
  const [tab, setTab] = useState<Tab>('roles')
  const { data: roles = [], isLoading: rolesLoading } = useRolesQuery()
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissionsQuery()

  const roleColumns: DataTableColumn<Role>[] = [
    { key: 'name', header: 'ชื่อบทบาท', render: (r) => <span className="font-medium">{r.roleName}</span> },
    { key: 'description', header: 'คำอธิบาย', render: (r) => r.description ?? '-' },
    { key: 'permissions', header: 'จำนวนสิทธิ์', render: (r) => `${r.rolePermissions?.length ?? 0} รายการ` },
  ]

  const permissionColumns: DataTableColumn<Permission>[] = [
    { key: 'code', header: 'รหัสสิทธิ์', render: (p) => <span className="font-mono text-xs">{p.permissionCode}</span> },
    { key: 'description', header: 'คำอธิบาย', render: (p) => p.description ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('roles')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
            tab === 'roles'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
          )}
        >
          บทบาท (Roles)
        </button>
        <button
          onClick={() => setTab('permissions')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
            tab === 'permissions'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
          )}
        >
          สิทธิ์การใช้งาน (Permissions)
        </button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          {tab === 'roles' && (
            <DataTable columns={roleColumns} rows={roles} rowKey={(r) => r.roleId} isLoading={rolesLoading} />
          )}
          {tab === 'permissions' && (
            <DataTable columns={permissionColumns} rows={permissions} rowKey={(p) => p.permissionId} isLoading={permissionsLoading} />
          )}
        </div>
      </Card>
    </div>
  )
}
