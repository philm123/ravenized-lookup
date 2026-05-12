'use client';

import { FitGradeBadge } from './FitScoreBadge';

export interface RecentLookup {
  zip: string;
  state: string;
  fitGrade: string;
  timestamp: string;
}

function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export function RecentList({ items, onSelect }: { items: RecentLookup[]; onSelect: (zip: string) => void }) {
  if (items.length === 0) return null;

  return (
    <div className="px-6 py-1 border-t border-white/10 mt-1.5">
      <div className="flex items-center justify-between py-3 pb-2">
        <span className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-text-secondary">
          Recent
        </span>
        <span className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-text-secondary">
          Last 7d
        </span>
      </div>
      <div className="flex flex-col">
        {items.slice(0, 5).map((r, i) => (
          <button
            key={r.zip + r.timestamp}
            onClick={() => onSelect(r.zip)}
            className="border-0 bg-transparent text-text-primary text-left grid grid-cols-[1fr_auto_auto] items-center gap-3.5 min-h-[56px]"
            style={{ padding: '14px 0', borderBottom: i < items.length - 1 && i < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-display text-[22px] font-bold tracking-[-0.01em] tnum">
                {r.zip}
              </span>
              <span className="text-xs text-text-secondary font-medium">{r.state}</span>
            </div>
            <FitGradeBadge grade={r.fitGrade} size="sm" />
            <span className="text-text-secondary">
              <ArrowIcon />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
