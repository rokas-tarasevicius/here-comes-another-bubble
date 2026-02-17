import { useState } from 'react';
import type { CompanyStage, FundingRound, PricingModel } from '../../types/game.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';

export interface FundraisingPanelProps {
  stage: CompanyStage;
  founderEquity: number;
  fundingHistory: FundingRound[];
  pricingModel: PricingModel;
  pricePerUnit: number;
  lastPricingChangeWeek: number;
  currentWeek: number;
  onSeekFunding: (targetStage: string) => void;
  onChangePricing: (model: PricingModel, price: number) => void;
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
  lastPricingChangeWeek,
  currentWeek,
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
    onSeekFunding(nextStage);
  }

  function handleChangePricing() {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) return;
    onChangePricing(selectedModel, price);
  }

  return (
    <div className="space-y-4">
      {/* Stage & Equity */}
      <div className="retro-card">
        <h3 className="retro-section-heading">
          Fundraising
        </h3>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[--color-retro-text]">Company Stage</span>
          <span className="retro-badge retro-badge-green">
            {STAGE_LABELS[stage]}
          </span>
        </div>

        {/* Founder Equity Bar */}
        <div className="retro-inset mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-[--color-retro-text]">Founder Equity</span>
            <span className="text-sm font-[--font-retro-mono] font-bold text-[--color-retro-green]">
              {formatPercent(equityPercent)}
            </span>
          </div>
          <div className="retro-progress">
            <div
              className="retro-progress-bar retro-progress-bar-green"
              style={{ width: `${equityPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            {formatPercent(dilutionPercent)} diluted to investors
          </p>
        </div>

        {/* Seek Funding Button */}
        {nextStage && stage !== 'dead' && stage !== 'public' && (
          <button
            onClick={handleSeekFunding}
            className="btn-glossy btn-green w-full"
          >
            Seek Funding ({nextStage.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())})
          </button>
        )}
      </div>

      {/* Funding History Table */}
      {fundingHistory.length > 0 && (
        <div className="retro-card" style={{ padding: 0 }}>
          <h3 className="retro-section-heading" style={{ margin: '16px 16px 12px' }}>
            Funding History
          </h3>
          <div className="overflow-x-auto">
            <table className="retro-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Valuation</th>
                  <th>Investor</th>
                  <th>Week</th>
                </tr>
              </thead>
              <tbody>
                {fundingHistory.map((round, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-[--color-retro-text]">
                      {round.stage.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="font-[--font-retro-mono] text-[--color-retro-green] font-semibold">
                      {formatCurrency(round.amount)}
                    </td>
                    <td className="font-[--font-retro-mono] text-[--color-retro-text]">
                      {formatCurrency(round.valuation)}
                    </td>
                    <td className="text-[--color-retro-text-muted]">{round.investorName}</td>
                    <td className="text-[--color-retro-text-light]">{round.weekClosed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="retro-card">
        <h3 className="retro-section-heading">
          Pricing
        </h3>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[--color-retro-text]">Current Model</span>
          <span className="retro-badge retro-badge-blue">
            {PRICING_MODELS.find((m) => m.value === pricingModel)?.label ?? pricingModel}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[--color-retro-text]">Price per Unit</span>
          <span className="text-sm font-[--font-retro-mono] font-bold text-[--color-retro-blue]">
            {formatCurrency(pricePerUnit)}
          </span>
        </div>

        {/* Change Pricing Controls */}
        <div className="retro-hr" />
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-[--color-retro-text-muted]">Change Pricing Model</label>
          {lastPricingChangeWeek > 0 && (currentWeek - lastPricingChangeWeek) < 8 && selectedModel !== pricingModel && (
            <p className="text-xs text-[--color-retro-orange]">
              Cooldown: {8 - (currentWeek - lastPricingChangeWeek)} weeks until you can switch models
            </p>
          )}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as PricingModel)}
            className="retro-input w-full"
          >
            {PRICING_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>

          <label className="block text-xs font-bold text-[--color-retro-text-muted]">Price per Unit ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="retro-input w-full"
          />

          <button
            onClick={handleChangePricing}
            className="btn-glossy btn-primary w-full"
          >
            Update Pricing
          </button>
        </div>
      </div>
    </div>
  );
}
