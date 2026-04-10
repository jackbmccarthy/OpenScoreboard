import { NextResponse } from 'next/server'
import {
  buildCapabilityUrl,
  callerOwnsCapabilityTarget,
  issueCapabilityToken,
  listCapabilityTokens,
  resolveCapabilityToken,
  revokeCapabilityToken,
  validateScoringCapabilityTarget,
  type CapabilityType,
} from '@/server/capabilities'
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
}

type ListRequest = {
  action: 'list'
  filters?: Record<string, unknown>
}

type CapabilityRequest = IssueRequest | ResolveRequest | RevokeRequest | ListRequest

function getAuthToken(request: Request) {
  const authorization = request.headers.get('authorization')
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CapabilityRequest

    switch (body.action) {
      case 'issue': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error
        if ((body.capabilityType === 'table_scoring' || body.capabilityType === 'team_match_scoring') && !body.matchID) {
          return NextResponse.json({ error: 'Scoring capability links require an existing matchID' }, { status: 400 })
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
            return NextResponse.json({ error: 'The requested matchID is not assigned to this scoring target' }, { status: 400 })
          }
        }
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
          authToken: manager.authToken,
        })
        const origin = body.origin || new URL(request.url).origin
        return NextResponse.json({
          token,
          record,
          url: buildCapabilityUrl(origin, record, token),
        })
      }
      case 'resolve': {
        const record = await resolveCapabilityToken(body.token, body.capabilityType)
        if (!record) {
          return NextResponse.json({ error: 'Invalid or expired capability token' }, { status: 401 })
        }
        const origin = body.origin || new URL(request.url).origin
        return NextResponse.json({
          record,
          url: buildCapabilityUrl(origin, record, body.token),
        })
      }
      case 'revoke': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error
        const record = await revokeCapabilityToken(body.tokenId, manager.authToken, manager.callerID)
        if (!record) {
          return NextResponse.json({ error: 'Capability token not found' }, { status: 404 })
        }
        return NextResponse.json({ record })
      }
      case 'list': {
        const manager = await requireCapabilityManager(request)
        if ('error' in manager) return manager.error
        const records = await listCapabilityTokens({ ...(body.filters || {}), createdBy: manager.callerID }, manager.authToken)
        return NextResponse.json({ records })
      }
      default:
        return NextResponse.json({ error: 'Unsupported capability action' }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Capability request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
