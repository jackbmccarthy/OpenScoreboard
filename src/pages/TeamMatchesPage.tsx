// Team Matches Page
// Migrated from Expo MyTeamMatches.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getUserPath } from '@/lib/database';
import { Box, Text, VStack, HStack, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

interface TeamMatch {
  id: string;
  homeTeamName?: string;
  awayTeamName?: string;
  date?: string;
  status?: string;
}

export default function TeamMatchesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [teamMatches, setTeamMatches] = useState<[string, TeamMatch][]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadTeamMatches() {
      try {
        const { default: getMyTeamMatches } = await import('@/functions/teammatches');
        const matches = await getMyTeamMatches();
        setTeamMatches(matches || []);
      } catch (error) {
        console.error('Error loading team matches:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeamMatches();
  }, [authLoading]);

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Text className="text-2xl font-bold">Team Matches</Text>
          <Button onClick={() => setShowNewModal(true)}>
            <Text className="text-white">+ New</Text>
          </Button>
        </HStack>

        {teamMatches.length > 0 ? (
          <VStack space="sm">
            {teamMatches.map(([id, match]) => (
              <Box 
                key={id} 
                className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/teamscoring/teammatch/${id}`)}
              >
                <VStack space="sm">
                  <HStack className="justify-between">
                    <Text className="font-bold">{match.homeTeamName || 'Home'}</Text>
                    <Text className="text-gray-400">vs</Text>
                    <Text className="font-bold">{match.awayTeamName || 'Away'}</Text>
                  </HStack>
                  {match.date && (
                    <Text className="text-sm text-gray-500">
                      {new Date(match.date).toLocaleDateString()}
                    </Text>
                  )}
                  {match.status && (
                    <Text className="text-sm text-blue-600">{match.status}</Text>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No team matches</Text>
              <Button onClick={() => setShowNewModal(true)}>
                <Text className="text-white">Create First Match</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* New Team Match Modal - placeholder */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
        <ModalHeader>New Team Match</ModalHeader>
        <ModalBody>
          <Text>Team match creation form goes here...</Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowNewModal(false)}>
            <Text className="text-white">Cancel</Text>
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
