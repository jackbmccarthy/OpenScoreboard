// @ts-nocheck
// My Scoreboards Page
// Migrated from Expo MyScoreboards.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getUserPath } from '@/lib/database';
import { Box, Text, VStack, HStack, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

interface Scoreboard {
  id: string;
  name?: string;
  createdAt?: string;
}

export default function MyScoreboardsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [scoreboardList, setScoreboardList] = useState<[string, Scoreboard][]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [scoreboardLink, setScoreboardLink] = useState('');

  async function getScoreboards() {
    try {
      const { getMyScoreboards } = await import('@/functions/scoreboards');
      const userPath = getUserPath();
      const scoreboards = await getMyScoreboards(userPath);
      setScoreboardList(scoreboards || []);
    } catch (err) {
      console.error('Error loading scoreboards:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    getScoreboards();
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
          <Text className="text-2xl font-bold">My Scoreboards</Text>
          <Button onClick={() => setShowNewModal(true)}>
            <Text className="text-white">+ New</Text>
          </Button>
        </HStack>

        {scoreboardList.length > 0 ? (
          <VStack space="sm">
            {scoreboardList.map(([id, scoreboard]) => (
              <Box 
                key={id} 
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <VStack space="sm">
                  <Text className="font-bold">{scoreboard.name || 'Unnamed Scoreboard'}</Text>
                  {scoreboard.createdAt && (
                    <Text className="text-sm text-gray-500">
                      Created: {new Date(scoreboard.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                  <HStack space="sm" className="pt-2">
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/scoreboard/${id}`)}
                    >
                      <Text className="text-white text-sm">View</Text>
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/editor?sid=${id}`)}
                    >
                      <Text className="text-sm">Edit</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No scoreboards yet</Text>
              <Button onClick={() => setShowNewModal(true)}>
                <Text className="text-white">Create Your First Scoreboard</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* New Scoreboard Modal - placeholder */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
        <ModalHeader>New Scoreboard</ModalHeader>
        <ModalBody>
          <Text>Scoreboard creation form goes here...</Text>
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
