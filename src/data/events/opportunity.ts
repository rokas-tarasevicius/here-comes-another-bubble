import type { GameEvent } from '../../types/events.ts';
import type { GameState } from '../../types/game.ts';

export const OPPORTUNITY_EVENTS: GameEvent[] = [
  // ─── 1. Acquisition Offer ─────────────────────────────────────────────
  {
    id: 'opportunity-acquisition-offer',
    title: 'Acquisition Offer',
    category: 'funding',
    minWeek: 20,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.valuation > 2000000 && state.product.pmfScore > 40,
    descriptions: {
      default:
        'A big tech company has made an acquisition offer. The number is impressive, and they want an answer within two weeks.',
      realistic:
        'A corp dev team from a FAANG company reached out through your investor network. They are offering a mix of cash and stock at a premium to your last valuation. The term sheet is on your desk, and your co-founder is already looking at real estate in Palo Alto.',
      satirical:
        'Google/Microsoft/Meta wants to acquire you for a number so large you had to Google how to pronounce it. Their corp dev team assured you they "definitely will not shut down your product within 18 months" with the confidence of someone who has shut down 47 products.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 10 },
      { path: 'market.investorSentiment', operation: 'add', value: 10 },
    ],
    decisionOptions: [
      {
        id: 'accept-offer',
        label: 'Accept the offer',
        description:
          'Take the money and run. Your team gets acqui-hired and you get a very comfortable exit.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 5000000 },
          { path: 'founder.reputation', operation: 'add', value: 15 },
          { path: 'company.reputation', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'negotiate-higher',
        label: 'Negotiate for a higher price',
        description:
          'Push back and ask for 2x. Risky — they might walk away, but you might also double your payout.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'decline-offer',
        label: 'Decline and stay independent',
        description:
          'You did not build this to sell it. Use the validation to raise a bigger round.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 10 },
          { path: 'market.investorSentiment', operation: 'add', value: 8 },
          { path: 'team.avgMorale', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 2. Partnership with Enterprise ───────────────────────────────────
  {
    id: 'opportunity-enterprise-partnership',
    title: 'Partnership with Enterprise',
    category: 'product',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.product.pmfScore > 25 && state.product.features.some(f => f.status === 'shipped'),
    descriptions: {
      default:
        'A Fortune 500 company wants to pilot your product. They are offering a six-figure contract but want significant customization.',
      realistic:
        'The VP of Innovation at a major enterprise saw your demo at a conference. They want to run a 90-day pilot with their team of 500. The contract is worth $250K but they have a 40-page requirements document that includes SSO, SOC2 compliance, and a dedicated support channel.',
      satirical:
        'A Fortune 500 company wants to use your product! They just need you to add SSO, SAML, SCIM, SOC2, HIPAA compliance, on-premise deployment, a dedicated Slack channel, 24/7 phone support, and also they want to pay $50/month for the first year as a "design partner discount."',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'custom-work',
        label: 'Accept and do custom work',
        description:
          'Build what they need. Guaranteed revenue but diverts engineering from the core product.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 250000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 12 },
          { path: 'product.pmfScore', operation: 'add', value: -5 },
          { path: 'team.avgMorale', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'off-the-shelf',
        label: 'Offer the product as-is',
        description:
          'Propose a smaller pilot with your current feature set. Lower revenue but protects your roadmap.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 80000 },
          { path: 'product.pmfScore', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'decline-enterprise',
        label: 'Decline — not ready for enterprise',
        description:
          'Politely pass. You are not ready for enterprise demands and it would distract the team.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 3 },
          { path: 'product.pmfScore', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 3. YC Acceptance ─────────────────────────────────────────────────
  {
    id: 'opportunity-yc-acceptance',
    title: 'YC Acceptance',
    category: 'funding',
    minWeek: 4,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.stage === 'garage' || state.company.stage === 'pre-seed',
    descriptions: {
      default:
        'You got into Y Combinator! The most prestigious accelerator in tech wants you for their next batch. But it means relocating to SF for three months.',
      realistic:
        'The YC acceptance email just landed. You have one week to confirm. It is $500K for 7% equity, plus access to the alumni network, office hours with partners, and Demo Day. But your entire team needs to be in SF for three months.',
      satirical:
        'You got into Y Combinator, the Hogwarts of startups. You will spend three months learning the ancient arts of "growth hacking," eating Ramen that costs $28 in SF, and practicing your Demo Day pitch in the mirror until you achieve the perfect combination of humble and insufferable.',
    },
    immediateEffects: [
      { path: 'founder.reputation', operation: 'add', value: 10 },
      { path: 'company.reputation', operation: 'add', value: 8 },
    ],
    decisionOptions: [
      {
        id: 'join-yc',
        label: 'Join the batch',
        description:
          'Accept the offer. $500K for 7% equity, three months of intense mentorship, and a Demo Day slot.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 500000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.93 },
          { path: 'founder.reputation', operation: 'add', value: 15 },
          { path: 'market.investorSentiment', operation: 'add', value: 15 },
          { path: 'founder.network', operation: 'add', value: 20 },
        ],
      },
      {
        id: 'go-independent',
        label: 'Decline and go independent',
        description:
          'You do not need the YC brand. Keep your equity and build on your own terms.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 3 },
          { path: 'team.avgMorale', operation: 'add', value: 3 },
          { path: 'company.culture.innovation', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 4. Viral Tweet ───────────────────────────────────────────────────
  {
    id: 'opportunity-viral-tweet',
    title: 'Viral Tweet',
    category: 'market',
    minWeek: 4,
    maxOccurrences: 3,
    cooldownWeeks: 8,
    weight: 2,
    condition: (state: GameState) =>
      state.product.features.some(f => f.status === 'shipped') && state.product.customers > 10,
    descriptions: {
      default:
        'A tech influencer with 500K followers just tweeted about your product. Your traffic is spiking 10x and your servers are groaning.',
      realistic:
        'An influential developer with half a million followers posted a glowing thread about your product. "This is the tool I have been waiting for." Retweets are pouring in, your sign-up page is getting hammered, and your Stripe dashboard is looking healthier than it has in months.',
      satirical:
        'A tech influencer who lists "thought leader, disruptor, blockchain enthusiast" in their bio just tweeted "this AI tool is insane" about your product. They clearly used it for 30 seconds, but their followers are signing up faster than your servers can crash.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'multiply', value: 1.15 },
      { path: 'company.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'scale-infrastructure',
        label: 'Scale up infrastructure immediately',
        description:
          'Throw money at servers to handle the traffic. Make sure every new visitor has a great experience.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -30000 },
          { path: 'product.customers', operation: 'multiply', value: 1.2 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'ride-the-wave',
        label: 'Ride the wave organically',
        description:
          'Let it happen naturally. Some visitors will bounce from slow load times but you save money.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 1.05 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'amplify-with-marketing',
        label: 'Amplify with paid marketing',
        description:
          'Pour fuel on the fire with ads and influencer outreach while attention is high.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'product.customers', operation: 'multiply', value: 1.3 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 5. Celebrity Endorsement ─────────────────────────────────────────
  {
    id: 'opportunity-celebrity-endorsement',
    title: 'Celebrity Endorsement',
    category: 'market',
    minWeek: 8,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.product.customers > 200 && state.company.reputation > 30,
    descriptions: {
      default:
        'A well-known tech CEO just publicly endorsed your product during a keynote speech. Your brand awareness just went through the roof.',
      realistic:
        'During a major tech conference keynote, a prominent CEO mentioned your product by name as "one of the most exciting AI tools I have used this year." The clip is going viral. Your PR inbox is exploding with media requests.',
      satirical:
        'Elon Musk just tweeted about your product at 3 AM. It is unclear if he was complimenting it or accidentally replying to the wrong thread, but either way your servers are on fire and your valuation just tripled based on a tweet with two typos and a rocket emoji.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 12 },
      { path: 'product.customers', operation: 'multiply', value: 1.2 },
      { path: 'market.investorSentiment', operation: 'add', value: 8 },
    ],
    decisionOptions: [
      {
        id: 'leverage-endorsement',
        label: 'Leverage it for fundraising',
        description:
          'Use the social proof to accelerate your next funding round while sentiment is high.',
        effects: [
          { path: 'market.investorSentiment', operation: 'add', value: 10 },
          { path: 'founder.reputation', operation: 'add', value: 8 },
          { path: 'company.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'customer-acquisition',
        label: 'Focus on customer acquisition',
        description:
          'Pour resources into converting the attention spike into paying customers.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -25000 },
          { path: 'product.customers', operation: 'multiply', value: 1.25 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 6. Government Contract ───────────────────────────────────────────
  {
    id: 'opportunity-government-contract',
    title: 'Government Contract',
    category: 'funding',
    minWeek: 16,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.product.pmfScore > 35 &&
      state.product.overallQuality > 40 &&
      state.product.customers > 100,
    descriptions: {
      default:
        'The Department of Defense is interested in your AI platform. The contract would be worth millions but comes with strings attached — and controversy.',
      realistic:
        'A DoD procurement officer reached out through SBIR channels. They want to evaluate your AI platform for intelligence analysis applications. The initial contract is $2M over two years, with potential for $10M+ follow-on. But you will need security clearances, and your team has opinions.',
      satirical:
        'The Pentagon wants to use your AI chatbot for "strategic defense applications." You are not sure if they realize it is the same product that hallucinated a recipe for "uranium brownies" last week, but the contract has so many zeros that you have started Googling "how to get a security clearance."',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 3 },
    ],
    decisionOptions: [
      {
        id: 'accept-contract',
        label: 'Accept the contract',
        description:
          'Take the money. It is lucrative and validates your technology at the highest level.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 500000 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'team.avgMorale', operation: 'add', value: -8 },
          { path: 'product.customers', operation: 'add', value: -50 },
        ],
      },
      {
        id: 'decline-contract',
        label: 'Decline on ethical grounds',
        description:
          'Publicly decline the contract. Your team will love you, some customers will too, but you leave money on the table.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'company.culture.innovation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'negotiate-scope',
        label: 'Negotiate for non-weapons applications only',
        description:
          'Accept a reduced contract limited to logistics and administrative uses. Less money, less controversy.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 200000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'team.avgMorale', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 7. Top Talent Available ──────────────────────────────────────────
  {
    id: 'opportunity-top-talent',
    title: 'Top Talent Available',
    category: 'team',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.finances.cash > 200000 && state.company.reputation > 20,
    descriptions: {
      default:
        'An ex-Google AI research lead just left their position and is looking for their next thing. They are interested in what you are building.',
      realistic:
        'A former Google DeepMind researcher with 50+ publications and experience shipping production ML systems just posted on LinkedIn that they are "exploring new opportunities." A mutual connection introduced you. They seem genuinely excited about your product.',
      satirical:
        'A senior AI researcher who has more citations than your product has users just became available. They were "let go" from Google after their AI became too intelligent and started sending passive-aggressive emails to the VP of Engineering. They want a title with "Chief" in it and a salary that makes your runway cry.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 3 },
    ],
    decisionOptions: [
      {
        id: 'hire-aggressively',
        label: 'Make an aggressive offer',
        description:
          'Offer a top-of-market salary plus significant equity. Transformative hire but expensive.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -150000 },
          { path: 'product.overallQuality', operation: 'add', value: 10 },
          { path: 'company.culture.aiFirst', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'team.avgMorale', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'advisor-role',
        label: 'Offer an advisor role instead',
        description:
          'Cannot afford them full-time? Bring them on as a paid advisor with a small equity grant.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'product.overallQuality', operation: 'add', value: 4 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'company.culture.aiFirst', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'pass-on-talent',
        label: 'Pass — not the right time',
        description:
          'The budget cannot support it. Better to wait for a time when you can afford top talent.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 8. Conference Speaking Slot ──────────────────────────────────────
  {
    id: 'opportunity-conference-speaking',
    title: 'Conference Speaking Slot',
    category: 'culture',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 10,
    weight: 2,
    condition: (state: GameState) =>
      state.founder.reputation > 20 || state.company.reputation > 25,
    descriptions: {
      default:
        'You have been invited to give a keynote at a major tech conference. It is a huge visibility opportunity, but preparation will take time away from building.',
      realistic:
        'The organizers of a top-tier AI conference want you to give a 20-minute keynote on your approach to AI product development. Expected audience: 3,000 in person, 50,000 streaming. It will take at least two weeks of preparation.',
      satirical:
        'You have been invited to give a TED-style talk, which means spending two weeks crafting a presentation where you walk around a stage holding a clicker, pause dramatically before key points, and pretend that your startup journey was always part of a grand philosophical narrative rather than a series of panicked Slack messages.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'accept-speaking',
        label: 'Accept and deliver a great talk',
        description:
          'Invest the preparation time. A killer talk can be worth more than a month of marketing.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'product.customers', operation: 'add', value: 75 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'send-cofounder',
        label: 'Send a co-founder or team lead instead',
        description:
          'Get the visibility without losing your own time. Slightly less impact.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.customers', operation: 'add', value: 30 },
          { path: 'team.avgMorale', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'decline-speaking',
        label: 'Decline — focus on building',
        description:
          'You cannot afford the distraction right now. Heads down on product.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 9. Media Feature ────────────────────────────────────────────────
  {
    id: 'opportunity-media-feature',
    title: 'Media Feature',
    category: 'culture',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.company.reputation > 30 && state.product.customers > 50,
    descriptions: {
      default:
        'Wired magazine wants to do a full profile on your startup. A journalist will embed with your team for a week.',
      realistic:
        'A senior Wired reporter is writing a feature on the next generation of AI startups and wants your company to be the centerpiece. They will spend a week with your team, attend meetings, and interview employees. It is amazing press — if nothing goes wrong during the visit.',
      satirical:
        'Wired wants to do a profile on you titled "The Future of AI." You will need to ensure your office looks less like a WeWork disaster zone, coach your team to say "disrupting" instead of "copying," and hide the whiteboard that says "Step 1: Raise money. Step 2: ??? Step 3: Profit."',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 3 },
    ],
    decisionOptions: [
      {
        id: 'full-access',
        label: 'Give them full access',
        description:
          'Transparency builds the best stories. Let them see everything — warts and all.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'founder.reputation', operation: 'add', value: 8 },
          { path: 'product.customers', operation: 'add', value: 100 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'controlled-access',
        label: 'Carefully managed access',
        description:
          'Control the narrative. Curated meetings, approved talking points, polished demos.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.customers', operation: 'add', value: 50 },
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'decline-media',
        label: 'Decline the feature',
        description:
          'Too risky right now. A bad profile could do more harm than good.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 10. Competitor Imploding ─────────────────────────────────────────
  {
    id: 'opportunity-competitor-imploding',
    title: 'Competitor Imploding',
    category: 'competitor',
    minWeek: 12,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 2,
    condition: (state: GameState) =>
      state.market.competitors.some(c => c.alive && c.marketShare > 0.05),
    descriptions: {
      default:
        'Your main competitor is in crisis. Their CEO just resigned, they are laying off half their team, and their customers are looking for alternatives.',
      realistic:
        'The news broke this morning: your biggest competitor missed payroll, their CTO rage-quit on Twitter, and their subreddit has turned into a support group. Their customers are panicking and your support inbox is filling up with migration requests.',
      satirical:
        'Your competitor, who raised $200M to build what is essentially the same product as yours but with rounded corners, just imploded in the most spectacular fashion. Their CEO posted a 47-tweet thread about "founder mental health" and then immediately announced a pivot to Web3.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'add', value: 50 },
      { path: 'market.investorSentiment', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'poach-team',
        label: 'Poach their best engineers',
        description:
          'Reach out to their top talent with offers. They are scared and you can get them at a discount.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -80000 },
          { path: 'product.overallQuality', operation: 'add', value: 8 },
          { path: 'team.avgMorale', operation: 'add', value: 3 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'poach-customers',
        label: 'Run a migration campaign for their customers',
        description:
          'Launch a targeted campaign with easy migration tools and discounted pricing.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -30000 },
          { path: 'product.customers', operation: 'multiply', value: 1.25 },
          { path: 'company.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'poach-both',
        label: 'Go after both their team and customers',
        description:
          'Maximum aggression. Expensive but could reshape the competitive landscape.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -120000 },
          { path: 'product.customers', operation: 'multiply', value: 1.3 },
          { path: 'product.overallQuality', operation: 'add', value: 6 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 11. Angel Investor Interest ──────────────────────────────────────
  {
    id: 'opportunity-angel-investor',
    title: 'Angel Investor Interest',
    category: 'funding',
    minWeek: 4,
    maxOccurrences: 2,
    cooldownWeeks: 10,
    weight: 2,
    condition: (state: GameState) =>
      state.finances.cash < 500000 && state.company.reputation > 15,
    descriptions: {
      default:
        'A famous angel investor wants to write you a check. Good terms, quick close. But taking angel money now might complicate your Series A.',
      realistic:
        'A well-known angel investor — one of those people who was early in Stripe and Airbnb — wants to invest $150K at a $3M cap. They can wire the money this week. Clean terms, no board seat, just a SAFE note. But some VCs prefer to lead clean rounds without a messy cap table.',
      satirical:
        'A VC who has not read your pitch deck just offered you $150K because you mentioned "AI agents" in your Twitter bio. Their due diligence consisted of checking that your website loads and that you have a headshot where you are wearing a Patagonia vest.',
    },
    immediateEffects: [
      { path: 'founder.reputation', operation: 'add', value: 3 },
    ],
    decisionOptions: [
      {
        id: 'accept-angel',
        label: 'Accept the angel investment',
        description:
          'Take the money. Fast, clean, and extends your runway. The angel network is valuable too.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 150000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.95 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'founder.network', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'hold-for-vc',
        label: 'Hold out for a VC round',
        description:
          'Pass on the angel and wait for a larger, more institutional round. Higher risk but potentially better outcome.',
        effects: [
          { path: 'market.investorSentiment', operation: 'add', value: 3 },
          { path: 'founder.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'negotiate-terms',
        label: 'Negotiate for better terms',
        description:
          'Ask for a higher valuation cap or more money at the same terms.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 200000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.94 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 12. Open Source Momentum ─────────────────────────────────────────
  {
    id: 'opportunity-open-source-momentum',
    title: 'Open Source Momentum',
    category: 'product',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 2,
    condition: (state: GameState) =>
      state.product.overallQuality > 40 &&
      state.company.culture.innovation > 30,
    descriptions: {
      default:
        'Developers are asking to build on top of your platform. Open-sourcing your API layer could create an ecosystem, but it changes your business model.',
      realistic:
        'Your GitHub repo has been trending for three days. Developers are opening PRs, requesting API access, and building integrations. A community is forming organically around your platform. The question is how much to embrace it.',
      satirical:
        'Random developers on the internet want to build on your platform for free, which is either the beginning of a beautiful open-source ecosystem or the beginning of you providing free customer support to people who will never pay you. History suggests both simultaneously.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
      { path: 'company.culture.innovation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'full-open-source',
        label: 'Open-source the core platform',
        description:
          'Go all in on open source. Massive community goodwill but need to find a new monetization strategy.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 12 },
          { path: 'product.customers', operation: 'multiply', value: 1.3 },
          { path: 'company.culture.innovation', operation: 'add', value: 10 },
          { path: 'finances.cash', operation: 'add', value: -20000 },
        ],
      },
      {
        id: 'open-api',
        label: 'Open the API with rate limits',
        description:
          'Let developers build on your platform with a free tier. Upsell to paid plans for production use.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'product.customers', operation: 'multiply', value: 1.15 },
          { path: 'finances.cash', operation: 'add', value: 30000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'stay-closed',
        label: 'Keep the platform closed',
        description:
          'Protect your IP and focus on your own product. The community will be disappointed.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -3 },
          { path: 'company.culture.innovation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 13. International Expansion ──────────────────────────────────────
  {
    id: 'opportunity-international-expansion',
    title: 'International Expansion',
    category: 'market',
    minWeek: 14,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 2,
    condition: (state: GameState) =>
      state.product.customers > 200 && state.product.pmfScore > 35,
    descriptions: {
      default:
        'A major EU company wants a localized version of your product. It could open up the entire European market, but GDPR compliance is no joke.',
      realistic:
        'A German enterprise customer with 10,000 employees wants to deploy your product across the EU. They need GDPR-compliant data processing, EU-based servers, and localization in French, German, and Spanish. The contract is worth $400K annually but the engineering investment is significant.',
      satirical:
        'A European company wants to use your product, which means you now need to comply with GDPR, which means your lawyers need to write a privacy policy longer than your actual codebase. Also you need to add a cookie banner that covers 80% of the screen, because apparently that is what "user experience" means in the EU.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'full-expansion',
        label: 'Full EU expansion',
        description:
          'Invest in localization, compliance, and EU infrastructure. Major investment, major upside.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -200000 },
          { path: 'product.customers', operation: 'multiply', value: 1.35 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
        ],
      },
      {
        id: 'limited-pilot',
        label: 'Limited pilot with this customer only',
        description:
          'Serve just this customer without full localization. Test the waters before committing.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 100000 },
          { path: 'product.customers', operation: 'add', value: 100 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'decline-international',
        label: 'Decline — focus on domestic market',
        description:
          'Too early to go international. Focus on winning your home market first.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 3 },
          { path: 'team.avgMorale', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 14. Strategic Hire Available ─────────────────────────────────────
  {
    id: 'opportunity-strategic-hire',
    title: 'Strategic Hire Available',
    category: 'team',
    minWeek: 12,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 2,
    condition: (state: GameState) =>
      state.finances.cash > 150000 &&
      state.product.customers > 50 &&
      state.company.stage !== 'garage',
    descriptions: {
      default:
        'A VP of Sales from a unicorn startup is on the market. They could transform your go-to-market strategy, but they are not cheap.',
      realistic:
        'A former VP of Sales who scaled revenue from $1M to $50M ARR at a well-known unicorn just became available after an acqui-hire. They have a Rolodex of enterprise contacts and a track record of building sales teams from scratch. They want $250K base plus equity.',
      satirical:
        'A VP of Sales who describes themselves as a "revenue architect" and "pipeline whisperer" is available. Their LinkedIn has more buzzwords than your product has features, but they also closed $50M in deals last year. Their salary expectations have salary expectations.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'hire-vp-sales',
        label: 'Hire them as VP of Sales',
        description:
          'Make a competitive offer. Their enterprise network alone could 2x your revenue.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -120000 },
          { path: 'product.customers', operation: 'multiply', value: 1.2 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'consulting-engagement',
        label: 'Bring them on as a consultant',
        description:
          'Three-month consulting engagement to build your sales playbook. Less commitment, less cost.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -40000 },
          { path: 'product.customers', operation: 'add', value: 40 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'pass-on-hire',
        label: 'Pass — too early for a sales VP',
        description:
          'You need to nail the product before scaling sales. Save the money.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 15. Product Hunt Launch ──────────────────────────────────────────
  {
    id: 'opportunity-product-hunt',
    title: 'Product Hunt Launch',
    category: 'market',
    minWeek: 6,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 2,
    condition: (state: GameState) =>
      state.product.features.filter(f => f.status === 'shipped').length >= 1 &&
      state.product.overallQuality > 25,
    descriptions: {
      default:
        'Your product just launched on Product Hunt and it is trending toward the top 5 of the day. The community is engaged and upvotes are pouring in.',
      realistic:
        'Your Product Hunt launch is going better than expected. You are currently #3 for the day with 500+ upvotes, 200+ comments, and your sign-up rate is 20x normal. The Product Hunt community is asking great questions and your demo GIF is being shared everywhere.',
      satirical:
        'You are trending on Product Hunt, where people who describe themselves as "serial entrepreneurs" will upvote your product, leave a comment saying "love the clean UI!", and then never use it again. But the dopamine hit of watching the upvote counter climb is basically indistinguishable from revenue at this point.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'multiply', value: 1.1 },
      { path: 'company.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'all-in-engagement',
        label: 'Go all-in on engagement',
        description:
          'Drop everything and respond to every comment, do live demos, and push for #1 Product of the Day.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 1.25 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'moderate-engagement',
        label: 'Engage moderately while shipping',
        description:
          'Respond to top comments but keep the team focused on fixing bugs and scaling infrastructure.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 1.12 },
          { path: 'company.reputation', operation: 'add', value: 4 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'leverage-for-press',
        label: 'Leverage for press coverage',
        description:
          'Use the PH momentum to pitch journalists and bloggers for wider coverage.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15000 },
          { path: 'product.customers', operation: 'multiply', value: 1.18 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },
];
