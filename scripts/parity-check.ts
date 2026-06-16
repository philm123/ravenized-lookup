import { createClient as createTurso } from '@libsql/client';
import { createClient as createSB } from '@supabase/supabase-js';
import * as path from 'path';

try { process.loadEnvFile(path.join(process.cwd(), '.env.local')); } catch {}

const turso = createTurso({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sb = createSB(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ZIPS = ['10001', '35004', '60601'];
const COLS = ['zip', 'state', 'median_income', 'home_age', 'owner_occupancy',
              'median_property_value', 'pct_10yr_owners', 'population',
              'criteria_1', 'full_criteria'];

async function run() {
  for (const zip of ZIPS) {
    const [tr, { data: sr }] = await Promise.all([
      turso.execute({ sql: 'SELECT * FROM zip_data WHERE zip = ?', args: [zip] }),
      sb.from('zip_data').select('*').eq('zip', zip).maybeSingle(),
    ]);
    const t: any = tr.rows[0] ?? null;
    const s: any = sr ?? null;
    console.log('\n=== ZIP ' + zip + ' ===');
    let allMatch = true;
    for (const col of COLS) {
      const tv = t ? String(t[col] ?? 'NULL') : 'MISSING';
      const sv = s ? String(s[col] ?? 'NULL') : 'MISSING';
      const ok = tv === sv ? 'OK  ' : 'DIFF';
      if (ok.trim() === 'DIFF') allMatch = false;
      console.log(ok + '  ' + col.padEnd(24) + 'turso=' + tv + '  sb=' + sv);
    }
    console.log('OVERALL: ' + (allMatch ? 'MATCH' : 'MISMATCH'));
  }
}

run().catch(e => { console.error(e); process.exit(1); });
