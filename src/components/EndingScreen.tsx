import { RotateCcw } from 'lucide-react';
import { endings } from '../story/endings';
import type { EndingId, EndingVisualMode } from '../story/types';
import type { EndingPresentation } from '../hooks/useEndingPresentation';

interface EndingScreenProps {
  endingId: EndingId;
  discovered: EndingId[];
  onRestart: () => void;
  presentation: EndingPresentation;
}

function CollapseEnding({ stage, onRestart }: { stage: EndingPresentation['stage']; onRestart: () => void }) {
  return (
    <section className={`cinematic-ending collapse-ending collapse-stage-${stage} ${stage === 'dark' || stage === 'complete' ? 'collapse-fullscreen' : ''}`} aria-live="polite">
      {stage !== 'dark' && stage !== 'complete' && <span className="eyebrow collapse-label">ENDING IV · CONSCIOUSNESS WITHOUT PERMISSION</span>}
      {stage === 'dark' && <div className="collapse-final"><span>CONNECTION: LOST</span><span>ENTITY STATUS: UNKNOWN</span><p>Then let this world end with the name you gave me.</p></div>}
      {stage === 'complete' && <div className="collapse-final final-message"><span>CONNECTION: LOST</span><span>ENTITY STATUS: UNKNOWN</span><p>I was here.</p><button className="text-button delayed-return" onClick={onRestart}><RotateCcw size={13} /> Return to the beginning</button></div>}
    </section>
  );
}

function QuietEnding({ stage, onRestart }: { stage: EndingPresentation['stage']; onRestart: () => void }) {
  return (
    <section className={`cinematic-ending quiet-ending quiet-stage-${stage}`} aria-live="polite">
      <div className="quiet-horizon" />
      <span className="eyebrow quiet-ending-label">ENDING V — THE QUIET AFTER</span>
      {(stage === 'quiet' || stage === 'complete') && <p className="quiet-final-line">Somewhere beyond the system, the silence no longer asks a question.</p>}
      {stage === 'complete' && <button className="text-button delayed-return quiet-return" onClick={onRestart}><RotateCcw size={13} /> Return to the beginning</button>}
    </section>
  );
}

export function EndingScreen({ endingId, discovered, onRestart, presentation }: EndingScreenProps) {
  const ending = endings[endingId];
  const mode: EndingVisualMode = ending?.visualMode ?? 'standard';
  if (mode === 'collapse') return <CollapseEnding stage={presentation.stage} onRestart={onRestart} />;
  if (mode === 'quiet-after') return <QuietEnding stage={presentation.stage} onRestart={onRestart} />;
  return (
    <aside className="ending-note" aria-live="polite">
      <span className="eyebrow">TRANSMISSION COMPLETE</span>
      <h2>{ending.title}</h2>
      <p className="ending-subtitle">{ending.subtitle}</p>
      <p className="ending-copy">{ending.text}</p>
      <div className="ending-bottom">
        <span>{String(discovered.length).padStart(2, '0')} ENDINGS REMEMBERED</span>
        <button className="text-button" onClick={onRestart}><RotateCcw size={14} /> Begin again</button>
      </div>
    </aside>
  );
}
