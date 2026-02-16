import type { GameEvent } from '../../types/events.ts';

export const ROUTINE_EVENTS: GameEvent[] = [
  // ─── 1. New Job Applicant ──────────────────────────────────────────────
  {
    id: 'routine-new-job-applicant',
    title: 'New Job Applicant',
    category: 'team',
    minWeek: 2,
    maxOccurrences: 0,
    cooldownWeeks: 3,
    weight: 6,
    condition: (state) => state.finances.cash > 20_000,
    descriptions: {
      default: 'A strong candidate just applied to your open role.',
      realistic:
        'A promising candidate with relevant experience submitted their application. Their background checks out and they seem genuinely interested in the mission.',
      satirical:
        'Someone with "AI Visionary" in their LinkedIn headline applied. Their resume is entirely written by ChatGPT, but honestly, it\'s better than most human-written ones.',
      mixed:
        'A solid candidate applied. They actually read the job description — which already puts them in the top 1% of applicants.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'hire',
        label: 'Hire Them',
        description: 'Extend an offer immediately. $3,500/week salary.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -14_000 },
          { path: 'company.reputation', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'pass',
        label: 'Pass',
        description: 'Not the right fit right now.',
        effects: [],
      },
      {
        id: 'lowball',
        label: 'Offer Below Market',
        description: 'Offer $2,000/week plus equity. They might walk.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -8_000 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 2. Feature Shipped ────────────────────────────────────────────────
  {
    id: 'routine-feature-shipped',
    title: 'Feature Shipped',
    category: 'product',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 4,
    weight: 7,
    condition: (state) =>
      state.team.employees.length >= 1 &&
      state.product.features.some((f) => f.status === 'in-progress'),
    descriptions: {
      default: 'Your team completed and shipped a new feature!',
      realistic:
        'After several sprints of focused work, the team shipped the feature to production. Initial telemetry looks solid.',
      satirical:
        'Against all odds — and three "quick pivots" — something actually shipped. The Slack channel erupted with party emojis. The CTO shed a single tear.',
      mixed:
        'The feature shipped! Only two weeks behind schedule, which in startup time is basically early.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: 5 },
      { path: 'product.overallQuality', operation: 'add', value: 2 },
      { path: 'product.pmfScore', operation: 'add', value: 1 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 3. Customer Feedback ──────────────────────────────────────────────
  {
    id: 'routine-customer-feedback',
    title: 'Customer Feedback',
    category: 'product',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 2,
    weight: 8,
    condition: (state) => state.product.customers > 0,
    descriptions: {
      default: 'A customer sent detailed feedback about your product.',
      realistic:
        'One of your power users sent a thoughtful email with feature requests and pain points. This is gold for product development.',
      satirical:
        'A customer emailed: "Love the product, but it would be better if it did literally everything else too." Attached: a 47-page requirements doc.',
      mixed:
        'Customer feedback arrived. It\'s a mix of genuinely useful insights and "can you just build exactly what Salesforce does, but free?"',
    },
    immediateEffects: [
      { path: 'product.pmfScore', operation: 'add', value: 1 },
    ],
    decisionOptions: [
      {
        id: 'implement',
        label: 'Implement Suggestions',
        description: 'Prioritize the feedback. Costs dev time but improves PMF.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'acknowledge',
        label: 'Thank and Backlog',
        description: 'Acknowledge the feedback and add it to the roadmap.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore',
        description: 'You know best. Probably.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: -1 },
          { path: 'product.customers', operation: 'add', value: -1 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 4. Weekly Standup Drama ───────────────────────────────────────────
  {
    id: 'routine-standup-drama',
    title: 'Weekly Standup Drama',
    category: 'team',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 5,
    weight: 5,
    condition: (state) => state.team.employees.length >= 3,
    descriptions: {
      default: 'Engineers got into a heated debate during standup about the architecture.',
      realistic:
        'The standup ran 40 minutes over as two engineers clashed over microservices vs monolith. The PM is visibly aging.',
      satirical:
        'Civil war erupted at standup. One engineer wants microservices; the other wants a monolith. A third suggested "serverless" and was escorted out. The PM opened LinkedIn under the table.',
      mixed:
        'Architecture debate at standup. Pros: passionate team. Cons: nothing else got discussed. The Jira board weeps.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'mediate',
        label: 'Mediate the Discussion',
        description: 'Spend time facilitating a resolution. Morale recovers.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 5 },
          { path: 'company.culture.collaboration', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'pick-side',
        label: 'Pick a Side',
        description: 'Make a unilateral call. Fast but someone will be unhappy.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -2 },
          { path: 'product.techDebtTotal', operation: 'add', value: -1 },
        ],
      },
      {
        id: 'ignore-it',
        label: 'Let Them Fight',
        description: 'Darwinism will sort it out. Probably.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -5 },
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 5. Cloud Bill Spike ───────────────────────────────────────────────
  {
    id: 'routine-cloud-bill-spike',
    title: 'Cloud Bill Spike',
    category: 'product',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 8,
    weight: 5,
    condition: (state) => state.product.customers > 5,
    descriptions: {
      default: 'Your cloud infrastructure bill doubled this month.',
      realistic:
        'AWS bill alert: your compute costs increased 107% MoM. Time to review resource allocation.',
      satirical:
        'Jeff Bezos personally thanks you for funding his next space yacht. Your AWS bill is now larger than your Series A.',
      mixed:
        'Your cloud bill doubled. Your CTO says "it\'s fine, we\'re scaling." Your CFO is crying in the bathroom.',
    },
    immediateEffects: [
      { path: 'finances.cash', operation: 'add', value: -8_000 },
    ],
    decisionOptions: [
      {
        id: 'optimize',
        label: 'Optimize Infrastructure',
        description: 'Spend engineering time reducing costs. Takes a week.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 5_000 },
          { path: 'product.techDebtTotal', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'pay-it',
        label: 'Just Pay It',
        description: 'Cost of doing business. Focus on growth instead.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -4_000 },
        ],
      },
      {
        id: 'switch-provider',
        label: 'Evaluate Switching Providers',
        description: 'Look into alternatives. Risk of migration headaches.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
          { path: 'finances.cash', operation: 'add', value: 2_000 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 6. Office Lease Renewal ───────────────────────────────────────────
  {
    id: 'routine-office-lease-renewal',
    title: 'Office Lease Renewal',
    category: 'random',
    minWeek: 12,
    maxOccurrences: 4,
    cooldownWeeks: 24,
    weight: 3,
    condition: (state) => state.team.employees.length >= 2,
    descriptions: {
      default: 'Your office lease is up for renewal. The landlord wants 20% more.',
      realistic:
        'Lease renewal notice: the landlord is proposing a 20% rent increase citing "market conditions." You have 2 weeks to respond.',
      satirical:
        'Your landlord wants 20% more rent because, quote, "AI startups can afford it." He saw your TechCrunch article. Big mistake.',
      mixed:
        'Lease renewal time. The landlord wants 20% more. Your options: pay up, negotiate, or join the remote-first movement like everyone pretends they wanted to anyway.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'renew',
        label: 'Renew at Higher Rate',
        description: 'Stability has value. Pay the increase.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -12_000 },
          { path: 'team.avgMorale', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'negotiate',
        label: 'Negotiate',
        description: 'Try to get a better deal. Might work, might not.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -6_000 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'go-remote',
        label: 'Go Fully Remote',
        description: 'Cancel the lease. Save money but culture takes a hit.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: 10_000 },
          { path: 'team.avgMorale', operation: 'add', value: -5 },
          { path: 'company.culture.collaboration', operation: 'add', value: -8 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 7. Employee Birthday ──────────────────────────────────────────────
  {
    id: 'routine-employee-birthday',
    title: 'Employee Birthday',
    category: 'culture',
    minWeek: 2,
    maxOccurrences: 0,
    cooldownWeeks: 4,
    weight: 7,
    condition: (state) => state.team.employees.length >= 1,
    descriptions: {
      default: 'One of your team members is celebrating their birthday today!',
      realistic:
        'It\'s a team member\'s birthday. The office is debating whether to do cake or just a Slack message.',
      satirical:
        'An employee turned another year older — a year closer to being too expensive. HR scheduled exactly 12 minutes of celebration between sprint reviews.',
      mixed:
        'Birthday in the office! Someone bought a cake. Someone else pointed out it\'s not vegan, gluten-free, or sugar-free. Good times.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: 2 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 8. Code Review Conflict ───────────────────────────────────────────
  {
    id: 'routine-code-review-conflict',
    title: 'Code Review Conflict',
    category: 'team',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 5,
    weight: 5,
    condition: (state) =>
      state.team.employees.filter((e) => e.role === 'engineer' || e.role === 'senior-engineer').length >= 2,
    descriptions: {
      default: 'A code review turned into a heated debate about best practices.',
      realistic:
        'A senior developer rejected a PR with 47 comments. The author disagrees with almost all of them. The PR has been open for 6 days.',
      satirical:
        'The senior dev and the AI code assistant both rejected each other\'s suggestions. They\'re now in an infinite loop of "actually, I think you\'ll find..." comments. The PR has achieved sentience and is writing its own review.',
      mixed:
        'Code review conflict: one dev wants clean architecture, the other wants to ship. Tale as old as time. The PR comments section is now longer than the code itself.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'side-with-senior',
        label: 'Back the Senior Dev',
        description: 'Code quality matters. Enforce the review standards.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: -2 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'team.avgMorale', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'ship-it',
        label: 'Just Ship It',
        description: 'Good enough. Move on.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
          { path: 'team.avgMorale', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'pair-program',
        label: 'Have Them Pair Program',
        description: 'Force collaboration. Takes time but builds alignment.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 3 },
          { path: 'company.culture.collaboration', operation: 'add', value: 3 },
          { path: 'product.overallQuality', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 9. Product Bug Report ─────────────────────────────────────────────
  {
    id: 'routine-product-bug-report',
    title: 'Product Bug Report',
    category: 'product',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 3,
    weight: 7,
    condition: (state) => state.product.customers > 0 && state.product.bugs > 0,
    descriptions: {
      default: 'A customer found a critical bug in your product.',
      realistic:
        'P0 bug report: a customer\'s data export is corrupted. They\'re threatening to churn if it\'s not fixed within 48 hours.',
      satirical:
        'Critical bug: your AI occasionally tells customers to "try turning it off and never turning it back on." Your support inbox looks like a crime scene.',
      mixed:
        'A customer found a bug so bad they wrote a Twitter thread about it. The thread has more engagement than your actual product launch.',
    },
    immediateEffects: [
      { path: 'product.overallQuality', operation: 'add', value: -2 },
      { path: 'company.reputation', operation: 'add', value: -1 },
    ],
    decisionOptions: [
      {
        id: 'hotfix',
        label: 'Emergency Hotfix',
        description: 'Drop everything and fix it now. Fast but risky.',
        effects: [
          { path: 'product.bugs', operation: 'add', value: -1 },
          { path: 'product.techDebtTotal', operation: 'add', value: 2 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'proper-fix',
        label: 'Proper Fix Next Sprint',
        description: 'Fix it right but the customer waits.',
        effects: [
          { path: 'product.bugs', operation: 'add', value: -1 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'product.customers', operation: 'add', value: -1 },
        ],
      },
      {
        id: 'its-a-feature',
        label: '"It\'s a Feature"',
        description: 'Gaslight the customer. Bold strategy.',
        effects: [
          { path: 'company.reputation', operation: 'add', value: -5 },
          { path: 'product.customers', operation: 'add', value: -2 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 10. Coffee Machine Broke ──────────────────────────────────────────
  {
    id: 'routine-coffee-machine-broke',
    title: 'Coffee Machine Broke',
    category: 'culture',
    minWeek: 2,
    maxOccurrences: 0,
    cooldownWeeks: 12,
    weight: 4,
    condition: (state) => state.team.employees.length >= 2,
    descriptions: {
      default: 'The office coffee machine is broken.',
      realistic:
        'The coffee machine finally gave out. It\'s been making concerning noises for weeks. Team morale is visibly affected.',
      satirical:
        'The coffee machine died. Productivity dropped 40%. Two engineers are in the fetal position. The PM declared it a "blocker." Someone started a GoFundMe.',
      mixed:
        'Coffee machine is dead. Within 30 minutes, three people offered to "disrupt" the coffee space with an AI-powered solution. Productivity is at zero.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'new-machine',
        label: 'Buy a New Machine',
        description: 'Spring for the fancy espresso machine. $800.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -800 },
          { path: 'team.avgMorale', operation: 'add', value: 6 },
        ],
      },
      {
        id: 'cheap-machine',
        label: 'Buy a Cheap Replacement',
        description: 'Basic drip coffee. $50. It works.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -50 },
          { path: 'team.avgMorale', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'no-replacement',
        label: 'No Replacement',
        description: 'There\'s a Starbucks down the street. They\'ll survive.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -4 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 11. Intern Application ────────────────────────────────────────────
  {
    id: 'routine-intern-application',
    title: 'Intern Application',
    category: 'team',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 8,
    weight: 4,
    condition: (state) =>
      state.team.employees.length >= 2 && state.finances.cash > 10_000,
    descriptions: {
      default: 'A CS student applied for an internship at your startup.',
      realistic:
        'A junior from Stanford\'s CS program wants to intern this summer. They\'re eager but will need significant mentorship.',
      satirical:
        'A 19-year-old applied for an internship. Their GitHub has more stars than your production repo. They want "$40/hour minimum because Bay Area." They also have three side projects that are better than your product.',
      mixed:
        'Intern application: Stanford CS junior, impressive side projects, wants to "learn about startup culture." Translation: they want LinkedIn content material.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'hire-intern',
        label: 'Hire the Intern',
        description: 'Cheap labor, $1,200/week. Will need mentoring time.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -4_800 },
          { path: 'team.avgMorale', operation: 'add', value: 2 },
          { path: 'company.culture.innovation', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'pass-intern',
        label: 'Pass',
        description: 'Not the right time to mentor someone.',
        effects: [],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 12. Team Lunch ────────────────────────────────────────────────────
  {
    id: 'routine-team-lunch',
    title: 'Team Lunch',
    category: 'culture',
    minWeek: 2,
    maxOccurrences: 0,
    cooldownWeeks: 3,
    weight: 6,
    condition: (state) => state.team.employees.length >= 2,
    descriptions: {
      default: 'The team is suggesting a group lunch outing.',
      realistic:
        'It\'s been a while since the team ate together. Someone suggested a group lunch to build camaraderie.',
      satirical:
        'The team wants a catered lunch. In SF, this means $45 per person for artisanal grain bowls. One person will complain the food isn\'t organic enough.',
      mixed:
        'Team lunch request. Budget: somewhere between "just order pizza" and "we\'re a Series A company, we deserve sushi." Dietary restrictions: yes, all of them.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'fund-lunch',
        label: 'Fund a Nice Lunch',
        description: 'Treat the team. $50 per person.',
        effects: [
          {
            path: 'finances.cash',
            operation: 'add',
            value: -500,
          },
          { path: 'team.avgMorale', operation: 'add', value: 5 },
          { path: 'company.culture.collaboration', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'pizza',
        label: 'Order Pizza',
        description: 'Crowd-pleaser on a budget. $15 per person.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -150 },
          { path: 'team.avgMorale', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'skip-lunch',
        label: 'Skip It',
        description: 'We have deadlines. Lunch is for closers.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -2 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 13. Open Source Contribution ──────────────────────────────────────
  {
    id: 'routine-open-source-contribution',
    title: 'Open Source Contribution',
    category: 'product',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 3,
    condition: (state) =>
      state.team.employees.some((e) => e.role === 'engineer' || e.role === 'senior-engineer') &&
      state.product.overallQuality > 30,
    descriptions: {
      default: 'One of your open source libraries is getting attention on GitHub.',
      realistic:
        'Your team\'s open source utility library hit 500 stars on GitHub. Developers are submitting PRs and issues.',
      satirical:
        'Your open source repo went viral. You now have 2,000 stars, 47 issues demanding features, and one person who opened a PR that rewrites everything in Rust. Internet fame at last.',
      mixed:
        'Your GitHub repo is trending! Great for hiring, great for reputation. Less great: someone already forked it and made it better.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
      { path: 'founder.reputation', operation: 'add', value: 3 },
      { path: 'market.talentMarketHeat', operation: 'add', value: -1 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 14. Slack Channel Explosion ───────────────────────────────────────
  {
    id: 'routine-slack-explosion',
    title: 'Slack Channel Explosion',
    category: 'culture',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 6,
    weight: 5,
    condition: (state) => state.team.employees.length >= 4,
    descriptions: {
      default: 'Drama erupted in the #random Slack channel.',
      realistic:
        'A heated discussion in #random spilled over into #general. Something about tabs vs spaces escalated into questioning life choices.',
      satirical:
        'World War III broke out in #random over whether AI will replace developers. Someone posted a meme. Someone else posted a thesis. HR has been tagged 14 times. The #random channel is now more active than #engineering.',
      mixed:
        'Slack drama again. Started with "should we use AI for code reviews?" and ended with someone questioning the meaning of work itself. The thread has 200+ messages. Nobody got any work done.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'address-it',
        label: 'Address It Thoughtfully',
        description: 'Have an all-hands to discuss the underlying concerns.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 4 },
          { path: 'company.culture.collaboration', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'mute-channel',
        label: 'Lock the Channel',
        description: 'Shut it down. Focus on work.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -3 },
          { path: 'company.culture.workLifeBalance', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 15. Standing Desk Request ─────────────────────────────────────────
  {
    id: 'routine-standing-desk-request',
    title: 'Standing Desk Request',
    category: 'culture',
    minWeek: 3,
    maxOccurrences: 3,
    cooldownWeeks: 12,
    weight: 3,
    condition: (state) => state.team.employees.length >= 1,
    descriptions: {
      default: 'An employee requested a standing desk for ergonomic reasons.',
      realistic:
        'An employee submitted a facilities request for a standing desk, citing back pain from long coding sessions.',
      satirical:
        'An employee needs a standing desk. Then a walking treadmill desk. Then a hanging-from-the-ceiling desk. The wellness budget is now your biggest line item after AWS.',
      mixed:
        'Standing desk request. Reasonable ask, but you know if you say yes to one, everyone will want one. The domino theory of office furniture.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'approve',
        label: 'Approve It',
        description: 'Buy the standing desk. $600. Happy employee.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -600 },
          { path: 'team.avgMorale', operation: 'add', value: 3 },
          { path: 'company.culture.workLifeBalance', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'deny',
        label: 'Deny It',
        description: 'Budget is tight. Not now.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 16. Late Night Deploy ─────────────────────────────────────────────
  {
    id: 'routine-late-night-deploy',
    title: 'Late Night Deploy',
    category: 'product',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 4,
    weight: 5,
    condition: (state) =>
      state.team.employees.length >= 2 &&
      state.product.features.some((f) => f.status === 'in-progress'),
    descriptions: {
      default: 'The team pulled a late night to ship an important feature.',
      realistic:
        'The team stayed until 2 AM to ship the feature before the client demo tomorrow. The deploy went smoothly, but everyone is exhausted.',
      satirical:
        'It\'s 2 AM. Pizza boxes everywhere. Someone is asleep under their desk. The feature shipped. The Slack channel says "LFG" and "we\'re so back." Nobody will be functional until Thursday.',
      mixed:
        'Late night deploy: successful. Team morale: the complex kind where you\'re proud but also questioning all your life decisions at 2 AM.',
    },
    immediateEffects: [
      { path: 'product.overallQuality', operation: 'add', value: 3 },
      { path: 'product.pmfScore', operation: 'add', value: 2 },
      { path: 'team.avgMorale', operation: 'add', value: -4 },
      { path: 'company.culture.workLifeBalance', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'day-off',
        label: 'Give Team a Day Off',
        description: 'They earned it. Let them recover.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 8 },
          { path: 'company.culture.workLifeBalance', operation: 'add', value: 4 },
        ],
      },
      {
        id: 'push-on',
        label: 'Back to Work Tomorrow',
        description: 'Deadlines don\'t care about your sleep schedule.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -5 },
          { path: 'company.culture.workLifeBalance', operation: 'add', value: -3 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 17. Customer Churned ──────────────────────────────────────────────
  {
    id: 'routine-customer-churned',
    title: 'Customer Churned',
    category: 'product',
    minWeek: 5,
    maxOccurrences: 0,
    cooldownWeeks: 3,
    weight: 6,
    condition: (state) => state.product.customers >= 3,
    descriptions: {
      default: 'A customer cancelled their subscription.',
      realistic:
        'Churn alert: a mid-size customer cancelled, citing "shifting priorities." Exit survey mentions competitor features and pricing concerns.',
      satirical:
        'A customer left. Their exit survey: "We loved the product but we found something cheaper. Also free. Also better. Sorry not sorry." They left a 1-star review on G2 as a parting gift.',
      mixed:
        'Customer churned. They said it\'s "not you, it\'s them." It\'s definitely you. The competitor they\'re switching to just launched the feature you\'ve been "planning" for six months.',
    },
    immediateEffects: [
      { path: 'product.customers', operation: 'add', value: -1 },
      { path: 'finances.weeklyRevenue', operation: 'add', value: -500 },
    ],
    decisionOptions: [
      {
        id: 'win-back',
        label: 'Offer Discount to Win Back',
        description: 'Reach out with 30% off. Might save them.',
        effects: [
          { path: 'finances.weeklyRevenue', operation: 'add', value: 350 },
          { path: 'product.customers', operation: 'add', value: 1 },
          { path: 'company.reputation', operation: 'add', value: -1 },
        ],
      },
      {
        id: 'learn',
        label: 'Do Exit Interview',
        description: 'Understand why they left to prevent future churn.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 2 },
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'let-go',
        label: 'Let Them Go',
        description: 'Move on. Focus on new customers.',
        effects: [],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 18. Blog Post Viral ───────────────────────────────────────────────
  {
    id: 'routine-blog-post-viral',
    title: 'Blog Post Viral',
    category: 'random',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 8,
    weight: 3,
    condition: (state) => state.company.reputation > 15,
    descriptions: {
      default: 'Your latest blog post went viral on social media.',
      realistic:
        'Your technical blog post got picked up by several newsletters and is trending on social media. Inbound leads are spiking.',
      satirical:
        'Your blog post "Why We Replaced Our Entire Team With AI (And Why You Should Too)" went mega-viral. Half the internet loves you, the other half wants you tried at The Hague. Engagement is through the roof.',
      mixed:
        'Blog post went viral. You\'re getting thousands of visitors. Unfortunately, most of them are just here for the hot takes. But hey, brand awareness is brand awareness.',
    },
    immediateEffects: [
      { path: 'company.reputation', operation: 'add', value: 5 },
      { path: 'product.customers', operation: 'add', value: 3 },
      { path: 'founder.reputation', operation: 'add', value: 3 },
    ],
    decisionOptions: [],
    decisionDeadlineWeeks: 0,
  },

  // ─── 19. Technical Interview ───────────────────────────────────────────
  {
    id: 'routine-technical-interview',
    title: 'Technical Interview',
    category: 'team',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 4,
    weight: 5,
    condition: (state) =>
      state.finances.cash > 30_000 && state.team.employees.length >= 1,
    descriptions: {
      default: 'You\'re interviewing a promising engineering candidate today.',
      realistic:
        'Final round interview with a strong engineering candidate. They have competing offers and want to make a decision this week.',
      satirical:
        'The candidate aced the whiteboard. They can invert a binary tree AND make small talk. Basically a unicorn. They have 17 competing offers because apparently everyone is hiring AI engineers.',
      mixed:
        'Interview went well. The candidate is sharp, experienced, and — rarest of all — seems like a normal human being. They have other offers though, so the clock is ticking.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'strong-offer',
        label: 'Make a Strong Offer',
        description: 'Top of market: $4,000/week. Lock them in.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -16_000 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'company.reputation', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'standard-offer',
        label: 'Standard Offer',
        description: 'Market rate: $3,200/week. Fair but might lose them.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -12_800 },
        ],
      },
      {
        id: 'pass-candidate',
        label: 'Pass on This One',
        description: 'Not the right fit or timing.',
        effects: [],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 20. Performance Review Season ─────────────────────────────────────
  {
    id: 'routine-performance-review',
    title: 'Performance Review Season',
    category: 'team',
    minWeek: 12,
    maxOccurrences: 0,
    cooldownWeeks: 12,
    weight: 4,
    condition: (state) => state.team.employees.length >= 3,
    descriptions: {
      default: 'It\'s time for quarterly performance reviews. Employees expect feedback and raises.',
      realistic:
        'Performance review cycle is here. Employees are expecting honest feedback, growth plans, and compensation adjustments.',
      satirical:
        'Performance review time — that magical season where everyone simultaneously "exceeded expectations" and "needs improvement." HR sent a 30-page template. Nobody will fill it out properly.',
      mixed:
        'Review season. Everyone wants a raise. Your top performer wants a title change. Your underperformer wants "more runway." Your budget wants everyone to calm down.',
    },
    immediateEffects: [
      { path: 'team.avgMorale', operation: 'add', value: -3 },
    ],
    decisionOptions: [
      {
        id: 'generous-raises',
        label: 'Generous Raises (10%)',
        description: 'Reward the team well. Retention and morale up.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -15_000 },
          { path: 'team.avgMorale', operation: 'add', value: 10 },
          { path: 'company.reputation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'modest-raises',
        label: 'Modest Raises (3%)',
        description: 'Cost-of-living adjustment. Reasonable.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -5_000 },
          { path: 'team.avgMorale', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'no-raises',
        label: 'No Raises This Quarter',
        description: 'Runway is more important. Explain the situation.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -8 },
          { path: 'company.reputation', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'equity-instead',
        label: 'Offer Equity Instead',
        description: 'Stock options instead of cash. Startup classic.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 1 },
          { path: 'finances.founderEquity', operation: 'add', value: -0.02 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 21. Quarterly Planning ────────────────────────────────────────────
  {
    id: 'routine-quarterly-planning',
    title: 'Quarterly Planning',
    category: 'product',
    minWeek: 12,
    maxOccurrences: 0,
    cooldownWeeks: 12,
    weight: 4,
    condition: (state) => state.team.employees.length >= 2,
    descriptions: {
      default: 'Time for quarterly planning. The team needs strategic alignment.',
      realistic:
        'Q-planning kickoff: time to set OKRs, prioritize the backlog, and align the team on the next quarter\'s goals.',
      satirical:
        'It\'s OKR season. Everyone will spend a week writing objectives that sound important ("Revolutionize the paradigm of AI-first synergy") and then completely ignore them by week 3.',
      mixed:
        'Quarterly planning: where you spend 3 days in a conference room deciding what to build, then pivot 2 weeks later anyway. But the process matters. Probably.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'growth-focus',
        label: 'Focus on Growth',
        description: 'Prioritize new features and customer acquisition.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
          { path: 'company.culture.innovation', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'quality-focus',
        label: 'Focus on Quality',
        description: 'Pay down tech debt and improve stability.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: -5 },
          { path: 'product.overallQuality', operation: 'add', value: 4 },
          { path: 'product.bugs', operation: 'add', value: -2 },
        ],
      },
      {
        id: 'balanced',
        label: 'Balanced Approach',
        description: 'A little of everything. Jack of all trades.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 1 },
          { path: 'product.techDebtTotal', operation: 'add', value: -2 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 22. Team Happy Hour ───────────────────────────────────────────────
  {
    id: 'routine-team-happy-hour',
    title: 'Team Happy Hour',
    category: 'culture',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 4,
    weight: 5,
    condition: (state) => state.team.employees.length >= 3,
    descriptions: {
      default: 'The team wants to organize a Friday happy hour.',
      realistic:
        'It\'s been a productive week. The team is proposing a happy hour at the bar down the street to celebrate.',
      satirical:
        'Happy hour proposal: "light drinks and networking." Reality: someone will overshare about their startup idea, someone else will cry about their ex, and someone will expense $200 in cocktails. Team building!',
      mixed:
        'Friday happy hour on the agenda. Half the team is excited, the other half would rather have the money as a DoorDash credit. The eternal startup debate.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'fund-happy-hour',
        label: 'Company-Funded Happy Hour',
        description: 'Open tab. $60 per person. Good times.',
        effects: [
          { path: 'finances.cash', operation: 'add', value: -600 },
          { path: 'team.avgMorale', operation: 'add', value: 7 },
          { path: 'company.culture.collaboration', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'casual-drinks',
        label: 'Casual BYOB in the Office',
        description: 'Low-key. Someone brings a six-pack.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: 3 },
          { path: 'company.culture.collaboration', operation: 'add', value: 1 },
        ],
      },
      {
        id: 'skip-happy-hour',
        label: 'Not This Week',
        description: 'Too much going on. Rain check.',
        effects: [
          { path: 'team.avgMorale', operation: 'add', value: -1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 23. CI/CD Pipeline Failed ─────────────────────────────────────────
  {
    id: 'routine-cicd-pipeline-failed',
    title: 'CI/CD Pipeline Failed',
    category: 'product',
    minWeek: 3,
    maxOccurrences: 0,
    cooldownWeeks: 3,
    weight: 6,
    condition: (state) =>
      state.team.employees.some((e) => e.role === 'engineer' || e.role === 'senior-engineer' || e.role === 'devops'),
    descriptions: {
      default: 'The CI/CD pipeline is broken. No one can deploy.',
      realistic:
        'Build pipeline failure: a dependency update broke the CI. All merges are blocked until it\'s resolved.',
      satirical:
        'CI/CD is down. The last person to push is being tried in the court of Slack opinion. Turns out someone committed a node_modules folder. Again. Deploys are blocked. Chaos reigns.',
      mixed:
        'Pipeline broken. Everyone\'s PR is blocked. The DevOps engineer is "looking into it" which means they\'re furiously Googling the error message while pretending to know what\'s happening.',
    },
    immediateEffects: [
      { path: 'product.techDebtTotal', operation: 'add', value: 2 },
      { path: 'team.avgMorale', operation: 'add', value: -2 },
    ],
    decisionOptions: [
      {
        id: 'fix-properly',
        label: 'Fix It Properly',
        description: 'Dedicate an engineer to fix the root cause.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: -4 },
          { path: 'product.overallQuality', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'quick-patch',
        label: 'Quick Patch',
        description: 'Band-aid fix. Gets deploys working but doesn\'t address root cause.',
        effects: [
          { path: 'product.techDebtTotal', operation: 'add', value: 2 },
          { path: 'team.avgMorale', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 1,
  },

  // ─── 24. Documentation Sprint ──────────────────────────────────────────
  {
    id: 'routine-documentation-sprint',
    title: 'Documentation Sprint',
    category: 'product',
    minWeek: 6,
    maxOccurrences: 0,
    cooldownWeeks: 10,
    weight: 3,
    condition: (state) =>
      state.product.features.filter((f) => f.status === 'shipped').length >= 2,
    descriptions: {
      default: 'Your product documentation is severely outdated. Time to update it.',
      realistic:
        'Customer support tickets are piling up because the docs are outdated. The API reference still shows v1 endpoints. A documentation sprint would reduce support load.',
      satirical:
        'Your documentation was last updated in a previous geological era. The README still says "Coming Soon" for features you shipped 6 months ago. A customer just asked if your product actually exists.',
      mixed:
        'Docs are a disaster. Half the pages reference features that don\'t exist anymore. The other half are "TODO: write this." Your support team is doing the Lord\'s work.',
    },
    immediateEffects: [],
    decisionOptions: [
      {
        id: 'full-sprint',
        label: 'Full Documentation Sprint',
        description: 'Dedicate a week to docs. Thorough but delays features.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 5 },
          { path: 'product.pmfScore', operation: 'add', value: 2 },
          { path: 'product.customers', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'ai-generate',
        label: 'Use AI to Generate Docs',
        description: 'Fast and cheap. Quality is... variable.',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: 2 },
          { path: 'company.culture.aiFirst', operation: 'add', value: 2 },
        ],
      },
      {
        id: 'skip-docs',
        label: 'Defer to Next Quarter',
        description: 'Features first. Docs can wait. (They always say this.)',
        effects: [
          { path: 'product.overallQuality', operation: 'add', value: -1 },
          { path: 'product.customers', operation: 'add', value: -1 },
        ],
        tone: 'satirical',
      },
    ],
    decisionDeadlineWeeks: 2,
  },

  // ─── 25. New Competitor Detected ───────────────────────────────────────
  {
    id: 'routine-new-competitor-detected',
    title: 'New Competitor Detected',
    category: 'competitor',
    minWeek: 4,
    maxOccurrences: 0,
    cooldownWeeks: 6,
    weight: 5,
    condition: (state) => state.market.competitors.length > 0,
    descriptions: {
      default: 'A new startup just entered your market space.',
      realistic:
        'A YC-backed startup just launched a product eerily similar to yours. They have $3M in funding and are pricing aggressively.',
      satirical:
        'Another AI startup just launched with the exact same product as yours, but their landing page has better gradients. They\'re already on TechCrunch. Their founder has more Twitter followers than you have customers.',
      mixed:
        'New competitor alert. They launched yesterday with a Product Hunt campaign that got 1,200 upvotes. Their product is a worse version of yours, but their marketing is annoyingly good.',
    },
    immediateEffects: [
      { path: 'market.bubbleIndex', operation: 'add', value: 1 },
    ],
    decisionOptions: [
      {
        id: 'accelerate',
        label: 'Accelerate Roadmap',
        description: 'Ship faster to stay ahead. More pressure on team.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 2 },
          { path: 'team.avgMorale', operation: 'add', value: -3 },
          { path: 'product.techDebtTotal', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'differentiate',
        label: 'Double Down on Differentiation',
        description: 'Focus on what makes you unique. Longer-term play.',
        effects: [
          { path: 'product.pmfScore', operation: 'add', value: 3 },
          { path: 'company.culture.innovation', operation: 'add', value: 3 },
        ],
      },
      {
        id: 'ignore-competitor',
        label: 'Ignore Them',
        description: 'Stay focused on your customers, not competitors.',
        effects: [
          { path: 'founder.bizSkill', operation: 'add', value: 1 },
        ],
      },
    ],
    decisionDeadlineWeeks: 2,
  },
];
