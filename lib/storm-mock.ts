export interface StormEvent {
  type: string;
  date: string;
  severity: string;
}

export interface StormData {
  events: StormEvent[];
  count: number;
  lastDate: string | null;
  primaryType: string | null;
}

const STORM_TYPES = ['Hail', 'High Wind', 'Thunderstorm Wind'];
const SEVERITIES = ['Minor', 'Moderate', 'Significant', 'Severe'];

function hashZip(zip: string): number {
  let h = 0;
  for (let i = 0; i < zip.length; i++) {
    h = ((h << 5) - h + zip.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function getMockStormData(zip: string): StormData {
  const seed = hashZip(zip);
  const rand = seededRandom(seed);

  const r = rand();
  let count: number;
  if (r < 0.35) count = 0;
  else if (r < 0.55) count = 1;
  else if (r < 0.72) count = 2;
  else if (r < 0.85) count = 3;
  else if (r < 0.93) count = 4;
  else if (r < 0.98) count = 5;
  else count = 6;

  const now = Date.now();
  const DAY = 86400000;

  const events: StormEvent[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(rand() * 90);
    const date = new Date(now - daysAgo * DAY);
    const type = STORM_TYPES[Math.floor(rand() * STORM_TYPES.length)];
    const severity = SEVERITIES[Math.floor(rand() * SEVERITIES.length)];
    events.push({
      type,
      date: date.toISOString().split('T')[0],
      severity,
    });
  }

  events.sort((a, b) => b.date.localeCompare(a.date));

  return {
    events,
    count,
    lastDate: events[0]?.date || null,
    primaryType: events[0]?.type || null,
  };
}
