import { getUserPath } from '@/lib/database'

export function newTournament({
  name,
  shortCode = '',
  venue = '',
  timezone = '',
  startDate = '',
  endDate = '',
  description = '',
  visibility = 'private',
}: {
  name: string
  shortCode?: string
  venue?: string
  timezone?: string
  startDate?: string
  endDate?: string
  description?: string
  visibility?: 'private' | 'unlisted' | 'public'
}) {
  return {
    ownerID: getUserPath(),
    name,
    shortCode,
    venue,
    timezone,
    startDate,
    endDate,
    description,
    visibility,
    status: 'draft',
    settings: {
      registrationEnabled: false,
      publicBrackets: false,
      publicScores: false,
    },
    events: {},
    rounds: {},
    brackets: {},
    scheduleBlocks: {},
    staffAssignments: {},
    pendingInvites: {},
    publicVisibility: {
      registration: false,
      brackets: false,
      liveScores: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
