import { Badge } from '@/components/ui'
import type { RealtimeStatus } from '@/lib/realtime'

const statusClasses: Record<RealtimeStatus, string> = {
  idle: 'bg-slate-100 text-slate-700',
  loading: 'bg-blue-100 text-blue-700',
  live: 'bg-emerald-100 text-emerald-700',
  error: 'bg-rose-100 text-rose-700',
  stale: 'bg-amber-100 text-amber-800',
  offline: 'bg-slate-200 text-slate-700',
}

const statusLabels: Record<RealtimeStatus, string> = {
  idle: 'Idle',
  loading: 'Loading',
  live: 'Live',
  error: 'Error',
  stale: 'Stale',
  offline: 'Offline',
}

export default function LiveStatusBadge({ status, prefix = 'Sync' }: { status: RealtimeStatus; prefix?: string }) {
  return (
    <Badge className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${statusClasses[status]}`}>
      {prefix}: {statusLabels[status]}
    </Badge>
  )
}
