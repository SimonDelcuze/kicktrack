import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Nav } from '@/components/Nav';
import { HistoryProvider } from '@/components/HistoryProvider';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KickTrack',
  description: 'Personal Kick a Lucky Block base tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <HistoryProvider>
          <Nav />
          <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">{children}</main>
          <Toaster />
        </HistoryProvider>
      </body>
    </html>
  );
}
