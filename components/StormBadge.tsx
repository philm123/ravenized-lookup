'use client';

export interface StormEvent {
  type: string;
  date: string;
  severity: string;
}

interface StormBadgeProps {
  count: number;
  primaryType: string | null;
  lastDate: string | null;
  events?: StormEvent[];
  zip?: string;
}

function StormIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.5-2A5 5 0 0 0 6 18" />
      <path d="m13 11-2 4h3l-2 4" />
    </svg>
  );
}

function fmtEventDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch { return dateStr; }
}

const SEVERITY_COLOR: Record<string, string> = {
  high:     '#D6308F',
  moderate: '#7B3CFF',
  low:      '#1E63FF',
};

function severityColor(s: string): string {
  return SEVERITY_COLOR[s?.toLowerCase()] ?? '#8A8694';
}

export function StormBadge({ count, primaryType, lastDate, events = [], zip }: StormBadgeProps) {
  if (zip && events.length > 0) {
    fetch(`/api/storm-history/${zip}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    }).catch(() => {});
  }

  if (count === 0) {
    return (
      <div className="px-6 py-3.5 border-b border-white/10">
        <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
          STORM ACTIVITY · 90D — No recent activity
        </span>
      </div>
    );
  }

  const formattedDate = lastDate
    ? new Date(lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="border-b border-white/10">
      <div
        className="px-6 py-3.5 flex items-center gap-3.5"
        style={{ background: 'linear-gradient(90deg, rgba(214,48,143,0.12) 0%, rgba(214,48,143,0) 100%)' }}
      >
        <div className="shrink-0 w-11 h-11 bg-accent-magenta flex items-center justify-center text-white">
          <StormIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF8FC3]">
            STORM ACTIVITY · 90D
          </div>
          <div className="font-display text-lg font-bold mt-0.5 text-text-primary leading-tight">
            {count} {primaryType} {count === 1 ? 'event' : 'events'} · last {formattedDate}
          </div>
        </div>
      </div>

      {events.length > 0 && (
        <div className="px-6 py-3" style={{ background: 'rgba(214,48,143,0.04)' }}>
          <span
            className="font-display text-[10px] font-bold tracking-[0.2em] uppercase block mb-2.5"
            style={{ color: '#FF8FC3' }}
          >
            Event Timeline
          </span>
          <div className="flex flex-col gap-2">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 shrink-0"
                  style={{ background: severityColor(e.severity) }}
                />
                <span
                  className="font-display text-[11px] font-bold tracking-[0.08em] uppercase shrink-0"
                  style={{ color: severityColor(e.severity), minWidth: '4.5rem' }}
                >
                  {e.type}
                </span>
                <span className="text-[11px]" style={{ color: '#8A8694' }}>
                  {fmtEventDate(e.date)}
                </span>
                <span
                  className="font-display text-[9px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 ml-auto shrink-0"
                  style={{
                    background: `${severityColor(e.severity)}20`,
                    color: severityColor(e.severity),
                  }}
                >
                  {e.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StormFlag() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.18em] uppercase font-display px-1.5 py-0.5 bg-accent-magenta text-white">
      STORM
    </span>
  );
}
