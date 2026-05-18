'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { importBaseAction, exportBaseAction } from '@/app/settings/actions';
import type { UserBrainrot } from '@/shared/types';

type Props = {
  slug: string;
  onMutated?: (previousBase: UserBrainrot[]) => void;
};

export function ImportForm({ slug, onMutated }: Props) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function handleExport() {
    start(async () => {
      const json = await exportBaseAction(slug);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kicktrack-base-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleImport(formData: FormData) {
    start(async () => {
      const res = await importBaseAction(slug, formData);
      if (res.ok) {
        onMutated?.(res.previousBase);
        setMessage({ kind: 'ok', text: 'Base imported successfully.' });
      } else {
        setMessage({ kind: 'err', text: res.error });
      }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Export</div>
        <p className="mt-1 text-xs text-muted-foreground">Download your current base as JSON.</p>
        <div className="mt-4">
          <Button onClick={handleExport} disabled={pending} variant="outline">
            Download JSON
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Import</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Replaces your current base entirely.
        </p>
        <form action={handleImport} className="mt-4 space-y-3">
          <Input
            type="file"
            name="file"
            accept="application/json"
            required
            className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-xs file:text-background"
          />
          <Button type="submit" disabled={pending}>
            {pending ? 'Importing…' : 'Import'}
          </Button>
        </form>
        {message && (
          <p
            className={`mt-3 text-xs ${
              message.kind === 'ok' ? 'text-foreground' : 'text-destructive'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>
    </div>
  );
}
