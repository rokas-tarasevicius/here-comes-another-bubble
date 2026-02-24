import { useState } from 'react';
import type { CompanyStage, FundingRound, PricingModel, PricingTier } from '../../types/game.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
import { InfoTip } from './InfoTip.tsx';
import { PRICING_TIERS, getScaledTierRequirements, checkTierCertsRequirement, CERTIFICATION_DEFS } from '../../data/compliance.ts';
import type { CertificationId, Difficulty, MarketSegment } from '../../types/game.ts';

export interface FundraisingPanelProps {
  stage: CompanyStage;
  founderEquity: number;
  fundingHistory: FundingRound[];
  pricingModel: PricingModel;
  pricePerUnit: number;
  lastPricingChangeWeek: number;
  currentWeek: number;
  fundingSoughtThisWeek?: boolean;
  investorSentiment: number;
  raiseChance: number;
  growthMomentum: number;
  onSeekFunding: (targetStage: string) => void;
  onChangePricing: (model: PricingModel, price: number) => void;
  currentTier: PricingTier;
  maxPrice: number;
  minPrice: number;
  engineers: number;
  shippedFeatures: number;
  quality: number;
  completedCertIds: CertificationId[];
  difficulty: Difficulty;
  segment: MarketSegment;
}

const STAGE_LABELS: Record<CompanyStage, string> = {
  garage: 'Garage',
  'pre-seed': 'Pre-Seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  'series-d': 'Series D',
  'series-e': 'Series E',
  'series-f': 'Series F',
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
  'series-c': 'series-d',
  'series-d': 'series-e',
  'series-e': 'series-f',
  'series-f': 'ipo',
  growth: 'ipo',
};

