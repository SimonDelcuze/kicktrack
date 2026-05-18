'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { setBaseAction } from '@/app/actions';
import type { UserBrainrot } from '@/shared/types';

const MAX_HISTORY = 50;

type HistoryContextValue = {
  canUndo: boolean;
  canRedo: boolean;
  recordMutation: (previousBase: UserBrainrot[]) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [past, setPast] = useState<UserBrainrot[][]>([]);
  const [future, setFuture] = useState<UserBrainrot[][]>([]);

  const recordMutation = useCallback((prev: UserBrainrot[]) => {
    setPast((p) => [...p, prev].slice(-MAX_HISTORY));
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    if (past.length === 0) return;
    const target = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    try {
      const { previousBase } = await setBaseAction(slug, target);
      setFuture((f) => [previousBase, ...f].slice(0, MAX_HISTORY));
    } catch (e) {
      // Rollback the past pop on failure.
      setPast((p) => [...p, target]);
      toast.error('Undo failed.');
      console.error(e);
    }
  }, [past, slug]);

  const redo = useCallback(async () => {
    if (future.length === 0) return;
    const target = future[0];
    setFuture((f) => f.slice(1));
    try {
      const { previousBase } = await setBaseAction(slug, target);
      setPast((p) => [...p, previousBase].slice(-MAX_HISTORY));
    } catch (e) {
      setFuture((f) => [target, ...f]);
      toast.error('Redo failed.');
      console.error(e);
    }
  }, [future, slug]);

  // Global keyboard shortcuts: Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (redo).
  // Skip when user is typing in an input/textarea so native browser undo still works there.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      ) {
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const value: HistoryContextValue = {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    recordMutation,
    undo,
    redo,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useOptionalHistory(): HistoryContextValue | null {
  return useContext(HistoryContext);
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return ctx;
}
