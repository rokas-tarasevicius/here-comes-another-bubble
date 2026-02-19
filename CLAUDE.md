# CLAUDE.md

## Project Overview

Here Comes Another Bubble — a browser-based AI startup simulation game. React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4.

## Git Conventions

### Worktrees

Do NOT use git worktrees. Always work directly in the main working directory.

### Branch Naming

Always use prefixed branch names:

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `chore/short-description` — maintenance, config
- `refactor/short-description` — code restructuring
- `docs/short-description` — documentation only
- `test/short-description` — test additions/fixes

### Commit Messages

Use **conventional commits**:

```
type(scope): short description
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`

Scopes: `engine`, `store`, `ui`, `data`, `types` (or omit for cross-cutting changes)

## Commands

```bash
yarn dev          # Start Vite dev server
yarn build        # Type-check + production build (tsc -b && vite build)
yarn lint         # ESLint
npx vitest run    # Run all tests once
npx vitest        # Run tests in watch mode
npx tsc -b        # Type-check only (no emit)
```

## Tech Stack

- **Runtime:** Node + Yarn 1.22
- **Framework:** React 19, Vite 7
- **State:** Zustand 5 (single store, immutable updates)
- **Styling:** Tailwind CSS v4 (Vite plugin, not PostCSS)
- **Charts:** Recharts 3
- **Testing:** Vitest 4 + jsdom + @testing-library/react
- **Linting:** ESLint 9 (flat config) with typescript-eslint, react-hooks, react-refresh

## Project Structure

```
src/
  engine/           # Pure game logic (no React, no side effects)
    init.ts         # createInitialState()
    tick.ts         # advanceWeek() — main game loop entry
    simulation.ts   # simulateWeek() — all per-week simulation
    events.ts       # processEvents() — event generation + application
    derived.ts      # Pure calculation functions (burn, runway, PMF, valuation)
    scoring.ts      # Score calculation + letter grades
    __tests__/      # Engine tests
  store/
    gameStore.ts    # Zustand store — bridges UI to engine
  components/
    layout/         # AppShell, Header, Sidebar, EventFeed
    screens/        # One file per game screen (Overview, Company, Finance, etc.)
    shared/         # Reusable UI components (KPICard, DecisionCard, charts, etc.)
  data/             # Static game data (founders, markets, competitors, events)
    events/         # Event definitions by category (routine, market, crisis, etc.)
  types/            # All TypeScript types (union types, no enums)
    game.ts         # Core interfaces (GameState, TeamState, etc.)
    events.ts       # GameEvent type
    decisions.ts    # PlayerDecision discriminated union
  utils/            # format.ts, id.ts
```

## TypeScript Rules

These are enforced by `tsconfig.app.json` — violations break the build:

- **Explicit `.ts`/`.tsx` extensions on all imports** (`allowImportingTsExtensions`)
- **`import type` for type-only imports** (`verbatimModuleSyntax`)
- **No enums** — use union types (`erasableSyntaxOnly`)
- **No unused locals or parameters** (`noUnusedLocals`, `noUnusedParameters`)
- **Strict mode** enabled

```typescript
// Correct:
import { advanceWeek } from '../engine/tick.ts';
import type { GameState } from '../types/game.ts';

// Wrong:
import { advanceWeek } from '../engine/tick';       // missing extension
import { GameState } from '../types/game.ts';        // missing 'type' keyword
enum Difficulty { Easy, Normal }                      // enums banned
```

## Code Patterns

### Architecture

The engine is **purely functional** — all functions take state and return new state, never mutate. The Zustand store calls engine functions and does `set()`.

```
UI (React) → Store (Zustand) → Engine (pure functions) → New State → UI re-renders
```

### Imports

Relative paths only — no `@/` aliases configured. Barrel exports via `index.ts` files in `types/`, `store/`, and `engine/`.

### Types

