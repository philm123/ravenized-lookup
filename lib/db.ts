import Database from 'better-sqlite3';
import path from 'path';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = path.join(process.cwd(), 'data', 'momentum.db');
  _db = new Database(dbPath, { readonly: true });
  _db.pragma('journal_mode = WAL');
  return _db;
}

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

export function lookupZip(zip: string): ZipRow | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM zip_data WHERE zip = ?').get(zip) as ZipRow | undefined;
  return row || null;
}

export function searchZips(query: string): { zip: string; state: string }[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT zip, state FROM zip_data WHERE zip LIKE ? LIMIT 10')
    .all(query + '%') as { zip: string; state: string }[];
  return rows;
}
