'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditBrainrotForm } from '@/components/brainrot/EditBrainrotForm';
import { brainrotById } from '@/shared/data/brainrots';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserBrainrot | null;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function EditBrainrotDialog({
  open,
  onOpenChange,
  user,
  brainrots,
  mutations,
}: Props) {
  // Re-key the form on user change so internal state resets when switching entries.
  const formKey = user?.id ?? 'none';
  const brainrotName = user ? brainrotById(user.brainrot_id)?.name : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-8 sm:max-w-5xl md:p-10">
        <DialogTitle className="font-serif text-3xl italic md:text-4xl">
          {brainrotName ?? 'Edit'}
        </DialogTitle>
        <DialogDescription className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Adjust level, mutation, or remove the entry.
        </DialogDescription>
        <div className="mt-6">
          {user && (
            <EditBrainrotForm
              key={formKey}
              user={user}
              brainrots={brainrots}
              mutations={mutations}
              onComplete={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
