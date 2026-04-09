// Player Registration Page
// Migrated from Expo PlayerRegistration.tsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Text, VStack, Button, Input, Spinner } from '@/components/ui';

export default function PlayerRegistrationPage() {
  const params = useParams<{ playerListID?: string; password?: string; id?: string }>();
  const playerListID = params.playerListID || params.id;
  const password = params.password;
  const [selectedColor, setSelectedColor] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [playerListExists, setPlayerListExists] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPlayerList() {
      let unSub: (() => void) | undefined
      try {
        const { getPlayerListName, watchForPlayerListPasswordChange } = await import('@/functions/players');
        
        // Watch for password changes
        if (playerListID) {
          unSub = watchForPlayerListPasswordChange(playerListID, (nextPassword: string) => {
            if (nextPassword && nextPassword !== password) {
              setUnauthorized(true);
            }
          });
          
          // Check if player list exists
          const playerList = await getPlayerListName(playerListID);
          if (playerList.length > 0) {
            setPlayerListExists(true);
          }
        }
      } catch (err) {
        console.error('Error checking player list:', err);
      } finally {
        setLoading(false);
      }

      return unSub
    }

    let cleanup: (() => void) | undefined
    checkPlayerList().then((unsubscribe) => {
      cleanup = unsubscribe
    })

    return () => {
      cleanup?.()
    }
  }, [password, playerListID]);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      return;
    }

    setLoadingPlayer(true);
    try {
      const { newImportedPlayer } = await import('@/classes/Player');
      const { addImportedPlayer } = await import('@/functions/players');

      const player = newImportedPlayer(
        firstName.trim(),
        lastName.trim(),
        '',
        selectedColor || 'US'
      );

      if (playerListID) {
        await addImportedPlayer(playerListID, player);
      }

      setShowSuccess(true);
      setFirstName('');
      setLastName('');
    } catch (err) {
      console.error('Error registering player:', err);
    } finally {
      setLoadingPlayer(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (unauthorized) {
    return (
      <Box className="flex items-center justify-center p-8">
        <VStack space="md" className="text-center">
          <Text className="text-2xl font-bold text-red-600">Unauthorized</Text>
          <Text className="text-gray-600">You are not authorized to access this registration.</Text>
        </VStack>
      </Box>
    );
  }

  if (!playerListExists) {
    return (
      <Box className="flex items-center justify-center p-8">
        <VStack space="md" className="text-center">
          <Text className="text-2xl font-bold">Player Registration</Text>
          <Text className="text-gray-600">Player list not found.</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <VStack space="lg">
        <VStack space="sm" className="text-center">
          <Text className="text-3xl font-bold text-center">Player Registration</Text>
          <Text className="text-gray-600 text-center">Register here to join the tournament</Text>
        </VStack>

        {showSuccess ? (
          <Box className="bg-green-50 border border-green-200 rounded-lg p-6">
            <VStack space="md" className="items-center">
              <Text className="text-xl font-bold text-green-600">Registration Successful!</Text>
              <Text className="text-gray-600 text-center">You have been registered.</Text>
              <Button onClick={() => setShowSuccess(false)}>
                <Text className="text-white">Register Another</Text>
              </Button>
            </VStack>
          </Box>
        ) : (
          <Box className="bg-white rounded-lg p-6 shadow-sm">
            <VStack space="md">
              <Box>
                <Text className="font-medium mb-2">First Name</Text>
                <Input
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </Box>

              <Box>
                <Text className="font-medium mb-2">Last Name</Text>
                <Input
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </Box>

              <Button
                onClick={handleRegister}
                disabled={loadingPlayer || !firstName.trim() || !lastName.trim()}
              >
                {loadingPlayer ? <Spinner /> : <Text className="text-white">Register</Text>}
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
