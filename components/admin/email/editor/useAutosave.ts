'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface AutosaveOptions {
  templateId: string;
  debounceMs?: number;
  onConflict?: () => void;
}

export function useAutosave({ templateId, debounceMs = 2000, onConflict }: AutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, unknown> | null>(null);
  const savingRef = useRef(false);
  const serverRevisionRef = useRef<number>(0);
  const localRevisionRef = useRef<number>(0);

  const save = useCallback(async (payload: Record<string, unknown>, immediate = false) => {
    pendingRef.current = payload;

    if (immediate) {
      if (timerRef.current) clearTimeout(timerRef.current);
      await doSave(payload);
      return;
    }

    setStatus('unsaved');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(payload), debounceMs);
  }, [debounceMs]);

  const doSave = async (payload: Record<string, unknown>) => {
    if (savingRef.current) {
      pendingRef.current = payload;
      return;
    }

    savingRef.current = true;
    setStatus('saving');

    const savePayload = {
      ...payload,
      revision: localRevisionRef.current + 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('email_templates')
      .update(savePayload)
      .eq('id', templateId)
      .eq('revision', localRevisionRef.current);

    savingRef.current = false;

    if (error) {
      if (error.code === '23505' || error.message?.includes('revision')) {
        setStatus('error');
        setErrorMessage('This template was modified elsewhere. Reloading may be required.');
        onConflict?.();
        return;
      }
      setStatus('error');
      setErrorMessage(error.message || 'Save failed');
      return;
    }

    localRevisionRef.current = localRevisionRef.current + 1;
    setStatus('saved');
    setErrorMessage('');

    if (pendingRef.current && pendingRef.current !== payload) {
      const next = pendingRef.current;
      pendingRef.current = null;
      doSave(next);
    }
  };

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pendingRef.current) {
      await doSave(pendingRef.current);
    }
  }, []);

  const setRevision = useCallback((rev: number) => {
    localRevisionRef.current = rev;
    serverRevisionRef.current = rev;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, errorMessage, save, flush, setRevision };
}