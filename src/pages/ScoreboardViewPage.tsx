// Scoreboard View Page - renders a specific scoreboard by ID
// Migrated from app/scoreboard/[id]/page.tsx
// This embeds the vanilla JS scoreboard

import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

export default function ScoreboardViewPage() {
  const { id } = useParams<{ id: string }>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !id) return

    // Dynamically import the vanilla JS scoreboard module
    import('../../openscoreboard-scoreboard/src/index').then((scoreboard) => {
      if (scoreboard.init) {
        scoreboard.init({
          container: containerRef.current!,
          matchId: id,
        })
      }
    }).catch(err => {
      console.error('Failed to load scoreboard:', err)
    })

    return () => {
      // Cleanup is handled by the vanilla JS module
    }
  }, [id])

  return (
    <div 
      ref={containerRef} 
      id="scoreboard-container"
      style={{ width: '100%', height: '100vh' }}
    />
  )
}
