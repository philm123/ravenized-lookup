'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface RecentLookup {
  zip: string;
  state: string;
  fitGrade: string;
  timestamp: string;
}

const RECENT_KEY = 'momentum_recent_lookups';

function getRecent(): RecentLookup[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function RavenMark({ size = 28 }: { size?: number }) {
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

export default function PatternCHome() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [zip, setZip] = useState('');
  const [recent, setRecent] = useState<RecentLookup[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZip(v);
    if (v.length === 5) {
      setTimeout(() => router.push(`/c/${v}`), 150);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length === 5) router.push(`/c/${zip}`);
  };

  return (
    <div className="flex flex-col min-h-dvh relative overflow-hidden">
      {/* Atmospheric gradient background */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-30%',
          width: '160%',
          height: '70%',
          background: 'radial-gradient(ellipse at 40% 50%, rgba(123,60,255,0.15) 0%, rgba(30,99,255,0.08) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          right: '-20%',
          width: '80%',
          height: '40%',
          background: 'radial-gradient(ellipse at 60% 80%, rgba(214,48,143,0.1) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 relative z-10">
        <RavenMark size={28} />
        <span className="font-display text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: 'rgba(250,250,253,0.35)' }}>
          Raven
        </span>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10" style={{ minHeight: '50vh' }}>
        <h1
          className="font-display text-[42px] font-bold leading-[1.05] tracking-[-0.03em] m-0"
          style={{
            background: 'linear-gradient(135deg, #1E63FF 0%, #7B3CFF 40%, #D6308F 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Every door<br />tells a story.
        </h1>
        <p className="mt-4 text-[15px] leading-[1.55]" style={{ color: 'rgba(250,250,253,0.5)' }}>
          Demographics. Storm history. Conversation starters.<br />
          All from a zip code.
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={zip}
              onChange={handleChange}
              placeholder="00000"
              className="w-full h-16 px-6 border-0 font-display text-[28px] font-bold tracking-[0.15em] text-center outline-none tnum"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#FAFAFD',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <div
              className="absolute bottom-0 left-[10%] right-[10%] h-[2px]"
              style={{
                background: zip.length > 0
                  ? 'linear-gradient(90deg, #1E63FF, #7B3CFF, #D6308F)'
                  : 'transparent',
                opacity: Math.min(zip.length / 5, 1),
                transition: 'opacity 0.2s',
                borderRadius: '1px',
              }}
            />
          </div>
        </form>
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div className="px-6 pb-8 relative z-10">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase block mb-3" style={{ color: 'rgba(250,250,253,0.25)' }}>
            Recent
          </span>
          <div className="flex gap-2">
            {recent.slice(0, 4).map((r) => (
              <button
                key={r.zip}
                onClick={() => router.push(`/c/${r.zip}`)}
                className="flex-1 py-3 border-0 cursor-pointer font-display text-[15px] font-bold tnum"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(250,250,253,0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {r.zip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
