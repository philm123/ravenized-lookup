interface SummaryInput {
  home_age: number | null;
  pct_10yr_owners: number | null;
  median_property_value: number | null;
  owner_occupancy: number | null;
  stormEvents: number;
}

export function generateSummary(data: SummaryInput): string {
  const parts: string[] = [];

  if (data.home_age != null) {
    if (data.home_age >= 40) parts.push('Older homes');
    else if (data.home_age <= 25) parts.push('Newer construction');
  }

  if (data.pct_10yr_owners != null) {
    if (data.pct_10yr_owners >= 0.75) parts.push('long-tenured owners');
    else if (data.pct_10yr_owners <= 0.35) parts.push('higher turnover');
  }

  if (data.median_property_value != null) {
    if (data.median_property_value >= 600000) parts.push('high-value properties');
    else if (data.median_property_value >= 300000) parts.push('mid-range market');
  }

  if (data.stormEvents >= 3) parts.push('storm just hit');
  else if (data.stormEvents >= 1) parts.push('recent storm activity');

  if (data.owner_occupancy != null) {
    if (data.owner_occupancy >= 0.85) parts.push('strong owner-occupied');
    else if (data.owner_occupancy < 0.33) parts.push('renter-heavy area');
  }

  if (parts.length === 0) return 'Standard residential area.';
  return parts.slice(0, 3).join(', ') + '.';
}
