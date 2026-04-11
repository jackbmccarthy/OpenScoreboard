'use client'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Text, VStack } from '@/components/ui'
import { PlusIcon, PencilIcon, TrashIcon, TablesIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { getTournamentCardCapabilities } from '@/lib/tournamentPermissions'
import {
  addNewTournament,
  archiveTournament,
  deleteMyTournament,
  duplicateTournament,
  subscribeToMyTournaments,
  type TournamentPreview,
  type TournamentVisibility,
} from '@/functions/tournaments'
import LabeledField from '@/components/forms/LabeledField'

type TournamentDraft = {
  name: string
  shortCode: string
  venue: string
  timezone: string
  startDate: string
  endDate: string
  description: string
  visibility: TournamentVisibility
}

type TournamentEntry = [string, TournamentPreview]

const emptyTournamentDraft: TournamentDraft = {
  name: '',
  shortCode: '',
  venue: '',
  timezone: '',
  startDate: '',
  endDate: '',
  description: '',
  visibility: 'private',
}

export default function TournamentsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showTournamentModal, setShowTournamentModal] = useState(false)
  const [tournamentDraft, setTournamentDraft] = useState<TournamentDraft>(emptyTournamentDraft)
  const [pendingDeleteTournament, setPendingDeleteTournament] = useState<{ myTournamentID: string; name: string } | null>(null)

  useEffect(() => {
    if (authLoading) return
    return subscribeToMyTournaments((nextTournaments) => {
      setTournaments(nextTournaments)
      setLoading(false)
    }, user?.uid || 'mylocalserver')
  }, [authLoading, user])

  const handleCreateTournament = async () => {
    if (!tournamentDraft.name.trim()) return
    await addNewTournament({
      name: tournamentDraft.name.trim(),
      shortCode: tournamentDraft.shortCode.trim(),
      venue: tournamentDraft.venue.trim(),
      timezone: tournamentDraft.timezone.trim(),
      startDate: tournamentDraft.startDate,
      endDate: tournamentDraft.endDate,
      description: tournamentDraft.description.trim(),
      visibility: tournamentDraft.visibility,
    })
    setTournamentDraft(emptyTournamentDraft)
    setShowTournamentModal(false)
  }

  const handleDeleteTournament = async () => {
    if (!pendingDeleteTournament) return
    await deleteMyTournament(pendingDeleteTournament.myTournamentID)
    setPendingDeleteTournament(null)
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 items-center justify-center p-8">
        <Text>Loading tournaments...</Text>
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 items-center justify-center p-8">
        <VStack className="items-center gap-3">
          <Text className="text-slate-600">Please sign in to manage tournaments</Text>
          <Button onClick={() => navigate('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack className="p-4 gap-4">
        <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <VStack className="gap-1">
            <Heading size="lg">Tournaments</Heading>
            <Text className="text-sm text-slate-500">Manage tournament shells, events, brackets, and schedules without changing existing match IDs.</Text>
          </VStack>
          <Button action="primary" onClick={() => setShowTournamentModal(true)} className="w-full sm:w-auto">
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New Tournament</Text>
          </Button>
        </HStack>

        {tournaments.length === 0 ? (
          <Box className="p-8 text-center">
            <TablesIcon size={48} className="mx-auto mb-4 text-slate-300" />
            <Text className="text-slate-500">No tournaments yet</Text>
            <Text className="text-sm text-slate-400">Create your first tournament shell to organize rounds, brackets, and event schedules.</Text>
          </Box>
        ) : (
          <VStack className="gap-3">
            {tournaments.map(([myTournamentID, tournament]) => (
              <Card key={myTournamentID} variant="elevated">
                <CardBody>
                  {(() => {
                    const capabilities = getTournamentCardCapabilities(tournament.accessRole || 'owner')
                    return (
                  <HStack className="flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-start">
                    <Pressable className="flex-1" onPress={() => navigate(`/tournaments/${tournament.id}`)}>
                      <VStack className="gap-1">
                        <Text className="font-semibold text-slate-900">{tournament.name}</Text>
                        <Text className="text-xs text-slate-500">
                          {[tournament.shortCode, tournament.venue, tournament.timezone].filter(Boolean).join(' • ') || 'Draft tournament'}
                        </Text>
                        <HStack className="flex-wrap gap-2 text-xs text-slate-500">
                          <Text className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-[0.12em]">{tournament.status || 'draft'}</Text>
                          <Text className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-[0.12em]">{tournament.visibility || 'private'}</Text>
                          <Text className="rounded-full bg-blue-50 px-2 py-1 uppercase tracking-[0.12em] text-blue-700">{tournament.accessRole || 'owner'}</Text>
                        </HStack>
                      </VStack>
                    </Pressable>
                    <HStack className="flex-wrap gap-2">
                      {capabilities.canManage ? (
                        <Button size="sm" variant="outline" onClick={() => duplicateTournament(String(tournament.id || ''))} className="w-full sm:w-auto">
                          <Text>Duplicate</Text>
                        </Button>
                      ) : null}
                      {capabilities.canManage ? (
                        <Button size="sm" variant="outline" onClick={() => archiveTournament(String(tournament.id || ''))} className="w-full sm:w-auto">
                          <Text>Archive</Text>
                        </Button>
                      ) : null}
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2" onPress={() => navigate(`/tournaments/${tournament.id}`)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      {capabilities.canManage ? (
                        <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-rose-200 p-2" onPress={() => setPendingDeleteTournament({ myTournamentID, name: tournament.name })}>
                          <TrashIcon size={16} className="text-rose-500" />
                        </Pressable>
                      ) : null}
                    </HStack>
                  </HStack>
                    )
                  })()}
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>

      <OverlayDialog
        isOpen={showTournamentModal}
        onClose={() => setShowTournamentModal(false)}
        title="New Tournament"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowTournamentModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleCreateTournament}>
              <Text className="text-white">Create Tournament</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <LabeledField label="Tournament Name">
            <Input placeholder="Tournament name" value={tournamentDraft.name} onChangeText={(value) => setTournamentDraft((current) => ({ ...current, name: value }))} />
          </LabeledField>
          <LabeledField label="Short Code">
            <Input placeholder="Short code" value={tournamentDraft.shortCode} onChangeText={(value) => setTournamentDraft((current) => ({ ...current, shortCode: value }))} />
          </LabeledField>
          <LabeledField label="Venue">
            <Input placeholder="Venue" value={tournamentDraft.venue} onChangeText={(value) => setTournamentDraft((current) => ({ ...current, venue: value }))} />
          </LabeledField>
          <LabeledField label="Timezone">
            <Input placeholder="Timezone" value={tournamentDraft.timezone} onChangeText={(value) => setTournamentDraft((current) => ({ ...current, timezone: value }))} />
          </LabeledField>
          <LabeledField label="Start Date">
            <Input type="date" value={tournamentDraft.startDate} onChangeText={(value) => setTournamentDraft((current) => ({ ...current, startDate: value }))} />
          </LabeledField>
          <LabeledField label="End Date">
            <Input type="date" value={tournamentDraft.endDate} onChangeText={(value) => setTournamentDraft((current) => ({ ...current, endDate: value }))} />
          </LabeledField>
          <LabeledField label="Visibility">
            <Select value={tournamentDraft.visibility} onValueChange={(value) => setTournamentDraft((current) => ({ ...current, visibility: value as TournamentVisibility }))}>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </LabeledField>
          <LabeledField label="Description">
            <textarea
              className="min-h-[7rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={tournamentDraft.description}
              onChange={(event) => setTournamentDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Tournament description"
            />
          </LabeledField>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteTournament)}
        onClose={() => setPendingDeleteTournament(null)}
        onConfirm={handleDeleteTournament}
        title="Remove Tournament"
        message={`Remove ${pendingDeleteTournament?.name || 'this tournament'} from your visible tournament list?`}
        confirmLabel="Remove"
      />
    </Box>
  )
}
