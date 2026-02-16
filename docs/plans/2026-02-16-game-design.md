# Here Comes Another Bubble — Game Design Document

## Overview

A browser-based, data-driven startup simulation game set in San Francisco during the 2026 agentic AI boom. Players run an AI startup, making weekly strategic decisions while navigating the tension between human and AI workforces, market hype, and the looming question: is this a real revolution or just another bubble?

Inspired by Software Inc. but without the visual graphics — focused entirely on data, dashboards, and decision-making.

## Core Design Decisions

| Dimension | Choice |
|-----------|--------|
| Core loop | Decide, Simulate, React, Adapt |
| Time | Week-by-week turns |
| Win condition | Open-ended sandbox, scored by valuation/revenue/empire size |
| UI | CEO Dashboard + Event Feeds |
| Systems | Team, Product, Finances, Market & Competition |
| AI mechanic | Deep — AI is the central thematic tension |
| Narrative tone | Player-selectable: Realistic, Satirical, or Mixed |
| Scope | Full game (100+ events, 5 archetypes, 6 verticals) |
| Tech stack | React + TypeScript |
| Persistence | Local saves (localStorage/IndexedDB), single player |
| Game start | Choose founder archetype + startup vertical |

## Architecture: State Machine Engine

The game is a state machine. Each week is a tick. The entire game state is a single serializable object.

### GameState Structure

```typescript
interface GameState {
  meta: {
    week: number
    year: number
    month: number
    difficulty: string
    tone: 'realistic' | 'satirical' | 'mixed'
  }
  founder: FounderProfile
  company: CompanyState
  team: TeamState
  product: ProductState
  finances: FinancialState
  market: MarketState
  events: EventLog
}
```

### Tick Cycle (Each Week)

1. **Decision Phase** — Player reviews dashboard, makes decisions (hire, fire, allocate, invest, pitch, etc.)
2. **Simulation Phase** — Engine applies decisions + runs rules: `(GameState, Decision[]) => GameState`
3. **Event Phase** — Random + triggered events fire based on state conditions
4. **Resolution Phase** — Events modify state, news feed updates, notifications appear
5. **Display Phase** — UI re-renders with new state, player sees what happened

### Derived Metrics (Computed, Not Stored)

- **Runway**: cash / weekly burn rate
- **Product-Market Fit**: composite of feature coverage, quality, market demand
- **Team Velocity**: based on team size, morale, AI agent efficiency
- **Bubble Index**: global market variable affecting valuations, hiring costs, investor eagerness

## Game Systems

### 1. Team System

**Humans** have: name, role (engineer/designer/sales/ops/marketing), skill level (1-10), salary, morale (0-100), loyalty, specialization. They produce work each week based on skill x morale. They can quit if morale drops. They have opinions about AI replacing their colleagues.

**AI Agents** have: type (coding/support/marketing/analysis), provider (fictional versions of real companies), capability level, cost per week (API credits), reliability (hallucination rate), uptime. They work 24/7 but make mistakes. New model releases during the game change the landscape.

**Team dynamics**: Humans react to AI agent deployment. Heavy AI use leads to mixed reactions — some employees love the productivity boost, others feel threatened and morale drops. The AI ratio (agents vs humans) affects company culture, public perception, and product quality in different ways.

**Hiring market**: SF talent pool fluctuates. During bubble peaks, engineers are expensive and scarce. After layoffs at competitors, talent floods the market. Players compete with other startups for hires.

### 2. Product System

**Product = collection of features**. Each feature has: development progress (0-100%), quality score, tech debt accumulated, market relevance.

**Building features**: Assign team members (humans + AI agents) to features. Humans build slower but with fewer bugs. AI agents build faster but accumulate tech debt and quality issues. Mix determines velocity vs quality trade-off.

**Tech debt**: Accumulates from rushed development, AI-generated code, and skipped testing. High tech debt leads to more bugs, slower new development, risk of outages. Must be actively paid down by allocating engineering time.

**Product-Market Fit (PMF)**: Composite score based on how well features match market segment demand. High PMF = organic growth, word of mouth, easier sales. Low PMF = high churn, wasted marketing spend.

### 3. Finance System

**Revenue model**: Choose pricing (freemium, subscription, enterprise, usage-based). Revenue = customers x price, affected by PMF, churn, market conditions.

**Fundraising**: Pitch investors at various stages (Pre-seed, Seed, Series A, B, C+). Investor interest affected by: metrics, market hype (bubble index), founder reputation, AI narrative. Term sheets have trade-offs (valuation vs control vs board seats).

**Burn rate**: Salaries + AI agent costs + office rent + cloud infrastructure + marketing spend. Weekly drain on cash. Runway = weeks until $0.

**The Bubble Index**: Global market variable (0-100) that inflates over time. High bubble = easy fundraising, insane valuations, expensive talent, customer budgets. Bubble deflation = funding dries up, layoffs everywhere, only profitable companies survive.

### 4. Market & Competition System

**Market segments**: AI Coding Tools, AI Customer Support, AI Creative Tools, AI Healthcare, AI Legal, AI Education. Each has: size, growth rate, competition intensity, regulatory risk.

