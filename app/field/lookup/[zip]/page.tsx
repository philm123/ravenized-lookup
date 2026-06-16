'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FitScoreBadge } from '@/components/FitScoreBadge';
import { StormBadge } from '@/components/StormBadge';
import { StatCarousel } from '@/components/StatCarousel';
import { CrCopyAccordion } from '@/components/CrCopyAccordion';
import { RoleChip } from '@/components/RoleChip';
import { NeedHelpCTA } from '@/components/NeedHelpCTA';

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

function GpsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
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

async function isLeadSaved(zip: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/leads?zip=${encodeURIComponent(zip)}`);
    if (!res.ok) return false;
    const json = await res.json();
    return json.leads.length > 0;
  } catch { return false; }
}

async function saveLead(data: ZipProfile): Promise<string | null> {
  const stormSummary = data.storm.count > 0
    ? `${data.storm.count} ${data.storm.primaryType || 'storm'} · ${data.storm.lastDate ? new Date(data.storm.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
    : null;

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zip: data.zip,
        stateAbbrev: data.stateAbbrev || data.state,
        fitScore: data.fitScore,
        fitGrade: data.fitGrade,
        stormFlag: data.storm.count >= 3,
        stormSummary,
      }),
    });
    const json = await res.json();
    return (json.lead?.id as string) ?? null;
  } catch { return null; }
}

interface SellWatchPair {
  category: string;
  sell: string;
  watch: string;
}

function getSellWatchPairs(data: ZipProfile): SellWatchPair[] {
  const pairs: SellWatchPair[] = [];

  if (data.crCopy.income != null) {
    const inc = data.medianIncome != null ? fmtMoneyCompact(data.medianIncome) : null;
    pairs.push({
      category: 'INCOME',
      sell: inc
        ? `Median income ${inc} supports a full replacement job. Skip the patch-only frame.`
        : 'This income bracket supports a full replacement job. Skip the patch-only frame.',
      watch: 'Have a payment-plan option ready. Avoid quoting the full number before they see the value.',
    });
  }

  if (data.crCopy.stability != null) {
    const tenure = data.pct10yrOwners != null
      ? fmtPct(data.pct10yrOwners) + ' own 10+ years'
      : 'Long-tenure owners here';
    pairs.push({
      category: 'STABILITY',
      sell: `${tenure}. They are invested in this property and want the job done right.`,
      watch: 'Long-tenure owners deliberate slowly. Nail down a callback time before you leave the door.',
    });
  }

  if (data.crCopy.occupancy != null) {
    const occ = data.ownerOccupancy != null
      ? fmtPct(data.ownerOccupancy) + ' owner-occupied'
      : 'High owner-occupancy';
    pairs.push({
      category: 'OCCUPANCY',
      sell: `${occ}. Whoever answers the door almost certainly owns the home.`,
      watch: 'Remaining rentals mean some doors go nowhere. Read ownership cues in the first 30 seconds.',
    });
  }

  if (data.crCopy.demo != null) {
    pairs.push({
      category: 'DECISION STYLE',
      sell: 'Lead with credentials, before/after photos, and warranty terms. This crowd does their homework.',
      watch: 'Expect comparison shopping. Try to be the last estimate they get before they decide.',
    });
  }

  if (data.crCopy.family != null) {
    const kids = data.pctChildren != null
      ? fmtPct(data.pctChildren) + ' of households have kids'
      : 'Family-heavy area';
    pairs.push({
      category: 'FAMILY',
      sell: `${kids}. Frame the job around safety and protecting what matters most to them.`,
      watch: 'Both spouses often decide together. If one is not home, set a specific return time.',
    });
  }

  return pairs;
}

