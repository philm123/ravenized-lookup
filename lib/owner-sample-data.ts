// Sample/illustrative data for the Owner dashboard.
// This file is intentionally fake and clearly labeled as such in the UI.
// Delete and replace when a real CRM pipeline is connected.

export interface CanvasserActivity {
  name: string;
  leads: number;
  closes: number;
}

export interface ZipAreaStat {
  zip: string;
  state: string;
  leads: number;
  closes: number;
  stormFlag: boolean;
}

export interface WeeklyCloseRate {
  label: string;
  rate: number;
  leads: number;
}

export const SAMPLE_CANVASSERS: CanvasserActivity[] = [
  { name: 'D. Rivera', leads: 31, closes: 11 },
  { name: 'Marcus T.', leads: 24, closes: 9 },
  { name: 'Sarah K.', leads: 19, closes: 6 },
  { name: 'A. Patel', leads: 17, closes: 4 },
];

export const SAMPLE_AREA_STATS: ZipAreaStat[] = [
  { zip: '77090', state: 'TX', leads: 18, closes: 7, stormFlag: true },
  { zip: '85001', state: 'AZ', leads: 15, closes: 5, stormFlag: true },
  { zip: '30301', state: 'GA', leads: 12, closes: 4, stormFlag: false },
  { zip: '45201', state: 'OH', leads: 11, closes: 4, stormFlag: true },
  { zip: '60601', state: 'IL', leads: 9, closes: 2, stormFlag: false },
];

export const SAMPLE_WEEKLY_TREND: WeeklyCloseRate[] = [
  { label: 'Wk 1', rate: 0.28, leads: 21 },
  { label: 'Wk 2', rate: 0.34, leads: 26 },
  { label: 'Wk 3', rate: 0.31, leads: 19 },
  { label: 'Wk 4', rate: 0.38, leads: 29 },
  { label: 'Wk 5', rate: 0.41, leads: 34 },
  { label: 'Wk 6', rate: 0.37, leads: 27 },
];

export const SAMPLE_TOTALS = {
  totalLeads: 91,
  totalCloses: 33,
  avgCloseRate: 0.36,
  stormLeads: 44,
  activeCanvassers: 4,
};
