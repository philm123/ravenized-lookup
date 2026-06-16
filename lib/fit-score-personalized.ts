import type { FitScoreResult } from './fit-score';

export interface BrandAnswers {
  service_area?: string;
  value_prop?: string;
  differentiator?: string;
  specialization?: string;
}

export interface PersonalizedFitResult {
  score: number;
  grade: string;
  components: FitScoreResult['components'];
  isPersonalized: boolean;
  personalizedBy: string[];
}

// Mirrors the grade thresholds in lib/fit-score.ts (which is frozen).
function gradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

// Adjusts the base fit score relative to the brand's stated specialization.
// All adjustments are additive/multiplicative tweaks to the existing component
// values so the score remains in [0, 100] and is comparable across zips.
//
// Placeholders: these rules are drafted from the questionnaire labels and are
// ready for Raven to tune once real brand data is in.
export function personalizedFitScore(
  base: FitScoreResult,
  answers: BrandAnswers | null
): PersonalizedFitResult {
  if (!answers) {
    return { ...base, isPersonalized: false, personalizedBy: [] };
  }

  const spec = (answers.specialization || '').toLowerCase();
  const components = { ...base.components };
  const personalizedBy: string[] = [];

  // Storm restoration: boost the storm bonus (these zips are high-value leads).
  if (spec.includes('storm')) {
    components.storm = Math.min(components.storm + 5, 15);
    personalizedBy.push('storm restoration');
  }

  // New construction focus: aging housing stock is less relevant to this brand.
  if (spec.includes('new construction')) {
    components.age = Math.round(components.age * 0.6);
    personalizedBy.push('new construction');
  }

  // Commercial roofing: residential demographic signals carry less weight.
  if (spec.includes('commercial')) {
    components.income = Math.round(components.income * 0.7);
    components.occupancy = Math.round(components.occupancy * 0.7);
    components.demo = Math.round(components.demo * 0.7);
    components.family = Math.round(components.family * 0.7);
    personalizedBy.push('commercial focus');
  }

  // No rules fired: fall back to the static result unchanged.
  if (personalizedBy.length === 0) {
    return { ...base, isPersonalized: false, personalizedBy: [] };
  }

  const raw = Object.values(components).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    grade: gradeFromScore(score),
    components,
    isPersonalized: true,
    personalizedBy,
  };
}
