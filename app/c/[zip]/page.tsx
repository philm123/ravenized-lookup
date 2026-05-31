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

function GaugeScore({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 0.2;
  const totalArc = 2 * Math.PI - (startAngle - endAngle);
  const pct = Math.min(score / 100, 1);
  const scoreAngle = startAngle + totalArc * pct;

  const arcPath = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy - r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy - r * Math.sin(end);
    const sweep = end < start ? 1 : 0;
    const large = Math.abs(end - start) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
  };

  return (
    <div className="relative" style={{ width: size, height: size - 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E63FF" />
            <stop offset="50%" stopColor="#7B3CFF" />
            <stop offset="100%" stopColor="#D6308F" />
          </linearGradient>
        </defs>
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={arcPath(startAngle, scoreAngle)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 12 }}>
        <span className="font-display text-[40px] font-bold tnum leading-none" style={{ color: '#FAFAFD' }}>
          {score}
        </span>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase mt-1" style={{ color: 'rgba(250,250,253,0.4)' }}>
          Fit Score
        </span>
      </div>
    </div>
  );
}

function ProgressMetric({ label, value, display, max }: { label: string; value: number; display: string; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: 'rgba(250,250,253,0.4)' }}>
          {label}
        </span>
        <span className="font-display text-[15px] font-bold tnum" style={{ color: '#FAFAFD' }}>
          {display}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #1E63FF, #7B3CFF, #D6308F)',
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>
    </div>
  );
}

