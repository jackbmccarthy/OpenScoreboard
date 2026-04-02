// Editor Page - Scoreboard editor using GrapesJS
// Migrated from app/editor/page.tsx
// This embeds the vanilla JS editor

import { useEffect, useRef } from 'react'

export default function EditorPage() {
  const editorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) return

    // Dynamically import GrapesJS and the initialization function
    Promise.all([
      import('grapesjs'),
      import('../../openscoreboard-editor/src/initializeGrapesJS')
    ]).then(([{ default: grapesjs }, { initializeGrapesJS }]) => {
      if (containerRef.current) {
        initializeGrapesJS(null)
      }
    }).catch(err => {
      console.error('Failed to load editor:', err)
    })

    return () => {
      // Cleanup handled by grapesjs destroy if needed
    }
  }, [])

  return (
    <div 
      ref={editorRef}
      className="editor-container"
      style={{ 
        display: 'flex', 
        height: '100vh',
        width: '100%'
      }}
    >
      {/* Left panel - Layers and Blocks */}
      <div 
        id="layers" 
        className="column" 
        style={{ flexBasis: 280, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}
      >
        <div id="layers-container" style={{ flex: 1, overflow: 'auto' }} />
        <div id="blocks" style={{ height: 200, overflow: 'auto', borderTop: '1px solid #333' }} />
      </div>

      {/* Main editor area */}
      <div 
        className="editor-clm" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div id="top-panel" style={{ height: 40, background: '#242A3B' }} />
        <div 
          id="gjs" 
          ref={containerRef}
          style={{ flex: 1, overflow: 'auto', background: '#fff' }} 
        />
      </div>

      {/* Right panel - Style Manager */}
      <div 
        id="style-manager" 
        style={{ 
          width: 280, 
          background: '#242A3B', 
          overflow: 'auto',
          borderLeft: '1px solid #333'
        }}
      >
        <div id="style-manager-container" style={{ height: '100%' }} />
      </div>
    </div>
  )
}
