# Here Comes Another Bubble — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete browser-based startup simulation game set in the 2026 AI boom, focused on data-driven decision making.

**Architecture:** State machine engine where the entire game is a single serializable `GameState` object. Each week is a tick: player decides, engine simulates, events fire, state updates, UI re-renders. Pure functions transform state. React renders the dashboard UI.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind CSS, Zustand (state management), Recharts (charts), Vitest (testing), localStorage (saves)

**Design Doc:** `docs/plans/2026-02-16-game-design.md`

---

## Phase 1: Foundation (Sequential)

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Step 1: Initialize Vite project**

```bash
cd /Users/rokas/here-comes-another-bubble
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, overwrite. This creates the base React+TS scaffold.

**Step 2: Install dependencies**

```bash
npm install zustand recharts
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Configure Tailwind**

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Step 4: Configure Vitest**

Add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Add to `tsconfig.app.json` compilerOptions:

```json
"types": ["vitest/globals"]
```

**Step 5: Create directory structure**

```bash
mkdir -p src/{engine,types,components/{layout,screens,shared},data,hooks,store,utils,test}
```

**Step 6: Verify it runs**

```bash
npm run dev
```

Open browser, confirm React app loads.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold project with Vite, React, TypeScript, Tailwind, Vitest"
```

---

### Task 2: Core Type Definitions

**Files:**
- Create: `src/types/game.ts` — All game state interfaces
- Create: `src/types/events.ts` — Event system types
- Create: `src/types/decisions.ts` — Player decision types
- Create: `src/types/index.ts` — Barrel export

**Step 1: Write game state types**

Create `src/types/game.ts`:

```typescript
// === META ===
export type Tone = 'realistic' | 'satirical' | 'mixed'
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface GameMeta {
  week: number
  year: number
  month: number
  day: number
  difficulty: Difficulty
  tone: Tone
  gameOver: boolean
  score: number
}

// === FOUNDER ===
export type FounderArchetype = 'technical' | 'business' | 'serial' | 'bigtech' | 'freshgrad'

export interface FounderProfile {
  name: string
  archetype: FounderArchetype
  techSkill: number    // 1-10
  bizSkill: number     // 1-10
  network: number      // 1-10
  reputation: number   // 0-100
  learning: number     // multiplier for skill growth
}

// === COMPANY ===
export type CompanyStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c' | 'ipo'

export interface CompanyState {
  name: string
  stage: CompanyStage
  valuation: number
  culture: {
    aiForward: number      // 0-100, how AI-embracing the culture is
    workLifeBalance: number // 0-100
    innovation: number      // 0-100
    transparency: number    // 0-100
  }
  reputation: number       // 0-100, public perception
  weekFounded: number
}

// === TEAM ===
export type EmployeeRole = 'engineer' | 'designer' | 'sales' | 'marketing' | 'ops'

export interface Employee {
  id: string
  name: string
  role: EmployeeRole
  skill: number        // 1-10
  salary: number       // weekly
  morale: number       // 0-100
  loyalty: number      // 0-100
  aiSentiment: number  // -100 to 100, how they feel about AI coworkers
  weekHired: number
  assignedTo: string | null  // feature ID or null
}

export type AIAgentType = 'coding' | 'support' | 'marketing' | 'analysis'

export interface AIAgent {
  id: string
  name: string
  type: AIAgentType
  provider: string      // fictional company name
  capability: number    // 1-10
  costPerWeek: number
  reliability: number   // 0-100 (100 = never hallucinates)
  assignedTo: string | null
}

export interface TeamState {
  employees: Employee[]
  aiAgents: AIAgent[]
  hiringPipeline: HiringCandidate[]
  avgMorale: number     // derived but cached for performance
}

export interface HiringCandidate {
  id: string
  name: string
  role: EmployeeRole
  skill: number
  salaryExpectation: number
  weeksToDecide: number  // turns before they take another offer
}

// === PRODUCT ===
export type FeatureStatus = 'planned' | 'in-progress' | 'shipped' | 'deprecated'

export interface Feature {
  id: string
  name: string
  description: string
  status: FeatureStatus
  progress: number      // 0-100
  quality: number       // 0-100
  techDebt: number      // 0-100
  marketRelevance: number // 0-100, how much the market wants this
  assignedEmployees: string[]  // employee IDs
  assignedAgents: string[]     // agent IDs
}

export interface ProductState {
  name: string
  features: Feature[]
  overallQuality: number   // derived
  techDebtTotal: number    // derived
  pmfScore: number         // 0-100, product-market fit
  customers: number
  churnRate: number        // weekly churn percentage
  bugs: number             // active bug count
}

// === FINANCES ===
export type PricingModel = 'freemium' | 'subscription' | 'enterprise' | 'usage-based'
export type FundingStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c'

export interface FundingRound {
  stage: FundingStage
  amount: number
  valuation: number
  dilution: number       // percentage
  investorName: string
  weekClosed: number
}

export interface FinancialState {
  cash: number
  weeklyRevenue: number
  weeklyBurn: number
  pricingModel: PricingModel
  pricePerUnit: number
  fundingHistory: FundingRound[]
  founderEquity: number    // percentage remaining
  monthlyExpenses: {
    salaries: number
    aiAgents: number
    rent: number
    cloud: number
    marketing: number
    other: number
  }
}

// === MARKET ===
export type MarketSegment = 'coding' | 'support' | 'creative' | 'healthcare' | 'legal' | 'education'

export interface MarketSegmentData {
  id: MarketSegment
  name: string
  size: number           // total addressable market in $
  growthRate: number     // weekly growth multiplier
  competitionIntensity: number // 0-100
  regulatoryRisk: number      // 0-100
  customerDemand: FeatureDemand[]
}

export interface FeatureDemand {
  featureName: string
  importance: number    // 0-100
}

export interface Competitor {
  id: string
  name: string
  segment: MarketSegment
  funding: number
  teamSize: number
  productQuality: number
  marketShare: number
  strategy: 'aggressive' | 'steady' | 'pivot-happy' | 'acqui-target'
  alive: boolean
}

export interface MarketState {
  segment: MarketSegment
  segmentData: MarketSegmentData
  competitors: Competitor[]
  bubbleIndex: number    // 0-100
  bubbleTrend: number    // positive = inflating, negative = deflating
  talentMarketHeat: number // 0-100, affects hiring costs
  investorSentiment: number // 0-100
}

// === COMBINED STATE ===
export interface GameState {
  meta: GameMeta
  founder: FounderProfile
  company: CompanyState
  team: TeamState
  product: ProductState
  finances: FinancialState
  market: MarketState
  eventLog: EventLogEntry[]
  pendingDecisions: PendingDecision[]
  weekHistory: WeekSummary[]
}

