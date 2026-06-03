'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleChip } from '@/components/RoleChip';
import {
  SAMPLE_TOTALS,
  SAMPLE_CANVASSERS,
  SAMPLE_AREA_STATS,
  SAMPLE_WEEKLY_TREND,
} from '@/lib/owner-sample-data';

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

function SampleBanner() {
  return (
    <div
      className="mx-6 px-4 py-2.5 flex items-center gap-2 mb-5"
      style={{ background: 'rgba(214,48,143,0.12)', border: '1px solid rgba(214,48,143,0.3)' }}
    >
      <span
        className="font-display text-[10px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5"
        style={{ background: '#D6308F', color: '#fff' }}
      >
        SAMPLE DATA
      </span>
      <span className="text-[12px] text-text-secondary leading-[1.4]">
        Live data arrives when CRM is connected.
      </span>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg-surface border border-white/10 p-4 flex flex-col justify-between min-h-[96px]">
      <span className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-text-secondary">
        {label}
      </span>
      <div>
        <span className="font-display text-[32px] font-bold tracking-[-0.03em] tnum leading-none block">
          {value}
        </span>
        {sub && (
          <span className="text-[12px] text-text-secondary mt-1 block">{sub}</span>
        )}
      </div>
    </div>
  );
}

function MiniBarChart() {
  const max = Math.max(...SAMPLE_WEEKLY_TREND.map((w) => w.rate));
  return (
    <div className="flex items-end gap-1.5 h-[48px]">
      {SAMPLE_WEEKLY_TREND.map((w) => (
        <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full"
            style={{
              height: Math.max(6, (w.rate / max) * 40),
              background: 'linear-gradient(180deg, #1E63FF, #7B3CFF)',
              opacity: 0.85,
            }}
          />
        </div>
      ))}
    </div>
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

export default function OwnerHome() {
  const router = useRouter();
  const [zip, setZip] = useState('');
  const [tab, setTab] = useState<'dashboard' | 'lookup'>('dashboard');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZip(v);
    if (v.length === 5) {
      setTimeout(() => router.push(`/owner/${v}`), 150);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1.5 pb-2.5">
        <div className="flex items-center gap-2">
          <RavenMark size={22} />
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
            Owner
          </span>
        </div>
        <RoleChip role="owner" />
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-1 pb-3 border-b border-white/10">
        {[
          { id: 'dashboard' as const, label: 'Dashboard' },
          { id: 'lookup' as const, label: 'Area Lookup' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3.5 py-2 font-display text-xs font-bold tracking-[0.12em] uppercase cursor-pointer border-0 transition-colors duration-150"
            style={{
              background: tab === t.id ? '#FAFAFD' : 'transparent',
              color: tab === t.id ? '#08070C' : '#8A8694',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'lookup' ? (
          /* Area Lookup */
          <div className="px-6 pt-6">
            <p className="text-[14px] text-text-secondary mb-5 leading-[1.5]">
              Look up any ZIP to get the owner lens — territory fit, demographics, and storm risk.
            </p>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                <SearchIcon size={18} />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={zip}
                onChange={handleChange}
                placeholder="Enter ZIP code"
                className="w-full h-14 pl-12 pr-4 border-0 bg-bg-surface font-display text-[18px] font-bold tracking-[0.06em] outline-none text-text-primary"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              />
              {zip.length === 5 && (
                <button
                  onClick={() => router.push(`/owner/${zip}`)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 border-0 flex items-center justify-center cursor-pointer bg-accent-blue text-white"
                >
                  <ArrowIcon />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard */
          <div className="pt-5 pb-10">
            <SampleBanner />

            {/* KPI row */}
            <div className="px-6 mb-5">
              <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary block mb-3">
                This Week
              </span>
              <div className="grid grid-cols-2 gap-2">
                <StatTile label="Total Leads" value={SAMPLE_TOTALS.totalLeads} sub="Across all areas" />
                <StatTile label="Total Closes" value={SAMPLE_TOTALS.totalCloses} sub="Confirmed jobs" />
                <StatTile label="Avg Close Rate" value={Math.round(SAMPLE_TOTALS.avgCloseRate * 100) + '%'} sub="Leads to close" />
                <StatTile label="Storm Leads" value={SAMPLE_TOTALS.stormLeads} sub="Storm-flagged areas" />
              </div>
            </div>

            {/* Close rate trend */}
            <div className="px-6 mb-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
                  Close Rate · 6 Weeks
                </span>
                <span className="font-display text-[11px] font-bold tracking-[0.1em] text-text-secondary tnum">
                  {SAMPLE_WEEKLY_TREND.map((w) => w.label).join('  ')}
                </span>
              </div>
              <div className="bg-bg-surface border border-white/10 p-4">
                <MiniBarChart />
                <div className="flex justify-between mt-2">
                  {SAMPLE_WEEKLY_TREND.map((w) => (
                    <span key={w.label} className="font-display text-[11px] font-bold tnum text-text-secondary flex-1 text-center">
                      {Math.round(w.rate * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvasser activity */}
            <div className="px-6 mb-5 border-t border-white/10 pt-5">
              <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary block mb-3">
                Canvasser Activity
              </span>
              <div className="flex flex-col">
                {SAMPLE_CANVASSERS.map((c, i) => {
                  const rate = c.leads > 0 ? Math.round((c.closes / c.leads) * 100) : 0;
                  return (
                    <div
                      key={c.name}
                      className="flex items-center justify-between py-3.5"
                      style={{ borderBottom: i < SAMPLE_CANVASSERS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
                    >
                      <span className="font-display text-[14px] font-bold">{c.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-display text-[13px] font-bold tnum block">{c.leads}</span>
                          <span className="text-[11px] text-text-secondary">leads</span>
                        </div>
                        <div className="text-right">
                          <span className="font-display text-[13px] font-bold tnum block">{c.closes}</span>
                          <span className="text-[11px] text-text-secondary">closes</span>
                        </div>
                        <span
                          className="font-display text-[12px] font-bold px-2 py-1 tnum"
                          style={{
                            background: rate >= 35 ? 'rgba(34,208,112,0.12)' : 'rgba(255,255,255,0.06)',
                            color: rate >= 35 ? '#22D070' : '#8A8694',
                          }}
                        >
                          {rate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Areas breakdown */}
            <div className="px-6 mb-5 border-t border-white/10 pt-5">
              <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary block mb-3">
                Areas Canvassed
              </span>
              <div className="flex flex-col gap-2">
                {SAMPLE_AREA_STATS.map((a) => {
                  const rate = a.leads > 0 ? Math.round((a.closes / a.leads) * 100) : 0;
                  return (
                    <button
                      key={a.zip}
                      onClick={() => router.push(`/owner/${a.zip}`)}
                      className="bg-bg-surface border border-white/10 px-4 py-3.5 flex items-center justify-between cursor-pointer w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[18px] font-bold tnum">{a.zip}</span>
                        <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-text-secondary">{a.state}</span>
                        {a.stormFlag && (
                          <span
                            className="font-display text-[9px] font-bold tracking-[0.18em] uppercase px-1.5 py-0.5"
                            style={{ background: '#D6308F', color: '#fff' }}
                          >
                            STORM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-display text-[13px] font-bold tnum">{a.leads} / {a.closes}</span>
                          <span className="text-[11px] text-text-secondary block">{rate}% close</span>
                        </div>
                        <span className="text-text-secondary"><ArrowIcon /></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CRM empty state */}
            <div className="px-6 pt-3">
              <div
                className="flex flex-col items-center text-center px-6 py-8 gap-3"
                style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
              >
                <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
                  Close Rate Readback
                </span>
                <span className="text-[14px] text-text-secondary leading-[1.5]">
                  Live close-rate data arrives when your CRM is connected.
                </span>
                <span
                  className="font-display text-[12px] font-bold tracking-[0.14em] uppercase px-4 py-2.5 mt-1"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#8A8694', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Connect CRM — Coming Soon
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
