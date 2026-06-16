'use client';

import { useState } from 'react';
import { FitGradeBadge } from './FitScoreBadge';
import { StormFlag } from './StormBadge';

export type LeadStatus = 'saved' | 'contacted' | 'interested' | 'closed_won' | 'closed_lost';

export interface SavedLead {
  id: string;
  zip: string;
  state: string;
  fitScore: number;
  fitGrade: string;
  stormFlag: boolean;
  stormSummary: string | null;
  savedAt: string;
  status: LeadStatus;
  closedAt: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  saved:       { label: 'Saved',      color: '#8A8694', bg: 'rgba(255,255,255,0.06)' },
  contacted:   { label: 'Contacted',  color: '#1E63FF', bg: 'rgba(30,99,255,0.12)'   },
  interested:  { label: 'Interested', color: '#7B3CFF', bg: 'rgba(123,60,255,0.12)'  },
  closed_won:  { label: 'Won',        color: '#22D070', bg: 'rgba(34,208,112,0.12)'  },
  closed_lost: { label: 'Lost',       color: '#D6308F', bg: 'rgba(214,48,143,0.12)'  },
};

const STATUS_ORDER: LeadStatus[] = ['saved', 'contacted', 'interested', 'closed_won', 'closed_lost'];

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

export function LeadCard({
  lead,
  onClick,
  onStatusChange,
}: {
  lead: SavedLead;
  onClick: () => void;
  onStatusChange?: (id: string, status: LeadStatus) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.saved;

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <button
        onClick={onClick}
        className="w-full bg-transparent border-0 text-text-primary grid grid-cols-[auto_1fr_auto] gap-3.5 items-center"
        style={{ padding: onStatusChange ? '18px 24px 10px' : '18px 24px' }}
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

      {onStatusChange && (
        <div className="px-6 pb-3.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPickerOpen((p) => !p)}
            className="border-0 cursor-pointer font-display text-[10px] font-bold tracking-[0.16em] uppercase px-2.5 py-1.5"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </button>

          {pickerOpen && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
              {STATUS_ORDER.map((s) => {
                const c = STATUS_CONFIG[s];
                const isActive = s === lead.status;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      onStatusChange(lead.id, s);
                      setPickerOpen(false);
                    }}
                    className="shrink-0 border-0 cursor-pointer font-display text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1.5"
                    style={{
                      background: isActive ? c.bg : 'rgba(255,255,255,0.04)',
                      color: isActive ? c.color : '#8A8694',
                      outline: isActive ? `1px solid ${c.color}` : 'none',
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
