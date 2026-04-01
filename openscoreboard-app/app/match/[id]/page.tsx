'use client'

import { Box, Text, VStack, HStack, Button, Heading, Card, CardBody, Pressable } from '@/components/ui'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

// Match scoring page - core scoring interface
// This is a simplified version of TableScoring.tsx from the React Native app

interface MatchState {
  id: string
  playerA: { name: string; score: number }
  playerB: { name: string; score: number }
  gameScores: { a: number; b: number }[]
  currentGame: number
  isMatchActive: boolean
}

export default function MatchScoringPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  
  const [match, setMatch] = useState<MatchState>({
    id: matchId,
    playerA: { name: 'Team A', score: 0 },
    playerB: { name: 'Team B', score: 0 },
    gameScores: [
      { a: 0, b: 0 },
      { a: 0, b: 0 },
      { a: 0, b: 0 },
    ],
    currentGame: 1,
    isMatchActive: false,
  })

  const addPoint = (side: 'A' | 'B') => {
    setMatch(prev => {
      const key = side === 'A' ? 'playerA' : 'playerB'
      const newScore = prev[key].score + 1
      
      // Check for game win (simplified - 11 points to win)
      if (newScore >= 11) {
        const newGameScores = [...prev.gameScores]
        newGameScores[prev.currentGame - 1] = {
          a: side === 'A' ? newScore : prev[key].score,
          b: side === 'B' ? newScore : prev[key].score,
        }
        
        return {
          ...prev,
          [key]: { ...prev[key], score: 0 },
          gameScores: newGameScores,
          currentGame: Math.min(prev.currentGame + 1, 3),
        }
      }
      
      return {
        ...prev,
        [key]: { ...prev[key], score: newScore },
      }
    })
  }

  const subtractPoint = (side: 'A' | 'B') => {
    setMatch(prev => {
      const key = side === 'A' ? 'playerA' : 'playerB'
      return {
        ...prev,
        [key]: { ...prev[key], score: Math.max(0, prev[key].score - 1) },
      }
    })
  }

  const startMatch = () => {
    setMatch(prev => ({ ...prev, isMatchActive: true }))
  }

  return (
    <Box className="flex-1 bg-white">
      {/* Header */}
      <Box className="bg-gradient-to-r from-black to-blue-600 p-4">
        <HStack className="justify-between items-center">
          <Button size="sm" variant="ghost" onPress={() => router.back()}>
            <Text className="text-white">← Back</Text>
          </Button>
          <Text className="text-white font-bold">Match #{matchId?.slice(0, 8) || 'new'}</Text>
          <Box className="w-16" />
        </HStack>
      </Box>

      {!match.isMatchActive ? (
        <VStack className="flex-1 justify-center p-8">
          <Heading size="lg" className="text-center mb-4">Ready to Score?</Heading>
          <Text className="text-center text-gray-500 mb-8">
            Tap start match to begin scoring
          </Text>
          <Button
            variant="solid"
            action="primary"
            size="lg"
            onPress={startMatch}
          >
            <Text className="text-white text-lg">Start Match</Text>
          </Button>
        </VStack>
      ) : (
        <VStack space="md" className="p-4">
          {/* Game Scores Summary */}
          <Card variant="elevated">
            <CardBody>
              <HStack className="justify-around">
                {match.gameScores.map((game, idx) => (
                  <VStack key={idx} className="items-center">
                    <Text className="text-xs text-gray-500">Game {idx + 1}</Text>
                    <HStack space="xs">
                      <Text className="font-bold">{game.a}</Text>
                      <Text className="text-gray-400">-</Text>
                      <Text className="font-bold">{game.b}</Text>
                    </HStack>
                  </VStack>
                ))}
              </HStack>
            </CardBody>
          </Card>

          {/* Current Game */}
          <Text className="text-center text-gray-500">Game {match.currentGame}</Text>

          {/* Scoring Sides */}
          <HStack className="justify-between items-stretch">
            {/* Team A */}
            <Pressable 
              className="flex-1 bg-blue-500 justify-center items-center m-1 rounded-lg active:bg-blue-600 min-h-[200px]"
              onPress={() => addPoint('A')}
            >
              <VStack className="items-center">
                <Text className="text-6xl font-bold text-white">{match.playerA.score}</Text>
                <Text className="text-white text-lg mt-2">{match.playerA.name}</Text>
              </VStack>
            </Pressable>

            {/* Team B */}
            <Pressable 
              className="flex-1 bg-red-500 justify-center items-center m-1 rounded-lg active:bg-red-600 min-h-[200px]"
              onPress={() => addPoint('B')}
            >
              <VStack className="items-center">
                <Text className="text-6xl font-bold text-white">{match.playerB.score}</Text>
                <Text className="text-white text-lg mt-2">{match.playerB.name}</Text>
              </VStack>
            </Pressable>
          </HStack>

          {/* Adjustment Buttons */}
          <HStack className="justify-around mt-4">
            <VStack className="items-center">
              <Button size="sm" variant="outline" action="negative" onPress={() => subtractPoint('A')}>
                <Text>-1 A</Text>
              </Button>
            </VStack>
            <VStack className="items-center">
              <Button size="sm" variant="outline" action="negative" onPress={() => subtractPoint('B')}>
                <Text>-1 B</Text>
              </Button>
            </VStack>
          </HStack>
        </VStack>
      )}
    </Box>
  )
}
