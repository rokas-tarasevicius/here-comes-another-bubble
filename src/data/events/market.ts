import type { GameEvent } from '../../types/events.ts';

export const MARKET_EVENTS: GameEvent[] = [
  // ─── 1. VC Fund Raises $2B ─────────────────────────────────────────────
  {
    id: 'market-vc-fund-raises-2b',
    title: 'VC Fund Raises $2B',
    category: 'funding',
    minWeek: 1,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 4,
    condition: (state) => state.market.investorSentiment > 30,
    descriptions: {
      default: 'A major VC firm just closed a $2 billion AI-focused fund.',
      realistic:
        'Andreessen Horowitz closed a new $2B fund dedicated to AI startups. Deal flow is about to accelerate significantly.',
      satirical:
        'A VC firm raised $2B to "democratize AI." Their thesis: give money to anyone with a .ai domain name and a hoodie. They plan to deploy it all within 6 months. What could go wrong?',
      mixed:
        'New $2B AI fund announced. Good news: more money in the ecosystem. Bad news: your competitors just got 47 emails from eager partners offering "strategic value-add."',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: 5 },
      { path: 'market.bubbleIndex', operation: 'add', value: 3 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 2. Tech Layoffs at BigCorp ────────────────────────────────────────
  {
    id: 'market-tech-layoffs-bigcorp',
    title: 'Tech Layoffs at BigCorp',
    category: 'market',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 8,
    weight: 5,
    condition: () => true,
    descriptions: {
      default: 'A major tech company announced significant layoffs.',
      realistic:
        'A FAANG company laid off 12,000 employees. The talent market is flooding with experienced engineers. Hiring just got easier and cheaper.',
      satirical:
        'BigCorp laid off 12,000 people via an AI-generated email that started with "We are a family." LinkedIn is now 90% "Open to Work" banners and "grateful for the journey" posts. The talent market is basically a Black Friday sale.',
      mixed:
        'Mass layoffs at BigCorp. Sad for them, but your recruiter\'s inbox just filled up with senior engineers who actually know how to scale things. Silver linings, meet moral complexity.',
    },
    immediateEffects: [
      { path: 'market.talentMarketHeat', operation: 'add', value: -8 },
      { path: 'market.investorSentiment', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'hiring-spree',
        label: 'Launch a Hiring Push',
        description: 'Capitalize on the talent flood. Great candidates at lower salaries.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20_000 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'selective-hire',
        label: 'Cherry-Pick Top Talent',
        description: 'Reach out to 2-3 specific people you\'ve been eyeing.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10_000 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'stay-course',
        label: 'Stay the Course',
        description: 'Not hiring right now. Preserve runway.',
        effects: [],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 3. AI Regulation Bill Proposed ────────────────────────────────────
  {
    id: 'market-ai-regulation-bill',
    title: 'AI Regulation Bill Proposed',
    category: 'regulation',
    minWeek: 8,
    maxOccurrences: 3,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state) => state.market.bubbleIndex > 30,
    descriptions: {
      default: 'Congress introduced a bill to regulate AI companies.',
      realistic:
        'A bipartisan AI regulation bill was introduced in the Senate. Key provisions include mandatory auditing, transparency requirements, and liability frameworks for AI outputs.',
      satirical:
        'Congress wants to regulate AI. The bill was written by someone who still calls it "the cyber." Key provision: all AI models must be "explainable" — a requirement the bill itself fails to meet. Lobbyists are already writing the loopholes.',
      mixed:
        'AI regulation bill dropped. It\'s 300 pages long, written by people who think GPT stands for "Government Policy Thingy." Still, the intent is real and the compliance costs will be too.',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: -5 },
      { path: 'market.bubbleIndex', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'lobby',
        label: 'Join Industry Lobby Group',
        description: 'Contribute $5K to the AI industry coalition fighting the bill.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5_000 },
          { path: 'founder.reputation', operation: 'add', value: -2 },
          { path: 'founder.bizSkill', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'comply-early',
        label: 'Start Compliance Early',
        description: 'Get ahead of the regulation. Costs dev time but de-risks.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'wait-and-see',
        label: 'Wait and See',
        description: 'Most bills die in committee. Don\'t overreact.',
        effects: [
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 4. Interest Rate Cut ──────────────────────────────────────────────
  {
    id: 'market-interest-rate-cut',
    title: 'Interest Rate Cut',
    category: 'market',
    minWeek: 6,
    maxOccurrences: 4,
    cooldownWeeks: 12,
    weight: 3,
    condition: () => true,
    descriptions: {
      default: 'The Federal Reserve cut interest rates by 25 basis points.',
      realistic:
        'The Fed cut rates by 25bps, citing cooling inflation. Risk-on sentiment is building across tech. VCs are reopening their checkbooks.',
      satirical:
        'Money printer goes brrr. The Fed cut rates and suddenly every VC remembers they actually like startups again. Valuations are about to get very silly. Time to raise a round based on vibes.',
      mixed:
        'Rate cut announced. Translation: money is cheaper, VCs are hornier, and your valuation just went up for reasons entirely unrelated to your actual business performance.',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: 8 },
      { path: 'market.bubbleIndex', operation: 'add', value: 5 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 5. AI Model Breakthrough ──────────────────────────────────────────
  {
    id: 'market-ai-model-breakthrough',
    title: 'AI Model Breakthrough',
    category: 'market',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 4,
    condition: () => true,
    descriptions: {
      default: 'A new AI model breakthrough was announced, advancing the state of the art.',
      realistic:
        'A major lab released a new model that significantly outperforms current benchmarks. The capability jump is real and opens new product possibilities.',
      satirical:
        'New AI model dropped and it can now write poetry, code, diagnose diseases, AND make a decent risotto. Twitter is torn between "AGI is here" and "it still can\'t count to 10." Stocks are going vertical.',
      mixed:
        'New AI breakthrough. It\'s genuinely impressive — and also means half your product roadmap just became either obsolete or suddenly possible. Time to pivot. Again.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 4 },
      { path: 'market.investorSentiment', operation: 'add', value: 3 },
      { path: 'company.culture', operation: 'add', value: 2 },
    ],
    decisionOptions: [
      {
        id: 'integrate',
        label: 'Integrate New Model',
        description: 'Rebuild core features on the new model. High effort, high reward.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 5 },
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'product.pmfScore', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'evaluate',
        label: 'Evaluate Carefully',
        description: 'Run benchmarks first. Don\'t jump on every hype cycle.',
        effects: [
          { path: 'founder.techSkill', operation: 'add', value: 2 },
          { path: 'product.overallQuality', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'ignore-hype',
        label: 'Stick With Current Stack',
        description: 'Your current model works fine. Stay focused.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: -1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 6. Competitor Acquired ────────────────────────────────────────────
  {
    id: 'market-competitor-acquired',
    title: 'Competitor Acquired',
    category: 'competitor',
    minWeek: 10,
    maxOccurrences: 0,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state) => state.market.competitors.some((c) => c.alive),
    descriptions: {
      default: 'One of your competitors was acquired by a big tech company.',
      realistic:
        'Google just acquired one of your competitors for $500M. Their team and technology will be integrated into Google Cloud\'s AI offerings.',
      satirical:
        'Your competitor got acqui-hired by Google for a number so large it makes your valuation look like a rounding error. Their founder posted "excited for the next chapter" which is code for "I\'m rich and never working again." Your investor just texted asking about your "exit strategy."',
      mixed:
        'Competitor acquired by big tech. On one hand: less competition. On the other hand: that competitor now has infinite resources and a trillion-dollar parent. Mixed blessings don\'t get more mixed than this.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 3 },
      { path: 'market.investorSentiment', operation: 'add', value: 4 },
    ],
    decisionOptions: [
      {
        id: 'poach-talent',
        label: 'Poach Their Talent',
        description: 'Some employees won\'t want to join big tech. Recruit them.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15_000 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
          { path: 'market.talentMarketHeat', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'target-customers',
        label: 'Target Their Customers',
        description: 'Their customers are uncertain. Offer them a smooth migration.',
        effects: [
          { path: 'product.customers', operation: 'add', value: 8 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'stay-focused',
        label: 'Stay Focused',
        description: 'Don\'t get distracted by the noise.',
        effects: [],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 7. YC Demo Day ───────────────────────────────────────────────────
  {
    id: 'market-yc-demo-day',
    title: 'YC Demo Day',
    category: 'funding',
    minWeek: 8,
    maxOccurrences: 0,
    cooldownWeeks: 24,
    weight: 3,
    condition: (state) =>
      state.company.reputation > 20 && state.market.investorSentiment > 40,
    descriptions: {
      default: 'Y Combinator Demo Day is happening. The startup world is watching.',
      realistic:
        'YC Demo Day is live. 200+ startups are pitching to the world\'s top investors. The AI batch is the largest ever.',
      satirical:
        'YC Demo Day: where 200 startups pitch "AI for [noun]" to investors who will fund all of them because FOMO is a more powerful force than gravity. Someone pitched "AI for AI" and raised $10M.',
      mixed:
        'YC Demo Day. Half the batch is doing exactly what you do. Their pitches are slicker, their metrics are more creative, and their founders are 10 years younger. But hey, you have real revenue.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 3 },
      { path: 'market.investorSentiment', operation: 'add', value: 2 },
    ],
    decisionOptions: [
      {
        id: 'attend-network',
        label: 'Attend and Network',
        description: 'Show up, shake hands, build relationships.',
        effects: [
          { path: 'founder.reputation', operation: 'add', value: 3 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
          { path: 'finances.cash', operation: 'add', value: -500 },
        ],
      },
      {
        id: 'skip-demo-day',
        label: 'Skip It, Keep Building',
        description: 'Networking is overrated. Shipping is underrated.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 8. HackerNews Front Page ──────────────────────────────────────────
  {
    id: 'market-hackernews-front-page',
    title: 'HackerNews Front Page',
    category: 'market',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 8,
    weight: 4,
    condition: (state) => state.company.reputation > 10,
    descriptions: {
      default: 'Your product just hit the front page of Hacker News.',
      realistic:
        'Your Show HN post is #1 on Hacker News. Traffic is spiking and comments are rolling in — mostly constructive, some hostile.',
      satirical:
        'You\'re on the front page of HN! The top comment says "this could be a shell script." The second comment is a 3,000-word essay about why your tech stack is wrong. Someone already asked "but does it run on Arch Linux?" Traffic is incredible. Morale is complicated.',
      mixed:
        'HN front page! Great for visibility, terrifying for your infrastructure. Your server is sweating. The comments are a mix of genuine feedback and people who peaked in 2008 telling you why everything is wrong.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 4 },
      { path: 'product.customers', operation: 'add', value: 5 },
      { path: 'founder.reputation', operation: 'add', value: 2 },
    ],
    decisionOptions: [
      {
        id: 'engage-comments',
        label: 'Engage With Comments',
        description: 'Respond thoughtfully to feedback. Time-consuming but builds trust.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 3 },
          { path: 'product.pmfScore', operation: 'add', value: 2 },
          { path: 'founder.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'enjoy-traffic',
        label: 'Let the Traffic Speak',
        description: 'Don\'t comment. Let the product do the talking.',
        effects: [
          { path: 'product.customers', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 9. Tech Conference Season ─────────────────────────────────────────
  {
    id: 'market-tech-conference-season',
    title: 'Tech Conference Season',
    category: 'market',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 12,
    weight: 4,
    condition: () => true,
    descriptions: {
      default: 'It\'s tech conference season. Lots of networking and partnership opportunities.',
      realistic:
        'Major AI conferences are happening: NeurIPS, Web Summit, and multiple industry-specific events. Attendance could boost partnerships and hiring.',
      satirical:
        'Conference season: where founders pay $2,000 to stand in a convention center and pretend their lanyard makes them important. Everyone will "definitely follow up" and nobody will. But the LinkedIn posts will be fire.',
      mixed:
        'Conference time. You\'ll spend $5K on tickets and travel, exchange 200 business cards, and get 3 actual leads. The ROI math doesn\'t work but somehow it\'s still worth it.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'attend-conference',
        label: 'Attend as Speaker/Sponsor',
        description: 'High visibility. $5,000 for booth and travel.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5_000 },
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 4 },
          { path: 'founder.bizSkill', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'attend-attendee',
        label: 'Attend as Regular Attendee',
        description: 'Lower cost, lower visibility. $1,500 for tickets and travel.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -1_500 },
          { path: 'company.reputation', operation: 'add', value: 2 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'skip-conference',
        label: 'Skip Conference Season',
        description: 'Save the money and time. Build instead.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 10. AI Safety Incident ────────────────────────────────────────────
  {
    id: 'market-ai-safety-incident',
    title: 'AI Safety Incident',
    category: 'regulation',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 12,
    weight: 3,
    condition: (state) => state.market.bubbleIndex > 25,
    descriptions: {
      default: 'A major AI safety incident made national headlines.',
      realistic:
        'An AI system caused a significant real-world harm. Media coverage is intense, regulators are holding emergency hearings, and public trust in AI is eroding.',
      satirical:
        'An AI chatbot told someone to eat rocks and it made CNN. Congress is holding hearings. The witness doesn\'t know what a browser is but has strong opinions about neural networks. Every AI company\'s PR team is in DEFCON 1.',
      mixed:
        'AI safety incident in the news. It\'s genuinely concerning AND being wildly blown out of proportion at the same time. Your investors are "monitoring the situation" which means they\'re panicking.',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: -6 },
      { path: 'market.bubbleIndex', operation: 'add', value: -4 },
      { path: 'company.reputation', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'safety-statement',
        label: 'Publish a Safety Statement',
        description: 'Proactively address safety concerns. Build trust.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: 5 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'stay-quiet',
        label: 'Stay Quiet',
        description: 'Don\'t draw attention to yourself. Let the storm pass.',
        effects: [],
      },
      {
        id: 'double-down-ai',
        label: 'Double Down on "AI is Safe"',
        description: 'Post a contrarian take. Risky but could differentiate you.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -3 },
          { path: 'founder.reputation', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 11. Market Correction ─────────────────────────────────────────────
  {
    id: 'market-correction',
    title: 'Market Correction',
    category: 'market',
    minWeek: 10,
    maxOccurrences: 0,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state) => state.market.bubbleIndex > 50,
    descriptions: {
      default: 'The market is experiencing a correction. Tech stocks are falling.',
      realistic:
        'NASDAQ is down 8% this week. Tech valuations are compressing. Late-stage funding rounds are being re-priced. The market is sobering up.',
      satirical:
        'Stocks are tanking. VCs are suddenly very interested in "profitability" and "unit economics" — concepts they\'d never heard of during the bull run. Your investor sent a 4 AM email about "extending runway." Everyone is pretending they always cared about fundamentals.',
      mixed:
        'Market correction hit. The good news: your competitors with unsustainable burn rates are panicking. The bad news: so are your investors. "How\'s the runway?" is the new "Hello."',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: -10 },
      { path: 'market.investorSentiment', operation: 'add', value: -10 },
      { path: 'company.valuation', operation: 'multiply', value: 0.85 },
    ],
    decisionOptions: [
      {
        id: 'cut-costs',
        label: 'Cut Costs Preemptively',
        description: 'Extend runway by reducing burn. Painful but prudent.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 10_000 },
          { path: 'team.morale', operation: 'add', value: -5 },
        ],
      },
      {
        id: 'stay-aggressive',
        label: 'Stay Aggressive',
        description: 'Your competitors are cutting. This is your chance to grow.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10_000 },
          { path: 'product.customers', operation: 'add', value: 3 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 12. New AI Benchmark ──────────────────────────────────────────────
  {
    id: 'market-new-ai-benchmark',
    title: 'New AI Benchmark',
    category: 'market',
    minWeek: 5,
    maxOccurrences: 0,
    cooldownWeeks: 14,
    weight: 3,
    condition: () => true,
    descriptions: {
      default: 'A new AI benchmark was published, reshuffling the industry leaderboard.',
      realistic:
        'A new comprehensive AI benchmark dropped. It\'s reshuffling model rankings and redefining what "state of the art" means for your market segment.',
      satirical:
        'New benchmark alert! The model you\'re using went from #1 to #7 overnight. Your CTO is having a crisis. Twitter AI bros are posting cherry-picked charts. Every AI company\'s marketing team is scrambling to find a metric where they\'re still winning.',
      mixed:
        'New AI benchmark published. It proves that the model everyone was using is actually mid, and the model nobody was using is actually great. Time to re-evaluate your entire stack. Again.',
    },
    immediateEffects: [
      { path: 'company.culture', operation: 'add', value: 1 },
    ],
    decisionOptions: [
      {
        id: 'switch-model',
        label: 'Switch to Top-Ranked Model',
        description: 'Migrate to the new leader. Significant engineering effort.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'product.overallQuality', operation: 'add', value: 4 },
          { path: 'finances.cash', operation: 'add', value: -3_000 },
        ],
      },
      {
        id: 'wait-for-dust',
        label: 'Wait for the Dust to Settle',
        description: 'Benchmarks don\'t tell the whole story. Evaluate first.',
        effects: [
          { path: 'founder.techSkill', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 13. Open Source Model Released ────────────────────────────────────
  {
    id: 'market-open-source-model-released',
    title: 'Open Source Model Released',
    category: 'market',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 4,
    condition: () => true,
    descriptions: {
      default: 'A major open source AI model was released, disrupting the paid model market.',
      realistic:
        'Meta just released an open source model that\'s 90% as capable as leading closed models. API pricing across the industry is about to compress.',
      satirical:
        'Open source model just dropped and it\'s basically free GPT-4. Closed-model companies are in shambles. OpenAI stock (if it existed) would be cratering. The "open source will never catch up" crowd is suspiciously quiet.',
      mixed:
        'New open source model: it\'s really good, it\'s free, and it just made your AI API bill negotiable. Your CTO is already running it on a single GPU. Your AI vendor\'s sales rep just called.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 2 },
      { path: 'company.culture', operation: 'add', value: 2 },
    ],
    decisionOptions: [
      {
        id: 'adopt-open-source',
        label: 'Adopt Open Source Model',
        description: 'Switch to the free model. Lower costs, more control, more work.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 5_000 },
          { path: 'product.techDebtTotal', operation: 'add', value: 4 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'negotiate-vendor',
        label: 'Negotiate Better API Pricing',
        description: 'Use the open source threat as leverage with your current vendor.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 2_000 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'stay-closed',
        label: 'Stay With Closed Model',
        description: 'Better support, reliability, and no ops burden.',
        effects: [],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 14. Big Tech AI Product Launch ────────────────────────────────────
  {
    id: 'market-big-tech-ai-launch',
    title: 'Big Tech AI Product Launch',
    category: 'competitor',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 12,
    weight: 4,
    condition: () => true,
    descriptions: {
      default: 'A big tech company just launched an AI product that overlaps with your market.',
      realistic:
        'Google/Microsoft/Amazon just launched an AI product with significant overlap to your offering. They\'re giving it away free for the first year. Your sales pipeline is going to feel this.',
      satirical:
        'Google just launched a product that does exactly what you do, but free, bundled with everything, and backed by infinite money. Your investor texted: "saw the Google thing. thoughts?" You\'re hiding in the bathroom writing a Twitter thread about "startups vs. gorillas."',
      mixed:
        'Big tech entered your space. The good news: it validates the market. The bad news: it\'s Google and they\'re offering it for free. The worse news: your biggest customer just asked for a "competitive pricing review."',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: -4 },
      { path: 'company.reputation', operation: 'add', value: -2 },
      { path: 'product.customers', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'niche-down',
        label: 'Niche Down Hard',
        description: 'Focus on what big tech does poorly. Vertical specificity.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'feature-parity',
        label: 'Race for Feature Parity',
        description: 'Match their features. Expensive and exhausting.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 5 },
          { path: 'team.morale', operation: 'add', value: -5 },
          { path: 'product.overallQuality', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'pivot',
        label: 'Consider a Pivot',
        description: 'Maybe this is a sign to find a less contested space.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: -3 },
          { path: 'company.culture', operation: 'add', value: 5 },
          { path: 'founder.bizSkill', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 15. Startup Unicorn Minted ────────────────────────────────────────
  {
    id: 'market-unicorn-minted',
    title: 'Startup Unicorn Minted',
    category: 'funding',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 4,
    condition: (state) => state.market.investorSentiment > 35,
    descriptions: {
      default: 'Another AI startup just reached unicorn status with a $1B+ valuation.',
      realistic:
        'An AI startup in an adjacent space just raised a $200M Series C at a $1.2B valuation. The AI hype cycle is in full swing.',
      satirical:
        'Another AI unicorn minted. They have 12 employees, no revenue, and a valuation of $1.2 billion. Their product is "AI for AI." VCs are calling it "the next platform shift." Somewhere, an economist is crying.',
      mixed:
        'New unicorn: 18 months old, $1.2B valuation, "AI-native" everything. Their secret? Incredible storytelling, mediocre product, and a VC market that values vibes over revenue. Your investors are asking why you can\'t grow faster.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 5 },
      { path: 'market.investorSentiment', operation: 'add', value: 4 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 16. AI Copyright Ruling ───────────────────────────────────────────
  {
    id: 'market-ai-copyright-ruling',
    title: 'AI Copyright Ruling',
    category: 'regulation',
    minWeek: 10,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 2,
    condition: () => true,
    descriptions: {
      default: 'A federal court issued a major ruling on AI and copyright law.',
      realistic:
        'A federal judge ruled on AI-generated content and training data copyright. The precedent will reshape how AI companies handle intellectual property.',
      satirical:
        'A judge who still prints emails ruled on AI copyright. The decision is 400 pages long and manages to confuse everyone equally. Lawyers are celebrating because they\'ll be billing for this until the heat death of the universe.',
      mixed:
        'AI copyright ruling is in. It\'s neither the apocalypse nor the all-clear that anyone wanted. The legal landscape is slightly less murky, which somehow costs more in legal fees.',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'legal-review',
        label: 'Hire a Lawyer for Compliance Review',
        description: 'Better safe than sued. $3,000 for a legal opinion.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -3_000 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'self-assess',
        label: 'Self-Assess Compliance',
        description: 'Review your own training data and practices in-house.',
        effects: [
          { path: 'founder.techSkill', operation: 'add', value: 1 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'yolo',
        label: 'Ignore It',
        description: 'You\'re too small to get sued. Probably.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 17. SF Office Space Crash ─────────────────────────────────────────
  {
    id: 'market-sf-office-crash',
    title: 'SF Office Space Crash',
    category: 'market',
    minWeek: 8,
    maxOccurrences: 2,
    cooldownWeeks: 20,
    weight: 2,
    condition: () => true,
    descriptions: {
      default: 'Office space prices in San Francisco dropped significantly.',
      realistic:
        'SF commercial real estate vacancy hit record highs. Office rents are down 30% from peak. It\'s a renter\'s market for the first time in a decade.',
      satirical:
        'SF office space is so cheap that you could rent the entire Salesforce Tower for the cost of a mid-level engineer. Downtown looks like a zombie movie set. Your landlord is suddenly returning your calls and calling you "friend."',
      mixed:
        'Office rent crashed in SF. Great for your lease renewal. Less great: it crashed because everyone left. The WeWork down the street is now a ghost ship with really nice kombucha on tap.',
    },
    immediateEffects: [
      { path: 'finances.cash', operation: 'add', value: 3_000 },
    ],
    decisionOptions: [
      {
        id: 'upgrade-office',
        label: 'Upgrade to a Nicer Space',
        description: 'Lock in a great deal on a much better office.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5_000 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.reputation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'renegotiate',
        label: 'Renegotiate Current Lease',
        description: 'Use the market to get a 25% discount from your landlord.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 4_000 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 3,
  },

  // ─── 18. Talent War Heats Up ───────────────────────────────────────────
  {
    id: 'market-talent-war-heats-up',
    title: 'Talent War Heats Up',
    category: 'market',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 4,
    condition: (state) => state.market.talentMarketHeat > 40,
    descriptions: {
      default: 'Competition for AI talent is intensifying. Hiring costs are rising.',
      realistic:
        'AI engineer salaries jumped 20% this quarter. Multiple companies are offering $500K+ total comp for senior roles. Retention is becoming a serious concern.',
      satirical:
        'AI engineers are now more expensive than Michelin-star chefs. A junior dev with 6 months of PyTorch experience wants $300K base and a company car. Someone who typed "import tensorflow" once is getting recruited by 15 companies. The talent market has lost its mind.',
      mixed:
        'Talent war update: salaries are insane, everyone is getting poached, and your best engineer just got a LinkedIn message from every company in existence. Time to either pay up or hope they really like your office snacks.',
    },
    immediateEffects: [
      { path: 'market.talentMarketHeat', operation: 'add', value: 8 },
    ],
    decisionOptions: [
      {
        id: 'raise-salaries',
        label: 'Proactively Raise Salaries',
        description: 'Stay competitive. Increase team comp by 15%.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -20_000 },
          { path: 'team.morale', operation: 'add', value: 8 },
        ],
      },
      {
        id: 'retention-perks',
        label: 'Offer Retention Perks',
        description: 'Better benefits, equity refreshes, remote flexibility.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -8_000 },
          { path: 'team.morale', operation: 'add', value: 5 },
          { path: 'company.culture', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'accept-risk',
        label: 'Accept the Risk',
        description: 'Can\'t compete on comp. Hope culture is enough.',
        effects: [
          { path: 'team.morale', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 19. AI Winter Fears ───────────────────────────────────────────────
  {
    id: 'market-ai-winter-fears',
    title: 'AI Winter Fears',
    category: 'market',
    minWeek: 12,
    maxOccurrences: 0,
    cooldownWeeks: 16,
    weight: 3,
    condition: (state) => state.market.bubbleIndex > 45,
    descriptions: {
      default: 'Prominent voices are warning about a potential AI winter.',
      realistic:
        'A well-known AI researcher published an influential essay: "The Coming AI Winter." VCs are circulating it. Several late-stage deals have fallen through this week.',
      satirical:
        '"AI Winter Is Coming" — a blog post by someone who\'s been wrong about everything except this one thing they\'ll eventually be right about. VCs are panic-texting founders about "path to profitability." The bubble trembles.',
      mixed:
        'AI winter fears are trending. Is it actually coming? Probably not yet. But the fear itself is enough to tighten funding. Your investor just asked for a "downside scenario model." They didn\'t ask for this during the hype.',
    },
    immediateEffects: [
      { path: 'market.investorSentiment', operation: 'add', value: -8 },
      { path: 'market.bubbleIndex', operation: 'add', value: -6 },
    ],
    decisionOptions: [
      {
        id: 'extend-runway',
        label: 'Extend Runway Immediately',
        description: 'Cut discretionary spending. Prepare for the worst.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 8_000 },
          { path: 'team.morale', operation: 'add', value: -4 },
        ],
      },
      {
        id: 'contrarian-bet',
        label: 'Make a Contrarian Bet',
        description: 'Double down while others retreat. High risk, high reward.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -10_000 },
          { path: 'founder.reputation', operation: 'add', value: 3 },
          { path: 'company.culture', operation: 'add', value: 5 },
        ],
      },
      {
        id: 'business-as-usual',
        label: 'Business as Usual',
        description: 'Don\'t panic. Keep executing.',
        effects: [
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

];
