import * as crypto from 'node:crypto'

import { NextResponse } from 'next/server'

import {
  buildCapabilityUrl,
  callerOwnsCapabilityTarget,
  exchangeLegacyCapabilityToken,
  issueCapabilityToken,
  listCapabilityTokens,
  resolveCapabilityToken,
  revokeCapabilityToken,
  rotateCapabilityToken,
  validateScoringCapabilityTarget,
  type CapabilityRequestContext,
  type CapabilityType,
} from '@/server/capabilities'
import { executeServerDatabaseActions } from '@/server/databaseDriver'
import { isRequestSecurityError } from '@/server/errors'
import { firebaseClientConfig, isLocalDatabase } from '@/lib/env'

type IssueRequest = {
  action: 'issue'
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

type ResolveRequest = {
  action: 'resolve'
  token: string
  capabilityType?: CapabilityType
  origin?: string
}

type RevokeRequest = {
  action: 'revoke'
  tokenId: string
  reason?: string
}

type RotateRequest = {
  action: 'rotate'
  tokenId: string
  expiresInHours?: number | null
  label?: string
  origin?: string
}

type ListRequest = {
  action: 'list'
  filters?: Record<string, unknown>
}

type ExchangeLegacyRequest = {
  action: 'exchangeLegacy'
  capabilityType: 'table_scoring' | 'player_registration'
  tableID?: string
  playerListID?: string
  secret: string
  origin?: string
}

type CapabilityRequest =
  | IssueRequest
  | ResolveRequest
  | RevokeRequest
  | RotateRequest
  | ListRequest
  | ExchangeLegacyRequest

type RateLimitState = {
  timestamps: number[]
}

const rateLimitBuckets = new Map<string, RateLimitState>()

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function getAuthToken(request: Request) {
  const authorization = request.headers.get('authorization')
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null
}

function getClientIPAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function getRequestContext(request: Request, callerID?: string | null, originOverride?: string): CapabilityRequestContext {
  return {
    actorID: callerID || undefined,
    ipAddress: getClientIPAddress(request),
    userAgent: request.headers.get('user-agent') || '',
    origin: originOverride || request.headers.get('origin') || new URL(request.url).origin,
  }
}

function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = rateLimitBuckets.get(key) || { timestamps: [] }
  current.timestamps = current.timestamps.filter((timestamp) => now - timestamp < windowMs)
  if (current.timestamps.length >= limit) {
    rateLimitBuckets.set(key, current)
    return false
  }
  current.timestamps.push(now)
  rateLimitBuckets.set(key, current)
  return true
}

async function logSuspiciousAccess(
  eventType: string,
  request: Request,
  details: Record<string, unknown>,
) {
  await executeServerDatabaseActions([
    {
      type: 'push',
      path: 'securityEvents/capabilityAccess',
      value: {
        type: eventType,
        at: new Date().toISOString(),
        ipHash: hashValue(getClientIPAddress(request)),
        userAgentHash: hashValue(request.headers.get('user-agent') || ''),
        origin: request.headers.get('origin') || '',
        details,
      },
    },
  ])
}

async function getCapabilityCallerID(authToken: string | null) {
  if (isLocalDatabase) {
    return 'mylocalserver'
  }
  if (!authToken) {
    return null
  }
  if (!firebaseClientConfig.apiKey) {
    return null
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseClientConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: authToken }),
  })
  if (!response.ok) return null
  const payload = await response.json()
  const user = Array.isArray(payload?.users) ? payload.users[0] : null
  return user?.localId || null
}

async function requireCapabilityManager(request: Request) {
  const authToken = getAuthToken(request)
  const callerID = await getCapabilityCallerID(authToken)
  if (!callerID) {
    return { error: NextResponse.json({ error: 'Authentication required for capability management' }, { status: 401 }) }
  }
  return { authToken, callerID }
}