**Competitors**: 5-8 AI competitors in the player's space. They have their own strategies, funding, products. They can launch competing features, poach employees, get acquired, go bankrupt, or pivot. Generated procedurally with personality traits.

**Market events**: New regulations (AI safety laws), big tech entering the space, viral moments, macro events (interest rate changes, tech layoffs).

## UI Layout

### Main Dashboard (Primary Screen)

```
+------------------------------------------------------------------+
|  HERE COMES ANOTHER BUBBLE    Week 14 / Mar 2026   [>> Next Week] |
+-----------+--------------------------------------+----------------+
|  NAV      |         MAIN CONTENT AREA            |   EVENT FEED   |
|           |                                      |                |
| Overview  |  [Cash]  [MRR]   [Team]  [PMF]       | CEO @slack:    |
| Team      |  $2.1M   $45K    12      67%         | "Investor      |
| Product   |                                      |  wants to meet |
| Finance   |  [Detailed panels below KPIs]        |  Tuesday"      |
| Market    |  Charts, tables, trend lines          |                |
| Strategy  |  Contextual to selected nav item      | TechCrunch:    |
|           |                                      | "Series A      |
| --------- |                                      |  funding hits  |
| Settings  |                                      |  record high"  |
| Save      |                                      |                |
+-----------+--------------------------------------+----------------+
```

### Screens

1. **Overview** — KPI cards + trend sparklines + weekly summary
2. **Team** — Employee roster table, AI agent dashboard, hiring pipeline
3. **Product** — Feature backlog, sprint allocation, tech debt meter, quality metrics
4. **Finance** — P&L, cash flow chart, runway countdown, fundraising pipeline
5. **Market** — Market map, competitor intel, segment analysis, trend radar
6. **Strategy** — Pivot options, AI vs human ratio targets, market positioning
7. **Decision Queue** — Events requiring player choices stack here

### Event Feed (Right Panel)

Persistent feed styled like Slack/Twitter. Categories:
- **Slack messages** from team members (morale, updates, drama)
- **News** (TechCrunch, HN, regulatory — affects market)
- **Investor comms** (emails, term sheets, board meetings)
- **Alerts** (runway warnings, competitor moves, outages)

Events can be informational or require a decision (routed to Decision Queue).

## Game Start

### Founder Archetypes (5)

| Archetype | Starting Cash | Tech | Biz | Network | Special Ability |
|-----------|-------------|------|-----|---------|-----------------|
| Technical Founder | $50K | 8 | 3 | Low | Can code features early. Cheaper AI agent setup. |
| Business Founder | $100K | 2 | 8 | Medium | Better fundraising odds. Cheaper hires. |
| Serial Entrepreneur | $200K | 5 | 6 | High | Angel investors interested. Bubble experience. |
| Ex-BigTech | $150K | 7 | 4 | Medium | Start with 2 senior engineers. Industry connections. |
| Fresh Grad | $20K | 6 | 2 | Low | Fastest learning. YC application bonus. Underdog narrative. |

### Startup Verticals (6)

| Vertical | Market Size | Growth | Competition | Reg. Risk | Description |
|----------|-----------|--------|-------------|-----------|-------------|
| AI Coding Tools | Large | High | Brutal | Low | Dev tools competing with well-funded incumbents. |
| AI Customer Support | Large | Medium | High | Low | Enterprise chatbots. Long sales cycles, sticky revenue. |
| AI Creative Tools | Medium | High | Medium | Medium | Image/video/music gen. Copyright minefields. Viral potential. |
| AI Healthcare | Huge | Medium | Low | Very High | Diagnostics, clinical AI. Massive potential, regulatory nightmare. |
| AI Legal | Medium | Medium | Low | High | Contract analysis, legal research. Conservative market, high margins. |
| AI Education | Medium | High | Medium | Low | Tutoring, course generation. Impact-driven, lower margins. |

## Event System

100+ events across categories, triggered by game state conditions:

- **Routine** (~40): Weekly business events (applicants, feature ships, customer feedback)
- **Market** (~20): Competitor moves, market shifts, bubble dynamics
- **Crisis** (~15): Outages, PR disasters, key employee quits, regulatory action
- **Opportunity** (~15): Acquisition offers, partnerships, viral moments, investor interest
- **AI-Specific** (~20): Provider pricing changes, agent misbehavior, new regulations, public backlash, capability breakthroughs

Each event has 2-4 response options with different consequences. Tone variants exist for realistic/satirical/mixed modes.

## Scoring

Local leaderboard. Score composite:
- Company valuation
- Annual recurring revenue
- Team size and satisfaction
- Product quality and market share
- Weeks survived
- Difficulty multiplier

## Narrative Tone Settings

Player selects at game start:
- **Realistic**: Events feel like real 2026 startup life. Grounded, occasionally dry.
- **Satirical**: Over-the-top Silicon Valley satire. Absurd, comedic, exaggerated.
- **Mixed**: Starts realistic, escalates to absurd as the bubble inflates. Dark comedy arc.

## Tech Stack

- React 18+ with TypeScript
- State management: Zustand or useReducer (game state is a reducer pattern)
- Styling: Tailwind CSS
- Charts: Recharts or lightweight charting lib
- Persistence: localStorage + IndexedDB for save games
- Build: Vite
- No backend required
