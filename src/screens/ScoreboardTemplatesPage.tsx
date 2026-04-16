import { useEffect, useState } from 'react'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Text, VStack, Badge } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import LiveStatusAlert from '@/components/realtime/LiveStatusAlert'
import OperationToast from '@/components/realtime/OperationToast'
import {
  addScoreboardTemplate,
  createScoreboardFromTemplate,
  deleteScoreboardTemplate,
  duplicateScoreboardTemplate,
  subscribeToScoreboardTemplates,
  toggleScoreboardTemplateActive,
  updateScoreboardTemplate,
} from '@/functions/scoreboardTemplates'
import ScoreboardPreview from '@/components/scoreboards/ScoreboardPreview'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OwnershipDeleteImpact from '@/components/crud/OwnershipDeleteImpact'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { useOwnershipDeleteReport } from '@/components/crud/useOwnershipDeleteReport'
import { subscribeToPathState } from '@/lib/realtime'
import type { LiveSyncStatus } from '@/lib/liveSync'
import { useOperationFeedback } from '@/lib/useOperationFeedback'
import LabeledField from '@/components/forms/LabeledField'

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
  createdBy?: string
  isBuiltIn?: boolean
  isActive?: boolean
}

export default function ScoreboardTemplatesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [templates, setTemplates] = useState<ScoreboardTemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<LiveSyncStatus>('loading')
  const [syncError, setSyncError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ScoreboardTemplateRecord | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ScoreboardTemplateRecord | null>(null)
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<ScoreboardTemplateRecord | null>(null)
  const [scoreboardName, setScoreboardName] = useState('')
  const [templateDraft, setTemplateDraft] = useState({
    name: '',
    description: '',
    category: 'General',
    type: 'liveStream',
  })
  const feedback = useOperationFeedback()
  const deleteTemplateReport = useOwnershipDeleteReport(
    pendingDeleteTemplate?.id || '',
    pendingDeleteTemplate ? () => deleteScoreboardTemplate(pendingDeleteTemplate.id, { dryRun: true }) : null,
  )

  useEffect(() => {
    const unsubscribeState = subscribeToPathState('scoreboardTemplates', (state) => {
      setSyncStatus(state.status)
      setSyncError(state.error)
    })
    const unsubscribeTemplates = subscribeToScoreboardTemplates((loadedTemplates) => {
      setTemplates(
        loadedTemplates.map((template) => ({
          id: String(template.id || ''),
          name: String(template.name || 'Untitled Template'),
          description: typeof template.description === 'string' ? template.description : '',
          category: typeof template.category === 'string' ? template.category : '',
          type: typeof template.type === 'string' ? template.type : 'liveStream',
          web: template.web || {},
          config: template.config || {},
          createdBy: typeof template.createdBy === 'string' ? template.createdBy : '',
          isBuiltIn: Boolean(template.isBuiltIn),
          isActive: template.isActive !== false,
        })),
      )
      setLoading(false)
    })

    return () => {
      unsubscribeState()
      unsubscribeTemplates()
    }
  }, [])

  const classifyTemplate = (template: ScoreboardTemplateRecord) => {
    if (template.isBuiltIn) return 'Built-in'
    if (template.createdBy && user?.uid && template.createdBy === user.uid) return 'Personal'
    return 'Shared'
  }

  const canEditTemplate = (template: ScoreboardTemplateRecord) => !template.isBuiltIn && Boolean(user?.uid && template.createdBy === user.uid)

  const handleUseTemplate = async () => {
    if (!selectedTemplate || !scoreboardName.trim()) return
    const newScoreboardID = await createScoreboardFromTemplate(scoreboardName.trim(), selectedTemplate)
    navigate(`/editor?sid=${newScoreboardID}`)
  }

  const handleSaveTemplate = async () => {
    if (!templateDraft.name.trim()) return
    if (editingTemplate) {
      await updateScoreboardTemplate(editingTemplate.id, {
        ...editingTemplate,
        ...templateDraft,
      })
      feedback.showSuccess('Template updated.')
    } else {
      await addScoreboardTemplate({
        ...templateDraft,
        createdBy: user?.uid || 'mylocalserver',
      })
      feedback.showSuccess('Template created.')
    }
    setEditingTemplate(null)
    setTemplateDraft({
      name: '',
      description: '',
      category: 'General',
      type: 'liveStream',
    })
  }

  const handleDeleteTemplate = async () => {
    if (!pendingDeleteTemplate || deleteTemplateReport.loading || deleteTemplateReport.error) {
      return
    }

    await deleteScoreboardTemplate(pendingDeleteTemplate.id)
    feedback.showSuccess('Template archived.')
    setPendingDeleteTemplate(null)
  }

  return (
    <Box className="p-4">
      <VStack className="gap-6">
        <HStack className="items-center justify-between">
          <VStack className="gap-1">
            <Heading size="lg">Scoreboard Templates</Heading>
            <Text className="text-sm text-slate-500">Browse reusable scoreboard layouts, preview them, and start a new scoreboard from a template.</Text>
          </VStack>
          <HStack className="gap-2">
            <Button variant="outline" onClick={() => navigate('/scoreboards')}>
              <Text>Back to My Scoreboards</Text>
            </Button>
            <Button
              action="primary"
              onClick={() => {
                setEditingTemplate(null)
                setTemplateDraft({
                  name: 'New Personal Template',
                  description: '',
                  category: 'General',
                  type: 'liveStream',
                })
              }}
            >
              <Text className="text-white">New Personal Template</Text>
            </Button>
          </HStack>
        </HStack>

        <LiveStatusAlert status={syncStatus} error={syncError} />

        {loading ? (
          <Text>Loading templates...</Text>
        ) : (
          <Box className="grid gap-4 lg:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardBody>
                  <VStack className="gap-4">
                    <ScoreboardPreview web={template.web} className="h-52" emptyLabel="Template preview unavailable" />
                    <VStack className="gap-1">
                      <Text className="font-semibold text-slate-900">{template.name}</Text>
                      <Text className="text-sm text-slate-500">{template.description || 'Reusable scoreboard layout'}</Text>
                      <HStack className="flex-wrap gap-2">
                        <Text className="text-xs uppercase tracking-[0.16em] text-slate-400">{template.category || 'Template'}</Text>
                        <Badge className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">{classifyTemplate(template)}</Badge>
                        {!template.isActive ? <Badge className="rounded-full bg-amber-100 px-2 py-1 text-[11px] text-amber-800">Unpublished</Badge> : null}
                      </HStack>
                    </VStack>
                    <HStack className="flex-wrap gap-2">
                      <Button action="primary" onClick={() => {
                        setSelectedTemplate(template)
                        setScoreboardName(template.name)
                      }}>
                        <Text className="text-white">Use Template</Text>
                      </Button>
                      <Button variant="outline" onClick={async () => {
                        await duplicateScoreboardTemplate(template.id, user?.uid || 'mylocalserver')
                        feedback.showSuccess('Template duplicated.')
                      }} disabled={template.isBuiltIn}>
                        <Text>Duplicate</Text>
                      </Button>
                      {canEditTemplate(template) ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(template)
                            setTemplateDraft({
                              name: template.name,
                              description: template.description || '',
                              category: template.category || 'General',
                              type: template.type || 'liveStream',
                            })
                          }}
                        >
                          <Text>Edit</Text>
                        </Button>
                      ) : null}
                      {canEditTemplate(template) ? (
                        <Button variant="outline" onClick={async () => {
                          await toggleScoreboardTemplateActive(template.id, !template.isActive)
                          feedback.showSuccess(template.isActive ? 'Template unpublished.' : 'Template published.')
                        }}>
                          <Text>{template.isActive ? 'Unpublish' : 'Publish'}</Text>
                        </Button>
                      ) : null}
                      {canEditTemplate(template) ? (
                        <Button variant="outline" onClick={() => setPendingDeleteTemplate(template)}>
                          <Text>Archive</Text>
                        </Button>
                      ) : null}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Box>
        )}
      </VStack>

      <OverlayDialog
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={`Create From ${selectedTemplate?.name || 'Template'}`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleUseTemplate}>
              <Text className="text-white">Create Scoreboard</Text>
            </Button>
          </>
        )}
      >
        <LabeledField label="Scoreboard Name">
          <Input value={scoreboardName} onChangeText={setScoreboardName} placeholder="Scoreboard name" />
        </LabeledField>
      </OverlayDialog>

      <OverlayDialog
        isOpen={!!editingTemplate || templateDraft.name.length > 0}
        onClose={() => {
          setEditingTemplate(null)
          setTemplateDraft({ name: '', description: '', category: 'General', type: 'liveStream' })
        }}
        title={editingTemplate ? 'Edit Template' : 'New Personal Template'}
        footer={(
          <>
            <Button variant="outline" onClick={() => {
              setEditingTemplate(null)
              setTemplateDraft({ name: '', description: '', category: 'General', type: 'liveStream' })
            }}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveTemplate}>
              <Text className="text-white">{editingTemplate ? 'Save Template' : 'Create Template'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <LabeledField label="Template Name">
            <Input value={templateDraft.name} onChangeText={(value) => setTemplateDraft((current) => ({ ...current, name: value }))} placeholder="Template name" />
          </LabeledField>
          <LabeledField label="Description">
            <Input value={templateDraft.description} onChangeText={(value) => setTemplateDraft((current) => ({ ...current, description: value }))} placeholder="Description" />
          </LabeledField>
          <LabeledField label="Category">
            <Input value={templateDraft.category} onChangeText={(value) => setTemplateDraft((current) => ({ ...current, category: value }))} placeholder="Category" />
          </LabeledField>
          <LabeledField label="Template Type">
            <Input value={templateDraft.type} onChangeText={(value) => setTemplateDraft((current) => ({ ...current, type: value }))} placeholder="Type" />
          </LabeledField>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteTemplate}
        onClose={() => setPendingDeleteTemplate(null)}
        onConfirm={handleDeleteTemplate}
        title="Archive Template"
        message={`Archive ${pendingDeleteTemplate?.name || 'this template'}?`}
        description="This will archive the template and clear any live scoreboard references to it before the archive is applied."
        confirmLabel="Archive"
        confirmDisabled={deleteTemplateReport.loading || Boolean(deleteTemplateReport.error)}
      >
        <OwnershipDeleteImpact
          report={deleteTemplateReport.report}
          loading={deleteTemplateReport.loading}
          error={deleteTemplateReport.error}
        />
      </ConfirmDialog>
      <OperationToast tone={feedback.tone} message={feedback.message} />
    </Box>
  )
}
