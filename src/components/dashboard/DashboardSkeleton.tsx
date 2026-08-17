import { Card } from '@/components/ui/Card'

function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 ${className ?? ''}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <Bar className="h-4 w-24" />
              <Bar className="h-[18px] w-[18px] rounded-full" />
            </div>
            <Bar className="mt-3 h-8 w-20" />
            <Bar className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Bar className="mb-4 h-4 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <Bar className="h-3.5 w-32" />
                  <Bar className="h-3.5 w-6" />
                </div>
                <Bar className="h-2 w-full" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Bar className="mb-4 h-4 w-40" />
          <div className="flex items-center gap-6">
            <Bar className="h-48 w-48 shrink-0 rounded-full" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Bar className="h-2.5 w-2.5 rounded-full" />
                  <Bar className="h-3.5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Bar className="h-4 w-36" />
          <Bar className="h-8 w-20 rounded-xl" />
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Bar className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bar className="h-3.5 w-1/3" />
                <Bar className="h-3 w-1/4" />
              </div>
              <Bar className="h-3 w-14 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
