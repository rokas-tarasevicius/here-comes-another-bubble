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
          { path: 'team.morale', operation: 'add', value: 10 },
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
          { path: 'team.morale', operation: 'add', value: -5 },
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
          { path: 'team.morale', operation: 'add', value: 3 },
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
          { path: 'finances.founderEquity', operation: 'add', value: -0.07 },
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
          { path: 'team.morale', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 5 },
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
          { path: 'team.morale', operation: 'add', value: -8 },
          { path: 'product.customers', operation: 'add', value: -20 },
        ],
      },
      {
        id: 'decline-contract',
        label: 'Decline on ethical grounds',
        description:
          'Publicly decline the contract. Your team will love you, some customers will too, but you leave money on the table.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 3 },
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
          { path: 'team.morale', operation: 'add', value: -2 },
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
        id: 'hire_1_5000',
        label: 'Make an aggressive offer',
        description:
          'Offer a top-of-market salary plus significant equity. Transformative hire but expensive.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -150000 },
          { path: 'product.overallQuality', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 8 },
          { path: 'team.morale', operation: 'add', value: 5 },
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
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'pass-on-talent',
        label: 'Pass — not the right time',
        description:
          'The budget cannot support it. Better to wait for a time when you can afford top talent.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -2 },
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
          { path: 'team.morale', operation: 'add', value: 3 },
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
          { path: 'team.morale', operation: 'add', value: 3 },
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
      state.company.culture > 30,
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
      { path: 'company.culture', operation: 'add', value: 5 },
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
          { path: 'company.culture', operation: 'add', value: 10 },
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
          { path: 'company.culture', operation: 'add', value: -3 },
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
          { path: 'team.morale', operation: 'add', value: 2 },
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
        id: 'hire_1_4800',
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

  // ─── 16. Vanity Metrics Offer (Growth Trap) ─────────────────────────
  {
    id: 'opportunity-vanity-metrics',
    title: 'Vanity Metrics Offer',
    category: 'funding',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState) =>
      state.meta.week >= 10 &&
      state.product.customers > 20 &&
      state.finances.fundingHistory.length > 0,
    descriptions: {
      default:
        'A "growth hacking" firm has slid into your DMs offering to inflate your metrics for investors. Fake signups, bot traffic, inflated DAUs. It is technically not illegal. Technically.',
      realistic:
        'A growth consultancy with suspiciously good case studies is offering to "optimize your funnel metrics" before your next investor meeting. Their methods involve bulk email signups from purchased lists, automated bot sessions that inflate DAU counts, and creative reinterpretation of "active user." Their pitch deck uses the phrase "perception is reality" seven times.',
      satirical:
        'A firm called "GrowthHackz" (with a z, because integrity) wants to inflate your numbers so aggressively that your Series A deck will look like a hockey stick drew itself. Their CEO assures you this is "standard practice" and that "every unicorn did this early on," which is both probably true and deeply concerning.',
      mixed:
        'A growth consultancy is offering to juice your metrics before your next fundraise. The methods are legal in the same way that putting a "hot dog" label on a turkey leg is legal — technically accurate, spiritually bankrupt.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'inflate-metrics',
        label: 'Do it — perception is reality',
        description:
          'Pay them to inflate your numbers. Investors will see hockey-stick growth. Just pray nobody looks too closely at cohort retention.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20000 },
          { path: 'market.investorSentiment', operation: 'add', value: 15 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'meta.regulatoryHeat', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'decline-vanity',
        label: 'Decline — real metrics or bust',
        description:
          'You would rather grow slowly and honestly than build a house of cards. Your mother would be proud.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 17. Free Tier Abuse (Growth Trap) ──────────────────────────────
  {
    id: 'opportunity-free-tier-abuse',
    title: 'Free Tier Abuse',
    category: 'product',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 12,
    weight: 4,
    condition: (state: GameState) =>
      (state.finances.pricingModel === 'free' || state.product.customers > 50) &&
      state.meta.week >= 8,
    descriptions: {
      default:
        'Bots and scrapers are flooding your free tier. Your infrastructure costs are skyrocketing but your "user count" looks amazing in pitch decks.',
      realistic:
        'Your monitoring dashboard shows a 400% spike in API calls, almost all from automated scripts. Someone on Hacker News posted a tutorial on using your free tier as a cheap backend for their crypto bot. Your AWS bill just tripled, but on the bright side, your "Monthly Active Users" chart has never looked better.',
      satirical:
        'Congratulations — you have achieved product-market fit with robots. Your free tier is being strip-mined by scrapers, crypto miners, and one very determined teenager running 847 accounts. Your AWS bill now exceeds your revenue by a factor that would make a grown CFO weep, but hey, your pitch deck says "10x user growth" and technically it is not lying.',
      mixed:
        'Your free tier has become the all-you-can-eat buffet of the internet. Bots are gorging themselves on your API while your infrastructure groans under the weight. The good news: user numbers are through the roof. The bad news: none of them are human.',
    },
    immediateEffects: [
      { path: 'finances.cash', operation: 'add', value: -8000 },
    ],
    decisionOptions: [
      {
        id: 'add-rate-limiting',
        label: 'Add rate limiting',
        description:
          'Implement strict rate limits and bot detection. You will lose some legitimate users caught in the crossfire, but your servers will stop crying.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5000 },
          { path: 'product.customers', operation: 'multiply', value: 0.9 },
          { path: 'product.techDebtTotal', operation: 'add', value: -3 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'keep-vanity-numbers',
        label: 'Keep the vanity numbers',
        description:
          'Let the bots stay. Your user count looks incredible in investor meetings, and nobody has asked about retention yet.',
        effects: [
          { path: 'finances.weeklyBurn', operation: 'add', value: 5000 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'add-paywall',
        label: 'Add a paywall',
        description:
          'Slap a paywall on the free tier. You will lose a lot of users, but the ones who stay are the ones who actually want your product. Revolutionary concept.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 0.7 },
          { path: 'product.churnRate', operation: 'multiply', value: 0.7 },
          { path: 'finances.weeklyRevenue', operation: 'add', value: 3000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 18. Feature Creep Request (Growth Trap) ────────────────────────
  {
    id: 'opportunity-feature-creep',
    title: 'Feature Creep Request',
    category: 'product',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 8,
    weight: 4,
    condition: (state: GameState) =>
      state.product.customers > 30 &&
      state.product.features.length >= 1 &&
      state.meta.week >= 6,
    descriptions: {
      default:
        'Your biggest customer wants custom features that would take weeks to build. They account for 30% of your revenue and they know it.',
      realistic:
        'Your largest enterprise customer just sent a 12-page feature request document. They want custom dashboards, a proprietary integration, and a reporting module that has nothing to do with your core product. Their contract renewal is in six weeks. Their account manager has used the phrase "strategic partnership" four times in one email.',
      satirical:
        'Your whale customer — the one who pays enough to keep the lights on — has sent you a feature request list that reads like a ransom note. "Build us a custom CRM inside your product or we walk." They know they are 30% of your revenue because they hired an intern specifically to calculate that number and bring it up in every meeting.',
      mixed:
        'Your biggest customer has discovered leverage. They want features that have nothing to do with your roadmap, delivered yesterday, and they are casually mentioning competitor names in every email. This is the startup equivalent of a hostage negotiation, except the hostage is your product vision.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'build-custom-features',
        label: 'Build what they want',
        description:
          'Drop everything and build their wish list. The tech debt will be enormous, but so will the invoice.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: -5 },
          { path: 'finances.cash', operation: 'add', value: 15000 },
          { path: 'product.churnRate', operation: 'multiply', value: 0.8 },
        ],
      },
      {
        id: 'offer-workaround',
        label: 'Offer a workaround',
        description:
          'Propose a creative workaround using existing features and a bit of duct tape. They will not love it, but they might accept it.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -2 },
          { path: 'product.techDebtTotal', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'say-no-to-creep',
        label: 'Say no',
        description:
          'Politely decline and stay focused on your roadmap. They might leave, but your product stays coherent and your team stays sane.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 0.92 },
          { path: 'company.culture', operation: 'add', value: 3 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 19. Premature Scaling Pressure (Growth Trap) ───────────────────
  {
    id: 'opportunity-premature-scaling',
    title: 'Premature Scaling Pressure',
    category: 'funding',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState) =>
      (state.company.stage === 'seed' || state.company.stage === 'series-a') &&
      state.team.teamSize < 10 &&
      state.meta.week >= 10 &&
      state.finances.fundingHistory.length >= 1,
    descriptions: {
      default:
        'Your lead investor wants you to "scale aggressively." They want 10x growth. You have 3 people and a WeWork hot desk.',
      realistic:
        'Your lead investor just scheduled an "urgent strategy call." They want to see a plan for 10x growth in the next two quarters, including aggressive hiring, a major marketing push, and expansion into two new verticals. Your entire team fits in a booth at Denny\'s. Your CTO is also your intern.',
      satirical:
        'Your VC, who has never operated a business but has very strong opinions about operating businesses, wants you to "blitzscale." They sent you a copy of the book with seventeen passages highlighted, all of which boil down to "spend money faster." They want 10x growth from a team that still shares a single Figma license.',
      mixed:
        'The board wants hockey-stick growth and they want it yesterday. Never mind that your entire engineering team is two people who are already working weekends — the investor deck needs bigger numbers, and someone on Sand Hill Road just said the word "blitzscale" with a straight face.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'scale-aggressively',
        label: 'Scale! Scale! Scale!',
        description:
          'Triple the marketing spend, hire fast, and pray. Your investors will be thrilled. Your bank account will not.',
        effects: [
          { path: 'finances.marketingSpend', operation: 'multiply', value: 3 },
          { path: 'finances.cash', operation: 'add', value: -50000 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'market.investorSentiment', operation: 'add', value: 8 },
        ],
      },
      {
        id: 'grow-sustainably',
        label: 'Grow sustainably',
        description:
          'Push back on the investor. Real growth takes time. They will not love hearing it, but your runway will thank you.',
        effects: [
          { path: 'market.investorSentiment', operation: 'add', value: -5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'fake-scaling',
        label: 'Fake it',
        description:
          'Spend a little, look like you are scaling. Increase marketing just enough to move the charts, then present it with the confidence of someone who definitely has a plan.',
        effects: [
          { path: 'finances.marketingSpend', operation: 'multiply', value: 1.5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'finances.cash', operation: 'add', value: -15000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 20. Acqui-hire Offer (Growth Trap) ─────────────────────────────
  {
    id: 'opportunity-acquihire-offer',
    title: 'Acqui-hire Offer',
    category: 'funding',
    minWeek: 15,
    maxOccurrences: 1,
    cooldownWeeks: 20,
    weight: 2,
    condition: (state: GameState) =>
      state.company.valuation < 200000 &&
      state.team.teamSize >= 3 &&
      state.meta.week >= 15,
    descriptions: {
      default:
        'A big tech company wants to acqui-hire your team. Your engineers get six-figure signing bonuses. You get a middle-management title and a Googleplex badge. The startup dream dies, but the 401k lives.',
      realistic:
        'A FAANG corp dev team reached out. They are not interested in your product — they want your engineers. The offer is structured as an acquisition, but the term sheet makes it clear: your team gets absorbed, your product gets sunset, and you get a "Director of Special Projects" title that everyone knows means nothing. The signing bonuses, however, are very real.',
      satirical:
        'Google wants to buy your startup, not because your product is good, but because your engineers are cheaper to acquire than to recruit. You will get a title like "Senior Director of Innovation" which translates to "person who attends meetings about meetings." Your product will join Google Graveyard within 18 months, but at least you will have free kombucha on tap.',
      mixed:
        'A big tech company is offering to acqui-hire your team. The money is real. The "Director" title is not. Your engineers will get six-figure bonuses and RSUs. You will get an existential crisis and a lanyard.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'accept-acquihire',
        label: 'Accept the offer',
        description:
          'Take the money and the badge. The startup dream is over, but your bank account has never felt more alive. Your LinkedIn will say "exited."',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 100000 },
          { path: 'company.reputation', operation: 'add', value: -20 },
        ],
      },
      {
        id: 'reject-acquihire',
        label: 'Reject and double down',
        description:
          'Decline the offer and rally the team. Nothing unites a startup like turning down a payday together. Your team believes in the mission now — or at least in proving the big company wrong.',
        effects: [
          { path: 'team.morale', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'negotiate-acquihire',
        label: 'Negotiate for more',
        description:
          'Counter-offer. Use the leverage to squeeze out a better deal. Your team will feel like bargaining chips, because they are.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 50000 },
          { path: 'company.culture', operation: 'add', value: -5 },
          { path: 'team.morale', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 21. Partnership Dependency (Growth Trap) ───────────────────────
  {
    id: 'opportunity-platform-partnership',
    title: 'Partnership Dependency',
    category: 'market',
    minWeek: 12,
    maxOccurrences: 2,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state: GameState) =>
      state.meta.week >= 12 &&
      state.product.customers > 40 &&
      state.company.stage !== 'garage',
    descriptions: {
      default:
        'A major platform offers to feature your product in their marketplace. Great exposure, but you would be building on their rails. When they sneeze, you catch pneumonia.',
      realistic:
        'A major cloud platform wants to feature your product in their marketplace. They are offering co-marketing, a dedicated integration team, and access to their enterprise customer base. The catch: you need to rebuild your deployment pipeline around their infrastructure, use their auth system, and give them a 30% revenue cut. Also, their API changes every quarter without warning.',
      satirical:
        'A platform that changes its API more often than most people change their socks wants you to build your entire product on their infrastructure. They are offering "preferred partner status," which means your logo appears on page 47 of their marketplace next to 200 other "preferred partners." When they inevitably deprecate the API you built on, they will send a cheerful email with 30 days notice and a link to their migration guide that does not exist yet.',
      mixed:
        'A major platform is dangling distribution in front of you like a carrot. The exposure would be enormous, but the dependency would be absolute. It is the startup equivalent of moving into your partner\'s apartment on the second date — exciting, terrifying, and very hard to undo.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'accept-platform-partnership',
        label: 'Accept the partnership',
        description:
          'Go all in on the platform. The customer access is worth the dependency. Probably. Hopefully.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 1.3 },
          { path: 'finances.cash', operation: 'add', value: -10000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'negotiate-platform-terms',
        label: 'Negotiate better terms',
        description:
          'Push for a less restrictive deal. Less exposure, but you keep more control and dignity.',
        effects: [
          { path: 'product.customers', operation: 'multiply', value: 1.15 },
          { path: 'finances.cash', operation: 'add', value: -5000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'stay-independent-platform',
        label: 'Stay independent',
        description:
          'Build your own distribution. Slower, harder, but nobody can pull the rug. You control your destiny, even if that destiny involves a lot more cold outreach.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 22. Paul Graham Essay Mention ──────────────────────────────────────
  {
    id: 'opportunity-pg-essay',
    title: 'Paul Graham Mentions You',
    category: 'funding',
    minWeek: 8,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.reputation > 20 && state.product.customers > 15,
    descriptions: {
      default:
        'Paul Graham just published a 12,000-word essay titled "The Future of AI Startups" and your company is mentioned in paragraph 47. Your inbox just exploded.',
      realistic:
        'Paul Graham\'s latest essay references your product as an example of "what gets built when smart people focus on real problems." Your website traffic has spiked 500% and three VCs have already emailed you.',
      satirical:
        'Paul Graham wrote an essay. It\'s called "Do Things That Don\'t Scale (But Make Sure To Mention That You Did)" and somehow, between paragraphs about Lisp and ancient Rome, he name-dropped your startup. Every VC who pretends to have read PG essays (all of them) is now in your DMs. Your SEO just peaked.',
      mixed:
        'Paul Graham mentioned your startup in his latest essay. The good news: instant credibility. The bad news: he also described your market as "a bubble that will inevitably pop." The worse news: he\'s usually right.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 10 },
      { path: 'market.investorSentiment', operation: 'add', value: 8 },
    ],
    decisionOptions: [
      {
        id: 'ride-the-wave',
        label: 'Ride the hype wave',
        description: 'Launch a fundraising round immediately while every VC is reading PG\'s essay.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 100_000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.95 },
          { path: 'market.investorSentiment', operation: 'add', value: 10 },
          { path: 'founder.network', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'tweet-thanks',
        label: 'Quote-tweet with a humble brag',
        description: '"Honored to be mentioned by @paulg. We\'re just getting started." (You spent 45 minutes writing this.)',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'product.customers', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'stay-quiet',
        label: 'Stay focused and ship',
        description: 'PG literally wrote that you should focus on building, not self-promotion. Maybe take the advice.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'founder.learning', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 23. Elon Musk Tweets About You ─────────────────────────────────────
  {
    id: 'opportunity-elon-tweet',
    title: 'Elon Tweets About You',
    category: 'market',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.product.customers > 30 && state.company.reputation > 15,
    descriptions: {
      default:
        'Elon Musk just tweeted about your product at 3 AM. It simply says "interesting." Your servers are melting.',
      realistic:
        'Elon Musk tweeted a screenshot of your product with a single word: "interesting." Within 30 minutes you\'ve gained 50,000 website visitors. Your servers are struggling. Your support inbox has 2,000 unread messages. Half are potential customers, half are telling you to "build on X."',
      satirical:
        'Elon tweeted "interesting" about your product at 3:47 AM between a meme and a reply to a random account with 12 followers. The tweet has 4 million impressions. Your site crashed. Crypto bros are somehow convinced your startup is pivoting to blockchain. Someone already made a meme coin named after your company.',
      mixed:
        'Elon Musk noticed your product. This is either the best thing that ever happened to you or the worst — there is no in-between. Your servers are down, your mentions are radioactive, and your mom just texted "I saw you on the news!"',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'add', value: 40 },
      { path: 'company.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'scale-servers',
        label: 'Scale servers and capitalize',
        description: 'Throw money at infrastructure to handle the traffic. Convert visitors to users.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -25_000 },
          { path: 'product.customers', operation: 'add', value: 60 },
          { path: 'market.investorSentiment', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'reply-to-elon',
        label: 'Reply to the tweet',
        description: 'Engage directly. Could go viral or get ratio\'d into oblivion.',
        effects: [
          { path: 'product.customers', operation: 'add', value: 20 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
      {
        id: 'ignore-chaos',
        label: 'Do nothing and wait for it to blow over',
        description: 'The Elon news cycle is 48 hours max. Let the chaos pass.',
        effects: [
          { path: 'product.churnRate', operation: 'add', value: 0.03 },
          { path: 'company.culture', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 24. Marc Andreessen Wants to Invest ─────────────────────────────────
  {
    id: 'opportunity-a16z-interest',
    title: 'a16z Wants a Meeting',
    category: 'funding',
    minWeek: 12,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.valuation > 500_000 &&
      (state.company.stage === 'seed' || state.company.stage === 'series-a' || state.company.stage === 'series-b'),
    descriptions: {
      default:
        'A partner at Andreessen Horowitz reached out. They want to "learn more about your vision." Translation: they want to invest, but they want you to think it was your idea.',
      realistic:
        'An a16z partner sent a LinkedIn message asking for a meeting. They\'ve been tracking your space and are "impressed by your traction." This could mean a term sheet within weeks — or a polite pass after three months of diligence.',
      satirical:
        'Marc Andreessen himself has DMed you. His message is a link to his blog post about "why software is still eating the world" and a single sentence: "You get it." You are now contractually obligated to add "AI" to your company name. His partner will follow up with a term sheet written in Nietzsche quotes.',
      mixed:
        'a16z wants to talk. On one hand, they\'re the most connected VC firm in Silicon Valley. On the other, their investment thesis seems to be "fund everything and see what sticks." Your CFO is excited about the money. Your CTO is worried they\'ll insist you pivot to crypto. Again.',
    },
    immediateEffects: [
      { path: 'founder.reputation', operation: 'add', value: 5 },
    ],
    decisionOptions: [
      {
        id: 'take-the-meeting',
        label: 'Take the meeting',
        description: 'Fly to Sand Hill Road. Worst case, free coffee and a networking opportunity.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -3_000 },
          { path: 'founder.network', operation: 'add', value: 10 },
          { path: 'market.investorSentiment', operation: 'add', value: 12 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'accept-term-sheet',
        label: 'Skip the dance, ask for a term sheet',
        description: 'Bold move. Send your deck and ask if they\'re serious. Could accelerate or kill the deal.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 500_000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.88 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'market.investorSentiment', operation: 'add', value: 15 },
        ],
      },
      {
        id: 'decline-politely',
        label: 'Decline — you don\'t need VC',
        description: 'The rarest move in Silicon Valley. Respect +100, but you\'re on your own.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 25. Sam Altman Keynote ──────────────────────────────────────────────
  {
    id: 'opportunity-sam-altman-keynote',
    title: 'Sam Altman Announces Your Category',
    category: 'market',
    minWeek: 6,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 2,
    condition: (state: GameState) =>
      state.market.bubbleIndex > 40 && state.meta.week >= 6,
    descriptions: {
      default:
        'At OpenAI\'s DevDay, Sam Altman just announced that the next frontier of AI is... exactly what your startup does. Your category is now "validated." Your competitors just got funded.',
      realistic:
        'Sam Altman\'s keynote at OpenAI DevDay focused heavily on your product category. He called it "the most important application of AI in the next decade." Your inbox is filling with VC emails. Unfortunately, OpenAI also soft-launched a competing product.',
      satirical:
        'Sam Altman just announced that OpenAI is building everything your startup does, but better, and free, and it\'ll be ready "in a few weeks" (which in OpenAI time means somewhere between 3 months and heat death of the universe). He also said your category is "incredibly exciting" which is Silicon Valley for "we\'re going to destroy you but it\'s nothing personal."',
      mixed:
        'Sam Altman validated your entire market in a keynote. Congrats — you\'re now competing with OpenAI! Your VCs are somehow both thrilled (market validation!) and terrified (you\'re competing with OpenAI). The fundraising just got easier and harder simultaneously.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 5 },
      { path: 'market.investorSentiment', operation: 'add', value: 10 },
    ],
    decisionOptions: [
      {
        id: 'differentiate-hard',
        label: 'Differentiate aggressively',
        description: 'Pivot your messaging to emphasize what OpenAI can\'t do. Niche down.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'finances.cash', operation: 'add', value: -10_000 },
        ],
      },
      {
        id: 'ride-the-hype',
        label: 'Ride the validation wave',
        description: '"As mentioned in Sam Altman\'s keynote..." goes in every email you send for the next month.',
        effects: [
          { path: 'product.customers', operation: 'add', value: 20 },
          { path: 'market.investorSentiment', operation: 'add', value: 8 },
          { path: 'finances.marketingSpend', operation: 'multiply', value: 1.5 },
        ],
      },
      {
        id: 'panic-pivot',
        label: 'Panic and pivot',
        description: 'If OpenAI is coming for you, maybe pivot to something they haven\'t announced yet. (They\'ll announce it next week.)',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: -5 },
          { path: 'product.pmfScore', operation: 'add', value: -8 },
          { path: 'team.morale', operation: 'add', value: -5 },
          { path: 'company.culture', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 26. Zuckerberg Open-Sources Your Moat ───────────────────────────────
  {
    id: 'opportunity-zuck-open-source',
    title: 'Zuckerberg Open-Sources Your Moat',
    category: 'market',
    minWeek: 12,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.product.features.length >= 2 && state.product.overallQuality > 30,
    descriptions: {
      default:
        'Mark Zuckerberg just open-sourced a model that does 90% of what your product does. He announced it while doing jiu-jitsu. Your entire competitive moat just evaporated.',
      realistic:
        'Meta just released an open-source model that replicates your core functionality. It\'s free, it\'s good, and every developer on Twitter is building clones of your product as weekend projects. Your differentiation needs to come from somewhere else now.',
      satirical:
        'Zuckerberg just open-sourced your entire business model. He announced it in an Instagram Reel where he\'s grilling brisket in his backyard while casually saying "yeah we made this, it\'s free now." Your CTO is crying. Your investors are calling. Someone on Hacker News already titled their Show HN "[Your Product] but free and self-hosted."',
      mixed:
        'Meta just made your core technology free for everyone. Zuck dropped it like a mixtape — no warning, no mercy. The open-source community is building alternatives before you\'ve finished reading the blog post. Your moat just became a puddle.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: -5 },
      { path: 'product.customers', operation: 'multiply', value: 0.9 },
    ],
    decisionOptions: [
      {
        id: 'go-enterprise',
        label: 'Pivot to enterprise',
        description: 'Open-source is for hobbyists. Enterprises need support, SLAs, and someone to blame.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20_000 },
          { path: 'product.overallQuality', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.churnRate', operation: 'multiply', value: 0.8 },
        ],
      },
      {
        id: 'build-on-top',
        label: 'Build on top of Meta\'s model',
        description: 'If you can\'t beat them, use their free stuff. Reduce your own infra costs and add a better UX.',
        effects: [
          { path: 'finances.weeklyBurn', operation: 'multiply', value: 0.7 },
          { path: 'product.techDebtTotal', operation: 'add', value: 8 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'double-down-proprietary',
        label: 'Double down on proprietary tech',
        description: 'Invest heavily in R&D. Build something they can\'t replicate.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -40_000 },
          { path: 'product.overallQuality', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'team.morale', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 27. Jeff Bezos Day-One Moment ───────────────────────────────────────
  {
    id: 'opportunity-bezos-interest',
    title: 'Bezos Expeditions Shows Interest',
    category: 'funding',
    minWeek: 16,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.valuation > 1_000_000 &&
      state.finances.weeklyRevenue > 5_000,
    descriptions: {
      default:
        'Jeff Bezos\' personal investment fund wants to discuss your company. His people want to know your "Day One metrics." You\'re not entirely sure what that means but you\'re nodding vigorously.',
      realistic:
        'Bezos Expeditions, Jeff Bezos\' personal venture fund, has reached out through an intermediary. They\'re interested in your growth trajectory and unit economics. A term sheet could follow — but Bezos investments come with high expectations.',
      satirical:
        'Jeff Bezos wants to invest in your startup. His only condition is that you adopt his 14 Leadership Principles, replace all chairs with door-desks, and write a 6-page memo explaining why your product matters. Also, every meeting must start with 15 minutes of silent reading. Also, no PowerPoint. Also, somehow this will involve space.',
      mixed:
        'Bezos Expeditions is interested. The money would be transformative. But Jeff\'s investment philosophy is "your margin is my opportunity," which is slightly terrifying when he\'s talking about YOUR margins.',
    },
    immediateEffects: [
      { path: 'founder.reputation', operation: 'add', value: 8 },
    ],
    decisionOptions: [
      {
        id: 'take-bezos-money',
        label: 'Accept the investment',
        description: 'Take the Bezos check. Massive credibility boost. Pray he doesn\'t build a competitor.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 300_000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.92 },
          { path: 'company.reputation', operation: 'add', value: 15 },
          { path: 'market.investorSentiment', operation: 'add', value: 15 },
          { path: 'founder.network', operation: 'add', value: 15 },
        ],
      },
      {
        id: 'negotiate-terms',
        label: 'Counter with better terms',
        description: 'Bold move — negotiate with the richest person on Earth. Respect.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 200_000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.95 },
          { path: 'company.reputation', operation: 'add', value: 10 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'decline-bezos',
        label: 'Politely decline',
        description: 'You\'ve seen what happens when Bezos "partners" with small companies. No thanks.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 28. Chamath Goes on a Podcast About You ─────────────────────────────
  {
    id: 'opportunity-chamath-podcast',
    title: 'Chamath Talks About You on a Podcast',
    category: 'market',
    minWeek: 10,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.reputation > 25 && state.product.customers > 20,
    descriptions: {
      default:
        'Chamath Palihapitiya just spent 15 minutes on the All-In Podcast talking about your startup. He called it "the next generational company." Your DMs are on fire.',
      realistic:
        'On the latest All-In Podcast episode, Chamath highlighted your startup during the "bestie picks" segment. He praised your revenue growth and predicted you\'d be a unicorn within two years. VCs who ghosted you last month are suddenly "circling back."',
      satirical:
        'Chamath just called your startup "the most important company nobody\'s heard of" on the All-In Pod. Sacks agreed, Friedberg said "interesting," and Jason said he invested first (he didn\'t). Your LinkedIn has gained 5,000 followers, 4,999 of whom are "AI Thought Leaders" and crypto bros.',
      mixed:
        'The All-In Pod talked about you for 15 minutes. Chamath loves you. The comments section is split between "this is the future" and "this is a grift." Both camps are driving traffic to your site. Net positive?',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 8 },
      { path: 'market.investorSentiment', operation: 'add', value: 5 },
      { path: 'product.customers', operation: 'add', value: 15 },
    ],
    decisionOptions: [
      {
        id: 'go-on-podcast',
        label: 'Ask to be a guest on the show',
        description: 'Ride the momentum. Pitch your vision to millions of listeners.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.customers', operation: 'add', value: 25 },
          { path: 'market.investorSentiment', operation: 'add', value: 8 },
        ],
      },
      {
        id: 'fundraise-now',
        label: 'Launch a fundraising round',
        description: 'Strike while the iron is hot. Every VC listens to the All-In Pod.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 200_000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.93 },
          { path: 'market.investorSentiment', operation: 'add', value: 10 },
        ],
      },
      {
        id: 'heads-down',
        label: 'Ignore the noise and ship',
        description: 'Podcasts are for talkers. You\'re a builder. Back to work.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'founder.learning', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 29. Satya Nadella Name-Drops You ────────────────────────────────────
  {
    id: 'opportunity-satya-namedrop',
    title: 'Satya Nadella Mentions You at Build',
    category: 'market',
    minWeek: 14,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 1,
    condition: (state: GameState) =>
      state.company.valuation > 2_000_000 && state.product.overallQuality > 40,
    descriptions: {
      default:
        'Satya Nadella just showed your product in a Microsoft Build demo. "This is the kind of innovation our ecosystem enables." You\'re now an Azure partner whether you wanted to be or not.',
      realistic:
        'During Microsoft Build\'s keynote, Satya Nadella showcased your product as an example of Azure AI innovation. Microsoft\'s partnership team is already reaching out. The exposure is incredible but the platform dependency is real.',
      satirical:
        'Satya Nadella put your product on a 40-foot screen at Build. He mispronounced your company name three times. You are now receiving emails from every Microsoft partner manager in existence. Clippy has opinions about your UX. Your product now has to work with Teams, which is technically impossible.',
      mixed:
        'You\'re now a Microsoft showcase partner. The credibility is immense. The integration requirements are insane. Their partnership manager has already sent a 47-page "co-selling alignment document." Your CTO just whispered "what have we done."',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 12 },
      { path: 'product.customers', operation: 'add', value: 30 },
    ],
    decisionOptions: [
      {
        id: 'go-all-in-azure',
        label: 'Go all-in on the Microsoft partnership',
        description: 'Become an Azure-native product. Enterprise customers galore. Freedom gone.',
        effects: [
          { path: 'product.customers', operation: 'add', value: 50 },
          { path: 'finances.cash', operation: 'add', value: 50_000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 10 },
          { path: 'company.culture', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'stay-multi-cloud',
        label: 'Take the exposure, stay multi-cloud',
        description: 'Enjoy the name-drop but don\'t lock yourself in. Smart but harder to execute.',
        effects: [
          { path: 'product.customers', operation: 'add', value: 20 },
          { path: 'finances.cash', operation: 'add', value: -10_000 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'politely-distance',
        label: 'Distance yourself quietly',
        description: 'Being a "Microsoft partner" scares away the cool developer crowd. Stay indie.',
        effects: [
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 30. Garry Tan Retweets Your Launch ─────────────────────────────────
  {
    id: 'opportunity-garry-tan-retweet',
    title: 'YC President Retweets You',
    category: 'funding',
    minWeek: 6,
    maxOccurrences: 1,
    cooldownWeeks: 0,
    weight: 2,
    condition: (state: GameState) =>
      state.company.stage !== 'growth' && state.company.stage !== 'public' && state.meta.week >= 6,
    descriptions: {
      default:
        'Garry Tan, president of Y Combinator, just retweeted your product launch with "This is what the future looks like." Your notifications are unusable.',
      realistic:
        'Garry Tan shared your product on social media with a strong endorsement. The YC alumni network is watching. Several batch founders have reached out to compare notes. The signal boost is real.',
      satirical:
        'Garry Tan retweeted you and now every YC founder is in your mentions with "congrats! would love to chat about synergies." You have 47 new calendar invites, 12 pitch deck requests, and someone just Venmo\'d you $1 with the memo "first check."',
      mixed:
        'The YC president publicly endorsed your product. The good news: instant credibility with the entire startup ecosystem. The bad news: the entire startup ecosystem now knows exactly what you\'re building and how to copy it.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
      { path: 'product.customers', operation: 'add', value: 10 },
    ],
    decisionOptions: [
      {
        id: 'dm-garry',
        label: 'DM Garry about YC',
        description: 'Shoot your shot. Maybe this leads to an interview.',
        effects: [
          { path: 'founder.network', operation: 'add', value: 8 },
          { path: 'market.investorSentiment', operation: 'add', value: 8 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'leverage-for-fundraising',
        label: 'Use the signal for fundraising',
        description: 'Screenshot the retweet and put it in your pitch deck. VCs love social proof.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 75_000 },
          { path: 'finances.founderEquity', operation: 'multiply', value: 0.96 },
          { path: 'market.investorSentiment', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'just-ship',
        label: 'Say thanks and get back to work',
        description: 'Tweets don\'t build products. Back to the code.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'company.culture', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },
];