const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'usage-based', label: 'Usage-Based' },
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
  fundingSoughtThisWeek,
  investorSentiment,
  raiseChance,
  growthMomentum,
  onSeekFunding,
  onChangePricing,
  currentTier,
  maxPrice,
  minPrice,
  engineers,
  shippedFeatures,
  quality,
  completedCertIds,
  difficulty,
  segment,
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
    if (isNaN(price) || price < 1) return;
    const clampedPrice = Math.max(minPrice, Math.min(price, maxPrice));
    onChangePricing(selectedModel, Math.round(clampedPrice));
  }

  const tierDef = PRICING_TIERS.find((t) => t.tier === currentTier);
  const nextTierDef = PRICING_TIERS.find((t) => t.tier === (currentTier + 1) as PricingTier);
  const nextTierScaled = nextTierDef ? getScaledTierRequirements(nextTierDef, difficulty) : null;

  return (
    <div className="space-y-4">
      {/* Fundraising */}
      <div className="retro-card">
        <h3 className="retro-section-heading"><span className="retro-label-tip">Fundraising<InfoTip text="Raise capital from investors to extend your runway. Each round dilutes your equity. Investor interest depends on your valuation, reputation, and market conditions. You can only seek funding once per week." /></span></h3>

        {/* Equity progress bar */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="retro-label">Founder Equity<InfoTip text="Your ownership stake. Diluted each funding round. Keep above 10% to maintain board control. Your final payout at exit = valuation × equity." /></span>
            <span className="retro-value text-[--color-retro-green]">{formatPercent(equityPercent)}</span>
          </div>
          <div className="retro-progress">
            <div
              className="retro-progress-bar retro-progress-bar-green"
              style={{ width: `${equityPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Stage</span>
            <span className="retro-stat-tag-value">{STAGE_LABELS[stage]}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Diluted<InfoTip text="Total equity given away to investors across all rounds. Every fundraise increases dilution. Higher dilution = lower founder payout at exit." /></span>
            <span className="retro-stat-tag-value text-[--color-retro-orange]">{formatPercent(dilutionPercent)}</span>
          </span>
          {fundingHistory.length > 0 && (
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Rounds</span>
              <span className="retro-stat-tag-value">{fundingHistory.length}</span>
            </span>
          )}
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Sentiment<InfoTip text="How enthusiastic investors are (0–100). Driven by bubble index, market trends, and hype cycles. Higher sentiment = easier fundraising and better valuations." /></span>
            <span className={`retro-stat-tag-value ${
              investorSentiment >= 60 ? 'text-[--color-retro-green]' : investorSentiment >= 35 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
            }`}>{Math.round(investorSentiment)}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Momentum<InfoTip text="Revenue growth momentum (0–100). Based on recent week-over-week revenue growth. The single biggest factor in fundraising success. Above 80 = 'hot company' bonus (60% floor on raise chance)." /></span>
            <span className={`retro-stat-tag-value ${
              growthMomentum >= 0.7 ? 'text-[--color-retro-green]' : growthMomentum >= 0.35 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
            }`}>{Math.round(growthMomentum * 100)}</span>
          </span>
          {nextStage && stage !== 'dead' && stage !== 'public' && (
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Raise %<InfoTip text="Your estimated chance of closing a round. Based on growth momentum (25%), investor sentiment (15%), PMF (15%), reputation (15%), founder biz skill (10%), network (10%), and team size (10%). Hot company bonus: momentum >80 floors raise chance at 60%." /></span>
              <span className={`retro-stat-tag-value ${
                raiseChance >= 60 ? 'text-[--color-retro-green]' : raiseChance >= 35 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{Math.round(raiseChance)}%</span>
            </span>
          )}
        </div>

        {/* Seek Funding Button */}
        {nextStage && stage !== 'dead' && stage !== 'public' && (
          <button
            onClick={handleSeekFunding}
            disabled={!!fundingSoughtThisWeek}
            className={`btn-glossy w-full ${fundingSoughtThisWeek ? 'btn-silver opacity-60 cursor-not-allowed' : 'btn-green'}`}
          >
            {fundingSoughtThisWeek
              ? 'Funding Sought This Week'
              : (stage === 'series-f' || stage === 'growth')
                ? 'Go Public (IPO)'
                : `Seek Funding (${nextStage.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())})`}
          </button>
        )}
      </div>

      {/* Funding History */}
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
                  <th className="text-right">Amount</th>
                  <th className="text-right">Valuation</th>
                  <th>Investor</th>
                  <th className="text-right">Week</th>
                </tr>
              </thead>
              <tbody>
                {fundingHistory.map((round, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-[--color-retro-text]">
                      {round.stage.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="font-retro-mono text-[--color-retro-green] font-semibold text-right">
                      {formatCurrency(round.amount)}
                    </td>
                    <td className="font-retro-mono text-[--color-retro-text] text-right">
                      {formatCurrency(round.valuation)}
                    </td>
                    <td className="text-[--color-retro-text-muted]">{round.investorName}</td>
                    <td className="font-retro-mono text-[--color-retro-text-light] text-right">{round.weekClosed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="retro-card">
        <h3 className="retro-section-heading"><span className="retro-label-tip">Pricing<InfoTip text="Set your revenue model and unit price. Subscription = fixed per customer/week. Usage-Based = variable. Higher price = more revenue per customer but slower growth. 8-week cooldown between model switches." /></span></h3>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Model</span>
            <span className="retro-stat-tag-value">{PRICING_MODELS.find((m) => m.value === pricingModel)?.label ?? pricingModel}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Unit Price</span>
            <span className="retro-stat-tag-value text-[--color-retro-blue]">{formatCurrency(pricePerUnit)}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Tier</span>
            <span className="retro-stat-tag-value text-[--color-retro-blue]">{currentTier}: {tierDef?.name}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Range</span>
            <span className="retro-stat-tag-value">{formatCurrency(minPrice)}–{formatCurrency(maxPrice)}</span>
          </span>
        </div>

        {/* Change Pricing Controls */}
        <div className="space-y-3">
          {lastPricingChangeWeek > 0 && (currentWeek - lastPricingChangeWeek) < 8 && selectedModel !== pricingModel && (
            <p className="text-xs text-[--color-retro-orange]">
              Cooldown: {8 - (currentWeek - lastPricingChangeWeek)} weeks until you can switch models
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="retro-label block mb-1.5">Model</label>
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
            </div>
            <div>
              <label className="retro-label block mb-1.5">Price (${minPrice}–${maxPrice})</label>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                step="1"
                value={priceInput}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow typing freely but clamp on blur
                  setPriceInput(val);
                }}
                onBlur={() => {
                  const num = parseInt(priceInput, 10);
                  if (!isNaN(num)) {
                    setPriceInput(String(Math.max(minPrice, Math.min(maxPrice, num))));
                  }
                }}
                className="retro-input w-full"
              />
            </div>
          </div>
          <button
            onClick={handleChangePricing}
            className="btn-glossy btn-primary w-full"
          >
            Update Pricing
          </button>

          {/* Next Tier Requirements */}
          {nextTierDef && nextTierScaled && (
            <div className="retro-stat-footer pt-2 mt-2 border-t border-black/4">
              <span className="text-xs font-bold text-[--color-retro-text-muted] mr-2">Next: Tier {nextTierDef.tier}</span>
              <span className={`retro-stat-tag ${engineers >= nextTierScaled.requiredEngineers ? '' : 'opacity-70'}`}>
                <span className="retro-stat-tag-label">Eng</span>
                <span className="retro-stat-tag-value">{engineers}/{nextTierScaled.requiredEngineers} {engineers >= nextTierScaled.requiredEngineers ? '\u2713' : '\u2717'}</span>
              </span>
              <span className={`retro-stat-tag ${shippedFeatures >= nextTierDef.requiredShippedFeatures ? '' : 'opacity-70'}`}>
                <span className="retro-stat-tag-label">Features</span>
                <span className="retro-stat-tag-value">{shippedFeatures}/{nextTierDef.requiredShippedFeatures} {shippedFeatures >= nextTierDef.requiredShippedFeatures ? '\u2713' : '\u2717'}</span>
              </span>
              <span className={`retro-stat-tag ${quality >= nextTierScaled.requiredQuality ? '' : 'opacity-70'}`}>
                <span className="retro-stat-tag-label">Quality</span>
                <span className="retro-stat-tag-value">{quality}/{nextTierScaled.requiredQuality} {quality >= nextTierScaled.requiredQuality ? '\u2713' : '\u2717'}</span>
              </span>
              {nextTierDef.requiredCerts.length > 0 && (
                <span className={`retro-stat-tag ${checkTierCertsRequirement(nextTierDef, completedCertIds, segment) ? '' : 'opacity-70'}`}>
                  <span className="retro-stat-tag-label">Certs</span>
                  <span className="retro-stat-tag-value">
                    {nextTierDef.tier === 3
                      ? 'SOC2-I/ISO'
                      : nextTierDef.requiredCerts.map((c) => CERTIFICATION_DEFS[c].name).join(', ')
                    } {checkTierCertsRequirement(nextTierDef, completedCertIds, segment) ? '\u2713' : '\u2717'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
