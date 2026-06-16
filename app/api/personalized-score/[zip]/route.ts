import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { lookupZip } from '@/lib/db';
import { calculateFitScore } from '@/lib/fit-score';
import { getStormData } from '@/lib/storm-api';
import { getAdminClient } from '@/lib/supabase';
import { personalizedFitScore, type BrandAnswers } from '@/lib/fit-score-personalized';

const STATIC = { fitScore: null, fitGrade: null, isPersonalized: false, personalizedBy: [] as string[] };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ zip: string }> }
) {
  const { zip } = await params;
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Invalid zip code' }, { status: 400 });
  }

  // Unauthenticated callers get a no-op static fallback (UI uses base score).
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
  if (!user) return NextResponse.json(STATIC);

  const admin = getAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.org_id) return NextResponse.json(STATIC);

  const { data: brand } = await admin
    .from('brands')
    .select('answers')
    .eq('org_id', profile.org_id)
    .maybeSingle();

  const answers = (brand?.answers ?? null) as BrandAnswers | null;

  // Re-compute base score from source data (frozen route cannot be proxied).
  const row = lookupZip(zip);
  if (!row) return NextResponse.json(STATIC);

  const storm = await getStormData(zip);
  const base = calculateFitScore(
    row.criteria_1, row.criteria_2, row.criteria_3,
    row.criteria_4, row.criteria_5, storm.count
  );

  const result = personalizedFitScore(base, answers);

  return NextResponse.json({
    fitScore: result.score,
    fitGrade: result.grade,
    isPersonalized: result.isPersonalized,
    personalizedBy: result.personalizedBy,
  });
}
