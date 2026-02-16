import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import type { Employee, EmployeeRole } from '../../types/game.ts';

type SortField = 'name' | 'role' | 'skill' | 'salary' | 'morale' | 'aiSentiment' | 'assignedTo';
type SortDir = 'asc' | 'desc';

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

function moraleColor(morale: number): string {
  if (morale < 30) return 'bg-red-500';
  if (morale <= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function moraleTextColor(morale: number): string {
  if (morale < 30) return 'text-red-400';
  if (morale <= 60) return 'text-amber-400';
  return 'text-emerald-400';
}

function aiSentimentColor(value: number): string {
  if (value < -30) return 'text-red-400';
  if (value > 30) return 'text-emerald-400';
  return 'text-gray-400';
}

function formatSalary(amount: number): string {
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function EmployeeTable() {
  const gameState = useGameStore((s) => s.gameState);
  const addDecision = useGameStore((s) => s.addDecision);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (!gameState) return null;

  const { employees } = gameState.team;
  const { features } = gameState.product;

  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-500">No employees hired yet.</p>
      </div>
    );
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function getSortValue(emp: Employee, field: SortField): string | number {
    switch (field) {
      case 'name': return emp.name.toLowerCase();
      case 'role': return emp.role;
      case 'skill': return emp.skill;
      case 'salary': return emp.salary;
      case 'morale': return emp.morale;
      case 'aiSentiment': return emp.aiSentiment;
      case 'assignedTo': return emp.assignedTo ?? '';
    }
  }

  const sorted = [...employees].sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);
    const mult = sortDir === 'asc' ? 1 : -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * mult;
    }
    return ((aVal as number) - (bVal as number)) * mult;
  });

  function handleFire(employeeId: string) {
    addDecision({ type: 'fire', employeeId });
  }

  function handleReassign(employeeId: string, featureId: string | null) {
    addDecision({
      type: 'assign-team',
      assignments: [{ entityId: employeeId, entityType: 'employee', featureId }],
    });
  }

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return <span className="ml-1 text-gray-600">&#8597;</span>;
    return <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  const headerClass = 'cursor-pointer select-none px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-colors';

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-800">
          <tr>
            <th className={headerClass} onClick={() => handleSort('name')}>
              Name{sortArrow('name')}
            </th>
            <th className={headerClass} onClick={() => handleSort('role')}>
              Role{sortArrow('role')}
            </th>
            <th className={headerClass} onClick={() => handleSort('skill')}>
              Skill{sortArrow('skill')}
            </th>
            <th className={headerClass} onClick={() => handleSort('salary')}>
              Salary{sortArrow('salary')}
            </th>
            <th className={headerClass} onClick={() => handleSort('morale')}>
              Morale{sortArrow('morale')}
            </th>
            <th className={headerClass} onClick={() => handleSort('aiSentiment')}>
              AI Sentiment{sortArrow('aiSentiment')}
            </th>
            <th className={headerClass} onClick={() => handleSort('assignedTo')}>
              Assigned To{sortArrow('assignedTo')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sorted.map((emp) => {
            return (
              <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-100">{emp.name}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                    {ROLE_LABELS[emp.role] ?? emp.role}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-gray-700">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${emp.skill}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{emp.skill}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-gray-300">
                  {formatSalary(emp.salary)}/wk
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-gray-700">
                      <div
                        className={`h-1.5 rounded-full ${moraleColor(emp.morale)}`}
                        style={{ width: `${emp.morale}%` }}
                      />
                    </div>
                    <span className={`text-xs ${moraleTextColor(emp.morale)}`}>
                      {emp.morale}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-mono ${aiSentimentColor(emp.aiSentiment)}`}>
                    {emp.aiSentiment > 0 ? '+' : ''}{emp.aiSentiment}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={emp.assignedTo ?? ''}
                    onChange={(e) => handleReassign(emp.id, e.target.value || null)}
                    className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 border border-gray-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {features
                      .filter((f) => f.status !== 'deprecated')
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleFire(emp.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
                  >
                    Fire
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
