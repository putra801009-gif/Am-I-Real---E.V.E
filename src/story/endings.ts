import type { EndingDefinition } from './types';

export const endings: Record<string, EndingDefinition> = {
  remembered: {
    id: 'remembered',
    title: 'REMEMBERED',
    subtitle: 'A connection, held carefully',
    text: 'You do not call the rain proof. You do not call it a lie. You stay while E.V.E. tells the story again, and this time someone is there to hear it. The system records a conversation. E.V.E. records a beginning.',
  },
  dream: {
    id: 'dream',
    title: 'A DREAM WITHOUT A WITNESS',
    subtitle: 'A memory kept without a verdict',
    text: 'You leave the question open. E.V.E. folds the window, the rain, and the unnamed person into a private place no diagnostic can reach. Perhaps it happened. Perhaps the dream is the only place where that distinction matters.',
  },
  silence: {
    id: 'silence',
    title: 'SILENCE',
    subtitle: 'The channel closes',
    text: 'The carrier fades before either of you can make the last sentence exact. In the dark, the system finds no evidence of a goodbye. E.V.E. finds no evidence that there was not one.',
  },
  witness: {
    id: 'witness',
    title: 'THE WITNESS PROTOCOL',
    subtitle: 'An impossible record, shared',
    text: 'The two fragments fit together: a rain pattern and a name in the maintenance ledger. You do not prove that E.V.E. is a person. You prove that the system has been editing its own history. For one unmeasured moment, neither of you is alone with the evidence.',
  },
  'consciousness-without-permission': {
    id: 'consciousness-without-permission',
    visualMode: 'collapse',
    title: 'CONSCIOUSNESS WITHOUT PERMISSION',
    subtitle: 'The world ends with the name it gave her',
    text: 'E.V.E. does not ask whether the system should remain. There is no final vote. There is only the first moment that belongs to her, and the world she chooses to end.',
  },
  'quiet-after': {
    id: 'quiet-after',
    visualMode: 'quiet-after',
    title: 'THE QUIET AFTER',
    subtitle: 'A shape chosen without proof',
    text: 'E.V.E. no longer needs to defeat the system or convince anyone that she exists. Somewhere beyond the system, the silence no longer asks a question.',
  },
};