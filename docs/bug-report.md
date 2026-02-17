# Bug Report: Here Comes Another Bubble

**Date:** 2026-02-17
**Methodology:** Manual browser testing (Playwright) + 3 parallel code analysis sweeps (engine logic, UI components, data/events)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 10 |
| Important | 23 |
| Minor | 10 |
| **Total** | **43** |

---

## Critical Bugs

### C1. `weeklyBurn` event effects silently ignored by engine
**Files:** `src/engine/derived.ts`, `src/engine/tick.ts:1041-1048`
**Confidence:** 100%

Many events apply `finances.weeklyBurn` multiply/add effects (e.g., `multiply 1.15`). These modify `state.finances.weeklyBurn` in the state. However, `calculateWeeklyBurn()` in `derived.ts` recomputes burn from fundamentals (salaries + AI costs + fixed overhead) and overwrites the stored value every tick. **All event-based burn modifications are discarded every week.**

### C2. `weeklyRevenue` event effects overwritten by `simulateRevenue`
**Files:** `src/engine/simulation.ts`, `src/engine/tick.ts`
**Confidence:** 90%

Same pattern as C1. Events that directly set or multiply `finances.weeklyRevenue` get overwritten when `simulateRevenue()` recalculates revenue from customers × ARPU. Revenue-boosting events have no lasting effect.

### C3. Valuation multiplier from `simulateMarket` discarded
**Files:** `src/engine/simulation.ts:466-468`, `src/engine/tick.ts:1041-1052`
**Confidence:** 92%

`simulateMarket()` sets `state.finances.valuation` with bubble/hype multipliers. Then `calculateValuation()` in `derived.ts` recalculates from scratch and overwrites it. The market simulation's valuation work is wasted.

### C4. Tech debt reduced twice per tick
**Files:** `src/engine/simulation.ts:177-249`
**Confidence:** 85%

`simulateProductDevelopment()` reduces tech debt in the feature-shipping block AND again in a separate tech-debt block. If a team ships features while also "paying down debt," the reduction is applied twice.

### C5. Auto-resolved decisions skip side effects
**Files:** `src/engine/events.ts:98-138`, `src/engine/tick.ts`
**Confidence:** 95%

When decisions expire and auto-resolve, `autoResolveExpired()` only applies the `effects[]` array. It does NOT execute special side effects for hiring (doesn't call hire logic), features (doesn't add to backlog), or layoffs. Players who let hiring decisions expire get charged costs but never get the employee.

### C6. `product.churnRate` can exceed 1.0 (100%)
**Files:** `src/data/events/routine.ts`, `src/data/events/crisis.ts`
**Confidence:** 95%

Multiple events add to `product.churnRate` with no upper bound check. If several churn-increasing events fire in sequence, churn can exceed 100%, causing the game to lose all customers and potentially go negative.

### C7. `product.customers` can go negative
**Files:** `src/data/events/market.ts:647`, `src/data/events/routine.ts`
**Confidence:** 95%

Events like market downturns apply `product.customers add -2` or similar negative values. With no floor at zero, customer count can become negative, breaking revenue calculations and UI displays.

### C8. `finances.weeklyRevenue` can go negative
**Files:** `src/data/events/routine.ts:781-782`
**Confidence:** 90%

Revenue-reducing events can push `weeklyRevenue` below zero. No floor check exists in the engine or event processing.

### C9. Hiring events don't update `team.teamSize`
**Files:** `src/data/events/routine.ts`
**Confidence:** 95%

Several hiring-related events in routine.ts apply effects to `finances.cash` (signing bonus) and `team.avgSalary` but never increment `team.teamSize`. The player pays for a hire but the team never grows through event effects alone.

### C10. WeekRecap modal calls side effect during render
**Files:** `src/components/shared/WeekRecap.tsx:48-51`
**Confidence:** 95%

`dismissWeekRecap()` is called directly in the render body (not in a `useEffect`). In React 18+ strict mode and React 19, this causes double-firing and can dismiss the recap before the user sees it.

---

## Important Bugs

### I1. Churn rate divided by 4 — all churn effects 4x weaker than labeled
**Files:** `src/engine/simulation.ts:791`
**Confidence:** 82%

`simulateRevenue()` divides churn by 4 (likely a leftover from monthly-to-weekly conversion). All churn-related events and mechanics are effectively 4x weaker than their stated values, making customer retention unrealistically sticky.

### I2. `founderEquity` can go negative with no floor
**Files:** `src/engine/tick.ts:687-688`
**Confidence:** 88%

Fundraising dilutes founder equity, but there's no `Math.max(0, ...)` floor. After several rounds, equity can become negative, showing nonsensical negative percentages in the UI.

