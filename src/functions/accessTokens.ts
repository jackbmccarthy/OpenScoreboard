import { getCurrentCapabilityToken, setCurrentCapabilityToken } from '@/lib/capabilitySession'
import firebase from 'firebase/app'
import 'firebase/auth'

export type CapabilityType =
  | 'table_scoring'
  | 'team_match_scoring'
  | 'player_registration'
  | 'public_score_view'

export type CapabilityRecord = {
  tokenId: string
  capabilityType: CapabilityType
  createdAt: string
  createdBy: string
  expiresAt: string | null
  revokedAt: string | null
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
  label?: string
  tokenFingerprint: string
}

type IssueCapabilityInput = {
  capabilityType: CapabilityType
  expiresInHours?: number | null
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
  label?: string
  origin?: string
}

async function getJsonHeaders() {
  const capabilityToken = getCurrentCapabilityToken()
  const currentUser = firebase.apps.length ? firebase.auth().currentUser : null
  const firebaseToken = currentUser ? await currentUser.getIdToken() : null
  return {
    'Content-Type': 'application/json',
    ...(firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}),
    ...(capabilityToken ? { 'X-OpenScoreboard-Capability': capabilityToken } : {}),
  }
}

export async function issueCapabilityLink(input: IssueCapabilityInput) {
  const response = await fetch('/api/capabilities', {
    method: 'POST',
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      action: 'issue',
      ...input,
      origin: input.origin || (typeof window !== 'undefined' ? window.location.origin : ''),
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to issue capability link')
  }
  return payload as { token: string; record: CapabilityRecord; url: string }
}

export async function resolveCapabilityLink(token: string, capabilityType?: CapabilityType) {
  const response = await fetch('/api/capabilities', {
    method: 'POST',
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      action: 'resolve',
      token,
      capabilityType,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    return null
  }
  return payload as { record: CapabilityRecord; url: string }
}

export async function listCapabilityLinks(filters: Record<string, unknown>) {
  const response = await fetch('/api/capabilities', {
    method: 'POST',
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      action: 'list',
      filters,
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to list capability links')
  }
  return (payload?.records || []) as CapabilityRecord[]
}

export async function revokeCapabilityLink(tokenId: string) {
  const response = await fetch('/api/capabilities', {
    method: 'POST',
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      action: 'revoke',
      tokenId,
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to revoke capability link')
  }
  return payload?.record as CapabilityRecord
}

export function activateCapabilityToken(token: string | null) {
  setCurrentCapabilityToken(token)
}
