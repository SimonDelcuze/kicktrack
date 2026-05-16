'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BaseSection } from '@/components/sections/BaseSection';
import { TradeSection } from '@/components/sections/TradeSection';
import type { Brainrot, Mutation, TradeLogEvent, UserBrainrot } from '@/shared/types';

type Props = {
  base: UserBrainrot[];
  trade: UserBrainrot[];
  tradeLog: TradeLogEvent[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

type Section = 'base' | 'trade';

export function DashboardClient({ base, trade, tradeLog, brainrots, mutations }: Props) {
  const [section, setSection] = useState<Section>('base');

  return (
    <div className="space-y-8">
      <nav
        role="tablist"
        aria-label="Sections"
        className="inline-flex rounded-lg border border-border bg-card p-1"
      >
        <TabButton active={section === 'base'} onClick={() => setSection('base')}>
          Base
        </TabButton>
        <TabButton active={section === 'trade'} onClick={() => setSection('trade')}>
          Trade
        </TabButton>
      </nav>

      {section === 'base' ? (
        <BaseSection base={base} brainrots={brainrots} mutations={mutations} />
      ) : (
        <TradeSection
          trade={trade}
          tradeLog={tradeLog}
          brainrots={brainrots}
          mutations={mutations}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
