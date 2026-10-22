import { useEffect, useRef, useState } from 'react';

export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  useEffect(() => () => {
    nodesRef.current.forEach((node) => node.disconnect());
    void contextRef.current?.close();
  }, []);

  const toggle = async () => {
    if (enabled) {
      nodesRef.current.forEach((node) => node.disconnect());
      nodesRef.current = [];
      await contextRef.current?.suspend();
      setEnabled(false);
      return;
    }
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;
      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      await context.resume();
      const master = context.createGain();
      master.gain.value = 0.018;
      master.connect(context.destination);
      const frequencies = [55, 82.41, 110.1];
      const nodes: AudioNode[] = [master];
      frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const tone = context.createGain();
        oscillator.type = index === 1 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        tone.gain.value = index === 2 ? 0.28 : 0.5;
        oscillator.connect(tone).connect(master);
        oscillator.start();
        nodes.push(oscillator, tone);
      });
      nodesRef.current = nodes;
      setEnabled(true);
    } catch {
      setEnabled(false);
    }
  };

  return { enabled, toggle };
}