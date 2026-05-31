'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fmtMoney, fmtMoneyCompact, fmtPct, fmtNum } from '@/lib/format';

interface ZipProfile {
  zip: string;
  city: string | null;
  state: string;
  stateAbbrev: string;
  medianIncome: number | null;
  homeAge: number | null;
  ownerOccupancy: number | null;
  medianPropertyValue: number | null;
  pct10yrOwners: number | null;
  population: number | null;
  pctChildren: number | null;
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

const GRADE_COLORS: Record<string, { bg: string; fg: string }> = {
  'A+': { bg: '#D6308F', fg: '#fff' },
  A: { bg: '#1E63FF', fg: '#fff' },
  'B+': { bg: '#7B3CFF', fg: '#fff' },
  B: { bg: '#7B3CFF', fg: '#fff' },
  'C+': { bg: '#E8E5F0', fg: '#64607A' },
  C: { bg: '#E8E5F0', fg: '#64607A' },
  D: { bg: '#F5E6E6', fg: '#B04040' },
};

const CR_TAGS: { key: keyof ZipProfile['crCopy']; tag: string }[] = [
  { key: 'income', tag: 'OPENER' },
  { key: 'stability', tag: 'TENURE' },
  { key: 'occupancy', tag: 'OCCUPANCY' },
  { key: 'demo', tag: 'DECISION STYLE' },
  { key: 'family', tag: 'FAMILY' },
];

const RECENT_KEY = 'momentum_recent_lookups';
const LEADS_KEY = 'momentum_saved_leads';

function addRecent(data: ZipProfile) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((r: any) => r.zip !== data.zip);
    filtered.unshift({
      zip: data.zip,
      city: data.city,
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
    return (raw ? JSON.parse(raw) : []).some((l: any) => l.zip === zip);
  } catch { return false; }
}

function saveLead(data: ZipProfile) {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.some((l: any) => l.zip === data.zip)) return;
    arr.unshift({
      zip: data.zip,
      city: data.city,
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

function BackIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function StormIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l7-5 7 5V3z" /></svg>
  );
}

function SendIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  );
}

