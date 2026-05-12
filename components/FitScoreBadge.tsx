'use client';

export function FitScoreBadge({ score, grade }: { score: number; grade: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="gradient-hero rounded-sm px-4 py-2">
        <span className="font-display text-[64px] font-bold leading-[0.85] tracking-[-0.05em] tnum text-white">
          {score}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-xs font-bold tracking-[0.18em] uppercase text-text-secondary">
          FIT · {grade}
        </span>
        <span className="font-display text-xs font-bold tracking-[0.18em] uppercase text-text-secondary">
          / 100
        </span>
      </div>
    </div>
  );
}

export function FitGradeBadge({ grade, size = 'md' }: { grade: string; size?: 'sm' | 'md' }) {
  const isA = grade.startsWith('A');
  const isD = grade === 'D';

  const colorClass = isA
    ? 'bg-accent-blue text-white'
    : isD
    ? 'border border-red-500/40 text-red-400'
    : 'border border-white/20 text-text-primary';

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span className={`font-display font-bold tracking-[0.04em] ${sizeClass} ${colorClass} inline-block text-center min-w-[32px]`}>
      {grade}
    </span>
  );
}
