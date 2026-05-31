import { NextRequest, NextResponse } from 'next/server';
import { lookupZip } from '@/lib/db';
import { calculateFitScore } from '@/lib/fit-score';
import { getStormData, getCityForZip } from '@/lib/storm-api';
import { generateSummary } from '@/lib/summary';

// US state abbreviation lookup
const STATE_ABBREV: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
  'Puerto Rico': 'PR',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ zip: string }> }
) {
  const { zip } = await params;

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Invalid zip code' }, { status: 400 });
  }

  const row = lookupZip(zip);
  if (!row) {
    return NextResponse.json({ error: 'Zip code not found' }, { status: 404 });
  }

  const [storm, city] = await Promise.all([
    getStormData(zip),
    getCityForZip(zip),
  ]);
  const fit = calculateFitScore(
    row.criteria_1, row.criteria_2, row.criteria_3,
    row.criteria_4, row.criteria_5, storm.count
  );

  const summary = generateSummary({
    home_age: row.home_age,
    pct_10yr_owners: row.pct_10yr_owners,
    median_property_value: row.median_property_value,
    owner_occupancy: row.owner_occupancy,
    stormEvents: storm.count,
  });

  const stateAbbrev = STATE_ABBREV[row.state || ''] || row.state || '';

  return NextResponse.json({
    zip: row.zip,
    city: city || null,
    state: row.state,
    stateAbbrev,
    medianIncome: row.median_income,
    homeAge: row.home_age,
    ownerOccupancy: row.owner_occupancy,
    medianPropertyValue: row.median_property_value,
    pct10yrOwners: row.pct_10yr_owners,
    population: row.population,
    pctChildren: row.pct_children,
    pctDegree: row.pct_degree,
    avgCommute: row.avg_commute,
    pctMgmt: row.pct_mgmt,
    criteria: {
      code1: row.criteria_1,
      code2: row.criteria_2,
      code3: row.criteria_3,
      code4: row.criteria_4,
      code5: row.criteria_5,
      full: row.full_criteria,
    },
    crCopy: {
      income: row.cr_copy_income,
      stability: row.cr_copy_stability,
      occupancy: row.cr_copy_occupancy,
      demo: row.cr_copy_demo,
      family: row.cr_copy_family,
    },
    fitScore: fit.score,
    fitGrade: fit.grade,
    fitComponents: fit.components,
    storm,
    summary,
  });
}
