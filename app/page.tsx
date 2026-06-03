'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'field' | 'marketing' | 'owner';
const COOKIE = 'momentum_role';

function getStoredRole(): Role | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)momentum_role=([^;]+)/);
  return (m?.[1] as Role) ?? null;
}

function storeRole(r: Role) {
  document.cookie = `${COOKIE}=${r};path=/;max-age=31536000;SameSite=Lax`;
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

const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: 'field', label: 'Field', desc: 'BDR · Know the door before you knock' },
  { id: 'marketing', label: 'Marketing', desc: 'Promotions · Channels · Messaging' },
  { id: 'owner', label: 'Owner', desc: 'Dashboard · Pipeline · Canvassers' },
];

export default function SelectRolePage() {
  const router = useRouter();
  const [active, setActive] = useState<Role | null>(null);

  useEffect(() => {
    setActive(getStoredRole());
  }, []);

  const go = (r: Role) => {
    storeRole(r);
    router.push(`/${r}`);
  };

  return (
    <div className="flex flex-col min-h-dvh px-5">
      <div className="flex items-center gap-2.5 pt-5 pb-2">
        <RavenMark size={26} />
        <span className="font-display text-[12px] font-bold tracking-[0.22em] uppercase text-text-secondary">
          Momentum
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center py-8">
        <span className="font-display text-[11px] font-bold tracking-[0.22em] uppercase text-text-secondary mb-2">
          Select your view
        </span>
        <h1 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.025em] mt-1 mb-10">
          Who are you<br />looking as?
        </h1>

        <div className="flex flex-col gap-2">
          {ROLES.map((r) => {
            const isCurrent = active === r.id;
            return (
              <button
                key={r.id}
                onClick={() => go(r.id)}
                className="w-full text-left px-5 border-0 cursor-pointer transition-colors duration-150 min-h-[76px] flex items-center justify-between"
                style={{
                  background: isCurrent ? '#1E63FF' : '#111016',
                  borderLeft: `3px solid ${isCurrent ? '#1E63FF' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div>
                  <span
                    className="font-display text-[19px] font-bold tracking-[-0.01em] block"
                    style={{ color: isCurrent ? '#fff' : '#FAFAFD' }}
                  >
                    {r.label}
                  </span>
                  <span
                    className="font-display text-[11px] font-bold tracking-[0.1em] uppercase mt-0.5 block"
                    style={{ color: isCurrent ? 'rgba(255,255,255,0.65)' : '#8A8694' }}
                  >
                    {r.desc}
                  </span>
                </div>
                <span
                  className="font-display text-[20px] leading-none"
                  style={{ color: isCurrent ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }}
                >
                  →
                </span>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="mt-7 pt-6 border-t border-white/10">
            <button
              onClick={() => go(active)}
              className="w-full h-[56px] bg-accent-blue border-0 cursor-pointer font-display text-[14px] font-bold tracking-[0.12em] uppercase text-white"
            >
              Continue as {active.charAt(0).toUpperCase() + active.slice(1)}
            </button>
          </div>
        )}
      </div>

      <div className="pb-6 flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-accent-green"
          style={{ boxShadow: '0 0 0 3px rgba(34,208,112,.18)' }}
        />
        <span className="font-display text-[11px] font-bold tracking-[0.08em] uppercase text-text-secondary">
          Live
        </span>
      </div>
    </div>
  );
}
