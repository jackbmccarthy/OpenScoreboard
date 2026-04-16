import { Badge } from '@/components/ui'
import { getLiveSyncLabel, type LiveSyncStatus } from '@/lib/liveSync'

const statusClasses: Record<LiveSyncStatus, string> = {
  idle: 'bg-slate-100 text-slate-700',
  loading: 'bg-blue-100 text-blue-700',
  live: 'bg-emerald-100 text-emerald-700',
  error: 'bg-rose-100 text-rose-700',
  stale: 'bg-amber-100 text-amber-800',
  offline: 'bg-slate-200 text-slate-700',
  unauthorized: 'bg-rose-100 text-rose-700',
  conflict: 'bg-amber-100 text-amber-800',
}

export default function LiveStatusBadge({ status, prefix = 'Sync' }: { status: LiveSyncStatus; prefix?: string }) {
  return (
    <Badge className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${statusClasses[status]}`}>
      {prefix}: {getLiveSyncLabel(status)}
    </Badge>
  )
}
