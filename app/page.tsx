'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZipInput } from '@/components/ZipInput';
import { RecentList, type RecentLookup } from '@/components/RecentList';

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

const STORAGE_KEY = 'momentum_recent_lookups';

function getRecent(): RecentLookup[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const router = useRouter();
  const [zip, setZip] = useState('');
  const [recent, setRecent] = useState<RecentLookup[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const handlePress = (key: string) => {
    if (key === 'del') {
      setZip((z) => z.slice(0, -1));
    } else if (zip.length < 5) {
      const next = zip + key;
      setZip(next);
      if (next.length === 5) {
        setTimeout(() => router.push(`/lookup/${next}`), 150);
      }
    }
  };

  const handleSubmit = () => {
    if (zip.length === 5) {
      router.push(`/lookup/${zip}`);
    }
  };

  const handleSelect = (z: string) => {
    router.push(`/lookup/${z}`);
  };

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1.5 pb-2.5">
        <div className="flex items-center gap-2">
          <RavenMark size={22} />
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
            Field
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-display text-[11px] font-bold tracking-[0.08em] uppercase text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" style={{ boxShadow: '0 0 0 3px rgba(34,208,112,.18)' }} />
          Live
        </div>
      </div>

      {/* Zip input + keypad */}
      <ZipInput
        zip={zip}
        onPress={handlePress}
        onClear={() => setZip('')}
        onSubmit={handleSubmit}
      />

      {/* Recent lookups */}
      <RecentList items={recent} onSelect={handleSelect} />
    </div>
  );
}
