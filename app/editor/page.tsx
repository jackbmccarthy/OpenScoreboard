'use client'

import { useEffect, useRef } from 'react';

export default function EditorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Load the built GrapesJS editor app in an iframe
    iframeRef.current.src = '/editor/dist/index.html';

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <iframe 
      ref={iframeRef} 
      className="editor-iframe"
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Scoreboard Editor"
    />
  );
}