async function enforcePublicRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
  details: Record<string, unknown>,
) {
  const key = `${bucket}:${hashValue(getClientIPAddress(request))}`
  const allowed = consumeRateLimit(key, limit, windowMs)
  if (allowed) {
    return null
  }

  await logSuspiciousAccess('rate_limited', request, details)
  return NextResponse.json({ error: 'Too many access attempts. Try again later.' }, { status: 429 })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CapabilityRequest

    switch (body.action) {
      case 'issue': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error

        if (body.capabilityType === 'table_scoring' && !body.tableID) {
          return NextResponse.json({ error: 'Table scoring links require a tableID' }, { status: 400 })
        }
        if (body.capabilityType === 'team_match_scoring' && !body.teamMatchID) {
          return NextResponse.json({ error: 'Team match scoring links require a teamMatchID' }, { status: 400 })
        }
        if (body.capabilityType === 'player_registration' && !body.playerListID) {
          return NextResponse.json({ error: 'Player registration links require a playerListID' }, { status: 400 })
        }
        if (body.capabilityType === 'public_score_view' && !body.scoreboardID) {
          return NextResponse.json({ error: 'Public score view links require a scoreboardID' }, { status: 400 })
        }
        if (body.capabilityType === 'public_score_view' && !body.tableID && !body.teamMatchID) {
          return NextResponse.json({ error: 'Public score view links require a tableID or teamMatchID' }, { status: 400 })
        }

        const ownsTarget = await callerOwnsCapabilityTarget({
          tableID: body.tableID,
          teamMatchID: body.teamMatchID,
          playerListID: body.playerListID,
          scoreboardID: body.scoreboardID,
        }, manager.callerID, manager.authToken)
        if (!ownsTarget) {
          return NextResponse.json({ error: 'You do not own the requested capability target' }, { status: 403 })
        }

        if (body.capabilityType === 'table_scoring' || body.capabilityType === 'team_match_scoring') {
          const validScoringTarget = await validateScoringCapabilityTarget({
            capabilityType: body.capabilityType,
            tableID: body.tableID,
            teamMatchID: body.teamMatchID,
            tableNumber: body.tableNumber,
            matchID: body.matchID,
          }, manager.authToken)
          if (!validScoringTarget) {
            return NextResponse.json({ error: 'The requested scoring target is not valid for this link' }, { status: 400 })
          }
        }

        const requestContext = getRequestContext(request, manager.callerID, body.origin)
        const { token, record } = await issueCapabilityToken({
          capabilityType: body.capabilityType,
          createdBy: manager.callerID,
          expiresInHours: body.expiresInHours ?? 24,
          tableID: body.tableID,
          teamMatchID: body.teamMatchID,
          matchID: body.matchID,
          playerListID: body.playerListID,
          tableNumber: body.tableNumber,
          scoreboardID: body.scoreboardID,
          label: body.label,
          requestContext: {
            ...requestContext,
            source: 'issue',
          },
        })
        const origin = body.origin || new URL(request.url).origin
        return NextResponse.json({
          token,
          record,
          url: buildCapabilityUrl(origin, record, token),
        })
      }
      case 'resolve': {
        const rateLimitResponse = await enforcePublicRateLimit(request, 'resolve', 20, 60_000, {
          tokenFingerprint: hashValue(body.token),
          capabilityType: body.capabilityType || '',
        })
        if (rateLimitResponse) {
          return rateLimitResponse
        }

        const requestContext = getRequestContext(request, undefined, body.origin)
        const record = await resolveCapabilityToken(body.token, body.capabilityType, {
          ...requestContext,
          source: 'resolve',
        })
        if (!record) {
          await logSuspiciousAccess('invalid_token', request, {
            capabilityType: body.capabilityType || '',
            tokenFingerprint: hashValue(body.token),
          })
          return NextResponse.json({ error: 'Invalid or expired capability token' }, { status: 401 })
        }
        const origin = body.origin || new URL(request.url).origin
        return NextResponse.json({
          record,
          url: buildCapabilityUrl(origin, record, body.token),
        })
      }
      case 'exchangeLegacy': {
        const targetID = body.capabilityType === 'table_scoring' ? body.tableID || '' : body.playerListID || ''
        const rateLimitResponse = await enforcePublicRateLimit(request, `legacy:${body.capabilityType}:${targetID}`, 10, 60_000, {
          capabilityType: body.capabilityType,
          targetID,
        })
        if (rateLimitResponse) {
          return rateLimitResponse
        }

        const requestContext = getRequestContext(request, undefined, body.origin)
        const exchanged = await exchangeLegacyCapabilityToken({
          capabilityType: body.capabilityType,
          secret: body.secret,
          tableID: body.tableID,
          playerListID: body.playerListID,
          requestContext: {
            ...requestContext,
            source: 'legacy_exchange',
          },
        })
        if (!exchanged) {
          await logSuspiciousAccess('invalid_legacy_secret', request, {
            capabilityType: body.capabilityType,
            targetID,
          })
          return NextResponse.json({ error: 'Invalid legacy access secret' }, { status: 401 })
        }
        const origin = body.origin || new URL(request.url).origin
        return NextResponse.json({
          token: exchanged.token,
          record: exchanged.record,
          url: buildCapabilityUrl(origin, exchanged.record, exchanged.token),
        })
      }
      case 'revoke': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error
        const record = await revokeCapabilityToken(
          body.tokenId,
          manager.callerID,
          {
            ...getRequestContext(request, manager.callerID),
            source: 'revoke',
          },
          body.reason || 'revoked_by_owner',
        )
        if (!record) {
          return NextResponse.json({ error: 'Capability token not found' }, { status: 404 })
        }
        return NextResponse.json({ record })
      }
      case 'rotate': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error
        const rotated = await rotateCapabilityToken({
          tokenId: body.tokenId,
          ownerID: manager.callerID,
          expiresInHours: body.expiresInHours,
          label: body.label,
          requestContext: {
            ...getRequestContext(request, manager.callerID, body.origin),
            source: 'rotate',
          },
        })
        if (!rotated) {
          return NextResponse.json({ error: 'Capability token not found' }, { status: 404 })
        }
        const origin = body.origin || new URL(request.url).origin
        return NextResponse.json({
          token: rotated.token,
          record: rotated.record,
          url: buildCapabilityUrl(origin, rotated.record, rotated.token),
        })
      }
      case 'list': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error
        const records = await listCapabilityTokens({ ...(body.filters || {}), createdBy: manager.callerID })
        return NextResponse.json({ records })
      }
      default:
        return NextResponse.json({ error: 'Unsupported capability action' }, { status: 400 })
    }
  } catch (error) {
    if (isRequestSecurityError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Capability request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
