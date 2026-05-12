'use client';

import { useState } from 'react';

interface CrCopySection {
  id: string;
  tag: string;
  body: string;
}

function ChevronDown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function CrCopyAccordion({ sections }: { sections: CrCopySection[] }) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div className="pt-3.5 pb-28">
      <div className="px-6 pb-3">
        <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary">
          CR Copy · Tap to open
        </span>
      </div>

      {sections.map((s, i) => {
        const isOpen = openId === s.id;
        return (
          <div key={s.id} className="border-t border-white/10" style={i === sections.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.1)' } : undefined}>
            <button
              onClick={() => setOpenId(isOpen ? null : s.id)}
              className="w-full text-left px-6 py-4.5 min-h-[60px] grid grid-cols-[auto_1fr_auto] gap-3 items-center text-text-primary"
            >
              <span
                className="w-7 h-7 flex items-center justify-center font-display text-sm font-bold"
                style={{ background: isOpen ? '#1E63FF' : 'rgba(255,255,255,0.06)', color: isOpen ? '#fff' : '#FAFAFD' }}
              >
                {i + 1}
              </span>
              <span className="font-display text-[15px] font-bold tracking-[0.06em] uppercase">
                {s.tag}
              </span>
              <span className="text-text-secondary transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                <ChevronDown />
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-5 flex flex-col gap-3.5">
                <p className="m-0 text-[17px] leading-[1.45] text-text-primary font-medium tracking-[-0.005em]">
                  {s.body}
                </p>
                <button
                  onClick={() => copyText(s.body, s.id)}
                  className="border border-white/20 bg-transparent text-text-primary px-4 py-3.5 flex items-center justify-between gap-2.5 font-display text-xs font-bold tracking-[0.14em] uppercase min-h-[48px]"
                >
                  {copiedId === s.id ? (
                    <>Copied <CheckIcon /></>
                  ) : (
                    <>Copy script <CopyIcon /></>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
