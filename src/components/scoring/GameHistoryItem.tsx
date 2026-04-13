import { MenuIcon, PencilIcon, TrashIcon } from '@/components/icons'
import { isValidGameScore } from '@/functions/scoring'
import { Box, Button, HStack, Input, Text, VStack } from '@/components/ui'
import { useEffect, useMemo, useState } from 'react'

interface GameHistoryItemProps {
  gameNumber: number
  scoreA: number
  scoreB: number
  pointsToWinGame: number
  disabled?: boolean
  onSave: (gameNumber: number, scoreA: number, scoreB: number) => void | Promise<void>
  onDelete: (gameNumber: number) => void | Promise<void>
}

export default function GameHistoryItem({
  gameNumber,
  scoreA,
  scoreB,
  pointsToWinGame,
  disabled = false,
  onSave,
  onDelete,
}: GameHistoryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draftScoreA, setDraftScoreA] = useState(String(scoreA))
  const [draftScoreB, setDraftScoreB] = useState(String(scoreB))

  useEffect(() => {
    setDraftScoreA(String(scoreA))
    setDraftScoreB(String(scoreB))
  }, [scoreA, scoreB])

  const isScoreValid = useMemo(() => {
    return isValidGameScore(true, Number(draftScoreA || 0), Number(draftScoreB || 0), pointsToWinGame)
  }, [draftScoreA, draftScoreB, pointsToWinGame])

  return (
    <Box className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <VStack className="gap-3">
        <HStack className="items-center justify-between gap-3">
          <VStack className="gap-0">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{`Game ${gameNumber}`}</Text>
            <Text className="text-lg font-semibold text-white">{`${scoreA} - ${scoreB}`}</Text>
          </VStack>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
            onClick={() => {
              setMenuOpen((current) => !current)
              setConfirmDelete(false)
            }}
            disabled={disabled}
          >
            <MenuIcon size={16} />
          </Button>
        </HStack>

        {menuOpen ? (
          <HStack className="flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {
                setIsEditing((current) => !current)
                setConfirmDelete(false)
              }}
              disabled={disabled}
            >
              <PencilIcon size={14} />
              <Text className="text-white">Edit Score</Text>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                await onDelete(gameNumber)
                setMenuOpen(false)
                setConfirmDelete(false)
              }}
              disabled={disabled}
            >
              <TrashIcon size={14} />
              <Text className="text-rose-100">{confirmDelete ? 'Confirm Delete' : 'Delete Game'}</Text>
            </Button>
          </HStack>
        ) : null}

        {isEditing ? (
          <VStack className="gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <HStack className="gap-2">
              <Input value={draftScoreA} onChangeText={setDraftScoreA} />
              <Input value={draftScoreB} onChangeText={setDraftScoreB} />
            </HStack>
            <Text className={`text-xs ${isScoreValid ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isScoreValid ? 'Valid finishing score' : 'Enter a valid completed-game score'}
            </Text>
            <HStack className="flex-wrap gap-2">
              <Button
                type="button"
                action="primary"
                onClick={async () => {
                  if (!isScoreValid) {
                    return
                  }
                  await onSave(gameNumber, Number(draftScoreA), Number(draftScoreB))
                  setIsEditing(false)
                  setMenuOpen(false)
                }}
                disabled={!isScoreValid || disabled}
              >
                <Text className="text-white">Save</Text>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftScoreA(String(scoreA))
                  setDraftScoreB(String(scoreB))
                  setIsEditing(false)
                }}
              >
                <Text>Cancel</Text>
              </Button>
            </HStack>
          </VStack>
        ) : null}
      </VStack>
    </Box>
  )
}
