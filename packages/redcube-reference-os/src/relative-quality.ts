import {
  listPromotedReferences,
  listReferenceSamples,
  summarizeReferenceCoverage,
} from './reference-samples.js';

import type {
  PromotedReferenceRecord,
  ReferencePromotionReport,
  ReferenceQualityReport,
  ReferenceReplacementRecord,
  ReferenceReplacementReport,
  RelativeQualityDimension,
  RelativeQualityOverall,
  RelativeQualityRubric,
} from './types.js';

interface OverlayRegistry {
  listOverlays(): string[];
  listProfiles(overlayId: string): string[];
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
  const dimensions = [
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
  ];
  return buildRelativeQualityRubric({ dimensions });
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

export function buildReferenceQualityReport({
  rootDir,
  overlayRegistry,
}: {
  rootDir: string;
  overlayRegistry: OverlayRegistry;
}): ReferenceQualityReport {
  const catalog = listReferenceSamples({ rootDir });
  const coverage = summarizeReferenceCoverage({ rootDir, overlayRegistry });

  return {
    surface_kind: 'reference_quality_report',
    ready: coverage.ok && catalog.invalid_samples.length === 0,
    coverage: {
      expected_profile_count: coverage.expectedProfileCount,
      approved_sample_count: coverage.approvedSampleCount,
      missing_profiles: coverage.missingProfiles,
    },
    invalid_samples: catalog.invalid_samples,
    approved_samples: catalog.approved_samples,
  };
}

export function buildReferencePromotionReport({ workspaceRoot }: { workspaceRoot: string }): ReferencePromotionReport {
  return {
    surface_kind: 'reference_promotion_report',
    promoted_references: listPromotedReferences({ workspaceRoot }),
  };
}

export function buildReferenceReplacementReport({ workspaceRoot }: { workspaceRoot: string }): ReferenceReplacementReport {
  const promotedReferences = listPromotedReferences({ workspaceRoot });
  const groups = new Map<string, PromotedReferenceRecord[]>();

  for (const item of promotedReferences) {
    const key = `${item.overlay}::${item.profile_id}::${item.topic_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(item);
  }

  const replacements: ReferenceReplacementRecord[] = [];
  for (const entries of groups.values()) {
    const ordered = [...entries].sort((left, right) => {
      const leftTime = Date.parse(left.promoted_at || '') || 0;
      const rightTime = Date.parse(right.promoted_at || '') || 0;
      return leftTime - rightTime;
    });
    if (ordered.length < 2) continue;
    const latest = ordered.at(-1);
    if (!latest) continue;
    for (const older of ordered.slice(0, -1)) {
      replacements.push({
        superseded_reference_id: older.promoted_reference_id,
        replacement_reference_id: latest.promoted_reference_id,
        overlay: latest.overlay,
        profile_id: latest.profile_id,
        topic_id: latest.topic_id,
        superseded_deliverable_id: older.deliverable_id,
        replacement_deliverable_id: latest.deliverable_id,
      });
    }
  }

  return {
    surface_kind: 'reference_replacement_report',
    replacements,
  };
}
