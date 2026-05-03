import Link from 'next/link';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';

export function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-serif text-xl italic leading-none tracking-tight text-foreground"
        >
          KickTrack<span className="text-primary">.</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:inline-flex">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
            live
          </span>
          <SettingsDialog />
        </div>
      </div>
    </nav>
  );
}