function SellWatchBlock({ data }: { data: ZipProfile }) {
  const pairs = getSellWatchPairs(data);
  if (pairs.length === 0) return null;

  return (
    <div className="mx-6 mt-6 mb-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <div
        className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: '#1A1820', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span
          className="font-display text-[11px] font-bold tracking-[0.16em] uppercase"
          style={{ color: '#FAFAFD' }}
        >
          Sell This · Watch Out
        </span>
        <span
          className="font-display text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-1 shrink-0"
          style={{
            background: 'rgba(214,48,143,0.12)',
            color: '#D6308F',
            border: '1px solid rgba(214,48,143,0.25)',
          }}
        >
          Placeholder · pending Raven review
        </span>
      </div>
      {pairs.map((pair, i) => (
        <div
          key={pair.category}
          className="px-4 py-3.5"
          style={{
            background: '#111016',
            borderBottom: i < pairs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}
        >
          <span
            className="font-display text-[10px] font-bold tracking-[0.18em] uppercase block mb-3"
            style={{ color: '#8A8694' }}
          >
            {pair.category}
          </span>
          <div className="flex gap-3 mb-2.5">
            <span
              className="font-display text-[14px] font-bold shrink-0 leading-[1.3]"
              style={{ color: '#22D070' }}
            >
              +
            </span>
            <span className="text-[13px] leading-[1.45]" style={{ color: '#FAFAFD' }}>
              {pair.sell}
            </span>
          </div>
          <div className="flex gap-3">
            <span
              className="font-display text-[14px] font-bold shrink-0 leading-[1.3]"
              style={{ color: '#D6308F' }}
            >
              !
            </span>
            <span className="text-[13px] leading-[1.45]" style={{ color: '#8A8694' }}>
              {pair.watch}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FieldLookupPage() {
  const params = useParams();
  const router = useRouter();
  const zip = params.zip as string;

  const [data, setData] = useState<ZipProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSaved, setLocationSaved] = useState(false);
  const [personalized, setPersonalized] = useState<{
    fitScore: number;
    fitGrade: string;
    personalizedBy: string[];
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPersonalized(null);

    const baseReq = fetch(`/api/lookup/${zip}`).then((res) => {
      if (!res.ok) throw new Error(res.status === 404 ? 'Zip code not found' : 'Lookup failed');
      return res.json() as Promise<ZipProfile>;
    });
    const personReq = fetch(`/api/personalized-score/${zip}`)
      .then((res) => res.json())
      .catch(() => null);

    Promise.all([baseReq, personReq])
      .then(async ([d, p]) => {
        setData(d);
        addRecent(d);
        setSaved(await isLeadSaved(d.zip));
        if (p?.isPersonalized) {
          setPersonalized({
            fitScore: p.fitScore,
            fitGrade: p.fitGrade,
            personalizedBy: p.personalizedBy,
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [zip]);

  const handleSave = async () => {
    if (!data) return;
    const id = await saveLead({
      ...data,
      fitScore: personalized?.fitScore ?? data.fitScore,
      fitGrade: personalized?.fitGrade ?? data.fitGrade,
    });
    setSaved(true);
    if (id) setSavedLeadId(id);
  };

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setGpsCoords({ lat, lng: lon });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'User-Agent': 'Momentum/1.0' } },
          );
          const geo = await res.json();
          const num = geo.address?.house_number ?? '';
          const road = geo.address?.road ?? '';
          setAddress([num, road].filter(Boolean).join(' ') || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
    );
  };

  const handleSaveLocation = async () => {
    if (!savedLeadId) return;
    await fetch(`/api/leads/${savedLeadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streetAddress: address || undefined,
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng,
        notes: notes || undefined,
      }),
    });
    setLocationSaved(true);
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
          onClick={() => router.push('/field')}
          className="mt-4 px-6 py-3 bg-accent-blue text-white border-0 font-display text-sm font-bold tracking-[0.12em] uppercase cursor-pointer"
        >
          New Lookup
        </button>
      </div>
    );
  }

  const displayFitScore = personalized?.fitScore ?? data.fitScore;
  const displayFitGrade = personalized?.fitGrade ?? data.fitGrade;

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
      <div className="flex items-center justify-between px-4 pt-2 pb-2.5 shrink-0">
        <button
          onClick={() => router.push('/field')}
          className="flex items-center gap-1 px-1 py-2 bg-transparent border-0 text-text-primary cursor-pointer font-display text-xs font-bold tracking-[0.16em] uppercase min-h-[40px]"
        >
          <BackIcon /> BACK
        </button>
        <RoleChip role="field" />
        <button
          onClick={handleSave}
          className="bg-transparent border-0 p-2 cursor-pointer min-h-[40px] min-w-[40px]"
          style={{ color: saved ? '#1E63FF' : '#FAFAFD' }}
        >
          <BookmarkIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
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

          {personalized && (
            <p className="font-display text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: '#7B3CFF' }}>
              Personalized for your brand
            </p>
          )}
          <FitScoreBadge score={displayFitScore} grade={displayFitGrade} />

          <p className="mt-5 text-[17px] leading-[1.35] font-medium text-text-primary tracking-[-0.005em]">
            {data.summary}
          </p>
        </div>

        <StormBadge
          count={data.storm.count}
          primaryType={data.storm.primaryType}
          lastDate={data.storm.lastDate}
          events={data.storm.events}
          zip={data.zip}
        />

        <StatCarousel stats={stats} />

        <CrCopyAccordion sections={crSections} />
        <SellWatchBlock data={data} />

        {saved && savedLeadId && (
          <div className="mx-6 mt-6 mb-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <div
              className="px-4 py-3"
              style={{ background: '#1A1820', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span
                className="font-display text-[11px] font-bold tracking-[0.16em] uppercase"
                style={{ color: '#FAFAFD' }}
              >
                Location & Notes
              </span>
            </div>
            <div className="px-4 py-4" style={{ background: '#111016' }}>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  className="flex-1 h-10 px-3 border-0 font-display text-[13px] outline-none text-text-primary"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  onClick={handleGps}
                  disabled={gpsLoading}
                  className="h-10 px-3 border-0 cursor-pointer font-display text-[11px] font-bold tracking-[0.12em] uppercase flex items-center gap-1.5"
                  style={{
                    background: gpsLoading ? 'rgba(255,255,255,0.04)' : 'rgba(30,99,255,0.12)',
                    color: '#1E63FF',
                  }}
                >
                  <GpsIcon size={14} />
                  {gpsLoading ? '...' : 'GPS'}
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes — condition, objection, callback time..."
                rows={2}
                className="w-full px-3 py-2.5 border-0 font-display text-[13px] outline-none text-text-primary resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={handleSaveLocation}
                disabled={locationSaved}
                className="mt-3 w-full h-10 border-0 cursor-pointer font-display text-[12px] font-bold tracking-[0.12em] uppercase"
                style={{
                  background: locationSaved ? 'rgba(34,208,112,0.12)' : 'rgba(255,255,255,0.06)',
                  color: locationSaved ? '#22D070' : '#FAFAFD',
                }}
              >
                {locationSaved ? 'Location Saved' : 'Save Location'}
              </button>
            </div>
          </div>
        )}

        <NeedHelpCTA />
        <div className="h-28" />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-5 flex gap-2 z-10"
        style={{ background: 'linear-gradient(0deg, #08070C 60%, rgba(8,7,12,0) 100%)' }}
      >
        <div className="mx-auto max-w-[430px] w-full flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 h-[60px] border-0 cursor-pointer font-display text-[15px] font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-2"
            style={{ background: saved ? '#22D070' : '#1E63FF', color: '#fff' }}
          >
            {saved ? <><CheckIcon /> Saved</> : <><BookmarkIcon size={18} /> Save Lead</>}
          </button>
          <button
            onClick={() => router.push('/field/saved')}
            className="h-[60px] px-4 border-0 cursor-pointer font-display text-[13px] font-bold tracking-[0.1em] uppercase flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#FAFAFD' }}
          >
            Saved
          </button>
        </div>
      </div>
    </div>
  );
}
