import { isDeepStrictEqual } from 'node:util';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';

function summarizeField(name) {
  return String(name || '').trim();
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function allowNullSummaryField(governanceSurface, fieldName) {
  const boundary = governanceSurface?.family_boundary || {};
  return boundary.human_publication === true
    && (fieldName === 'operator_handoff' || fieldName === 'lifecycle_stage_summary');
}

function requiredGovernanceFields(record) {
  return {
    governance_surface: record?.governance_surface,
    source_readiness_summary: record?.source_readiness_summary,
    gate_summary: record?.gate_summary,
    operator_handoff: record?.operator_handoff,
    lifecycle_stage_summary: record?.lifecycle_stage_summary,
  };
}

function validateGovernanceFieldValue({ surfaceName, fieldName, value, governanceSurface }) {
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

export function buildGovernanceSurface(contract) {
  return buildGovernanceSurfaceContract(contract);
}

export function validateGovernanceRecord(surfaceName, record) {
  const normalizedSurfaceName = summarizeField(surfaceName) || 'governance_surface';
  const governanceSurface = record?.governance_surface;
  if (!isObjectRecord(governanceSurface)) {
    throw new Error(`${normalizedSurfaceName} governance summary missing governance_surface`);
  }

  for (const [fieldName, value] of Object.entries(requiredGovernanceFields(record))) {
    validateGovernanceFieldValue({
      surfaceName: normalizedSurfaceName,
      fieldName,
      value,
      governanceSurface,
    });
  }

  return governanceSurface;
}

export function assertGovernanceParity(surfaceName, leftRecord, rightRecord) {
  const normalizedSurfaceName = summarizeField(surfaceName) || 'governance_parity';
  validateGovernanceRecord(`${normalizedSurfaceName}.left`, leftRecord);
  validateGovernanceRecord(`${normalizedSurfaceName}.right`, rightRecord);

  for (const fieldName of Object.keys(requiredGovernanceFields(leftRecord))) {
    if (!isDeepStrictEqual(leftRecord[fieldName], rightRecord[fieldName])) {
      throw new Error(`${normalizedSurfaceName} governance parity drift on ${fieldName}`);
    }
  }
}

export function validatePublicationProjection(publication) {
  const deliverables = publication?.deliverables;
  if (!deliverables || typeof deliverables !== 'object' || Array.isArray(deliverables)) {
    throw new Error('getPublicationProjection governance summary missing deliverables');
  }

  for (const [deliverableId, entry] of Object.entries(deliverables)) {
    validateGovernanceRecord(`getPublicationProjection.${deliverableId}`, entry);
  }
}
