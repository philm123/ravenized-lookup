'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeadCard, type SavedLead } from '@/components/LeadCard';

function BackIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 9l5-5 5 5M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const LEADS_KEY = 'momentum_saved_leads';

function getLeads(): SavedLead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function SavedPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [filter, setFilter] = useState<'all' | 'storm'>('all');
  const [exported, setExported] = useState(false);

  useEffect(() => {
    setLeads(getLeads());
  }, []);

  const filtered = filter === 'storm' ? leads.filter((l) => l.stormFlag) : leads;
  const stormCount = leads.filter((l) => l.stormFlag).length;

  const handleExport = () => {
    const text = leads
      .map((l) => `${l.zip} · ${l.state} · ${l.fitGrade} (${l.fitScore}/100)${l.stormSummary ? ' · ' + l.stormSummary : ''}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1.5 pb-2.5">
        <button
          onClick={() => router.push('/')}
          className="bg-transparent border-0 text-text-primary p-2 min-h-[40px] min-w-[40px] cursor-pointer"
        >
          <BackIcon />
        </button>
        <span className="font-display text-[13px] font-bold tracking-[0.12em] uppercase">
          Saved
        </span>
        <div className="w-10" />
      </div>

      {/* Count + filter */}
      <div className="px-6 pt-3.5 pb-4.5 border-b border-white/10">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[64px] font-bold tracking-[-0.04em] leading-[0.9] tnum">
            {leads.length}
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xs font-bold tracking-[0.16em] uppercase text-text-secondary">
              Leads saved
            </span>
            <span className="font-display text-xs font-bold tracking-[0.16em] uppercase text-text-secondary">
              This week
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 mt-4">
          {[
            { id: 'all' as const, label: `All · ${leads.length}` },
            { id: 'storm' as const, label: `Storm · ${stormCount}` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="px-3.5 py-2.5 min-h-[40px] font-display text-xs font-bold tracking-[0.12em] uppercase cursor-pointer"
              style={{
                background: filter === tab.id ? '#FAFAFD' : 'transparent',
                color: filter === tab.id ? '#08070C' : '#FAFAFD',
                border: filter === tab.id ? '1px solid #FAFAFD' : '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-text-secondary text-sm">
              {filter === 'storm' ? 'No storm leads saved yet.' : 'No leads saved yet.'}
            </span>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-5 py-2.5 bg-accent-blue text-white border-0 font-display text-xs font-bold tracking-[0.12em] uppercase cursor-pointer"
            >
              Start a Lookup
            </button>
          </div>
        ) : (
          filtered.map((lead) => (
            <LeadCard
              key={lead.zip + lead.savedAt}
              lead={lead}
              onClick={() => router.push(`/lookup/${lead.zip}`)}
            />
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 pt-3 pb-5 border-t border-white/10 bg-bg-primary flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 h-14 bg-white/6 text-text-primary border-0 cursor-pointer font-display text-[13px] font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ShareIcon /> {exported ? 'Copied!' : 'Export'}
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex-1 h-14 bg-accent-blue text-white border-0 cursor-pointer font-display text-[13px] font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-2"
        >
          <PlusIcon /> New Lookup
        </button>
      </div>
    </div>
  );
}
