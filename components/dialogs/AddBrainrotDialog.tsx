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
import type { Brainrot, Mutation, TradeLogEvent, UserBrainrot } from '@/shared/types';

type Section = 'base' | 'trade';

type Props = {
  slug: string;
  section: Section;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  currentEntries: readonly UserBrainrot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutatedBase?: (previousBase: UserBrainrot[]) => void;
  onMutatedTrade?: (previousTrade: UserBrainrot[], previousLog: TradeLogEvent[]) => void;
  onEnqueueTradeAdd?: (brainrot_id: number, mutation_id: number | null) => void;
  onEnqueueTradeRemove?: (brainrot_id: number, mutation_id: number | null) => void;
  onAddedToBase?: (id: string) => void;
  disabled?: boolean;
};

export function AddBrainrotDialog({
  slug,
  section,
  brainrots,
  mutations,
  currentEntries,
  open,
  onOpenChange,
  onMutatedBase,
  onMutatedTrade,
  onEnqueueTradeAdd,
  onEnqueueTradeRemove,
  onAddedToBase,
  disabled = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button disabled={disabled}>+ Add</Button>} />
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-6 sm:max-w-5xl md:p-8">
        <DialogTitle className="sr-only">Add brainrot</DialogTitle>
        <DialogDescription className="sr-only">
          Pick a brainrot and an optional mutation. Use the ± footer to add or remove.
        </DialogDescription>
        <AddBrainrotForm
          slug={slug}
          section={section}
          brainrots={brainrots}
          mutations={mutations}
          currentEntries={currentEntries}
          onMutatedBase={onMutatedBase}
          onMutatedTrade={onMutatedTrade}
          onEnqueueTradeAdd={onEnqueueTradeAdd}
          onEnqueueTradeRemove={onEnqueueTradeRemove}
          onAddedToBase={onAddedToBase}
        />
      </DialogContent>
    </Dialog>
  );
}
