'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FitScoreBadge } from '@/components/FitScoreBadge';
import { StormBadge } from '@/components/StormBadge';
import { StatCarousel } from '@/components/StatCarousel';
import { CrCopyAccordion } from '@/components/CrCopyAccordion';

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
  avgCommute: number | null;
  pctMgmt: number | null;
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

function fmtMoney(n: number | null): string {
  if (n == null) return '—';
  return '$' + n.toLocaleString('en-US');
}
function fmtMoneyCompact(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
  return '$' + n;
}
function fmtPct(n: number | null): string {
  if (n == null) return '—';
  return Math.round(n * 100) + '%';
}
function fmtNum(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

function BackIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function BookmarkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l7-5 7 5V3z" /></svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

const RECENT_KEY = 'momentum_recent_lookups';
const LEADS_KEY = 'momentum_saved_leads';

function addRecent(data: ZipProfile) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((r: any) => r.zip !== data.zip);
    filtered.unshift({
      zip: data.zip,
      state: data.stateAbbrev || data.state,
      fitGrade: data.fitGrade,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 7)));
  } catch {}
}

function isLeadSaved(zip: string): boolean {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return arr.some((l: any) => l.zip === zip);
  } catch { return false; }
}

function saveLead(data: ZipProfile) {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.some((l: any) => l.zip === data.zip)) return;
    arr.unshift({
      zip: data.zip,
      state: data.stateAbbrev || data.state,
      fitScore: data.fitScore,
      fitGrade: data.fitGrade,
      stormFlag: data.storm.count >= 3,
      stormSummary: data.storm.count > 0
        ? `${data.storm.count} ${data.storm.primaryType || 'storm'} · ${data.storm.lastDate ? new Date(data.storm.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
        : null,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(LEADS_KEY, JSON.stringify(arr));
  } catch {}
}

export default function LookupPage() {
  const params = useParams();
  const router = useRouter();
  const zip = params.zip as string;

  const [data, setData] = useState<ZipProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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
        setSaved(isLeadSaved(d.zip));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [zip]);

  const handleSave = () => {
    if (!data) return;
    saveLead(data);
    setSaved(true);
  };

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
          onClick={() => router.push('/')}
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
          onClick={() => router.push('/')}
          className="flex items-center gap-1 px-1 py-2 bg-transparent border-0 text-text-primary cursor-pointer font-display text-xs font-bold tracking-[0.16em] uppercase min-h-[40px]"
        >
          <BackIcon /> BACK
        </button>
        <button
          onClick={handleSave}
          className="bg-transparent border-0 p-2 cursor-pointer min-h-[40px] min-w-[40px]"
          style={{ color: saved ? '#1E63FF' : '#FAFAFD' }}
        >
          <BookmarkIcon />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Hero: zip + fit score */}
        <div
          className="px-6 pt-5 pb-7 border-b border-white/20 relative"
          style={{ background: 'linear-gradient(180deg, rgba(30,99,255,0.08) 0%, rgba(0,0,0,0) 100%)' }}
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

          <p className="mt-5 text-[17px] leading-[1.35] font-medium text-text-primary tracking-[-0.005em]">
            {data.summary}
          </p>
        </div>

        {/* Storm section */}
        <StormBadge
          count={data.storm.count}
          primaryType={data.storm.primaryType}
          lastDate={data.storm.lastDate}
        />

        {/* Stats carousel */}
        <StatCarousel stats={stats} />

        {/* CR Copy accordion */}
        <CrCopyAccordion sections={crSections} />
      </div>

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-5 flex gap-2 z-10"
        style={{ background: 'linear-gradient(0deg, #08070C 60%, rgba(8,7,12,0) 100%)' }}
      >
        <div className="mx-auto max-w-[430px] w-full">
          <button
            onClick={handleSave}
            className="w-full h-[60px] border-0 cursor-pointer font-display text-[15px] font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-2"
            style={{ background: saved ? '#22D070' : '#1E63FF', color: '#fff' }}
          >
            {saved ? <><CheckIcon /> Saved</> : <><BookmarkIcon size={18} /> Save Lead</>}
          </button>
        </div>
      </div>
    </div>
  );
}
