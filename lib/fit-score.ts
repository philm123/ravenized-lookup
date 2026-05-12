export interface FitScoreResult {
  score: number;
  grade: string;
  components: {
    income: number;
    value: number;
    age: number;
    stability: number;
    occupancy: number;
    demo: number;
    family: number;
    storm: number;
  };
}

const INCOME_SCORES: Record<string, number> = { '1': 8, '2': 13, '3': 15 };
const VALUE_SCORES: Record<string, number> = { A: 8, B: 16, C: 20 };
const AGE_SCORES: Record<string, number> = { D: 8, E: 15, F: 12 };
const STABILITY_SCORES: Record<string, number> = { Y: 10, Z: 4 };
const OCCUPANCY_SCORES: Record<string, number> = { O: 15, M: 9, R: 3 };
const MGMT_SCORES: Record<string, number> = { I: 3, H: 5, G: 6 };
const EDU_SCORES: Record<string, number> = { L: 2, K: 4, J: 5 };
const FAMILY_SCORES: Record<string, number> = { N: 5, P: 3 };

function stormBonus(eventCount: number): number {
  if (eventCount >= 5) return 10;
  if (eventCount >= 3) return 7;
  if (eventCount >= 1) return 4;
  return 0;
}

function gradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

export function calculateFitScore(
  criteria1: string | null,
  criteria2: string | null,
  criteria3: string | null,
  criteria4: string | null,
  criteria5: string | null,
  stormEvents: number
): FitScoreResult {
  const c1 = criteria1 || '';
  const incomeChar = c1[0] || '';
  const valueChar = c1[1] || '';
  const ageChar = c1[2] || '';
  const mgmtChar = (criteria4 || '')[0] || '';
  const eduChar = (criteria4 || '')[1] || '';

  const income = INCOME_SCORES[incomeChar] || 0;
  const value = VALUE_SCORES[valueChar] || 0;
  const age = AGE_SCORES[ageChar] || 0;
  const stability = STABILITY_SCORES[criteria2 || ''] || 0;
  const occupancy = OCCUPANCY_SCORES[criteria3 || ''] || 0;
  const mgmt = MGMT_SCORES[mgmtChar] || 0;
  const edu = EDU_SCORES[eduChar] || 0;
  const demo = Math.min(mgmt + edu, 10);
  const family = FAMILY_SCORES[criteria5 || ''] || 0;
  const storm = stormBonus(stormEvents);

  const raw = income + value + age + stability + occupancy + demo + family + storm;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    grade: gradeFromScore(score),
    components: { income, value, age, stability, occupancy, demo, family, storm },
  };
}
