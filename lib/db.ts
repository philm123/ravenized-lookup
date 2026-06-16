import { createClient } from '@libsql/client';
import { getSupabaseAdmin } from './supabase';

// Which backend serves zip reference data. Mirrors the STORM_SOURCE pattern.
// "turso" (default) keeps the existing libSQL read path working. "supabase"
// reads the same data from Postgres. Cut over by setting DATA_SOURCE=supabase
// only after parity is verified.
const DATA_SOURCE = (process.env.DATA_SOURCE || 'turso').toLowerCase();

export interface ZipRow {
  zip: string;
  state: string;
  median_income: number | null;
  home_age: number | null;
  owner_occupancy: number | null;
  median_property_value: number | null;
  pct_10yr_owners: number | null;
  population: number | null;
  pct_children: number | null;
  pct_degree: number | null;
  avg_commute: number | null;
  pct_mgmt: number | null;
  criteria_1: string | null;
  criteria_2: string | null;
  criteria_3: string | null;
  criteria_4: string | null;
  criteria_5: string | null;
  full_criteria: string | null;
  cr_copy_income: string | null;
  cr_copy_stability: string | null;
  cr_copy_occupancy: string | null;
  cr_copy_demo: string | null;
  cr_copy_family: string | null;
}

// Zip reference data changes rarely, so cache lookups in memory per server
// instance. Warm serverless instances reuse this across requests.
const lookupCache = new Map<string, ZipRow | null>();

// ---- Turso (libSQL) path ----

let _turso: ReturnType<typeof createClient> | null = null;

function getTursoClient() {
  if (_turso) return _turso;
  _turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return _turso;
}

async function tursoLookupZip(zip: string): Promise<ZipRow | null> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: 'SELECT * FROM zip_data WHERE zip = ?',
    args: [zip],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as ZipRow;
}

async function tursoSearchZips(query: string): Promise<{ zip: string; state: string }[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: 'SELECT zip, state FROM zip_data WHERE zip LIKE ? LIMIT 10',
    args: [query + '%'],
  });
  return result.rows as unknown as { zip: string; state: string }[];
}

// ---- Supabase (Postgres) path ----

async function supabaseLookupZip(zip: string): Promise<ZipRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('zip_data')
    .select('*')
    .eq('zip', zip)
    .maybeSingle();
  if (error) throw new Error(`Supabase lookupZip failed: ${error.message}`);
  return (data as ZipRow | null) ?? null;
}

async function supabaseSearchZips(query: string): Promise<{ zip: string; state: string }[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('zip_data')
    .select('zip, state')
    .like('zip', `${query}%`)
    .limit(10);
  if (error) throw new Error(`Supabase searchZips failed: ${error.message}`);
  return (data as { zip: string; state: string }[]) ?? [];
}

// ---- Public API (stable signatures consumed by the API routes) ----

export async function lookupZip(zip: string): Promise<ZipRow | null> {
  if (lookupCache.has(zip)) return lookupCache.get(zip)!;
  const row = DATA_SOURCE === 'supabase'
    ? await supabaseLookupZip(zip)
    : await tursoLookupZip(zip);
  lookupCache.set(zip, row);
  return row;
}

export async function searchZips(query: string): Promise<{ zip: string; state: string }[]> {
  return DATA_SOURCE === 'supabase'
    ? await supabaseSearchZips(query)
    : await tursoSearchZips(query);
}

export function getDataSource(): string {
  return DATA_SOURCE;
}
