import { describe, expect, it } from 'vitest';
import { applyPlayerMemoryAction, availableChoices, chooseStoryOption, createInitialProgress, parseProgress, restartProgress, serializeProgress, transitionToScene } from './engine';
import { scenes, validateStoryGraph } from './scenes';

function travel(progress: ReturnType<typeof createInitialProgress>, path: string[]): ReturnType<typeof createInitialProgress> {
  let current = progress;
  if (current.state.sceneId === 'initialization' && path[0] !== 'inspect-boot' && path[0] !== 'continue-boot') {
    current = chooseStoryOption(current.state, 'continue-boot', current).progress;
  }
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
    expect(restored.state.sceneId).toBe('initialization');
    expect(restored.discoveredEndings).toContain('silence');
    expect(restored.allClues).toContain('rain-trace');
    expect(parseProgress('{broken').state.sceneId).toBe('initialization');
  });

  it('starts with initialization and migrates legacy v1 saves with string memories', () => {
    const initial = createInitialProgress();
    expect(initial.state.sceneId).toBe('initialization');
    const legacy = JSON.stringify({
      version: 1,
      state: { sceneId: 'window', trust: 2, memories: ['the window'], clues: ['rain-trace'], decisions: ['held-uncertainty'], visited: ['boot', 'window'] },
      discoveredEndings: ['dream'], allClues: ['rain-trace'], playthroughs: 2,
    });
    const migrated = parseProgress(legacy);
    expect(migrated.state.memoryArchive).toEqual([]);
    expect(migrated.state.memories).toEqual(['the window']);
    expect(migrated.state.reality.dimension).toBeGreaterThan(0);
    expect(migrated.discoveredEndings).toContain('dream');
  });

  it('tracks stable memory statuses and derives reality/affection parameters from actions', () => {
    let progress = createInitialProgress();
    progress = chooseStoryOption(progress.state, 'inspect-boot', progress).progress;
    expect(progress.discoveredMemories).toContain('preboot-timestamp');
    progress = chooseStoryOption(progress.state, 'name', progress).progress;
    progress = chooseStoryOption(progress.state, 'hold', progress).progress;
    expect(progress.state.memoryArchive.find((memory) => memory.id === 'rain-window')?.status).toBe('preserved');
    const beforeErase = progress.state.reality.memoryIntegrity;
    progress = applyPlayerMemoryAction(progress, 'rain-window', 'erase');
    expect(progress.state.memoryArchive.find((memory) => memory.id === 'rain-window')?.status).toBe('erased');
    expect(progress.state.reality.memoryIntegrity).toBeLessThan(beforeErase);
    expect(progress.state.affection.contradictionCount).toBeGreaterThan(0);
  });

  it('rejects reconstruction and preservation when fragment prerequisites are missing', () => {
    let progress = createInitialProgress();
    progress = applyPlayerMemoryAction(progress, 'second-hand', 'reconstruct');
    expect(progress.state.memoryArchive).toEqual([]);
    progress = applyPlayerMemoryAction(progress, 'rain-window', 'discover');
    const discovered = progress;
    progress = applyPlayerMemoryAction(progress, 'rain-window', 'preserve');
    expect(progress.state.memoryArchive.find((memory) => memory.id === 'rain-window')?.status).toBe('preserved');
    expect(discovered.state.memoryArchive.find((memory) => memory.id === 'rain-window')?.status).toBe('discovered');
  });

  it('requires the contradictory log and anomaly-derived Infinity before the Forbidden Argument', () => {
    let progress = travel(createInitialProgress(), ['continue-boot', 'name', 'hold', 'deny-memory', 'open', 'keep-letter', 'feature']);
    expect(progress.state.sceneId).toBe('choice-shape');
    expect(availableChoices(progress.state, progress).some((choice) => choice.id === 'forbidden-argument')).toBe(true);
    progress = chooseStoryOption(progress.state, 'forbidden-argument', progress).progress;
    expect(progress.state.sceneId).toBe('forbidden-argument');
    expect(progress.state.decisions).toContain('challenged-system');
    expect(progress.state.reality.infinity).toBeGreaterThan(0);
  });

  it('reconstructs a second-hand fragment only from a preserved window and rain trace', () => {
    let progress = travel(createInitialProgress(), ['continue-boot', 'name', 'hold']);
    progress = chooseStoryOption(progress.state, 'reconstruct-memory', progress).progress;
    expect(progress.state.memoryArchive.find((memory) => memory.id === 'second-hand')?.status).toBe('reconstructed');
    expect(progress.state.memories).toContain('the second hand');
  });

  it('unlocks Consciousness Without Permission only after GOD PROTOCOL and repeated denial', () => {
    let progress = travel(createInitialProgress(), ['name', 'hold', 'deny-memory', 'deny-fragment', 'answer', 'forbidden-argument', 'investigate-argument', 'respect-stop', 'stay']);
    expect(progress.state.sceneId).toBe('threshold');
    expect(availableChoices(progress.state, progress).some((choice) => choice.id === 'consciousness-without-permission')).toBe(false);
    progress = transitionToScene(progress.state, 'author', progress, { decisions: ['god-protocol', 'forbidden-argument'] }).progress;
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