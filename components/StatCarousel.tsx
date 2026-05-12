'use client';

import { useState, useRef } from 'react';

interface Stat {
  label: string;
  value: string;
  sub: string;
}

export function StatCarousel({ stats }: { stats: Stat[] }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    setIndex(Math.round(ref.current.scrollLeft / w));
  };

  return (
    <div className="py-5">
      <div className="px-6 pb-3 flex justify-between items-baseline">
        <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
          The Numbers — Swipe
        </span>
        <span className="font-display text-[11px] font-bold tracking-[0.16em] text-text-secondary tnum">
          {String(index + 1).padStart(2, '0')}/{String(stats.length).padStart(2, '0')}
        </span>
      </div>

      <div
        ref={ref}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x-mandatory scrollbar-hide px-6"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="shrink-0 mr-3 bg-bg-surface border border-white/10 p-5 min-h-[158px] flex flex-col justify-between"
            style={{ width: 'calc(100% - 48px)', scrollSnapAlign: 'start' }}
          >
            <span className="font-display text-[11px] font-bold tracking-[0.18em] uppercase text-text-secondary">
              {s.label}
            </span>
            <div>
              <div className="font-display text-[56px] font-bold leading-[0.95] tracking-[-0.03em] tnum">
                {s.value}
              </div>
              <div className="text-[13px] text-text-secondary mt-1">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 justify-center pt-3.5">
        {stats.map((_, i) => (
          <div
            key={i}
            className="h-1.5 transition-all duration-200"
            style={{
              width: i === index ? 18 : 6,
              background: i === index ? '#FAFAFD' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
