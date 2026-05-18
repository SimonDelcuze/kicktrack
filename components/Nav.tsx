'use client';

import Link from 'next/link';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { useOptionalHistory } from '@/components/HistoryProvider';
import { useSlug } from '@/components/hooks/use-slug';
import { cn } from '@/lib/utils';

export function Nav() {
  const history = useOptionalHistory();
  const slug = useSlug();
  const hasSlug = slug !== null;

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          KickTrack
        </Link>

        {hasSlug && history && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={history.undo}
              disabled={!history.canUndo}
              aria-label="Undo (Ctrl+Z)"
              title="Undo (Ctrl+Z)"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md border border-border bg-card transition-colors',
                history.canUndo
                  ? 'text-foreground hover:bg-accent'
                  : 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              onClick={history.redo}
              disabled={!history.canRedo}
              aria-label="Redo (Ctrl+Y)"
              title="Redo (Ctrl+Y)"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md border border-border bg-card transition-colors',
                history.canRedo
                  ? 'text-foreground hover:bg-accent'
                  : 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              <RedoIcon />
            </button>
            <SettingsDialog slug={slug} />
          </div>
        )}
      </div>
    </nav>
  );
}

function UndoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h1" />
    </svg>
  );
}
