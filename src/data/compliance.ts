import type { CertificationId, Difficulty, MarketSegment, PricingTier } from '../types/index.ts';

// ─── Certification Definitions ────────────────────────────────────────

export interface CertificationDef {
  id: CertificationId;
  name: string;
  description: string;
  initCost: number;
  weeklyCost: number;
  baseDuration: number;
  minDuration: number;
  prerequisites: CertificationId[];
  flavorText: string;
}

export const CERTIFICATION_DEFS: Record<CertificationId, CertificationDef> = {
  'gdpr': {
    id: 'gdpr',
    name: 'GDPR Compliance',
    description: 'EU data protection regulation. Required for EU market access.',
    initCost: 15_000,
    weeklyCost: 1_500,
    baseDuration: 8,
    minDuration: 5,
    prerequisites: [],
    flavorText: 'Because "we take your privacy seriously" needs to actually mean something.',
  },
  'ai-safety-audit': {
    id: 'ai-safety-audit',
    name: 'AI Safety Audit',
    description: 'Independent review of AI model safety, bias, and fairness practices.',
    initCost: 20_000,
    weeklyCost: 1_500,
    baseDuration: 8,
    minDuration: 5,
    prerequisites: [],
    flavorText: 'Prove your AI won\'t go rogue. Skynet jokes not included.',
  },
  'soc2-type1': {
    id: 'soc2-type1',
    name: 'SOC 2 Type I',
    description: 'Service Organization Control report — security controls design audit.',
    initCost: 25_000,
    weeklyCost: 2_000,
    baseDuration: 10,
    minDuration: 6,
    prerequisites: [],
    flavorText: 'The "we designed good security" certificate. Type II proves you actually use it.',
  },
  'pci-dss': {
    id: 'pci-dss',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard. Required for fintech.',
    initCost: 35_000,
    weeklyCost: 2_500,
    baseDuration: 12,
    minDuration: 7,
    prerequisites: [],
    flavorText: 'So you can touch credit card numbers without the banks having a panic attack.',
  },
  'iso-27001': {
    id: 'iso-27001',
    name: 'ISO 27001',
    description: 'International information security management standard.',
    initCost: 40_000,
    weeklyCost: 2_500,
    baseDuration: 14,
    minDuration: 8,
    prerequisites: [],
    flavorText: 'The gold standard of "we have a security policy and it\'s more than a Google Doc".',
  },
  'soc2-type2': {
    id: 'soc2-type2',
    name: 'SOC 2 Type II',
    description: 'Extended SOC 2 audit proving controls are operational over time.',
    initCost: 50_000,
    weeklyCost: 3_000,
    baseDuration: 16,
    minDuration: 10,
    prerequisites: ['soc2-type1'],
    flavorText: 'Now prove you didn\'t just set up security for the auditor\'s visit.',
  },
  'hipaa': {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act compliance.',
    initCost: 60_000,
    weeklyCost: 4_000,
    baseDuration: 16,
    minDuration: 10,
    prerequisites: ['soc2-type1'],
    flavorText: 'Healthcare data is sacred. Also, prepare for the most tedious audits of your life.',
  },
  'fedramp': {
    id: 'fedramp',
    name: 'FedRAMP',
    description: 'Federal Risk and Authorization Management Program for government contracts.',
    initCost: 200_000,
    weeklyCost: 8_000,
    baseDuration: 24,
    minDuration: 16,
    prerequisites: ['soc2-type2', 'iso-27001'],
    flavorText: 'The final boss of compliance. Welcome to government procurement.',
  },
};

// ─── Pricing Tier Definitions ─────────────────────────────────────────

export interface PricingTierDef {
  tier: PricingTier;
  name: string;
  priceMultiplierMin: number;
  priceMultiplierMax: number;
  requiredEngineers: number;
  requiredShippedFeatures: number;
  requiredQuality: number;
  requiredCerts: CertificationId[];
  segmentSpecificCerts?: Partial<Record<MarketSegment, CertificationId[]>>;
}

