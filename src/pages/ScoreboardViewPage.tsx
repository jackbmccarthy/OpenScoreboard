// Scoreboard View Page - Live scoreboard overlay
// Uses scoreboard logic from src/scoreboard/

import { useEffect } from 'react';
import { runScoreboard, resetListeners } from '@/scoreboard';

export default function ScoreboardViewPage() {
  useEffect(() => {
    // Get params from URL
    const params = new URLSearchParams(window.location.search);
    const tableID = params.get('tid');
    const teamMatchID = params.get('tmid');
    const teamMatchTableNumber = params.get('table');
    const scoreboardID = params.get('sid');
    
    // Reset any existing listeners
    resetListeners();
    
    // Run the scoreboard
    runScoreboard(scoreboardID, tableID, teamMatchID, teamMatchTableNumber);
    
    return () => {
      // Cleanup listeners on unmount
      resetListeners();
    };
  }, []);

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
