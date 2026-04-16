import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import LabeledField from '@/components/forms/LabeledField'
import { Button, Box, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import {
  issueCapabilityLink,
  listCapabilityLinks,
  revokeCapabilityLink,
  rotateCapabilityLink,
  type CapabilityRecord,
  type CapabilityType,
} from '@/functions/accessTokens'

function getQrImageURL(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
}

function inferDefaultCapabilityType(searchParams: URLSearchParams): CapabilityType {
  const requestedType = searchParams.get('capabilityType')
  if (requestedType === 'table_scoring' || requestedType === 'team_match_scoring' || requestedType === 'player_registration' || requestedType === 'public_score_view') {
    return requestedType
  }
  if (searchParams.get('playerListID')) {
    return 'player_registration'
  }
  if (searchParams.get('teamMatchID')) {
    return 'team_match_scoring'
  }
  return 'table_scoring'
}

function describeCapability(record: CapabilityRecord) {
  if (record.capabilityType === 'table_scoring') {
    return record.matchID ? 'Match-bound table scorer link' : 'Table-scoped operator link'
  }
  if (record.capabilityType === 'team_match_scoring') {
    return record.matchID ? `Table ${record.tableNumber || '1'} scorer link` : `Table ${record.tableNumber || '1'} operator link`
  }
  if (record.capabilityType === 'player_registration') {
    return 'Secure self-registration link'
  }
  return 'Public score view link'
}

function getRecentAuditEvents(record: CapabilityRecord) {
  const auditEntries = record.auditTrail ? Object.entries(record.auditTrail) : []
  return auditEntries
    .map(([id, event]) => ({ id, ...event }))
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 4)
}

