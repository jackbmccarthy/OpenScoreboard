import { useState } from 'react'
import { Badge, Box, Button, Heading, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import OverlayDialog from '@/components/crud/OverlayDialog'

interface SettingsDraft {
  bestOf: number
  pointsToWinGame: number
  changeServeEveryXPoints: number
  isDoubles: boolean
  isAInitialServer: boolean
  isManualServiceMode: boolean
  scoringType: string
}

interface ManualGameScores {
  [gameNumber: number]: { a: string; b: string }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: SettingsDraft, updatedGames: { gameNumber: number; aScore: number; bScore: number; deleted?: boolean }[]) => void
  settings: SettingsDraft
  onSettingsChange: (patch: Partial<SettingsDraft>) => void
  manualGameScores: ManualGameScores
  onGameScoreChange: (gameNumber: number, side: 'a' | 'b', value: string) => void
  onDeleteGame: (gameNumber: number) => void
  supportedSports?: Record<string, { hasScoringTypes?: boolean; scoringTypes?: Record<string, { displayName: string }> }>
  sportName?: string
  isDoubles?: boolean
  activeAction?: string
  matchID?: string
}

export default function SettingsOverlay({
  isOpen,
  onClose,
  onSave,
  settings,
  onSettingsChange,
  manualGameScores,
  onGameScoreChange,
  onDeleteGame,
  supportedSports,
  sportName,
  isDoubles,
  activeAction,
}: Props) {
  const [deletingGame, setDeletingGame] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const handleSave = () => {
    const updatedGames = Object.entries(manualGameScores).map(([gn, scores]) => ({
      gameNumber: Number(gn),
      aScore: Number(scores.a || 0),
      bScore: Number(scores.b || 0),
    }))
    onSave(settings, updatedGames)
  }

  const scoringTypeOptions = Object.entries(
    (supportedSports?.[sportName || '']?.scoringTypes || {}) as Record<string, { displayName: string }>
  )

  const pointsOptions = sportName === 'pickleball'
    ? [11, 15, 21]
    : [11, 15, 21, 9999]

  const serveOptions = sportName === 'pickleball'
    ? [1, 2]
    : [1, 2, 5]

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Match Settings"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button action="primary" onClick={handleSave} disabled={activeAction === 'settings'}>
            {activeAction === 'settings' ? <Spinner size="sm" /> : null}
            <Text className="text-white">Save Settings</Text>
          </Button>
        </>
      )}
    >
      <VStack className="gap-5">
        {/* Scoring Format */}
        <VStack className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Scoring Format</Text>
          <HStack className="flex-wrap gap-3">
            <VStack className="gap-1">
              <Text className="text-xs text-slate-500">Best of</Text>
              <Select
                value={String(settings.bestOf)}
                onValueChange={(v) => onSettingsChange({ bestOf: Number(v) })}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                {[1, 3, 5, 7, 9].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </VStack>

            <VStack className="gap-1">
              <Text className="text-xs text-slate-500">Points to win</Text>
              <Select
                value={String(settings.pointsToWinGame)}
                onValueChange={(v) => onSettingsChange({ pointsToWinGame: Number(v) })}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                {pointsOptions.map((n) => (
                  <option key={n} value={n}>{n === 9999 ? 'No cap' : `${n} points`}</option>
                ))}
              </Select>
            </VStack>

            <VStack className="gap-1">
              <Text className="text-xs text-slate-500">Serve every</Text>
              <Select
                value={String(settings.changeServeEveryXPoints)}
                onValueChange={(v) => onSettingsChange({ changeServeEveryXPoints: Number(v) })}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                {serveOptions.map((n) => (
                  <option key={n} value={n}>{`${n} pt${n === 1 ? '' : 's'}`}</option>
                ))}
              </Select>
            </VStack>
          </HStack>
        </VStack>

        {/* Match Type */}
        <VStack className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Match Type</Text>
          <HStack className="gap-3">
            <VStack className="gap-1">
              <Text className="text-xs text-slate-500">Format</Text>
              <Select
                value={settings.isDoubles ? 'doubles' : 'singles'}
                onValueChange={(v) => onSettingsChange({ isDoubles: v === 'doubles' })}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
              </Select>
            </VStack>

            <VStack className="gap-1">
              <Text className="text-xs text-slate-500">Service mode</Text>
              <Select
                value={settings.isManualServiceMode ? 'manual' : 'auto'}
                onValueChange={(v) => onSettingsChange({ isManualServiceMode: v === 'manual' })}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                <option value="auto">Automatic</option>
                <option value="manual">Manual</option>
              </Select>
            </VStack>

            {scoringTypeOptions.length > 0 && (
              <VStack className="gap-1">
                <Text className="text-xs text-slate-500">Scoring type</Text>
                <Select
                  value={settings.scoringType}
                  onValueChange={(v) => onSettingsChange({ scoringType: v })}
                  className="min-h-[2.5rem] bg-white text-slate-900"
                >
                  {scoringTypeOptions.map(([key, config]) => (
                    <option key={key} value={key}>{config.displayName}</option>
                  ))}
                </Select>
              </VStack>
            )}

            <VStack className="gap-1">
              <Text className="text-xs text-slate-500">First server</Text>
              <Select
                value={settings.isAInitialServer ? 'A' : 'B'}
                onValueChange={(v) => onSettingsChange({ isAInitialServer: v === 'A' })}
                className="min-h-[2.5rem] bg-white text-slate-900"
              >
                <option value="A">Side A</option>
                <option value="B">Side B</option>
              </Select>
            </VStack>
          </HStack>
        </VStack>

        {/* Completed Game Scores */}
        <VStack className="gap-2">
          <HStack className="items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Completed Games</Text>
          </HStack>

          {Object.keys(manualGameScores).length === 0 ? (
            <Text className="text-sm text-slate-400">No completed games yet.</Text>
          ) : (
            <VStack className="gap-2">
              {Object.entries(manualGameScores)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([gameNumber, scores]) => {
                  const isValid = isValidGameScore(
                    true,
                    Number(scores.a || 0),
                    Number(scores.b || 0),
                    Number(settings.pointsToWinGame)
                  )
                  return (
                    <HStack key={gameNumber} className="items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
                      <Text className="w-16 text-sm font-bold text-slate-700">{`Game ${gameNumber}`}</Text>
                      <VStack className="flex-1 gap-1">
                        <HStack className="gap-2">
                          <Text className="w-6 text-xs text-slate-400">A</Text>
                          <Input
                            type="number"
                            value={scores.a}
                            onChangeText={(v) => onGameScoreChange(Number(gameNumber), 'a', v)}
                            className="flex-1"
                            min={0}
                          />
                          <Text className="text-slate-300">:</Text>
                          <Input
                            type="number"
                            value={scores.b}
                            onChangeText={(v) => onGameScoreChange(Number(gameNumber), 'b', v)}
                            className="flex-1"
                            min={0}
                          />
                          <Text className="w-6 text-xs text-slate-400">B</Text>
                        </HStack>
                        <Text className={`text-xs ${isValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isValid ? 'Valid' : 'Invalid score'}
                        </Text>
                      </VStack>
                      {confirmDelete === Number(gameNumber) ? (
                        <VStack className="gap-1">
                          <Text className="text-xs text-red-500">Confirm delete?</Text>
                          <HStack className="gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDelete(null)}
                            >
                              <Text className="text-xs">No</Text>
                            </Button>
                            <Button
                              size="sm"
                              action="primary"
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => {
                                onDeleteGame(Number(gameNumber))
                                setConfirmDelete(null)
                              }}
                              disabled={deletingGame === Number(gameNumber)}
                            >
                              <Text className="text-xs text-white">Yes</Text>
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDelete(Number(gameNumber))}
                          className="border-red-200 text-red-400 hover:bg-red-50"
                        >
                          <Text className="text-xs">Delete</Text>
                        </Button>
                      )}
                    </HStack>
                  )
                })}
            </VStack>
          )}
        </VStack>
      </VStack>
    </OverlayDialog>
  )
}

function isValidGameScore(
  _enforceGameScore: boolean,
  aScore: number,
  bScore: number,
  pointsToWinGame: number
): boolean {
  if (!Number.isFinite(aScore) || !Number.isFinite(bScore)) return false
  if (aScore < 0 || bScore < 0) return false
  const max = Math.max(aScore, bScore)
  if (max < pointsToWinGame) return false
  if (pointsToWinGame !== 9999 && max > pointsToWinGame) return false
  return true
}
