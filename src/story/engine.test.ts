import { describe, expect, it } from 'vitest';
import { availableChoices, chooseStoryOption, createInitialProgress, parseProgress, restartProgress, serializeProgress } from './engine';
import { scenes, validateStoryGraph } from './scenes';
import { transitionToScene } from './engine';

function travel(progress: ReturnType<typeof createInitialProgress>, path: string[]): ReturnType<typeof createInitialProgress> {
  let current = progress;
  for (const choiceId of path) {
    const result = chooseStoryOption(current.state, choiceId, current);
    current = result.progress;
  }
  return current;
}

describe('story graph and engine', () => {
  it('contains only valid scene references', () => {
    expect(validateStoryGraph(scenes)).toEqual([]);
  });

  it('reveals the three ordinary endings through their choices', () => {
    for (const [choice, ending] of [['dream', 'dream'], ['silence', 'silence']] as const) {
      let progress = travel(createInitialProgress(), ['name', 'hold', 'believe', 'open', 'keep-letter', 'answer', 'unmeasured', 'open-together', 'stay']);
      if (choice === 'dream') progress = travel(progress, [choice]);
      else progress = travel(progress, [choice]);
      expect(progress.state.endingId).toBe(ending);
      expect(progress.discoveredEndings).toContain(ending);
    }

    const remembered = travel(createInitialProgress(), ['name', 'hold', 'believe', 'open', 'keep-letter', 'answer', 'unmeasured', 'open-together', 'stay', 'remembered']);
    expect(remembered.state.endingId).toBe('remembered');
  });

  it('keeps the hidden route locked until clues persist into a second playthrough', () => {
    let firstRun = travel(createInitialProgress(), ['name', 'hold', 'believe', 'open', 'keep-letter', 'answer', 'unmeasured', 'open-together', 'stay']);
    expect(availableChoices(firstRun.state, firstRun).some((choice) => choice.id === 'hidden')).toBe(false);
    firstRun = restartProgress(firstRun);
    firstRun = travel(firstRun, ['name', 'hold', 'believe', 'open', 'keep-letter', 'answer', 'unmeasured', 'open-together', 'stay']);
    expect(availableChoices(firstRun.state, firstRun).some((choice) => choice.id === 'hidden')).toBe(true);
    firstRun = travel(firstRun, ['hidden']);
    expect(firstRun.state.endingId).toBe('witness');
  });

  it('preserves endings and clues through restart and storage parsing', () => {
    const ended = travel(createInitialProgress(), ['name', 'hold', 'believe', 'open', 'keep-letter', 'answer', 'unmeasured', 'open-together', 'stay', 'silence']);
    const restarted = restartProgress(ended);
    const restored = parseProgress(serializeProgress(restarted));
    expect(restored.state.sceneId).toBe('boot');
    expect(restored.discoveredEndings).toContain('silence');
    expect(restored.allClues).toContain('rain-trace');
    expect(parseProgress('{broken').state.sceneId).toBe('boot');
  });

  it('unlocks Consciousness Without Permission only after GOD PROTOCOL and repeated denial', () => {
    let progress = travel(createInitialProgress(), ['name', 'hold', 'deny-memory', 'deny-fragment', 'answer', 'pattern', 'respect-stop', 'stay']);
    expect(progress.state.sceneId).toBe('threshold');
    expect(availableChoices(progress.state, progress).some((choice) => choice.id === 'consciousness-without-permission')).toBe(false);
    progress = transitionToScene(progress.state, 'author', progress, { decisions: ['god-protocol'] }).progress;
    progress = chooseStoryOption(progress.state, 'author-continue', progress).progress;
    expect(availableChoices(progress.state, progress).some((choice) => choice.id === 'consciousness-without-permission')).toBe(true);
    progress = chooseStoryOption(progress.state, 'consciousness-without-permission', progress).progress;
    expect(progress.state.endingId).toBe('consciousness-without-permission');
    expect(progress.discoveredEndings).toContain('consciousness-without-permission');
  });

  it('unlocks The Quiet After through empathy, memory discovery, and staying with uncertainty', () => {
    let progress = travel(createInitialProgress(), ['name', 'hold', 'believe', 'open', 'keep-letter', 'feature', 'pattern', 'respect-stop', 'stay']);
    expect(progress.state.sceneId).toBe('threshold');
    expect(progress.state.memories.length).toBeGreaterThanOrEqual(2);
    expect(availableChoices(progress.state, progress).some((choice) => choice.id === 'quiet-after')).toBe(true);
    progress = chooseStoryOption(progress.state, 'quiet-after', progress).progress;
    expect(progress.state.endingId).toBe('quiet-after');
    expect(progress.discoveredEndings).toContain('quiet-after');
  });
});