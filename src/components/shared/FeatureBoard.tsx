import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import type { Feature, FeatureStatus } from '../../types/game.ts';

const COLUMNS: { status: FeatureStatus; label: string; accent: string }[] = [
  { status: 'planned', label: 'Planned', accent: 'border-t-blue-500' },
  { status: 'in-progress', label: 'In Progress', accent: 'border-t-amber-500' },
  { status: 'shipped', label: 'Shipped', accent: 'border-t-emerald-500' },
  { status: 'deprecated', label: 'Deprecated', accent: 'border-t-gray-600' },
];

function qualityColor(quality: number): string {
  if (quality < 30) return 'text-red-400';
  if (quality <= 60) return 'text-amber-400';
  return 'text-emerald-400';
}

function techDebtColor(debt: number): string {
  if (debt < 30) return 'text-emerald-400';
  if (debt <= 60) return 'text-amber-400';
  return 'text-red-400';
}

interface NewFeatureFormState {
  name: string;
  description: string;
  marketRelevance: string;
}

export function FeatureBoard() {
  const gameState = useGameStore((s) => s.gameState);
  const addDecision = useGameStore((s) => s.addDecision);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewFeatureFormState>({
    name: '',
    description: '',
    marketRelevance: '50',
  });

  if (!gameState) return null;

  const { features } = gameState.product;
  const { employees } = gameState.team;
  const { aiAgents } = gameState.team;

  // Build lookup maps for assigned names
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]));
  const agentMap = new Map(aiAgents.map((a) => [a.id, a.name]));

  function handleSubmitFeature(e: React.FormEvent) {
    e.preventDefault();
    const relevance = parseInt(form.marketRelevance, 10);
    if (!form.name.trim()) return;

    addDecision({
      type: 'start-feature',
      name: form.name.trim(),
      description: form.description.trim(),
      marketRelevance: isNaN(relevance) ? 50 : Math.max(0, Math.min(100, relevance)),
    });

    setForm({ name: '', description: '', marketRelevance: '50' });
    setShowForm(false);
  }

  function getAssignedNames(feature: Feature): string[] {
    const names: string[] = [];
    for (const id of feature.assignedEmployees) {
      const name = employeeMap.get(id);
      if (name) names.push(name);
    }
    for (const id of feature.assignedAgents) {
      const name = agentMap.get(id);
      if (name) names.push(name);
    }
    return names;
  }

  return (
    <div>
      {/* Header with new feature button */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Features</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Feature'}
        </button>
      </div>

      {/* New feature form */}
      {showForm && (
        <form
          onSubmit={handleSubmitFeature}
          className="mb-4 rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-400">Feature Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., User Dashboard"
              className="w-full rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-100 border border-gray-700 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-400">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              className="w-full rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-100 border border-gray-700 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Market Relevance (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.marketRelevance}
              onChange={(e) => setForm({ ...form, marketRelevance: e.target.value })}
              className="w-24 rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-100 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!form.name.trim()}
            className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            Start Feature
          </button>
        </form>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colFeatures = features.filter((f) => f.status === col.status);

          return (
            <div key={col.status} className="flex flex-col">
              {/* Column header */}
              <div
                className={`mb-3 rounded-t-lg border-t-2 ${col.accent} bg-gray-900 px-3 py-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-xs font-mono text-gray-500">
                    {colFeatures.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3">
                {colFeatures.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-800 p-3 text-center">
                    <p className="text-xs text-gray-600">No features</p>
                  </div>
                )}
                {colFeatures.map((feature) => {
                  const assignedNames = getAssignedNames(feature);
                  const totalAssigned = feature.assignedEmployees.length + feature.assignedAgents.length;

                  return (
                    <div
                      key={feature.id}
                      className="rounded-lg border border-gray-800 bg-gray-900 p-3"
                    >
                      {/* Feature name */}
                      <h4 className="mb-1 text-sm font-medium text-gray-100">{feature.name}</h4>
                      {feature.description && (
                        <p className="mb-2 text-xs text-gray-500 line-clamp-2">
                          {feature.description}
                        </p>
                      )}

                      {/* Progress bar */}
                      {(col.status === 'in-progress' || col.status === 'planned') && (
                        <div className="mb-2">
                          <div className="mb-0.5 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-mono text-gray-400">
                              {feature.progress}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-700">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${feature.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="mb-2 flex items-center gap-3 text-xs">
                        <span className={qualityColor(feature.quality)}>
                          Q:{feature.quality}
                        </span>
                        <span className={techDebtColor(feature.techDebt)}>
                          TD:{feature.techDebt}
                        </span>
                        <span className="text-blue-400">
                          MR:{feature.marketRelevance}
                        </span>
                      </div>

                      {/* Assigned team */}
                      {totalAssigned > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assignedNames.length <= 3 ? (
                            assignedNames.map((name, i) => (
                              <span
                                key={i}
                                className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                              {totalAssigned} assigned
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
