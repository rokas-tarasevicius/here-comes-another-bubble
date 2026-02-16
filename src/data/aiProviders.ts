import type { AIAgentType } from '../types/index.ts';

export interface AIProviderConfig {
  id: string;
  name: string;
  agentTypes: AIAgentType[];
  baseCostPerWeek: number;
  baseCapability: number;   // 0-100
  baseReliability: number;  // 0-100
  description: string;
}

/**
 * AI model providers — the companies whose APIs power your AI agents.
 * Thinly veiled versions of real companies. Choose wisely: cost, capability,
 * and reliability vary wildly.
 */
export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'anthropos',
    name: 'Anthropos',
    agentTypes: ['coding', 'general', 'analytics', 'support'],
    baseCostPerWeek: 2_500,
    baseCapability: 92,
    baseReliability: 96,
    description:
      'Premium AI with the highest reliability in the industry. Their models rarely hallucinate and follow instructions precisely. Expensive, but your engineers will thank you when the code agent stops making things up at 3am.',
  },
  {
    id: 'openmind',
    name: 'OpenMind',
    agentTypes: ['coding', 'design', 'marketing', 'analytics', 'support', 'general'],
    baseCostPerWeek: 1_800,
    baseCapability: 88,
    baseReliability: 85,
    description:
      'The most popular AI provider. Good at everything, great at nothing in particular. Solid developer ecosystem and extensive documentation. The safe default choice — nobody ever got fired for picking OpenMind.',
  },
  {
    id: 'deepbrain',
    name: 'DeepBrain',
    agentTypes: ['coding', 'analytics', 'general'],
    baseCostPerWeek: 1_500,
    baseCapability: 95,
    baseReliability: 72,
    description:
      'Cutting-edge capability that occasionally produces jaw-dropping results — and occasionally produces jaw-dropping nonsense. When it works, it is the best in the world. When it does not, your production database might learn the hard way.',
  },
  {
    id: 'googolplex',
    name: 'Googolplex AI',
    agentTypes: ['coding', 'analytics', 'support', 'general'],
    baseCostPerWeek: 2_200,
    baseCapability: 86,
    baseReliability: 92,
    description:
      'Enterprise-focused with deep integrations into cloud infrastructure. Stable and well-supported but their pricing page requires a PhD to understand. Great for companies that already live in the Googolplex ecosystem.',
  },
  {
    id: 'meta-ai-labs',
    name: 'Meta AI Labs',
    agentTypes: ['coding', 'design', 'marketing', 'general'],
    baseCostPerWeek: 800,
    baseCapability: 78,
    baseReliability: 70,
    description:
      'Open-source based models that you can self-host for cheap. Variable quality — some tasks are surprisingly good, others require extensive prompt engineering. Perfect for bootstrapped founders watching every dollar.',
  },
  {
    id: 'mistique',
    name: 'Mistique',
    agentTypes: ['coding', 'marketing', 'support', 'general'],
    baseCostPerWeek: 1_200,
    baseCapability: 82,
    baseReliability: 84,
    description:
      'European AI provider with excellent price-to-performance ratio and strong data privacy compliance. Limited capabilities compared to the top tier, but GDPR-friendly and surprisingly good at multilingual tasks.',
  },
];
