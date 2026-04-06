import {
  loadReferenceSampleFixture as loadReferenceSampleFixtureJs,
  listPromotedReferences as listPromotedReferencesJs,
  listReferenceSamples as listReferenceSamplesJs,
  summarizeReferenceCoverage as summarizeReferenceCoverageJs,
  validateReferenceSampleMeta as validateReferenceSampleMetaJs,
} from './reference-samples.js';
import {
  buildReferencePromotionReport as buildReferencePromotionReportJs,
  buildReferenceQualityReport as buildReferenceQualityReportJs,
  buildReferenceReplacementReport as buildReferenceReplacementReportJs,
  buildRelativeQualityRubric as buildRelativeQualityRubricJs,
  compareFailuresAndDensity as compareFailuresAndDensityJs,
  summarizeRelativeQuality as summarizeRelativeQualityJs,
} from './relative-quality.js';

import type {
  ReferenceCatalogRecord,
  ReferenceCoverageSummary,
  ReferencePromotionReport,
  ReferenceQualityReport,
  ReferenceReplacementReport,
  ReferenceSampleFixture,
  ReferenceSampleMeta,
  RelativeQualityRubric,
  ValidationResult,
} from './types.js';

export function validateReferenceSampleMeta(meta: unknown): ValidationResult {
  return validateReferenceSampleMetaJs(meta) as ValidationResult;
}

export function loadReferenceSampleFixture(input: {
  rootDir: string;
  familyId: string;
  sampleId: string;
}): ReferenceSampleFixture {
  return loadReferenceSampleFixtureJs(input) as ReferenceSampleFixture;
}

export function summarizeReferenceCoverage(input: {
  rootDir: string;
  overlayRegistry: { listOverlays(): string[]; listProfiles(overlayId: string): string[] };
}): ReferenceCoverageSummary {
  return summarizeReferenceCoverageJs(input) as ReferenceCoverageSummary;
}

export function listReferenceSamples(input: { rootDir: string }): {
  surface_kind: 'reference_sample_catalog';
  approved_samples: ReferenceCatalogRecord[];
  invalid_samples: Array<ReferenceCatalogRecord & { errors: string[] }>;
} {
  return listReferenceSamplesJs(input) as {
    surface_kind: 'reference_sample_catalog';
    approved_samples: ReferenceCatalogRecord[];
    invalid_samples: Array<ReferenceCatalogRecord & { errors: string[] }>;
  };
}

export function listPromotedReferences(input: { workspaceRoot: string }) {
  return listPromotedReferencesJs(input) as ReferencePromotionReport['promoted_references'];
}

export function buildReferenceQualityReport(input: {
  rootDir: string;
  overlayRegistry: { listOverlays(): string[]; listProfiles(overlayId: string): string[] };
}): ReferenceQualityReport {
  return buildReferenceQualityReportJs(input) as ReferenceQualityReport;
}

export function buildReferencePromotionReport(input: { workspaceRoot: string }): ReferencePromotionReport {
  return buildReferencePromotionReportJs(input) as ReferencePromotionReport;
}

export function buildReferenceReplacementReport(input: { workspaceRoot: string }): ReferenceReplacementReport {
  return buildReferenceReplacementReportJs(input) as ReferenceReplacementReport;
}

export function buildRelativeQualityRubric(input: { dimensions: RelativeQualityRubric['dimensions'] }): RelativeQualityRubric {
  return buildRelativeQualityRubricJs(input) as RelativeQualityRubric;
}

export function compareFailuresAndDensity(input: {
  currentFailures: number;
  baselineFailures: number;
  currentDensity: number;
  baselineDensity: number;
  densityTolerance: number;
  densityDigits?: number;
  densityLabel?: string;
}): RelativeQualityRubric {
  return compareFailuresAndDensityJs(input) as RelativeQualityRubric;
}

export function summarizeRelativeQuality(relativeQuality: RelativeQualityRubric): string {
  return summarizeRelativeQualityJs(relativeQuality);
}

export type {
  ReferenceApproval,
  ReferenceCatalogRecord,
  ReferenceCoverageSummary,
  ReferencePromotionReport,
  ReferenceProvenance,
  ReferenceQualityReport,
  ReferenceReplacementRecord,
  ReferenceReplacementReport,
  ReferenceSampleFixture,
  ReferenceSampleMeta,
  ReferenceScope,
  RelativeQualityDimension,
  RelativeQualityOverall,
  RelativeQualityRubric,
  ValidationResult,
} from './types.js';
