import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Text, VStack } from '@/components/ui'
import { PencilIcon, PlusIcon, ScoreboardIcon, TrashIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { addNewScoreboard, deleteMyScoreboard, duplicateScoreboard, getMyScoreboards, getScoreboardTypesList, updateScoreboardDetails } from '@/functions/scoreboards'
import ScoreboardPreview from '@/components/scoreboards/ScoreboardPreview'
import { createScoreboardFromTemplate, getScoreboardTemplates } from '@/functions/scoreboardTemplates'

type ScoreboardDraft = {
  name: string
  type: string
}

type ScoreboardTypeOption = {
  id: string
  name: string
}

type ScoreboardTemplateRecord = {
  id: string
  name: string
  description?: string
  category?: string
  type?: string
  web?: {
    html?: string
    css?: string
    javascript?: string
  }
  config?: Record<string, unknown>
}

type ScoreboardRecord = {
  id: string
  name: string
  type?: string
  web?: {
    html?: string
    css?: string
    javascript?: string
  }
}

type ScoreboardEntry = [string, ScoreboardRecord]

const emptyScoreboardDraft = {
  name: '',
  type: 'liveStream',
} satisfies ScoreboardDraft

export default function ScoreboardsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [scoreboards, setScoreboards] = useState<ScoreboardEntry[]>([])
  const [scoreboardTypes, setScoreboardTypes] = useState<ScoreboardTypeOption[]>([])
  const [templates, setTemplates] = useState<ScoreboardTemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showScoreboardModal, setShowScoreboardModal] = useState(false)
  const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(false)
  const [editingScoreboard, setEditingScoreboard] = useState<{ myScoreboardID: string; scoreboardID: string } | null>(null)
  const [scoreboardDraft, setScoreboardDraft] = useState<ScoreboardDraft>(emptyScoreboardDraft)
  const [pendingDeleteScoreboard, setPendingDeleteScoreboard] = useState<{ myScoreboardID: string; name: string } | null>(null)
  const [previewScoreboard, setPreviewScoreboard] = useState<ScoreboardRecord | null>(null)
  const [creationMode, setCreationMode] = useState<'scratch' | 'duplicate' | 'template'>('scratch')
  const [selectedTemplateID, setSelectedTemplateID] = useState('')
  const [selectedDuplicateID, setSelectedDuplicateID] = useState('')

  const loadScoreboards = useCallback(async () => {
    try {
      const myScoreboards = await getMyScoreboards(user?.uid || 'mylocalserver')
      setScoreboards(myScoreboards as ScoreboardEntry[])
      setScoreboardTypes(getScoreboardTypesList() as ScoreboardTypeOption[])
      const loadedTemplates = await getScoreboardTemplates()
      setTemplates(
        loadedTemplates.map((template) => ({
          id: String(template.id || ''),
          name: String(template.name || 'Untitled Template'),
          description: typeof template.description === 'string' ? template.description : '',
          category: typeof template.category === 'string' ? template.category : '',
          type: typeof template.type === 'string' ? template.type : 'liveStream',
          web: template.web || {},
          config: template.config || {},
        })),
      )
    } catch (error) {
      console.error('Error loading scoreboards:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    loadScoreboards()
  }, [authLoading, loadScoreboards])

  const openNewScoreboardModal = () => {
    setEditingScoreboard(null)
    setScoreboardDraft(emptyScoreboardDraft)
    setSelectedTemplateID('')
    setSelectedDuplicateID('')
    setCreationMode('scratch')
    setShowCreateOptionsModal(true)
  }

  const openEditScoreboardModal = (myScoreboardID: string, scoreboard: ScoreboardRecord) => {
    setEditingScoreboard({ myScoreboardID, scoreboardID: scoreboard.id })
    setScoreboardDraft({
      name: scoreboard.name || '',
      type: scoreboard.type || 'liveStream',
    })
    setShowScoreboardModal(true)
  }

  const handleSaveScoreboard = async () => {
    if (!scoreboardDraft.name.trim()) return

    if (editingScoreboard) {
      await updateScoreboardDetails(
        editingScoreboard.scoreboardID,
        editingScoreboard.myScoreboardID,
        scoreboardDraft.name.trim(),
        scoreboardDraft.type
      )
    } else {
      if (creationMode === 'duplicate' && selectedDuplicateID) {
        const duplicatedID = await duplicateScoreboard(selectedDuplicateID, scoreboardDraft.name.trim())
        navigate(`/editor?sid=${duplicatedID}`)
      } else if (creationMode === 'template' && selectedTemplateID) {
        const template = templates.find((item) => item.id === selectedTemplateID)
        if (!template) {
          return
        }
        const createdID = await createScoreboardFromTemplate(scoreboardDraft.name.trim(), template)
        navigate(`/editor?sid=${createdID}`)
      } else {
        const createdID = await addNewScoreboard(scoreboardDraft.name.trim(), scoreboardDraft.type)
        navigate(`/editor?sid=${createdID}`)
      }
    }

    setShowScoreboardModal(false)
    setShowCreateOptionsModal(false)
    setEditingScoreboard(null)
    setScoreboardDraft(emptyScoreboardDraft)
    await loadScoreboards()
  }

  const handleDeleteScoreboard = async () => {
    if (!pendingDeleteScoreboard) return
    await deleteMyScoreboard(pendingDeleteScoreboard.myScoreboardID)
    setPendingDeleteScoreboard(null)
    await loadScoreboards()
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600">Please sign in to manage scoreboards</Text>
          <Button onClick={() => navigate('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <HStack className="justify-between items-center">
          <VStack className="gap-1">
            <Heading size="lg">My Scoreboards</Heading>
            <Text className="text-sm text-slate-500">Manage your scoreboards, previews, templates, and editor entrypoints from one page.</Text>
          </VStack>
          <Button size="sm" variant="solid" action="primary" onClick={openNewScoreboardModal}>
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New</Text>
          </Button>
        </HStack>

        <VStack className="gap-3">
          {scoreboards.length === 0 ? (
            <Box className="p-8 text-center">
              <ScoreboardIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No scoreboards yet</Text>
              <Text className="text-gray-400 text-sm">Create your first scoreboard</Text>
            </Box>
          ) : (
            scoreboards.map(([myScoreboardID, scoreboard]) => (
              <Card key={myScoreboardID} variant="elevated">
                <CardBody>
                  <HStack className="justify-between items-start gap-4">
                    <HStack className="flex-1 items-start gap-4">
                      <ScoreboardPreview web={scoreboard.web} className="h-28 w-48 flex-shrink-0" emptyLabel="Open in editor to generate preview" />
                      <VStack className="flex-1 gap-1">
                        <Text fontWeight="bold">{scoreboard.name}</Text>
                        <Text className="text-gray-500 text-sm">{scoreboard.type || 'Live Stream'}</Text>
                        <Text className="text-xs text-slate-400">Open in the editor to refine layout, then use table or team-match links to pair display with data.</Text>
                      </VStack>
                    </HStack>
                    <HStack className="items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/editor?sid=${scoreboard.id}`)}>
                        <Text>Editor</Text>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPreviewScoreboard(scoreboard)}>
                        <Text>Preview</Text>
                      </Button>
                      <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openEditScoreboardModal(myScoreboardID, scoreboard)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteScoreboard({ myScoreboardID, name: scoreboard.name })}>
                        <TrashIcon size={16} className="text-red-500" />
                      </Pressable>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))
          )}
        </VStack>
      </VStack>

      <OverlayDialog
        isOpen={showCreateOptionsModal}
        onClose={() => setShowCreateOptionsModal(false)}
        title="New Scoreboard"
        description="Choose how you want to create the next scoreboard."
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCreateOptionsModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={() => {
              setShowCreateOptionsModal(false)
              setShowScoreboardModal(true)
            }}>
              <Text className="text-white">Continue</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <Pressable className={`rounded-2xl border p-4 ${creationMode === 'template' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`} onPress={() => setCreationMode('template')}>
            <Text className="font-semibold text-slate-900">Use a template</Text>
            <Text className="text-sm text-slate-500">Browse reusable layouts and start from a managed template.</Text>
          </Pressable>
          <Pressable className={`rounded-2xl border p-4 ${creationMode === 'duplicate' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`} onPress={() => setCreationMode('duplicate')}>
            <Text className="font-semibold text-slate-900">Duplicate existing</Text>
            <Text className="text-sm text-slate-500">Clone one of your current scoreboards and edit from there.</Text>
          </Pressable>
          <Pressable className={`rounded-2xl border p-4 ${creationMode === 'scratch' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`} onPress={() => setCreationMode('scratch')}>
            <Text className="font-semibold text-slate-900">Start from scratch</Text>
            <Text className="text-sm text-slate-500">Create a blank scoreboard and build it in the editor.</Text>
          </Pressable>
          {creationMode === 'template' ? (
            <Button variant="outline" onClick={() => navigate('/scoreboards/templates')}>
              <Text>Browse Templates</Text>
            </Button>
          ) : null}
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showScoreboardModal}
        onClose={() => setShowScoreboardModal(false)}
        title={editingScoreboard ? 'Edit Scoreboard' : creationMode === 'duplicate' ? 'Duplicate Scoreboard' : creationMode === 'template' ? 'Create From Template' : 'Create Scoreboard'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowScoreboardModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveScoreboard}>
              <Text className="text-white">{editingScoreboard ? 'Save Changes' : 'Create Scoreboard'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <Input placeholder="Scoreboard name" value={scoreboardDraft.name} onChangeText={(value) => setScoreboardDraft((current) => ({ ...current, name: value }))} />
          <Select value={scoreboardDraft.type} onValueChange={(value) => setScoreboardDraft((current) => ({ ...current, type: value }))}>
            {scoreboardTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </Select>
          {!editingScoreboard && creationMode === 'duplicate' ? (
            <Select value={selectedDuplicateID} onValueChange={setSelectedDuplicateID}>
              <option value="">Select existing scoreboard</option>
              {scoreboards.map(([myScoreboardID, scoreboard]) => (
                <option key={myScoreboardID} value={scoreboard.id}>{scoreboard.name}</option>
              ))}
            </Select>
          ) : null}
          {!editingScoreboard && creationMode === 'template' ? (
            <Select value={selectedTemplateID} onValueChange={setSelectedTemplateID}>
              <option value="">Select template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </Select>
          ) : null}
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteScoreboard}
        onClose={() => setPendingDeleteScoreboard(null)}
        onConfirm={handleDeleteScoreboard}
        title="Remove Scoreboard"
        message={`Remove ${pendingDeleteScoreboard?.name || 'this scoreboard'} from your visible scoreboard list?`}
        confirmLabel="Remove"
      />

      <OverlayDialog
        isOpen={!!previewScoreboard}
        onClose={() => setPreviewScoreboard(null)}
        title={previewScoreboard?.name || 'Scoreboard Preview'}
        description="Preview the saved scoreboard display layer with dummy data."
        size="xl"
      >
        <ScoreboardPreview web={previewScoreboard?.web} className="h-[28rem]" emptyLabel="Open this scoreboard in the editor to generate preview markup." />
      </OverlayDialog>
    </Box>
  )
}
