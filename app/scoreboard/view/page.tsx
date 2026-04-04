'use client';

import { Suspense } from 'react';
import ScoreboardViewPage from '@/screens/ScoreboardViewPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScoreboardViewPage />
    </Suspense>
  );
}
