import { useState } from 'react';
import type { CompanyStage, FundingRound, PricingModel } from '../../types/game.ts';
import type { SeekFundingDecision, SetPricingDecision } from '../../types/decisions.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';

export interface FundraisingPanelProps {
  stage: CompanyStage;
  founderEquity: number;
  fundingHistory: FundingRound[];
  pricingModel: PricingModel;
  pricePerUnit: number;
  onSeekFunding: (decision: SeekFundingDecision) => void;
  onChangePricing: (decision: SetPricingDecision) => void;
}

const STAGE_LABELS: Record<CompanyStage, string> = {
  garage: 'Garage',
  'pre-seed': 'Pre-Seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  growth: 'Growth',
  public: 'Public',
  dead: 'Dead',
};

const NEXT_FUNDING_STAGE: Partial<Record<CompanyStage, string>> = {
  garage: 'pre-seed',
  'pre-seed': 'seed',
  seed: 'series-a',
  'series-a': 'series-b',
  'series-b': 'series-c',
  'series-c': 'ipo',
  growth: 'ipo',
};

const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'usage-based', label: 'Usage-Based' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'one-time', label: 'One-Time' },
];

/**
 * Fundraising panel showing company stage, equity, funding history,
 * and controls for seeking funding and changing pricing.
 */
export function FundraisingPanel({
  stage,
  founderEquity,
  fundingHistory,
  pricingModel,
  pricePerUnit,
  onSeekFunding,
  onChangePricing,
}: FundraisingPanelProps) {
  const [selectedModel, setSelectedModel] = useState<PricingModel>(pricingModel);
  const [priceInput, setPriceInput] = useState<string>(String(pricePerUnit));

  const equityPercent = founderEquity * 100;
  const dilutionPercent = (1 - founderEquity) * 100;
  const nextStage = NEXT_FUNDING_STAGE[stage];

  function handleSeekFunding() {
    if (!nextStage) return;
    onSeekFunding({ type: 'seek-funding', targetStage: nextStage });
  }

  function handleChangePricing() {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) return;
    onChangePricing({ type: 'set-pricing', model: selectedModel, pricePerUnit: price });
  }

  return (
    <div className="space-y-4">
      {/* Stage & Equity */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
          Fundraising
        </h3>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-300">Company Stage</span>
          <span className="rounded-full bg-gray-800 px-3 py-1 text-sm font-semibold text-emerald-400">
            {STAGE_LABELS[stage]}
          </span>
        </div>

        {/* Founder Equity Bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-gray-300">Founder Equity</span>
            <span className="text-sm font-mono font-semibold text-emerald-400">
              {formatPercent(equityPercent)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${equityPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formatPercent(dilutionPercent)} diluted to investors
          </p>
        </div>

        {/* Seek Funding Button */}
        {nextStage && stage !== 'dead' && stage !== 'public' && (
          <button
            onClick={handleSeekFunding}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Seek Funding ({nextStage.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())})
          </button>
        )}
      </div>

      {/* Funding History Table */}
      {fundingHistory.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
            Funding History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-3">Stage</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">Valuation</th>
                  <th className="pb-2 pr-3">Investor</th>
                  <th className="pb-2">Week</th>
                </tr>
              </thead>
              <tbody>
                {fundingHistory.map((round, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 pr-3 font-medium text-gray-300">
                      {round.stage.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="py-2 pr-3 font-mono text-emerald-400">
                      {formatCurrency(round.amount)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-gray-300">
                      {formatCurrency(round.valuation)}
                    </td>
                    <td className="py-2 pr-3 text-gray-400">{round.investorName}</td>
                    <td className="py-2 text-gray-500">{round.weekClosed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
          Pricing
        </h3>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">Current Model</span>
          <span className="rounded-full bg-gray-800 px-3 py-1 text-sm font-semibold text-blue-400">
            {PRICING_MODELS.find((m) => m.value === pricingModel)?.label ?? pricingModel}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">Price per Unit</span>
          <span className="text-sm font-mono font-semibold text-blue-400">
            {formatCurrency(pricePerUnit)}
          </span>
        </div>

        {/* Change Pricing Controls */}
        <div className="space-y-2 border-t border-gray-800 pt-3">
          <label className="block text-xs text-gray-500">Change Pricing Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as PricingModel)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            {PRICING_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>

          <label className="block text-xs text-gray-500">Price per Unit ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          />

          <button
            onClick={handleChangePricing}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Update Pricing
          </button>
        </div>
      </div>
    </div>
  );
}
