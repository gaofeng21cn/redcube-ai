import { isDeepStrictEqual } from 'node:util';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';

import type { GovernanceSurfaceContract } from './types.js';

const GOVERNANCE_FIELD_NAMES = [
  'governance_surface',
  'source_readiness_summary',
  'gate_summary',
  'operator_handoff',
  'lifecycle_stage_summary',
] as const;

type GovernanceFieldName = typeof GOVERNANCE_FIELD_NAMES[number];
type GovernanceRecord = Record<string, unknown>;
type GovernanceFields = Record<GovernanceFieldName, unknown>;

function summarizeField(name: unknown): string {
  return String(name || '').trim();
}

function isObjectRecord(value: unknown): value is GovernanceRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function allowNullSummaryField(governanceSurface: unknown, fieldName: GovernanceFieldName): boolean {
  const surface = isObjectRecord(governanceSurface) ? governanceSurface : {};
  const boundary = isObjectRecord(surface.family_boundary) ? surface.family_boundary : {};
  return boundary.human_publication === true
    && (fieldName === 'operator_handoff' || fieldName === 'lifecycle_stage_summary');
}

function requiredGovernanceFields(record: unknown): GovernanceFields {
  const normalizedRecord = isObjectRecord(record) ? record : {};
  return {
    governance_surface: normalizedRecord.governance_surface,
    source_readiness_summary: normalizedRecord.source_readiness_summary,
    gate_summary: normalizedRecord.gate_summary,
    operator_handoff: normalizedRecord.operator_handoff,
    lifecycle_stage_summary: normalizedRecord.lifecycle_stage_summary,
  };
}

function validateGovernanceFieldValue({
  surfaceName,
  fieldName,
  value,
  governanceSurface,
}: {
  surfaceName: string;
  fieldName: GovernanceFieldName;
  value: unknown;
  governanceSurface: unknown;
}): void {
  if (value === undefined) {
    throw new Error(`${surfaceName} governance summary missing ${fieldName}`);
  }
  if (fieldName === 'operator_handoff' || fieldName === 'lifecycle_stage_summary') {
    if (value === null && allowNullSummaryField(governanceSurface, fieldName)) {
      return;
    }
  }
  if (!isObjectRecord(value)) {
    throw new Error(`${surfaceName} governance summary invalid ${fieldName}`);
  }
}

export function buildGovernanceSurface(contract: GovernanceRecord = {}): GovernanceSurfaceContract {
  return buildGovernanceSurfaceContract(
    contract as Parameters<typeof buildGovernanceSurfaceContract>[0],
  ) as GovernanceSurfaceContract;
}

function validateGovernanceRecord(surfaceName: unknown, record: unknown): GovernanceRecord {
  const normalizedSurfaceName = summarizeField(surfaceName) || 'governance_surface';
  const fields = requiredGovernanceFields(record);
  const governanceSurface = fields.governance_surface;
  if (!isObjectRecord(governanceSurface)) {
    throw new Error(`${normalizedSurfaceName} governance summary missing governance_surface`);
  }

  for (const fieldName of GOVERNANCE_FIELD_NAMES) {
    validateGovernanceFieldValue({
      surfaceName: normalizedSurfaceName,
      fieldName,
      value: fields[fieldName],
      governanceSurface,
    });
  }

  return governanceSurface;
}

export function assertGovernanceParity(
  surfaceName: unknown,
  leftRecord: unknown,
  rightRecord: unknown,
): void {
  const normalizedSurfaceName = summarizeField(surfaceName) || 'governance_parity';
  validateGovernanceRecord(`${normalizedSurfaceName}.left`, leftRecord);
  validateGovernanceRecord(`${normalizedSurfaceName}.right`, rightRecord);

  const leftFields = requiredGovernanceFields(leftRecord);
  const rightFields = requiredGovernanceFields(rightRecord);
  for (const fieldName of GOVERNANCE_FIELD_NAMES) {
    if (!isDeepStrictEqual(leftFields[fieldName], rightFields[fieldName])) {
      throw new Error(`${normalizedSurfaceName} governance parity drift on ${fieldName}`);
    }
  }
}

export function validatePublicationProjection(publication: unknown): void {
  const publicationRecord = isObjectRecord(publication) ? publication : {};
  const deliverables = publicationRecord.deliverables;
  if (!isObjectRecord(deliverables)) {
    throw new Error('getPublicationProjection governance summary missing deliverables');
  }

  for (const [deliverableId, entry] of Object.entries(deliverables)) {
    validateGovernanceRecord(`getPublicationProjection.${deliverableId}`, entry);
  }
}
