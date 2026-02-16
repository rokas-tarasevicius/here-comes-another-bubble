import type { Competitor, MarketSegment } from '../types/index.ts';

/**
 * Placeholder competitors per segment — will be expanded later.
 */
export const COMPETITORS_BY_SEGMENT: Record<MarketSegment, Competitor[]> = {
  'ai-devtools': [
    {
      id: 'comp-cursor',
      name: 'CursorAI',
      segment: 'ai-devtools',
      funding: 400_000_000,
      teamSize: 80,
      productQuality: 82,
      marketShare: 0.15,
      strategy: 'product-led-growth',
      alive: true,
    },
  ],
  'ai-healthcare': [
    {
      id: 'comp-medai',
      name: 'MedAI Labs',
      segment: 'ai-healthcare',
      funding: 200_000_000,
      teamSize: 120,
      productQuality: 70,
      marketShare: 0.10,
      strategy: 'enterprise-sales',
      alive: true,
    },
  ],
  'ai-fintech': [
    {
      id: 'comp-finbrain',
      name: 'FinBrain',
      segment: 'ai-fintech',
      funding: 150_000_000,
      teamSize: 60,
      productQuality: 75,
      marketShare: 0.08,
      strategy: 'enterprise-sales',
      alive: true,
    },
  ],
  'ai-education': [
    {
      id: 'comp-learnbot',
      name: 'LearnBot',
      segment: 'ai-education',
      funding: 50_000_000,
      teamSize: 30,
      productQuality: 65,
      marketShare: 0.12,
      strategy: 'product-led-growth',
      alive: true,
    },
  ],
  'ai-enterprise': [
    {
      id: 'comp-automate',
      name: 'AutomateHQ',
      segment: 'ai-enterprise',
      funding: 500_000_000,
      teamSize: 200,
      productQuality: 78,
      marketShare: 0.20,
      strategy: 'enterprise-sales',
      alive: true,
    },
  ],
  'ai-consumer': [
    {
      id: 'comp-chatpal',
      name: 'ChatPal',
      segment: 'ai-consumer',
      funding: 300_000_000,
      teamSize: 100,
      productQuality: 80,
      marketShare: 0.18,
      strategy: 'viral-growth',
      alive: true,
    },
  ],
  'ai-creative': [
    {
      id: 'comp-artigen',
      name: 'ArtiGen',
      segment: 'ai-creative',
      funding: 250_000_000,
      teamSize: 70,
      productQuality: 85,
      marketShare: 0.22,
      strategy: 'product-led-growth',
      alive: true,
    },
  ],
};
