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
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-500">No candidates in pipeline. Post a job listing!</p>
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
            className={`rounded-lg border bg-gray-900 p-4 transition-colors ${
              urgent ? 'border-red-800/60' : 'border-gray-800'
            }`}
          >
            {/* Header */}
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-gray-100">{candidate.name}</h4>
              <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                {ROLE_LABELS[candidate.role] ?? candidate.role}
              </span>
            </div>

            {/* Stats */}
            <div className="mb-3 space-y-1.5">
              {/* Skill */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Skill</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${candidate.skill}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-300">{candidate.skill}</span>
                </div>
              </div>

              {/* Salary expectation */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Salary Ask</span>
                <span className="text-xs font-mono text-gray-300">
                  {formatSalary(candidate.salaryExpectation)}/wk
                </span>
              </div>

              {/* Weeks to decide */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Decides in</span>
                <span
                  className={`text-xs font-mono font-medium ${
                    urgent ? 'text-red-400' : 'text-gray-300'
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
                className="flex-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700"
              >
                Hire
              </button>
              <button
                onClick={() => handlePass(candidate.id)}
                className="flex-1 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-300"
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
