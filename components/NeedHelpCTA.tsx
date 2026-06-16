'use client';

const CTA_ACTION = 'mailto:hello@ravenized.com';

interface NeedHelpCTAProps {
  headline?: string;
  subline?: string;
}

export function NeedHelpCTA({
  headline = 'Need help closing?',
  subline = 'Ravenized reps can walk you through the pitch and help you win the job.',
}: NeedHelpCTAProps) {
  return (
    <a
      href={CTA_ACTION}
      className="block mx-6 my-5 px-5 py-4 no-underline"
      style={{ background: '#1A1820', border: '1px solid rgba(123,60,255,0.3)' }}
    >
      <span
        className="font-display text-[10px] font-bold tracking-[0.2em] uppercase block mb-2"
        style={{ color: '#7B3CFF' }}
      >
        Get Help
      </span>
      <span
        className="font-display text-[18px] font-bold block leading-[1.2] tracking-[-0.01em]"
        style={{ color: '#FAFAFD' }}
      >
        {headline}
      </span>
      {subline && (
        <span className="text-[13px] block mt-1.5 leading-[1.4]" style={{ color: '#8A8694' }}>
          {subline}
        </span>
      )}
      <span
        className="mt-4 inline-block font-display text-[11px] font-bold tracking-[0.14em] uppercase px-4 py-2.5"
        style={{ background: '#7B3CFF', color: '#fff' }}
      >
        Talk to Raven
      </span>
    </a>
  );
}
