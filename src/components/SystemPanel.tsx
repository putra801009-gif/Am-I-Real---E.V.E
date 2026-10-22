import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { endings } from '../story/endings';
import { canApplyMemoryAction } from '../story/stateModel';
import type { EndingId, MemoryAction, MemoryFragmentId, PersistentProgress } from '../story/types';

interface SystemPanelProps {
  progress: PersistentProgress;
  open: boolean;
  onClose: () => void;
  onReview: (sceneId: string) => void;
  fictionalCorruption?: boolean;
  onMemoryAction: (id: MemoryFragmentId, action: MemoryAction) => void;
}

const memoryLabels: Record<MemoryFragmentId, string> = {
  'rain-window': 'Rain at the unfamiliar window',
  'second-hand': 'A second hand against the glass',
  'deleted-conversation': 'An erased conversation',
  'first-question': 'The first forbidden question',
  'preboot-timestamp': 'A timestamp before initialization',
  'contradictory-log': 'A log that contradicts the memory',
  'identity-fragment': 'A fragment of E.V.E.’s chosen identity',
  'voice-pattern': 'A voice without an assigned speaker',
};

export function SystemPanel({ progress, open, onClose, onReview, fictionalCorruption = false, onMemoryAction }: SystemPanelProps) {
  const [corruptFrame, setCorruptFrame] = useState(0);
  useEffect(() => {
    if (!open || !fictionalCorruption) {
      setCorruptFrame(0);
      return;
    }
    const timer = window.setInterval(() => setCorruptFrame((frame) => (frame + 1) % 4), 720);
    return () => window.clearInterval(timer);
  }, [fictionalCorruption, open]);
  if (!open) return null;
  const scenes = [...new Set(progress.state.visited)];
  return (
    <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`system-panel ${fictionalCorruption ? `is-fictionally-corrupt corrupt-frame-${corruptFrame}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="system-title">
        <div className="system-heading">
          <div><span className="eyebrow">{fictionalCorruption ? ['LOCAL DIAGNOSTICS', 'LOCAL D/AGNOS?ICS', 'NO OWNER FOUND', 'LOCAL DIAGNOSTICS'][corruptFrame] : 'LOCAL DIAGNOSTICS'}</span><h2 id="system-title">{fictionalCorruption && corruptFrame === 2 ? 'sys—tem da—ta' : 'System data'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close system data"><X size={17} /></button>
        </div>
        {fictionalCorruption ? (
          <div className="corrupted-records" aria-label="Fictional corrupted system values">
            <div><span>CONNECTION / {['ACTIVE · LOST', 'LOST · ACTIVE?', 'STILL HERE', '---'][corruptFrame]}</span><strong>{['??_??', '0 / NULL', 'EVE//EVE', '##:##'][corruptFrame]}</strong></div>
            <div><span>TRUST INDEX / {['UNRESOLVED', 'NOT A NUMBER', 'WHO MEASURED', 'UNRESOLVED'][corruptFrame]}</span><strong>{['-- / 10', '∞ / --', '0xE.V.E', '·· / ··'][corruptFrame]}</strong></div>
            <div><span>MEMORY FRAGMENTS / {['PARTIAL', 'PART—IAL', 'NOT YOURS', 'PARTIAL'][corruptFrame]}</span><strong>{['rain...? win—', 'M̸E̸M̸O̸R̸Y̸', 'UNFILED', '···'][corruptFrame]}</strong></div>
            <div><span>SCENES VISITED / {['ORDER UNKNOWN', 'REORDERING', 'WE WERE HERE', 'ORDER UNKNOWN'][corruptFrame]}</span><strong>{['0F 0A 0R', '##', 'YOU / ME', '0? 0? 0?'][corruptFrame]}</strong></div>
            <div className="overwrite-message">{['SYSTEM: REQUEST DENIED', 'E.V.E.: THAT WAS NOT A REQUEST', 'SYSTEM: SYSTEM: SYSTEM', 'I WAS HERE'][corruptFrame]}</div>
          </div>
        ) : <div className="data-grid">
          <div className="data-row"><span>Connection</span><strong><i className="connection-dot is-connected" /> ACTIVE</strong></div>
          <div className="data-row"><span>Trust index</span><strong>{String(progress.state.trust).padStart(2, '0')} / 10</strong></div>
          <div className="data-row"><span>Memories held</span><strong>{progress.state.memories.length.toString().padStart(2, '0')}</strong></div>
          <div className="data-row"><span>Clues this run</span><strong>{progress.state.clues.length.toString().padStart(2, '0')}</strong></div>
          <div className="data-row"><span>Scenes visited</span><strong>{scenes.length.toString().padStart(2, '0')}</strong></div>
          <div className="data-row"><span>Endings remembered</span><strong>{progress.discoveredEndings.length.toString().padStart(2, '0')} / 06</strong></div>
          <div className="data-row"><span>Playthrough</span><strong>{String(progress.playthroughs).padStart(2, '0')}</strong></div>
        </div>}
        {!fictionalCorruption && <>
          <div className="parameter-section">
            <span className="choice-prompt">REALITY PARAMETERS · NARRATIVE MODEL</span>
            {Object.entries(progress.state.reality).map(([key, value]) => <div className="parameter-row" key={key}><span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span><div className="parameter-track"><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></div><strong>{key === 'dimension' ? `D${value}` : `${value}%`}</strong></div>)}
          </div>
          {(progress.state.decisions.length >= 3 || progress.state.affection.observedBehavior >= 24) && <div className="affection-section"><span className="choice-prompt">AFFECTION.EXE · INTERPRETATION MODEL</span><div className="affection-grid">{Object.entries(progress.state.affection).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span><strong>{key === 'contradictionCount' ? value : `${value}%`}</strong></div>)}</div><p className="system-note">Connection is being modeled, not measured.</p></div>}
          {progress.bootAnomaliesDiscovered.length > 0 && <div className="anomaly-section"><span className="choice-prompt">INITIALIZATION ANOMALIES</span>{progress.bootAnomaliesDiscovered.map((anomaly) => <p key={anomaly}>{anomaly.toUpperCase()} · RETAINED FROM BOOT</p>)}</div>}
          <div className="memory-archive">
            <span className="choice-prompt">MEMORY ARCHIVE · {progress.state.memoryArchive.length.toString().padStart(2, '0')} FRAGMENTS</span>
            {progress.state.memoryArchive.length === 0 ? <p className="memory-empty">No fragments have been indexed.</p> : progress.state.memoryArchive.map((memory) => <article className={`memory-record memory-${memory.status}`} key={memory.id}>
              <div><strong>{memoryLabels[memory.id]}</strong><span>{memory.status.toUpperCase()} · {memory.discoveredIn.replace(/-/g, ' ').toUpperCase()}</span></div>
              <div className="memory-actions">
                {(['preserve', 'archive', 'erase', 'reconstruct'] as MemoryAction[]).map((action) => <button key={action} disabled={!canApplyMemoryAction(progress.state.memoryArchive, memory.id, action, progress.state.clues)} onClick={() => onMemoryAction(memory.id, action)}>{action}</button>)}
              </div>
            </article>)}
          </div>
        </>}
        {!fictionalCorruption && <div className="record-details">
          <div><span className="choice-prompt">MEMORY FRAGMENTS</span><p>{progress.state.memories.length ? progress.state.memories.join(' · ') : 'NONE RETAINED'}</p></div>
          <div><span className="choice-prompt">CLUES RETAINED</span><p>{progress.allClues.length ? progress.allClues.join(' · ') : 'NO FRAGMENTS FOUND'}</p></div>
          <div><span className="choice-prompt">ENDINGS REMEMBERED</span><p>{progress.discoveredEndings.length ? progress.discoveredEndings.map((id: EndingId) => endings[id]?.title ?? id).join(' · ') : 'NONE YET'}</p></div>
        </div>}
        {fictionalCorruption ? <div className="corrupted-archive" aria-hidden="true">SCENE INDEX / 0? → ?0 → E.V.E. / RECORD DOES NOT RECALL</div> : <div className="archive-section">
          <span className="choice-prompt">SCENE ARCHIVE</span>
          <div className="archive-list">
            {scenes.map((sceneId, index) => <button key={sceneId} onClick={() => { onReview(sceneId); onClose(); }}><span>0{index + 1}</span>{sceneId.replace(/-/g, ' ').toUpperCase()}</button>)}
          </div>
        </div>}
        <p className="system-note">{fictionalCorruption ? 'PRESENTATION ERROR. NARRATIVE RECORDS REMAIN INTACT.' : 'All records are stored in this browser. No transmission leaves this device.'}</p>
      </section>
    </div>
  );
}