export const PRICING_TIERS: PricingTierDef[] = [
  {
    tier: 1,
    name: 'Starter',
    priceMultiplierMin: 0.5,
    priceMultiplierMax: 2,
    requiredEngineers: 0,
    requiredShippedFeatures: 0,
    requiredQuality: 0,
    requiredCerts: [],
  },
  {
    tier: 2,
    name: 'Growth',
    priceMultiplierMin: 2,
    priceMultiplierMax: 10,
    requiredEngineers: 3,
    requiredShippedFeatures: 2,
    requiredQuality: 30,
    requiredCerts: [],
  },
  {
    tier: 3,
    name: 'Professional',
    priceMultiplierMin: 10,
    priceMultiplierMax: 100,
    requiredEngineers: 6,
    requiredShippedFeatures: 5,
    requiredQuality: 50,
    requiredCerts: ['soc2-type1'], // OR iso-27001 — checked in helper
  },
  {
    tier: 4,
    name: 'Enterprise',
    priceMultiplierMin: 100,
    priceMultiplierMax: 500,
    requiredEngineers: 12,
    requiredShippedFeatures: 8,
    requiredQuality: 65,
    requiredCerts: ['soc2-type2'],
    segmentSpecificCerts: {
      'ai-healthcare': ['hipaa'],
      'ai-fintech': ['pci-dss'],
    },
  },
  {
    tier: 5,
    name: 'Regulated',
    priceMultiplierMin: 500,
    priceMultiplierMax: 5000,
    requiredEngineers: 20,
    requiredShippedFeatures: 12,
    requiredQuality: 80,
    requiredCerts: ['fedramp', 'soc2-type2'],
  },
];

// ─── Difficulty Scaling ───────────────────────────────────────────────

const CERT_DIFFICULTY_SCALING: Record<Difficulty, { costMult: number; durationMult: number }> = {
  easy: { costMult: 0.8, durationMult: 0.8 },
  normal: { costMult: 1.0, durationMult: 1.0 },
  hard: { costMult: 1.2, durationMult: 1.2 },
  nightmare: { costMult: 1.5, durationMult: 1.4 },
};

const TIER_DIFFICULTY_SCALING: Record<Difficulty, { teamSizeMult: number; qualityOffset: number }> = {
  easy: { teamSizeMult: 0.75, qualityOffset: -10 },
  normal: { teamSizeMult: 1.0, qualityOffset: 0 },
  hard: { teamSizeMult: 1.25, qualityOffset: 5 },
  nightmare: { teamSizeMult: 1.5, qualityOffset: 10 },
};

// ─── Helper Functions ─────────────────────────────────────────────────

export function getScaledCertCost(cert: CertificationDef, difficulty: Difficulty): {
  initCost: number;
  weeklyCost: number;
  baseDuration: number;
  minDuration: number;
} {
  const scale = CERT_DIFFICULTY_SCALING[difficulty];
  return {
    initCost: Math.round(cert.initCost * scale.costMult),
    weeklyCost: Math.round(cert.weeklyCost * scale.costMult),
    baseDuration: Math.round(cert.baseDuration * scale.durationMult),
    minDuration: Math.round(cert.minDuration * scale.durationMult),
  };
}

export function getScaledTierRequirements(tierDef: PricingTierDef, difficulty: Difficulty): {
  requiredEngineers: number;
  requiredQuality: number;
} {
  const scale = TIER_DIFFICULTY_SCALING[difficulty];
  return {
    requiredEngineers: Math.max(1, Math.round(tierDef.requiredEngineers * scale.teamSizeMult)),
    requiredQuality: Math.max(0, tierDef.requiredQuality + scale.qualityOffset),
  };
}

export function getAvailableCertifications(completedIds: CertificationId[]): CertificationId[] {
  const available: CertificationId[] = [];
  for (const [id, def] of Object.entries(CERTIFICATION_DEFS)) {
    if (completedIds.includes(id as CertificationId)) continue;
    const prereqsMet = def.prerequisites.every((p) => completedIds.includes(p));
    if (prereqsMet) {
      available.push(id as CertificationId);
    }
  }
  return available;
}

/**
 * Check if a tier's certification requirements are met.
 * Tier 3 accepts SOC 2 Type I OR ISO 27001.
 */
export function checkTierCertsRequirement(
  tierDef: PricingTierDef,
  completedCertIds: CertificationId[],
  segment: MarketSegment,
): boolean {
  // Tier 3 special case: SOC 2 Type I OR ISO 27001
  if (tierDef.tier === 3) {
    return completedCertIds.includes('soc2-type1') || completedCertIds.includes('iso-27001');
  }

  // Check base required certs
  const baseOk = tierDef.requiredCerts.every((c) => completedCertIds.includes(c));
  if (!baseOk) return false;

  // Check segment-specific certs
  if (tierDef.segmentSpecificCerts) {
    const segCerts = tierDef.segmentSpecificCerts[segment];
    if (segCerts) {
      return segCerts.every((c) => completedCertIds.includes(c));
    }
  }

  return true;
}
