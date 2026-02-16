import { useGameStore } from '../../store/index.ts';
import { FeatureBoard } from '../shared/FeatureBoard.tsx';
import { TechDebtMeter } from '../shared/TechDebtMeter.tsx';

function qualityColor(quality: number): string {
  if (quality < 30) return 'text-red-400';
  if (quality <= 60) return 'text-amber-400';
  return 'text-emerald-400';
}

function qualityBarColor(quality: number): string {
  if (quality < 30) return 'bg-red-500';
  if (quality <= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function pmfColor(pmf: number): string {
  if (pmf < 30) return 'text-red-400';
  if (pmf <= 60) return 'text-amber-400';
  return 'text-emerald-400';
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
      <h2 className="text-xl font-bold text-gray-100">Product: {product.name}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Overall Quality */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Overall Quality
          </p>
          <p className={`text-2xl font-bold ${qualityColor(product.overallQuality)}`}>
            {product.overallQuality}
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-700">
            <div
              className={`h-2 rounded-full ${qualityBarColor(product.overallQuality)} transition-all`}
              style={{ width: `${product.overallQuality}%` }}
            />
          </div>
        </div>

        {/* PMF Score */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            PMF Score
          </p>
          <p className={`text-2xl font-bold ${pmfColor(product.pmfScore)}`}>
            {product.pmfScore}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {product.pmfScore < 30
              ? 'Searching for fit...'
              : product.pmfScore <= 60
                ? 'Getting closer'
                : 'Strong product-market fit'}
          </p>
        </div>

        {/* Customers + Churn */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Customers
          </p>
          <p className="text-2xl font-bold text-gray-100">
            {formatNumber(product.customers)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Churn: <span className={product.churnRate > 0.1 ? 'text-red-400' : 'text-gray-400'}>{churnPercent}%</span>
          </p>
        </div>

        {/* Bugs */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Bugs
          </p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-100">{product.bugs}</p>
            {product.bugs > 0 && (
              <span className="rounded-full bg-red-900/60 px-2 py-0.5 text-xs font-medium text-red-300">
                {product.bugs > 10 ? 'Critical' : product.bugs > 5 ? 'High' : 'Active'}
              </span>
            )}
          </div>
          {product.bugs === 0 && (
            <p className="mt-1 text-xs text-emerald-500">Bug-free!</p>
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