export default function QRCodePage() {
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState<CapabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [rotatingTokenID, setRotatingTokenID] = useState('')
  const [revokingTokenID, setRevokingTokenID] = useState('')
  const [copiedURL, setCopiedURL] = useState('')
  const [previewURL, setPreviewURL] = useState('')
  const [expiresInHours, setExpiresInHours] = useState('24')
  const [label, setLabel] = useState(searchParams.get('label') || 'Secure Access Link')
  const [capabilityType, setCapabilityType] = useState<CapabilityType>(inferDefaultCapabilityType(searchParams))

  const tableID = searchParams.get('tableID') || ''
  const teamMatchID = searchParams.get('teamMatchID') || ''
  const playerListID = searchParams.get('playerListID') || ''
  const scoreboardID = searchParams.get('scoreboardID') || ''
  const matchID = searchParams.get('matchID') || ''
  const tableNumber = searchParams.get('table') || '1'

  const filters = useMemo(() => ({
    ...(tableID ? { tableID } : {}),
    ...(teamMatchID ? { teamMatchID } : {}),
    ...(playerListID ? { playerListID } : {}),
    ...(scoreboardID ? { scoreboardID } : {}),
  }), [tableID, teamMatchID, playerListID, scoreboardID])

  const targetSummary = useMemo(() => {
    if (playerListID) {
      return `Player list ${playerListID}`
    }
    if (teamMatchID) {
      return `Team match ${teamMatchID} • Table ${tableNumber}`
    }
    if (tableID) {
      return `Table ${tableID}`
    }
    if (scoreboardID) {
      return `Scoreboard ${scoreboardID}`
    }
    return 'Select a scoring, registration, or public target before issuing links.'
  }, [playerListID, scoreboardID, tableID, tableNumber, teamMatchID])

  const canIssue = useMemo(() => {
    if (capabilityType === 'table_scoring') {
      return Boolean(tableID)
    }
    if (capabilityType === 'team_match_scoring') {
      return Boolean(teamMatchID)
    }
    if (capabilityType === 'player_registration') {
      return Boolean(playerListID)
    }
    return Boolean(scoreboardID && (tableID || teamMatchID))
  }, [capabilityType, playerListID, scoreboardID, tableID, teamMatchID])

  const loadRecords = async () => {
    setRecords(await listCapabilityLinks(filters))
  }

  useEffect(() => {
    async function start() {
      try {
        await loadRecords()
      } finally {
        setLoading(false)
      }
    }

    void start()
  }, [filters])

  const handleCopy = async (url: string) => {
    if (!url) return
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      setCopiedURL(url)
      window.setTimeout(() => setCopiedURL(''), 1600)
    }
  }

  const handleIssue = async () => {
    setIssuing(true)
    try {
      const issued = await issueCapabilityLink({
        capabilityType,
        expiresInHours: Number(expiresInHours) || 24,
        tableID: tableID || undefined,
        teamMatchID: teamMatchID || undefined,
        matchID: matchID || undefined,
        playerListID: playerListID || undefined,
        scoreboardID: scoreboardID || undefined,
        tableNumber,
        label,
      })
      setPreviewURL(issued.url)
      await loadRecords()
    } finally {
      setIssuing(false)
    }
  }

  const handleRotate = async (record: CapabilityRecord) => {
    setRotatingTokenID(record.tokenId)
    try {
      const rotated = await rotateCapabilityLink({
        tokenId: record.tokenId,
        expiresInHours: Number(expiresInHours) || 24,
        label: label || record.label,
      })
      setPreviewURL(rotated.url)
      await loadRecords()
    } finally {
      setRotatingTokenID('')
    }
  }

  const handleRevoke = async (record: CapabilityRecord) => {
    setRevokingTokenID(record.tokenId)
    try {
      await revokeCapabilityLink(record.tokenId)
      await loadRecords()
    } finally {
      setRevokingTokenID('')
    }
  }

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack className="gap-6">
        <VStack className="gap-1">
          <Text className="text-3xl font-bold">QR & Access Links</Text>
          <Text className="text-sm text-slate-600">Issue signed operator, public-view, and registration links. Legacy password links remain migration-only and now exchange into short-lived capability sessions.</Text>
        </VStack>

        <Box className="rounded-2xl border border-slate-200 bg-white p-4">
          <VStack className="gap-4">
            <VStack className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Target</Text>
              <Text className="text-sm text-slate-700">{targetSummary}</Text>
            </VStack>
            <HStack className="flex-wrap items-end gap-3">
              <LabeledField label="Link Type" className="min-w-[15rem] flex-1">
                <Select value={capabilityType} onValueChange={(value) => setCapabilityType(value as CapabilityType)}>
                  <option value="table_scoring">Table Scoring</option>
                  <option value="team_match_scoring">Team-Match Scoring</option>
                  <option value="player_registration">Player Registration</option>
                  <option value="public_score_view">Public Score View</option>
                </Select>
              </LabeledField>
              <LabeledField label="Label" className="min-w-[14rem] flex-1">
                <Input value={label} onChangeText={setLabel} placeholder="Link label" />
              </LabeledField>
              <LabeledField label="Expires In Hours" className="min-w-[12rem]">
                <Input value={expiresInHours} onChangeText={setExpiresInHours} placeholder="24" />
              </LabeledField>
              <Button onClick={handleIssue} disabled={!canIssue || issuing}>
                <Text className="text-white">{issuing ? 'Issuing…' : 'Generate Secure Link'}</Text>
              </Button>
            </HStack>
            {!canIssue ? (
              <Text className="text-sm text-amber-700">This link type needs a matching target in the current admin context before it can be issued.</Text>
            ) : null}
            {(capabilityType === 'table_scoring' || capabilityType === 'team_match_scoring') && !matchID ? (
              <Text className="text-sm text-slate-500">This link will be table-scoped and can follow match changes. If you pass a `matchID`, the link becomes match-bound instead.</Text>
            ) : null}
          </VStack>
        </Box>

        {previewURL ? (
          <Box className="rounded-2xl border border-slate-200 bg-white p-6">
            <VStack className="items-center gap-4">
              <img src={getQrImageURL(previewURL)} alt="Secure access QR code" className="h-60 w-60 rounded-xl border border-slate-200" />
              <Text className="break-all rounded bg-slate-100 px-3 py-2 font-mono text-sm">{previewURL}</Text>
              <HStack className="flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => handleCopy(previewURL)}>
                  <Text>{copiedURL === previewURL ? 'Copied' : 'Copy Link'}</Text>
                </Button>
              </HStack>
            </VStack>
          </Box>
        ) : null}

        <VStack className="gap-3">
          {records.length === 0 ? (
            <Box className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Text className="text-sm text-slate-500">No secure links exist for this target yet.</Text>
            </Box>
          ) : (
            records.map((record) => (
              <Box key={record.tokenId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <VStack className="gap-3">
                  <HStack className="items-start justify-between gap-4">
                    <VStack className="gap-1">
                      <Text className="font-semibold text-slate-900">{record.label || describeCapability(record)}</Text>
                      <Text className="text-sm text-slate-600">{describeCapability(record)}</Text>
                    </VStack>
                    <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      {record.status}
                    </Text>
                  </HStack>
                  <HStack className="flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                    <Text>Created {new Date(record.createdAt).toLocaleString()}</Text>
                    <Text>Expires {record.expiresAt ? new Date(record.expiresAt).toLocaleString() : 'never'}</Text>
                    <Text>Access Count {record.accessCount || 0}</Text>
                    <Text>Last Used {record.lastAccessedAt ? new Date(record.lastAccessedAt).toLocaleString() : 'never'}</Text>
                    <Text>Fingerprint {record.tokenFingerprint}</Text>
                    <Text>Invalid Attempts {record.invalidAttemptCount || 0}</Text>
                    <Text>Suspicious Events {record.suspiciousAttemptCount || 0}</Text>
                  </HStack>
                  {record.replacedByTokenId ? (
                    <Text className="text-xs text-slate-500">Rotated into {record.replacedByTokenId}</Text>
                  ) : null}
                  {record.revocationReason ? (
                    <Text className="text-xs text-slate-500">Revocation reason: {record.revocationReason}</Text>
                  ) : null}
                  {record.lastInvalidAttemptAt ? (
                    <Text className="text-xs text-amber-700">Last blocked access {new Date(record.lastInvalidAttemptAt).toLocaleString()}</Text>
                  ) : null}
                  {getRecentAuditEvents(record).length > 0 ? (
                    <VStack className="gap-1 rounded-xl bg-slate-50 p-3">
                      <Text className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recent Audit</Text>
                      {getRecentAuditEvents(record).map((event) => (
                        <Text key={event.id} className="text-xs text-slate-600">
                          {new Date(event.at).toLocaleString()} • {event.type.replace(/_/g, ' ')}
                        </Text>
                      ))}
                    </VStack>
                  ) : null}
                  <HStack className="flex-wrap gap-2">
                    {record.status === 'active' ? (
                      <Button variant="outline" onClick={() => handleRotate(record)} disabled={rotatingTokenID === record.tokenId}>
                        <Text>{rotatingTokenID === record.tokenId ? 'Rotating…' : 'Rotate'}</Text>
                      </Button>
                    ) : null}
                    {!record.revokedAt && record.status !== 'rotated' ? (
                      <Button variant="outline" onClick={() => handleRevoke(record)} disabled={revokingTokenID === record.tokenId}>
                        <Text>{revokingTokenID === record.tokenId ? 'Revoking…' : 'Revoke'}</Text>
                      </Button>
                    ) : null}
                  </HStack>
                </VStack>
              </Box>
            ))
          )}
        </VStack>
      </VStack>
    </Box>
  )
}
