'use client';

import { useState, useCallback, useRef } from 'react';
import { EditorDocument } from './editor-types';

interface HistoryEntry {
  document: EditorDocument;
  timestamp: number;
}

export function useUndoRedo(maxSteps: number = 50) {
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const lastPushRef = useRef<number>(0);

  const pushState = useCallback((document: EditorDocument) => {
    const now = Date.now();
    if (now - lastPushRef.current < 300) {
      setPast((prev) => {
        const next = [...prev];
        next[next.length - 1] = { document, timestamp: now };
        return next;
      });
      return;
    }
    lastPushRef.current = now;
    setPast((prev) => {
      const next = [...prev, { document, timestamp: now }];
      if (next.length > maxSteps) next.shift();
      return next;
    });
    setFuture([]);
  }, [maxSteps]);

  const undo = useCallback((): EditorDocument | null => {
    if (past.length === 0) return null;
    const newPast = [...past];
    const entry = newPast.pop()!;
    setPast(newPast);
    setFuture((prev) => [entry, ...prev]);
    return newPast.length > 0 ? newPast[newPast.length - 1].document : entry.document;
  }, [past]);

  const redo = useCallback((): EditorDocument | null => {
    if (future.length === 0) return null;
    const newFuture = [...future];
    const entry = newFuture.shift()!;
    setPast((prev) => [...prev, entry]);
    setFuture(newFuture);
    return entry.document;
  }, [future]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  const canUndo = past.length > 1;
  const canRedo = future.length > 0;

  return { pushState, undo, redo, clear, canUndo, canRedo };
}