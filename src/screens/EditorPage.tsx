// Editor Page - Scoreboard editor using GrapesJS
// Uses editor logic from src/editor/

import { useEffect, useRef } from 'react'
import { initializeGrapesJS } from '@/editor/initializeGrapesJS'
import 'grapesjs/dist/css/grapes.min.css'

export default function EditorPage() {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Get scoreboard ID from URL params
    const params = new URLSearchParams(window.location.search)
    const scoreboardID = params.get('sid')

    // Initialize GrapesJS editor
    initializeGrapesJS(scoreboardID)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Top Panel - for undo/redo/save buttons */}
      <div id="toppanel" style={{ height: '40px', background: '#eee', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', padding: '0 8px' }} />

      {/* Main Editor Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Blocks */}
        <div id="blocks-container" style={{ width: '220px', background: '#fff', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
          <div style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Blocks</div>
          <div id="blocks" />
        </div>

        {/* Main Canvas */}
        <div ref={editorRef} id="gjs2" style={{ flex: 1 }} />

        {/* Right Panel - Style Manager & Layers */}
        <div style={{ width: '280px', background: '#fff', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Layers */}
          <div style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid #ddd' }}>
            <div style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff' }}>Layers</div>
            <div id="layers-container" />
          </div>
          {/* Style Manager */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff' }}>Styles</div>
            <div id="style-manager-container" />
          </div>
        </div>
      </div>
    </div>
  )
}
