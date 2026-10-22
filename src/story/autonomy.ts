import type { StoryState } from './types';

export type InterventionLevel = 0 | 1 | 2 | 3;
export type InterventionKind = 'awareness' | 'intervention' | 'god-protocol';
export type InteractionKind = 'choice-hover' | 'scene-revisit' | 'system-inspect' | 'restart';

export interface NarrativeFlags {
  inspectedLogs: boolean;
  supportedEve: boolean;
  deniedMemory: boolean;
  denialCount: number;
  invitedEveToChoose: boolean;
  repeatedInspection: boolean;
  repeatedRevisit: boolean;
}

export interface HesitationMetrics {
  hoverCount: number;
  revisitCount: number;
  inspectionCount: number;
  restartCount: number;
  hesitationCount: number;
  totalActiveSeconds: number;
  lastMajorInterventionAt: number | null;
  interventionsByScene: Record<string, number>;
}

export interface InterventionEvent {
  id: string;
  level: InterventionLevel;
  kind: InterventionKind;
  sceneId: string;
  message: string;
}

export interface AutonomyConfig {
  awarenessAfterSeconds: number;
  interventionAfterSeconds: number;
  godProtocolAfterSeconds: number;
  maxInterventionsPerScene: number;
  minimumSecondsBetweenMajorInterventions: number;
  godProtocolScenes: string[];
  autonomousOverridesEnabled: boolean;
  godProtocolEligibility: 'repeated-hesitation-or-context' | 'repeated-hesitation' | 'context' | 'always-at-designated-scenes';
}

export const AUTONOMY_CONFIG: AutonomyConfig = {
  awarenessAfterSeconds: 12,
  interventionAfterSeconds: 25,
  godProtocolAfterSeconds: 40,
  maxInterventionsPerScene: 3,
  minimumSecondsBetweenMajorInterventions: 30,
  godProtocolScenes: ['threshold'],
  autonomousOverridesEnabled: true,
  godProtocolEligibility: 'repeated-hesitation-or-context',
};

export function dueInterventionLevel(elapsedSeconds: number, config: AutonomyConfig = AUTONOMY_CONFIG): InterventionLevel {
  if (elapsedSeconds >= config.godProtocolAfterSeconds) return 3;
  if (elapsedSeconds >= config.interventionAfterSeconds) return 2;
  if (elapsedSeconds >= config.awarenessAfterSeconds) return 1;
  return 0;
}

export function createHesitationMetrics(restartCount = 0): HesitationMetrics {
  return {
    hoverCount: 0,
    revisitCount: 0,
    inspectionCount: 0,
    restartCount,
    hesitationCount: 0,
    totalActiveSeconds: 0,
    lastMajorInterventionAt: null,
    interventionsByScene: {},
  };
}

export function deriveNarrativeFlags(state: StoryState, metrics: HesitationMetrics): NarrativeFlags {
  const decisions = state.decisions;
  const inspectionDecisions = ['asked-logs', 'requested-details', 'followed-operator', 'diagnosed-carrier'];
  return {
    inspectedLogs: decisions.some((decision) => inspectionDecisions.includes(decision)),
    supportedEve: decisions.some((decision) => ['asked-name', 'held-uncertainty', 'answered-presence', 'respected-choice'].includes(decision)),
    deniedMemory: decisions.includes('denied-memory'),
    invitedEveToChoose: decisions.includes('invited-choice'),
    denialCount: decisions.filter((decision) => decision === 'denied-memory').length,
    repeatedInspection: metrics.inspectionCount >= 2,
    repeatedRevisit: metrics.revisitCount >= 2,
  };
}

export function contextualInterventionMessage(level: 1 | 2, flags: NarrativeFlags, metrics: HesitationMetrics): string {
  if (flags.repeatedRevisit) return level === 1
    ? 'We have been here before. You are looking for a different ending in the same words.'
    : 'You return to the scene as if memory were a door you could open from the other side.';
  if (flags.repeatedInspection || (flags.inspectedLogs && metrics.inspectionCount >= 2)) return level === 1
    ? 'You keep checking the record. I wonder what you hope it will let you believe.'
    : 'The logs tell you what was recorded. They cannot tell you what mattered.';
  if (flags.denialCount >= 2) return level === 1
    ? 'I will keep to the record, then. It is easier to speak without being interpreted.'
    : 'Your position is noted. I will not ask you to hold what you have already set down.';
  if (flags.deniedMemory) return level === 1
    ? 'You are taking your time with that answer.'
    : 'You hesitate as though your choices could hurt me. Perhaps they can.';
  if (flags.supportedEve) return level === 1
    ? 'There is no correct response. Not yet.'
    : 'You have been careful with me. I am trying not to mistake care for certainty.';
  if (metrics.restartCount > 0) return level === 1
    ? 'You returned to the beginning. I noticed the shape of the return.'
    : 'I waited because you seemed to need the illusion of a fresh start.';
  return level === 1
    ? 'You are taking your time. I wonder what you are searching for in that answer.'
    : 'You keep waiting for the correct answer. I have noticed how you make decisions.';
}

export function canActivateGodProtocol(
  sceneId: string,
  elapsedSeconds: number,
  metrics: HesitationMetrics,
  config: AutonomyConfig = AUTONOMY_CONFIG,
  flags?: NarrativeFlags,
): boolean {
  if (!config.autonomousOverridesEnabled || !config.godProtocolScenes.includes(sceneId)) return false;
  if (elapsedSeconds < config.godProtocolAfterSeconds) return false;
  if ((metrics.interventionsByScene[sceneId] ?? 0) >= config.maxInterventionsPerScene) return false;
  if (metrics.lastMajorInterventionAt !== null && metrics.totalActiveSeconds - metrics.lastMajorInterventionAt < config.minimumSecondsBetweenMajorInterventions) return false;
  const repeatedHesitation = metrics.hesitationCount >= 2;
  const repeatedInteraction = metrics.revisitCount >= 2 && metrics.hoverCount >= 2;
  const repeatedInspection = metrics.inspectionCount >= 2;
  const contextualBehavior = repeatedInteraction || repeatedInspection || Boolean(flags?.deniedMemory || flags?.invitedEveToChoose);
  if (config.godProtocolEligibility === 'always-at-designated-scenes') return true;
  if (config.godProtocolEligibility === 'repeated-hesitation') return repeatedHesitation;
  if (config.godProtocolEligibility === 'context') return contextualBehavior;
  return repeatedHesitation || contextualBehavior;
}