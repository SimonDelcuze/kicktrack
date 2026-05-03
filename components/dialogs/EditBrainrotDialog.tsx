'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditBrainrotForm } from '@/components/brainrot/EditBrainrotForm';
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
  const formKey = user?.id ?? 'none';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto bg-card/95 p-6 sm:max-w-5xl md:p-8">
        <DialogTitle className="sr-only">Edit brainrot</DialogTitle>
        <DialogDescription className="sr-only">
          Adjust level, mutation, or remove the entry.
        </DialogDescription>
        {user && (
          <EditBrainrotForm
            key={formKey}
            user={user}
            brainrots={brainrots}
            mutations={mutations}
            onComplete={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
