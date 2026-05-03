'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { importBaseAction, exportBaseAction } from '@/app/settings/actions';

export function ImportForm() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function handleExport() {
    start(async () => {
      const json = await exportBaseAction();
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
      const res = await importBaseAction(formData);
      setMessage(
        res.ok
          ? { kind: 'ok', text: 'Base imported successfully.' }
          : { kind: 'err', text: res.error ?? 'Unknown error' },
      );
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-3xl border border-border/60 bg-card/30 p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Export
        </div>
        <h2 className="mt-1 font-serif text-2xl italic">Download a snapshot</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pulls your current base as a JSON file. Stash it anywhere safe.
        </p>
        <div className="mt-6">
          <Button
            onClick={handleExport}
            disabled={pending}
            size="lg"
            variant="outline"
            className="font-mono uppercase tracking-[0.18em]"
          >
            Download JSON
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/30 p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Import
        </div>
        <h2 className="mt-1 font-serif text-2xl italic">Restore from a file</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Replaces your current base entirely. Make sure to export first if you want to keep what&apos;s there.
        </p>
        <form action={handleImport} className="mt-6 space-y-4">
          <Input
            type="file"
            name="file"
            accept="application/json"
            required
            className="cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-3 file:py-1 file:font-mono file:text-[11px] file:uppercase file:tracking-[0.18em] file:text-background"
          />
          <Button
            type="submit"
            disabled={pending}
            size="lg"
            className="font-mono uppercase tracking-[0.18em]"
          >
            {pending ? 'Importing…' : 'Import'}
          </Button>
        </form>
        {message && (
          <p
            className={`mt-4 font-mono text-[11px] uppercase tracking-[0.18em] ${
              message.kind === 'ok' ? 'text-primary' : 'text-destructive'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>
    </div>
  );
}
