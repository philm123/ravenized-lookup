'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FitScoreBadge } from '@/components/FitScoreBadge';
import { StormBadge } from '@/components/StormBadge';
import { StatCarousel } from '@/components/StatCarousel';
import { RoleChip } from '@/components/RoleChip';
import { fmtMoney, fmtMoneyCompact, fmtPct, fmtNum } from '@/lib/format';
import { SAMPLE_AREA_STATS } from '@/lib/owner-sample-data';

interface ZipProfile {
  zip: string;
  state: string;
  stateAbbrev: string;
  medianIncome: number | null;
  homeAge: number | null;
  ownerOccupancy: number | null;
  medianPropertyValue: number | null;
  pct10yrOwners: number | null;
  population: number | null;
  pctChildren: number | null;
  pctDegree: number | null;
  pctMgmt: number | null;
  avgCommute: number | null;
  crCopy: {
    income: string | null;
    stability: string | null;
    occupancy: string | null;
    demo: string | null;
    family: string | null;
  };
  fitScore: number;
  fitGrade: string;
  storm: {
    count: number;
    lastDate: string | null;
    primaryType: string | null;
    events: { type: string; date: string; severity: string }[];
  };
  summary: string;
}

function BackIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function SampleBadge() {
  return (
    <span
      className="font-display text-[9px] font-bold tracking-[0.18em] uppercase px-1.5 py-0.5"
      style={{ background: '#D6308F', color: '#fff' }}
    >
      SAMPLE
    </span>
  );
}

const RECENT_KEY = 'momentum_recent_lookups';

function addRecent(data: ZipProfile) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((r: { zip: string }) => r.zip !== data.zip);
    filtered.unshift({
      zip: data.zip,
      state: data.stateAbbrev || data.state,
      fitGrade: data.fitGrade,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 7)));
  } catch {}
}

export default function OwnerLookupPage() {
  const params = useParams();
  const router = useRouter();
  const zip = params.zip as string;

  const [data, setData] = useState<ZipProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/lookup/${zip}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Zip code not found' : 'Lookup failed');
        return res.json();
      })
      .then((d: ZipProfile) => {
        setData(d);
        addRecent(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [zip]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <span className="font-display text-lg text-text-secondary">Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
        <span className="font-display text-2xl font-bold text-text-primary">{zip}</span>
        <span className="text-text-secondary text-center">{error || 'Not found'}</span>
        <button
          onClick={() => router.push('/owner')}
          className="mt-4 px-6 py-3 bg-accent-blue text-white border-0 font-display text-sm font-bold tracking-[0.12em] uppercase cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const sampleArea = SAMPLE_AREA_STATS.find((a) => a.zip === zip);
  const closeRate = sampleArea ? Math.round((sampleArea.closes / sampleArea.leads) * 100) : null;

  // Owner-framed territory assessment stats
  const ownerStats = [
    { label: 'Territory Fit', value: data.fitScore + '/100', sub: 'Momentum score' },
    { label: 'Avg Property', value: fmtMoneyCompact(data.medianPropertyValue), sub: 'Median home value' },
    { label: 'Owner Rate', value: fmtPct(data.ownerOccupancy), sub: 'Owned vs rented' },
    { label: 'Stable Owners', value: fmtPct(data.pct10yrOwners), sub: '10+ year tenure' },
    { label: 'Home Age', value: data.homeAge != null ? data.homeAge + ' yrs' : '—', sub: 'Median age' },
    { label: 'Avg Income', value: fmtMoney(data.medianIncome), sub: 'Household, USD' },
    { label: 'Population', value: fmtNum(data.population), sub: 'Total residents' },
  ];

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2.5 shrink-0">
        <button
          onClick={() => router.push('/owner')}
          className="flex items-center gap-1 px-1 py-2 bg-transparent border-0 text-text-primary cursor-pointer font-display text-xs font-bold tracking-[0.16em] uppercase min-h-[40px]"
        >
          <BackIcon /> DASHBOARD
        </button>
        <RoleChip role="owner" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-8">
        {/* Hero */}
        <div
          className="px-6 pt-5 pb-7 border-b border-white/20 relative"
          style={{ background: 'linear-gradient(180deg, rgba(214,48,143,0.06) 0%, rgba(0,0,0,0) 100%)' }}
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
              Territory Assessment
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-4 mt-3">
            <span className="font-display text-4xl font-bold tracking-[-0.02em] tnum">
              {data.zip}
            </span>
            <span className="font-display text-xs font-bold tracking-[0.16em] uppercase text-text-secondary">
              {data.stateAbbrev || data.state}
            </span>
          </div>

          <FitScoreBadge score={data.fitScore} grade={data.fitGrade} />

          <p className="mt-5 text-[16px] leading-[1.4] font-medium text-text-secondary tracking-[-0.005em]">
            {data.summary}
          </p>
        </div>

        {/* Storm risk */}
        <StormBadge
          count={data.storm.count}
          primaryType={data.storm.primaryType}
          lastDate={data.storm.lastDate}
        />

        {/* Territory stats carousel */}
        <StatCarousel stats={ownerStats} />

        {/* Area lead history — sample */}
        <div className="px-6 pt-4 pb-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
              Area Lead History
            </span>
            <SampleBadge />
          </div>

          {sampleArea ? (
            <div className="bg-bg-surface border border-white/10 p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="font-display text-[32px] font-bold tnum leading-none block">{sampleArea.leads}</span>
                  <span className="text-[11px] text-text-secondary mt-1 block">Leads</span>
                </div>
                <div>
                  <span className="font-display text-[32px] font-bold tnum leading-none block">{sampleArea.closes}</span>
                  <span className="text-[11px] text-text-secondary mt-1 block">Closes</span>
                </div>
                <div>
                  <span
                    className="font-display text-[32px] font-bold tnum leading-none block"
                    style={{ color: closeRate != null && closeRate >= 35 ? '#22D070' : '#FAFAFD' }}
                  >
                    {closeRate}%
                  </span>
                  <span className="text-[11px] text-text-secondary mt-1 block">Close rate</span>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mt-4 text-center leading-[1.5]">
                Sample data — illustrative only. Connect CRM for real numbers.
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col items-center text-center px-6 py-7 gap-2"
              style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <span className="text-[14px] text-text-secondary">No sample data for this ZIP.</span>
              <span className="text-[12px] text-text-secondary opacity-60">Live data arrives when CRM is connected.</span>
            </div>
          )}
        </div>

        {/* CRM empty state */}
        <div className="px-6 pb-4">
          <div
            className="flex flex-col items-center text-center px-6 py-8 gap-3"
            style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
              Real-Time Close Rate
            </span>
            <span className="text-[13px] text-text-secondary leading-[1.5]">
              Actual close-rate data for this area arrives when your CRM is connected.
            </span>
            <span
              className="font-display text-[12px] font-bold tracking-[0.14em] uppercase px-4 py-2.5 mt-1"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#8A8694', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Connect CRM — Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
