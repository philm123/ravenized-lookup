'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZipInput } from '@/components/ZipInput';
import { RecentList, type RecentLookup } from '@/components/RecentList';
import { RoleChip } from '@/components/RoleChip';

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

export default function MarketingHome() {
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
        setTimeout(() => router.push(`/marketing/${next}`), 150);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex items-center justify-between px-5 pt-1.5 pb-2.5">
        <div className="flex items-center gap-2">
          <RavenMark size={22} />
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
            Marketing
          </span>
        </div>
        <RoleChip role="marketing" />
      </div>

      <ZipInput
        zip={zip}
        onPress={handlePress}
        onClear={() => setZip('')}
        onSubmit={() => zip.length === 5 && router.push(`/marketing/${zip}`)}
      />

      <RecentList
        items={recent}
        onSelect={(z) => router.push(`/marketing/${z}`)}
      />
    </div>
  );
}
