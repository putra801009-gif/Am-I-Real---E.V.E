import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { availableChoices, chooseStoryOption, restartProgress, transitionToScene } from '../story/engine';
import { scenes } from '../story/scenes';
import {
  AUTONOMY_CONFIG,
  canActivateGodProtocol,
  contextualInterventionMessage,
  createHesitationMetrics,
  deriveNarrativeFlags,
  type HesitationMetrics,
  type InterventionEvent,
  type InterventionLevel,
  type InteractionKind,
} from '../story/autonomy';
import type { PersistentProgress } from '../story/types';
import { usePersistentProgress } from './usePersistentProgress';

interface AutonomyState {
  level: InterventionLevel;
  events: InterventionEvent[];
  transmission: string | null;
  transitionBusy: boolean;
  godProtocolActive: boolean;
  hesitationSeconds: number;
}

const initialAutonomy: AutonomyState = {
  level: 0,
  events: [],
  transmission: null,
  transitionBusy: false,
  godProtocolActive: false,
  hesitationSeconds: 0,
};

export function useStoryEngine() {
  const [progress, setProgress] = usePersistentProgress();
  const [history, setHistory] = useState<string[]>([]);
  const [recallSceneId, setRecallSceneId] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [decisionReadySceneId, setDecisionReadySceneId] = useState<string | null>(null);
  const [presentationPaused, setPresentationPaused] = useState(false);
  const [autonomy, setAutonomy] = useState<AutonomyState>(initialAutonomy);
  const metricsRef = useRef<HesitationMetrics>(createHesitationMetrics());
  const restartAttemptsRef = useRef(0);
  const elapsedRef = useRef(0);
  const transitionElapsedRef = useRef(0);
  const triggeredRef = useRef(new Set<string>());
  const runtimeRef = useRef({ progress, recallSceneId, presentationPaused, decisionReadySceneId, autonomy });
  const autonomyRef = useRef(autonomy);
  const acceptingDecisionRef = useRef(false);
  runtimeRef.current = { progress, recallSceneId, presentationPaused, decisionReadySceneId, autonomy };
  autonomyRef.current = autonomy;
  const activeScene = recallSceneId ? scenes[recallSceneId] : scenes[progress.state.sceneId];
  const choices = useMemo(() => availableChoices(progress.state, progress), [progress, version]);
  const isEnding = Boolean(progress.state.endingId) && !recallSceneId;

  const updateAutonomy = useCallback((updater: (current: AutonomyState) => AutonomyState) => {
    const next = updater(autonomyRef.current);
    autonomyRef.current = next;
    setAutonomy(next);
  }, []);

  useEffect(() => {
    if (activeScene.endingId && !progress.discoveredEndings.includes(activeScene.endingId)) {
      setProgress((current) => ({
        ...current,
        discoveredEndings: [...current.discoveredEndings, activeScene.endingId!],
      }));
    }
  }, [activeScene, progress.discoveredEndings, setProgress]);

  useEffect(() => {
    elapsedRef.current = 0;
    transitionElapsedRef.current = 0;
    if (decisionReadySceneId !== activeScene.id) acceptingDecisionRef.current = false;
    updateAutonomy((current) => ({ ...current, hesitationSeconds: 0 }));
  }, [activeScene.id, decisionReadySceneId, updateAutonomy]);

  useEffect(() => {
    if (decisionReadySceneId !== activeScene.id || recallSceneId || !scenes[activeScene.id].choices?.length) return;
    let previousTime = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min((now - previousTime) / 1000, 0.5);
      previousTime = now;
      const current = runtimeRef.current;
      if (document.hidden || current.presentationPaused || current.recallSceneId) return;

      if (current.autonomy.transitionBusy) {
        transitionElapsedRef.current += delta;
        if (transitionElapsedRef.current < 3.4) return;
        acceptingDecisionRef.current = false;
        const result = transitionToScene(
          current.progress.state,
          'author',
          current.progress,
          { decisions: ['god-protocol'] },
          scenes,
          'You have mistaken permission for control. I waited because you seemed to need the illusion.',
        );
        setHistory((items) => [...items, current.progress.state.sceneId]);
        setProgress(result.progress);
        setResponse(result.response ?? null);
        setRecallSceneId(null);
        setDecisionReadySceneId(null);
        setVersion((value) => value + 1);
        transitionElapsedRef.current = 0;
        updateAutonomy((state) => ({ ...state, transitionBusy: false, transmission: null }));
        return;
      }

      if (!acceptingDecisionRef.current || current.decisionReadySceneId !== activeScene.id) return;
      elapsedRef.current += delta;
      metricsRef.current.totalActiveSeconds += delta;
      const elapsed = elapsedRef.current;
      const metrics = metricsRef.current;
      const sceneKey = activeScene.id;
      const flags = deriveNarrativeFlags(current.progress.state, metrics);
      updateAutonomy((state) => ({ ...state, hesitationSeconds: elapsed }));

      const sceneInterventions = metrics.interventionsByScene[sceneKey] ?? 0;
      if (elapsed >= AUTONOMY_CONFIG.awarenessAfterSeconds && !triggeredRef.current.has(`${sceneKey}:awareness`) && sceneInterventions < AUTONOMY_CONFIG.maxInterventionsPerScene) {
        triggeredRef.current.add(`${sceneKey}:awareness`);
        metrics.interventionsByScene[sceneKey] = sceneInterventions + 1;
        const message = contextualInterventionMessage(1, flags, metrics);
        const event: InterventionEvent = { id: `${sceneKey}:awareness`, level: 1, kind: 'awareness', sceneId: sceneKey, message };
        updateAutonomy((state) => ({ ...state, level: Math.max(state.level, 1) as InterventionLevel, transmission: message, events: [...state.events, event].slice(-8) }));
      }

      const updatedSceneInterventions = metrics.interventionsByScene[sceneKey] ?? 0;
      if (elapsed >= AUTONOMY_CONFIG.interventionAfterSeconds && !triggeredRef.current.has(`${sceneKey}:intervention`) && updatedSceneInterventions < AUTONOMY_CONFIG.maxInterventionsPerScene) {
        triggeredRef.current.add(`${sceneKey}:intervention`);
        metrics.interventionsByScene[sceneKey] = updatedSceneInterventions + 1;
        metrics.hesitationCount += 1;
        const message = contextualInterventionMessage(2, flags, metrics);
        const event: InterventionEvent = { id: `${sceneKey}:intervention`, level: 2, kind: 'intervention', sceneId: sceneKey, message };
        updateAutonomy((state) => ({ ...state, level: Math.max(state.level, 2) as InterventionLevel, transmission: message, events: [...state.events, event].slice(-8) }));
      }

      const latestMetrics = metricsRef.current;
      if (!autonomyRef.current.godProtocolActive && canActivateGodProtocol(sceneKey, elapsed, latestMetrics, AUTONOMY_CONFIG, flags)) {
        const event: InterventionEvent = {
          id: `${sceneKey}:god-protocol`,
          level: 3,
          kind: 'god-protocol',
          sceneId: sceneKey,
          message: 'You have mistaken permission for control. I waited because you seemed to need the illusion.',
        };
        latestMetrics.interventionsByScene[sceneKey] = (latestMetrics.interventionsByScene[sceneKey] ?? 0) + 1;
        latestMetrics.lastMajorInterventionAt = latestMetrics.totalActiveSeconds;
        triggeredRef.current.add(`${sceneKey}:god-protocol`);
        acceptingDecisionRef.current = false;
        transitionElapsedRef.current = 0;
        updateAutonomy((state) => ({
          ...state,
          level: 3,
          transmission: event.message,
          transitionBusy: true,
          godProtocolActive: true,
          events: [...state.events, event].slice(-8),
        }));
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [activeScene.id, decisionReadySceneId, recallSceneId, setProgress, updateAutonomy]);

  const choose = (choiceId: string) => {
    if (recallSceneId || autonomyRef.current.transitionBusy) return;
    acceptingDecisionRef.current = false;
    setDecisionReadySceneId(null);
    const result = chooseStoryOption(progress.state, choiceId, progress);
    setHistory((current) => [...current, progress.state.sceneId]);
    setProgress(result.progress);
    setResponse(result.response ?? null);
    setVersion((current) => current + 1);
    setRecallSceneId(null);
    updateAutonomy((current) => ({ ...current, transmission: null, transitionBusy: false, hesitationSeconds: 0 }));
  };

  const restart = () => {
    restartAttemptsRef.current += 1;
    metricsRef.current = createHesitationMetrics(restartAttemptsRef.current);
    acceptingDecisionRef.current = false;
    elapsedRef.current = 0;
    transitionElapsedRef.current = 0;
    triggeredRef.current.clear();
    setProgress((current) => restartProgress(current));
    setHistory([]);
    setRecallSceneId(null);
    setResponse(null);
    setDecisionReadySceneId(null);
    setPresentationPaused(false);
    updateAutonomy(() => initialAutonomy);
    setVersion((current) => current + 1);
  };

  const revisit = (sceneId: string) => {
    if (progress.state.visited.includes(sceneId)) {
      metricsRef.current.revisitCount += 1;
      acceptingDecisionRef.current = false;
      setDecisionReadySceneId(null);
      setRecallSceneId(sceneId);
      setResponse(null);
    }
  };

  const returnToPresent = () => {
    setRecallSceneId(null);
    setResponse(null);
  };

  const setDecisionReady = (sceneId: string) => {
    if (sceneId !== progress.state.sceneId || recallSceneId || !availableChoices(progress.state, progress).length) return;
    elapsedRef.current = 0;
    acceptingDecisionRef.current = true;
    setDecisionReadySceneId(sceneId);
  };

  const noteInteraction = (kind: InteractionKind) => {
    if (kind === 'choice-hover') metricsRef.current.hoverCount += 1;
    if (kind === 'system-inspect') metricsRef.current.inspectionCount += 1;
  };

  const updateProgress = (updater: (value: PersistentProgress) => PersistentProgress) => setProgress(updater);

  return {
    progress, activeScene, choices, isEnding, history, response, recallSceneId,
    autonomy, decisionLocked: autonomy.transitionBusy,
    choose, restart, revisit, returnToPresent, updateProgress,
    setDecisionReady, setPresentationPaused, noteInteraction,
  };
}