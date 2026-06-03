export interface Promotion {
  headline: string;
  rationale: string;
  priority: 'primary' | 'secondary';
}

export interface AdAvenue {
  channel: string;
  rationale: string;
  fit: 'strong' | 'moderate';
}

export interface MarketingOutput {
  promotions: Promotion[];
  adAvenues: AdAvenue[];
  audienceSummary: string;
}

export interface ZipSignals {
  medianPropertyValue: number | null;
  medianIncome: number | null;
  homeAge: number | null;
  ownerOccupancy: number | null;
  pct10yrOwners: number | null;
  pctDegree: number | null;
  pctMgmt: number | null;
  pctChildren: number | null;
  stormCount: number;
}

export function deriveMarketingOutput(signals: ZipSignals): MarketingOutput {
  const {
    medianPropertyValue: mpv,
    medianIncome: mi,
    homeAge,
    ownerOccupancy,
    pct10yrOwners,
    pctDegree,
    pctMgmt,
    pctChildren,
    stormCount,
  } = signals;

  const promotions: Promotion[] = [];
  const adAvenues: AdAvenue[] = [];

  const highValue = mpv != null && mpv >= 350000;
  const olderHome = homeAge != null && homeAge >= 22;
  const longTenure = (pct10yrOwners ?? 0) >= 0.4;
  const highEdu = (pctDegree ?? 0) >= 0.3 || (pctMgmt ?? 0) >= 0.2;
  const highIncome = (mi ?? 0) >= 75000;
  const renterHeavy = ownerOccupancy != null && ownerOccupancy < 0.5;
  const familyHeavy = (pctChildren ?? 0) >= 0.3;

  // Storm urgency — highest-priority promotion when present
  if (stormCount >= 3) {
    promotions.push({
      headline: 'Storm Urgency — Insurance-Backed Claim',
      rationale: `${stormCount} qualifying events in 90 days. Lead with insurance angle; claims window may still be open.`,
      priority: 'primary',
    });
  } else if (stormCount >= 1) {
    promotions.push({
      headline: 'Recent Storm Activity',
      rationale: `${stormCount} event(s) in 90 days. Mention storm awareness; don't over-claim without inspection.`,
      priority: 'secondary',
    });
  }

  // High-value + older home = premium full-replacement angle
  if (highValue && olderHome) {
    promotions.push({
      headline: 'Premium Full-Replacement',
      rationale: `Median home value ${mpv != null ? '$' + Math.round(mpv / 1000) + 'k' : 'high'}, median age ${homeAge} yrs. Owners here care about quality and long-term investment.`,
      priority: stormCount >= 3 ? 'secondary' : 'primary',
    });
  } else if (highValue) {
    promotions.push({
      headline: 'Curb Appeal & Resale Value',
      rationale: 'Strong property values — homeowners respond to investment and resale framing over price.',
      priority: 'secondary',
    });
  }

  // Long-tenure owners = trust/relationship angle
  if (longTenure) {
    promotions.push({
      headline: 'Long-Tenure Trust Angle',
      rationale: `${Math.round((pct10yrOwners ?? 0) * 100)}% own 10+ years. Stable, invested homeowners; relationship and local-reputation messaging resonates.`,
      priority: 'secondary',
    });
  }

  // Families = safety & protection
  if (familyHeavy) {
    promotions.push({
      headline: 'Family Safety & Home Protection',
      rationale: 'High share of households with children. Safety, weather-readiness, and long-term protection messaging performs well.',
      priority: 'secondary',
    });
  }

  // Renter-heavy — flag for team
  if (renterHeavy) {
    promotions.push({
      headline: '⚠ Renter-Heavy — Adjust Approach',
      rationale: `Only ${Math.round((ownerOccupancy ?? 0) * 100)}% owner-occupied. Prioritize landlord/multi-family angle or redirect canvasser time to adjacent areas.`,
      priority: 'secondary',
    });
  }

  if (promotions.length === 0) {
    promotions.push({
      headline: 'Standard Homeowner Pitch',
      rationale: 'No strong demographic signal. Lead with local presence, reviews, and reliability.',
      priority: 'primary',
    });
  }

  // Ad avenues
  if (stormCount >= 2) {
    adAvenues.push({
      channel: 'Geo-Targeted Digital Ads',
      rationale: 'Storm activity creates urgency. Run ZIP-level Meta/Google ads while the event is fresh in homeowners\' minds.',
      fit: 'strong',
    });
  }

  if (longTenure) {
    adAvenues.push({
      channel: 'Direct Mail',
      rationale: 'Long-tenured owners are mail-responsive — they\'re home, invested, and less likely to dismiss physical outreach.',
      fit: 'strong',
    });
  }

  if (highEdu) {
    adAvenues.push({
      channel: 'Social Media (Meta / YouTube)',
      rationale: 'Higher education and management share — before/after content and social proof performs well on digital.',
      fit: 'strong',
    });
  }

  if (highIncome) {
    adAvenues.push({
      channel: 'Targeted Digital + Premium Print',
      rationale: 'Higher median income — invest in quality creative. Premium mailers and retargeting convert better than broad digital.',
      fit: 'moderate',
    });
  }

  adAvenues.push({
    channel: 'Door Hangers / Postcards',
    rationale: 'Universal residential roofing baseline. Works in any ZIP as brand-awareness and follow-up to door knocking.',
    fit: 'moderate',
  });

  // Audience summary
  const segments: string[] = [];
  if (highValue) segments.push('high-value homes');
  if (olderHome) segments.push('aging home stock');
  if (longTenure) segments.push('long-tenure owners');
  if (highEdu) segments.push('educated/management workforce');
  if (stormCount >= 3) segments.push('active storm zone');
  if (renterHeavy) segments.push('high renter share');

  const audienceSummary = segments.length > 0
    ? `This ZIP skews toward ${segments.join(', ')}.`
    : 'Standard homeowner profile — no dominant demographic signal.';

  return { promotions, adAvenues, audienceSummary };
}
