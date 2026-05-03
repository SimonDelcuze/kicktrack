'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { importBaseAction, exportBaseAction } from '@/app/settings/actions';

export function ImportForm() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(res.ok ? 'Imported.' : `Error: ${res.error}`);
    });
  }

  return (
    <div className="grid gap-6 max-w-md">
      <section>
        <h2 className="font-semibold mb-2">Export</h2>
        <Button onClick={handleExport} disabled={pending}>Download base as JSON</Button>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Import</h2>
        <form action={handleImport} className="grid gap-3">
          <Input type="file" name="file" accept="application/json" required />
          <Button type="submit" disabled={pending}>Import (replaces current base)</Button>
        </form>
        {message && <p className="text-sm mt-2">{message}</p>}
      </section>
    </div>
  );
}
