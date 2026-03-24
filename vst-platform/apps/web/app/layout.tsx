import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voyage Smart Travels — Business travel, controlled.',
  description:
    'Voyage Smart Travels enforces policy, reduces risk, and keeps your organisation in control — before, during, and after every journey.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