export default function PatternBProfile() {
  const params = useParams();
  const router = useRouter();
  const zip = params.zip as string;

  const [data, setData] = useState<ZipProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

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

  const copyText = (text: string, tag: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1E63FF', borderTopColor: 'transparent' }} />
          <span className="font-display text-sm font-medium" style={{ color: '#64607A' }}>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
        <span className="font-display text-3xl font-bold tnum" style={{ color: '#111016' }}>{zip}</span>
        <span className="text-center" style={{ color: '#64607A' }}>{error || 'Not found'}</span>
        <button
          onClick={() => router.push('/b')}
          className="mt-4 px-6 py-3 border-0 font-display text-sm font-bold tracking-[0.12em] uppercase cursor-pointer"
          style={{ background: '#1E63FF', color: '#fff', borderRadius: '12px' }}
        >
          New Lookup
        </button>
      </div>
    );
  }

  const gradeStyle = GRADE_COLORS[data.fitGrade] || { bg: '#E8E5F0', fg: '#64607A' };
  const location = [data.city, data.stateAbbrev || data.state].filter(Boolean).join(', ');

  const metrics = [
    { label: 'Median Income', value: fmtMoney(data.medianIncome), sub: 'Household' },
    { label: 'Property Value', value: fmtMoneyCompact(data.medianPropertyValue), sub: 'Median home' },
    { label: 'Owner Occupied', value: fmtPct(data.ownerOccupancy), sub: 'Of all units' },
    { label: '10+ Yr Owners', value: fmtPct(data.pct10yrOwners), sub: 'Long tenure' },
    { label: 'Home Age', value: data.homeAge != null ? data.homeAge + ' yrs' : '—', sub: 'Median' },
    { label: 'With Children', value: fmtPct(data.pctChildren), sub: 'Households' },
    { label: 'Population', value: fmtNum(data.population), sub: 'Residents' },
  ];

  const crSections = CR_TAGS
    .map((t) => ({ tag: t.tag, body: data.crCopy[t.key] }))
    .filter((s): s is { tag: string; body: string } => s.body != null);

  return (
    <div className="flex flex-col min-h-dvh pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          onClick={() => router.push('/b')}
          className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer font-display text-[12px] font-bold tracking-[0.14em] uppercase py-2 px-1"
          style={{ color: '#64607A' }}
        >
          <BackIcon /> Back
        </button>
      </div>

      {/* Synthesis card */}
      <div
        className="mx-4 px-5 pt-5 pb-5 mb-4"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
        }}
      >
        {/* Zip / City / Grade row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-[32px] font-bold tracking-[-0.02em] tnum" style={{ color: '#111016' }}>
                {data.zip}
              </span>
              <span
                className="font-display text-[13px] font-bold px-2.5 py-1"
                style={{ background: gradeStyle.bg, color: gradeStyle.fg, borderRadius: '8px' }}
              >
                {data.fitGrade}
              </span>
            </div>
            {location && (
              <span className="font-display text-[14px] font-medium mt-0.5 block" style={{ color: '#64607A' }}>
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Summary headline */}
        <p className="text-[16px] leading-[1.45] font-medium mt-2 mb-4" style={{ color: '#111016' }}>
          {data.summary}
        </p>

        {/* Fit + Storm row */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ background: '#F3F1F8', borderRadius: '10px' }}
          >
            <span className="font-display text-[22px] font-bold tnum" style={{ color: '#1E63FF' }}>
              {data.fitScore}
            </span>
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: '#64607A' }}>
              Fit
            </span>
          </div>

          {data.storm.count > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-2"
              style={{
                background: data.storm.count >= 3 ? '#FDF0F5' : '#F3F1F8',
                borderRadius: '10px',
                color: data.storm.count >= 3 ? '#D6308F' : '#64607A',
              }}
            >
              <StormIcon />
              <span className="font-display text-[13px] font-bold">
                {data.storm.count} {data.storm.primaryType || 'event'}{data.storm.count !== 1 ? 's' : ''}
              </span>
              {data.storm.lastDate && (
                <span className="text-[11px] font-medium ml-0.5" style={{ opacity: 0.7 }}>
                  · {new Date(data.storm.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          )}

          {data.storm.count === 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-2"
              style={{ background: '#F3F1F8', borderRadius: '10px' }}
            >
              <span className="text-[12px] font-medium" style={{ color: '#9994AB' }}>
                No storms · 90d
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-1 mb-5" style={{ background: 'linear-gradient(90deg, #1E63FF 0%, #7B3CFF 50%, #D6308F 100%)', borderRadius: '2px' }} />

      {/* Metric tile grid */}
      <div className="px-4 mb-6">
        <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase mb-3 block" style={{ color: '#9994AB' }}>
          Demographics
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="px-4 py-3.5"
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
              }}
            >
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase block mb-1" style={{ color: '#9994AB' }}>
                {m.label}
              </span>
              <span className="font-display text-[20px] font-bold tnum block" style={{ color: '#111016' }}>
                {m.value}
              </span>
              <span className="text-[11px] block mt-0.5" style={{ color: '#B0ADBF' }}>
                {m.sub}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CR Copy sections — all visible */}
      <div className="px-4 mb-6">
        <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase mb-3 block" style={{ color: '#9994AB' }}>
          Conversation Starters
        </span>
        <div className="flex flex-col gap-2.5">
          {crSections.map((s, i) => (
            <div
              key={s.tag}
              className="px-4 pt-3.5 pb-4"
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 flex items-center justify-center font-display text-[11px] font-bold"
                    style={{ background: '#1E63FF', color: '#fff', borderRadius: '6px' }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-display text-[12px] font-bold tracking-[0.1em] uppercase" style={{ color: '#111016' }}>
                    {s.tag}
                  </span>
                </div>
                <button
                  onClick={() => copyText(s.body, s.tag)}
                  className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer px-2 py-1"
                  style={{ color: copiedTag === s.tag ? '#22D070' : '#9994AB' }}
                >
                  {copiedTag === s.tag ? <CheckIcon /> : <CopyIcon />}
                  <span className="font-display text-[11px] font-bold tracking-[0.06em] uppercase">
                    {copiedTag === s.tag ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
              <p className="m-0 text-[15px] leading-[1.5] font-medium" style={{ color: '#3A3650' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-5 z-10"
        style={{ background: 'linear-gradient(0deg, #FBFAFE 70%, rgba(251,250,254,0) 100%)' }}
      >
        <div className="mx-auto max-w-[430px] flex gap-2.5">
          <button
            onClick={handleSave}
            className="flex-1 h-[52px] border-0 cursor-pointer font-display text-[14px] font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-2"
            style={{
              background: saved ? '#22D070' : '#1E63FF',
              color: '#fff',
              borderRadius: '12px',
            }}
          >
            {saved ? <><CheckIcon /> Saved</> : <><SaveIcon /> Save Lead</>}
          </button>
          <button
            className="h-[52px] px-5 border-0 cursor-pointer font-display text-[14px] font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-2"
            style={{
              background: '#111016',
              color: '#fff',
              borderRadius: '12px',
            }}
            onClick={() => {
              handleSave();
            }}
          >
            <SendIcon /> CRM
          </button>
        </div>
      </div>
    </div>
  );
}
