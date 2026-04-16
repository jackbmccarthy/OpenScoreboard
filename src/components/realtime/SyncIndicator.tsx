import type { LiveSyncStatus } from '@/lib/liveSync'

/**
 * Small inline sync indicator for use in list pages that show loading state.
 * Shows a subtle text+dot indicator for live/stale/offline/error states.
 * For pages that use subscribeToPathState and already track syncStatus, use LiveStatusBadge instead.
 */
export default function SyncIndicator({ status }: { status: LiveSyncStatus }) {
  if (status === 'idle' || status === 'live') return null

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
      {status === 'loading' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#93c5fd', display: 'inline-block' }} />}
      {status === 'stale' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} title="Reconnecting…" />}
      {status === 'error' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} title="Connection error" />}
      {status === 'offline' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} title="Offline" />}
      {status === 'unauthorized' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} title="Unauthorized" />}
      {status === 'conflict' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} title="Conflict detected" />}
      {status === 'loading' && <span style={{ color: '#3b82f6' }}>Connecting…</span>}
      {status === 'stale' && <span style={{ color: '#d97706' }}>Reconnecting…</span>}
      {status === 'error' && <span style={{ color: '#e11d48' }}>Connection error</span>}
      {status === 'offline' && <span style={{ color: '#64748b' }}>Offline</span>}
      {status === 'unauthorized' && <span style={{ color: '#e11d48' }}>Unauthorized</span>}
      {status === 'conflict' && <span style={{ color: '#d97706' }}>Conflict detected</span>}
    </span>
  )
}
