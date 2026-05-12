import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const CSV_PATH = path.join(process.cwd(), 'data', 'zip_data.csv');
const DB_PATH = path.join(process.cwd(), 'data', 'momentum.db');

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

function seed() {
  console.log('Reading CSV...');
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');

  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.warn('CSV parse warnings:', errors.slice(0, 5));
  }

  console.log(`Parsed ${data.length} rows`);

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE zip_data (
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
    CREATE INDEX idx_state ON zip_data(state);
    CREATE INDEX idx_full_criteria ON zip_data(full_criteria);
  `);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO zip_data (
      zip, state, median_income, home_age, owner_occupancy,
      median_property_value, pct_10yr_owners, population,
      pct_children, pct_degree, avg_commute, pct_mgmt,
      criteria_1, criteria_2, criteria_3, criteria_4, criteria_5,
      full_criteria, cr_copy_income, cr_copy_stability,
      cr_copy_occupancy, cr_copy_demo, cr_copy_family
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  const BATCH_SIZE = 500;
  let count = 0;
  let batch: any[][] = [];

  const flush = () => {
    const tx = db.transaction((rows: any[][]) => {
      for (const row of rows) {
        insert.run(...row);
      }
    });
    tx(batch);
    batch = [];
  };

  for (const raw of data as any[]) {
    const zip = parseStr(raw['Zip']);
    if (!zip || zip.length < 4) continue;

    const paddedZip = zip.padStart(5, '0');

    const row = [
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
    ];

    batch.push(row);
    count++;

    if (batch.length >= BATCH_SIZE) {
      flush();
    }
  }

  if (batch.length > 0) flush();

  console.log(`Seeded ${count} zip codes into ${DB_PATH}`);

  const sample = db.prepare('SELECT zip, state, median_income, full_criteria FROM zip_data LIMIT 3').all();
  console.log('Sample rows:', sample);

  const total = db.prepare('SELECT COUNT(*) as c FROM zip_data').get() as any;
  console.log(`Total rows: ${total.c}`);

  db.close();
}

seed();
