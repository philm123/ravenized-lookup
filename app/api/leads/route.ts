import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export type LeadStatus = 'saved' | 'contacted' | 'interested' | 'closed_won' | 'closed_lost';

const VALID_STATUSES: LeadStatus[] = ['saved', 'contacted', 'interested', 'closed_won', 'closed_lost'];

export interface LeadRow {
  id: string;
  zip: string;
  state_abbrev: string | null;
  fit_score: number | null;
  fit_grade: string | null;
  storm_flag: boolean;
  storm_summary: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface LeadDTO {
  id: string;
  zip: string;
  state: string;
  fitScore: number;
  fitGrade: string;
  stormFlag: boolean;
  stormSummary: string | null;
  savedAt: string;
  status: LeadStatus;
  closedAt: string | null;
}

function toDTO(row: LeadRow): LeadDTO {
  return {
    id: row.id,
    zip: row.zip,
    state: row.state_abbrev ?? '',
    fitScore: row.fit_score ?? 0,
    fitGrade: row.fit_grade ?? '—',
    stormFlag: row.storm_flag,
    stormSummary: row.storm_summary,
    savedAt: row.created_at,
    status: row.status,
    closedAt: row.closed_at,
  };
}

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get('zip');
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (zip) query = query.eq('zip', zip);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: (data as LeadRow[]).map(toDTO) });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    zip: string;
    stateAbbrev?: string;
    fitScore?: number;
    fitGrade?: string;
    stormFlag?: boolean;
    stormSummary?: string | null;
  };

  if (!body.zip) {
    return NextResponse.json({ error: 'zip is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('leads')
    .select('*')
    .eq('zip', body.zip)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ lead: toDTO(existing as LeadRow), duplicate: true });
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      zip: body.zip,
      state_abbrev: body.stateAbbrev ?? null,
      fit_score: body.fitScore ?? null,
      fit_grade: body.fitGrade ?? null,
      storm_flag: body.stormFlag ?? false,
      storm_summary: body.stormSummary ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lead: toDTO(data as LeadRow) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id: string; status: string };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(body.status as LeadStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const status = body.status as LeadStatus;
  const closedAt = ['closed_won', 'closed_lost'].includes(status)
    ? new Date().toISOString()
    : null;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('leads')
    .update({ status, closed_at: closedAt })
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lead: toDTO(data as LeadRow) });
}
