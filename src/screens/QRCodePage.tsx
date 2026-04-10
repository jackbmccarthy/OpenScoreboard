import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Button, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { issueCapabilityLink, listCapabilityLinks, revokeCapabilityLink, type CapabilityRecord, type CapabilityType } from '@/functions/accessTokens'

function getQrImageURL(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
}

export default function QRCodePage() {
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState<CapabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [lastIssuedURL, setLastIssuedURL] = useState('')
  const [expiresInHours, setExpiresInHours] = useState('24')
  const [capabilityType, setCapabilityType] = useState<CapabilityType>('table_scoring')
  const tableID = searchParams.get('tableID') || ''
  const teamMatchID = searchParams.get('teamMatchID') || ''
  const playerListID = searchParams.get('playerListID') || ''
  const scoreboardID = searchParams.get('scoreboardID') || ''
  const matchID = searchParams.get('matchID') || ''
  const tableNumber = searchParams.get('table') || '1'
  const label = searchParams.get('label') || 'Access Link'
  const scoringLinkNeedsMatch = (capabilityType === 'table_scoring' || capabilityType === 'team_match_scoring') && !matchID
  const publicScoreViewNeedsScoreboard = capabilityType === 'public_score_view' && !scoreboardID
  const publicScoreViewNeedsTarget = capabilityType === 'public_score_view' && !tableID && !teamMatchID

  const filters = useMemo(() => ({
    ...(tableID ? { tableID } : {}),
    ...(teamMatchID ? { teamMatchID } : {}),
    ...(playerListID ? { playerListID } : {}),
    ...(scoreboardID ? { scoreboardID } : {}),
  }), [tableID, teamMatchID, playerListID, scoreboardID])

  useEffect(() => {
    async function loadRecords() {
      try {
        setRecords(await listCapabilityLinks(filters))
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
  }, [filters])

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
      setLastIssuedURL(issued.url)
      setRecords(await listCapabilityLinks(filters))
    } finally {
      setIssuing(false)
    }
  }

  const handleRevoke = async (tokenId: string) => {
    await revokeCapabilityLink(tokenId)
    setRecords(await listCapabilityLinks(filters))
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
      <VStack space="lg">
        <Text className="text-3xl font-bold">{label}</Text>
        <Text className="text-sm text-slate-600">Generate secure operator and public links with expiration and revocation support.</Text>

        <HStack className="gap-3">
          <Select value={capabilityType} onValueChange={(value) => setCapabilityType(value as CapabilityType)}>
            <option value="table_scoring">Table Scoring</option>
            <option value="team_match_scoring">Team Match Scoring</option>
            <option value="player_registration">Player Registration</option>
            <option value="public_score_view">Public Score View</option>
          </Select>
          <Input value={expiresInHours} onChangeText={setExpiresInHours} placeholder="Expires in hours" />
          <Button onClick={handleIssue} disabled={issuing || scoringLinkNeedsMatch || publicScoreViewNeedsScoreboard || publicScoreViewNeedsTarget}>
            <Text className="text-white">{issuing ? 'Issuing...' : 'Issue Secure Link'}</Text>
          </Button>
        </HStack>
        {scoringLinkNeedsMatch ? (
          <Text className="text-sm text-amber-700">Scoring links require an active match. Start or assign a match before issuing this link.</Text>
        ) : null}
        {publicScoreViewNeedsScoreboard ? (
          <Text className="text-sm text-amber-700">Public score view links require a scoreboard target.</Text>
        ) : null}
        {publicScoreViewNeedsTarget ? (
          <Text className="text-sm text-amber-700">Public score view links require either a table or a team match target.</Text>
        ) : null}

        {lastIssuedURL ? (
          <VStack className="items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
            <img src={getQrImageURL(lastIssuedURL)} alt="Secure access QR code" className="h-60 w-60 rounded-xl border border-slate-200" />
            <Text className="break-all rounded bg-slate-100 px-3 py-2 font-mono text-sm">{lastIssuedURL}</Text>
          </VStack>
        ) : null}

        <VStack className="gap-3">
          {records.map((record) => (
            <Box key={record.tokenId} className="rounded-2xl border border-slate-200 bg-white p-4">
              <VStack className="gap-2">
                <Text className="font-semibold text-slate-900">{record.capabilityType}</Text>
                <Text className="text-xs text-slate-500">Created {new Date(record.createdAt).toLocaleString()}</Text>
                <Text className="text-xs text-slate-500">Expires {record.expiresAt ? new Date(record.expiresAt).toLocaleString() : 'never'}</Text>
                <Text className="text-xs text-slate-500">Revoked: {record.revokedAt ? 'yes' : 'no'}</Text>
                {!record.revokedAt ? (
                  <Button variant="outline" onClick={() => handleRevoke(record.tokenId)}>
                    <Text>Revoke Link</Text>
                  </Button>
                ) : null}
              </VStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  )
}
