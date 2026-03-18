// VST Web — Root layout
// Phase 2: add ClerkProvider, Sentry, analytics

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voyage Smart Travel',
  description: 'Smart travel, built for everyone.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
