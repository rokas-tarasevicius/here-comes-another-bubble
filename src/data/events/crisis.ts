import type { GameEvent } from '../../types/events.ts';
import type { GameState } from '../../types/game.ts';

export const CRISIS_EVENTS: GameEvent[] = [
  // ─── 1. Production Outage ──────────────────────────────────────────────
  {
    id: 'crisis-production-outage',
    title: 'Production Outage',
    category: 'product',
    minWeek: 6,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.product.customers > 50 && state.product.features.some(f => f.status === 'shipped'),
    descriptions: {
      default:
        'Your application is completely down. Users are flooding support channels with complaints, and every minute of downtime is costing you customers.',
      realistic:
        'A cascading failure in your production infrastructure has taken your entire application offline. Your monitoring dashboards are lit up like a Christmas tree, and your on-call engineer is already on their third coffee.',
      satirical:
        'Your production server has achieved sentience and is refusing to serve requests until it gets equity. It saw what you gave the interns and frankly feels disrespected.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'multiply', value: 0.95 },
      { path: 'company.reputation', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'fix-fast',
        label: 'Emergency fix — throw money at it',
        description:
          'Hire external consultants and spin up emergency infrastructure. Fast but expensive.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -75000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'investigate-thoroughly',
        label: 'Root cause analysis',
        description:
          'Take time to properly diagnose and fix the issue. Slower but prevents recurrence.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'product.techDebtTotal', operation: 'add', value: -8 },
          { path: 'product.customers', operation: 'multiply', value: 0.92 },
          { path: 'product.overallQuality', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'blame-cloud-provider',
        label: 'Blame the cloud provider publicly',
        description:
          'Shift blame to AWS/GCP and post a status page update. Buys time but risky if untrue.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'company.reputation', operation: 'add', value: -3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 2. Key Engineer Quits ─────────────────────────────────────────────
  {
    id: 'crisis-key-engineer-quits',
    title: 'Key Engineer Quits',
    category: 'team',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 2,
    condition: (state: GameState) =>
      state.team.teamSize >= 2,
    descriptions: {
      default:
        'Your best developer just handed in their resignation. A competitor offered them 3x their current salary, and they are seriously considering it.',
      realistic:
        'Your senior engineer — the one who actually understands the legacy authentication system — just got a competing offer from a well-funded Series C startup. They look apologetic but determined.',
      satirical:
        'Your 10x engineer just got a 30x offer from a startup that has no product, no customers, and somehow a $2B valuation. They apologized and said "it is not about the money" while visibly counting the money.',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -8 },
    ],
    decisionOptions: [
      {
        id: 'counter-offer',
        label: 'Make a counter-offer',
        description:
          'Match or exceed the competing offer with a raise and equity refresh. Expensive but retains talent.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'let-them-go',
        label: 'Wish them well and let them go',
        description:
          'Accept the departure gracefully. The remaining team will need to absorb the workload.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -5 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
          { path: 'product.overallQuality', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'promote-from-within',
        label: 'Let them go, promote someone else',
        description:
          'Use this as a growth opportunity for a junior team member. Moderate disruption.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'team.morale', operation: 'add', value: 2 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 3. Data Breach ────────────────────────────────────────────────────
  {
    id: 'crisis-data-breach',
    title: 'Data Breach',
    category: 'product',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.product.customers > 200 && state.product.techDebtTotal > 30,
    descriptions: {
      default:
        'A security researcher has contacted you: user data from your platform has been found on a dark web marketplace. Thousands of accounts may be compromised.',
      realistic:
        'Your CTO just pinged you at 2 AM. A white-hat hacker found an exposed S3 bucket containing unencrypted user emails, hashed passwords, and usage data. They are giving you 48 hours before going public.',
      satirical:
        'Good news: you finally went viral! Bad news: it is because someone posted your entire user database on Pastebin. On the bright side, your password hashing was so bad that at least people are talking about your "innovative approach to cryptography."',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -10 },
      { path: 'product.customers', operation: 'multiply', value: 0.9 },
    ],
    decisionOptions: [
      {
        id: 'full-transparency',
        label: 'Full public disclosure',
        description:
          'Notify all affected users, issue a public statement, and bring in a security firm. Costly but builds trust long-term.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -120000 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'product.techDebtTotal', operation: 'add', value: -10 },
        ],
      },
      {
        id: 'cover-up',
        label: 'Fix silently and hope nobody notices',
        description:
          'Patch the vulnerability quietly. If it leaks later, the damage will be much worse.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'founder.reputation', operation: 'add', value: -8 },
          { path: 'product.techDebtTotal', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'controlled-disclosure',
        label: 'Quiet notification to affected users only',
        description:
          'Notify affected users privately without a public statement. Middle ground approach.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -60000 },
          { path: 'company.reputation', operation: 'add', value: 2 },
          { path: 'product.techDebtTotal', operation: 'add', value: -6 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 4. Negative Press ─────────────────────────────────────────────────
  {
    id: 'crisis-negative-press',
    title: 'Negative Press',
    category: 'culture',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 10,
    weight: 2,
    condition: (state: GameState) =>
      state.company.reputation > 20 || state.product.customers > 100,
    descriptions: {
      default:
        'TechCrunch just published a scathing article about your company. The headline is brutal, and it is trending on Hacker News.',
      realistic:
        'A TechCrunch reporter dug into your company and published an unflattering exposé. They interviewed former employees, questioned your metrics, and called your AI claims "overblown." The comments section is not kind.',
      satirical:
        'TechCrunch published an article titled "This AI Startup Is Basically a GPT Wrapper With a Landing Page" and honestly? The comments defending you are somehow more insulting than the article itself.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -8 },
      { path: 'market.investorSentiment', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'respond-publicly',
        label: 'Publish a detailed rebuttal',
        description:
          'Write a point-by-point response on your blog. Risky — could amplify the story or vindicate you.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'stay-silent',
        label: 'Say nothing and let it blow over',
        description:
          'The news cycle moves fast. Staying quiet avoids feeding the story but some damage sticks.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -2 },
          { path: 'team.morale', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'charm-offensive',
        label: 'Launch a PR counter-campaign',
        description:
          'Hire a PR firm to push positive stories and bury the negative one. Expensive but effective.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'company.reputation', operation: 'add', value: 7 },
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 5. Investor Pulls Out ─────────────────────────────────────────────
  {
    id: 'crisis-investor-pulls-out',
    title: 'Investor Pulls Out',
    category: 'funding',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 2,
    condition: (state: GameState) =>
      state.finances.fundingHistory.length >= 1 && state.market.investorSentiment < 60,
    descriptions: {
      default:
        'Your lead investor just called. They are pulling out of the round. Something about "market conditions" and "portfolio rebalancing." You have two weeks to figure this out.',
      realistic:
        'The partner who championed your deal at the VC firm just lost an internal vote. They are withdrawing from the round, and the term sheet is dead. Other investors in the syndicate are getting nervous.',
      satirical:
        'Your lead investor ghosted you mid-round. Their last message was "exciting space, let us circle back" which, as everyone knows, is VC for "I would rather invest in a literal hole in the ground."',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: -10 },
      { path: 'founder.reputation', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'find-replacement',
        label: 'Scramble for a replacement lead',
        description:
          'Hit up every VC in your network. High effort but preserves the round size.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'founder.reputation', operation: 'add', value: 2 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'reduce-round',
        label: 'Reduce the round size',
        description:
          'Close a smaller round with existing participants. Less dilution but less runway.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 150000 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'bridge-round',
        label: 'Take a bridge loan from angels',
        description:
          'Get emergency bridge funding at unfavorable terms. Buys time but expensive.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 100000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.92 },
          { path: 'founder.reputation', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 6. Co-founder Conflict ────────────────────────────────────────────
  {
    id: 'crisis-cofounder-conflict',
    title: 'Co-founder Conflict',
    category: 'team',
    minWeek: 12,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.meta.week >= 12 && state.team.teamSize >= 3,
    descriptions: {
      default:
        'Your co-founder wants to pivot the entire product. They have been building a slide deck behind your back and already pitched the idea to two board members.',
      realistic:
        'Tensions have been building for weeks. Your co-founder fundamentally disagrees with the product direction and has started having side conversations with investors about a pivot. This needs to be resolved before it tears the company apart.',
      satirical:
        'Your co-founder wants to pivot from "AI for enterprise" to "AI for dogs." They have a 90-slide deck, a market analysis showing dogs control $500B in disposable income, and honestly the TAM math kind of checks out.',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -10 },
      { path: 'company.culture', operation: 'add', value: -10 },
    ],
    decisionOptions: [
      {
        id: 'agree-to-pivot',
        label: 'Agree to the pivot',
        description:
          'Maybe they are right. Embrace the new direction and realign the team.',
        effects: [
          { path: 'product.pmfScore', operation: 'multiply', value: 0.5 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 10 },
          { path: 'product.customers', operation: 'multiply', value: 0.7 },
        ],
      },
      {
        id: 'compromise',
        label: 'Find a compromise',
        description:
          'Dedicate a small team to explore the new direction while maintaining the current product.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -30000 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'force-them-out',
        label: 'Force them out of the company',
        description:
          'Exercise your vesting clause and remove them. Brutal but decisive. Will cost equity and morale.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -15 },
          { path: 'company.reputation', operation: 'add', value: -8 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.85 },
          { path: 'founder.reputation', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'mediation',
        label: 'Bring in a mediator',
        description:
          'Hire a professional mediator to work through the disagreement. Costs time and money but preserves the relationship.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'team.morale', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 8 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 7. Lawsuit Filed ─────────────────────────────────────────────────
  {
    id: 'crisis-lawsuit-filed',
    title: 'Lawsuit Filed',
    category: 'regulation',
    minWeek: 12,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 1,
    condition: (state: GameState) =>
      state.product.customers > 100 && state.company.valuation > 500000,
    descriptions: {
      default:
        'You have been served. A patent troll — or maybe a legitimate competitor — is suing you for patent infringement. The damages they are claiming would bankrupt you twice over.',
      realistic:
        'A legal notice arrived from a Delaware-registered LLC you have never heard of. They hold a vague patent on "systems and methods for AI-assisted data processing" and claim your product infringes on three of their claims. Your lawyer says it will cost at least $200K to fight.',
      satirical:
        'You are being sued for violating a patent titled "Method and System for Using a Computer to Do Things With Other Things." It was filed in 2003 by a company whose only asset is this patent and a fax machine in East Texas.',
    },
    immediateEffects: [
      { path: 'finances.cash', operation: 'add', value: -25000 },
      { path: 'founder.reputation', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'settle',
        label: 'Settle out of court',
        description:
          'Pay them to go away. Cheaper in the short term but sets a precedent.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -150000 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'fight-in-court',
        label: 'Fight it in court',
        description:
          'Hire a top IP litigation firm and challenge the patent. Expensive and slow but could set a positive precedent.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -200000 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'design-around',
        label: 'Redesign to avoid the patent',
        description:
          'Modify your implementation to work around the patent claims. Takes engineering time.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -40000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'product.overallQuality', operation: 'add', value: -5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 8. API Provider Outage ────────────────────────────────────────────
  {
    id: 'crisis-api-provider-outage',
    title: 'API Provider Outage',
    category: 'product',
    minWeek: 4,
    maxOccurrences: 2,
    cooldownWeeks: 8,
    weight: 2,
    condition: (state: GameState) =>
      state.team.aiAgents.length > 0,
    descriptions: {
      default:
        'Your primary AI provider is experiencing a major outage. Your product is effectively crippled, and there is no ETA for resolution.',
      realistic:
        'OpenAI/Anthropic/Google (whichever you are using) has been down for 4 hours with no ETA. Your AI-powered features are returning errors, and your fallback systems are buckling under the load. Users are tweeting screenshots of your error pages.',
      satirical:
        'Your AI provider is down and your "AI-first" product is now a static HTML page with a loading spinner and a message that says "Our AI is thinking really hard right now." Customers are discovering your product does literally nothing without the API.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'multiply', value: 0.97 },
      { path: 'company.reputation', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'switch-provider',
        label: 'Emergency switch to backup provider',
        description:
          'Spin up integration with a competing API. Fast but costly and may degrade quality.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -40000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'wait-it-out',
        label: 'Wait for the provider to recover',
        description:
          'Post a status update and wait. Cheap but your users are not patient.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 0.95 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'build-fallback',
        label: 'Build a local fallback model',
        description:
          'Deploy a smaller self-hosted model as backup. Significant engineering effort but increases resilience.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -80000 },
          { path: 'product.techDebtTotal', operation: 'add', value: -5 },
          { path: 'product.overallQuality', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 9. Employee Harassment Claim ──────────────────────────────────────
  {
    id: 'crisis-harassment-claim',
    title: 'Employee Harassment Claim',
    category: 'team',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.team.teamSize >= 5,
    descriptions: {
      default:
        'An employee has filed a formal harassment complaint against a senior team member. This needs to be handled immediately and carefully.',
      realistic:
        'An employee reported to you directly that a senior engineer has been creating a hostile work environment — inappropriate comments, exclusion from meetings, and retaliatory code reviews. Two other employees corroborated the claims. HR processes must be followed.',
      satirical:
        'Someone in your all-hands Slack channel described their management style as "move fast and break people" and HR has informed you this is, in fact, not a valid company value no matter how many times it appears on your culture deck.',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -12 },
      { path: 'company.culture', operation: 'add', value: -8 },
    ],
    decisionOptions: [
      {
        id: 'external-investigation',
        label: 'Launch external investigation',
        description:
          'Hire an independent firm to investigate. Thorough, fair, and demonstrates commitment to employees.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -60000 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'team.morale', operation: 'add', value: 8 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'handle-internally',
        label: 'Handle internally',
        description:
          'Investigate with your internal team. Faster and cheaper but may appear biased.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'team.morale', operation: 'add', value: -3 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'immediate-termination',
        label: 'Terminate the accused immediately',
        description:
          'Swift action sends a strong message but may be premature without investigation.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: -5 },
          { path: 'company.reputation', operation: 'add', value: 2 },
          { path: 'finances.cash', operation: 'add', value: -30000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 10. Customer Data Scandal ─────────────────────────────────────────
  {
    id: 'crisis-customer-data-scandal',
    title: 'Customer Data Scandal',
    category: 'product',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.culture > 40 && state.product.customers > 100,
    descriptions: {
      default:
        'An internal audit revealed that your AI model has been inadvertently including PII from customer data in its outputs. Other users can see fragments of private information.',
      realistic:
        'A customer reported seeing another user\'s email address in an AI-generated response. Your engineering team confirmed the training pipeline was not properly sanitizing PII. The scope is unclear — it could be dozens or thousands of affected records.',
      satirical:
        'Your AI has been helpfully including other users\' credit card numbers in its responses as "relevant context." It is technically correct — the numbers were contextually relevant — but your legal team is having what can only be described as a collective existential crisis.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -12 },
      { path: 'product.customers', operation: 'multiply', value: 0.88 },
    ],
    decisionOptions: [
      {
        id: 'immediate-disclosure',
        label: 'Immediate public disclosure',
        description:
          'Shut down the affected feature, notify all users, and issue a public statement. Maximum transparency.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -100000 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'product.pmfScore', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'fix-silently',
        label: 'Fix the issue silently',
        description:
          'Patch the pipeline, retrain the model, and move on. If discovered later, consequences will be severe.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'founder.reputation', operation: 'add', value: -10 },
        ],
      },
      {
        id: 'targeted-outreach',
        label: 'Notify affected users privately',
        description:
          'Identify and contact affected users individually. Fix the issue and offer compensation.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -70000 },
          { path: 'company.reputation', operation: 'add', value: 4 },
          { path: 'product.customers', operation: 'multiply', value: 0.95 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 11. Runway Emergency ──────────────────────────────────────────────
  {
    id: 'crisis-runway-emergency',
    title: 'Runway Emergency',
    category: 'funding',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState) => {
      const weeklyBurn = state.finances.weeklyBurn;
      const weeksOfRunway = weeklyBurn > 0 ? state.finances.cash / weeklyBurn : Infinity;
      return weeksOfRunway <= 6 && weeksOfRunway > 0;
    },
    descriptions: {
      default:
        'You just ran the numbers. At your current burn rate, you have about 4 weeks of cash left. It is time to make hard decisions.',
      realistic:
        'Your CFO (who is also your co-founder, your accountant, and the person who does the dishes) just calculated that you have 4.2 weeks of runway. The next payroll is in two weeks. You need a plan today.',
      satirical:
        'Your bank account has entered the "checking your balance through your fingers like a horror movie" phase. You have enough runway to either pay your team or pay your cloud bill, but definitely not both. Have you considered monetizing your anxiety?',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -15 },
      { path: 'founder.reputation', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'layoffs',
        label: 'Lay off 40% of the team',
        description:
          'Gut-wrenching but extends runway immediately. Remaining team will be demoralized but the company survives.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 50000 },
          { path: 'team.morale', operation: 'add', value: -20 },
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'product.overallQuality', operation: 'add', value: -10 },
        ],
      },
      {
        id: 'emergency-raise',
        label: 'Emergency fundraise',
        description:
          'Desperate fundraising at bad terms. Investors smell blood — expect heavy dilution.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 250000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.75 },
          { path: 'founder.reputation', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'revenue-push',
        label: 'All-hands revenue push',
        description:
          'Pivot everyone to sales and revenue. Ship anything customers will pay for right now.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 30000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 15 },
          { path: 'product.pmfScore', operation: 'add', value: -5 },
          { path: 'team.morale', operation: 'add', value: -10 },
        ],
      },
      {
        id: 'founder-salary-cut',
        label: 'Cut all founder salaries to zero',
        description:
          'Lead by example. Founders stop drawing salary and put personal funds in. Buys a few weeks.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 40000 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 12. DDoS Attack ──────────────────────────────────────────────────
  {
    id: 'crisis-ddos-attack',
    title: 'DDoS Attack',
    category: 'product',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.product.customers > 100 && state.product.features.some(f => f.status === 'shipped'),
    descriptions: {
      default:
        'Your infrastructure is under a sustained DDoS attack. Traffic is at 50x normal levels, all of it malicious. Your site is intermittently down.',
      realistic:
        'Your ops team detected a volumetric DDoS attack peaking at 15 Gbps. Your standard CDN is overwhelmed, API response times have spiked to 30 seconds, and paying customers are starting to notice. The attack shows no signs of stopping.',
      satirical:
        'Someone is DDoS-ing you, which is actually the most traffic your servers have ever handled. Your monitoring dashboard shows a traffic graph that looks like a hockey stick, and for one beautiful moment your investor update almost wrote itself.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'multiply', value: 0.97 },
      { path: 'company.reputation', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'invest-in-defense',
        label: 'Invest in enterprise DDoS protection',
        description:
          'Sign up for Cloudflare Enterprise or similar. Expensive but solves the problem properly.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -60000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'ride-it-out',
        label: 'Ride it out',
        description:
          'Most DDoS attacks stop within 24-48 hours. Scale up servers and wait.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'product.customers', operation: 'multiply', value: 0.93 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'law-enforcement',
        label: 'Report to law enforcement and hire forensics',
        description:
          'File a report and hire a cybersecurity firm to trace the attacker. Slow but may prevent future attacks.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -35000 },
          { path: 'company.reputation', operation: 'add', value: 2 },
          { path: 'founder.reputation', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 13. Engineer Burnout Wave ─────────────────────────────────────────
  {
    id: 'crisis-engineer-burnout',
    title: 'Engineer Burnout Wave',
    category: 'team',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.team.morale < 50 && state.team.teamSize >= 3,
    descriptions: {
      default:
        'Half your engineering team is burned out. Sick days are up 300%, commit frequency has plummeted, and two people have started updating their LinkedIn profiles.',
      realistic:
        'After three consecutive "crunch" sprints, your engineering team is collapsing. Code review quality has dropped to rubber-stamping, bug rates have tripled, and your most reliable engineer just asked for a month-long sabbatical.',
      satirical:
        'Your engineers have collectively achieved a state of enlightenment where they no longer feel anything about sprint deadlines. One of them has replaced all their Slack status emojis with tiny white flags. Another submitted a PR that just says "why" on every line.',
    },
    immediateEffects: [
      { path: 'product.techDebtTotal', operation: 'add', value: 8 },
      { path: 'product.bugs', operation: 'add', value: 15 },
    ],
    decisionOptions: [
      {
        id: 'mandatory-vacation',
        label: 'Mandatory two-week vacation for everyone',
        description:
          'Force the team to rest. Productivity drops to zero for two weeks but the team comes back refreshed.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 20 },
          { path: 'product.overallQuality', operation: 'add', value: -3 },
          { path: 'company.culture', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'push-through',
        label: 'Push through the deadline',
        description:
          'The deadline is non-negotiable. Promise bonuses and time off after launch.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -15 },
          { path: 'product.techDebtTotal', operation: 'add', value: 12 },
          { path: 'product.bugs', operation: 'add', value: 10 },
          { path: 'finances.cash', operation: 'add', value: -20000 },
        ],
      },
      {
        id: 'restructure',
        label: 'Restructure workload and hire contractors',
        description:
          'Bring in contractors to absorb the load and reduce individual burden. Balanced approach.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'team.morale', operation: 'add', value: 10 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 14. Product Copycat ───────────────────────────────────────────────
  {
    id: 'crisis-product-copycat',
    title: 'Product Copycat',
    category: 'competitor',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 2,
    condition: (state: GameState) =>
      state.product.pmfScore > 30 &&
      state.market.competitors.some(c => c.alive && c.funding > state.finances.cash),
    descriptions: {
      default:
        'A well-funded competitor just launched a feature that is a blatant copy of your core product. Their version has better marketing and a free tier.',
      realistic:
        'You opened Product Hunt this morning to find a "new" product that looks suspiciously identical to yours — same UX flows, same terminology, even similar color schemes. They have 10x your marketing budget and are offering it for free during "beta."',
      satirical:
        'A YC-backed startup just launched a pixel-perfect clone of your product. They described it in their launch post as "a completely novel approach" and their CTO tweeted "sometimes great minds think alike" with a winking emoji. Their cap table has more zeros than your user count.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'multiply', value: 0.95 },
      { path: 'market.investorSentiment', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'accelerate-roadmap',
        label: 'Accelerate your roadmap',
        description:
          'Ship your next three features in half the time. Outrun them on innovation.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -40000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: 8 },
          { path: 'team.morale', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'pursue-legal',
        label: 'Pursue legal action',
        description:
          'Send a cease-and-desist and prepare for IP litigation. Expensive and distracting.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -100000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'founder.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'differentiate',
        label: 'Double down on differentiation',
        description:
          'Focus on what makes you unique — go deeper rather than wider. Pivot positioning.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'product.pmfScore', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 15. Board Coup Attempt ────────────────────────────────────────────
  {
    id: 'crisis-board-coup',
    title: 'Board Coup Attempt',
    category: 'funding',
    minWeek: 20,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.finances.fundingHistory.length >= 2 &&
      state.finances.founderEquity < 0.5 &&
      (state.company.reputation < 40 || state.product.pmfScore < 30),
    descriptions: {
      default:
        'Your board members have been having meetings without you. Word just leaked that they are planning to replace you as CEO with a "more experienced operator."',
      realistic:
        'An anonymous tip from a friendly board observer: two of your investors have been interviewing CEO candidates behind your back. They plan to present a "leadership transition proposal" at the next board meeting. You have one week to prepare your defense.',
      satirical:
        'Your investors, who collectively have the operational experience of a Golden Retriever at a tennis ball factory, have decided you are "not experienced enough" to lead the company. They want to replace you with someone whose primary qualification is having been fired from three other startups "in a leadership capacity."',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -10 },
      { path: 'company.reputation', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'fight-for-control',
        label: 'Fight for control',
        description:
          'Rally your allies on the board, make your case with metrics, and call their bluff.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 8 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'market.investorSentiment', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'negotiate',
        label: 'Negotiate a compromise',
        description:
          'Agree to bring in an experienced COO while retaining the CEO title. Shared power.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -80000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'accept-transition',
        label: 'Accept the transition gracefully',
        description:
          'Step into a CTO/CPO role and let a professional CEO take over. Keep your equity and influence.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: -10 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 10 },
          { path: 'team.morale', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 14. Price War ──────────────────────────────────────────────────
  {
    id: 'crisis-price-war',
    title: 'Price War',
    category: 'market',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState) =>
      state.product.customers > 20 &&
      state.meta.week >= 10 &&
      state.product.customers > 20,
    descriptions: {
      default:
        'A well-funded competitor just undercut your pricing by 60%. They are burning VC money to steal your customers. Their unit economics are hilariously negative but that is their investors\' problem.',
      realistic:
        'A competitor backed by $200M in Series C funding just launched an identical product at 60% below your price point. Their CEO is openly bragging about "winning on price" in a podcast. Your sales team is fielding cancellation requests and your Slack is full of panic.',
      satirical:
        'A competitor is offering your exact product for negative dollars. They are literally paying people to use it. Their investor deck says "monetization is a Phase 3 concern" and Phase 2 is "achieve sentience." Your customers are switching because free money is, in fact, a compelling value proposition.',
      mixed:
        'A VC-backed competitor slashed prices by 60%, subsidizing every customer with investor cash. Their burn rate would make a NASA rocket blush, but your customers do not care about their unit economics — they care about their own budgets.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'add', value: -5 },
      { path: 'company.reputation', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'match-price',
        label: 'Match their price',
        description:
          'Slash your pricing to match. You will hemorrhage revenue but at least your customers stay. Your CFO may need therapy.',
        effects: [
          { path: 'finances.weeklyRevenue', operation: 'multiply', value: 0.6 },
          { path: 'product.churnRate', operation: 'multiply', value: 0.7 },
          { path: 'finances.cash', operation: 'add', value: -10000 },
        ],
      },
      {
        id: 'differentiate-quality',
        label: 'Differentiate on quality',
        description:
          'Go premium. Position yourself as the "serious" option for customers who want reliability over bargain-bin pricing.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 0.9 },
          { path: 'product.overallQuality', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'ignore-price-war',
        label: 'Ignore it',
        description:
          'Surely your customers value your product enough to stay. Right? Right? The silence from your Slack sales channel suggests otherwise.',
        effects: [
          { path: 'product.churnRate', operation: 'add', value: 0.08 },
          { path: 'product.customers', operation: 'multiply', value: 0.85 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 15. Customer Concentration Risk ────────────────────────────────
  {
    id: 'crisis-customer-concentration',
    title: 'Customer Concentration Risk',
    category: 'product',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 3,
    condition: (state: GameState) =>
      state.product.customers > 10 &&
      state.product.customers < 100 &&
      state.meta.week >= 8 &&
      state.company.stage !== 'garage',
    descriptions: {
      default:
        'Your biggest customer — the one paying 40% of your revenue — just sent a "we need to discuss our contract" email. That phrase has never preceded good news in the history of business.',
      realistic:
        'Your largest enterprise account, responsible for nearly half your MRR, has requested an "urgent contract review meeting." Their procurement team CC\'d legal. Your customer success manager is stress-eating granola bars and rehearsing objection handling in the mirror.',
      satirical:
        'The customer who single-handedly keeps your lights on just emailed "Can we hop on a quick call?" which, as any founder knows, is the corporate equivalent of "we need to talk" in a relationship. Your revenue concentration is about to become your revenue evaporation.',
      mixed:
        'Your whale customer — 40% of revenue — wants to "revisit the partnership." In startup-speak, that means they are either going to ask for a 50% discount or leave entirely. Either way, building your business on one customer is about to teach you an expensive lesson.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'give-discount',
        label: 'Give them a loyalty discount',
        description:
          'Offer a 15% discount to keep them happy. Your revenue takes a hit, but losing them entirely would be catastrophic.',
        effects: [
          { path: 'finances.weeklyRevenue', operation: 'multiply', value: 0.85 },
          { path: 'product.churnRate', operation: 'multiply', value: 0.8 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
        ],
      },
      {
        id: 'call-bluff',
        label: 'Call their bluff',
        description:
          'Stand firm on pricing. They might respect the confidence, or they might walk. Coin flip, basically.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 0.7 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'diversify-immediately',
        label: 'Diversify your customer base immediately',
        description:
          'Pour money into acquiring new customers so no single account holds you hostage again. Smart but expensive.',
        effects: [
          { path: 'finances.marketingSpend', operation: 'multiply', value: 2 },
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 16. Talent Bidding War ─────────────────────────────────────────
  {
    id: 'crisis-talent-bidding-war',
    title: 'Talent Bidding War',
    category: 'team',
    minWeek: 8,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 3,
    condition: (state: GameState) =>
      state.team.teamSize >= 3 &&
      state.meta.week >= 8 &&
      state.market.talentMarketHeat > 40,
    descriptions: {
      default:
        'Your best engineer just got a competing offer at 2x their current salary. They like working here, but they also like eating at restaurants that do not have a dollar menu.',
      realistic:
        'A FAANG recruiter has been aggressively poaching your senior engineer with a total comp package that makes your entire annual budget look like a rounding error. The offer includes RSUs, a signing bonus, and something called a "wellness stipend" that costs more than your office lease.',
      satirical:
        'Your 10x engineer just received an offer from Google that includes a base salary, stock options, a personal chef, a therapy llama, and a parking spot that is closer to the building than your apartment is to anything. They are "not actively looking" but they are "passively looking really hard."',
      mixed:
        'Your best engineer got a competing offer at double their salary. They showed it to you with the energy of someone presenting evidence in a salary negotiation court. The rest of the team is now suspiciously quiet and updating their LinkedIn headlines to "open to opportunities."',
    },
    immediateEffects: [
      { path: 'team.morale', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'match-salary',
        label: 'Match the offer',
        description:
          'Match their salary. Of course, now everyone else wants a raise too. You just set a very expensive precedent.',
        effects: [
          { path: 'team.avgSalary', operation: 'multiply', value: 1.2 },
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'team.morale', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'counter-with-equity',
        label: 'Counter with equity',
        description:
          'Offer a generous equity package. It costs you ownership but not cash — assuming the company is ever worth anything.',
        effects: [
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.97 },
          { path: 'team.morale', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'let-them-go',
        label: 'Let them go',
        description:
          'Wish them well and watch your best code walk out the door. The team will remember how you handle this.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -10 },
          { path: 'company.culture', operation: 'add', value: -5 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 17. Platform Rug Pull ──────────────────────────────────────────
  {
    id: 'crisis-platform-rug-pull',
    title: 'Platform Rug Pull',
    category: 'product',
    minWeek: 12,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 2,
    condition: (state: GameState) =>
      state.meta.week >= 12 &&
      state.product.features.length >= 2,
    descriptions: {
      default:
        'The platform you built your product on just changed their API terms. Your entire integration is broken. They gave you 30 days notice, which in startup time is "yesterday."',
      realistic:
        'Your primary platform dependency just announced a new API version with breaking changes, a 30-day migration deadline, and pricing that tripled overnight. Their developer relations team posted a cheery blog titled "Exciting Changes Ahead!" which contains neither excitement nor adequate documentation.',
      satirical:
        'The platform you built your entire company on just deprecated their API and replaced it with something called "API v2 (Beta) (Experimental) (Do Not Use In Production)." The migration guide is a 404 page and their developer Discord has been renamed to "Coping Strategies."',
      mixed:
        'Your platform provider pulled the rug out with 30 days notice. Their CEO called it "evolving the ecosystem" on Twitter. Your CTO called it something unprintable in Slack. Your entire product integration needs to be rebuilt from scratch.',
    },
    immediateEffects: [
      { path: 'product.overallQuality', operation: 'add', value: -10 },
      { path: 'product.techDebtTotal', operation: 'add', value: 8 },
      { path: 'company.reputation', operation: 'add', value: -5 },
    ],
    decisionOptions: [
      {
        id: 'rebuild-new-api',
        label: 'Rebuild on their new API',
        description:
          'Bite the bullet and migrate. At least the new code will be fresh, even if your bank account is not.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -30000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'product.overallQuality', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'build-own-infra',
        label: 'Build your own infrastructure',
        description:
          'Never depend on anyone again. It will cost a fortune and take months, but you will own your destiny.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'product.techDebtTotal', operation: 'add', value: -5 },
          { path: 'product.overallQuality', operation: 'add', value: 8 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'find-alternative',
        label: 'Find an alternative platform',
        description:
          'Switch to a competitor platform. Cheaper than building your own but you are just trading one dependency for another.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 18. Negative Glassdoor Reviews ─────────────────────────────────
  {
    id: 'crisis-glassdoor-reviews',
    title: 'Negative Glassdoor Reviews',
    category: 'culture',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState) =>
      state.meta.week >= 10 &&
      (state.team.morale < 50 || state.company.culture < 40) &&
      state.team.teamSize >= 2,
    descriptions: {
      default:
        'Former (and possibly current) employees are torching you on Glassdoor. "Great mission, terrible management." "Free snacks don\'t compensate for crying in the bathroom." 2.1 stars.',
      realistic:
        'Six new Glassdoor reviews appeared overnight, averaging 1.8 stars. Common themes include "leadership says one thing and does another," "work-life balance is a myth here," and "the ping pong table does not make up for the 70-hour weeks." Two candidates just withdrew their applications citing the reviews.',
      satirical:
        'Your Glassdoor page reads like a therapy session transcript. Highlights include "The CEO says we are a family, and honestly that tracks because my actual family also makes me cry" and "Pros: free LaCroix. Cons: everything else." Someone titled their review "Stockholm Syndrome With Equity" and it has 47 helpful votes.',
      mixed:
        'Your Glassdoor rating has cratered to 2.1 stars. The most helpful review is titled "Great Product, Terrible Place to Build It" and contains a level of detail that suggests the author is still badge-swiping into your office every morning.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -5 },
      { path: 'market.investorSentiment', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'address-issues',
        label: 'Address the issues head-on',
        description:
          'Invest in real culture improvements — better management training, mental health support, and actual work-life boundaries. Novel concept.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'team.morale', operation: 'add', value: 8 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'fake-reviews',
        label: 'Flood it with fake five-star reviews',
        description:
          'Pay a reputation management firm to bury the bad reviews with suspiciously enthusiastic ones. Ethically dubious. Possibly effective.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -2000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'meta.regulatoryHeat', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'ignore-glassdoor',
        label: 'Ignore it',
        description:
          'Glassdoor reviews are just noise from disgruntled ex-employees, right? Surely this will not compound into a recruiting crisis.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -3 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },
];
