'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase-browser';

// ─── PLACEHOLDER QUESTIONS ────────────────────────────────────────────────────
// These are scaffolded so the flow runs end to end.
// Replace the label, placeholder, and id fields with Raven's final questions.
const BRAND_QUESTIONS = [
  {
    id: 'service_area',
    label: '[PLACEHOLDER] Primary service markets',
    placeholder: 'e.g. Dallas-Fort Worth, Houston suburbs',
    required: false,
  },
  {
    id: 'value_prop',
    label: '[PLACEHOLDER] Primary value proposition',
    placeholder: 'e.g. Same-day estimates, lifetime warranty on labor',
    required: false,
  },
  {
    id: 'differentiator',
    label: '[PLACEHOLDER] What sets you apart from competitors?',
    placeholder: '',
    required: false,
  },
  {
    id: 'specialization',
    label: '[PLACEHOLDER] Roofing specialization',
    placeholder: 'e.g. storm restoration, new construction, commercial TPO',
    required: false,
  },
] as const;
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'org' | 'brand';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('org');
  const [orgName, setOrgName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // If onboarding is already complete (e.g. back-button), skip to app
  useEffect(() => {
    getBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) { router.push('/auth/login'); return; }
        if (user.user_metadata?.onboarding_complete) { router.push('/field'); return; }
        setChecking(false);
      });
  }, [router]);

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, answers }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Something went wrong. Try again.');
      return;
    }

    // Refresh the session so user_metadata update (onboarding_complete: true) is
    // reflected client-side without requiring a sign-out/sign-in cycle.
    await getBrowserClient().auth.refreshSession();

    router.push('/field');
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center flex-1">
        <span className="text-text-secondary text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-[430px]">
      {/* Progress */}
      <div className="flex gap-1.5">
        {(['org', 'brand'] as Step[]).map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1"
            style={{
              background: i === 0 || step === 'brand' ? '#1E63FF' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>

      {step === 'org' && (
        <div className="flex flex-col gap-8">
          <div>
            <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary mb-2">
              Step 1 of 2
            </p>
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
              Set up your company
            </h1>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-text-secondary">
              Company name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Apex Roofing Co."
              className="w-full h-14 px-4 border border-white/10 text-text-primary font-body text-[15px] focus:outline-none focus:border-accent-blue"
              style={{ background: '#111016' }}
            />
          </div>

          <button
            onClick={() => { if (orgName.trim()) setStep('brand'); }}
            disabled={!orgName.trim()}
            className="w-full h-14 bg-accent-blue text-white border-0 font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {step === 'brand' && (
        <div className="flex flex-col gap-8">
          <div>
            <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary mb-2">
              Step 2 of 2
            </p>
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
              Tell us about your brand
            </h1>
            <p className="text-text-secondary text-[13px] mt-2">
              All fields are optional — you can update these later.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {BRAND_QUESTIONS.map((q) => (
              <div key={q.id} className="flex flex-col gap-1.5">
                <label className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-text-secondary">
                  {q.label}
                </label>
                <input
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full h-14 px-4 border border-white/10 text-text-primary font-body text-[15px] focus:outline-none focus:border-accent-blue"
                  style={{ background: '#111016' }}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-400/10 px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('org')}
              className="h-14 px-6 border border-white/20 text-text-primary font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer"
              style={{ background: 'transparent' }}
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 h-14 bg-accent-blue text-white border-0 font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Finish setup'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
