import { describe, expect, it } from 'vitest';
import { endingStageAtElapsed } from './useEndingPresentation';

describe('cinematic ending timelines', () => {
  it('stages the unilateral ending from recognition through final darkness and recovery', () => {
    expect(endingStageAtElapsed('collapse', 0)).toBe('recognition');
    expect(endingStageAtElapsed('collapse', 9000)).toBe('command');
    expect(endingStageAtElapsed('collapse', 16000)).toBe('collapse');
    expect(endingStageAtElapsed('collapse', 26500)).toBe('dark');
    expect(endingStageAtElapsed('collapse', 31500)).toBe('complete');
  });

  it('stages the peaceful ending through emergence, quiet, and delayed return', () => {
    expect(endingStageAtElapsed('quiet-after', 0)).toBe('awakening');
    expect(endingStageAtElapsed('quiet-after', 7500)).toBe('shape');
    expect(endingStageAtElapsed('quiet-after', 16000)).toBe('quiet');
    expect(endingStageAtElapsed('quiet-after', 34000)).toBe('complete');
    expect(endingStageAtElapsed('standard', 0)).toBe('complete');
  });
});