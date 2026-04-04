// @ts-nocheck
// Player Lists Page
// Migrated from Expo MyPlayerLists.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, HStack, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

interface PlayerList {
  id: string;
  name?: string;
  playerCount?: number;
}

export default function PlayerListsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [playerLists, setPlayerLists] = useState<[string, PlayerList][]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  async function loadPlayerLists() {
    try {
      const { getMyPlayerLists } = await import('@/functions/players');
      const lists = await getMyPlayerLists();
      setPlayerLists(lists || []);
    } catch (error) {
      console.error('Error loading player lists:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadPlayerLists();
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
          <Text className="text-2xl font-bold">Player Lists</Text>
          <Button onClick={() => setShowNewModal(true)}>
            <Text className="text-white">+ New List</Text>
          </Button>
        </HStack>

        {playerLists.length > 0 ? (
          <VStack space="sm">
            {playerLists.map(([id, list]) => (
              <Box 
                key={id} 
                className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/players/${id}`)}
              >
                <VStack space="sm">
                  <Text className="font-bold">{list.name || 'Unnamed List'}</Text>
                  {list.playerCount !== undefined && (
                    <Text className="text-sm text-gray-500">
                      {list.playerCount} player{list.playerCount !== 1 ? 's' : ''}
                    </Text>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No player lists</Text>
              <Button onClick={() => setShowNewModal(true)}>
                <Text className="text-white">Create First List</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* New Player List Modal - placeholder */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
        <ModalHeader>New Player List</ModalHeader>
        <ModalBody>
          <Text>Player list creation form goes here...</Text>
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
