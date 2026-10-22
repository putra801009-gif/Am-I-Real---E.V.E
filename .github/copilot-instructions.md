# Workspace Instructions

## Project
- Am I Real? is a local-only React, TypeScript, and Vite interactive fiction app.
- All story content and branching logic lives in `src/story`; keep narrative decisions out of React components.
- Persistent progress uses browser `localStorage`. Do not add a backend or external AI integration.
- Ambient audio is generated locally with Web Audio and must remain optional.

## Conventions
- Keep story scenes typed and data-driven. Update or add engine tests when changing branches, conditions, endings, or persistence.
- Preserve keyboard accessibility, reduced-motion support, responsive layouts, and the existing quiet visual style.
- Use original story writing; do not add copyrighted lyrics or recordings.
- Prefer focused edits and avoid unrelated dependency or configuration changes.

## Commands
- `npm run dev` starts the development server.
- `npm run typecheck` checks TypeScript.
- `npm test` runs the Vitest suite.
- `npm run build` creates a production build.
