import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    onboardingComplete: user.user_metadata?.onboarding_complete ?? false,
    orgId: profile?.org_id ?? null,
    role: profile?.role ?? null,
  });
}
