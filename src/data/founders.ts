import type { FounderArchetype, FounderProfile } from '../types/index.ts';

export interface FounderConfig {
  archetype: FounderArchetype;
  startingCash: number;
  baseProfile: Omit<FounderProfile, 'name'>;
}

/**
 * Base founder configurations keyed by archetype.
 */
export const FOUNDER_CONFIGS: Record<FounderArchetype, FounderConfig> = {
  technical: {
    archetype: 'technical',
    startingCash: 50_000,
    baseProfile: {
      archetype: 'technical',
      techSkill: 85,
      bizSkill: 30,
      network: 25,
      reputation: 40,
      learning: 70,
    },
  },
  visionary: {
    archetype: 'visionary',
    startingCash: 100_000,
    baseProfile: {
      archetype: 'visionary',
      techSkill: 25,
      bizSkill: 85,
      network: 60,
      reputation: 55,
      learning: 65,
    },
  },
  balanced: {
    archetype: 'balanced',
    startingCash: 75_000,
    baseProfile: {
      archetype: 'balanced',
      techSkill: 55,
      bizSkill: 55,
      network: 45,
      reputation: 45,
      learning: 75,
    },
  },
  bigtech: {
    archetype: 'bigtech',
    startingCash: 150_000,
    baseProfile: {
      archetype: 'bigtech',
      techSkill: 70,
      bizSkill: 50,
      network: 70,
      reputation: 65,
      learning: 55,
    },
  },
  academic: {
    archetype: 'academic',
    startingCash: 30_000,
    baseProfile: {
      archetype: 'academic',
      techSkill: 90,
      bizSkill: 15,
      network: 35,
      reputation: 50,
      learning: 90,
    },
  },
};

// ─── Display info for the new game / character select screen ──────────

export interface FounderDisplayInfo {
  archetype: FounderArchetype;
  displayName: string;
  tagline: string;
  description: string;
  startingCash: number;
  specialAbility: string;
  stats: {
    techSkill: number;
    bizSkill: number;
    network: number;
    reputation: number;
    learning: number;
  };
}

export const FOUNDER_DISPLAY: FounderDisplayInfo[] = [
  {
    archetype: 'technical',
    displayName: 'Technical Founder',
    tagline: 'The Hacker',
    description:
      'Deep technical background from years of open-source contributions and side projects. You can build an MVP in a weekend, but pitching to investors makes you break out in hives. Your GitHub profile is your resume.',
    startingCash: 50_000,
    specialAbility:
      'Can code features yourself in early weeks. Cheaper AI agent setup costs.',
    stats: {
      techSkill: 85,
      bizSkill: 30,
      network: 25,
      reputation: 40,
      learning: 70,
    },
  },
  {
    archetype: 'visionary',
    displayName: 'Visionary',
    tagline: 'The Hustler',
    description:
      'MBA or business background with a gift for selling the dream. You can convince anyone that your napkin sketch is the next billion-dollar company. What you lack in code, you make up for in charisma and pitch decks.',
    startingCash: 100_000,
    specialAbility:
      'Better fundraising odds. Negotiation discounts on hiring.',
    stats: {
      techSkill: 25,
      bizSkill: 85,
      network: 60,
      reputation: 55,
      learning: 65,
    },
  },
  {
    archetype: 'balanced',
    displayName: 'Balanced',
    tagline: 'The Generalist',
    description:
      'Jack of all trades, master of none. You can hold your own in a technical discussion and close a deal at a networking event. Not the best at anything, but you adapt faster than anyone else in the room.',
    startingCash: 75_000,
    specialAbility: 'Fastest skill growth. Adapts to any situation.',
    stats: {
      techSkill: 55,
      bizSkill: 55,
      network: 45,
      reputation: 45,
      learning: 75,
    },
  },
  {
    archetype: 'bigtech',
    displayName: 'Ex-BigTech',
    tagline: 'The Corporate Refugee',
    description:
      'After years climbing the ladder at a FAANG company, you finally snapped during your third reorg in eighteen months. You left with savings, a fat network of ex-colleagues, and an unshakable belief that you can do it better.',
    startingCash: 150_000,
    specialAbility:
      'Start with 2 senior engineers. Industry connections for partnerships.',
    stats: {
      techSkill: 70,
      bizSkill: 50,
      network: 70,
      reputation: 65,
      learning: 55,
    },
  },
  {
    archetype: 'academic',
    displayName: 'Academic',
    tagline: 'The Researcher',
    description:
      'Published AI researcher who decided the real-world impact of another paper was approximately zero. You understand transformers at the mathematical level, but you have never talked to a customer in your life.',
    startingCash: 30_000,
    specialAbility:
      'Research breakthroughs give product quality bonuses. YC application bonus.',
    stats: {
      techSkill: 90,
      bizSkill: 15,
      network: 35,
      reputation: 50,
      learning: 90,
    },
  },
];
