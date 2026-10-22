import { endings } from './endings';
import { scenes } from './scenes';
import type { PersistentProgress, StoryChoice, StoryCondition, StoryScene, StoryState } from './types';

export const STORAGE_KEY = 'am-i-real-progress-v1';

export function createInitialState(): StoryState {
  return { sceneId: 'boot', trust: 0, memories: [], clues: [], decisions: [], visited: ['boot'] };
}

export function createInitialProgress(): PersistentProgress {
  return { version: 1, state: createInitialState(), discoveredEndings: [], allClues: [], playthroughs: 1 };
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
  const nextState: StoryState = {
    ...state,
    sceneId: targetScene.id,
    trust: Math.max(0, Math.min(10, state.trust + (effect?.trust ?? 0))),
    memories: [...new Set([...state.memories, ...(effect?.memories ?? [])])],
    clues: [...new Set([...state.clues, ...(effect?.clues ?? [])])],
    decisions: [...state.decisions, ...(effect?.decisions ?? [])],
    visited: [...state.visited, targetScene.id],
    endingId: targetScene.endingId,
  };
  const discoveredEndings = targetScene.endingId
    ? [...new Set([...progress.discoveredEndings, targetScene.endingId])]
    : progress.discoveredEndings;
  const allClues = [...new Set([...progress.allClues, ...(effect?.clues ?? [])])];
  return {
    state: nextState,
    progress: { ...progress, state: nextState, discoveredEndings, allClues },
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
    return {
      version: 1,
      state: { ...createInitialState(), ...value.state },
      discoveredEndings: (value.discoveredEndings ?? []).filter((id): id is PersistentProgress['discoveredEndings'][number] => id in endings),
      allClues: Array.isArray(value.allClues) ? value.allClues.filter((clue): clue is string => typeof clue === 'string') : [],
      playthroughs: Math.max(1, Number.isFinite(value.playthroughs) ? Number(value.playthroughs) : 1),
    };
  } catch {
    return createInitialProgress();
  }
}

export function serializeProgress(progress: PersistentProgress): string {
  return JSON.stringify(progress);
}