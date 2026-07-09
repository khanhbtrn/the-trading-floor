import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/context/GameProvider';

export const metadata: Metadata = {
  title: 'The Trading Floor — 2008 Edition',
  description: 'Equity trading floor simulation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
