// Scoreboard View Page - Live scoreboard overlay
// Uses scoreboard logic from src/scoreboard/
// Shows 404 if required params (sid, tid, or tmid) are not provided

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { runScoreboard, resetListeners } from '@/scoreboard';
import { Box, Text, Heading } from '@/components/ui';

export default function ScoreboardViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get params from URL
    const tableID = searchParams.get('tid');
    const teamMatchID = searchParams.get('tmid');
    const teamMatchTableNumber = searchParams.get('table');
    const scoreboardID = searchParams.get('sid');

    // Check if required params are present
    // Either (sid + tid) or (sid + tmid) are required
    const hasTableParams = scoreboardID && tableID;
    const hasTeamMatchParams = scoreboardID && teamMatchID;

    if (!hasTableParams && !hasTeamMatchParams) {
      // Missing required params - will show 404 UI
      return;
    }

    // Reset any existing listeners
    resetListeners();

    // Run the scoreboard
    runScoreboard(scoreboardID, tableID, teamMatchID, teamMatchTableNumber);

    return () => {
      // Cleanup listeners on unmount
      resetListeners();
    };
  }, [searchParams]);

  // Check if required params are present
  const scoreboardID = searchParams.get('sid');
  const tableID = searchParams.get('tid');
  const teamMatchID = searchParams.get('tmid');
  const hasTableParams = scoreboardID && tableID;
  const hasTeamMatchParams = scoreboardID && teamMatchID;

  // Show 404 if missing required params
  if (!hasTableParams && !hasTeamMatchParams) {
    return (
      <Box className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Box className="text-center">
          <Heading size="4xl" className="text-white font-bold mb-2">404</Heading>
          <Text className="text-gray-400 text-lg mb-4">Scoreboard Not Found</Text>
          <Text className="text-gray-500 mb-6">
            Missing required parameters.
            <br />
            URL should include ?sid=... and either ?tid=... or ?tmid=...
          </Text>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </Box>
      </Box>
    );
  }

  return (
    <div 
      id="gjs"
      style={{ 
        width: '100%',
        height: '100vh'
      }}
    />
  );
}
