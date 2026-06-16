import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const CSV_PATH = path.join(process.cwd(), 'data', 'zip_data.csv');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('TURSO_DATABASE_URL is required');
  process.exit(1);
}

const client = createClient({ url, authToken });

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

async function seed() {
  console.log('Creating table...');
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS zip_data (
      zip TEXT PRIMARY KEY,
      state TEXT,
      median_income INTEGER,
      home_age INTEGER,
      owner_occupancy REAL,
      median_property_value INTEGER,
      pct_10yr_owners REAL,
      population INTEGER,
      pct_children REAL,
      pct_degree REAL,
      avg_commute REAL,
      pct_mgmt REAL,
      criteria_1 TEXT,
      criteria_2 TEXT,
      criteria_3 TEXT,
      criteria_4 TEXT,
      criteria_5 TEXT,
      full_criteria TEXT,
      cr_copy_income TEXT,
      cr_copy_stability TEXT,
      cr_copy_occupancy TEXT,
      cr_copy_demo TEXT,
      cr_copy_family TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_state ON zip_data(state);
    CREATE INDEX IF NOT EXISTS idx_full_criteria ON zip_data(full_criteria);
  `);

  console.log('Reading CSV...');
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (errors.length > 0) console.warn('CSV parse warnings:', errors.slice(0, 5));
  console.log(`Parsed ${data.length} rows`);

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < (data as any[]).length; i += BATCH_SIZE) {
    const chunk = (data as any[]).slice(i, i + BATCH_SIZE);

    const statements = chunk
      .map((raw) => {
        const zip = parseStr(raw['Zip']);
        if (!zip || zip.length < 4) return null;
        const paddedZip = zip.padStart(5, '0');
        return {
          sql: `INSERT OR IGNORE INTO zip_data (
            zip, state, median_income, home_age, owner_occupancy,
            median_property_value, pct_10yr_owners, population,
            pct_children, pct_degree, avg_commute, pct_mgmt,
            criteria_1, criteria_2, criteria_3, criteria_4, criteria_5,
            full_criteria, cr_copy_income, cr_copy_stability,
            cr_copy_occupancy, cr_copy_demo, cr_copy_family
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            paddedZip,
            parseStr(raw['State ']),
            parseMoney(raw['Median Income \n']),
            parseNum(raw['Home Age']),
            parsePct(raw['Owner Occupancy %']),
            parseMoney(raw['Median Property Value']),
            parsePct(raw['% Owning Home 10+ Years']),
            parseNum(raw['Population']),
            parsePct(raw['% With Children']),
            parsePct(raw['% With a Degree']),
            parseNum(raw['Avg Commute ']),
            parsePct(raw['% Mgmt Jobs']),
            parseStr(raw['Criteria Code 1']),
            parseStr(raw['Criteria Code 2']),
            parseStr(raw['Criteria Code 3']),
            parseStr(raw['Criteria Code 4']),
            parseStr(raw['Criteria Code 5']),
            parseStr(raw['Full Criteria Code ']),
            parseStr(raw['Cr Copy 1 ']),
            parseStr(raw['Cr Copy 2']),
            parseStr(raw['Cr Copy 3']),
            parseStr(raw['Cr Copy 4']),
            parseStr(raw['Cr Copy 5']),
          ],
        };
      })
      .filter(Boolean) as { sql: string; args: (string | number | null)[] }[];

    await client.batch(statements, 'write');
    inserted += statements.length;
    console.log(`Inserted ${inserted}/${data.length}`);
  }

  const result = await client.execute('SELECT COUNT(*) as c FROM zip_data');
  console.log(`Done. Total rows in Turso: ${result.rows[0].c}`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
