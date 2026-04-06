export interface ReferenceApproval {
  approvedBy: string;
  approvedAt: string;
  decisionRef: string;
}

export interface ReferenceProvenance {
  kind: string;
  sourceRef: string;
}

export interface ReferenceScope {
  overlay: string;
  profileIds: string[];
  supportedModes: string[];
}

export interface ReferenceSampleMeta {
  schemaVersion: 1;
  sampleId: string;
  status: 'approved';
  overlay: string;
  profileId: string;
  topicId: string;
  title: string;
  goal: string;
  sourceFile: string;
  referenceMode: 'seed_backed_with_source_provenance' | 'source_backed';
  approval: ReferenceApproval;
  provenance: ReferenceProvenance;
  scope: ReferenceScope;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ReferenceSampleFixture {
  dir: string;
  metaFile: string;
  sourceFile: string | null;
  meta: ReferenceSampleMeta;
  sourceText: string;
  validation: ValidationResult;
}

export interface ApprovedSampleRecord {
  overlay: string;
  profileId: string;
  sampleId: string;
}

export interface InvalidSampleRecord {
  overlay: string;
  sampleId: string;
  errors: string[];
}

export interface ReferenceCoverageSummary {
  ok: boolean;
  expectedProfileCount: number;
  approvedSampleCount: number;
  approvedSamples: ApprovedSampleRecord[];
  invalidSamples: InvalidSampleRecord[];
  missingProfiles: Array<{ overlay: string; profileId: string }>;
}

export interface ReferenceCatalogRecord {
  overlay: string;
  profile_id: string;
  sample_id: string;
  approval: ReferenceApproval | null;
  provenance: ReferenceProvenance | null;
}

export interface ReferenceSampleCatalog {
  surface_kind: 'reference_sample_catalog';
  approved_samples: ReferenceCatalogRecord[];
  invalid_samples: Array<ReferenceCatalogRecord & { errors: string[] }>;
}

export interface PromotedReferenceRecord {
  promoted_reference_id: string;
  promoted_at: string | null;
  promoted_by: string | null;
  source_deliverable_id: string;
  deliverable_id: string;
  topic_id: string;
  overlay: string;
  profile_id: string;
}

export interface ReferencePromotionReport {
  surface_kind: 'reference_promotion_report';
  promoted_references: PromotedReferenceRecord[];
}

export interface ReferenceReplacementRecord {
  superseded_reference_id: string;
  replacement_reference_id: string;
  overlay: string;
  profile_id: string;
  topic_id: string;
  superseded_deliverable_id: string;
  replacement_deliverable_id: string;
}

export interface ReferenceReplacementReport {
  surface_kind: 'reference_replacement_report';
  replacements: ReferenceReplacementRecord[];
}

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

export interface ReferenceQualityReport {
  surface_kind: 'reference_quality_report';
  ready: boolean;
  coverage: {
    expected_profile_count: number;
    approved_sample_count: number;
    missing_profiles: Array<{ overlay: string; profileId: string }>;
  };
  invalid_samples: Array<ReferenceCatalogRecord & { errors: string[] }>;
  approved_samples: ReferenceCatalogRecord[];
}