function CopyButton({ text, tag, copiedTag, onCopy }: { text: string; tag: string; copiedTag: string | null; onCopy: (text: string, tag: string) => void }) {
  const copied = copiedTag === tag;
  return (
    <button
      onClick={() => onCopy(text, tag)}
      className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer px-0 py-1 mt-3"
      style={{ color: copied ? '#22D070' : 'rgba(250,250,253,0.3)' }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied
          ? <path d="m5 12 5 5L20 7" />
          : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
        }
      </svg>
      <span className="font-display text-[10px] font-bold tracking-[0.12em] uppercase">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

export default function PatternCProfile() {
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
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7B3CFF', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
        <span className="font-display text-4xl font-bold tnum">{zip}</span>
        <span style={{ color: 'rgba(250,250,253,0.5)' }}>{error || 'Not found'}</span>
        <button
          onClick={() => router.push('/c')}
          className="mt-4 px-6 py-3 border-0 font-display text-sm font-bold tracking-[0.12em] uppercase cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1E63FF, #7B3CFF, #D6308F)', color: '#fff', borderRadius: '12px' }}
        >
          New Lookup
        </button>
      </div>
    );
  }

  const location = [data.city, data.stateAbbrev || data.state].filter(Boolean).join(', ');

  const crSections = CR_TAGS
    .map((t) => ({ tag: t.tag, body: data.crCopy[t.key] }))
    .filter((s): s is { tag: string; body: string } => s.body != null);

  const incomeMax = 200000;
  const propMax = 800000;

  return (
    <div className="flex flex-col min-h-dvh pb-28 relative">
      {/* Ambient gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-20%',
          width: '140%',
          height: '400px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(123,60,255,0.12) 0%, rgba(30,99,255,0.06) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 relative z-10">
        <button
          onClick={() => router.push('/c')}
          className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer py-2 px-1"
          style={{ color: 'rgba(250,250,253,0.5)' }}
        >
          <BackIcon />
        </button>
        <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: 'rgba(250,250,253,0.25)' }}>
          Raven
        </span>
      </div>

      {/* Cover: giant zip number */}
      <div className="relative z-10 px-6 pt-4 pb-2">
        <span
          className="font-display font-bold tnum block leading-none"
          style={{
            fontSize: '96px',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #1E63FF 0%, #7B3CFF 40%, #D6308F 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {data.zip}
        </span>
        {location && (
          <span className="font-display text-[14px] font-medium block mt-1" style={{ color: 'rgba(250,250,253,0.4)' }}>
            {location}
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="px-6 pt-3 pb-5 relative z-10">
        <p className="text-[17px] leading-[1.5] font-medium m-0" style={{ color: 'rgba(250,250,253,0.7)' }}>
          {data.summary}
        </p>
      </div>

      {/* Gauge + Storm row */}
      <div className="flex items-center justify-between px-6 pb-6 relative z-10">
        <GaugeScore score={data.fitScore} />

        <div className="flex flex-col items-end gap-2">
          {/* Grade */}
          <span
            className="font-display text-[14px] font-bold px-3 py-1.5"
            style={{
              background: data.fitGrade.startsWith('A')
                ? 'rgba(30,99,255,0.15)'
                : data.fitGrade === 'D'
                  ? 'rgba(214,48,143,0.15)'
                  : 'rgba(123,60,255,0.15)',
              color: data.fitGrade.startsWith('A')
                ? '#5A9FFF'
                : data.fitGrade === 'D'
                  ? '#E86AAF'
                  : '#A87FFF',
              borderRadius: '8px',
            }}
          >
            Grade {data.fitGrade}
          </span>

          {/* Storm */}
          {data.storm.count > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: 'rgba(214,48,143,0.1)', borderRadius: '8px' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D6308F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="text-[12px] font-bold" style={{ color: '#E86AAF' }}>
                {data.storm.count} event{data.storm.count !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <span className="text-[12px] font-medium px-3 py-1.5" style={{ color: 'rgba(250,250,253,0.25)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              No storms · 90d
            </span>
          )}
        </div>
      </div>

      {/* Gradient divider */}
      <div className="mx-6 h-1 mb-6" style={{ background: 'linear-gradient(90deg, #1E63FF 0%, #7B3CFF 50%, #D6308F 100%)', borderRadius: '2px' }} />

      {/* Progress bar metrics */}
      <div className="px-6 mb-6 relative z-10">
        <ProgressMetric label="Median Income" value={data.medianIncome || 0} display={fmtMoney(data.medianIncome)} max={incomeMax} />
        <ProgressMetric label="Property Value" value={data.medianPropertyValue || 0} display={fmtMoneyCompact(data.medianPropertyValue)} max={propMax} />
        <ProgressMetric label="Owner Occupied" value={(data.ownerOccupancy || 0) * 100} display={fmtPct(data.ownerOccupancy)} max={100} />
        <ProgressMetric label="10+ Yr Owners" value={(data.pct10yrOwners || 0) * 100} display={fmtPct(data.pct10yrOwners)} max={100} />
        <ProgressMetric label="Home Age" value={data.homeAge || 0} display={data.homeAge != null ? data.homeAge + ' yrs' : '—'} max={80} />
        <ProgressMetric label="Children" value={(data.pctChildren || 0) * 100} display={fmtPct(data.pctChildren)} max={100} />
        <ProgressMetric label="Population" value={data.population || 0} display={fmtNum(data.population)} max={100000} />
      </div>

      {/* Gradient divider */}
      <div className="mx-6 h-1 mb-6" style={{ background: 'linear-gradient(90deg, #1E63FF 0%, #7B3CFF 50%, #D6308F 100%)', borderRadius: '2px' }} />

      {/* CR Copy — pull-quote style */}
      <div className="px-6 mb-8 relative z-10">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase block mb-5" style={{ color: 'rgba(250,250,253,0.25)' }}>
          Conversation Scripts
        </span>

        {crSections.map((s) => (
          <div key={s.tag} className="mb-6">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase block mb-2" style={{ color: 'rgba(250,250,253,0.3)' }}>
              {s.tag}
            </span>
            <div className="relative pl-5">
              <span
                className="absolute left-0 top-[-4px] font-display leading-none select-none"
                style={{
                  fontSize: '32px',
                  background: 'linear-gradient(135deg, #1E63FF, #7B3CFF, #D6308F)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                &#10077;
              </span>
              <p className="m-0 text-[16px] leading-[1.55] font-medium" style={{ color: 'rgba(250,250,253,0.7)' }}>
                {s.body}
              </p>
              <CopyButton text={s.body} tag={s.tag} copiedTag={copiedTag} onCopy={copyText} />
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-5 pb-6 z-20"
        style={{ background: 'linear-gradient(0deg, #06050B 65%, rgba(6,5,11,0) 100%)' }}
      >
        <div className="mx-auto max-w-[430px]">
          <button
            onClick={handleSave}
            className="w-full h-[56px] border-0 cursor-pointer font-display text-[14px] font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2.5"
            style={{
              background: saved
                ? '#22D070'
                : 'linear-gradient(135deg, #1E63FF 0%, #7B3CFF 50%, #D6308F 100%)',
              color: '#fff',
              borderRadius: '14px',
            }}
          >
            {saved ? (
              <>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                Saved
              </>
            ) : (
              <>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                Save + Share with team
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