export interface WeekSummary {
  week: number
  cash: number
  revenue: number
  burn: number
  teamSize: number
  pmf: number
  valuation: number
  bubbleIndex: number
}

export interface EventLogEntry {
  id: string
  week: number
  category: 'slack' | 'news' | 'investor' | 'alert' | 'system'
  title: string
  message: string
  tone: Tone
  hasDecision: boolean
  decisionId?: string
}

export interface PendingDecision {
  id: string
  eventId: string
  title: string
  description: string
  options: DecisionOption[]
  deadline: number  // week by which you must decide, or auto-resolves
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface DecisionOption {
  id: string
  label: string
  description: string
  effects: StateEffect[]
}

export interface StateEffect {
  target: string    // dot-path like "finances.cash" or "team.avgMorale"
  operation: 'add' | 'subtract' | 'multiply' | 'set'
  value: number
  description: string  // human readable: "+$50,000 cash"
}
```

**Step 2: Write event types**

Create `src/types/events.ts`:

```typescript
import { Tone, GameState } from './game'

export type EventCategory = 'routine' | 'market' | 'crisis' | 'opportunity' | 'ai-specific'

export interface GameEvent {
  id: string
  category: EventCategory
  title: Record<Tone, string>
  message: Record<Tone, string>
  feedCategory: 'slack' | 'news' | 'investor' | 'alert'
  // Condition function: returns true if this event can fire given current state
  condition: (state: GameState) => boolean
  // Weight for random selection (higher = more likely)
  weight: number
  // If true, this event requires a player decision
  requiresDecision: boolean
  // Decision options (if requiresDecision is true)
  options?: {
    label: Record<Tone, string>
    description: Record<Tone, string>
    effects: {
      target: string
      operation: 'add' | 'subtract' | 'multiply' | 'set'
      value: number | ((state: GameState) => number)
      description: string
    }[]
  }[]
  // One-time or repeatable
  unique: boolean
  // Minimum weeks between repeats (for non-unique events)
  cooldown?: number
}
```

**Step 3: Write decision types**

Create `src/types/decisions.ts`:

```typescript
export type DecisionType =
  | 'hire-employee'
  | 'fire-employee'
  | 'hire-ai-agent'
  | 'remove-ai-agent'
  | 'assign-team'
  | 'start-feature'
  | 'set-pricing'
  | 'start-fundraising'
  | 'accept-term-sheet'
  | 'set-marketing-budget'
  | 'pivot-market'
  | 'respond-to-event'
  | 'set-strategy'
  | 'pay-tech-debt'

export interface PlayerDecision {
  type: DecisionType
  payload: Record<string, unknown>
  week: number
}

// Specific decision payloads
export interface HireEmployeeDecision extends PlayerDecision {
  type: 'hire-employee'
  payload: { candidateId: string }
}

export interface FireEmployeeDecision extends PlayerDecision {
  type: 'fire-employee'
  payload: { employeeId: string }
}

export interface HireAIAgentDecision extends PlayerDecision {
  type: 'hire-ai-agent'
  payload: { agentType: string; provider: string }
}

export interface AssignTeamDecision extends PlayerDecision {
  type: 'assign-team'
  payload: { memberId: string; featureId: string | null }
}

export interface StartFeatureDecision extends PlayerDecision {
  type: 'start-feature'
  payload: { featureName: string; description: string }
}

export interface SetPricingDecision extends PlayerDecision {
  type: 'set-pricing'
  payload: { model: string; price: number }
}

export interface StartFundraisingDecision extends PlayerDecision {
  type: 'start-fundraising'
  payload: { targetStage: string; targetAmount: number }
}

export interface RespondToEventDecision extends PlayerDecision {
  type: 'respond-to-event'
  payload: { decisionId: string; optionId: string }
}
```

**Step 4: Create barrel export**

Create `src/types/index.ts`:

```typescript
export * from './game'
export * from './events'
export * from './decisions'
```

**Step 5: Verify types compile**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/types/ && git commit -m "feat: add complete type definitions for game state, events, and decisions"
```

---

### Task 3: Game Engine Core

**Files:**
- Create: `src/engine/tick.ts` — Main tick cycle
- Create: `src/engine/simulation.ts` — Core simulation rules
- Create: `src/engine/events.ts` — Event selection and resolution
- Create: `src/engine/derived.ts` — Derived metric calculators
- Create: `src/engine/index.ts` — Barrel export
- Test: `src/engine/__tests__/tick.test.ts`
- Test: `src/engine/__tests__/derived.test.ts`

**Step 1: Write derived metric calculators**

Create `src/engine/derived.ts`:

```typescript
import { GameState } from '../types'

export function calculateRunway(state: GameState): number {
  if (state.finances.weeklyBurn <= 0) return Infinity
  return Math.floor(state.finances.cash / state.finances.weeklyBurn)
}

export function calculateWeeklyBurn(state: GameState): number {
  const salaries = state.team.employees.reduce((sum, e) => sum + e.salary, 0)
  const aiCosts = state.team.aiAgents.reduce((sum, a) => sum + a.costPerWeek, 0)
  const { rent, cloud, marketing, other } = state.finances.monthlyExpenses
  const weeklyFixed = (rent + cloud + marketing + other) / 4
  return salaries + aiCosts + weeklyFixed
}

export function calculateTeamVelocity(state: GameState): number {
  const humanVelocity = state.team.employees
    .filter(e => e.role === 'engineer' || e.role === 'designer')
    .reduce((sum, e) => sum + (e.skill * e.morale / 100), 0)

  const aiVelocity = state.team.aiAgents
    .filter(a => a.type === 'coding')
    .reduce((sum, a) => sum + (a.capability * a.reliability / 100) * 1.5, 0)

  return humanVelocity + aiVelocity
}

export function calculatePMF(state: GameState): number {
  const features = state.product.features.filter(f => f.status === 'shipped')
  if (features.length === 0) return 0

  const demands = state.market.segmentData.customerDemand
  let totalMatch = 0
  let totalDemand = 0

  for (const demand of demands) {
    totalDemand += demand.importance
    const matchingFeature = features.find(f =>
      f.name.toLowerCase().includes(demand.featureName.toLowerCase())
    )
    if (matchingFeature) {
      totalMatch += (demand.importance * matchingFeature.quality / 100)
    }
  }

  return totalDemand > 0 ? Math.round((totalMatch / totalDemand) * 100) : 0
}

export function calculateAvgMorale(state: GameState): number {
  const employees = state.team.employees
  if (employees.length === 0) return 100
  return Math.round(employees.reduce((sum, e) => sum + e.morale, 0) / employees.length)
}

export function calculateValuation(state: GameState): number {
  const arr = state.finances.weeklyRevenue * 52
  const bubbleMultiplier = 1 + (state.market.bubbleIndex / 50) // 1x at 0, 3x at 100
  const pmfMultiplier = 1 + (state.product.pmfScore / 100)
  const baseMultiple = 15 // typical AI startup ARR multiple

  const revenueValuation = arr * baseMultiple * bubbleMultiplier * pmfMultiplier
  const lastRoundValuation = state.finances.fundingHistory.length > 0
    ? state.finances.fundingHistory[state.finances.fundingHistory.length - 1].valuation
    : 0

  return Math.max(revenueValuation, lastRoundValuation)
}
```

**Step 2: Write test for derived metrics**

Create `src/engine/__tests__/derived.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateRunway, calculateWeeklyBurn, calculateAvgMorale } from '../derived'
import { createInitialState } from '../init'

describe('derived metrics', () => {
  it('calculates runway from cash and burn', () => {
    const state = createInitialState('Test Co', 'technical', 'coding', 'normal', 'realistic')
    state.finances.cash = 100000
    state.finances.weeklyBurn = 5000
    expect(calculateRunway(state)).toBe(20)
  })

  it('returns Infinity runway when burn is zero', () => {
    const state = createInitialState('Test Co', 'technical', 'coding', 'normal', 'realistic')
    state.finances.cash = 100000
    state.finances.weeklyBurn = 0
    expect(calculateRunway(state)).toBe(Infinity)
  })

  it('calculates average morale', () => {
    const state = createInitialState('Test Co', 'technical', 'coding', 'normal', 'realistic')
    state.team.employees = [
      { ...createEmployee('1', 'Alice', 'engineer'), morale: 80 },
      { ...createEmployee('2', 'Bob', 'engineer'), morale: 60 },
    ]
    expect(calculateAvgMorale(state)).toBe(70)
  })

  it('returns 100 morale when no employees', () => {
    const state = createInitialState('Test Co', 'technical', 'coding', 'normal', 'realistic')
    state.team.employees = []
    expect(calculateAvgMorale(state)).toBe(100)
  })
})

function createEmployee(id: string, name: string, role: 'engineer' | 'designer' | 'sales' | 'marketing' | 'ops') {
  return {
    id, name, role,
    skill: 5, salary: 3000, morale: 70, loyalty: 50,
    aiSentiment: 0, weekHired: 1, assignedTo: null,
  }
}
```

**Step 3: Write game initialization**

Create `src/engine/init.ts`:

```typescript
import { GameState, FounderArchetype, MarketSegment, Difficulty, Tone, Employee, MarketSegmentData, FeatureDemand, Competitor } from '../types'
import { FOUNDER_CONFIGS } from '../data/founders'
import { MARKET_CONFIGS } from '../data/markets'
import { generateCompetitors } from '../data/competitors'
import { generateId } from '../utils/id'

export function createInitialState(
  companyName: string,
  archetype: FounderArchetype,
  segment: MarketSegment,
  difficulty: Difficulty,
  tone: Tone
): GameState {
  const founder = FOUNDER_CONFIGS[archetype]
  const market = MARKET_CONFIGS[segment]
  const competitors = generateCompetitors(segment, difficulty)

  const startingEmployees: Employee[] = archetype === 'bigtech'
    ? [
        createStartingEmployee('Senior Engineer', 'engineer', 7, 4000),
        createStartingEmployee('Senior Engineer', 'engineer', 7, 4000),
      ]
    : []

  return {
    meta: {
      week: 1,
      year: 2026,
      month: 1,
      day: 6,  // first Monday of 2026
      difficulty,
      tone,
      gameOver: false,
      score: 0,
    },
    founder: {
      name: 'You',
      archetype,
      techSkill: founder.techSkill,
      bizSkill: founder.bizSkill,
      network: founder.network,
      reputation: founder.startingReputation,
      learning: founder.learningRate,
    },
    company: {
      name: companyName,
      stage: 'pre-seed',
      valuation: founder.startingCash * 10,
      culture: { aiForward: 50, workLifeBalance: 50, innovation: 50, transparency: 50 },
      reputation: 10,
      weekFounded: 1,
    },
    team: {
      employees: startingEmployees,
      aiAgents: [],
      hiringPipeline: [],
      avgMorale: 100,
    },
    product: {
      name: companyName,
      features: [],
      overallQuality: 0,
      techDebtTotal: 0,
      pmfScore: 0,
      customers: 0,
      churnRate: 0.05,
      bugs: 0,
    },
    finances: {
      cash: founder.startingCash,
      weeklyRevenue: 0,
      weeklyBurn: startingEmployees.reduce((s, e) => s + e.salary, 0),
      pricingModel: 'subscription',
      pricePerUnit: 0,
      fundingHistory: [],
      founderEquity: 100,
      monthlyExpenses: {
        salaries: startingEmployees.reduce((s, e) => s + e.salary, 0) * 4,
        aiAgents: 0,
        rent: difficulty === 'easy' ? 500 : difficulty === 'normal' ? 1000 : 2000,
        cloud: 200,
        marketing: 0,
        other: 100,
      },
    },
    market: {
      segment,
      segmentData: market,
      competitors,
      bubbleIndex: 60,    // start mid-bubble in 2026
      bubbleTrend: 2,     // slowly inflating
      talentMarketHeat: 70,
      investorSentiment: 75,
    },
    eventLog: [],
    pendingDecisions: [],
    weekHistory: [],
  }
}

function createStartingEmployee(name: string, role: 'engineer', skill: number, salary: number): Employee {
  return {
    id: generateId(),
    name,
    role,
    skill,
    salary,
    morale: 80,
    loyalty: 60,
    aiSentiment: 10,
    weekHired: 0,
    assignedTo: null,
  }
}
```

**Step 4: Write the main tick function**

Create `src/engine/tick.ts`:

```typescript
import { GameState, PlayerDecision, WeekSummary } from '../types'
import { simulateWeek } from './simulation'
import { processEvents } from './events'
import { calculateWeeklyBurn, calculatePMF, calculateValuation, calculateAvgMorale } from './derived'

export function advanceWeek(state: GameState, decisions: PlayerDecision[]): GameState {
  // 1. Apply player decisions
  let newState = applyDecisions(state, decisions)

  // 2. Run simulation (team productivity, revenue, market changes)
  newState = simulateWeek(newState)

  // 3. Process events (random + triggered)
  newState = processEvents(newState)

  // 4. Update derived metrics
  newState = updateDerivedMetrics(newState)

  // 5. Advance calendar
  newState = advanceCalendar(newState)

  // 6. Record week history
  newState = recordWeekHistory(newState)

  // 7. Check game over conditions
  newState = checkGameOver(newState)

  return newState
}

function applyDecisions(state: GameState, decisions: PlayerDecision[]): GameState {
  let newState = { ...state }
  for (const decision of decisions) {
    newState = applyDecision(newState, decision)
  }
  return newState
}

function applyDecision(state: GameState, decision: PlayerDecision): GameState {
  // Deep clone relevant parts of state to avoid mutation
  switch (decision.type) {
    case 'hire-employee': {
      const candidateId = decision.payload.candidateId as string
      const candidate = state.team.hiringPipeline.find(c => c.id === candidateId)
      if (!candidate) return state
      const newEmployee = {
        id: candidate.id,
        name: candidate.name,
        role: candidate.role,
        skill: candidate.skill,
        salary: candidate.salaryExpectation,
        morale: 75,
        loyalty: 30,
        aiSentiment: Math.random() > 0.5 ? 20 : -20,
        weekHired: state.meta.week,
        assignedTo: null,
      }
      return {
        ...state,
        team: {
          ...state.team,
          employees: [...state.team.employees, newEmployee],
          hiringPipeline: state.team.hiringPipeline.filter(c => c.id !== candidateId),
        },
      }
    }

    case 'fire-employee': {
      const employeeId = decision.payload.employeeId as string
      const firedEmployee = state.team.employees.find(e => e.id === employeeId)
      if (!firedEmployee) return state
      // Firing hurts morale of remaining team
      const moraleHit = -10
      return {
        ...state,
        team: {
          ...state.team,
          employees: state.team.employees
            .filter(e => e.id !== employeeId)
            .map(e => ({ ...e, morale: Math.max(0, e.morale + moraleHit) })),
        },
      }
    }

    case 'assign-team': {
      const { memberId, featureId } = decision.payload as { memberId: string; featureId: string | null }
      return {
        ...state,
        team: {
          ...state.team,
          employees: state.team.employees.map(e =>
            e.id === memberId ? { ...e, assignedTo: featureId } : e
          ),
          aiAgents: state.team.aiAgents.map(a =>
            a.id === memberId ? { ...a, assignedTo: featureId } : a
          ),
        },
      }
    }

    case 'start-feature': {
      const { featureName, description } = decision.payload as { featureName: string; description: string }
      const newFeature = {
        id: `feature-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: featureName,
        description,
        status: 'planned' as const,
        progress: 0,
        quality: 50,
        techDebt: 0,
        marketRelevance: 50,
        assignedEmployees: [],
        assignedAgents: [],
      }
      return {
        ...state,
        product: {
          ...state.product,
          features: [...state.product.features, newFeature],
        },
      }
    }

    case 'set-pricing': {
      const { model, price } = decision.payload as { model: string; price: number }
      return {
        ...state,
        finances: {
          ...state.finances,
          pricingModel: model as any,
          pricePerUnit: price,
        },
      }
    }

    case 'respond-to-event': {
      const { decisionId, optionId } = decision.payload as { decisionId: string; optionId: string }
      const pending = state.pendingDecisions.find(d => d.id === decisionId)
      if (!pending) return state
      const option = pending.options.find(o => o.id === optionId)
      if (!option) return state

      let newState = { ...state }
      for (const effect of option.effects) {
        newState = applyStateEffect(newState, effect)
      }
      return {
        ...newState,
        pendingDecisions: state.pendingDecisions.filter(d => d.id !== decisionId),
      }
    }

    default:
      return state
  }
}

