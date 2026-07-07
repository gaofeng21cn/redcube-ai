export interface RelativeQualityDimension {
  dimension_id: string;
  dimension: string;
  label: string;
  current: number;
  baseline: number;
  delta: number;
  tolerance: number;
  preferred_direction: 'lower';
  status: 'acceptable' | 'improved' | 'degraded';
  verdict: 'acceptable' | 'improved' | 'degraded';
}

export interface RelativeQualityOverall {
  verdict: 'acceptable' | 'improved' | 'degraded';
  degraded_dimensions: string[];
  improved_dimensions: string[];
  acceptable_change_dimensions: string[];
}

export interface RelativeQualityRubric {
  verdict: 'acceptable' | 'improved' | 'degraded';
  blocking: boolean;
  degradations: RelativeQualityDimension[];
  improvements: RelativeQualityDimension[];
  acceptable_changes: RelativeQualityDimension[];
  overall: RelativeQualityOverall;
  dimensions: RelativeQualityDimension[];
}

function roundNumber(value: number, digits = 4): number {
  return Number(Number(value || 0).toFixed(digits));
}

function compareLowerIsBetterDimension({
  dimension,
  label,
  current,
  baseline,
  tolerance = 0,
  digits = 4,
}: {
  dimension: string;
  label: string;
  current: number;
  baseline: number;
  tolerance?: number;
  digits?: number;
}): RelativeQualityDimension {
  const normalizedCurrent = Number(current || 0);
  const normalizedBaseline = Number(baseline || 0);
  const delta = normalizedCurrent - normalizedBaseline;
  let status: RelativeQualityDimension['status'] = 'acceptable';
  if (delta < 0) {
    status = 'improved';
  } else if (delta > tolerance) {
    status = 'degraded';
  }

  return {
    dimension_id: dimension,
    dimension,
    label,
    current: roundNumber(normalizedCurrent, digits),
    baseline: roundNumber(normalizedBaseline, digits),
    delta: roundNumber(delta, digits),
    tolerance: roundNumber(tolerance, digits),
    preferred_direction: 'lower',
    status,
    verdict: status,
  };
}

function summarizeOverall(dimensions: RelativeQualityDimension[]): RelativeQualityOverall {
  const degraded = dimensions.filter((item) => item.status === 'degraded').map((item) => item.dimension_id);
  const improved = dimensions.filter((item) => item.status === 'improved').map((item) => item.dimension_id);
  const acceptableChanges = dimensions.filter((item) => item.status === 'acceptable').map((item) => item.dimension_id);
  const verdict = degraded.length > 0
    ? 'degraded'
    : (improved.length > 0 ? 'improved' : 'acceptable');
  return {
    verdict,
    degraded_dimensions: degraded,
    improved_dimensions: improved,
    acceptable_change_dimensions: acceptableChanges,
  };
}

export function buildRelativeQualityRubric({
  dimensions,
}: {
  dimensions: RelativeQualityDimension[];
}): RelativeQualityRubric {
  const overall = summarizeOverall(dimensions);
  const degradations = dimensions.filter((item) => item.status === 'degraded');
  const improvements = dimensions.filter((item) => item.status === 'improved');
  const acceptableChanges = dimensions.filter((item) => item.status === 'acceptable');
  return {
    verdict: overall.verdict,
    blocking: overall.verdict === 'degraded',
    degradations,
    improvements,
    acceptable_changes: acceptableChanges,
    overall,
    dimensions,
  };
}

export function compareFailuresAndDensity({
  currentFailures,
  baselineFailures,
  currentDensity,
  baselineDensity,
  densityTolerance,
  densityDigits = 4,
  densityLabel = '平均密度',
}: {
  currentFailures: number;
  baselineFailures: number;
  currentDensity: number;
  baselineDensity: number;
  densityTolerance: number;
  densityDigits?: number;
  densityLabel?: string;
}): RelativeQualityRubric {
  return buildRelativeQualityRubric({
    dimensions: [
      compareLowerIsBetterDimension({
        dimension: 'failed_slide_count',
        label: '失败页数',
        current: currentFailures,
        baseline: baselineFailures,
        tolerance: 0,
        digits: 0,
      }),
      compareLowerIsBetterDimension({
        dimension: 'average_density',
        label: densityLabel,
        current: currentDensity,
        baseline: baselineDensity,
        tolerance: densityTolerance,
        digits: densityDigits,
      }),
    ],
  });
}

export function summarizeRelativeQuality(relativeQuality: RelativeQualityRubric): string {
  const overall = relativeQuality?.overall || {};
  if (overall.verdict === 'degraded') {
    return `相对 baseline 出现退化：${(overall.degraded_dimensions || []).join('、')}`;
  }
  if ((overall.improved_dimensions || []).length > 0) {
    return `相对 baseline 保持可接受且有提升：${overall.improved_dimensions.join('、')}`;
  }
  return '相对 baseline 变化可接受。';
}
