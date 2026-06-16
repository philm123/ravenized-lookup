'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase-browser';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'check-email'>('form');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getBrowserClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/auth/onboarding`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // email confirmation disabled — go straight to onboarding
      router.push('/auth/onboarding');
    } else {
      // email confirmation required
      setStep('check-email');
    }
  };

  if (step === 'check-email') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary mb-2">
            Momentum
          </p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
            Check your email
          </h1>
        </div>
        <p className="text-text-secondary text-[15px] leading-relaxed">
          We sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
          Click it to finish setting up your account.
        </p>
        <p className="text-text-secondary text-[13px]">
          Already confirmed?{' '}
          <Link href="/auth/login" className="text-accent-blue underline-offset-2 underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary mb-2">
          Momentum
        </p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
          Create account
        </h1>
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-text-secondary">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 px-4 bg-bg-surface border border-white/10 text-text-primary font-body text-[15px] focus:outline-none focus:border-accent-blue"
            style={{ background: '#111016' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-text-secondary">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 px-4 bg-bg-surface border border-white/10 text-text-primary font-body text-[15px] focus:outline-none focus:border-accent-blue"
            style={{ background: '#111016' }}
          />
          <span className="text-[11px] text-text-secondary">Min 8 characters</span>
        </div>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-400/10 px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-accent-blue text-white border-0 font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-text-secondary text-[13px] text-center">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-accent-blue underline-offset-2 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