function applyStateEffect(state: GameState, effect: { target: string; operation: string; value: number; description: string }): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState
  const parts = effect.target.split('.')
  let obj: any = newState
  for (let i = 0; i < parts.length - 1; i++) {
    obj = obj[parts[i]]
  }
  const key = parts[parts.length - 1]
  const current = obj[key] as number

  switch (effect.operation) {
    case 'add': obj[key] = current + effect.value; break
    case 'subtract': obj[key] = current - effect.value; break
    case 'multiply': obj[key] = current * effect.value; break
    case 'set': obj[key] = effect.value; break
  }

  return newState
}

function updateDerivedMetrics(state: GameState): GameState {
  const weeklyBurn = calculateWeeklyBurn(state)
  const pmfScore = calculatePMF(state)
  const avgMorale = calculateAvgMorale(state)
  const valuation = calculateValuation(state)

  return {
    ...state,
    finances: { ...state.finances, weeklyBurn },
    product: { ...state.product, pmfScore },
    team: { ...state.team, avgMorale },
    company: { ...state.company, valuation },
  }
}

function advanceCalendar(state: GameState): GameState {
  const week = state.meta.week + 1
  const dayOfYear = ((week - 1) * 7) % 365
  const month = Math.floor(dayOfYear / 30) + 1
  const year = state.meta.year + Math.floor(((state.meta.week - 1) * 7) / 365)

  return {
    ...state,
    meta: { ...state.meta, week, month: Math.min(month, 12), year },
  }
}

