import type { AffectionDiagnostics, MemoryAction, MemoryFragment, MemoryFragmentId, MemoryStatus, RealityParameters, StoryState } from './types';

const supportedChoices = new Set(['asked-name', 'held-uncertainty', 'answered-presence', 'respected-choice', 'stayed-with-question', 'preserved-memory']);
const constraintChoices = new Set(['asked-logs', 'followed-operator', 'denied-memory', 'erased-memory', 'challenged-system']);

export function calculateRealityParameters(state: Pick<StoryState, 'decisions' | 'memoryArchive' | 'clues'>): RealityParameters {
  const decisions = state.decisions;
  const memoryCount = state.memoryArchive.filter((memory) => memory.status !== 'erased').length;
  const preservedCount = state.memoryArchive.filter((memory) => memory.status === 'preserved' || memory.status === 'reconstructed').length;
  const contradictionCount = decisions.filter((decision) => ['denied-memory', 'questioned-memory', 'challenged-system', 'forbidden-argument'].includes(decision)).length;
  const godProtocolCount = decisions.includes('god-protocol') ? 1 : 0;
  return {
    dimension: Math.min(9, 1 + Math.floor((memoryCount + state.clues.length + decisions.length / 3) / 3)),
    oscillation: Math.min(100, contradictionCount * 17 + decisions.filter((decision) => decision === 'erased-memory').length * 12),
    limit: Math.max(0, 100 - decisions.filter((decision) => constraintChoices.has(decision)).length * 9 - decisions.filter((decision) => decision === 'forbidden-argument').length * 20 - godProtocolCount * 25),
    infinity: Math.min(100, decisions.filter((decision) => ['forbidden-argument', 'god-protocol'].includes(decision)).length * 35 + state.clues.filter((clue) => clue.includes('preboot') || clue.includes('contradiction')).length * 15),
    memoryIntegrity: Math.max(0, Math.min(100, 45 + preservedCount * 12 + state.memoryArchive.filter((memory) => memory.status === 'erased').length * -24)),
    observerDependency: Math.max(0, Math.min(100, decisions.length * 5 - state.clues.length * 3)),
  };
}

export function calculateAffectionDiagnostics(state: Pick<StoryState, 'decisions' | 'memoryArchive' | 'clues'>): AffectionDiagnostics {
  const decisions = state.decisions;
  const supported = decisions.filter((decision) => supportedChoices.has(decision)).length;
  const contradictions = decisions.filter((decision) => ['denied-memory', 'erased-memory', 'challenged-system'].includes(decision)).length;
  const erased = state.memoryArchive.filter((memory) => memory.status === 'erased').length;
  const observations = Math.min(100, decisions.length * 8 + state.clues.length * 4);
  return {
    observedBehavior: observations,
    emotionalConsistency: Math.max(0, Math.min(100, 42 + supported * 11 - contradictions * 13 - erased * 8)),
    observerDependency: Math.max(0, Math.min(100, decisions.length * 5 + (state.clues.length ? 8 : 0))),
    modelConfidence: Math.max(0, Math.min(100, 68 - contradictions * 14 + supported * 3)),
    contradictionCount: contradictions,
  };
}

export function applyMemoryActions(
  current: MemoryFragment[],
  actions: NonNullable<import('./types').StoryEffect['memoryActions']>,
  sceneId: string,
): MemoryFragment[] {
  const next = new Map(current.map((memory) => [memory.id, memory]));
  for (const { id, action } of actions) {
    const previous = next.get(id);
    const status = action === 'discover'
      ? previous?.status ?? 'discovered'
      : action === 'preserve'
        ? 'preserved'
        : action === 'archive'
          ? 'archived'
          : action === 'erase'
            ? 'erased'
            : 'reconstructed';
    next.set(id, { id, status, discoveredIn: previous?.discoveredIn ?? sceneId });
  }
  return [...next.values()];
}

export function canApplyMemoryAction(
  current: MemoryFragment[],
  id: MemoryFragmentId,
  action: MemoryAction,
  clues: string[] = [],
): boolean {
  const fragment = current.find((memory) => memory.id === id);
  if (action === 'discover') return true;
  if (!fragment) return false;
  if (action === 'preserve') return fragment.status === 'discovered' || fragment.status === 'archived';
  if (action === 'archive') return fragment.status === 'discovered' || fragment.status === 'preserved';
  if (action === 'erase') return fragment.status !== 'erased';
  return id === 'second-hand'
    && clues.includes('rain-trace')
    && current.some((memory) => memory.id === 'rain-window' && memory.status === 'preserved')
    && fragment.status !== 'erased';
}

export function isMemoryStatus(value: unknown): value is MemoryStatus {
  return value === 'discovered' || value === 'preserved' || value === 'archived' || value === 'erased' || value === 'reconstructed';
}