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
  disabled?: boolean;
};

export function AddBrainrotDialog({ brainrots, mutations, disabled = false }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="lg"
            disabled={disabled}
            className="font-mono uppercase tracking-[0.18em]"
          >
            + Add
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto bg-card/95 p-6 sm:max-w-5xl md:p-8">
        <DialogTitle className="sr-only">Add brainrot</DialogTitle>
        <DialogDescription className="sr-only">
          Pick a brainrot and an optional mutation.
        </DialogDescription>
        <AddBrainrotForm
          brainrots={brainrots}
          mutations={mutations}
          onComplete={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
