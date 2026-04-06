// @ts-nocheck

import { useParams } from 'react-router-dom'
import ScoringStation from '@/components/scoring/ScoringStation'

export default function TableScoringPage() {
  const { id } = useParams<{ id: string }>()
  return <ScoringStation mode="table" tableID={id} />
}
