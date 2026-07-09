import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/context/GameProvider';

export const metadata: Metadata = {
  title: 'The Trading Floor',
  description: 'Equity trading floor simulation with career progression',
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
