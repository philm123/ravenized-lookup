import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface LeadRow {
  zip: string;
  state_abbrev: string | null;
  storm_flag: boolean;
  status: string;
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('leads')
    .select('zip, state_abbrev, storm_flag, status');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as LeadRow[];

  const totalLeads = rows.length;
  const totalCloses = rows.filter((r) => r.status === 'closed_won').length;
  const stormLeads = rows.filter((r) => r.storm_flag).length;
  const avgCloseRate = totalLeads > 0 ? totalCloses / totalLeads : 0;

  const areaMap = new Map<string, {
    zip: string;
    state: string;
    leads: number;
    closes: number;
    stormFlag: boolean;
  }>();

  for (const row of rows) {
    if (!areaMap.has(row.zip)) {
      areaMap.set(row.zip, {
        zip: row.zip,
        state: row.state_abbrev ?? '',
        leads: 0,
        closes: 0,
        stormFlag: false,
      });
    }
    const area = areaMap.get(row.zip)!;
    area.leads++;
    if (row.status === 'closed_won') area.closes++;
    if (row.storm_flag) area.stormFlag = true;
  }

  return NextResponse.json({
    totals: { totalLeads, totalCloses, stormLeads, avgCloseRate },
    areas: [...areaMap.values()].sort((a, b) => b.leads - a.leads),
  });
}
