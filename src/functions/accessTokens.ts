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
  status: 'active' | 'revoked' | 'expired' | 'rotated'
  createdAt: string
  createdBy: string
  expiresAt: string | null
  revokedAt: string | null
  revokedBy?: string
  revocationReason?: string
  rotatedAt?: string
  replacedByTokenId?: string
  replacesTokenId?: string
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
  label?: string
  tokenFingerprint: string
  issuedFromIPHash?: string
  issuedUserAgentHash?: string
  lastAccessIPHash?: string
  lastAccessUserAgentHash?: string
  lastAccessedAt?: string
  accessCount?: number
  lastInvalidAttemptAt?: string
  invalidAttemptCount?: number
  suspiciousAttemptCount?: number
  auditTrail?: Record<string, {
    type: string
    at: string
    actorID?: string
    ipHash?: string
    userAgentHash?: string
    origin?: string
    details?: Record<string, unknown>
  }>
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

type RotateCapabilityInput = {
  tokenId: string
  expiresInHours?: number | null
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

export async function rotateCapabilityLink(input: RotateCapabilityInput) {
  const response = await fetch('/api/capabilities', {
    method: 'POST',
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      action: 'rotate',
      ...input,
      origin: input.origin || (typeof window !== 'undefined' ? window.location.origin : ''),
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to rotate capability link')
  }
  return payload as { token: string; record: CapabilityRecord; url: string }
}

export async function exchangeLegacyCapabilityLink(input: {
  capabilityType: 'table_scoring' | 'player_registration'
  tableID?: string
  playerListID?: string
  secret: string
  origin?: string
}) {
  const response = await fetch('/api/capabilities', {
    method: 'POST',
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      action: 'exchangeLegacy',
      ...input,
      origin: input.origin || (typeof window !== 'undefined' ? window.location.origin : ''),
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to exchange legacy access')
  }
  return payload as { token: string; record: CapabilityRecord; url: string }
}

export function activateCapabilityToken(token: string | null) {
  setCurrentCapabilityToken(token)
}
