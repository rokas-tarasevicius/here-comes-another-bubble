import { useGameStore } from '../../store/index.ts';
import { EmployeeTable } from '../shared/EmployeeTable.tsx';
import { AIAgentPanel } from '../shared/AIAgentPanel.tsx';
import { HiringPipeline } from '../shared/HiringPipeline.tsx';

function moraleBarColor(morale: number): string {
  if (morale < 30) return 'bg-red-500';
  if (morale <= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function moraleTextColor(morale: number): string {
  if (morale < 30) return 'text-red-400';
  if (morale <= 60) return 'text-amber-400';
  return 'text-emerald-400';
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
      <h2 className="text-xl font-bold text-gray-100">Team Management</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Team */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Total Team
          </p>
          <p className="text-2xl font-bold text-gray-100">{totalTeam}</p>
          <p className="mt-1 text-xs text-gray-500">
            {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'} + {agentCount} AI {agentCount === 1 ? 'agent' : 'agents'}
          </p>
        </div>

        {/* Average Morale */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Average Morale
          </p>
          <p className={`text-2xl font-bold ${moraleTextColor(avgMorale)}`}>
            {avgMorale}
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-700">
            <div
              className={`h-2 rounded-full ${moraleBarColor(avgMorale)} transition-all`}
              style={{ width: `${avgMorale}%` }}
            />
          </div>
        </div>

        {/* Weekly Cost */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Weekly Cost
          </p>
          <p className="text-2xl font-bold font-mono text-gray-100">
            {formatCost(totalWeeklyCost)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Salaries: {formatCost(totalSalary)} | AI: {formatCost(totalAgentCost)}
          </p>
        </div>

        {/* AI/Human Ratio */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            AI / Human Ratio
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-700">
              <div className="flex h-full">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${humanRatio}%` }}
                />
                <div
                  className="h-full bg-violet-500 transition-all"
                  style={{ width: `${aiRatio}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Human {humanRatio.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1 text-violet-400">
              <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
              AI {aiRatio.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Employees section */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-300">
          Employees ({employeeCount})
        </h3>
        <EmployeeTable />
      </section>

      {/* AI Agents section */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-300">
          AI Agents ({agentCount})
        </h3>
        <AIAgentPanel />
      </section>

      {/* Hiring Pipeline section */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-300">
          Hiring Pipeline ({gameState.team.hiringPipeline.length})
        </h3>
        <HiringPipeline />
      </section>
    </div>
  );
}
