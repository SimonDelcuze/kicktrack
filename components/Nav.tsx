import Link from 'next/link';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';

export function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          KickTrack
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <SettingsDialog />
        </div>
      </div>
    </nav>
  );
}
