// Editor Page - Scoreboard editor using GrapesJS
// Uses editor logic from src/editor/

import { useEffect, useRef } from 'react';
import { initializeGrapesJS } from '@/editor/initializeGrapesJS';
import 'grapesjs/dist/css/grapes.min.css';

export default function EditorPage() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Get scoreboard ID from URL params
    const params = new URLSearchParams(window.location.search);
    const scoreboardID = params.get('sid');

    // Initialize GrapesJS editor
    initializeGrapesJS(scoreboardID);
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
