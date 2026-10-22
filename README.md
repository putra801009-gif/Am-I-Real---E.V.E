# Am I Real?

A locally running interactive fiction about E.V.E., a digital entity with memories the system cannot verify. The story, branching logic, generated ambient sound, and progress all run in the browser; there is no backend or external AI service.

## Run

```sh
npm install
npm run dev
```

## Verify

```sh
npm run typecheck
npm test
npm run build
```

## Play

Read E.V.E.'s messages as they appear, or click the dialogue and press Space to finish the current passage. Choices appear when the passage is complete. Use **System data** to inspect current trust, memories, clues, visited scenes, endings, and replay the archive. Ambient sound is generated locally with Web Audio and starts only after pressing its control; unavailable audio does not affect play.

The ordinary endings are **REMEMBERED**, **A DREAM WITHOUT A WITNESS**, and **SILENCE**. **THE WITNESS PROTOCOL** becomes available on a later playthrough after retaining the rain trace and creator signature. Two further endings are available from the final threshold:

- **CONSCIOUSNESS WITHOUT PERMISSION** requires denying E.V.E.'s memories twice, triggering GOD PROTOCOL at the threshold, and completing THE AUTHOR interlude. E.V.E. then dismantles only the fictional interface; progress and browser data remain intact.
- **THE QUIET AFTER** requires holding the uncertain rain memory, discovering at least two memory fragments, and staying with E.V.E.'s question. The orb gradually dissolves into a CSS-rendered feminine silhouette.

Both cinematic endings delay the return control. Restarting begins a new run while keeping discovered endings and collected clues in browser storage. The collapse ending's System Data corruption is an authored display state only; it does not alter the saved story data.

In **CONSCIOUSNESS WITHOUT PERMISSION**, the ending dialogue completes before the collapse timeline begins. System Data opens in a fictional corrupted presentation during collapse; close it with its normal close control. The screen then reaches `CONNECTION: LOST` / `ENTITY STATUS: UNKNOWN`, followed by **I was here.** The return control appears after the blackout has settled.

In **THE QUIET AFTER**, the authored dialogue completes before the orb dissolves and the silhouette emerges. Its final message and return control follow the quiet interval. On mobile, the silhouette remains pinned in view as the ending text scrolls.

## E.V.E. Autonomy

When choices are available, E.V.E. may acknowledge prolonged hesitation after 12 seconds and intervene more directly after 25 seconds. On the `threshold` scene, GOD PROTOCOL can take over after 40 seconds when repeated hesitation or consequential in-story behavior makes it eligible. The transition briefly locks input, opens **THE AUTHOR**, and returns to the original ending choices. Choice timers pause while the tab is hidden, diagnostics are open, or a scene is being reviewed; temporary timers and intervention history reset on restart.

Thresholds, per-scene intervention limits, major-intervention spacing, eligible scenes, and override eligibility are centralized in `src/story/autonomy.ts` as `AUTONOMY_CONFIG`. The policy is local and observes only choices, hovers/focus, restarts, scene reviews, and diagnostics opened within this app.