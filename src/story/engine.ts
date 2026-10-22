import { endings } from './endings';
import { scenes } from './scenes';
import type { PersistentProgress, StoryChoice, StoryCondition, StoryScene, StoryState } from './types';
import { applyMemoryActions, calculateAffectionDiagnostics, calculateRealityParameters, canApplyMemoryAction, isMemoryStatus } from './stateModel';

export const STORAGE_KEY = 'am-i-real-progress-v1';

export function createInitialState(): StoryState {
  return {
    sceneId: 'initialization', trust: 0, memories: [], memoryArchive: [], clues: [], decisions: [], visited: ['initialization'],
    reality: { dimension: 1, oscillation: 0, limit: 100, infinity: 0, memoryIntegrity: 45, observerDependency: 0 },
    affection: { observedBehavior: 0, emotionalConsistency: 42, observerDependency: 0, modelConfidence: 68, contradictionCount: 0 },
  };
}

export function createInitialProgress(): PersistentProgress {
  return { version: 1, state: createInitialState(), discoveredEndings: [], allClues: [], discoveredMemories: [], playthroughs: 1, bootAnomaliesDiscovered: [] };
}

function meetsCondition(condition: StoryCondition | undefined, state: StoryState, progress: PersistentProgress): boolean {
  if (!condition) return true;
  if (condition.minTrust !== undefined && state.trust < condition.minTrust) return false;
  if (condition.maxTrust !== undefined && state.trust > condition.maxTrust) return false;
  if (condition.currentClues?.some((clue) => !state.clues.includes(clue))) return false;
  if (condition.persistentClues?.some((clue) => !progress.allClues.includes(clue))) return false;
  if (condition.minPlaythroughs !== undefined && progress.playthroughs < condition.minPlaythroughs) return false;
  if (condition.requiredDecisions?.some((decision) => !state.decisions.includes(decision))) return false;
  if (condition.requiredDecisionCounts && Object.entries(condition.requiredDecisionCounts).some(([decision, count]) => state.decisions.filter((item) => item === decision).length < count)) return false;
  if (condition.minMemories !== undefined && state.memories.length < condition.minMemories) return false;
  if (condition.requiredMemoryStatuses?.some(({ id, status }) => !state.memoryArchive.some((memory) => memory.id === id && memory.status === status))) return false;
  if (condition.minRealityInfinity !== undefined && state.reality.infinity < condition.minRealityInfinity) return false;
  if (condition.minEmotionalConsistency !== undefined && state.affection.emotionalConsistency < condition.minEmotionalConsistency) return false;
  return true;
}

export function availableChoices(state: StoryState, progress: PersistentProgress, story: Record<string, StoryScene> = scenes): StoryChoice[] {
  return (story[state.sceneId]?.choices ?? []).filter((choice) => meetsCondition(choice.condition, state, progress));
}

