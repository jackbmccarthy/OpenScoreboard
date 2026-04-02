'use client'

import { useEffect, useRef } from 'react';

interface ScoreboardPageProps {
  params: { id: string };
}

export default function ScoreboardPage({ params }: ScoreboardPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import the vanilla JS scoreboard module
    import('../src/index').then((scoreboard) => {
      if (scoreboard.init) {
        scoreboard.init({
          container: containerRef.current!,
          matchId: params.id,
        });
      }
    });

    return () => {
      // Cleanup is handled by the vanilla JS module
    };
  }, [params.id]);

  return (
    <div 
      ref={containerRef} 
      id="scoreboard-container"
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
