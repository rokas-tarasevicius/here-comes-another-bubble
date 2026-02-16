import type { MarketSegment, MarketSegmentData } from '../types/index.ts';

/**
 * Placeholder market segment data — will be expanded later.
 */
export const MARKET_SEGMENTS: Record<MarketSegment, MarketSegmentData> = {
  'ai-devtools': {
    id: 'ai-devtools',
    name: 'AI Developer Tools',
    size: 50_000,
    growthRate: 0.20,
    competitionIntensity: 75,
    regulatoryRisk: 15,
    customerDemand: ['code-generation', 'debugging', 'testing', 'ci-cd'],
  },
  'ai-healthcare': {
    id: 'ai-healthcare',
    name: 'AI Healthcare',
    size: 30_000,
    growthRate: 0.15,
    competitionIntensity: 50,
    regulatoryRisk: 85,
    customerDemand: ['diagnostics', 'patient-records', 'drug-discovery'],
  },
  'ai-fintech': {
    id: 'ai-fintech',
    name: 'AI Fintech',
    size: 40_000,
    growthRate: 0.18,
    competitionIntensity: 70,
    regulatoryRisk: 75,
    customerDemand: ['fraud-detection', 'underwriting', 'trading-signals'],
  },
  'ai-education': {
    id: 'ai-education',
    name: 'AI Education',
    size: 25_000,
    growthRate: 0.12,
    competitionIntensity: 40,
    regulatoryRisk: 30,
    customerDemand: ['tutoring', 'content-generation', 'assessment'],
  },
  'ai-enterprise': {
    id: 'ai-enterprise',
    name: 'AI Enterprise',
    size: 80_000,
    growthRate: 0.22,
    competitionIntensity: 80,
    regulatoryRisk: 40,
    customerDemand: ['automation', 'analytics', 'document-processing'],
  },
  'ai-consumer': {
    id: 'ai-consumer',
    name: 'AI Consumer',
    size: 100_000,
    growthRate: 0.25,
    competitionIntensity: 90,
    regulatoryRisk: 25,
    customerDemand: ['chatbot', 'image-generation', 'personal-assistant'],
  },
  'ai-creative': {
    id: 'ai-creative',
    name: 'AI Creative Tools',
    size: 35_000,
    growthRate: 0.30,
    competitionIntensity: 65,
    regulatoryRisk: 35,
    customerDemand: ['image-generation', 'video-generation', 'music-generation', 'copywriting'],
  },
};
