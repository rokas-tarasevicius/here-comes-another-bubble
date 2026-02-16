import type { FounderArchetype, FounderProfile } from '../types/index.ts';

export interface FounderConfig {
  archetype: FounderArchetype;
  baseProfile: Omit<FounderProfile, 'name'>;
}

/**
 * Placeholder founder configurations — will be expanded later.
 */
export const FOUNDER_CONFIGS: Record<FounderArchetype, FounderConfig> = {
  technical: {
    archetype: 'technical',
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
