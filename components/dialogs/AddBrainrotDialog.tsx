'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddBrainrotForm } from '@/components/brainrot/AddBrainrotForm';
import type { Brainrot, Mutation } from '@/shared/types';

type Props = {
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function AddBrainrotDialog({ brainrots, mutations }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg" className="font-mono uppercase tracking-[0.18em]">
            + Add brainrot
          </Button>
        }
      />
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-8 sm:max-w-5xl md:p-10">
        <DialogTitle className="font-serif text-3xl italic md:text-4xl">
          Add a brainrot
        </DialogTitle>
        <DialogDescription className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Pick the brainrot, optionally a mutation. Level starts at 1.
        </DialogDescription>
        <div className="mt-6">
          <AddBrainrotForm
            brainrots={brainrots}
            mutations={mutations}
            onComplete={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