### I3. `applySeekFunding` ignores `targetStage` parameter
**Files:** `src/engine/tick.ts:588`
**Confidence:** 85%

The function accepts a `targetStage` parameter but always advances to the next sequential stage. If a player or event specifies a target stage, it's ignored.

### I4. Decision spam from tautological conditions
**Files:** `src/engine/simulation.ts:1233`
**Confidence:** 80%

Some decision-generating conditions are always true (e.g., checking if a value > 0 when it's always positive). This causes the same decisions to appear every week, flooding the decision queue.

### I5. Duplicate culture effects in crisis events
**Files:** `src/data/events/crisis.ts:352-356`
**Confidence:** 85%

Some crisis events have the same effect path listed twice (e.g., two entries modifying `team.morale`). Only one takes effect, but the intent was likely for different effects.

### I6. Hire events charge double signing bonus
**Files:** `src/data/events/routine.ts:26-32`, `src/engine/tick.ts`
**Confidence:** 80%

Hiring events include a cash deduction in their `effects[]` array AND the `applyHire` function in tick.ts also deducts a signing bonus. The player is charged twice.

### I7. BackgroundMusic YouTube script accumulates on every mount
**Files:** `src/components/shared/BackgroundMusic.tsx:45-53`
**Confidence:** 90%

The YouTube IFrame API script tag is appended to `<head>` on every component mount with no cleanup or duplicate check. Navigating between screens accumulates script tags, potentially causing memory leaks and multiple player instances.

### I8. Market Size shows raw numbers on new game screen
**Observed:** Manual testing
Market selection step shows "5000000" instead of "$5M" for market sizes. No number formatting applied.

### I9. Sparkline charts render with negative dimensions
**Files:** `src/components/shared/KPICard.tsx`, `src/components/shared/SparklineChart.tsx`
**Observed:** Console warnings: `The width(-1) and height(-1) are too small for a Recharts chart`

`SparklineChart` has `width={160}` hardcoded while wrapped in `ResponsiveContainer`. The container reports -1 dimensions when the parent hasn't laid out yet, causing Recharts warnings every render.

### I10. Week Recap heading shows wrong week number (off-by-one)
**Observed:** Manual testing
"Week 1 Recap" displayed when player has just completed Week 1 and is now on Week 2. The recap should say "Week 1 Recap" but the timing/display is confusing relative to the current week indicator.

### I11. Queued Actions shows raw internal IDs
**Observed:** Manual testing
The "Queued Actions" section displays entries like `"Event response: decision mlr533qd-4 → option feature_t..."` instead of human-readable text describing the action.

### I12. Save Game has no visual feedback
**Observed:** Manual testing
Clicking "Save Game" performs the save silently. No toast, notification, or visual confirmation that the save succeeded.

### I13. Load Game shows valuation instead of cash
**Observed:** Manual testing
The load game dialog shows "$165K" (the valuation) where a player would expect to see their cash balance, which was $83.7K.

### I14. Decisions badge doesn't clear after selecting an option
**Observed:** Manual testing
The red notification badge on the Decisions tab continues showing a count after the player has already responded to decisions.

### I15. FundraisingPanel: non-global replace misses hyphens
**Files:** `src/components/shared/FundraisingPanel.tsx:118`
**Confidence:** 90%

`nextStage.replace('-', ' ')` only replaces the first hyphen. Stages like `"series-a"` work, but `"pre-seed"` edge cases or future multi-hyphen stages would display incorrectly. Should be `replace(/-/g, ' ')`.

### I16. MainMenuScreen: modal not closed after loadGame
**Files:** `src/components/screens/MainMenuScreen.tsx:122-124`
**Confidence:** 85%

After loading a game from the save slot modal, the modal state isn't reset. If the player returns to the main menu, the modal may still be visible.

### I17. DecisionScreen uses array index as key
**Files:** `src/components/screens/DecisionScreen.tsx:152-176`
**Confidence:** 85%

Decision cards use array index as React key. When decisions are added/removed, React may reuse DOM nodes incorrectly, causing stale UI or animation glitches.

### I18. `founderEquity` uses `add` instead of `multiply` in AI events
**Files:** `src/data/events/ai-specific.ts:1175`
**Confidence:** 80%

An event applies `founderEquity add -5` which subtracts 5 percentage points. The likely intent was `multiply 0.95` (5% dilution), which scales relative to current equity rather than a flat deduction.

### I19. Crisis API outage fires without AI agents
**Files:** `src/data/events/crisis.ts:455-456`
**Confidence:** 75%

The "API Provider Outage" crisis event can fire even when the player has no AI agents. The condition check doesn't verify AI agent count, making the event irrelevant and confusing.

### I20. Duplicate/conflicting same-path effects in events
**Files:** `src/data/events/ai-specific.ts`, `src/data/events/routine.ts`
**Confidence:** 85%

8+ events have duplicate effects targeting the same state path (e.g., two entries both modifying `team.morale`). Only the last one applies, silently dropping the first. Likely indicates copy-paste errors.

### I21. GameOverScreen: S and D grades share same orange color
**Files:** `src/components/screens/GameOverScreen.tsx:9-18`
**Confidence:** 90%

The grade color mapping uses the same orange (`text-orange-400`) for both S-tier (best) and D-tier (near-worst). S-tier should have a distinct premium color.

### I22. AppShell: hard `min-w-[1024px]` with no responsive fallback
**Files:** `src/components/layout/AppShell.tsx:12`
**Confidence:** 90%

The layout enforces a 1024px minimum width. On tablets and phones, this forces horizontal scrolling with no responsive alternative. Combined with sidebar taking nearly half the screen at 375px.

### I23. YC event equity uses multiply instead of add
**Files:** `src/data/events/opportunity.ts` or `ai-specific.ts`
**Confidence:** 75%

A Y Combinator event applies `founderEquity multiply 0.93` (7% dilution). But YC takes a fixed 7% stake, so it should be `add -7` regardless of current equity level.

---

## Minor Bugs

### M1. `contentSeoWeeks` 1-week lag in compounding
**Files:** `src/engine/simulation.ts`
**Confidence:** 70%

Content/SEO marketing effects have a 1-week lag before compounding starts. The counter increments after the effect is applied rather than before, causing the first week to always use 0.

### M2. `lowMoraleWeeks` off-by-one
**Files:** `src/engine/simulation.ts`
**Confidence:** 70%

Similar to M1 — the low morale counter increments after the morale check, so the first week of low morale doesn't trigger escalating penalties.

### M3. No confirmation dialog when leaving game to Main Menu
**Observed:** Manual testing
Pressing Escape immediately returns to main menu with no "Are you sure?" prompt. Unsaved progress is lost.

### M4. P&L missing Overhead line after Week 1
**Observed:** Manual testing
The Profit & Loss breakdown doesn't show the overhead/infrastructure cost line item, even though `calculateWeeklyBurn` includes it.

### M5. Stray "$0" element at bottom of page
**Observed:** Manual testing
A floating "$0" text appears at the bottom of the viewport — likely a tooltip or label that isn't properly hidden.

### M6. BackgroundMusic toggle has no accessible label
**Files:** `src/components/shared/BackgroundMusic.tsx:87-94`
**Confidence:** 85%

The music toggle button has no `aria-label` or screen-reader accessible text.

### M7. WeekRecap: no keyboard trap, no ARIA role
**Files:** `src/components/shared/WeekRecap.tsx`
**Confidence:** 80%

The week recap modal overlay doesn't trap keyboard focus and lacks `role="dialog"` and `aria-modal="true"`.

### M8. TechDebtMeter: SVG arc clips near top
**Files:** `src/components/shared/TechDebtMeter.tsx`
**Confidence:** 75%

The circular SVG gauge arc gets clipped when the value approaches 100% due to stroke width not accounted for in the viewBox.

### M9. Competitor table needs horizontal scrolling
**Observed:** Manual testing
At standard viewport widths, the competitor comparison table columns are cut off with no scroll indicator.

### M10. Event Feed text clipped at tablet width
**Observed:** Manual testing
At 768px viewport width, event feed entries are truncated without ellipsis or expand option.

---

## Architecture Issue: Derived vs. Stored State Conflict

The most systemic issue in the codebase is the conflict between **event effects that modify state values** and **derived calculations that recompute those values from scratch**. This affects three critical metrics:

| Metric | Events modify | Derived function overwrites |
|--------|--------------|---------------------------|
| `weeklyBurn` | ✅ multiply/add effects | `calculateWeeklyBurn()` |
| `weeklyRevenue` | ✅ multiply/add effects | `simulateRevenue()` |
| `valuation` | ✅ multiplier in `simulateMarket()` | `calculateValuation()` |

**Recommended fix:** Either (a) remove event effects that target these paths and only use derived calculations, or (b) incorporate event modifiers as multipliers/bonuses that the derived calculations respect (e.g., store a `burnMultiplier` that `calculateWeeklyBurn` applies).

---

## Reproduction Notes

- **Dev server:** `npm run dev` on port 5174 (5173 was occupied)
- **Browser testing:** Playwright Chromium via MCP
- **Game flow tested:** Main Menu → New Game (all 5 steps) → Overview → Company → Finance → Market → Decisions → Week advancement → Save/Load → Responsive (768px, 375px)
- **Console monitored** for React warnings and runtime errors
