import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { InfoTip } from '../shared/InfoTip.tsx';

export function TeamScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const makeOffer = useGameStore((s) => s.makeOffer);
  const fireMember = useGameStore((s) => s.fireMember);

  const [offerSalaries, setOfferSalaries] = useState<Record<string, string>>({});
  const [confirmFire, setConfirmFire] = useState<string | null>(null);

  if (!gameState) return null;

  const { team, company } = gameState;

  return (
    <div className="space-y-6 max-w-5xl mx-auto min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-retro-text]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>Team</h1>
        <p className="text-sm text-[--color-retro-text-light]">Manage your employees, hire candidates, and track team health</p>
      </div>

      {/* Team Overview */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Team Overview</h3>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
          <div className="flex flex-col gap-1.5">
            <span className="retro-label">Humans</span>
            <span className="retro-value-lg text-[--color-retro-text]">{team.teamSize}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="retro-label">AI Agents</span>
            <span className="retro-value-lg text-[--color-retro-text]">{team.aiAgents.length}</span>
          </div>
        </div>

        <div className="retro-stat-footer">
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Morale<InfoTip text="Team happiness (0–100). Below 40 triggers salary demands. Below 20 risks resignations. Affected by culture, overwork, and events." /></span>
            <span className={`retro-stat-tag-value ${
              team.morale >= 60 ? 'text-[--color-retro-green]' : team.morale >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
            }`}>{Math.round(team.morale)}/100</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Culture<InfoTip text="Company culture score (0–100). Influences morale recovery, hiring acceptance rates, and team productivity. Grows slowly with good decisions." /></span>
            <span className={`retro-stat-tag-value ${
              company.culture >= 60 ? 'text-[--color-retro-green]' : company.culture >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
            }`}>{company.culture}/100</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Avg Salary</span>
            <span className="retro-stat-tag-value">{formatCurrency(team.avgSalary)}/wk</span>
          </span>
          <span className="retro-stat-tag">
            <span className="retro-stat-tag-label">Payroll</span>
            <span className="retro-stat-tag-value text-[--color-retro-red]">{formatCurrency(team.teamSize * team.avgSalary)}/wk</span>
          </span>
        </div>
      </div>

      {/* Team Roster */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Roster ({team.members?.length ?? team.teamSize} members)</h3>
        {(!team.members || team.members.length === 0) ? (
          <p className="text-sm text-[--color-retro-text-muted]">No team members yet. Hire from the candidate pool below or use quick hire.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto retro-scrollbar">
            {team.members.map(member => (
              <div key={member.id} className="retro-inset p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-[--color-retro-text]">{member.name}</span>
                      <span className="retro-badge retro-badge-sm retro-badge-blue">{member.role}</span>
                      {member.traits.map(t => (
                        <span key={t} className="retro-badge retro-badge-sm retro-badge-purple">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Skill</span>
                        <span className="retro-stat-tag-value">{member.skill}</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Salary</span>
                        <span className="retro-stat-tag-value">{formatCurrency(member.salary)}/wk</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Morale</span>
                        <span className={`retro-stat-tag-value ${
                          member.morale >= 60 ? 'text-[--color-retro-green]' : member.morale >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                        }`}>{member.morale}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirmFire === member.id) {
                        fireMember(member.id);
                        setConfirmFire(null);
                      } else {
                        setConfirmFire(member.id);
                      }
                    }}
                    className="btn-glossy btn-glossy-sm btn-red shrink-0"
                  >
                    {confirmFire === member.id ? 'Confirm?' : 'Fire'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Pool */}
      <div className="retro-card">
        <h3 className="retro-section-heading"><span className="retro-label-tip">Candidate Pool<InfoTip text="Available hires. Each candidate leaves after a certain week — act fast. Higher offers increase acceptance chance. Team size affects payroll and your burn rate." /></span> ({team.candidates?.length ?? 0} available)</h3>
        {(!team.candidates || team.candidates.length === 0) ? (
          <p className="text-sm text-[--color-retro-text-muted]">No candidates available. New candidates appear every 4 weeks.</p>
        ) : (
          <div className="space-y-3">
            {team.candidates.map(candidate => {
              const hasPendingOffer = team.pendingOffers?.some(o => o.candidateId === candidate.id);
              const offerInput = offerSalaries[candidate.id] ?? String(candidate.expectedSalary);
              const offerAmount = parseInt(offerInput) || candidate.expectedSalary;
              const salaryRatio = offerAmount / candidate.expectedSalary;
              let acceptProb = Math.round(Math.max(5, Math.min(95, 60 * salaryRatio)));
              if (salaryRatio >= 1.2) acceptProb = Math.min(95, acceptProb);
              if (salaryRatio < 0.8) acceptProb = Math.max(10, Math.round(acceptProb * 0.5));

              return (
                <div key={candidate.id} className="retro-candidate-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[--color-retro-text]">{candidate.name}</span>
                        <span className="retro-badge retro-badge-sm retro-badge-blue">{candidate.role}</span>
                        {candidate.traits.map(t => (
                          <span key={t} className="retro-badge retro-badge-sm retro-badge-purple">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Skill</span>
                        <span className="retro-stat-tag-value">{candidate.skill}</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Expects</span>
                        <span className="retro-stat-tag-value">{formatCurrency(candidate.expectedSalary)}/wk</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Leaves</span>
                        <span className="retro-stat-tag-value">W{candidate.availableUntilWeek}</span>
                      </span>
                    </div>
                  </div>

                  {hasPendingOffer ? (
                    <div className="mt-2.5 border-t border-black/4 pt-2.5">
                      <span className="retro-badge retro-badge-sm retro-badge-orange">Offer pending — resolves next week</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 mt-2.5 border-t border-black/4 pt-2.5">
                      <span className="retro-label shrink-0">Offer</span>
                      <span className="inline-flex items-center shrink-0">
                        <span className="font-retro-mono text-sm font-medium text-[--color-retro-text]">$</span>
                        <input
                          type="number"
                          min={1000}
                          step={500}
                          value={offerInput}
                          onChange={(e) => setOfferSalaries(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                          className="font-retro-mono text-sm font-medium text-[--color-retro-text] bg-transparent border-none outline-none w-16 p-0 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </span>
                      <span className="flex-1" />
                      <span className="retro-stat-tag shrink-0">
                        <span className="retro-stat-tag-label">Chance<InfoTip text="Probability the candidate accepts your offer. Based on the ratio of your offer to their expected salary. Offering 120%+ of expectations greatly increases odds." /></span>
                        <span className={`retro-stat-tag-value ${
                          acceptProb >= 60 ? 'text-[--color-retro-green]' : acceptProb >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                        }`}>{acceptProb}%</span>
                      </span>
                      <button
                        onClick={() => makeOffer(candidate.id, offerAmount)}
                        className="btn-glossy btn-green btn-glossy-sm shrink-0"
                      >
                        Make Offer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
