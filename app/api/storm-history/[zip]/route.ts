import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface StormEvent {
  type: string;
  date: string;
  severity: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ zip: string }> },
) {
  const { zip } = await params;
  const body = await request.json() as { events: StormEvent[] };

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ stored: 0 });
  }

  const supabase = getSupabaseAdmin();

  const rows = body.events.map((e) => ({
    zip,
    event_type: e.type,
    event_date: e.date,
    severity: e.severity,
  }));

  const { error } = await supabase
    .from('storm_history')
    .upsert(rows, { onConflict: 'zip,event_date,event_type', ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ stored: rows.length });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ zip: string }> },
) {
  const { zip } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('storm_history')
    .select('event_type, event_date, severity, fetched_at')
    .eq('zip', zip)
    .order('event_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [] });
}
