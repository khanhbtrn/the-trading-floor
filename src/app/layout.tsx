import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/context/GameProvider';

export const metadata: Metadata = {
  title: 'Trading Floor',
  description: 'Narrative trading simulation',
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
