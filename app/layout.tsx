import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'KickTrack',
  description: 'Personal Kick a Lucky Block base tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl p-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
