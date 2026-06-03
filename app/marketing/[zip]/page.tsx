'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FitScoreBadge } from '@/components/FitScoreBadge';
import { StormBadge } from '@/components/StormBadge';
import { StatCarousel } from '@/components/StatCarousel';
import { CrCopyAccordion } from '@/components/CrCopyAccordion';
import { RoleChip } from '@/components/RoleChip';
import { deriveMarketingOutput } from '@/lib/marketing-rules';
import type { MarketingOutput } from '@/lib/marketing-rules';
import { fmtMoney, fmtMoneyCompact, fmtPct, fmtNum } from '@/lib/format';

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[11px] font-bold tracking-[0.22em] uppercase text-text-secondary block mb-3">
      {children}
    </span>
  );
}

function PriorityDot({ priority }: { priority: 'primary' | 'secondary' }) {
  return (
    <span
      className="shrink-0 w-2 h-2 rounded-full mt-1.5"
      style={{ background: priority === 'primary' ? '#1E63FF' : 'rgba(255,255,255,0.25)' }}
    />
  );
}

function FitChip({ fit }: { fit: 'strong' | 'moderate' }) {
  return (
    <span
      className="font-display text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 shrink-0"
      style={{
        background: fit === 'strong' ? 'rgba(30,99,255,0.15)' : 'rgba(255,255,255,0.06)',
        color: fit === 'strong' ? '#5A9FFF' : '#8A8694',
      }}
    >
      {fit === 'strong' ? 'Strong fit' : 'Moderate'}
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

export default function MarketingLookupPage() {
  const params = useParams();
  const router = useRouter();
  const zip = params.zip as string;

  const [data, setData] = useState<ZipProfile | null>(null);
  const [mktg, setMktg] = useState<MarketingOutput | null>(null);
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
        setMktg(deriveMarketingOutput({
          medianPropertyValue: d.medianPropertyValue,
          medianIncome: d.medianIncome,
          homeAge: d.homeAge,
          ownerOccupancy: d.ownerOccupancy,
          pct10yrOwners: d.pct10yrOwners,
          pctDegree: d.pctDegree,
          pctMgmt: d.pctMgmt,
          pctChildren: d.pctChildren,
          stormCount: d.storm.count,
        }));
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

  if (error || !data || !mktg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
        <span className="font-display text-2xl font-bold text-text-primary">{zip}</span>
        <span className="text-text-secondary text-center">{error || 'Not found'}</span>
        <button
          onClick={() => router.push('/marketing')}
          className="mt-4 px-6 py-3 bg-accent-blue text-white border-0 font-display text-sm font-bold tracking-[0.12em] uppercase cursor-pointer"
        >
          New Lookup
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Median Income', value: fmtMoney(data.medianIncome), sub: 'Household, USD' },
    { label: 'Property Value', value: fmtMoneyCompact(data.medianPropertyValue), sub: 'Median home' },
    { label: 'Owner Occupied', value: fmtPct(data.ownerOccupancy), sub: 'Of all units' },
    { label: '10+ Yr Owners', value: fmtPct(data.pct10yrOwners), sub: 'Long tenure' },
    { label: 'Home Age', value: data.homeAge != null ? data.homeAge + ' yrs' : '—', sub: 'Median, built' },
    { label: 'With Children', value: fmtPct(data.pctChildren), sub: 'Households' },
    { label: 'Population', value: fmtNum(data.population), sub: 'Residents' },
  ];

  const crSections = [
    { id: 'opener', tag: 'OPENER', body: data.crCopy.income },
    { id: 'tenure', tag: 'TENURE', body: data.crCopy.stability },
    { id: 'occupancy', tag: 'OCCUPANCY', body: data.crCopy.occupancy },
    { id: 'decision', tag: 'DECISION STYLE', body: data.crCopy.demo },
    { id: 'family', tag: 'FAMILY', body: data.crCopy.family },
  ].filter((s) => s.body != null) as { id: string; tag: string; body: string }[];

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2.5 shrink-0">
        <button
          onClick={() => router.push('/marketing')}
          className="flex items-center gap-1 px-1 py-2 bg-transparent border-0 text-text-primary cursor-pointer font-display text-xs font-bold tracking-[0.16em] uppercase min-h-[40px]"
        >
          <BackIcon /> BACK
        </button>
        <RoleChip role="marketing" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-8">
        {/* Hero */}
        <div
          className="px-6 pt-5 pb-7 border-b border-white/20 relative"
          style={{ background: 'linear-gradient(180deg, rgba(123,60,255,0.08) 0%, rgba(0,0,0,0) 100%)' }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <span className="font-display text-4xl font-bold tracking-[-0.02em] tnum">
              {data.zip}
            </span>
            <span className="font-display text-xs font-bold tracking-[0.16em] uppercase text-text-secondary">
              {data.stateAbbrev || data.state}
            </span>
          </div>

          <FitScoreBadge score={data.fitScore} grade={data.fitGrade} />

          <p className="mt-4 text-[14px] leading-[1.4] text-text-secondary font-medium tracking-[0.01em]">
            {mktg.audienceSummary}
          </p>
        </div>

        {/* Storm */}
        <StormBadge
          count={data.storm.count}
          primaryType={data.storm.primaryType}
          lastDate={data.storm.lastDate}
        />

        {/* Promotions */}
        <div className="px-6 pt-5 pb-4 border-b border-white/10">
          <SectionLabel>Promotions · Likely to Work</SectionLabel>
          <div className="flex flex-col gap-3">
            {mktg.promotions.map((p, i) => (
              <div key={i} className="flex gap-3 bg-bg-surface border border-white/10 p-4">
                <PriorityDot priority={p.priority} />
                <div className="flex-1 min-w-0">
                  <span className="font-display text-[14px] font-bold tracking-[-0.005em] block">
                    {p.headline}
                  </span>
                  <span className="text-[13px] text-text-secondary leading-[1.45] mt-1 block">
                    {p.rationale}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-secondary mt-3 leading-[1.5]">
            These are v1 heuristics — transparent defaults for Raven review.
          </p>
        </div>

        {/* Ad Avenues */}
        <div className="px-6 pt-5 pb-4 border-b border-white/10">
          <SectionLabel>Ad Avenues · Recommended Channels</SectionLabel>
          <div className="flex flex-col gap-3">
            {mktg.adAvenues.map((av, i) => (
              <div key={i} className="flex gap-3 items-start bg-bg-surface border border-white/10 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-display text-[14px] font-bold tracking-[-0.005em]">
                      {av.channel}
                    </span>
                    <FitChip fit={av.fit} />
                  </div>
                  <span className="text-[13px] text-text-secondary leading-[1.45] block">
                    {av.rationale}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographic snapshot */}
        <StatCarousel stats={stats} />

        {/* Messaging */}
        <CrCopyAccordion sections={crSections} />
      </div>
    </div>
  );
}
