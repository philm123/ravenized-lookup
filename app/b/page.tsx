'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface RecentLookup {
  zip: string;
  city?: string;
  state: string;
  fitGrade: string;
  timestamp: string;
}

const RECENT_KEY = 'momentum_recent_lookups';
const GRADE_COLORS: Record<string, string> = {
  'A+': '#D6308F',
  A: '#1E63FF',
  'B+': '#7B3CFF',
  B: '#7B3CFF',
};

function getRecent(): RecentLookup[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function RavenMark({ size = 22 }: { size?: number }) {
  const hex = (cx: number, cy: number, r: number, fill: string, key: string) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return <polygon key={key} points={pts.join(' ')} fill={fill} />;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      {hex(16, 20, 7, '#7B3CFF', 'h1')}{hex(16, 36, 7, '#5A4DFF', 'h2')}{hex(28, 12, 7, '#7B3CFF', 'h3')}
      {hex(28, 28, 7, '#3B7DFF', 'h4')}{hex(28, 44, 7, '#1E63FF', 'h5')}{hex(40, 20, 7, '#1E63FF', 'h6')}
      {hex(40, 36, 7, '#1496FF', 'h7')}{hex(52, 28, 7, '#1496FF', 'h8')}
    </svg>
  );
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function PatternBHome() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [zip, setZip] = useState('');
  const [recent, setRecent] = useState<RecentLookup[]>([]);

  useEffect(() => {
    setRecent(getRecent());
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZip(v);
    if (v.length === 5) {
      setTimeout(() => router.push(`/b/${v}`), 120);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length === 5) router.push(`/b/${zip}`);
  };

  return (
    <div className="flex flex-col min-h-dvh px-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-6">
        <div className="flex items-center gap-2.5">
          <RavenMark size={24} />
          <span className="font-display text-[13px] font-bold tracking-[0.14em] uppercase" style={{ color: '#64607A' }}>
            Momentum
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22D070', boxShadow: '0 0 0 3px rgba(34,208,112,.15)' }} />
          <span className="font-display text-[11px] font-bold tracking-[0.08em] uppercase" style={{ color: '#64607A' }}>
            Live
          </span>
        </div>
      </div>

      {/* Hero text */}
      <div className="pt-6 pb-8">
        <h1 className="font-display text-[28px] font-bold leading-[1.15] tracking-[-0.02em] m-0" style={{ color: '#111016' }}>
          Know the homeowner<br />before you knock.
        </h1>
        <p className="mt-3 text-[15px] leading-[1.5]" style={{ color: '#64607A' }}>
          Enter a zip code to pull demographics, storm history, and talking points.
        </p>
      </div>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9994AB' }}>
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={zip}
          onChange={handleChange}
          placeholder="Enter zip code"
          className="w-full h-14 pl-12 pr-14 border-0 font-display text-[17px] font-medium tracking-[0.02em] outline-none"
          style={{
            background: '#FFFFFF',
            color: '#111016',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        />
        {zip.length === 5 && (
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 border-0 flex items-center justify-center cursor-pointer"
            style={{ background: '#1E63FF', borderRadius: '10px', color: '#fff' }}
          >
            <ArrowIcon />
          </button>
        )}
      </form>

      {/* Recent lookups */}
      {recent.length > 0 && (
        <div>
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#9994AB' }}>
            Recent
          </span>

          <div className="mt-3 flex flex-col gap-1.5">
            {recent.slice(0, 5).map((r) => (
              <button
                key={r.zip}
                onClick={() => router.push(`/b/${r.zip}`)}
                className="w-full flex items-center justify-between px-4 py-3.5 border-0 cursor-pointer"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-[17px] font-bold tnum" style={{ color: '#111016' }}>
                    {r.zip}
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: '#9994AB' }}>
                    {r.state}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className="font-display text-[12px] font-bold px-2 py-0.5"
                    style={{
                      background: (GRADE_COLORS[r.fitGrade] || '#64607A') + '14',
                      color: GRADE_COLORS[r.fitGrade] || '#64607A',
                      borderRadius: '6px',
                    }}
                  >
                    {r.fitGrade}
                  </span>
                  <span style={{ color: '#C8C4D4' }}>
                    <ArrowIcon size={14} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
