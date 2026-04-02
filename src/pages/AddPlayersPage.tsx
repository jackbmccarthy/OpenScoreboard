// Add Players Page
// Migrated from Expo AddPlayers.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, HStack, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Input } from '@/components/ui';

interface Player {
  id: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  country?: string;
}

export default function AddPlayersPage() {
  const params = useParams<{ playerListID?: string }>();
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<[string, Player][]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  async function loadPlayers() {
    if (!params.playerListID) {
      setLoading(false);
      return;
    }

    try {
      const { getImportPlayerList, sortPlayers } = await import('@/functions/players');
      let playerValues = await getImportPlayerList(params.playerListID);
      if (playerValues.length > 0) {
        playerValues = sortPlayers(playerValues);
      }
      setPlayers(playerValues || []);
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadPlayers();
  }, [authLoading, params.playerListID]);

  const handleAddPlayer = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !params.playerListID) return;

    try {
      const { newImportedPlayer } = await import('@/classes/Player');
      const { addImportedPlayer } = await import('@/functions/players');

      const player = newImportedPlayer(newFirstName.trim(), newLastName.trim(), '', 'US');
      await addImportedPlayer(params.playerListID, player);

      setNewFirstName('');
      setNewLastName('');
      setShowAddModal(false);
      loadPlayers();
    } catch (err) {
      console.error('Error adding player:', err);
    }
  };

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
          <Text className="text-2xl font-bold">Players</Text>
          <Button onClick={() => setShowAddModal(true)}>
            <Text className="text-white">+ Add</Text>
          </Button>
        </HStack>

        {players.length > 0 ? (
          <VStack space="sm">
            {players.map(([id, player]) => (
              <Box key={id} className="border rounded-lg p-4 bg-white shadow-sm">
                <HStack className="justify-between items-center">
                  <VStack className="flex-1">
                    <Text className="font-medium">
                      {player.firstName} {player.lastName}
                    </Text>
                    {player.country && (
                      <Text className="text-sm text-gray-500">
                        Country: {player.country}
                      </Text>
                    )}
                  </VStack>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      // TODO: Implement edit
                    }}
                  >
                    <Text>Edit</Text>
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No players in this list</Text>
              <Button onClick={() => setShowAddModal(true)}>
                <Text className="text-white">Create First Player</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Add Player Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <ModalHeader>Add New Player</ModalHeader>
        <ModalBody>
          <VStack space="md">
            <Box>
              <Text className="font-medium mb-2">First Name</Text>
              <Input
                placeholder="First name"
                value={newFirstName}
                onChangeText={setNewFirstName}
              />
            </Box>
            <Box>
              <Text className="font-medium mb-2">Last Name</Text>
              <Input
                placeholder="Last name"
                value={newLastName}
                onChangeText={setNewLastName}
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowAddModal(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button onClick={handleAddPlayer}>
            <Text className="text-white">Add Player</Text>
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
