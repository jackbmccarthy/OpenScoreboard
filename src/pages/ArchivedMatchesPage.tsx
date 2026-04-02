// Archived Matches Page
// Migrated from Expo ArchivedMatchList.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, Spinner } from '@/components/ui';

interface ArchivedMatch {
  id: string;
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  date?: string;
  winner?: string;
}

interface ArchivedMatchesPageProps {
  tableID?: string;
  teamMatchID?: string;
}

export default function ArchivedMatchesPage() {
  const params = useParams<ArchivedMatchesPageProps>();
  const { user, loading: authLoading } = useAuth();
  const [archivedMatches, setArchivedMatches] = useState<ArchivedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function loadArchivedMatches() {
      try {
        // Import from functions - same as original
        const { getArchivedMatchesForTable, getArchivedMatchesForTeamMatch } = await import('@/functions/scoring');
        
        let matches: ArchivedMatch[] = [];
        
        if (params.tableID) {
          matches = await getArchivedMatchesForTable(params.tableID);
        } else if (params.teamMatchID) {
          matches = await getArchivedMatchesForTeamMatch(params.teamMatchID);
        }
        
        setArchivedMatches(matches);
      } catch (error) {
        console.error('Error loading archived matches:', error);
      } finally {
        setLoading(false);
      }
    }

    loadArchivedMatches();
  }, [authLoading, params.tableID, params.teamMatchID]);

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <Text className="text-2xl font-bold mb-4">Archived Matches</Text>
      
      {archivedMatches.length > 0 ? (
        <VStack space="md">
          {archivedMatches.map((match) => (
            <Box key={match.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <VStack space="sm">
                <Text className="font-bold">
                  {match.player1Name || 'Player 1'} vs {match.player2Name || 'Player 2'}
                </Text>
                <Text className="text-gray-600">
                  Score: {match.player1Score || 0} - {match.player2Score || 0}
                </Text>
                {match.date && (
                  <Text className="text-sm text-gray-500">
                    {new Date(match.date).toLocaleDateString()}
                  </Text>
                )}
                {match.winner && (
                  <Text className="text-green-600 font-medium">
                    Winner: {match.winner}
                  </Text>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      ) : (
        <Box className="flex items-center justify-center py-12">
          <Text className="text-xl text-gray-500">No archived matches</Text>
        </Box>
      )}
    </Box>
  );
}
