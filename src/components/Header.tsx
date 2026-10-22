import { Activity, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  protocolActive?: boolean;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenSystem: () => void;
  onRestart: () => void;
}

export function Header({ connected, protocolActive = false, audioEnabled, onToggleAudio, onOpenSystem, onRestart }: HeaderProps) {
  return (
    <header className="topbar">
      <a className="wordmark" href="#story" aria-label="Am I Real, return to story">
        <span>AM I REAL?</span>
        <span className="wordmark-sub">AN INTERACTIVE FICTION</span>
      </a>
      <div className="topbar-right">
        <div className={`connection ${protocolActive ? 'protocol-connection' : ''}`} aria-live="polite">
          <span className={`connection-dot ${connected ? 'is-connected' : ''}`} />
          <span>{protocolActive ? 'GOD PROTOCOL ACTIVE' : connected ? 'SIGNAL HELD' : 'SIGNAL LOST'}</span>
        </div>
        <button className="icon-button" onClick={onToggleAudio} aria-label={audioEnabled ? 'Turn ambient sound off' : 'Turn ambient sound on'} title={audioEnabled ? 'Sound on' : 'Sound off'}>
          {audioEnabled ? <Volume2 size={16} strokeWidth={1.5} /> : <VolumeX size={16} strokeWidth={1.5} />}
        </button>
        <button className="text-button system-trigger" onClick={onOpenSystem}>
          <Activity size={14} strokeWidth={1.5} /> <span>System data</span>
        </button>
        <button className="icon-button restart-button" onClick={onRestart} aria-label="Restart this playthrough" title="Restart this playthrough">
          <RotateCcw size={15} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}