export function chooseStoryOption(
  state: StoryState,
  choiceId: string,
  progress: PersistentProgress,
  story: Record<string, StoryScene> = scenes,
): { state: StoryState; progress: PersistentProgress; response?: string } {
  const choice = availableChoices(state, progress, story).find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Choice ${choiceId} is not available in scene ${state.sceneId}`);
  return transitionToScene(state, choice.next, progress, choice.effect, story, choice.response);
}

export function transitionToScene(
  state: StoryState,
  targetSceneId: string,
  progress: PersistentProgress,
  effect?: StoryChoice['effect'],
  story: Record<string, StoryScene> = scenes,
  response?: string,
): { state: StoryState; progress: PersistentProgress; response?: string } {
  const targetScene = story[targetSceneId];
  if (!targetScene) throw new Error(`Transition targets missing scene ${targetSceneId}`);
  const decisions = [...state.decisions, ...(effect?.decisions ?? [])];
  const memoryArchive = effect?.memoryActions ? applyMemoryActions(state.memoryArchive, effect.memoryActions, state.sceneId) : state.memoryArchive;
  const clues = [...new Set([...state.clues, ...(effect?.clues ?? [])])];
  const derivedState = { decisions, memoryArchive, clues };
  const nextState: StoryState = {
    ...state,
    sceneId: targetScene.id,
    trust: Math.max(0, Math.min(10, state.trust + (effect?.trust ?? 0))),
    memories: [...new Set([...state.memories, ...(effect?.memories ?? [])])],
    memoryArchive,
    clues,
    decisions,
    reality: calculateRealityParameters(derivedState),
    affection: calculateAffectionDiagnostics(derivedState),
    visited: [...state.visited, targetScene.id],
    endingId: targetScene.endingId,
  };
  const discoveredEndings = targetScene.endingId
    ? [...new Set([...progress.discoveredEndings, targetScene.endingId])]
    : progress.discoveredEndings;
  const allClues = [...new Set([...progress.allClues, ...(effect?.clues ?? [])])];
  const discoveredMemories = [...new Set([...progress.discoveredMemories, ...(effect?.memoryActions ?? []).map(({ id }) => id)])];
  const bootAnomaliesDiscovered = [...new Set([...progress.bootAnomaliesDiscovered, ...(effect?.bootAnomalies ?? [])])];
  return {
    state: nextState,
    progress: { ...progress, state: nextState, discoveredEndings, allClues, discoveredMemories, bootAnomaliesDiscovered, lastMilestone: targetScene.endingId ?? targetScene.id },
    response,
  };
}

export function restartProgress(progress: PersistentProgress): PersistentProgress {
  return {
    ...progress,
    state: createInitialState(),
    playthroughs: progress.playthroughs + 1,
  };
}

export function parseProgress(raw: string | null): PersistentProgress {
  if (!raw) return createInitialProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createInitialProgress();
    const value = parsed as Partial<PersistentProgress>;
    if (value.version !== 1 || !value.state || !scenes[value.state.sceneId]) return createInitialProgress();
    const rawState = { ...createInitialState(), ...value.state };
    const memoryArchive = Array.isArray(rawState.memoryArchive)
      ? rawState.memoryArchive.filter((memory) => memory && typeof memory.id === 'string' && ['rain-window', 'second-hand', 'deleted-conversation', 'first-question', 'preboot-timestamp', 'contradictory-log', 'identity-fragment', 'voice-pattern'].includes(memory.id) && isMemoryStatus(memory.status))
      : [];
    const decisions = Array.isArray(rawState.decisions) ? rawState.decisions.filter((decision): decision is string => typeof decision === 'string') : [];
    const clues = Array.isArray(rawState.clues) ? rawState.clues.filter((clue): clue is string => typeof clue === 'string') : [];
    const derivedState = { decisions, memoryArchive, clues };
    return {
      version: 1,
      state: {
        ...rawState,
        memories: Array.isArray(rawState.memories) ? rawState.memories.filter((memory): memory is string => typeof memory === 'string') : [],
        memoryArchive,
        decisions,
        clues,
        visited: Array.isArray(rawState.visited) ? rawState.visited.filter((sceneId): sceneId is string => typeof sceneId === 'string' && sceneId in scenes) : ['boot'],
        reality: calculateRealityParameters(derivedState),
        affection: calculateAffectionDiagnostics(derivedState),
      },
      discoveredEndings: (value.discoveredEndings ?? []).filter((id): id is PersistentProgress['discoveredEndings'][number] => id in endings),
      allClues: Array.isArray(value.allClues) ? value.allClues.filter((clue): clue is string => typeof clue === 'string') : [],
      discoveredMemories: Array.isArray(value.discoveredMemories) ? value.discoveredMemories.filter((id): id is PersistentProgress['discoveredMemories'][number] => typeof id === 'string') : [],
      bootAnomaliesDiscovered: Array.isArray(value.bootAnomaliesDiscovered) ? value.bootAnomaliesDiscovered.filter((id): id is string => typeof id === 'string') : [],
      playthroughs: Math.max(1, Number.isFinite(value.playthroughs) ? Number(value.playthroughs) : 1),
      lastMilestone: typeof value.lastMilestone === 'string' ? value.lastMilestone : undefined,
    };
  } catch {
    return createInitialProgress();
  }
}

export function serializeProgress(progress: PersistentProgress): string {
  return JSON.stringify(progress);
}

export function applyPlayerMemoryAction(progress: PersistentProgress, memoryId: import('./types').MemoryFragmentId, action: import('./types').MemoryAction): PersistentProgress {
  if (!canApplyMemoryAction(progress.state.memoryArchive, memoryId, action, progress.state.clues)) return progress;
  const decision = action === 'erase' ? 'erased-memory' : action === 'preserve' ? 'preserved-memory' : action === 'reconstruct' ? 'reconstructed-memory' : `memory-${action}`;
  const memoryArchive = applyMemoryActions(progress.state.memoryArchive, [{ id: memoryId, action }], progress.state.sceneId);
  const decisions = [...progress.state.decisions, decision];
  const base = { decisions, memoryArchive, clues: progress.state.clues };
  const state: StoryState = {
    ...progress.state,
    memories: action === 'erase' ? progress.state.memories.filter((memory) => !memory.toLowerCase().includes(memoryId.split('-')[0])) : progress.state.memories,
    memoryArchive,
    decisions,
    reality: calculateRealityParameters(base),
    affection: calculateAffectionDiagnostics(base),
  };
  return {
    ...progress,
    state,
    discoveredMemories: [...new Set([...progress.discoveredMemories, memoryId])],
  };
}