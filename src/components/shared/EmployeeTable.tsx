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

function moraleProgressBar(morale: number): string {
  if (morale < 30) return 'retro-progress-bar retro-progress-bar-red';
  if (morale <= 60) return 'retro-progress-bar retro-progress-bar-orange';
  return 'retro-progress-bar retro-progress-bar-green';
}

function moraleTextColor(morale: number): string {
  if (morale < 30) return 'text-[--color-retro-red]';
  if (morale <= 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-green]';
}

function aiSentimentColor(value: number): string {
  if (value < -30) return 'text-[--color-retro-red]';
  if (value > 30) return 'text-[--color-retro-green]';
  return 'text-[--color-retro-text-muted]';
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
      <div className="retro-card text-center" style={{ padding: '32px 16px' }}>
        <p className="text-sm text-[--color-retro-text-muted]">No employees hired yet.</p>
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
    if (sortField !== field) return <span className="ml-1 text-[--color-retro-text-light]">&#8597;</span>;
    return <span className="ml-1 text-[--color-retro-blue]">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  return (
    <div className="retro-card overflow-x-auto" style={{ padding: 0 }}>
      <table className="retro-table">
        <thead>
          <tr>
            <th className="cursor-pointer select-none" onClick={() => handleSort('name')}>
              Name{sortArrow('name')}
            </th>
            <th className="cursor-pointer select-none" onClick={() => handleSort('role')}>
              Role{sortArrow('role')}
            </th>
            <th className="cursor-pointer select-none" onClick={() => handleSort('skill')}>
              Skill{sortArrow('skill')}
            </th>
            <th className="cursor-pointer select-none" onClick={() => handleSort('salary')}>
              Salary{sortArrow('salary')}
            </th>
            <th className="cursor-pointer select-none" onClick={() => handleSort('morale')}>
              Morale{sortArrow('morale')}
            </th>
            <th className="cursor-pointer select-none" onClick={() => handleSort('aiSentiment')}>
              AI Sentiment{sortArrow('aiSentiment')}
            </th>
            <th className="cursor-pointer select-none" onClick={() => handleSort('assignedTo')}>
              Assigned To{sortArrow('assignedTo')}
            </th>
            <th style={{ textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((emp) => {
            return (
              <tr key={emp.id}>
                <td className="font-semibold text-[--color-retro-text]">{emp.name}</td>
                <td>
                  <span className="retro-badge retro-badge-blue">
                    {ROLE_LABELS[emp.role] ?? emp.role}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="retro-progress" style={{ width: '64px', height: '10px' }}>
                      <div
                        className="retro-progress-bar"
                        style={{ width: `${emp.skill}%` }}
                      />
                    </div>
                    <span className="text-xs text-[--color-retro-text-muted]">{emp.skill}</span>
                  </div>
                </td>
                <td className="font-[--font-retro-mono] text-[--color-retro-text]">
                  {formatSalary(emp.salary)}/wk
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="retro-progress" style={{ width: '64px', height: '10px' }}>
                      <div
                        className={moraleProgressBar(emp.morale)}
                        style={{ width: `${emp.morale}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${moraleTextColor(emp.morale)}`}>
                      {emp.morale}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`text-xs font-[--font-retro-mono] font-semibold ${aiSentimentColor(emp.aiSentiment)}`}>
                    {emp.aiSentiment > 0 ? '+' : ''}{emp.aiSentiment}
                  </span>
                </td>
                <td>
                  <select
                    value={emp.assignedTo ?? ''}
                    onChange={(e) => handleReassign(emp.id, e.target.value || null)}
                    className="retro-input text-xs"
                    style={{ padding: '4px 8px' }}
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
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleFire(emp.id)}
                    className="btn-glossy btn-red"
                    style={{ padding: '4px 12px', fontSize: '11px' }}
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
