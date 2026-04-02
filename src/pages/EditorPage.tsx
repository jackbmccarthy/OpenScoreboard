// Editor Page - Scoreboard editor using GrapesJS
// Uses extracted editor logic from openscoreboard-editor

import { useEffect, useRef } from 'react';
import 'grapesjs/dist/css/grapes.min.css';

export default function EditorPage() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const initEditor = async () => {
      const { initializeGrapesJS } = await import('@/editor/initializeGrapesJS');
      const params = new URLSearchParams(window.location.search);
      const scoreboardID = params.get('sid');
      initializeGrapesJS(scoreboardID);
    };

    initEditor();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div 
      ref={editorRef}
      id="gjs2"
      style={{ 
        display: 'flex', 
        height: '100vh',
        width: '100%'
      }}
    />
  );
}
