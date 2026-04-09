import { useEffect, useState } from 'react'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Text, VStack } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { getScoreboardTemplates, createScoreboardFromTemplate } from '@/functions/scoreboardTemplates'
import ScoreboardPreview from '@/components/scoreboards/ScoreboardPreview'
import OverlayDialog from '@/components/crud/OverlayDialog'

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

export default function ScoreboardTemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<ScoreboardTemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ScoreboardTemplateRecord | null>(null)
  const [scoreboardName, setScoreboardName] = useState('')

  useEffect(() => {
    async function loadTemplates() {
      try {
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
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [])

  const handleUseTemplate = async () => {
    if (!selectedTemplate || !scoreboardName.trim()) return
    const newScoreboardID = await createScoreboardFromTemplate(scoreboardName.trim(), selectedTemplate)
    navigate(`/editor?sid=${newScoreboardID}`)
  }

  return (
    <Box className="p-4">
      <VStack className="gap-6">
        <HStack className="items-center justify-between">
          <VStack className="gap-1">
            <Heading size="lg">Scoreboard Templates</Heading>
            <Text className="text-sm text-slate-500">Browse reusable scoreboard layouts, preview them, and start a new scoreboard from a template.</Text>
          </VStack>
          <Button variant="outline" onClick={() => navigate('/scoreboards')}>
            <Text>Back to My Scoreboards</Text>
          </Button>
        </HStack>

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
                      <Text className="text-xs uppercase tracking-[0.16em] text-slate-400">{template.category || 'Template'}</Text>
                    </VStack>
                    <Button action="primary" onClick={() => {
                      setSelectedTemplate(template)
                      setScoreboardName(template.name)
                    }}>
                      <Text className="text-white">Use Template</Text>
                    </Button>
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
        <Input value={scoreboardName} onChangeText={setScoreboardName} placeholder="Scoreboard name" />
      </OverlayDialog>
    </Box>
  )
}
