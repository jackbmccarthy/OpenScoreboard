'use client'

import { useEffect, useRef } from 'react';

interface ScoreboardPageProps {
  params: { id: string };
}

export default function ScoreboardPage({ params }: ScoreboardPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Load the built scoreboard app in an iframe with the scoreboard ID
    const scoreboardUrl = `/scoreboard/dist/index.html?sid=${params.id}`;
    iframeRef.current.src = scoreboardUrl;

    return () => {
      // Cleanup if needed
    };
  }, [params.id]);

  return (
    <iframe 
      ref={iframeRef} 
      className="scoreboard-iframe"
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Scoreboard"
    />
  );
}
