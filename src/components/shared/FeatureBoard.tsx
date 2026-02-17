import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import type { FeatureStatus } from '../../types/game.ts';

const COLUMNS: { status: FeatureStatus; label: string; badgeClass: string }[] = [
  { status: 'planned', label: 'Planned', badgeClass: 'retro-badge retro-badge-gray' },
  { status: 'in-progress', label: 'In Progress', badgeClass: 'retro-badge retro-badge-blue' },
  { status: 'shipped', label: 'Shipped', badgeClass: 'retro-badge retro-badge-green' },
  { status: 'deprecated', label: 'Deprecated', badgeClass: 'retro-badge retro-badge-red' },
];

function qualityColor(quality: number): string {
  if (quality < 30) return 'text-[--color-retro-red]';
  if (quality <= 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-green]';
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

  return (
    <div>
      {/* Header with new feature button */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="retro-section-heading" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Features</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-glossy btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Feature'}
        </button>
      </div>

      {/* New feature form */}
      {showForm && (
        <form
          onSubmit={handleSubmitFeature}
          className="retro-card mb-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs font-bold text-[--color-retro-text-muted]">Feature Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., User Dashboard"
              className="retro-input w-full"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-bold text-[--color-retro-text-muted]">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              className="retro-input w-full"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-bold text-[--color-retro-text-muted]">
              Market Relevance (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.marketRelevance}
              onChange={(e) => setForm({ ...form, marketRelevance: e.target.value })}
              className="retro-input w-24"
            />
          </div>
          <button
            type="submit"
            disabled={!form.name.trim()}
            className="btn-glossy btn-green disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="retro-inset mb-3 flex items-center justify-between" style={{ padding: '8px 12px' }}>
                <span className={col.badgeClass}>
                  {col.label}
                </span>
                <span className="rounded-full bg-[--color-retro-card] border border-[--color-retro-border] px-1.5 py-0.5 text-xs font-[--font-retro-mono] text-[--color-retro-text-muted]">
                  {colFeatures.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3">
                {colFeatures.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[--color-retro-border] p-3 text-center">
                    <p className="text-xs text-[--color-retro-text-light]">No features</p>
                  </div>
                )}
                {colFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="retro-card-raised"
                  >
                    {/* Feature name */}
                    <h4 className="mb-1 text-sm font-bold text-[--color-retro-text]">{feature.name}</h4>
                    {feature.description && (
                      <p className="mb-2 text-xs text-[--color-retro-text-light] line-clamp-2">
                        {feature.description}
                      </p>
                    )}

                    {/* Progress bar */}
                    {(col.status === 'in-progress' || col.status === 'planned') && (
                      <div className="mb-2">
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className="text-xs text-[--color-retro-text-muted]">Progress</span>
                          <span className="text-xs font-[--font-retro-mono] text-[--color-retro-text-muted]">
                            {feature.progress}%
                          </span>
                        </div>
                        <div className="retro-progress" style={{ height: '10px' }}>
                          <div
                            className="retro-progress-bar"
                            style={{ width: `${feature.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className={qualityColor(feature.quality)}>
                        Q:{feature.quality}
                      </span>
                      <span className="text-[--color-retro-blue]">
                        MR:{feature.marketRelevance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
