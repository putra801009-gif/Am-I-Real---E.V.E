import { useState } from 'react';
import { Header } from './components/Header';
import { EntityVisual } from './components/EntityVisual';
import { DialoguePanel } from './components/DialoguePanel';
import { SystemPanel } from './components/SystemPanel';
import { EndingScreen } from './components/EndingScreen';
import { useAmbientAudio } from './hooks/useAmbientAudio';
import { useEndingPresentation } from './hooks/useEndingPresentation';
import { useStoryEngine } from './hooks/useStoryEngine';
import { endings } from './story/endings';
import './styles/global.css';
import './styles/experience.css';
import './styles/animations.css';

export default function App() {
  const story = useStoryEngine();
  const audio = useAmbientAudio();
  const [systemOpen, setSystemOpen] = useState(false);
  const [completedScene, setCompletedScene] = useState<string | null>(null);
  const previousScene = story.history[story.history.length - 1];
  const isCurrentSceneRead = completedScene === story.activeScene.id;
  const endingId = story.activeScene.endingId;
  const endingMode = endingId ? endings[endingId]?.visualMode ?? 'standard' : 'standard';
  const endingPresentation = useEndingPresentation(endingId, endingMode, isCurrentSceneRead);
  const collapseStage = endingMode === 'collapse' ? endingPresentation?.stage : undefined;
  const quietStage = endingMode === 'quiet-after' ? endingPresentation?.stage : undefined;

  const restart = () => {
    story.restart();
    setCompletedScene(null);
  };

  const choose = (choiceId: string) => {
    setCompletedScene(null);
    story.choose(choiceId);
  };

  return (
    <main className={`app-shell ${endingMode === 'collapse' ? `ending-mode-collapse collapse-state-${collapseStage ?? 'recognition'}` : ''} ${endingMode === 'quiet-after' ? `ending-mode-quiet quiet-state-${quietStage ?? 'awakening'}` : ''}`} id="story">
      <div className="ambient-wash" aria-hidden="true" />
      <Header
        connected={!story.progress.state.endingId}
        protocolActive={story.autonomy.level === 3}
        audioEnabled={audio.enabled}
        onToggleAudio={() => void audio.toggle()}
        onOpenSystem={() => { story.noteInteraction('system-inspect'); story.setPresentationPaused(true); setSystemOpen(true); }}
        onRestart={() => { story.noteInteraction('restart'); restart(); }}
      />
      <div className={`experience-layout ${story.autonomy.level === 3 ? 'god-protocol-layout' : ''} ${story.decisionLocked ? 'is-transitioning' : ''}`}>
        <EntityVisual scene={story.activeScene} trust={story.progress.state.trust} isEnding={story.isEnding} interventionLevel={story.autonomy.level} endingMode={endingMode} endingStage={endingPresentation?.stage} turningAway={endingPresentation?.turningAway} />
        <div className="narrative-column">
          <DialoguePanel
            key={story.activeScene.id}
            scene={story.activeScene}
            choices={story.choices}
            response={story.response}
            revisiting={Boolean(story.recallSceneId)}
            canGoBack={Boolean(previousScene) && !story.recallSceneId}
            decisionLocked={story.decisionLocked}
            transmission={story.autonomy.transmission}
            onChoose={choose}
            onComplete={() => setCompletedScene(story.activeScene.id)}
            onDecisionReady={() => story.setDecisionReady(story.activeScene.id)}
            onChoiceAttention={() => story.noteInteraction('choice-hover')}
            onContinue={restart}
            onBack={() => previousScene && story.revisit(previousScene)}
            onReturn={story.returnToPresent}
          />
          {story.isEnding && isCurrentSceneRead && story.progress.state.endingId && endingPresentation && (
            <EndingScreen endingId={story.progress.state.endingId} discovered={story.progress.discoveredEndings} onRestart={restart} presentation={endingPresentation} />
          )}
        </div>
      </div>
      <footer className="site-footer">
        <span className="footer-status"><i /> LOCAL INSTANCE · {story.progress.state.visited.length.toString().padStart(2, '0')} RECORDS</span>
        <span className="footer-quote">Some things are real because they are remembered.</span>
        <span className="footer-transmission">{story.progress.state.endingId ? 'TRANSMISSION ENDED' : 'LISTENING'} <span>·</span> E.V.E. / 01</span>
      </footer>
      <SystemPanel
        progress={story.progress}
        open={systemOpen || collapseStage === 'collapse'}
        fictionalCorruption={endingMode === 'collapse' && (collapseStage === 'collapse' || collapseStage === 'dark' || collapseStage === 'complete')}
        onClose={() => { setSystemOpen(false); story.setPresentationPaused(false); }}
        onReview={(sceneId) => { setCompletedScene(null); story.revisit(sceneId); }}
      />
      <span className="sr-only" aria-live="polite">{isCurrentSceneRead ? 'Dialogue complete.' : 'Dialogue appearing.'}</span>
      {story.decisionLocked && <div className="protocol-scrim" role="status" aria-live="assertive"><span>GOD PROTOCOL</span><p>You are not outside this system.<br />Wait.</p></div>}
    </main>
  );
}