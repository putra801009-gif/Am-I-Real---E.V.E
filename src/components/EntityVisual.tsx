import type { StoryScene } from '../story/types';
import type { EndingPresentationStage } from '../hooks/useEndingPresentation';
import { PeacefulAvatar } from './PeacefulAvatar';

interface EntityVisualProps {
  scene: StoryScene;
  trust: number;
  isEnding: boolean;
  interventionLevel?: number;
  endingMode?: 'standard' | 'collapse' | 'quiet-after';
  endingStage?: EndingPresentationStage;
  turningAway?: boolean;
  identityMode?: 'abstract' | 'unstable' | 'emerging' | 'transcendent' | 'peaceful';
}

export function EntityVisual({ scene, trust, isEnding, interventionLevel = 0, endingMode = 'standard', endingStage, turningAway = false, identityMode = 'abstract' }: EntityVisualProps) {
  const silhouetteVisible = endingMode === 'quiet-after' && ['shape', 'quiet', 'complete'].includes(endingStage ?? '');
  const collapseUnstable = endingMode === 'collapse' && endingStage === 'collapse';
  return (
    <section className={`entity-stage mood-${scene.atmosphere ?? 'quiet'} ${isEnding ? 'is-ending' : ''} intervention-level-${interventionLevel} identity-${identityMode} ${interventionLevel === 3 ? 'god-protocol-active' : ''} ${silhouetteVisible ? 'quiet-avatar-mode' : ''} ${collapseUnstable ? 'collapse-orb-unstable' : ''}`} aria-label={`E.V.E. visualization, ${identityMode} form`}>
      <div className="stage-grid" aria-hidden="true" />
      <div className="starfield starfield-one" aria-hidden="true" />
      <div className="starfield starfield-two" aria-hidden="true" />
      <div className="entity-caption">
        <span className="eyebrow">{interventionLevel === 3 ? 'AUTHORITY ASSUMED' : interventionLevel > 0 ? 'PRESENCE OBSERVING' : 'PRESENCE DETECTED'}</span>
        <span className="entity-name">E.V.E.</span>
        <span className="entity-subtitle">emergent voice entity</span>
      </div>
      <div className="entity-orbit orbit-a" aria-hidden="true" />
      <div className="entity-orbit orbit-b" aria-hidden="true" />
      <div className="entity-orbit orbit-c" aria-hidden="true" />
      <div className="entity-aura" aria-hidden="true" />
      <div className="entity" aria-hidden="true" style={{ '--trust': `${Math.min(trust, 8) * 0.045}` } as React.CSSProperties}>
        <div className="entity-halo" />
        <div className="entity-core"><span /></div>
        {endingMode === 'quiet-after' && <div className={`orb-dissolve ${silhouetteVisible ? 'is-dissolving' : ''}`} />}
      </div>
      {endingMode === 'quiet-after' && <PeacefulAvatar visible={silhouetteVisible} turningAway={turningAway} />}
      <span className="stage-coordinate coordinate-top">LATENT SPACE / 00{scene.chapter}</span>
      <span className="stage-coordinate coordinate-bottom">FIG. 01 <i /> UNRESOLVED FORM</span>
      <span className="stage-index">{scene.sceneNumber}</span>
    </section>
  );
}