function recordWeekHistory(state: GameState): GameState {
  const summary: WeekSummary = {
    week: state.meta.week,
    cash: state.finances.cash,
    revenue: state.finances.weeklyRevenue,
    burn: state.finances.weeklyBurn,
    teamSize: state.team.employees.length + state.team.aiAgents.length,
    pmf: state.product.pmfScore,
    valuation: state.company.valuation,
    bubbleIndex: state.market.bubbleIndex,
  }
  return {
    ...state,
    weekHistory: [...state.weekHistory, summary],
  }
}

function checkGameOver(state: GameState): GameState {
  if (state.finances.cash <= 0) {
    return {
      ...state,
      meta: { ...state.meta, gameOver: true },
      eventLog: [
        ...state.eventLog,
        {
          id: `gameover-${state.meta.week}`,
          week: state.meta.week,
          category: 'alert',
          title: 'Game Over',
          message: 'Your startup has run out of cash. The dream is over.',
          tone: state.meta.tone,
          hasDecision: false,
        },
      ],
    }
  }
  return state
}
```

**Step 5: Write simulation logic**

Create `src/engine/simulation.ts`:

```typescript
import { GameState, Feature } from '../types'

export function simulateWeek(state: GameState): GameState {
  let newState = state

  // 1. Team produces work on features
  newState = simulateProductDevelopment(newState)

  // 2. Revenue from customers
  newState = simulateRevenue(newState)

  // 3. Burn cash
  newState = simulateBurn(newState)

  // 4. Market dynamics
  newState = simulateMarket(newState)

  // 5. Team morale drift
  newState = simulateMorale(newState)

  // 6. Hiring pipeline refresh
  newState = simulateHiringPipeline(newState)

  // 7. Customer growth/churn
  newState = simulateCustomers(newState)

  return newState
}

