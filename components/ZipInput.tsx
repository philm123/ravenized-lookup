'use client';

interface ZipInputProps {
  zip: string;
  onPress: (key: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

function ArrowIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];

export function ZipInput({ zip, onPress, onClear, onSubmit }: ZipInputProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pt-5 pb-4">
        <div className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary mb-2.5">
          Enter ZIP
        </div>
        <div className="flex items-center justify-between gap-3">
          <div
            className="font-display text-[88px] font-bold leading-[0.85] tracking-[-0.04em] tnum flex-1 min-w-0"
            style={{ color: zip ? '#FAFAFD' : 'rgba(255,255,255,0.18)' }}
          >
            {zip || '00000'}
          </div>
          <button
            onClick={onSubmit}
            disabled={zip.length !== 5}
            className="shrink-0 w-16 h-16 border-0 flex items-center justify-center transition-colors duration-150"
            style={{
              background: zip.length === 5 ? '#1E63FF' : 'rgba(255,255,255,0.06)',
              color: zip.length === 5 ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: zip.length === 5 ? 'pointer' : 'default',
            }}
          >
            <ArrowIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 px-3 pb-3 flex flex-col min-h-0">
        <div className="flex-1 grid grid-cols-3 gap-1.5" style={{ gridAutoRows: '1fr', minHeight: 280 }}>
          {KEYS.map((k) => {
            const isAction = k === 'clr' || k === 'del';
            return (
              <button
                key={k}
                onClick={() => k === 'clr' ? onClear() : onPress(k)}
                className="border-0 flex items-center justify-center min-h-[56px] transition-colors duration-100 active:brightness-125"
                style={{
                  background: isAction ? 'rgba(255,255,255,0.04)' : '#111016',
                  color: isAction ? '#8A8694' : '#FAFAFD',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isAction ? 700 : 500,
                  fontSize: isAction ? 13 : 30,
                  letterSpacing: isAction ? '0.18em' : '-0.01em',
                  textTransform: isAction ? 'uppercase' : 'none',
                  cursor: 'pointer',
                }}
              >
                {k === 'del' ? '⌫' : k === 'clr' ? 'CLEAR' : k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
