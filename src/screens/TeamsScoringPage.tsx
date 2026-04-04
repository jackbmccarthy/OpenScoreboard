// @ts-nocheck
// Teams Scoring Page
// Team match scoring interface

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, HStack, Button, Spinner } from '@/components/ui';

export default function TeamsScoringPage() {
  const params = useParams<{ teamMatchID?: string; tableNumber?: string; id?: string }>();
  const teamMatchID = params.teamMatchID || params.id;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    // Team scoring would load match data here
    setLoading(false);
  }, [authLoading, teamMatchID]);

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <VStack space="lg">
        <Text className="text-2xl font-bold">Team Match Scoring</Text>
        
        <Box className="bg-white rounded-lg p-6 shadow-sm">
          <VStack space="md">
            <Text className="font-medium">Team Match ID: {teamMatchID || 'None'}</Text>
            <Text className="text-gray-600">Table Number: {params.tableNumber || 'None'}</Text>
          </VStack>
        </Box>

        <Text className="text-gray-500 text-center">
          Team scoring interface - connects to database for live scoring
        </Text>
      </VStack>
    </Box>
  );
}
