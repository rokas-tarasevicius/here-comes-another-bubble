import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { CERTIFICATION_DEFS, PRICING_TIERS, getScaledCertCost } from '../../data/compliance.ts';
import { calculateCurrentPricingTier } from '../../engine/derived.ts';
import type { CertificationId, CertificationProgress } from '../../types/game.ts';
import { InfoTip } from '../shared/InfoTip.tsx';

function getCertBadgeClass(status: CertificationProgress['status']): string {
  switch (status) {
    case 'completed': return 'retro-badge-green';
    case 'in-progress': return 'retro-badge-blue';
    case 'available': return 'retro-badge-orange';
    case 'locked': return 'retro-badge-gray';
  }
}

function getCertStatusLabel(status: CertificationProgress['status']): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in-progress': return 'In Progress';
    case 'available': return 'Available';
    case 'locked': return 'Locked';
  }
}

export function ComplianceScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const startCertification = useGameStore((s) => s.startCertification);
  const adjustCertificationBudget = useGameStore((s) => s.adjustCertificationBudget);
  const pauseCertification = useGameStore((s) => s.pauseCertification);

  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});

  if (!gameState) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[--color-retro-text-light]">No active game. Start a new game first.</p>
      </div>
    );
  }

  const { compliance, meta, finances } = gameState;
  const difficulty = meta.difficulty;
  const currentTier = calculateCurrentPricingTier(gameState);
  const completedCount = compliance.certifications.filter((c) => c.status === 'completed').length;
  const activeCount = compliance.certifications.filter((c) => c.status === 'in-progress').length;
  const weeklyComplianceCost = compliance.certifications
    .filter((c) => c.status === 'in-progress')
    .reduce((sum, c) => sum + c.weeklySpend, 0);

  const tierDef = PRICING_TIERS.find((t) => t.tier === currentTier);

  function handleStart(certId: CertificationId) {
    const def = CERTIFICATION_DEFS[certId];
    const scaled = getScaledCertCost(def, difficulty);
    const budget = budgetInputs[certId]
      ? parseInt(budgetInputs[certId], 10)
      : scaled.weeklyCost;
    startCertification(certId, budget);
  }

  function handleAdjustBudget(certId: CertificationId) {
    const input = budgetInputs[certId];
    if (!input) return;
    adjustCertificationBudget(certId, parseInt(input, 10));
  }

  // Sort: in-progress first, then available, then completed, then locked
  const statusOrder: Record<string, number> = {
    'in-progress': 0,
    'available': 1,
    'completed': 2,
    'locked': 3,
  };
  const sortedCerts = [...compliance.certifications].sort(
    (a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto min-w-0">
      <div>
        <h1 className="page-heading text-2xl font-bold text-[--color-retro-text]">Compliance</h1>
        <p className="text-sm text-[--color-retro-text-light]">
          Certifications unlock higher pricing tiers and enterprise customers.
        </p>
      </div>

      {/* Overview Card */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Overview</h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="retro-label block mb-1">Completed</span>
            <span className="retro-value text-2xl text-[--color-retro-green]">{completedCount}<span className="text-sm text-[--color-retro-text-muted]">/8</span></span>
          </div>
          <div>
            <span className="retro-label block mb-1">Active</span>
            <span className="retro-value text-2xl text-[--color-retro-blue]">{activeCount}</span>
          </div>
        </div>
        <div className="retro-stat-footer">
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Total Spent</span>
            <span className="retro-stat-tag-value text-[--color-retro-red]">{formatCurrency(compliance.totalComplianceCost)}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Weekly Cost</span>
            <span className="retro-stat-tag-value text-[--color-retro-red]">{formatCurrency(weeklyComplianceCost)}</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Pricing Tier</span>
            <span className="retro-stat-tag-value text-[--color-retro-blue]">{currentTier}: {tierDef?.name}</span>
          </span>
        </div>
      </div>

      {/* Certifications List */}
      <div className="retro-card">
        <h3 className="retro-section-heading">
          <span className="retro-label-tip">
            Certifications
            <InfoTip text="Start certifications to unlock higher pricing tiers. You can expedite by spending up to 3x the base weekly cost — this roughly halves the duration. Pausing preserves progress." />
          </span>
        </h3>
        <div className="space-y-3">
          {sortedCerts.map((cert) => {
            const def = CERTIFICATION_DEFS[cert.id];
            const scaled = getScaledCertCost(def, difficulty);
            const isLocked = cert.status === 'locked';
            const isInProgress = cert.status === 'in-progress';
            const isAvailable = cert.status === 'available';
            const isCompleted = cert.status === 'completed';

            const budgetKey = cert.id;
            const currentBudgetInput = budgetInputs[budgetKey] ?? String(isInProgress ? cert.weeklySpend : scaled.weeklyCost);

            return (
              <div
                key={cert.id}
                className={`retro-inset p-3 ${isLocked ? 'opacity-40' : ''}`}
              >
                {/* Row 1: Name + Status */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-bold text-[--color-retro-text]">{def.name}</span>
                  <span className={`retro-badge retro-badge-sm ${getCertBadgeClass(cert.status)}`}>
                    {getCertStatusLabel(cert.status)}
                  </span>
                  {isLocked && def.prerequisites.length > 0 && (
                    <span className="text-xs text-[--color-retro-text-muted]">
                      Requires: {def.prerequisites.map((p) => CERTIFICATION_DEFS[p].name).join(', ')}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[--color-retro-text-muted] mb-2">{def.description}</p>

                {/* Row 2: Stats */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="retro-stat-tag">
                    <span className="retro-stat-tag-label">Init Cost</span>
                    <span className="retro-stat-tag-value">{formatCurrency(scaled.initCost)}</span>
                  </span>
                  <span className="retro-stat-tag">
                    <span className="retro-stat-tag-label">Weekly</span>
                    <span className="retro-stat-tag-value">{formatCurrency(scaled.weeklyCost)}</span>
                  </span>
                  <span className="retro-stat-tag">
                    <span className="retro-stat-tag-label">Duration</span>
                    <span className="retro-stat-tag-value">~{scaled.baseDuration} wk</span>
                  </span>
                  {isInProgress && (
                    <span className="retro-stat-tag">
                      <span className="retro-stat-tag-label">Spent</span>
                      <span className="retro-stat-tag-value text-[--color-retro-red]">{formatCurrency(cert.totalSpent)}</span>
                    </span>
                  )}
                  {isCompleted && cert.weekCompleted && (
                    <span className="retro-stat-tag">
                      <span className="retro-stat-tag-label">Completed</span>
                      <span className="retro-stat-tag-value">Week {cert.weekCompleted}</span>
                    </span>
                  )}
                </div>

                {/* In-progress: progress bar + budget controls */}
                {isInProgress && (
                  <div className="space-y-2">
                    <div className="retro-progress">
                      <div
                        className="retro-progress-bar retro-progress-bar-blue"
                        style={{
                          width: `${Math.max(2, ((cert.weeksTotal - cert.weeksRemaining) / cert.weeksTotal) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[--color-retro-text-muted]">
                      <span>{Math.ceil(cert.weeksRemaining)} weeks remaining</span>
                      <span className="text-[--color-retro-text-light]">|</span>
                      <span>{formatCurrency(cert.weeklySpend)}/wk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="retro-label text-xs">Budget/wk ($)</label>
                      <input
                        type="number"
                        min={scaled.weeklyCost}
                        max={scaled.weeklyCost * 3}
                        step={Math.round(scaled.weeklyCost * 0.25)}
                        value={currentBudgetInput}
                        onChange={(e) => setBudgetInputs({ ...budgetInputs, [budgetKey]: e.target.value })}
                        className="retro-input w-28 text-sm"
                      />
                      <button
                        onClick={() => handleAdjustBudget(cert.id)}
                        className="btn-glossy btn-primary btn-sm text-xs"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => pauseCertification(cert.id)}
                        className="btn-glossy btn-silver btn-sm text-xs"
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                )}

                {/* Available: start button */}
                {isAvailable && (
                  <div className="flex items-center gap-2">
                    <label className="retro-label text-xs">Budget/wk ($)</label>
                    <input
                      type="number"
                      min={scaled.weeklyCost}
                      max={scaled.weeklyCost * 3}
                      step={Math.round(scaled.weeklyCost * 0.25)}
                      value={currentBudgetInput}
                      onChange={(e) => setBudgetInputs({ ...budgetInputs, [budgetKey]: e.target.value })}
                      className="retro-input w-28 text-sm"
                    />
                    <button
                      onClick={() => handleStart(cert.id)}
                      disabled={finances.cash < scaled.initCost}
                      className={`btn-glossy btn-sm text-xs ${
                        finances.cash < scaled.initCost ? 'btn-silver opacity-60 cursor-not-allowed' : 'btn-green'
                      }`}
                    >
                      Start ({formatCurrency(scaled.initCost)})
                    </button>
                  </div>
                )}

                {/* Completed: flavor text */}
                {isCompleted && (
                  <p className="text-xs italic text-[--color-retro-green]">{def.flavorText}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
