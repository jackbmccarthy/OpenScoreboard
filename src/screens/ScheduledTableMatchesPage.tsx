// @ts-nocheck
// Scheduled Table Matches Page
// Standalone view of scheduled matches

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, HStack, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

interface ScheduledMatch {
  id: string;
  player1Name?: string;
  player2Name?: string;
  startTime?: string;
  tableName?: string;
}

export default function ScheduledTableMatchesPage() {
  const params = useParams<{ tableID?: string }>();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<[string, ScheduledMatch][]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadScheduledMatches() {
    try {
      const { getScheduledTableMatches } = await import('@/functions/tables');
      const result = await getScheduledTableMatches(params.tableID || '');
      setMatches(result || []);
    } catch (err) {
      console.error('Error loading scheduled matches:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadScheduledMatches();
  }, [authLoading, params.tableID]);

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  // Sort by start time
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = new Date(a[1]?.startTime || 0).getTime();
    const dateB = new Date(b[1]?.startTime || 0).getTime();
    return dateB - dateA;
  });

  return (
    <Box className="p-4">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Text className="text-2xl font-bold">Scheduled Matches</Text>
          <Button onClick={() => setShowCreateModal(true)}>
            <Text className="text-white">+ New</Text>
          </Button>
        </HStack>

        {sortedMatches.length > 0 ? (
          <VStack space="sm">
            {sortedMatches.map(([id, match]) => (
              <Box key={id} className="border rounded-lg p-4 bg-white shadow-sm">
                <VStack space="sm">
                  <Text className="font-bold">
                    {match.player1Name || 'TBD'} vs {match.player2Name || 'TBD'}
                  </Text>
                  {match.startTime && (
                    <Text className="text-gray-600">
                      {new Date(match.startTime).toLocaleString()}
                    </Text>
                  )}
                  {match.tableName && (
                    <Text className="text-sm text-gray-500">Table: {match.tableName}</Text>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No scheduled matches</Text>
              <Button onClick={() => setShowCreateModal(true)}>
                <Text className="text-white">Create One</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalHeader>New Scheduled Match</ModalHeader>
        <ModalBody>
          <Text>Match scheduling form goes here...</Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowCreateModal(false)}>
            <Text className="text-white">Cancel</Text>
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
