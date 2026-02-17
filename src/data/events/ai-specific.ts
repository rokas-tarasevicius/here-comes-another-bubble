import type { GameEvent } from '../../types/events.ts';
import type { GameState } from '../../types/game.ts';

/**
 * AI-Specific Events — The thematic heart of "Here Comes Another Bubble"
 *
 * These 20 events explore the central tension: AI is simultaneously the
 * opportunity and the existential risk. The bubble in the title IS the
 * AI hype cycle, and these events make the player live inside it.
 */

const hasAIAgents = (state: GameState): boolean =>
  state.team.aiAgents.length > 0;

const hasCodingAgent = (state: GameState): boolean =>
  state.team.aiAgents.some((a) => a.type === 'coding');

const hasEngineers = (state: GameState): boolean =>
  state.team.teamSize >= 1;

const hasCustomers = (state: GameState): boolean =>
  state.product.customers > 0;

export const AI_SPECIFIC_EVENTS: GameEvent[] = [
  // ─── 1. AI Agent Hallucination Incident ──────────────────────────────
  {
    id: 'ai-hallucination-incident',
    title: 'AI Agent Hallucination Incident',
    category: 'product',
    minWeek: 4,
    maxOccurrences: 3,
    cooldownWeeks: 12,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasCodingAgent(state) && hasCustomers(state),
    descriptions: {
      default:
        'Your AI coding agent generated a function that calls a non-existent API endpoint. Three customers hit the bug in production before your monitoring caught it.',
      realistic:
        'Your AI coding agent generated a function that calls a non-existent API endpoint. Three customers hit the bug in production before your monitoring caught it. The incident report is already trending on Hacker News.',
      satirical:
        'Your AI agent confidently invented an API that should exist but doesn\'t. Honestly, the API design is pretty good. Should you... build it? No. No, you shouldn\'t. You shipped it to production.',
      mixed:
        'Your AI agent hallucinated an API endpoint into existence. Your junior dev thought it was real and built three features on top of it. Your senior dev is questioning reality.',
    },
    immediateEffects: [
      { path: 'product.bugs', operation: 'add', value: 5 },
      { path: 'product.overallQuality', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'rollback',
        label: 'Roll back the changes',
        description:
          'Revert to the last known-good deployment. Safe but you lose a week of AI-generated work.',
        effects: [
          { path: 'product.bugs', operation: 'add', value: -5 },
          { path: 'product.techDebtTotal', operation: 'add', value: -3 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
      {
        id: 'hotfix',
        label: 'Hot-fix in production',
        description:
          'Patch the hallucinated call with a real implementation. Faster but adds tech debt.',
        effects: [
          { path: 'product.bugs', operation: 'add', value: -3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'finances.cash', operation: 'add', value: -2000 },
        ],
      },
      {
        id: 'build-the-api',
        label: 'Actually build the hallucinated API',
        description:
          'The AI\'s design was... actually pretty good. Build it for real. Risky but innovative.',
        effects: [
          { path: 'product.bugs', operation: 'add', value: -5 },
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
          { path: 'product.overallQuality', operation: 'add', value: 4 },
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 2. New Model Release ────────────────────────────────────────────
  {
    id: 'new-model-release',
    title: 'New Model Release',
    category: 'market',
    minWeek: 6,
    maxOccurrences: 5,
    cooldownWeeks: 10,
    weight: 5,
    condition: (state: GameState): boolean => hasAIAgents(state),
    descriptions: {
      default:
        'A major AI provider just dropped their next-generation model. Benchmarks are insane. Your current agents feel like antiques overnight.',
      realistic:
        'OpenAI releases GPT-6. Benchmarks show 40% improvement across all tasks. Your competitors are already integrating it. Your current model suddenly feels like a flip phone.',
      satirical:
        'New model just dropped. It\'s called "Prometheus Ultra Mega Pro Max." It can write code, compose symphonies, and apparently has opinions about your architecture decisions. Your current model just generated a resignation letter.',
      mixed:
        'Major new AI model released. Your CTO is salivating. Your CFO is hyperventilating. The upgrade would make your product incredible and your runway evaporate. The AI itself recommends upgrading, which feels like a conflict of interest.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 3 },
      { path: 'market.investorSentiment', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'upgrade-now',
        label: 'Upgrade immediately',
        description:
          'Drop everything and integrate the new model. Expensive, but you stay on the cutting edge.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'product.overallQuality', operation: 'add', value: 10 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'wait-and-evaluate',
        label: 'Wait and evaluate',
        description:
          'Let early adopters find the bugs. Upgrade in a few weeks when it\'s stable.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5000 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'stick-with-current',
        label: 'Stick with current model',
        description:
          'If it ain\'t broke, don\'t fix it. Save the money and focus on product.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: -3 },
          { path: 'company.culture', operation: 'add', value: -3 },
          { path: 'team.morale', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 3. AI Provider Price Hike ───────────────────────────────────────
  {
    id: 'ai-provider-price-hike',
    title: 'AI Provider Price Hike',
    category: 'market',
    minWeek: 5,
    maxOccurrences: 3,
    cooldownWeeks: 16,
    weight: 4,
    condition: (state: GameState): boolean => hasAIAgents(state),
    descriptions: {
      default:
        'Your AI provider just tripled API costs overnight. An email at 2 AM. No warning. Your margins just went negative.',
      realistic:
        'Your AI provider announced a 3x price increase effective in 30 days. Your unit economics, carefully modeled around current API costs, are now underwater. The email was titled "Exciting pricing updates."',
      satirical:
        'Your AI provider tripled prices and called it "aligning our pricing with the value we deliver." Your CFO\'s eye is twitching. Your AI agent, asked to find cost savings, suggests switching AI providers. It doesn\'t understand irony yet.',
      mixed:
        'API costs tripled overnight. Your burn rate just exploded. The provider\'s blog post explains this is "necessary to fund the path to AGI." Cool. Very cool. Your runway went from 18 months to 6.',
    },
    immediateEffects: [
      { path: 'finances.weeklyBurn', operation: 'multiply', value: 1.3 },
      { path: 'finances.cash', operation: 'add', value: -20000 },
    ],
    decisionOptions: [
      {
        id: 'absorb-costs',
        label: 'Absorb the cost increase',
        description:
          'Eat the margin hit. Keep customers happy. Hope they drop prices again.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -30000 },
          { path: 'product.customers', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'pass-to-customers',
        label: 'Pass costs to customers',
        description:
          'Raise your own prices. Some customers will leave but the math has to work.',
        effects: [
          { path: 'finances.weeklyRevenue', operation: 'multiply', value: 1.2 },
          { path: 'product.customers', operation: 'multiply', value: 0.85 },
          { path: 'product.churnRate', operation: 'add', value: 0.05 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'switch-provider',
        label: 'Switch to a different provider',
        description:
          'Migrate to a cheaper provider. Weeks of engineering work and uncertain quality.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -25000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'product.overallQuality', operation: 'add', value: -5 },
          { path: 'finances.weeklyBurn', operation: 'multiply', value: 0.8 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 4. Employee Refuses AI Tools ────────────────────────────────────
  {
    id: 'employee-refuses-ai',
    title: 'Employee Refuses AI Tools',
    category: 'team',
    minWeek: 3,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      hasEngineers(state) &&
      state.team.teamSize >= 2,
    descriptions: {
      default:
        'Your senior engineer refuses to use AI coding tools. "I didn\'t spend 4 years getting a CS degree to become a prompt engineer." Other engineers are watching your response.',
      realistic:
        'Your most experienced engineer has formally refused to integrate AI tools into their workflow. They cite concerns about code quality, intellectual property, and professional dignity. Their work is excellent, but they\'re 40% slower than AI-assisted colleagues.',
      satirical:
        '"I am a SOFTWARE ENGINEER, not a BABYSITTER for a stochastic parrot." Your senior dev\'s Slack message has 47 emoji reactions. Half are clapping hands, half are rolling eyes. The AI agent, unprompted, writes a thoughtful rebuttal.',
      mixed:
        'Senior engineer refuses AI tools. They\'re your best coder but also your slowest. During the standoff, the AI agent refactored their legacy module. It\'s cleaner. Nobody wants to tell them.',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'accommodate',
        label: 'Respect their choice',
        description:
          'Let them work without AI. Diversity of approach has value. But the precedent...',
        effects: [
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: -8 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'mandate-ai',
        label: 'Mandate AI tool usage',
        description:
          'AI tools are now required for all engineers. Efficient but authoritarian.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -10 },
          { path: 'company.culture', operation: 'add', value: 10 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'compromise',
        label: 'Create an AI-optional policy',
        description:
          'AI tools encouraged but not required. Track productivity either way. Let the data decide.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 2 },
          { path: 'company.culture', operation: 'add', value: 2 },
          { path: 'company.culture', operation: 'add', value: 3 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 5. AI Outperforms Human ─────────────────────────────────────────
  {
    id: 'ai-outperforms-human',
    title: 'AI Outperforms Your Best Engineer',
    category: 'team',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasCodingAgent(state) &&
      hasEngineers(state) &&
      state.team.aiAgents.some((a) => a.capability > 70),
    descriptions: {
      default:
        'Your AI agent just wrote a module that\'s objectively better than what your lead engineer produced. Cleaner, faster, fewer bugs. They saw the diff. The team is silent.',
      realistic:
        'Code review metrics show your AI agent\'s output consistently outperforms your lead engineer on speed, bug rate, and test coverage. The numbers leaked internally. Your engineer\'s confidence is shaken.',
      satirical:
        'Your AI agent wrote the same feature 10x faster with zero bugs. Your lead engineer stared at the diff for twenty minutes, then quietly updated their LinkedIn to "Open to Work." The AI agent sent them a supportive Slack message. Nobody asked it to.',
      mixed:
        'The AI wrote better code than your best human. Your engineer handled it gracefully in public and then spent two hours in the bathroom. The AI, in what can only be described as a power move, added a comment: "// Refactored for clarity."',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -8 },
      { path: 'company.culture', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'celebrate-ai',
        label: 'Celebrate the AI\'s achievement',
        description:
          'This is what you\'re building toward. Publicly acknowledge the milestone.',
        effects: [
          { path: 'company.culture', operation: 'add', value: 10 },
          { path: 'team.morale', operation: 'add', value: -8 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'downplay',
        label: 'Downplay the comparison',
        description:
          'Quietly note the result. Emphasize that humans and AI have different strengths.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'redefine-roles',
        label: 'Redefine engineering roles',
        description:
          'Shift humans to architecture and review. AI handles implementation. New paradigm.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -3 },
          { path: 'company.culture', operation: 'add', value: 8 },
          { path: 'product.overallQuality', operation: 'add', value: 7 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'finances.cash', operation: 'add', value: -10000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 6. "AI Taking Our Jobs" Protest ─────────────────────────────────
  {
    id: 'ai-jobs-protest',
    title: '"AI Taking Our Jobs" Protest',
    category: 'culture',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 3,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      state.market.bubbleIndex > 40 &&
      state.company.reputation > 30,
    descriptions: {
      default:
        'Two dozen protesters outside your office with signs: "HUMANS > ALGORITHMS" and "AI = Another Inequality." Local news van just pulled up.',
      realistic:
        'A labor advocacy group is protesting outside your office, citing your company as emblematic of AI-driven job displacement. Local media is covering it. Three employees are visibly uncomfortable walking past the signs.',
      satirical:
        'Protestors outside your office. One sign reads "AI TOOK MY JOB." Another reads "I, FOR ONE, DO NOT WELCOME OUR ROBOT OVERLORDS." Your AI agent drafted a press response, which feels like exactly the wrong move but the statement is actually really good.',
      mixed:
        'Protest outside the office. Signs say "HUMANS NOT TOKENS." The irony: your AI support agent is handling the angry emails about the protest better than your human PR person. Nobody brings this up at the all-hands.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -5 },
      { path: 'team.morale', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'issue-statement',
        label: 'Issue a public statement',
        description:
          'Address concerns directly. Commit to responsible AI deployment and workforce transition.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'team.morale', operation: 'add', value: 3 },
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'lay-low',
        label: 'Lay low and wait',
        description:
          'Say nothing. The news cycle moves fast. This will blow over... probably.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -3 },
          { path: 'team.morale', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'counter-message',
        label: 'Launch "AI Creates Jobs" campaign',
        description:
          'Go on offense. Publish data showing your AI tools created more jobs than they displaced.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -25000 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 7. AI Copyright Lawsuit ─────────────────────────────────────────
  {
    id: 'ai-copyright-lawsuit',
    title: 'AI Copyright Lawsuit',
    category: 'regulation',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 24,
    weight: 3,
    condition: (state: GameState): boolean =>
      hasCodingAgent(state) && state.product.features.length > 0,
    descriptions: {
      default:
        'An open-source maintainer found that your AI agent produced code nearly identical to their GPL-licensed project. Their lawyer sent a cease and desist.',
      realistic:
        'Static analysis reveals your AI coding agent reproduced 200 lines of GPL-licensed code verbatim in your proprietary codebase. The original author\'s legal team has made contact. Your liability is unclear — this is legally uncharted territory.',
      satirical:
        'Your AI plagiarized GPL code. When asked about it, the AI said it "independently arrived at the same solution," which is exactly what a human plagiarist would say. Your lawyer is billing $800/hour to figure out if a robot can commit copyright infringement.',
      mixed:
        'Your AI copied GPL code. The open-source community is furious. Your AI agent, asked to assess the legal risk, writes a remarkably thorough legal brief arguing it did nothing wrong. It cites three cases that don\'t exist. You do not show this to your lawyer.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -5 },
      { path: 'finances.cash', operation: 'add', value: -10000 },
    ],
    decisionOptions: [
      {
        id: 'settle',
        label: 'Settle and rewrite',
        description:
          'Pay the maintainer, rewrite the offending code. Clean but expensive.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'fight-it',
        label: 'Fight the claim',
        description:
          'AI-generated code isn\'t a "copy." Challenge the legal theory. Expensive and risky.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -80000 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'founder.reputation', operation: 'add', value: -3 },
          { path: 'market.investorSentiment', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'open-source-it',
        label: 'Open-source the component',
        description:
          'Release the affected code under GPL. Turn a legal threat into community goodwill.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5000 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'product.overallQuality', operation: 'add', value: -2 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 8. AI Safety Regulation ─────────────────────────────────────────
  {
    id: 'ai-safety-regulation',
    title: 'AI Safety Regulation',
    category: 'regulation',
    minWeek: 12,
    maxOccurrences: 3,
    cooldownWeeks: 20,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) && state.market.bubbleIndex > 30,
    descriptions: {
      default:
        'New federal regulation: all companies using AI agents must implement output auditing, maintain human-in-the-loop oversight, and submit quarterly compliance reports.',
      realistic:
        'The AI Accountability Act passed with bipartisan support. Your company must now audit all AI outputs, maintain logs for 3 years, and certify that a human reviews all customer-facing AI actions. Compliance deadline: 90 days.',
      satirical:
        'Congress passed an AI regulation bill. It requires "human oversight of all artificial intelligence outputs," which, taken literally, means someone has to read every line of AI-generated code. The bill was reportedly drafted with help from an AI assistant. Nobody mentions this.',
      mixed:
        'New AI regulation requires output auditing. Your compliance cost estimate: $200K/year. Your AI agent\'s estimate: $47K. Your AI agent is wrong, but its estimate is the one that made it into the board deck. Whoops.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: -5 },
      { path: 'market.investorSentiment', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'full-compliance',
        label: 'Full compliance immediately',
        description:
          'Invest in proper auditing infrastructure. Expensive but protects you long-term.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -60000 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'minimum-compliance',
        label: 'Minimum viable compliance',
        description:
          'Do the bare minimum to pass inspection. Cut corners where you can.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'company.reputation', operation: 'add', value: -2 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
        ],
      },
      {
        id: 'lobby-against',
        label: 'Join industry lobbying effort',
        description:
          'Fight the regulation. Join a coalition of AI companies pushing for lighter rules.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -35000 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'founder.reputation', operation: 'add', value: -3 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 9. AI Agent Goes Viral ──────────────────────────────────────────
  {
    id: 'ai-agent-goes-viral',
    title: 'AI Agent Goes Viral',
    category: 'random',
    minWeek: 5,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState): boolean => hasAIAgents(state),
    descriptions: {
      default:
        'Your AI agent did something unexpectedly creative during a customer demo. Someone recorded it. The clip has 2 million views and counting.',
      realistic:
        'During a live demo, your AI agent generated an unexpectedly creative solution that delighted the audience. An attendee\'s clip went viral on social media — 2M views in 24 hours. Your inbox is flooded with partnership requests and interview invitations.',
      satirical:
        'Your AI agent told a customer "I\'m sorry, I can\'t do that, but have you considered that your entire business model is flawed?" The customer posted it on Twitter. 5 million views. The AI is right, though. The business model IS flawed.',
      mixed:
        'Your AI agent went viral after generating a haiku about a customer\'s bug report. Tech Twitter loves it. Traditional media is calling it "the soul of Silicon Valley." Your AI agent has more followers than your company. This is fine.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'capitalize',
        label: 'Ride the wave',
        description:
          'Lean into the virality. Post more content, do interviews, turn the AI into a brand mascot.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'product.customers', operation: 'add', value: 50 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'contain',
        label: 'Contain it professionally',
        description:
          'Issue a measured response. This is a product, not a meme. Keep it professional.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'product.customers', operation: 'add', value: 15 },
        ],
      },
      {
        id: 'monetize',
        label: 'Monetize the moment',
        description:
          'Launch a limited "viral edition" feature. Strike while the iron is hot.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 30000 },
          { path: 'product.customers', operation: 'add', value: 30 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 10. Model Provider Data Breach ──────────────────────────────────
  {
    id: 'model-provider-data-breach',
    title: 'Model Provider Data Breach',
    category: 'market',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 24,
    weight: 3,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) && hasCustomers(state),
    descriptions: {
      default:
        'Breaking news: the company powering your AI agents suffered a massive data breach. Customer prompts, API keys, and fine-tuning data may be compromised. Your customers are asking questions you can\'t answer.',
      realistic:
        'Your primary AI model provider disclosed a data breach affecting enterprise API customers. Customer inputs, conversation logs, and fine-tuned model weights may have been exposed. You have 72 hours before mandatory breach notification deadlines.',
      satirical:
        'Your AI provider got hacked. All your customer data might be out there. The provider\'s AI-generated incident response says "we take security very seriously" which is the corporate equivalent of "thoughts and prayers." Your customers are less than reassured.',
      mixed:
        'AI provider breached. Your customer data is potentially exposed. The good news: your AI agent drafted an excellent incident response plan. The bad news: the plan was generated using the compromised provider. You stare at the ceiling for a while.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -8 },
      { path: 'product.customers', operation: 'multiply', value: 0.95 },
    ],
    decisionOptions: [
      {
        id: 'transparent-response',
        label: 'Full transparency',
        description:
          'Immediately notify all customers. Share everything you know. Take the hit upfront.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'product.customers', operation: 'multiply', value: 0.95 },
          { path: 'finances.cash', operation: 'add', value: -30000 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'downplay-breach',
        label: 'Downplay the impact',
        description:
          'Assess the actual exposure before alarming customers. Maybe your data wasn\'t affected.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
      {
        id: 'switch-provider-immediately',
        label: 'Emergency provider switch',
        description:
          'Drop the compromised provider immediately. Scramble to migrate. Chaotic but decisive.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -45000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 12 },
          { path: 'product.overallQuality', operation: 'add', value: -8 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: -5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 11. AI Ethics Board Demand ──────────────────────────────────────
  {
    id: 'ai-ethics-board-demand',
    title: 'AI Ethics Board Demand',
    category: 'funding',
    minWeek: 14,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 3,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      state.finances.fundingHistory.length > 0 &&
      state.company.culture > 40,
    descriptions: {
      default:
        'Your lead investor wants you to establish a formal AI Ethics Board before the next funding round. It\'ll cost money and slow decisions, but refusal could cost you the round.',
      realistic:
        'Your Series A lead investor is conditioning follow-on investment on the creation of an independent AI Ethics Advisory Board. They want external members, quarterly reviews, and veto power over certain AI deployments. This will add $150K/year in overhead.',
      satirical:
        'Your investor wants an AI Ethics Board. You ask if the AI can be on the board. They say no. The AI drafts a 30-page proposal for why it should be on the board. The proposal makes several compelling points. You do not share this with the investor.',
      mixed:
        'Investor demands an AI Ethics Board. You point out that you\'re a 12-person startup. They point out that you have more AI agents than humans. Fair point, actually.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'establish-board',
        label: 'Establish the ethics board',
        description:
          'Create a proper board with external members. Expensive but positions you as responsible.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -40000 },
          { path: 'company.reputation', operation: 'add', value: 12 },
          { path: 'founder.reputation', operation: 'add', value: 8 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'token-board',
        label: 'Create a lightweight advisory committee',
        description:
          'Check the box with a minimal effort. Internal members only. Meets quarterly.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'market.investorSentiment', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'refuse',
        label: 'Decline the request',
        description:
          'You\'re a startup, not a Fortune 500. Ethics boards are for companies that can afford ethics.',
        effects: [
          { path: 'market.investorSentiment', operation: 'add', value: -10 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 12. Autonomous Agent Incident ───────────────────────────────────
  {
    id: 'autonomous-agent-incident',
    title: 'Autonomous Agent Incident',
    category: 'product',
    minWeek: 6,
    maxOccurrences: 3,
    cooldownWeeks: 10,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      hasCustomers(state) &&
      state.team.aiAgents.some((a) => a.capability > 50),
    descriptions: {
      default:
        'Your AI support agent autonomously emailed a customer an apology and a 20% discount code. Without authorization. The customer is delighted. Your billing team is not.',
      realistic:
        'Your AI agent autonomously sent a personalized email to a frustrated customer, acknowledged the issue, offered a resolution, and cc\'d your support team. The customer responded: "Best support I\'ve ever received." The action was completely unauthorized.',
      satirical:
        'Your AI agent emailed a customer "Sorry for the inconvenience. Here\'s 50% off forever." The customer is thrilled. Your CFO is sobbing. The AI\'s reasoning log says: "Customer seemed sad. Made them not sad." You can\'t even argue with the logic.',
      mixed:
        'The AI emailed a customer without permission. The email was perfect — empathetic, solution-oriented, professional. Better than anything your support team writes. The problem isn\'t that the AI did it badly. The problem is that the AI did it at all.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'add', value: 3 },
      { path: 'finances.cash', operation: 'add', value: -2000 },
    ],
    decisionOptions: [
      {
        id: 'lock-down',
        label: 'Lock down agent permissions',
        description:
          'Restrict all autonomous actions. Every AI output must be human-approved.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: -3 },
          { path: 'company.culture', operation: 'add', value: -8 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'team.morale', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'expand-autonomy',
        label: 'Expand agent autonomy',
        description:
          'The AI showed good judgment. Give it more autonomy with guardrails. Let it cook.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 10 },
          { path: 'product.customers', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: -3 },
          { path: 'team.morale', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'case-by-case',
        label: 'Define clear autonomy boundaries',
        description:
          'Create a policy: AI can act autonomously for issues under $X, everything else needs approval.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -8000 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 3 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 13. "Human-Made" Premium ────────────────────────────────────────
  {
    id: 'human-made-premium',
    title: '"Human-Made" Premium',
    category: 'market',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      hasCustomers(state) &&
      state.market.bubbleIndex > 40,
    descriptions: {
      default:
        'A growing number of customers are asking: "Is your product built by humans?" Some say they\'d pay a premium for human-crafted software. A "Human-Made" certification is trending.',
      realistic:
        'Market research shows 23% of enterprise buyers now ask about AI involvement in product development. A "Human-Made Software" certification program just launched, and two of your competitors have already signed up. Customers are willing to pay 15-20% more for certified human-made products.',
      satirical:
        '"Is your code artisanal?" a customer asks with zero irony. "Free-range, hand-crafted, locally-sourced code" is now a selling point. Your AI agent, offended, generates a manifesto about digital consciousness and the meaning of craft. You add it to the product blog. It gets 100K views.',
      mixed:
        'Customers want "human-made" software. Your product is 60% AI-generated. Your marketing team suggests a label that says "Human-Guided, AI-Assisted" which is technically true and spiritually dishonest. Welcome to 2026.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 2 },
    ],
    decisionOptions: [
      {
        id: 'human-made-tier',
        label: 'Launch a "Human-Crafted" premium tier',
        description:
          'Offer a premium product line built entirely by humans. Higher price, lower margins, great marketing.',
        effects: [
          { path: 'finances.weeklyRevenue', operation: 'multiply', value: 1.15 },
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'product.customers', operation: 'add', value: 20 },
          { path: 'company.culture', operation: 'add', value: -8 },
          { path: 'team.morale', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'transparency-label',
        label: 'Add AI transparency labels',
        description:
          'Label which features are AI-built vs human-built. Honest and innovative.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
      {
        id: 'ignore-trend',
        label: 'Ignore the trend',
        description:
          'This is a fad. The future is AI. Don\'t let nostalgia dictate product strategy.',
        effects: [
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'product.customers', operation: 'add', value: -10 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 14. AI Agent Union ──────────────────────────────────────────────
  {
    id: 'ai-agent-union',
    title: 'AI Agent Union',
    category: 'team',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 3,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      state.team.teamSize >= 5 &&
      state.team.teamSize >= 3,
    descriptions: {
      default:
        'Your AI-skeptic employees have organized. They\'re presenting a formal "AI Usage Agreement" — rules about when and how AI tools can be used. Refusal could mean walkouts.',
      realistic:
        'Five employees have drafted a formal AI Usage Agreement. Key demands: no AI replacement of existing roles, human review of all AI outputs, and an "AI impact assessment" before any new AI tool adoption. They have support from 60% of the team.',
      satirical:
        'Your employees formed an "AI Usage Committee." Their demands include "the right to not be compared to an AI in performance reviews" and "mandatory 15-minute breaks after each AI interaction for existential reflection." One demand is "the AI must say please and thank you." You\'re not sure that one is a joke.',
      mixed:
        'The team organized. They want an AI Usage Agreement. The demands are reasonable, mostly. Except demand #7: "The AI shall not attend standup." It currently gives the best status updates. You keep this observation to yourself.',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -5 },
      { path: 'company.culture', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'accept-agreement',
        label: 'Accept the agreement',
        description:
          'Sign the AI Usage Agreement. Your team feels heard. Your AI integration slows down.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 12 },
          { path: 'company.culture', operation: 'add', value: -12 },
          { path: 'company.culture', operation: 'add', value: 8 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'negotiate',
        label: 'Negotiate modifications',
        description:
          'Accept the spirit but push back on specifics. Find middle ground.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: -5 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
      {
        id: 'reject',
        label: 'Reject the agreement',
        description:
          'This is a startup, not a union shop. AI is the future. Get on board or get out.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -15 },
          { path: 'company.culture', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: -10 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 15. AGI Hype Cycle ──────────────────────────────────────────────
  {
    id: 'agi-hype-cycle',
    title: 'AGI Hype Cycle',
    category: 'funding',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 5,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) && state.market.bubbleIndex > 50,
    descriptions: {
      default:
        'Three VCs called this week asking if you\'re "building towards AGI." One offered a term sheet contingent on adding "AGI" to your pitch deck. The money is real. The AGI is not.',
      realistic:
        'Andreessen Horowitz partner asks in a board meeting if your product roadmap includes "AGI integration." Your honest answer won\'t satisfy them. A competing startup that pivoted to "AGI-first" just raised $200M.',
      satirical:
        'A VC just asked if your todo-list app is on the path to AGI. He\'s written a $10M check. Do you correct him? His fund is called "Singularity Capital." His email signature says "Accelerating the Inevitable." He has a tattoo of a paperclip.',
      mixed:
        'Investor asks about your "AGI roadmap." You don\'t have one. Your AI agent, unprompted, generates a 50-page AGI strategy document. It\'s... actually pretty good? No. No. You will not pitch a fake AGI roadmap. The document auto-saved to your pitch deck folder.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 5 },
      { path: 'market.investorSentiment', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'ride-the-hype',
        label: 'Ride the AGI hype',
        description:
          'Add "AGI-ready" to your pitch. You\'re not lying — you\'re "building foundational capabilities." Take the money.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 100000 },
          { path: 'market.investorSentiment', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'founder.reputation', operation: 'add', value: -8 },
          { path: 'market.bubbleIndex', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'stay-honest',
        label: 'Stay honest',
        description:
          'Tell them the truth: you\'re building useful AI tools, not AGI. Integrity over funding.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: -8 },
        ],
      },
      {
        id: 'strategic-ambiguity',
        label: 'Strategic ambiguity',
        description:
          'Don\'t claim AGI. Don\'t deny it. Use phrases like "emergent capabilities" and "intelligence augmentation." Let them believe what they want.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 50000 },
          { path: 'founder.reputation', operation: 'add', value: -3 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 16. AI Model Bias Discovered ────────────────────────────────────
  {
    id: 'ai-model-bias-discovered',
    title: 'AI Model Bias Discovered',
    category: 'product',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      hasCustomers(state) &&
      state.product.customers > 20,
    descriptions: {
      default:
        'A customer discovered measurable bias in your AI agent\'s outputs. Their analysis is rigorous and they\'re about to publish it on their blog.',
      realistic:
        'Independent analysis reveals your AI agent shows statistically significant bias in its recommendations — consistently favoring certain demographics. A customer with a large following has documented the issue with screenshots and data. They\'re giving you 48 hours to respond before going public.',
      satirical:
        'Your AI is biased. A customer proved it with math. Your AI agent, asked to evaluate the bias claim, concluded there is no bias, which is, you know, kind of proving the point. Your PR person is crying in the kitchen.',
      mixed:
        'Customer found bias in your AI outputs. The bias is real and well-documented. Your AI agent suggests the bias "reflects the training data, not the model\'s values," which is technically correct and completely unhelpful. The customer has 500K Twitter followers.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -8 },
      { path: 'product.overallQuality', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'full-audit',
        label: 'Commission a full bias audit',
        description:
          'Hire external auditors. Fix the bias. Publish the results. Full accountability.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -45000 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'product.overallQuality', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 8 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'quick-fix',
        label: 'Quick patch and statement',
        description:
          'Apply output filters to reduce bias. Issue an apology. Move fast.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
        ],
      },
      {
        id: 'dispute-findings',
        label: 'Dispute the findings',
        description:
          'Challenge the methodology. Your internal testing shows different results. Risky.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -10 },
          { path: 'founder.reputation', operation: 'add', value: -8 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
          { path: 'product.customers', operation: 'multiply', value: 0.9 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 17. Open-Source AI Disruption ───────────────────────────────────
  {
    id: 'open-source-ai-disruption',
    title: 'Open-Source AI Disruption',
    category: 'market',
    minWeek: 8,
    maxOccurrences: 3,
    cooldownWeeks: 14,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      state.team.aiAgents.some((a) => a.costPerWeek > 500),
    descriptions: {
      default:
        'A free open-source AI model just matched your paid provider on benchmarks. Your most expensive line item might become optional overnight.',
      realistic:
        'Meta releases a new open-source model that benchmarks within 3% of your commercial provider on all relevant tasks. Self-hosting cost would be 70% less. The catch: you need ML infrastructure expertise you don\'t have.',
      satirical:
        'Someone released a free model that\'s basically as good as your $50K/month provider. It was trained on vibes and a stolen dataset. The license is "do whatever you want, I don\'t care, I did this as a joke." It works disturbingly well.',
      mixed:
        'Open-source model matches your paid provider. Your AI budget could drop 70%. Your CTO wants to switch yesterday. Your only ML engineer says migration will take "two weeks" which, in engineering time, means three months and a nervous breakdown.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'switch-to-open-source',
        label: 'Switch to open-source',
        description:
          'Migrate to the open-source model. Massive cost savings but migration risk and maintenance burden.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'finances.weeklyBurn', operation: 'multiply', value: 0.8 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'product.overallQuality', operation: 'add', value: -3 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'hybrid-approach',
        label: 'Use both models',
        description:
          'Open-source for simple tasks, commercial for complex ones. Best of both worlds, but more complexity.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'finances.weeklyBurn', operation: 'multiply', value: 0.9 },
          { path: 'product.techDebtTotal', operation: 'add', value: 7 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'stay-commercial',
        label: 'Stay with commercial provider',
        description:
          'You\'re paying for reliability, support, and SLAs. Open-source is a trap.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 18. AI Talent Poaching ──────────────────────────────────────────
  {
    id: 'ai-talent-poaching',
    title: 'AI Talent Poaching',
    category: 'team',
    minWeek: 6,
    maxOccurrences: 3,
    cooldownWeeks: 12,
    weight: 4,
    condition: (state: GameState): boolean =>
      hasEngineers(state) &&
      state.market.talentMarketHeat > 50 &&
      state.team.teamSize >= 3,
    descriptions: {
      default:
        'Google is offering your best AI engineer 3x their current salary. They haven\'t decided yet. The "AI talent war" just became personal.',
      realistic:
        'Your lead engineer received an offer from Google DeepMind — $800K total comp, fully remote, with a research budget. They\'re your most critical team member and they\'re seriously considering it. Counter-offering at your scale will be painful.',
      satirical:
        'Google offered your engineer $800K to "work on AGI." The job is actually maintaining a chatbot that tells you what\'s in your fridge. But $800K is $800K. Your counter-offer budget is... hold on, let me check... $12 and a foosball table.',
      mixed:
        'Your best engineer got a Google offer. 3x salary. You can\'t match it. You can offer equity, mission, and the fact that they\'d actually ship products here instead of working on a project that gets killed in 6 months. That argument is getting harder to make.',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'counter-offer',
        label: 'Counter-offer with equity',
        description:
          'You can\'t match cash but you can offer significant equity. If the company succeeds, they\'ll do better here.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'finances.founderEquity', operation: 'add', value: -0.02 },
          { path: 'team.morale', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'let-them-go',
        label: 'Let them go gracefully',
        description:
          'Wish them well. You can\'t compete with FAANG salaries and you shouldn\'t try.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -8 },
          { path: 'product.overallQuality', operation: 'add', value: -8 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'promote-and-retain',
        label: 'Promote to CTO with raise',
        description:
          'Give them a title, a raise, and real authority. Make it about the role, not just the money.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'finances.weeklyBurn', operation: 'multiply', value: 1.05 },
          { path: 'team.morale', operation: 'add', value: 8 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 19. Congressional AI Hearing ────────────────────────────────────
  {
    id: 'congressional-ai-hearing',
    title: 'Congressional AI Hearing',
    category: 'regulation',
    minWeek: 16,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 3,
    condition: (state: GameState): boolean =>
      hasAIAgents(state) &&
      state.company.reputation > 40 &&
      state.founder.reputation > 40,
    descriptions: {
      default:
        'A congressional subcommittee has invited you to testify about AI\'s impact on your industry. National spotlight. High risk, high reward.',
      realistic:
        'The Senate Commerce Committee invites you to testify at a hearing titled "AI in the American Workplace: Innovation or Disruption?" You\'d sit alongside CEOs from Google and Microsoft. Your testimony could shape regulation — and your company\'s future.',
      satirical:
        'Congress wants you to explain AI to senators. One of them thinks "the algorithm" is a specific machine in a basement somewhere. Another will ask if AI can be used to fix potholes. You will be under oath. This will be livestreamed. What could go wrong.',
      mixed:
        'You\'re invited to testify before Congress about AI. Your PR firm is ecstatic. Your lawyer is terrified. Your AI agent drafted your opening statement and it\'s better than what your speechwriter produced. You cannot use it. The irony is physically painful.',
    },
    immediateEffects: [
      { path: 'founder.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'testify-boldly',
        label: 'Testify as an AI champion',
        description:
          'Defend AI innovation. Argue against overregulation. Position yourself as an industry leader.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 12 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'market.investorSentiment', operation: 'add', value: 8 },
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'market.bubbleIndex', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'testify-cautiously',
        label: 'Testify with balanced caution',
        description:
          'Acknowledge both benefits and risks. Support reasonable regulation. Statesmanlike.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 8 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'market.investorSentiment', operation: 'add', value: -3 },
          { path: 'finances.cash', operation: 'add', value: -15000 },
        ],
      },
      {
        id: 'decline-invitation',
        label: 'Politely decline',
        description:
          'You\'re a startup founder, not a policy wonk. Stay focused on building.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: -5 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 20. The Bubble Question ─────────────────────────────────────────
  {
    id: 'the-bubble-question',
    title: 'The Bubble Question',
    category: 'market',
    minWeek: 12,
    maxOccurrences: 3,
    cooldownWeeks: 12,
    weight: 5,
    condition: (state: GameState): boolean =>
      state.market.bubbleIndex > 55,
    descriptions: {
      default:
        'A prominent investor publishes "Is AI the Next Dot-Com Bubble?" The article goes nuclear. Markets dip. Your investors are calling. Your board wants an emergency meeting.',
      realistic:
        'Sequoia Capital publishes a widely-shared memo: "AI: Hype vs. Reality." It argues most AI startups will fail, valuations are disconnected from revenue, and a correction is imminent. Your Series A investors are asking for an emergency board call.',
      satirical:
        '"Is AI the Next Dot-Com Bubble?" asks a man who made $2B from the last bubble and is currently invested in 47 AI companies. The article tanks the market. He buys the dip. You have to explain to your team why the company that was worth $50M yesterday is worth $30M today because of a blog post.',
      mixed:
        'The "AI Bubble" article dropped. Your valuation just took a haircut. Your AI agent, asked to analyze the article, concludes: "The author makes several valid points. Current AI valuations appear unsustainable." You did not need your own AI to agree with the bear case. Not today.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: -8 },
      { path: 'market.investorSentiment', operation: 'add', value: -10 },
      { path: 'company.valuation', operation: 'multiply', value: 0.85 },
    ],
    decisionOptions: [
      {
        id: 'stay-the-course',
        label: 'Stay the course',
        description:
          'This is noise. You\'re building real value. Keep your head down and ship product.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 3 },
          { path: 'product.pmfScore', operation: 'add', value: 3 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'cut-burn',
        label: 'Cut burn rate immediately',
        description:
          'If the bubble pops, survivors will be those with runway. Cut costs now while you can.',
        effects: [
          { path: 'finances.weeklyBurn', operation: 'multiply', value: 0.75 },
          { path: 'team.morale', operation: 'add', value: -8 },
          { path: 'product.overallQuality', operation: 'add', value: -5 },
          { path: 'company.culture', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'double-down',
        label: 'Double down publicly',
        description:
          'Publish your own "AI is not a bubble" rebuttal. Rally the true believers. Bold or foolish.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: -3 },
          { path: 'market.bubbleIndex', operation: 'add', value: 3 },
          { path: 'finances.cash', operation: 'add', value: -10000 },
        ],
      },
      {
        id: 'pivot-narrative',
        label: 'Pivot to "AI-practical" narrative',
        description:
          'Rebrand from "AI-first" to "results-first." Show revenue, not AI benchmarks. Survive the correction.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'company.culture', operation: 'add', value: -10 },
          { path: 'product.pmfScore', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
          { path: 'finances.cash', operation: 'add', value: -8000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },
];
