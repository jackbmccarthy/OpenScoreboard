// Scoreboard View Page - Live scoreboard overlay
// Uses extracted scoreboard logic from openscoreboard-scoreboard

import { useEffect, useRef } from 'react';

export default function ScoreboardViewPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initScoreboard = async () => {
      const { runScoreboard } = await import('@/scoreboard/index');
      const params = new URLSearchParams(window.location.search);
      const tableID = params.get('tid');
      const teamMatchID = params.get('tmid');
      const teamMatchTableNumber = params.get('table');
      const scoreboardID = params.get('sid');
      
      runScoreboard(scoreboardID, tableID, teamMatchID, teamMatchTableNumber);
    };

    initScoreboard();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      id="gjs"
      style={{ 
        width: '100%',
        height: '100vh'
      }}
    />
  );
}
