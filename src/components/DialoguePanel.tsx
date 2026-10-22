import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import type { StoryChoice, StoryLine, StoryScene } from '../story/types';

interface DialoguePanelProps {
  scene: StoryScene;
  choices: StoryChoice[];
  response: string | null;
  revisiting: boolean;
  canGoBack: boolean;
  decisionLocked?: boolean;
  transmission?: string | null;
  onChoose: (id: string) => void;
  onComplete: () => void;
  onDecisionReady: () => void;
  onChoiceAttention: () => void;
  onContinue: () => void;
  onBack: () => void;
  onReturn: () => void;
  initializationAnomalies?: string[];
}

function useRevealedLines(sceneId: string, lines: StoryLine[]) {
  const [lineIndex, setLineIndex] = useState(0);
  const [visibleText, setVisibleText] = useState('');
  const [complete, setComplete] = useState(false);
  const currentText = lines[lineIndex]?.text ?? '';

  useEffect(() => {
    setLineIndex(0);
    setVisibleText('');
    setComplete(false);
  }, [sceneId]);

  useEffect(() => {
    if (complete || !currentText) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleText(currentText);
      return;
    }
    const timer = window.setTimeout(() => {
      setVisibleText(currentText.slice(0, visibleText.length + 2));
    }, 22);
    return () => window.clearTimeout(timer);
  }, [complete, currentText, visibleText]);

  useEffect(() => {
    if (!currentText || visibleText.length < currentText.length) return;
    if (lineIndex === lines.length - 1) {
      setComplete(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setLineIndex((index) => index + 1);
      setVisibleText('');
    }, 420);
    return () => window.clearTimeout(timer);
  }, [currentText, lineIndex, lines.length, visibleText]);

  const revealedLines = useMemo(() => lines.slice(0, lineIndex), [lines, lineIndex]);
  const skip = () => {
    if (lineIndex >= lines.length - 1 && visibleText.length >= currentText.length) {
      setComplete(true);
      return;
    }
    if (visibleText.length < currentText.length) {
      setVisibleText(currentText);
      return;
    }
    setLineIndex((index) => Math.min(index + 1, lines.length - 1));
    setVisibleText('');
  };

  return { lineIndex, visibleText, complete, revealedLines, skip };
}

export function DialoguePanel({ scene, choices, response, revisiting, canGoBack, decisionLocked = false, transmission, initializationAnomalies = [], onChoose, onDecisionReady, onChoiceAttention, onComplete, onContinue, onBack, onReturn }: DialoguePanelProps) {
  const { lineIndex, visibleText, complete, revealedLines, skip } = useRevealedLines(scene.id, scene.lines);
  const activeLine = scene.lines[lineIndex];
  const finished = complete || revisiting;
  const completionNotifiedRef = useRef(false);
  const readyNotifiedRef = useRef(false);

  useEffect(() => {
    if (finished && !revisiting && !completionNotifiedRef.current) {
      completionNotifiedRef.current = true;
      onComplete();
    }
  }, [finished, onComplete, revisiting]);

  useEffect(() => {
    if (finished && choices.length > 0 && !revisiting && !readyNotifiedRef.current) {
      readyNotifiedRef.current = true;
      onDecisionReady();
    }
  }, [choices.length, finished, onDecisionReady, revisiting]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.code === 'Space' || event.code === 'Enter') && !complete && !revisiting && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [complete, revisiting, skip]);

  return (
    <section className="dialogue-panel" aria-label="Narrative">
      <div className="panel-topline">
        <div>
          <span className="chapter-label">CHAPTER {String(scene.chapter).padStart(2, '0')}</span>
          <span className="chapter-title">{scene.chapterTitle}</span>
        </div>
        <span className="scene-number">{scene.sceneNumber}</span>
      </div>
      <div className="dialogue-body" onClick={() => !complete && !revisiting && skip()} role={!complete && !revisiting ? 'button' : undefined} tabIndex={!complete && !revisiting ? 0 : undefined} aria-label={!complete && !revisiting ? 'Advance dialogue' : undefined}>
        {initializationAnomalies.length > 0 && scene.id === 'initialization' && <div className="boot-anomaly-list"><span>REPLAY TRACE / DISCOVERED</span>{initializationAnomalies.map((anomaly) => <p key={anomaly}>{anomaly.toUpperCase()}</p>)}</div>}
        {response && !revisiting && <p className="player-response">{response}</p>}
        {revisiting ? scene.lines.map((line, index) => (
          <div className={`dialogue-line speaker-${line.speaker === 'SYSTEM' ? 'system' : 'eve'}`} key={`${scene.id}-${index}`}>
            <span className="speaker-tag">{line.speaker}</span><p>{line.text}</p>
          </div>
        )) : revealedLines.map((line, index) => (
          <div className={`dialogue-line speaker-${line.speaker === 'SYSTEM' ? 'system' : 'eve'}`} key={`${scene.id}-${index}`}>
            <span className="speaker-tag">{line.speaker}</span><p>{line.text}</p>
          </div>
        ))}
        {activeLine && !finished && (
          <div className={`dialogue-line speaker-${activeLine.speaker === 'SYSTEM' ? 'system' : 'eve'}`}>
            <span className="speaker-tag">{activeLine.speaker}</span>
            <p>{visibleText}<span className="type-cursor" aria-hidden="true" /></p>
          </div>
        )}
        {!revisiting && complete && scene.lines.map((line, index) => index === lineIndex ? (
          <div className={`dialogue-line speaker-${line.speaker === 'SYSTEM' ? 'system' : 'eve'}`} key={`${scene.id}-${index}`}>
            <span className="speaker-tag">{line.speaker}</span><p>{line.text}</p>
          </div>
        ) : null)}
      </div>
      <div className="dialogue-controls">
        {transmission && !revisiting && <div className={`eve-transmission ${decisionLocked ? 'is-protocol' : ''}`} role="status" aria-live="polite"><span>{decisionLocked ? 'GOD PROTOCOL / TRANSMISSION' : 'E.V.E. / TRANSMISSION'}</span><p>{transmission}</p></div>}
        {revisiting ? (
          <button className="continue-button" onClick={onReturn}>Return to present <ArrowRight size={14} /></button>
        ) : finished ? (
          choices.length ? (
            <div className="choice-list" aria-label="Choose a response">
              <span className="choice-prompt">HOW WILL YOU ANSWER?</span>
              {choices.map((choice, index) => (
                <button className="choice-button" key={choice.id} disabled={decisionLocked} onMouseEnter={onChoiceAttention} onFocus={onChoiceAttention} onClick={() => onChoose(choice.id)}>
                  <span className="choice-number">0{index + 1}</span><span>{choice.label}</span><ChevronRight className="choice-arrow" size={16} />
                </button>
              ))}
            </div>
          ) : scene.endingId ? (
            <button className="continue-button" onClick={onContinue}>Begin again <ArrowRight size={14} /></button>
          ) : null
        ) : (
          <button className="skip-button" onClick={skip}>Continue <ArrowRight size={14} /></button>
        )}
      </div>
      <div className="panel-footer">
        {canGoBack && !revisiting ? <button className="quiet-link" onClick={onBack}><ArrowLeft size={12} /> Review previous scene</button> : <span />}
        {!complete && !revisiting && <span className="reading-hint">CLICK OR PRESS SPACE TO CONTINUE</span>}
        {revisiting && <span className="reading-hint">ARCHIVE VIEW · CHOICES DISABLED</span>}
      </div>
    </section>
  );
}