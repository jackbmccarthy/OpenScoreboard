// Scoreboard View Page - Live scoreboard overlay
// Loads pre-built scoreboard from public/scoreboard

import { useParams } from 'react-router-dom'

export default function ScoreboardViewPage() {
  const params = useParams<{ id?: string }>()
  
  // Append match ID as query param if needed
  const src = params.id 
    ? `/scoreboard/index.html?matchId=${params.id}`
    : '/scoreboard/index.html'

  return (
    <iframe
      src={src}
      title="Scoreboard"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none'
      }}
    />
  )
}
