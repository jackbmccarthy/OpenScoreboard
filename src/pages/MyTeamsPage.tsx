// My Teams Page
// Migrated from Expo MyTeams.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, HStack, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

interface Team {
  id: string;
  name?: string;
  playerCount?: number;
}

export default function MyTeamsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<[string, Team][]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  async function loadTeams() {
    try {
      const { default: getMyTeams } = await import('@/functions/teams');
      const myTeams = await getMyTeams();
      setTeams(myTeams || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadTeams();
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
          <Text className="text-2xl font-bold">My Teams</Text>
          <Button onClick={() => setShowNewModal(true)}>
            <Text className="text-white">+ New</Text>
          </Button>
        </HStack>

        {teams.length > 0 ? (
          <VStack space="sm">
            {teams.map(([id, team]) => (
              <Box 
                key={id} 
                className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/teams/${id}`)}
              >
                <VStack space="sm">
                  <Text className="font-bold">{team.name || 'Unnamed Team'}</Text>
                  {team.playerCount !== undefined && (
                    <Text className="text-sm text-gray-500">
                      {team.playerCount} player{team.playerCount !== 1 ? 's' : ''}
                    </Text>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No teams yet</Text>
              <Button onClick={() => setShowNewModal(true)}>
                <Text className="text-white">Create Your First Team</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* New Team Modal - placeholder */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
        <ModalHeader>New Team</ModalHeader>
        <ModalBody>
          <Text>Team creation form goes here...</Text>
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
