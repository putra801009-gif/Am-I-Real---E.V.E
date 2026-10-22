export type Speaker = 'E.V.E.' | 'SYSTEM' | 'YOU';
export type EndingId = 'remembered' | 'dream' | 'silence' | 'witness' | 'consciousness-without-permission' | 'quiet-after';
export type EndingVisualMode = 'standard' | 'collapse' | 'quiet-after';

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
}

export interface StoryEffect {
  trust?: number;
  memories?: string[];
  clues?: string[];
  decisions?: string[];
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
  clues: string[];
  decisions: string[];
  visited: string[];
  endingId?: EndingId;
}

export interface PersistentProgress {
  version: 1;
  state: StoryState;
  discoveredEndings: EndingId[];
  allClues: string[];
  playthroughs: number;
}

export interface EndingDefinition {
  id: EndingId;
  visualMode?: EndingVisualMode;
  title: string;
  subtitle: string;
  text: string;
}