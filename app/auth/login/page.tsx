'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase-browser';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/field';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === 'confirmation_failed' ? 'Confirmation failed. Try signing in directly.' : null
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const onboardingComplete = data.user?.user_metadata?.onboarding_complete ?? false;
    router.push(onboardingComplete ? redirect : '/auth/onboarding');
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary mb-2">
          Momentum
        </p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
          Sign in
        </h1>
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
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
            className="w-full h-14 px-4 border border-white/10 text-text-primary font-body text-[15px] focus:outline-none focus:border-accent-blue"
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 px-4 border border-white/10 text-text-primary font-body text-[15px] focus:outline-none focus:border-accent-blue"
            style={{ background: '#111016' }}
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-400/10 px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-accent-blue text-white border-0 font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-text-secondary text-[13px] text-center">
        No account yet?{' '}
        <Link href="/auth/signup" className="text-accent-blue underline-offset-2 underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
