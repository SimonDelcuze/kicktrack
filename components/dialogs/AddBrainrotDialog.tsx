'use client';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (id: string) => void;
  disabled?: boolean;
};

export function AddBrainrotDialog({
  brainrots,
  mutations,
  open,
  onOpenChange,
  onAdded,
  disabled = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button disabled={disabled}>+ Add</Button>} />
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-6 sm:max-w-5xl md:p-8">
        <DialogTitle className="sr-only">Add brainrot</DialogTitle>
        <DialogDescription className="sr-only">
          Pick a brainrot and an optional mutation. Dialog stays open so you can chain adds.
        </DialogDescription>
        <AddBrainrotForm brainrots={brainrots} mutations={mutations} onAdded={onAdded} />
      </DialogContent>
    </Dialog>
  );
}
