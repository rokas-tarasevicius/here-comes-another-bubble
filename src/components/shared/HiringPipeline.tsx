import { useGameStore } from '../../store/index.ts';
import type { EmployeeRole } from '../../types/game.ts';

const ROLE_LABELS: Record<EmployeeRole, string> = {
  'engineer': 'Engineer',
  'senior-engineer': 'Sr. Engineer',
  'designer': 'Designer',
  'pm': 'PM',
  'marketer': 'Marketer',
  'sales': 'Sales',
  'data-scientist': 'Data Scientist',
  'devops': 'DevOps',
  'exec': 'Executive',
};

function formatSalary(amount: number): string {
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function HiringPipeline() {
  const gameState = useGameStore((s) => s.gameState);
  const addDecision = useGameStore((s) => s.addDecision);

  if (!gameState) return null;

  const { hiringPipeline } = gameState.team;

  if (hiringPipeline.length === 0) {
    return (
      <div className="retro-card text-center" style={{ padding: '32px 16px' }}>
        <p className="text-sm text-[--color-retro-text-muted]">No candidates in pipeline. Post a job listing!</p>
      </div>
    );
  }

  function handleHire(candidateId: string) {
    addDecision({ type: 'hire', candidateId });
  }

  function handlePass(_candidateId: string) {
    // Pass on this candidate. No explicit "pass" decision type exists,
    // so the candidate will naturally expire when weeksToDecide reaches 0.
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {hiringPipeline.map((candidate) => {
        const urgent = candidate.weeksToDecide <= 1;

        return (
          <div
            key={candidate.id}
            className="retro-card"
            style={urgent ? { borderColor: '#cc3333' } : undefined}
          >
            {/* Header */}
            <div className="mb-2">
              <h4 className="text-sm font-bold text-[--color-retro-text]">{candidate.name}</h4>
              <span className="retro-badge retro-badge-blue">
                {ROLE_LABELS[candidate.role] ?? candidate.role}
              </span>
            </div>

            {/* Stats */}
            <div className="mb-3 space-y-1.5">
              {/* Skill */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[--color-retro-text-muted]">Skill</span>
                <div className="flex items-center gap-2">
                  <div className="retro-progress" style={{ width: '64px', height: '10px' }}>
                    <div
                      className="retro-progress-bar"
                      style={{ width: `${candidate.skill}%` }}
                    />
                  </div>
                  <span className="text-xs font-[--font-retro-mono] text-[--color-retro-text]">{candidate.skill}</span>
                </div>
              </div>

              {/* Salary expectation */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[--color-retro-text-muted]">Salary Ask</span>
                <span className="text-xs font-[--font-retro-mono] text-[--color-retro-text]">
                  {formatSalary(candidate.salaryExpectation)}/wk
                </span>
              </div>

              {/* Weeks to decide */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[--color-retro-text-muted]">Decides in</span>
                <span
                  className={`text-xs font-[--font-retro-mono] font-bold ${
                    urgent ? 'text-[--color-retro-red]' : 'text-[--color-retro-text]'
                  }`}
                >
                  {candidate.weeksToDecide} {candidate.weeksToDecide === 1 ? 'week' : 'weeks'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleHire(candidate.id)}
                className="btn-glossy btn-green flex-1"
              >
                Hire
              </button>
              <button
                onClick={() => handlePass(candidate.id)}
                className="btn-glossy btn-silver flex-1"
              >
                Pass
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
