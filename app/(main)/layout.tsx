'use client';

import { Suspense } from 'react';
import TabsLayout from '@/components/TabsLayout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TabsLayout>{children}</TabsLayout>
    </Suspense>
  );
}
