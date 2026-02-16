import { useGameStore } from '../../store/index.ts';
import { FeatureBoard } from '../shared/FeatureBoard.tsx';
import { TechDebtMeter } from '../shared/TechDebtMeter.tsx';

function qualityColor(quality: number): string {
  if (quality < 30) return 'text-[--color-retro-red]';
  if (quality <= 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-green]';
}

function qualityBarClass(quality: number): string {
  if (quality < 30) return 'retro-progress-bar retro-progress-bar-red';
  if (quality <= 60) return 'retro-progress-bar retro-progress-bar-orange';
  return 'retro-progress-bar retro-progress-bar-green';
}

function pmfColor(pmf: number): string {
  if (pmf < 30) return 'text-[--color-retro-red]';
  if (pmf <= 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-green]';
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toFixed(0);
}

export function ProductScreen() {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const { product } = gameState;
  const churnPercent = (product.churnRate * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h2 className="text-xl font-bold font-[--font-retro-heading] text-[--color-retro-text]">Product: {product.name}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Overall Quality */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            Overall Quality
          </p>
          <p className={`text-2xl font-bold ${qualityColor(product.overallQuality)}`}>
            {product.overallQuality}
          </p>
          <div className="retro-progress mt-2 !h-2">
            <div
              className={qualityBarClass(product.overallQuality)}
              style={{ width: `${product.overallQuality}%` }}
            />
          </div>
        </div>

        {/* PMF Score */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            PMF Score
          </p>
          <p className={`text-2xl font-bold ${pmfColor(product.pmfScore)}`}>
            {product.pmfScore}
          </p>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            {product.pmfScore < 30
              ? 'Searching for fit...'
              : product.pmfScore <= 60
                ? 'Getting closer'
                : 'Strong product-market fit'}
          </p>
        </div>

        {/* Customers + Churn */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            Customers
          </p>
          <p className="text-2xl font-bold text-[--color-retro-text]">
            {formatNumber(product.customers)}
          </p>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            Churn: <span className={product.churnRate > 0.1 ? 'text-[--color-retro-red]' : 'text-[--color-retro-text-muted]'}>{churnPercent}%</span>
          </p>
        </div>

        {/* Bugs */}
        <div className="retro-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
            Bugs
          </p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-[--color-retro-text]">{product.bugs}</p>
            {product.bugs > 0 && (
              <span className={`retro-badge ${product.bugs > 10 ? 'retro-badge-red' : product.bugs > 5 ? 'retro-badge-orange' : 'retro-badge-blue'}`}>
                {product.bugs > 10 ? 'Critical' : product.bugs > 5 ? 'High' : 'Active'}
              </span>
            )}
          </div>
          {product.bugs === 0 && (
            <p className="mt-1 text-xs text-[--color-retro-green]">Bug-free!</p>
          )}
        </div>
      </div>

      {/* Main content: Feature board + Tech Debt */}
      <div className="grid grid-cols-[1fr_240px] gap-6">
        {/* Feature Board */}
        <section>
          <FeatureBoard />
        </section>

        {/* Tech Debt Meter sidebar */}
        <section>
          <TechDebtMeter value={product.techDebtTotal} />
        </section>
      </div>
    </div>
  );
}
