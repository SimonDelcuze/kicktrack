'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MAX_LEVEL, currentMoneyPerSec, compareMutationTier } from '@/shared/utils/calculations';
import { formatNumber } from '@/shared/utils/format';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

type Props = {
  trade: UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

// Mutations that have an established short form in community usage.
const MUTATION_SHORT: Record<string, string> = {
  electrified: 'Electro',
};

function formatMutationName(m: Mutation): string {
  return MUTATION_SHORT[m.name] ?? m.name.charAt(0).toUpperCase() + m.name.slice(1);
}

function buildExportText(
  trade: UserBrainrot[],
  brainrots: readonly Brainrot[],
  mutations: readonly Mutation[],
): string {
  const map = new Map<
    string,
    { brainrot: Brainrot; mutation: Mutation | null; count: number; income: number }
  >();

  for (const entry of trade) {
    const brainrot = brainrots.find((b) => b.id === entry.brainrot_id);
    if (!brainrot) continue;
    const mutation =
      entry.mutation_id != null
        ? mutations.find((m) => m.id === entry.mutation_id) ?? null
        : null;
    const key = `${entry.brainrot_id}:${entry.mutation_id ?? 'null'}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        brainrot,
        mutation,
        count: 1,
        income: currentMoneyPerSec(brainrot, MAX_LEVEL, mutation),
      });
    }
  }

  if (map.size === 0) return '```\n(empty)\n```';

  const rows = Array.from(map.values())
    .sort((a, b) => b.income - a.income || compareMutationTier(a.mutation, b.mutation))
    .map((g) => {
      const mutLabel = g.mutation ? `${formatMutationName(g.mutation)} ` : '';
      const left = `${g.count}x ${mutLabel}${g.brainrot.name}`;
      const right = formatNumber(g.income).toLowerCase();
      return { left, right };
    });

  const maxLeft = Math.max(...rows.map((r) => r.left.length));
  const body = rows.map((r) => `${r.left.padEnd(maxLeft)} | ${r.right}`).join('\n');

  return '```\n' + body + '\n```';
}

export function ExportDialog({ trade, brainrots, mutations }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  function handleOpen(next: boolean) {
    if (next) {
      const built = buildExportText(trade, brainrots, mutations);
      setText(built);
      // Copy synchronously in the user gesture chain for max browser compatibility.
      navigator.clipboard
        .writeText(built)
        .then(() => toast.success('Copied to clipboard.'))
        .catch(() => toast.error('Clipboard access denied. Copy manually.'));
    }
    setOpen(next);
  }

  function copyAgain() {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied.'))
      .catch(() => toast.error('Clipboard access denied.'));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={<Button variant="outline">Export</Button>} />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
        <DialogTitle>Export</DialogTitle>
        <DialogDescription className="sr-only">
          Discord-ready code block of the trade stash, sorted by max-level income.
          Auto-copied to clipboard.
        </DialogDescription>
        <pre className="mt-2 max-h-[60vh] overflow-auto rounded-md border border-border bg-card p-4 font-mono text-xs leading-relaxed">
          {text}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={copyAgain}>Copy</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
