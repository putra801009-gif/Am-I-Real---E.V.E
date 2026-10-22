import { useEffect, useState } from 'react';
import type { EndingId, EndingVisualMode } from '../story/types';

export type EndingPresentationStage = 'recognition' | 'command' | 'collapse' | 'dark' | 'awakening' | 'shape' | 'quiet' | 'complete';

export interface EndingPresentation {
  endingId: EndingId;
  mode: EndingVisualMode;
  stage: EndingPresentationStage;
  elapsedMs: number;
  canReturn: boolean;
  turningAway: boolean;
}

const endingSchedule: Record<EndingVisualMode, Array<[number, EndingPresentationStage]>> = {
  standard: [[0, 'complete']],
  collapse: [[0, 'recognition'], [9000, 'command'], [16000, 'collapse'], [26500, 'dark'], [31500, 'complete']],
  'quiet-after': [[0, 'awakening'], [7500, 'shape'], [16000, 'quiet'], [34000, 'complete']],
};

export function endingStageAtElapsed(mode: EndingVisualMode, elapsedMs: number): EndingPresentationStage {
  return [...endingSchedule[mode]].reverse().find(([at]) => elapsedMs >= at)?.[1] ?? endingSchedule[mode][0][1];
}

export function useEndingPresentation(endingId: EndingId | undefined, mode: EndingVisualMode = 'standard', enabled = true) {
  const [presentation, setPresentation] = useState<EndingPresentation | null>(null);

  useEffect(() => {
    if (!endingId) {
      setPresentation(null);
      return;
    }
    let elapsedMs = 0;
    let stage: EndingPresentationStage = endingSchedule[mode][0][1];
    setPresentation({ endingId, mode, stage, elapsedMs, canReturn: stage === 'complete', turningAway: false });
    if (!enabled) return;
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      elapsedMs = performance.now() - startedAt;
      const nextStage = endingStageAtElapsed(mode, elapsedMs);
      if (nextStage !== stage) stage = nextStage;
      const turnAt = mode === 'quiet-after' ? 28500 : Number.POSITIVE_INFINITY;
      setPresentation({ endingId, mode, stage, elapsedMs, canReturn: stage === 'complete', turningAway: elapsedMs >= turnAt });
    }, 150);
    return () => window.clearInterval(interval);
  }, [enabled, endingId, mode]);

  return presentation;
}