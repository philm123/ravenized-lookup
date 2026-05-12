'use client';

import { FitGradeBadge } from './FitScoreBadge';
import { StormFlag } from './StormBadge';

export interface SavedLead {
  zip: string;
  state: string;
  fitScore: number;
  fitGrade: string;
  stormFlag: boolean;
  stormSummary: string | null;
  savedAt: string;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export function LeadCard({ lead, onClick }: { lead: SavedLead; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-transparent border-0 text-text-primary grid grid-cols-[auto_1fr_auto] gap-3.5 items-center px-6 min-h-[80px] border-b border-white/10"
      style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-2xl font-bold tracking-[-0.01em] tnum leading-none">
          {lead.zip}
        </span>
        <span className="text-[11px] text-text-secondary font-medium">{lead.state}</span>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        {lead.stormFlag && <StormFlag />}
        {lead.stormSummary && (
          <span className="text-xs text-text-secondary font-display font-medium tracking-[0.04em]">
            {lead.stormSummary}
          </span>
        )}
        <span className="text-[11px] text-white/40">{timeAgo(lead.savedAt)}</span>
      </div>
      <div className="flex items-center gap-3">
        <FitGradeBadge grade={lead.fitGrade} />
        <span className="text-text-secondary"><ArrowIcon /></span>
      </div>
    </button>
  );
}
