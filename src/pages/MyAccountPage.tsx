// My Account Page
// Migrated from Expo MyAccount.tsx

import { useAuth, logOut } from '@/lib/auth';
import { isLocalDatabase } from '@/lib/firebase';
import { Box, Text, VStack, Button } from '@/components/ui';

export default function MyAccountPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Text>Loading...</Text>
      </Box>
    );
  }

  const handleSignOut = async () => {
    try {
      await logOut();
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box className="p-4">
      <VStack space="lg">
        <Text className="text-3xl font-bold">My Account</Text>

        {user && (
          <Box className="bg-white rounded-lg p-4 shadow-sm">
            <VStack space="sm">
              <Text className="text-gray-600">Email</Text>
              <Text className="font-medium">{user.email || 'No email'}</Text>
              {user.displayName && (
                <>
                  <Text className="text-gray-600 mt-2">Name</Text>
                  <Text className="font-medium">{user.displayName}</Text>
                </>
              )}
              {user.uid && (
                <>
                  <Text className="text-gray-600 mt-2">User ID</Text>
                  <Text className="font-mono text-sm">{user.uid}</Text>
                </>
              )}
            </VStack>
          </Box>
        )}

        <Box className="border-t pt-4">
          <Text className="text-xl font-bold mb-2">More Coming Soon</Text>
          <Text className="text-gray-600">
            Account settings and preferences will be available here.
          </Text>
        </Box>

        {!isLocalDatabase && (
          <Box className="pt-4">
            <Button 
              onClick={handleSignOut}
              action="negative"
            >
              <Text className="text-white">Log Out</Text>
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
