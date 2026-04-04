import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Open Scoreboard',
  description: 'Open Scoreboard is a software that allows users to create custom scoreboards and update them in realtime.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
