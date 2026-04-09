import { useParams, useSearchParams } from 'react-router-dom'
import ScoringStation from '@/components/scoring/ScoringStation'

export default function TeamsScoringPage() {
  const params = useParams<{ teamMatchID?: string; tableNumber?: string; id?: string }>()
  const [searchParams] = useSearchParams()
  const teamMatchID = params.teamMatchID || params.id
  const tableNumber = params.tableNumber || searchParams.get('table') || '1'

  return <ScoringStation mode="teamMatch" teamMatchID={teamMatchID} teamMatchTableNumber={tableNumber} />
}
