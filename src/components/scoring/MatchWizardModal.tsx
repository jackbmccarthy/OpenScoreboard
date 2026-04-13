import { useEffect, useState } from 'react'
import { Badge, Box, Button, Heading, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { UserIcon } from '@/components/icons'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { JERSEY_COLORS } from '@/lib/colors'
import { getNewPlayer } from '@/classes/Player'

// Duplicate of ScoringStation.getReadableTextColor for standalone use
function getReadableTextColor(color?: string): string {
  if (!color) return '#FFFFFF'
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#000000' : '#FFFFFF'
}

interface WizardDraft {
  playerA: { firstName: string; lastName: string; jerseyColor: string; country: string }
  playerB: { firstName: string; lastName: string; jerseyColor: string; country: string }
  isDoubles: boolean
  bestOf: number
  pointsToWinGame: number
  changeServeEveryXPoints: number
  scoringType: string
  warmupDurationSeconds: number
  sportName: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (draft: WizardDraft) => void
  initialDraft?: WizardDraft
  isTeamMatch?: boolean
  sportName?: string
}

export default function MatchWizardModal({ isOpen, onClose, onSave, initialDraft, isTeamMatch, sportName }: Props) {
  const defaultDraft = (): WizardDraft => ({
    playerA: { firstName: '', lastName: '', jerseyColor: '#3B82F6', country: '' },
    playerB: { firstName: '', lastName: '', jerseyColor: '#EF4444', country: '' },
    isDoubles: false,
    bestOf: 5,
    pointsToWinGame: 11,
    changeServeEveryXPoints: 2,
    scoringType: 'normal',
    warmupDurationSeconds: 120,
    sportName: sportName || 'tableTennis',
  })

  const [wizardDraft, setWizardDraft] = useState<WizardDraft>(defaultDraft())
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      if (initialDraft) {
        setWizardDraft(initialDraft)
      } else {
        setWizardDraft(defaultDraft())
      }
      setErrors({})
    }
  }, [isOpen])

  const updatePlayerA = (patch: Partial<typeof wizardDraft.playerA>) => {
    setWizardDraft((d) => ({ ...d, playerA: { ...d.playerA, ...patch } }))
  }
  const updatePlayerB = (patch: Partial<typeof wizardDraft.playerB>) => {
    setWizardDraft((d) => ({ ...d, playerB: { ...d.playerB, ...patch } }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!wizardDraft.playerA.firstName.trim()) e.playerA = 'Side A first name is required'
    if (!wizardDraft.playerB.firstName.trim()) e.playerB = 'Side B first name is required'
    if (wizardDraft.isDoubles && !wizardDraft.playerA.lastName.trim()) e.playerA2 = 'Side A last name required for doubles'
    if (wizardDraft.isDoubles && !wizardDraft.playerB.lastName.trim()) e.playerB2 = 'Side B last name required for doubles'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(wizardDraft)
  }

  const renderJerseyColorPicker = (
    selectedColor: string,
    onChange: (hex: string) => void,
    label: string
  ) => {
    const textColor = getReadableTextColor(selectedColor)
    return (
      <VStack className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</Text>
        <HStack className="flex-wrap gap-2">
          {JERSEY_COLORS.map((c) => {
            const isSelected = c.hex === selectedColor
            const tc = getReadableTextColor(c.hex)
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => onChange(c.hex)}
                className={`h-10 w-10 rounded-xl border-2 transition-all ${isSelected ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {isSelected ? (
                  <Text className="text-xs font-bold" style={{ color: tc }}>✓</Text>
                ) : null}
              </button>
            )
          })}
        </HStack>
        <HStack className="items-center gap-2">
          <Box className="h-6 w-6 rounded-lg border border-white/20" style={{ backgroundColor: selectedColor }} />
          <Text className="text-sm text-slate-400">{JERSEY_COLORS.find((c) => c.hex === selectedColor)?.name || selectedColor}</Text>
        </HStack>
      </VStack>
    )
  }

  const scoringTypes: Record<string, string> = {
    normal: 'Normal',
    rally: 'Rally',
  }

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Match Setup"
      description="Configure players, scoring format, and warm-up before starting."
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button action="primary" onClick={handleSave}>
            <Text className="text-white">Start Match</Text>
          </Button>
        </>
      )}
    >
      <VStack className="gap-6">
        {/* Side A */}
        <Box className="rounded-2xl border border-slate-200 p-4">
          <VStack className="gap-3">
            <HStack className="items-center justify-between">
              <Text className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Side A</Text>
              <Badge className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: wizardDraft.playerA.jerseyColor, color: getReadableTextColor(wizardDraft.playerA.jerseyColor) }}>
                Jersey
              </Badge>
            </HStack>
            <HStack className="gap-2">
              <VStack className="flex-1 gap-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">First Name *</Text>
                <Input
                  value={wizardDraft.playerA.firstName}
                  onChangeText={(v) => updatePlayerA({ firstName: v })}
                  placeholder="Player A"
                  className={errors.playerA ? 'border-red-400' : ''}
                />
                {errors.playerA ? <Text className="text-xs text-red-500">{errors.playerA}</Text> : null}
              </VStack>
              {wizardDraft.isDoubles && (
                <VStack className="flex-1 gap-1">
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Last Name *</Text>
                  <Input
                    value={wizardDraft.playerA.lastName}
                    onChangeText={(v) => updatePlayerA({ lastName: v })}
                    placeholder="Partner"
                    className={errors.playerA2 ? 'border-red-400' : ''}
                  />
                  {errors.playerA2 ? <Text className="text-xs text-red-500">{errors.playerA2}</Text> : null}
                </VStack>
              )}
            </HStack>
            {renderJerseyColorPicker(wizardDraft.playerA.jerseyColor, (c) => updatePlayerA({ jerseyColor: c }), 'Jersey Color')}
          </VStack>
        </Box>

        {/* Side B */}
        <Box className="rounded-2xl border border-slate-200 p-4">
          <VStack className="gap-3">
            <HStack className="items-center justify-between">
              <Text className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Side B</Text>
              <Badge className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: wizardDraft.playerB.jerseyColor, color: getReadableTextColor(wizardDraft.playerB.jerseyColor) }}>
                Jersey
              </Badge>
            </HStack>
            <HStack className="gap-2">
              <VStack className="flex-1 gap-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">First Name *</Text>
                <Input
                  value={wizardDraft.playerB.firstName}
                  onChangeText={(v) => updatePlayerB({ firstName: v })}
                  placeholder="Player B"
                  className={errors.playerB ? 'border-red-400' : ''}
                />
                {errors.playerB ? <Text className="text-xs text-red-500">{errors.playerB}</Text> : null}
              </VStack>
              {wizardDraft.isDoubles && (
                <VStack className="flex-1 gap-1">
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Last Name *</Text>
                  <Input
                    value={wizardDraft.playerB.lastName}
                    onChangeText={(v) => updatePlayerB({ lastName: v })}
                    placeholder="Partner"
                    className={errors.playerB2 ? 'border-red-400' : ''}
                  />
                  {errors.playerB2 ? <Text className="text-xs text-red-500">{errors.playerB2}</Text> : null}
                </VStack>
              )}
            </HStack>
            {renderJerseyColorPicker(wizardDraft.playerB.jerseyColor, (c) => updatePlayerB({ jerseyColor: c }), 'Jersey Color')}
          </VStack>
        </Box>

        {/* Match Type */}
        <VStack className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Match Type</Text>
          <HStack className="gap-2">
            <Button
              variant={!wizardDraft.isDoubles ? 'solid' : 'outline'}
              onClick={() => setWizardDraft((d) => ({ ...d, isDoubles: false }))}
              className="flex-1"
            >
              <Text className={!wizardDraft.isDoubles ? 'text-white' : ''}>Singles</Text>
            </Button>
            <Button
              variant={wizardDraft.isDoubles ? 'solid' : 'outline'}
              onClick={() => setWizardDraft((d) => ({ ...d, isDoubles: true }))}
              className="flex-1"
            >
              <Text className={wizardDraft.isDoubles ? 'text-white' : ''}>Doubles</Text>
            </Button>
          </HStack>
        </VStack>

        {/* Scoring Settings */}
        <VStack className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Scoring Format</Text>
          <HStack className="gap-3">
            <VStack className="flex-1 gap-1">
              <Text className="text-xs text-slate-500">Best of</Text>
              <Select
                value={String(wizardDraft.bestOf)}
                onValueChange={(v) => setWizardDraft((d) => ({ ...d, bestOf: Number(v) }))}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                {[1, 3, 5, 7, 9].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </VStack>
            <VStack className="flex-1 gap-1">
              <Text className="text-xs text-slate-500">Points to win</Text>
              <Select
                value={String(wizardDraft.pointsToWinGame)}
                onValueChange={(v) => setWizardDraft((d) => ({ ...d, pointsToWinGame: Number(v) }))}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                <option value={11}>11</option>
                <option value={15}>15</option>
                <option value={21}>21</option>
                <option value={9999}>No cap</option>
              </Select>
            </VStack>
            <VStack className="flex-1 gap-1">
              <Text className="text-xs text-slate-500">Serve every</Text>
              <Select
                value={String(wizardDraft.changeServeEveryXPoints)}
                onValueChange={(v) => setWizardDraft((d) => ({ ...d, changeServeEveryXPoints: Number(v) }))}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                <option value={1}>1 pt</option>
                <option value={2}>2 pts</option>
                <option value={5}>5 pts</option>
              </Select>
            </VStack>
          </HStack>
        </VStack>

        {/* Warm-up Timer */}
        <VStack className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Warm-up Duration</Text>
          <HStack className="items-center gap-3">
            <Input
              type="number"
              value={String(wizardDraft.warmupDurationSeconds)}
              onChangeText={(v) => setWizardDraft((d) => ({ ...d, warmupDurationSeconds: Math.max(0, Number(v) || 0) }))}
              className="w-24 bg-white"
              min={0}
            />
            <Text className="text-sm text-slate-500">seconds (0 to skip warm-up)</Text>
          </HStack>
        </VStack>
      </VStack>
    </OverlayDialog>
  )
}
