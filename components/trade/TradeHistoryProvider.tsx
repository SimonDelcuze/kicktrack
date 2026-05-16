'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { setTradeAndLogAction } from '@/app/trade/actions';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

const MAX_HISTORY = 50;

type Snapshot = { trade: UserBrainrot[]; log: TradeLogEvent[] };

type TradeHistoryContextValue = {
  canUndo: boolean;
  canRedo: boolean;
  recordMutation: (snapshot: Snapshot) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

const TradeHistoryContext = createContext<TradeHistoryContextValue | null>(null);

export function TradeHistoryProvider({ children }: { children: ReactNode }) {
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const recordMutation = useCallback((snapshot: Snapshot) => {
    setPast((p) => [...p, snapshot].slice(-MAX_HISTORY));
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    if (past.length === 0) return;
    const target = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    try {
      const { previousTrade, previousLog } = await setTradeAndLogAction(target.trade, target.log);
      setFuture((f) => [{ trade: previousTrade, log: previousLog }, ...f].slice(0, MAX_HISTORY));
    } catch (e) {
      setPast((p) => [...p, target]);
      toast.error('Trade undo failed.');
      console.error(e);
    }
  }, [past]);

  const redo = useCallback(async () => {
    if (future.length === 0) return;
    const target = future[0];
    setFuture((f) => f.slice(1));
    try {
      const { previousTrade, previousLog } = await setTradeAndLogAction(target.trade, target.log);
      setPast((p) => [...p, { trade: previousTrade, log: previousLog }].slice(-MAX_HISTORY));
    } catch (e) {
      setFuture((f) => [target, ...f]);
      toast.error('Trade redo failed.');
      console.error(e);
    }
  }, [future]);

  const value: TradeHistoryContextValue = {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    recordMutation,
    undo,
    redo,
  };

  return <TradeHistoryContext.Provider value={value}>{children}</TradeHistoryContext.Provider>;
}

export function useTradeHistory(): TradeHistoryContextValue {
  const ctx = useContext(TradeHistoryContext);
  if (!ctx) {
    throw new Error('useTradeHistory must be used within TradeHistoryProvider');
  }
  return ctx;
}
