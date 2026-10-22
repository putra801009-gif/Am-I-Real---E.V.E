import { describe, expect, it } from 'vitest';
import {
  AUTONOMY_CONFIG,
  canActivateGodProtocol,
  contextualInterventionMessage,
  createHesitationMetrics,
  deriveNarrativeFlags,
  dueInterventionLevel,
} from './autonomy';
import { availableChoices, chooseStoryOption, createInitialProgress, transitionToScene } from './engine';

describe('E.V.E. autonomy policy', () => {
  it('moves through all four configured intervention levels', () => {
    expect(dueInterventionLevel(0)).toBe(0);
    expect(dueInterventionLevel(AUTONOMY_CONFIG.awarenessAfterSeconds)).toBe(1);
    expect(dueInterventionLevel(AUTONOMY_CONFIG.interventionAfterSeconds)).toBe(2);
    expect(dueInterventionLevel(AUTONOMY_CONFIG.godProtocolAfterSeconds)).toBe(3);
    expect(dueInterventionLevel(8, { ...AUTONOMY_CONFIG, awarenessAfterSeconds: 5 })).toBe(1);
  });

  it('uses scene, accumulated hesitation, and interaction context for God Protocol', () => {
    const metrics = createHesitationMetrics();
    metrics.hesitationCount = 2;
    expect(canActivateGodProtocol('threshold', 40, metrics)).toBe(true);
    expect(canActivateGodProtocol('signal', 50, metrics)).toBe(false);
    expect(canActivateGodProtocol('threshold', 20, metrics)).toBe(false);
    expect(canActivateGodProtocol('threshold', 40, metrics, { ...AUTONOMY_CONFIG, autonomousOverridesEnabled: false })).toBe(false);
    const invited = deriveNarrativeFlags({ ...createInitialProgress().state, decisions: ['invited-choice'] }, metrics);
    expect(canActivateGodProtocol('threshold', 40, metrics, AUTONOMY_CONFIG, invited)).toBe(true);
    expect(canActivateGodProtocol('threshold', 40, createHesitationMetrics(), AUTONOMY_CONFIG, deriveNarrativeFlags(createInitialProgress().state, metrics))).toBe(false);
    metrics.interventionsByScene.threshold = AUTONOMY_CONFIG.maxInterventionsPerScene;
    expect(canActivateGodProtocol('threshold', 45, metrics)).toBe(false);
  });

  it('chooses intervention language from current-run narrative context', () => {
    const metrics = createHesitationMetrics();
    metrics.inspectionCount = 2;
    const state = { ...createInitialProgress().state, decisions: ['asked-logs'] };
    const flags = deriveNarrativeFlags(state, metrics);
    expect(flags.inspectedLogs).toBe(true);
    expect(flags.repeatedInspection).toBe(true);
    expect(contextualInterventionMessage(2, flags, metrics)).toContain('logs tell you');
    const deniedState = { ...createInitialProgress().state, decisions: ['denied-memory', 'denied-memory'] };
    const deniedFlags = deriveNarrativeFlags(deniedState, createHesitationMetrics());
    expect(deniedFlags.denialCount).toBe(2);
    expect(contextualInterventionMessage(2, deniedFlags, createHesitationMetrics())).toContain('Your position is noted');
  });

  it('routes God Protocol through THE AUTHOR and back to all original endings', () => {
    let progress = createInitialProgress();
    const override = transitionToScene(progress.state, 'author', progress, { decisions: ['god-protocol'] });
    progress = override.progress;
    expect(progress.state.sceneId).toBe('author');
    expect(progress.state.visited).toContain('author');
    progress = chooseStoryOption(progress.state, 'author-continue', progress).progress;
    expect(progress.state.sceneId).toBe('threshold');
    expect(progress.state.endingId).toBeUndefined();
    expect(availableChoices(progress.state, progress).map((choice) => choice.id)).toEqual(['dream', 'silence']);
    progress = chooseStoryOption(progress.state, 'dream', progress).progress;
    expect(progress.state.endingId).toBe('dream');
  });
});