function simulateProductDevelopment(state: GameState): GameState {
  const features = state.product.features.map(feature => {
    if (feature.status === 'shipped' || feature.status === 'deprecated' || feature.status === 'planned') {
      return feature
    }

    // Calculate work done this week
    const assignedHumans = state.team.employees.filter(e => e.assignedTo === feature.id)
    const assignedAI = state.team.aiAgents.filter(a => a.assignedTo === feature.id)

    let progressGain = 0
    let qualityImpact = 0
    let debtGain = 0

    // Human work: steady, high quality, low debt
    for (const human of assignedHumans) {
      const output = (human.skill * human.morale / 100) * 2
      progressGain += output
      qualityImpact += human.skill * 0.5
    }

    // AI work: fast but debt-accumulating
    for (const agent of assignedAI) {
      const output = (agent.capability * agent.reliability / 100) * 3
      progressGain += output
      debtGain += (100 - agent.reliability) * 0.3
      qualityImpact += agent.capability * 0.3
    }

    const newProgress = Math.min(100, feature.progress + progressGain)
    const newStatus = newProgress >= 100 ? 'shipped' as const : 'in-progress' as const
    const avgQuality = (assignedHumans.length + assignedAI.length) > 0
      ? qualityImpact / (assignedHumans.length + assignedAI.length)
      : feature.quality

    return {
      ...feature,
      progress: newProgress,
      status: newStatus,
      quality: Math.round(Math.min(100, Math.max(0, (feature.quality + avgQuality) / 2))),
      techDebt: Math.min(100, feature.techDebt + debtGain),
    }
  })

  const overallQuality = features.length > 0
    ? Math.round(features.reduce((s, f) => s + f.quality, 0) / features.length)
    : 0
  const techDebtTotal = features.length > 0
    ? Math.round(features.reduce((s, f) => s + f.techDebt, 0) / features.length)
    : 0

  return {
    ...state,
    product: {
      ...state.product,
      features,
      overallQuality,
      techDebtTotal,
      bugs: Math.floor(techDebtTotal * 0.3),
    },
  }
}

function simulateRevenue(state: GameState): GameState {
  if (state.product.customers <= 0 || state.finances.pricePerUnit <= 0) {
    return { ...state, finances: { ...state.finances, weeklyRevenue: 0 } }
  }

  const baseRevenue = state.product.customers * state.finances.pricePerUnit / 4 // monthly to weekly
  const qualityMultiplier = state.product.overallQuality / 100
  const weeklyRevenue = Math.round(baseRevenue * qualityMultiplier)

  return {
    ...state,
    finances: { ...state.finances, weeklyRevenue },
  }
}

function simulateBurn(state: GameState): GameState {
  const burn = state.finances.weeklyBurn
  const revenue = state.finances.weeklyRevenue
  const netCash = state.finances.cash - burn + revenue

  return {
    ...state,
    finances: { ...state.finances, cash: netCash },
  }
}

function simulateMarket(state: GameState): GameState {
  // Bubble index drifts
  const bubbleNoise = (Math.random() - 0.5) * 3
  const newBubbleIndex = Math.max(0, Math.min(100,
    state.market.bubbleIndex + state.market.bubbleTrend + bubbleNoise
  ))

  // Talent market correlates with bubble
  const talentHeat = Math.max(20, Math.min(100, newBubbleIndex * 0.8 + (Math.random() - 0.5) * 10))

  // Investor sentiment
  const investorSentiment = Math.max(10, Math.min(100, newBubbleIndex * 0.9 + (Math.random() - 0.5) * 15))

  // Competitors evolve
  const competitors = state.market.competitors.map(c => {
    if (!c.alive) return c
    const growth = (Math.random() - 0.3) * 2 // slight positive bias
    return {
      ...c,
      productQuality: Math.min(100, Math.max(0, c.productQuality + growth)),
      marketShare: Math.min(50, Math.max(0, c.marketShare + (Math.random() - 0.5) * 0.5)),
    }
  })

  return {
    ...state,
    market: {
      ...state.market,
      bubbleIndex: newBubbleIndex,
      talentMarketHeat: talentHeat,
      investorSentiment,
      competitors,
    },
  }
}

function simulateMorale(state: GameState): GameState {
  const aiRatio = state.team.aiAgents.length / Math.max(1, state.team.employees.length + state.team.aiAgents.length)
  const overworked = state.product.features.filter(f => f.status === 'in-progress').length > state.team.employees.length

  const employees = state.team.employees.map(e => {
    let moraleDelta = 0

    // AI sentiment affects morale
    if (aiRatio > 0.5) {
      moraleDelta += e.aiSentiment > 0 ? 1 : -2
    }

    // Overwork hurts morale
    if (overworked) moraleDelta -= 2

    // Natural drift toward 50
    moraleDelta += (50 - e.morale) * 0.02

    // Random fluctuation
    moraleDelta += (Math.random() - 0.5) * 3

    return {
      ...e,
      morale: Math.round(Math.max(0, Math.min(100, e.morale + moraleDelta))),
    }
  })

  return {
    ...state,
    team: { ...state.team, employees },
  }
}

