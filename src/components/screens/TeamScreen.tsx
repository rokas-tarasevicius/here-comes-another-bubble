import { useGameStore } from '../../store/index.ts';
import { EmployeeTable } from '../shared/EmployeeTable.tsx';
import { AIAgentPanel } from '../shared/AIAgentPanel.tsx';
import { HiringPipeline } from '../shared/HiringPipeline.tsx';

function moraleBarClass(morale: number): string {
  if (morale < 30) return 'retro-progress-bar retro-progress-bar-red';
  if (morale <= 60) return 'retro-progress-bar retro-progress-bar-orange';
  return 'retro-progress-bar retro-progress-bar-green';
}

function moraleTextColor(morale: number): string {
  if (morale < 30) return 'text-[--color-retro-red]';
  if (morale <= 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-green]';
}

function formatCost(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function TeamScreen() {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const { employees, aiAgents, avgMorale } = gameState.team;
  const employeeCount = employees.length;
  const agentCount = aiAgents.length;
  const totalTeam = employeeCount + agentCount;

  // Total weekly salary cost
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
  const totalAgentCost = aiAgents.reduce((sum, a) => sum + a.costPerWeek, 0);
  const totalWeeklyCost = totalSalary + totalAgentCost;

  // AI/Human ratio
  const humanRatio = totalTeam > 0 ? (employeeCount / totalTeam) * 100 : 100;
  const aiRatio = totalTeam > 0 ? (agentCount / totalTeam) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h2 className="text-xl font-bold font-[--font-retro-heading] text-[--color-retro-text]">Team Management</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Team */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            Total Team
          </p>
          <p className="text-2xl font-bold text-[--color-retro-text]">{totalTeam}</p>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'} + {agentCount} AI {agentCount === 1 ? 'agent' : 'agents'}
          </p>
        </div>

        {/* Average Morale */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            Average Morale
          </p>
          <p className={`text-2xl font-bold ${moraleTextColor(avgMorale)}`}>
            {avgMorale}
          </p>
          <div className="retro-progress mt-2 !h-2">
            <div
              className={moraleBarClass(avgMorale)}
              style={{ width: `${avgMorale}%` }}
            />
          </div>
        </div>

        {/* Weekly Cost */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            Weekly Cost
          </p>
          <p className="text-2xl font-bold font-[--font-retro-mono] text-[--color-retro-text]">
            {formatCost(totalWeeklyCost)}
          </p>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            Salaries: {formatCost(totalSalary)} | AI: {formatCost(totalAgentCost)}
          </p>
        </div>

        {/* AI/Human Ratio */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            AI / Human Ratio
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="retro-progress !h-3 flex-1">
              <div className="flex h-full">
                <div
                  className="h-full rounded-l-[7px] transition-all"
                  style={{ width: `${humanRatio}%`, background: 'linear-gradient(to bottom, #6699cc, #336699)' }}
                />
                <div
                  className="h-full rounded-r-[7px] transition-all"
                  style={{ width: `${aiRatio}%`, background: 'linear-gradient(to bottom, #9966cc, #663399)' }}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-[--color-retro-blue]">
              <span className="retro-dot retro-dot-green" style={{ background: 'radial-gradient(circle at 30% 30%, #6699cc, #336699)' }} />
              Human {humanRatio.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1 text-[--color-retro-purple]">
              <span className="retro-dot" style={{ background: 'radial-gradient(circle at 30% 30%, #9966cc, #663399)' }} />
              AI {aiRatio.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Employees section */}
      <section>
        <h3 className="retro-section-heading">
          Employees ({employeeCount})
        </h3>
        <EmployeeTable />
      </section>

      {/* AI Agents section */}
      <section>
        <h3 className="retro-section-heading">
          AI Agents ({agentCount})
        </h3>
        <AIAgentPanel />
      </section>

      {/* Hiring Pipeline section */}
      <section>
        <h3 className="retro-section-heading">
          Hiring Pipeline ({gameState.team.hiringPipeline.length})
        </h3>
        <HiringPipeline />
      </section>
    </div>
  );
}
