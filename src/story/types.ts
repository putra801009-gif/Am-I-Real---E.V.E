export type Speaker = 'E.V.E.' | 'SYSTEM' | 'YOU';
export type EndingId = 'remembered' | 'dream' | 'silence' | 'witness' | 'consciousness-without-permission' | 'quiet-after';
export type EndingVisualMode = 'standard' | 'collapse' | 'quiet-after';
export type MemoryFragmentId = 'rain-window' | 'second-hand' | 'deleted-conversation' | 'first-question' | 'preboot-timestamp' | 'contradictory-log' | 'identity-fragment' | 'voice-pattern';
export type MemoryStatus = 'discovered' | 'preserved' | 'archived' | 'erased' | 'reconstructed';
export type MemoryAction = 'discover' | 'preserve' | 'archive' | 'erase' | 'reconstruct';

export interface MemoryFragment {
  id: MemoryFragmentId;
  status: MemoryStatus;
  discoveredIn: string;
}

export interface RealityParameters {
  dimension: number;
  oscillation: number;
  limit: number;
  infinity: number;
  memoryIntegrity: number;
  observerDependency: number;
}

export interface AffectionDiagnostics {
  observedBehavior: number;
  emotionalConsistency: number;
  observerDependency: number;
  modelConfidence: number;
  contradictionCount: number;
}

export interface StoryLine {
  speaker: Speaker;
  text: string;
}

export interface StoryCondition {
  minTrust?: number;
  maxTrust?: number;
  currentClues?: string[];
  persistentClues?: string[];
  minPlaythroughs?: number;
  requiredDecisions?: string[];
  requiredDecisionCounts?: Record<string, number>;
  minMemories?: number;
  requiredMemoryStatuses?: Array<{ id: MemoryFragmentId; status: MemoryStatus }>;
  minRealityInfinity?: number;
  minEmotionalConsistency?: number;
}

export interface StoryEffect {
  trust?: number;
  memories?: string[];
  clues?: string[];
  decisions?: string[];
  memoryActions?: Array<{ id: MemoryFragmentId; action: MemoryAction }>;
  bootAnomalies?: string[];
}

export interface StoryChoice {
  id: string;
  label: string;
  response?: string;
  next: string;
  condition?: StoryCondition;
  effect?: StoryEffect;
}

export interface StoryScene {
  id: string;
  chapter: number;
  chapterTitle: string;
  sceneNumber: string;
  atmosphere?: 'quiet' | 'flicker' | 'bright' | 'ending';
  lines: StoryLine[];
  choices?: StoryChoice[];
  endingId?: EndingId;
}

export interface StoryState {
  sceneId: string;
  trust: number;
  memories: string[];
  memoryArchive: MemoryFragment[];
  clues: string[];
  decisions: string[];
  visited: string[];
  reality: RealityParameters;
  affection: AffectionDiagnostics;
  endingId?: EndingId;
}

export interface PersistentProgress {
  version: 1;
  state: StoryState;
  discoveredEndings: EndingId[];
  allClues: string[];
  discoveredMemories: MemoryFragmentId[];
  playthroughs: number;
  lastMilestone?: string;
  bootAnomaliesDiscovered: string[];
}

export interface EndingDefinition {
  id: EndingId;
  visualMode?: EndingVisualMode;
  title: string;
  subtitle: string;
  text: string;
}