import { useEffect, useState } from 'react';
import { createInitialProgress, parseProgress, serializeProgress, STORAGE_KEY } from '../story/engine';
import type { PersistentProgress } from '../story/types';

export function usePersistentProgress() {
  const [progress, setProgress] = useState<PersistentProgress>(() => {
    try {
      return parseProgress(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return createInitialProgress();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeProgress(progress));
    } catch {
      // The story remains playable when browser storage is unavailable.
    }
  }, [progress]);

  return [progress, setProgress] as const;
}