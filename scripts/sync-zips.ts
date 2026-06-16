import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

// Load .env.local for standalone runs (Next.js loads it for the app, tsx does not).
try {
  process.loadEnvFile(path.join(process.cwd(), '.env.local'));
} catch {
  // Node < 20.12 or file absent: rely on the ambient environment.
}

const CSV_PATH = path.join(process.cwd(), 'data', 'zip_data.csv');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

function parseMoney(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null;
  const cleaned = val.replace(/[$,]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : Math.round(n);
}

function parsePct(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null;
  const cleaned = val.replace(/%/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n / 100;
}

function parseNum(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null;
  const cleaned = val.replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseStr(val: string | undefined | null): string | null {
  if (!val || val.trim() === '') return null;
  return val.trim();
}

async function sync() {
  console.log('Reading CSV...');
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (errors.length > 0) console.warn('CSV parse warnings:', errors.slice(0, 5));
  console.log(`Parsed ${data.length} rows`);

  const BATCH_SIZE = 500;
  // First occurrence wins, matching the INSERT OR IGNORE behavior of seed-turso.ts.
  const seen = new Set<string>();
  let upserted = 0;

  for (let i = 0; i < (data as any[]).length; i += BATCH_SIZE) {
    const chunk = (data as any[]).slice(i, i + BATCH_SIZE);

    const rows = chunk
      .map((raw) => {
        const zip = parseStr(raw['Zip']);
        if (!zip || zip.length < 4) return null;
        const paddedZip = zip.padStart(5, '0');
        if (seen.has(paddedZip)) return null;
        seen.add(paddedZip);
        return {
          zip: paddedZip,
          state: parseStr(raw['State ']),
          median_income: parseMoney(raw['Median Income \n']),
          home_age: parseNum(raw['Home Age']),
          owner_occupancy: parsePct(raw['Owner Occupancy %']),
          median_property_value: parseMoney(raw['Median Property Value']),
          pct_10yr_owners: parsePct(raw['% Owning Home 10+ Years']),
          population: parseNum(raw['Population']),
          pct_children: parsePct(raw['% With Children']),
          pct_degree: parsePct(raw['% With a Degree']),
          avg_commute: parseNum(raw['Avg Commute ']),
          pct_mgmt: parsePct(raw['% Mgmt Jobs']),
          criteria_1: parseStr(raw['Criteria Code 1']),
          criteria_2: parseStr(raw['Criteria Code 2']),
          criteria_3: parseStr(raw['Criteria Code 3']),
          criteria_4: parseStr(raw['Criteria Code 4']),
          criteria_5: parseStr(raw['Criteria Code 5']),
          full_criteria: parseStr(raw['Full Criteria Code ']),
          cr_copy_income: parseStr(raw['Cr Copy 1 ']),
          cr_copy_stability: parseStr(raw['Cr Copy 2']),
          cr_copy_occupancy: parseStr(raw['Cr Copy 3']),
          cr_copy_demo: parseStr(raw['Cr Copy 4']),
          cr_copy_family: parseStr(raw['Cr Copy 5']),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (rows.length === 0) continue;

    const { error } = await sb.from('zip_data').upsert(rows, { onConflict: 'zip' });
    if (error) {
      console.error(`Batch starting at row ${i} failed:`, error.message);
      process.exit(1);
    }
    upserted += rows.length;
    console.log(`Upserted ${upserted} (scanned ${Math.min(i + BATCH_SIZE, (data as any[]).length)}/${data.length})`);
  }

  const { count, error } = await sb
    .from('zip_data')
    .select('*', { count: 'exact', head: true });
  if (error) console.warn('Count check failed:', error.message);
  else console.log(`Done. Total rows in Supabase zip_data: ${count}`);
}

sync().catch((e) => {
  console.error(e);
  process.exit(1);
});
