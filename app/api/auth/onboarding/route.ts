import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    orgName: string;
    answers: Record<string, string>;
  };

  if (!body.orgName?.trim()) {
    return NextResponse.json({ error: 'orgName is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // idempotent: skip if profile already exists
  const { data: existing } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ orgId: existing.org_id, duplicate: true });
  }

  // 1. Create org
  const { data: org, error: orgErr } = await admin
    .from('orgs')
    .insert({ name: body.orgName.trim() })
    .select()
    .single();
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });

  // 2. Create profile
  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: user.id, org_id: org.id });
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  // 3. Create brand with answers
  const { error: brandErr } = await admin
    .from('brands')
    .insert({
      org_id: org.id,
      company_name: body.orgName.trim(),
      answers: body.answers,
      onboarding_complete: true,
    });
  if (brandErr) return NextResponse.json({ error: brandErr.message }, { status: 500 });

  // 4. Flag user metadata so the session carries onboarding state
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { onboarding_complete: true },
  });

  return NextResponse.json({ orgId: org.id }, { status: 201 });
}
