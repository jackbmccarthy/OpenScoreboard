// @ts-nocheck
// Bulk Add Players Page
// Migrated from Expo BulkAddPlayers.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Box, Text, VStack, HStack, Button, Input, Spinner, Select } from '@/components/ui';
import jsonFlags from '@/flags/countries.json';

interface PlayerList {
  id: string;
  name?: string;
}

function validateCSV(csvString: string): string | true {
  const rows = csvString.split('\n');

  for (let i = 0; i < rows.length; i++) {
    const columns = rows[i].split(',');

    if (columns.length !== 4) {
      return `Error: Row ${i + 1} does not have exactly 4 columns.`;
    }

    if (columns[0].length > 60 || columns[1].length > 60) {
      return `Error: Row ${i + 1}, Column 1 or Column 2 has length greater than 60.`;
    }

    if (columns[2] !== '' && !isValidImageUrl(columns[2])) {
      return `Error: Row ${i + 1}, Column 3 should be either blank or a valid image URL.`;
    }

    const validValues = Object.keys(jsonFlags);
    if (!validValues.includes(columns[3].toUpperCase())) {
      return `Error: Row ${i + 1}, Column 4 does not have a valid value.`;
    }
  }

  return true;
}

function isValidImageUrl(url: string): boolean {
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  return url === '' || url.match(urlRegex) !== null;
}

export default function BulkPlayerPage() {
  const { user, loading: authLoading } = useAuth();
  const [csvValue, setCSVValue] = useState('');
  const [doneLoading, setDoneLoading] = useState(false);
  const [myPlayerLists, setMyPlayerLists] = useState<[string, PlayerList][]>([]);
  const [selectedPlayerListID, setSelectedPlayerListID] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadPlayerLists() {
    setDoneLoading(false);
    try {
      const { getMyPlayerLists } = await import('@/functions/players');
      const lists = await getMyPlayerLists();
      setMyPlayerLists(lists || []);
      if (lists && lists.length > 0) {
        setSelectedPlayerListID(lists[0][0]);
      }
    } catch (err) {
      console.error('Error loading player lists:', err);
    } finally {
      setDoneLoading(true);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadPlayerLists();
  }, [authLoading]);

  const handleImport = async () => {
    if (!selectedPlayerListID) {
      setError('Please select a player list first');
      return;
    }

    const validation = validateCSV(csvValue);
    if (validation !== true) {
      setError(validation);
      return;
    }

    setLoadingPlayers(true);
    setError(null);
    setSuccess(null);

    try {
      const rows = csvValue.split('\n');
      let imported = 0;

      for (const row of rows) {
        const columns = row.split(',');
        if (columns.length !== 4) continue;

        const [, lastName, firstName, imageUrl, country] = columns;

        const { newImportedPlayer } = await import('@/classes/Player');
        const { addImportedPlayer } = await import('@/functions/players');

        const player = newImportedPlayer(firstName.trim(), lastName.trim(), imageUrl.trim(), country.trim().toUpperCase());
        await addImportedPlayer(selectedPlayerListID, player);
        imported++;
      }

      setSuccess(`Successfully imported ${imported} players!`);
      setCSVValue('');
    } catch (err: any) {
      setError(`Error importing players: ${err.message}`);
    } finally {
      setLoadingPlayers(false);
    }
  };

  if (authLoading || !doneLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <Text className="text-2xl font-bold">Bulk Add Players</Text>

        <Box className="bg-white rounded-lg p-4 shadow-sm">
          <VStack space="md">
            <Text className="font-medium">Select Player List</Text>
            <Select
              value={selectedPlayerListID}
              onValueChange={setSelectedPlayerListID}
            >
              {myPlayerLists.map(([id, list]) => (
                <option key={id} value={id}>
                  {list.name || 'Unnamed List'}
                </option>
              ))}
            </Select>
          </VStack>
        </Box>

        <Box className="bg-white rounded-lg p-4 shadow-sm">
          <VStack space="md">
            <Text className="font-medium">CSV Format</Text>
            <Text className="text-sm text-gray-600">
              Format: LastName, FirstName, ImageURL (optional), CountryCode
            </Text>
            <Text className="text-sm text-gray-500">
              Example: Smith, John, https://example.com/photo.jpg, US
            </Text>
          </VStack>
        </Box>

        <Box className="bg-white rounded-lg p-4 shadow-sm">
          <VStack space="md">
            <Text className="font-medium">Paste CSV Data</Text>
            <textarea
              className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
              placeholder="LastName, FirstName, ImageURL, Country&#10;Smith, John, , US&#10;Doe, Jane, https://example.com/photo.jpg, UK"
              value={csvValue}
              onChange={(e) => setCSVValue(e.target.value)}
            />
          </VStack>
        </Box>

        {error && (
          <Box className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text className="text-red-600 text-sm">{error}</Text>
          </Box>
        )}

        {success && (
          <Box className="bg-green-50 border border-green-200 rounded-lg p-3">
            <Text className="text-green-600 text-sm">{success}</Text>
          </Box>
        )}

        <Button 
          onClick={handleImport}
          disabled={loadingPlayers || !csvValue.trim() || !selectedPlayerListID}
        >
          {loadingPlayers ? <Spinner /> : <Text className="text-white">Import Players</Text>}
        </Button>
      </VStack>
    </Box>
  );
}