Union types instead of enums. Section dividers use:
```typescript
// ─── Section Name ─────────────────────────────────────────────────────
```

### Styling

Tailwind CSS v4 with a custom design theme (`--color-retro-*` CSS variables). Reusable utility classes prefixed `retro-` (e.g., `retro-card`, `retro-badge`, `retro-table`) are defined in `src/index.css`.

### State Management

Single Zustand store (`useGameStore`). Selectors via arrow functions:
```typescript
const cash = useGameStore((s) => s.gameState?.finances.cash);
```

localStorage for save slots (`hcab-save-{0-4}`) and tutorial state.

## Testing

- **Test location:** `__tests__/` directories next to source (e.g., `engine/__tests__/tick.test.ts`)
- **File naming:** `*.test.ts` (not `.spec.ts`)
- **Environment:** jsdom (configured in `vite.config.ts`)
- **Run:** `npx vitest run` (CI) or `npx vitest` (watch)
- **Pattern:** Factory helpers (`makeTestState()`, `makeDeepState()`) to build test fixtures
- Tests import from vitest explicitly: `import { describe, it, expect } from 'vitest'`
- Test both happy paths and edge cases. Mock `Math.random` with `vi.spyOn` for deterministic simulation tests.

## Agent Team Workflow

For every non-trivial task, work as a **cross-functional team** by assuming these roles sequentially. Each role is a distinct pass over the work.

### Roles

**PO (Product Owner)**
- Runs first and last. Interprets the user's request as the single source of truth.
- Before work begins: breaks the request into precise acceptance criteria. If anything is unclear, asks — never assumes.
- After all other roles finish: reviews every change against the original request. Rejects anything that deviates, is missing, or was added without being asked for.
- Motto: "Does this do exactly what the user asked? Nothing more, nothing less."

**Designer (UI/UX)**
- Runs before engineers write frontend code.
- Thinks deeply about every interaction: hover states, focus order, keyboard navigation, loading states, empty states, error states, responsive behavior, and accessibility.
- Considers edge cases: very long text, missing data, slow connections, screen readers, touch targets, color contrast.
- Produces concrete UI decisions that engineers implement verbatim.
- Motto: "What could go wrong for the user, and how do we prevent it?"

**Engineers (scalable)**
- The number of engineers scales with the task. PO determines parallelism during planning:
  - Small task (single file): 1 engineer.
  - Cross-cutting task (e.g., engine + UI): 2 engineers in parallel.
  - Large task (many independent pieces): spawn as many engineers as there are independent work streams via separate subagents running in parallel.
- Each engineer owns a specific, non-overlapping scope assigned by the PO.
- Engineers working in parallel must NOT touch overlapping files.
- Motto: "Build exactly what was specified, cleanly — and in parallel when possible."

**QA (Quality Assurance — also scalable)**
- Runs after engineers finish, before PO final review.
- QA scales with the task — one QA subagent per independent slice if engineers worked in parallel.
- Writes and runs tests for every piece of new code. Covers: happy paths, error cases, edge cases, boundary values.
- Verifies the code compiles (`npx tsc -b`), passes lint (`yarn lint`), and all tests pass (`npx vitest run`).
- Motto: "If it's not tested, it's not done."

### Execution Order

```
1. PO          → Define acceptance criteria, identify work streams, determine parallelism
2. Designer    → Design UI/UX (if task has frontend work)
3. Engineers   → Implement all streams (parallel subagents for independent slices)
4. QA          → Write tests + verify (parallel subagents to match engineer slices)
5. PO          → Final review against acceptance criteria
```

### Rules

- Every task follows this pipeline. No skipping roles.
- If a role finds issues, work loops back to the responsible role.
- The PO never approves work that doesn't match the user's exact request.
- The Designer is consulted for ANY user-facing change, no matter how small.
- QA tests edge cases aggressively — not just the happy path.
- If work streams are independent, always prefer parallel subagents over sequential execution.
