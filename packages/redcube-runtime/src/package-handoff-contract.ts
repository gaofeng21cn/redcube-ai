import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';

type JsonRecord = Record<string, unknown>;

export const FINAL_BYTE_HANDOFF_REVIEW = 'final_byte_handoff_review';
export const OUTPUT_CANDIDATE_PENDING_REVIEW = 'output_candidate_pending_review';

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function uniqueStrings(value: unknown[]): string[] {
  return [...new Set((Array.isArray(value) ? value : []).map((entry) => safeText(entry)).filter(Boolean))];
}

function refSegment(value: unknown, fallback: string): string {
  return safeText(value, fallback).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

function artifactRefMetadata(ref: string): JsonRecord | null {
  if (!existsSync(ref) || !statSync(ref).isFile()) return null;
  const body = readFileSync(ref);
  return {
    ref,
    sha256: createHash('sha256').update(body).digest('hex'),
    size_bytes: body.length,
  };
}

export function buildPackageCandidateCloseout({
  family,
  route,
  deliverableId,
  artifactRefs = [],
  upstreamReviewRefs = [],
}: {
  family?: unknown;
  route: unknown;
  deliverableId: unknown;
  artifactRefs?: unknown[];
  upstreamReviewRefs?: unknown[];
}): JsonRecord {
  const safeFamily = refSegment(family, 'visual_deliverable');
  const safeRoute = refSegment(route, 'package_candidate');
  const safeDeliverableId = refSegment(deliverableId, 'deliverable');
  const candidateArtifactRefs = uniqueStrings(artifactRefs);
  const exactArtifactRefMetadata = candidateArtifactRefs
    .map((ref) => artifactRefMetadata(ref))
    .filter((entry): entry is JsonRecord => Boolean(entry));
  const exactArtifactRefs = exactArtifactRefMetadata.map((entry) => String(entry.ref));
  const exactArtifactHashes = exactArtifactRefMetadata.map((entry) => String(entry.sha256));
  const unhashedArtifactRefs = candidateArtifactRefs.filter((ref) => !exactArtifactRefs.includes(ref));
  const receiptRef = `rca-artifact-identity-receipt:package-handoff:${safeFamily}:${safeRoute}:${safeDeliverableId}`;
  const exportCandidateRef = `rca-export-candidate:${safeFamily}:${safeRoute}:${safeDeliverableId}`;
  const receiptAvailable = exactArtifactRefMetadata.length > 0;

  return {
    artifact_identity_receipt_refs: receiptAvailable ? [receiptRef] : [],
    artifact_identity_receipt: receiptAvailable ? {
      surface_kind: 'artifact_identity_receipt',
      version: 'artifact-identity-receipt.v1',
      source_contract: 'rca.package_artifact_identity_receipt.v1',
      receipt_ref: receiptRef,
      receipt_purpose: 'exact_candidate_bytes_identity_only',
      owner: 'redcube_ai',
      route_stage_id: safeRoute,
      deliverable_id: safeDeliverableId,
      export_candidate_ref: exportCandidateRef,
      exact_artifact_refs: exactArtifactRefs,
      exact_artifact_hashes: exactArtifactHashes,
      exact_artifact_ref_metadata: exactArtifactRefMetadata,
      candidate_artifact_refs: candidateArtifactRefs,
      unhashed_artifact_refs: unhashedArtifactRefs,
      hash_metadata_complete: unhashedArtifactRefs.length === 0,
      authorizes_quality_export_publication_or_ready_claim: false,
      authority_boundary: {
        receipt_is_artifact_identity_only: true,
        receipt_is_domain_owner_acceptance: false,
        receipt_can_authorize_ready_claim: false,
        required_decisive_attempt_roles: ['reviewer', 're_reviewer'],
      },
    } : null,
    upstream_review_refs: uniqueStrings(upstreamReviewRefs),
    export_candidate_ref: exportCandidateRef,
    handoff_review_state: {
      status: 'pending_fresh_review',
      artifact_identity_receipt_refs: receiptAvailable ? [receiptRef] : [],
      exact_artifact_refs: exactArtifactRefs,
      exact_artifact_hashes: exactArtifactHashes,
      exact_artifact_ref_metadata: exactArtifactRefMetadata,
      hash_metadata_complete: receiptAvailable && unhashedArtifactRefs.length === 0,
      ready_claim_authorized: false,
      decisive_attempt_roles: ['reviewer', 're_reviewer'],
    },
  };
}
