import { StormData, StormEvent, getMockStormData } from './storm-mock';

interface GeoResult {
  lat: number;
  lon: number;
  city: string;
}

interface DailyWeather {
  time: string[];
  weather_code: (number | null)[];
  wind_speed_10m_max: (number | null)[];
  wind_gusts_10m_max: (number | null)[];
  precipitation_sum: (number | null)[];
}

const geoCache = new Map<string, GeoResult>();
const stormCache = new Map<string, { data: StormData; ts: number }>();
const STORM_CACHE_TTL = 6 * 60 * 60 * 1000;

async function geocodeZip(zip: string): Promise<GeoResult | null> {
  const cached = geoCache.get(zip);
  if (cached) return cached;

  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!res.ok) return null;

  const json = await res.json();
  const place = json.places?.[0];
  if (!place) return null;

  const result: GeoResult = {
    lat: parseFloat(place.latitude),
    lon: parseFloat(place.longitude),
    city: place['place name'] || '',
  };
  geoCache.set(zip, result);
  return result;
}

async function fetchWeatherHistory(
  lat: number,
  lon: number
): Promise<DailyWeather | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toFixed(4));
  url.searchParams.set('longitude', lon.toFixed(4));
  url.searchParams.set('past_days', '90');
  url.searchParams.set('forecast_days', '0');
  url.searchParams.set(
    'daily',
    'weather_code,wind_speed_10m_max,wind_gusts_10m_max,precipitation_sum'
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('wind_speed_unit', 'mph');

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  return json.daily ?? null;
}

// WMO weather codes: 95 = thunderstorm, 96 = thunderstorm + slight hail, 99 = thunderstorm + heavy hail
// Wind gust thresholds aligned to NWS advisory levels relevant to roof damage
function deriveStormEvents(daily: DailyWeather): StormEvent[] {
  const events: StormEvent[] = [];

  for (let i = 0; i < daily.time.length; i++) {
    const date = daily.time[i];
    const code = daily.weather_code[i] ?? 0;
    const gusts = daily.wind_gusts_10m_max[i] ?? 0;

    if (code === 96 || code === 99) {
      events.push({
        type: 'Hail',
        date,
        severity:
          code === 99
            ? 'Severe'
            : gusts > 50
              ? 'Significant'
              : 'Moderate',
      });
      continue;
    }

    if (code === 95 && gusts > 40) {
      events.push({
        type: 'Thunderstorm Wind',
        date,
        severity:
          gusts > 65 ? 'Severe' : gusts > 50 ? 'Significant' : 'Moderate',
      });
      continue;
    }

    if (gusts > 50) {
      events.push({
        type: 'High Wind',
        date,
        severity:
          gusts > 80 ? 'Severe' : gusts > 65 ? 'Significant' : 'Moderate',
      });
    }
  }

  events.sort((a, b) => b.date.localeCompare(a.date));
  return events;
}

export async function getCityForZip(zip: string): Promise<string | null> {
  try {
    const geo = await geocodeZip(zip);
    return geo?.city || null;
  } catch {
    return null;
  }
}

export async function getStormData(zip: string): Promise<StormData> {
  if (process.env.STORM_SOURCE === 'mock') {
    return getMockStormData(zip);
  }

  const cached = stormCache.get(zip);
  if (cached && Date.now() - cached.ts < STORM_CACHE_TTL) {
    return cached.data;
  }

  try {
    const geo = await geocodeZip(zip);
    if (!geo) return getMockStormData(zip);

    const daily = await fetchWeatherHistory(geo.lat, geo.lon);
    if (!daily) return getMockStormData(zip);

    const events = deriveStormEvents(daily);
    const data: StormData = {
      events,
      count: events.length,
      lastDate: events[0]?.date ?? null,
      primaryType: events[0]?.type ?? null,
    };

    stormCache.set(zip, { data, ts: Date.now() });
    return data;
  } catch {
    return getMockStormData(zip);
  }
}