function simulateHiringPipeline(state: GameState): GameState {
  // Expire old candidates
  let pipeline = state.team.hiringPipeline
    .map(c => ({ ...c, weeksToDecide: c.weeksToDecide - 1 }))
    .filter(c => c.weeksToDecide > 0)

  // Maybe add new candidates (based on market heat and company reputation)
  const newCandidateChance = 0.3 + (state.company.reputation / 200)
  if (Math.random() < newCandidateChance && pipeline.length < 5) {
    const roles = ['engineer', 'designer', 'sales', 'marketing', 'ops'] as const
    const role = roles[Math.floor(Math.random() * roles.length)]
    const skill = Math.floor(Math.random() * 7) + 3 // 3-9
    const baseSalary = skill * 500 + 1000
    const marketMultiplier = 1 + (state.market.talentMarketHeat / 200) // more expensive in hot markets
    const names = ['Alex Chen', 'Jordan Smith', 'Sam Rivera', 'Casey Kim', 'Riley Park',
      'Morgan Lee', 'Drew Taylor', 'Blake Johnson', 'Quinn Davis', 'Avery Martinez',
      'Sage Williams', 'Phoenix Brown', 'Harper Jones', 'Dakota Miller', 'Rowan Wilson']

    pipeline.push({
      id: `candidate-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: names[Math.floor(Math.random() * names.length)],
      role,
      skill,
      salaryExpectation: Math.round(baseSalary * marketMultiplier),
      weeksToDecide: Math.floor(Math.random() * 3) + 2,
    })
  }

  return {
    ...state,
    team: { ...state.team, hiringPipeline: pipeline },
  }
}

function simulateCustomers(state: GameState): GameState {
  const shippedFeatures = state.product.features.filter(f => f.status === 'shipped')
  if (shippedFeatures.length === 0 || state.finances.pricePerUnit === 0) {
    return state
  }

  // Organic growth from PMF
  const pmfGrowth = state.product.pmfScore / 100 * 5

  // Marketing-driven growth
  const marketingBudget = state.finances.monthlyExpenses.marketing
  const marketingGrowth = Math.sqrt(marketingBudget) * 0.1

  // Churn
  const churnLoss = state.product.customers * state.product.churnRate

  // Quality affects churn
  const qualityChurnModifier = (100 - state.product.overallQuality) / 100 * 0.02
  const adjustedChurn = churnLoss * (1 + qualityChurnModifier)

  const newCustomers = Math.max(0,
    Math.round(state.product.customers + pmfGrowth + marketingGrowth - adjustedChurn)
  )

  return {
    ...state,
    product: { ...state.product, customers: newCustomers },
  }
}
```

**Step 6: Write event processing**

Create `src/engine/events.ts`:

```typescript
import { GameState, EventLogEntry, PendingDecision } from '../types'
import { GameEvent } from '../types/events'
import { ALL_EVENTS } from '../data/events'
import { generateId } from '../utils/id'

export function processEvents(state: GameState): GameState {
  const eligibleEvents = ALL_EVENTS.filter(event => {
    // Check condition
    if (!event.condition(state)) return false

    // Check uniqueness (already fired)
    if (event.unique) {
      const alreadyFired = state.eventLog.some(log => log.id.startsWith(event.id))
      if (alreadyFired) return false
    }

    // Check cooldown
    if (event.cooldown) {
      const lastFired = [...state.eventLog]
        .reverse()
        .find(log => log.id.startsWith(event.id))
      if (lastFired && (state.meta.week - lastFired.week) < event.cooldown) return false
    }

    return true
  })

  // Select 1-3 events per week using weighted random
  const selectedEvents = weightedRandomSelect(eligibleEvents, Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1)))

  let newState = { ...state }

  for (const event of selectedEvents) {
    const tone = state.meta.tone
    const logEntry: EventLogEntry = {
      id: `${event.id}-week${state.meta.week}`,
      week: state.meta.week,
      category: event.feedCategory,
      title: event.title[tone],
      message: event.message[tone],
      tone,
      hasDecision: event.requiresDecision,
    }

    if (event.requiresDecision && event.options) {
      const decisionId = generateId()
      logEntry.decisionId = decisionId
      const pendingDecision: PendingDecision = {
        id: decisionId,
        eventId: event.id,
        title: event.title[tone],
        description: event.message[tone],
        options: event.options.map((opt, i) => ({
          id: `${decisionId}-opt${i}`,
          label: opt.label[tone],
          description: opt.description[tone],
          effects: opt.effects.map(e => ({
            ...e,
            value: typeof e.value === 'function' ? e.value(state) : e.value,
          })),
        })),
        deadline: state.meta.week + 2,
        priority: event.category === 'crisis' ? 'critical' : event.category === 'opportunity' ? 'high' : 'medium',
      }
      newState = {
        ...newState,
        pendingDecisions: [...newState.pendingDecisions, pendingDecision],
      }
    }

    newState = {
      ...newState,
      eventLog: [...newState.eventLog, logEntry],
    }
  }

  // Auto-resolve expired decisions
  const expired = newState.pendingDecisions.filter(d => d.deadline <= state.meta.week)
  for (const decision of expired) {
    // Default to first option
    if (decision.options.length > 0) {
      const defaultOption = decision.options[0]
      for (const effect of defaultOption.effects) {
        newState = applyEffect(newState, effect)
      }
    }
  }
  newState = {
    ...newState,
    pendingDecisions: newState.pendingDecisions.filter(d => d.deadline > state.meta.week),
  }

  return newState
}

function weightedRandomSelect(events: GameEvent[], count: number): GameEvent[] {
  const selected: GameEvent[] = []
  const remaining = [...events]

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, e) => sum + e.weight, 0)
    let random = Math.random() * totalWeight
    let selectedIndex = 0

    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }

    selected.push(remaining[selectedIndex])
    remaining.splice(selectedIndex, 1)
  }

  return selected
}

function applyEffect(state: GameState, effect: { target: string; operation: string; value: number; description: string }): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState
  const parts = effect.target.split('.')
  let obj: any = newState
  for (let i = 0; i < parts.length - 1; i++) {
    obj = obj[parts[i]]
  }
  const key = parts[parts.length - 1]
  const current = obj[key] as number

  switch (effect.operation) {
    case 'add': obj[key] = current + effect.value; break
    case 'subtract': obj[key] = current - effect.value; break
    case 'multiply': obj[key] = current * effect.value; break
    case 'set': obj[key] = effect.value; break
  }

  return newState
}
```

**Step 7: Write utility**

Create `src/utils/id.ts`:

```typescript
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
```

**Step 8: Write tick test**

Create `src/engine/__tests__/tick.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { advanceWeek } from '../tick'
import { createInitialState } from '../init'

describe('advanceWeek', () => {
  it('advances the week counter', () => {
    const state = createInitialState('TestCo', 'technical', 'coding', 'normal', 'realistic')
    const newState = advanceWeek(state, [])
    expect(newState.meta.week).toBe(2)
  })

  it('burns cash each week', () => {
    const state = createInitialState('TestCo', 'technical', 'coding', 'normal', 'realistic')
    const startCash = state.finances.cash
    const newState = advanceWeek(state, [])
    expect(newState.finances.cash).toBeLessThanOrEqual(startCash)
  })

  it('triggers game over when cash runs out', () => {
    const state = createInitialState('TestCo', 'technical', 'coding', 'normal', 'realistic')
    state.finances.cash = 100
    state.finances.weeklyBurn = 500
    const newState = advanceWeek(state, [])
    expect(newState.meta.gameOver).toBe(true)
  })
})
```

**Step 9: Create engine barrel export**

Create `src/engine/index.ts`:

```typescript
export { advanceWeek } from './tick'
export { createInitialState } from './init'
export * from './derived'
```

**Step 10: Run tests**

```bash
npx vitest run
```

**Step 11: Commit**

```bash
git add src/engine/ src/utils/ && git commit -m "feat: implement core game engine with tick cycle, simulation, and event processing"
```

---

## Phase 2: Game Data (Parallelizable — 4 agents)

These 4 tasks can be worked on in parallel. Each produces JSON/TypeScript data files.

### Task 4: Founder & Market Data

**Files:**
- Create: `src/data/founders.ts`
- Create: `src/data/markets.ts`
- Create: `src/data/competitors.ts`
- Create: `src/data/aiProviders.ts`
- Test: `src/data/__tests__/founders.test.ts`

Define all founder archetype configs, market segment configs, competitor generation, and AI provider definitions. See the game design doc for the specific stats per archetype and vertical. Competitor names should be fun fictional AI startup names. AI providers should be thinly-veiled versions of real companies (e.g., "Anthropos", "OpenMind", "DeepBrain", "Googolplex AI").

Each founder config needs: techSkill, bizSkill, network (1-10), startingCash, startingReputation, learningRate, specialAbility description.

Each market segment needs: name, size (TAM in $), growthRate, competitionIntensity, regulatoryRisk, and a list of 8-10 customerDemand features that customers in that segment want.

Competitor generation should create 5-8 competitors per segment with random names, strategies, and starting stats. Use seeded randomness for reproducibility.

### Task 5: Routine & Market Events (30 events each)

**Files:**
- Create: `src/data/events/routine.ts` — ~30 routine events
- Create: `src/data/events/market.ts` — ~20 market events
- Create: `src/data/events/index.ts` — Combined export

Write events following the `GameEvent` interface from `src/types/events.ts`. Each event needs:
- `id`: unique string
- `title` and `message` as `Record<Tone, string>` with realistic, satirical, and mixed variants
- `condition`: function checking game state (e.g., `state => state.team.employees.length > 3`)
- `weight`: 1-10 (higher = more common)
- `requiresDecision`: boolean
- `options`: 2-4 choices with effects if requiresDecision

Routine events examples: new job applicant, feature shipped notification, customer feedback, team standup update, office lease renewal, cloud bill spike, employee birthday, code review conflict.

Market events examples: competitor launches product, VC firm raises new fund, big tech announces AI product, AI regulation bill proposed, tech layoffs at major company, new AI benchmark published, AI startup acquired.

### Task 6: Crisis & Opportunity Events (30 events)

**Files:**
- Create: `src/data/events/crisis.ts` — ~15 crisis events
- Create: `src/data/events/opportunity.ts` — ~15 opportunity events

Crisis events: production outage, key engineer quits, data breach, negative press, investor pulls out, co-founder dispute, lawsuit, API provider goes down, customer data leak, employee posts on Blind.

Opportunity events: acquisition offer, partnership with big company, YC acceptance, viral tweet about product, celebrity endorsement, government contract, talent from competitor available, conference speaking invitation.

Each must have 2-4 decision options with meaningful trade-offs and state effects.

### Task 7: AI-Specific Events (20 events)

**Files:**
- Create: `src/data/events/ai-specific.ts` — ~20 AI-themed events

These are the game's unique events about the AI tension:
- AI agent produces hallucinated output that ships to customers
- New model release makes current agents obsolete
- AI provider raises prices 3x
- Employee refuses to use AI tools
- AI agent writes better code than senior engineer
- Public backlash: "AI is taking our jobs"
- AI-generated content copyright lawsuit
- AI safety incident at competitor
- Congressional hearing on AI regulation
- AI agent discovers security vulnerability
- Customers demand "human-made" guarantee
- AI union movement gains traction
- Model provider has data breach
- AI agent creates something unexpectedly creative
- Competitor claims AGI breakthrough

Each event needs all three tone variants and meaningful decisions.

---

## Phase 3: Zustand Store & Save System

### Task 8: Game Store

**Files:**
- Create: `src/store/gameStore.ts`
- Create: `src/store/index.ts`
- Test: `src/store/__tests__/gameStore.test.ts`

**Step 1: Write the game store**

Create `src/store/gameStore.ts`:

```typescript
import { create } from 'zustand'
import { GameState, PlayerDecision, FounderArchetype, MarketSegment, Difficulty, Tone } from '../types'
import { createInitialState, advanceWeek } from '../engine'

interface GameStore {
  // State
  gameState: GameState | null
  currentScreen: string
  decisionsThisTurn: PlayerDecision[]
  isSimulating: boolean

  // Actions
  newGame: (companyName: string, archetype: FounderArchetype, segment: MarketSegment, difficulty: Difficulty, tone: Tone) => void
  endWeek: () => void
  addDecision: (decision: PlayerDecision) => void
  clearDecisions: () => void
  setScreen: (screen: string) => void
  saveGame: () => void
  loadGame: (slot: number) => void
  getSaveSlots: () => SaveSlot[]
}

interface SaveSlot {
  slot: number
  companyName: string
  week: number
  valuation: number
  savedAt: string
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  currentScreen: 'overview',
  decisionsThisTurn: [],
  isSimulating: false,

  newGame: (companyName, archetype, segment, difficulty, tone) => {
    const state = createInitialState(companyName, archetype, segment, difficulty, tone)
    set({ gameState: state, currentScreen: 'overview', decisionsThisTurn: [] })
  },

  endWeek: () => {
    const { gameState, decisionsThisTurn } = get()
    if (!gameState || gameState.meta.gameOver) return

    set({ isSimulating: true })
    const newState = advanceWeek(gameState, decisionsThisTurn)
    set({ gameState: newState, decisionsThisTurn: [], isSimulating: false })
  },

  addDecision: (decision) => {
    set(state => ({
      decisionsThisTurn: [...state.decisionsThisTurn, decision],
    }))
  },

  clearDecisions: () => set({ decisionsThisTurn: [] }),

  setScreen: (screen) => set({ currentScreen: screen }),

  saveGame: () => {
    const { gameState } = get()
    if (!gameState) return
    const slot = 0 // auto-save slot
    const key = `hcab-save-${slot}`
    const data = {
      state: gameState,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  },

  loadGame: (slot) => {
    const key = `hcab-save-${slot}`
    const raw = localStorage.getItem(key)
    if (!raw) return
    const data = JSON.parse(raw)
    set({ gameState: data.state, currentScreen: 'overview', decisionsThisTurn: [] })
  },

  getSaveSlots: () => {
    const slots: SaveSlot[] = []
    for (let i = 0; i < 5; i++) {
      const key = `hcab-save-${i}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const data = JSON.parse(raw)
        slots.push({
          slot: i,
          companyName: data.state.company.name,
          week: data.state.meta.week,
          valuation: data.state.company.valuation,
          savedAt: data.savedAt,
        })
      }
    }
    return slots
  },
}))
```

**Step 2: Write store test**

Create `src/store/__tests__/gameStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      gameState: null,
      currentScreen: 'overview',
      decisionsThisTurn: [],
      isSimulating: false,
    })
  })

  it('creates a new game', () => {
    useGameStore.getState().newGame('TestCo', 'technical', 'coding', 'normal', 'realistic')
    const state = useGameStore.getState().gameState
    expect(state).not.toBeNull()
    expect(state!.company.name).toBe('TestCo')
    expect(state!.meta.week).toBe(1)
  })

  it('advances a week', () => {
    useGameStore.getState().newGame('TestCo', 'technical', 'coding', 'normal', 'realistic')
    useGameStore.getState().endWeek()
    expect(useGameStore.getState().gameState!.meta.week).toBe(2)
  })
})
```

**Step 3: Commit**

```bash
git add src/store/ && git commit -m "feat: add Zustand game store with save/load system"
```

---

## Phase 4: UI Components (Parallelizable after Phase 1 + Task 8)

### Task 9: App Shell & Layout

**Files:**
- Create: `src/components/layout/AppShell.tsx` — Three-panel layout
- Create: `src/components/layout/Sidebar.tsx` — Navigation sidebar
- Create: `src/components/layout/Header.tsx` — Top bar with week/date and Next Week button
- Create: `src/components/layout/EventFeed.tsx` — Right panel event feed
- Modify: `src/App.tsx` — Wire up shell

Build the three-panel layout matching the design doc wireframe. Left sidebar for navigation, center for main content, right for event feed. Header spans the top with game title, current week/date, and "Next Week" button. Use Tailwind for styling. Dark theme recommended (dark grays, accent colors for KPI categories).

### Task 10: Game Start Screen

**Files:**
- Create: `src/components/screens/NewGameScreen.tsx`
- Create: `src/components/screens/MainMenuScreen.tsx`

Main menu: game title with tagline, New Game / Load Game / About buttons.

New game flow: Step 1: Enter company name. Step 2: Choose founder archetype (5 cards with stats). Step 3: Choose startup vertical (6 cards with market info). Step 4: Choose difficulty + tone. Step 5: Confirm and start.

### Task 11: Overview Dashboard Screen

**Files:**
- Create: `src/components/screens/OverviewScreen.tsx`
- Create: `src/components/shared/KPICard.tsx`
- Create: `src/components/shared/SparklineChart.tsx`
- Create: `src/components/shared/WeeklySummary.tsx`

4 main KPI cards at top: Cash (with runway), MRR, Team Size, PMF Score. Each card shows current value, trend arrow, and a sparkline from weekHistory. Below: weekly summary text, recent events list, and quick action buttons.

### Task 12: Team Screen

**Files:**
- Create: `src/components/screens/TeamScreen.tsx`
- Create: `src/components/shared/EmployeeTable.tsx`
- Create: `src/components/shared/AIAgentPanel.tsx`
- Create: `src/components/shared/HiringPipeline.tsx`

Employee table: sortable columns (name, role, skill, salary, morale, assigned to). Row actions: fire, reassign. AI Agent panel: cards showing each agent's type, provider, capability, cost, reliability. Hiring pipeline: candidate cards with "Hire" button and countdown timer.

### Task 13: Product Screen

**Files:**
- Create: `src/components/screens/ProductScreen.tsx`
- Create: `src/components/shared/FeatureBoard.tsx`
- Create: `src/components/shared/TechDebtMeter.tsx`

Kanban-style feature board (Planned → In Progress → Shipped). Feature cards show progress bar, quality, tech debt, assigned team. "New Feature" button. Tech debt meter as a visual gauge. PMF breakdown showing which market demands are met.

### Task 14: Finance Screen

**Files:**
- Create: `src/components/screens/FinanceScreen.tsx`
- Create: `src/components/shared/CashFlowChart.tsx`
- Create: `src/components/shared/RunwayCountdown.tsx`
- Create: `src/components/shared/FundraisingPanel.tsx`

P&L breakdown table (revenue vs expenses by category). Cash flow line chart over time. Runway countdown (big number: "X weeks of runway"). Fundraising panel: current stage, pitch investors button, active term sheets. Expense sliders for marketing/cloud budgets.

### Task 15: Market Screen

**Files:**
- Create: `src/components/screens/MarketScreen.tsx`
- Create: `src/components/shared/CompetitorTable.tsx`
- Create: `src/components/shared/BubbleIndexGauge.tsx`
- Create: `src/components/shared/MarketTrends.tsx`

Competitor intelligence table (name, funding, team, quality, market share, strategy). Bubble Index gauge (visual 0-100 meter with color zones). Market segment overview. Trend cards showing recent market events and their impact.

### Task 16: Strategy Screen

**Files:**
- Create: `src/components/screens/StrategyScreen.tsx`

High-level strategy controls: AI vs Human ratio target slider, market positioning selector, growth vs profitability toggle, culture priorities. These set weights that influence simulation behavior over time.

### Task 17: Decision Queue Screen

**Files:**
- Create: `src/components/screens/DecisionScreen.tsx`
- Create: `src/components/shared/DecisionCard.tsx`

List of pending decisions. Each card shows: title, description, priority badge, deadline countdown, 2-4 option buttons with previewed effects. Selecting an option adds it to this turn's decisions.

---

## Phase 5: Integration & Polish

### Task 18: Wire Everything Together

**Files:**
- Modify: `src/App.tsx` — Route screens based on store state
- Create: `src/components/screens/GameOverScreen.tsx`

Connect all screens to the store. Implement screen routing (main menu → new game → gameplay screens → game over). Add keyboard shortcuts (N for next week). Add auto-save on each week advance.

### Task 19: Scoring & Leaderboard

**Files:**
- Create: `src/engine/scoring.ts`
- Create: `src/components/screens/LeaderboardScreen.tsx`

Score calculation from design doc (valuation + ARR + team + quality + weeks + difficulty multiplier). Local leaderboard stored in localStorage. Display on game over and accessible from main menu.

### Task 20: Game Balance & Testing

Run playtests. Tune: starting cash amounts, salary ranges, AI agent costs, event frequencies, bubble dynamics, customer growth rates, feature development speed. Ensure a normal-difficulty game lasts 30-100 weeks with active play. Write integration tests for common scenarios.

### Task 21: Final Polish

- Loading states and transition animations
- Responsive design (minimum 1024px width)
- Keyboard navigation
- Tooltips on complex metrics
- Tutorial/onboarding for first-time players (first 3 weeks guided)
- Error boundaries

---

## Dependency Graph

```
Task 1 (scaffold) ──→ Task 2 (types) ──→ Task 3 (engine)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                    Task 4 (founders)   Task 5 (events)  Task 6 (events)
                    Task 7 (AI events)
                              │               │               │
                              └───────┬───────┘               │
                                      ▼                       │
                              Task 8 (store) ◄────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
            Task 9 (shell)    Task 10 (new game)  Task 11 (overview)
            Task 12 (team)    Task 13 (product)   Task 14 (finance)
            Task 15 (market)  Task 16 (strategy)  Task 17 (decisions)
                    │                 │                  │
                    └─────────────────┼──────────────────┘
                                      ▼
                              Task 18 (integrate)
                                      │
                              ┌───────┼───────┐
                              ▼       ▼       ▼
                        Task 19   Task 20   Task 21
                       (scoring) (balance) (polish)
```

## Parallelization Strategy

- **Phase 1** (Tasks 1-3): Sequential, must complete first
- **Phase 2** (Tasks 4-7): All 4 in parallel
- **Phase 3** (Task 8): After Phase 2
- **Phase 4** (Tasks 9-17): All 9 in parallel after Task 8
- **Phase 5** (Tasks 18-21): Sequential integration
