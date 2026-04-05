import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ALLOWED_REFERENCE_MODES = new Set([
  'seed_backed_with_source_provenance',
  'source_backed',
]);

const ALLOWED_SAMPLE_STATUSES = new Set([
  'approved',
]);

const ALLOWED_SUPPORTED_MODES = new Set([
  'draft_new',
  'optimize_existing',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function validateReferenceSampleMeta(meta) {
  const errors = [];

  if (!isPlainObject(meta)) {
    return {
      ok: false,
      errors: ['meta 必须是对象'],
    };
  }

  if (meta.schemaVersion !== 1) {
    errors.push('schemaVersion 必须为 1');
  }
  if (!isNonEmptyString(meta.sampleId)) {
    errors.push('sampleId 不能为空');
  }
  if (!ALLOWED_SAMPLE_STATUSES.has(String(meta.status || '').trim())) {
    errors.push('status 必须为 approved');
  }
  if (!isNonEmptyString(meta.overlay)) {
    errors.push('overlay 不能为空');
  }
  if (!isNonEmptyString(meta.profileId)) {
    errors.push('profileId 不能为空');
  }
  if (!isNonEmptyString(meta.topicId)) {
    errors.push('topicId 不能为空');
  }
  if (!isNonEmptyString(meta.title)) {
    errors.push('title 不能为空');
  }
  if (!isNonEmptyString(meta.goal)) {
    errors.push('goal 不能为空');
  }
  if (!isNonEmptyString(meta.sourceFile)) {
    errors.push('sourceFile 不能为空');
  }
  if (!ALLOWED_REFERENCE_MODES.has(String(meta.referenceMode || '').trim())) {
    errors.push('referenceMode 非法');
  }

  if (!isPlainObject(meta.approval)) {
    errors.push('approval 必须是对象');
  } else {
    if (!isNonEmptyString(meta.approval.approvedBy)) {
      errors.push('approval.approvedBy 不能为空');
    }
    if (!isNonEmptyString(meta.approval.approvedAt) || Number.isNaN(Date.parse(meta.approval.approvedAt))) {
      errors.push('approval.approvedAt 必须是有效 ISO 时间');
    }
    if (!isNonEmptyString(meta.approval.decisionRef)) {
      errors.push('approval.decisionRef 不能为空');
    }
  }

  if (!isPlainObject(meta.provenance)) {
    errors.push('provenance 必须是对象');
  } else {
    if (!isNonEmptyString(meta.provenance.kind)) {
      errors.push('provenance.kind 不能为空');
    }
    if (!isNonEmptyString(meta.provenance.sourceRef)) {
      errors.push('provenance.sourceRef 不能为空');
    }
  }

  if (!isPlainObject(meta.scope)) {
    errors.push('scope 必须是对象');
  } else {
    if (meta.scope.overlay !== meta.overlay) {
      errors.push('scope.overlay 必须与 overlay 一致');
    }
    if (!Array.isArray(meta.scope.profileIds) || meta.scope.profileIds.length === 0) {
      errors.push('scope.profileIds 必须包含至少一个 profile');
    } else if (!meta.scope.profileIds.every(isNonEmptyString)) {
      errors.push('scope.profileIds 必须是非空字符串数组');
    } else if (!meta.scope.profileIds.includes(meta.profileId)) {
      errors.push('scope.profileIds 必须覆盖 profileId');
    }

    if (!Array.isArray(meta.scope.supportedModes) || meta.scope.supportedModes.length === 0) {
      errors.push('scope.supportedModes 必须包含至少一个模式');
    } else if (!meta.scope.supportedModes.every((item) => ALLOWED_SUPPORTED_MODES.has(String(item || '').trim()))) {
      errors.push('scope.supportedModes 包含非法模式');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function loadReferenceSampleFixture({ rootDir, familyId, sampleId }) {
  if (!isNonEmptyString(rootDir)) {
    throw new Error('rootDir 不能为空');
  }
  if (!isNonEmptyString(familyId)) {
    throw new Error('familyId 不能为空');
  }
  if (!isNonEmptyString(sampleId)) {
    throw new Error('sampleId 不能为空');
  }

  const dir = path.resolve(rootDir, familyId);
  const metaFile = path.join(dir, `${sampleId}.json`);
  if (!existsSync(metaFile)) {
    throw new Error(`reference sample metadata 不存在: ${metaFile}`);
  }

  const meta = readJson(metaFile);
  const sourceFile = isNonEmptyString(meta.sourceFile) ? path.join(dir, meta.sourceFile) : null;
  const sourceText = sourceFile && existsSync(sourceFile)
    ? readFileSync(sourceFile, 'utf-8')
    : '';
  const validation = validateReferenceSampleMeta(meta);

  return {
    dir,
    metaFile,
    sourceFile,
    meta,
    sourceText,
    validation,
  };
}

export function summarizeReferenceCoverage({ rootDir, overlayRegistry }) {
  if (!isNonEmptyString(rootDir)) {
    throw new Error('rootDir 不能为空');
  }
  if (!overlayRegistry || typeof overlayRegistry.listOverlays !== 'function') {
    throw new Error('overlayRegistry 不能为空');
  }

  const approvedSamples = [];
  const invalidSamples = [];
  const coveredProfiles = new Set();
  const overlays = overlayRegistry.listOverlays();

  for (const overlay of overlays) {
    const overlayDir = path.resolve(rootDir, overlay);
    if (!existsSync(overlayDir)) continue;
    for (const item of readdirSync(overlayDir, { withFileTypes: true })) {
      if (!item.isFile() || !item.name.endsWith('.json')) continue;
      const sampleId = item.name.replace(/\.json$/u, '');
      const fixture = loadReferenceSampleFixture({
        rootDir,
        familyId: overlay,
        sampleId,
      });
      if (!fixture.validation.ok) {
        invalidSamples.push({
          overlay,
          sampleId,
          errors: fixture.validation.errors,
        });
        continue;
      }
      if (fixture.meta.status !== 'approved') continue;
      approvedSamples.push({
        overlay: fixture.meta.overlay,
        profileId: fixture.meta.profileId,
        sampleId: fixture.meta.sampleId,
      });
      coveredProfiles.add(`${fixture.meta.overlay}::${fixture.meta.profileId}`);
    }
  }

  const missingProfiles = [];
  for (const overlay of overlays) {
    for (const profileId of overlayRegistry.listProfiles(overlay)) {
      if (!coveredProfiles.has(`${overlay}::${profileId}`)) {
        missingProfiles.push({ overlay, profileId });
      }
    }
  }

  return {
    ok: missingProfiles.length === 0 && invalidSamples.length === 0,
    expectedProfileCount: overlays.reduce((sum, overlay) => sum + overlayRegistry.listProfiles(overlay).length, 0),
    approvedSampleCount: approvedSamples.length,
    approvedSamples,
    invalidSamples,
    missingProfiles,
  };
}

export function listReferenceSamples({ rootDir }) {
  if (!isNonEmptyString(rootDir)) {
    throw new Error('rootDir 不能为空');
  }

  const approvedSamples = [];
  const invalidSamples = [];

  for (const familyDir of readdirSync(path.resolve(rootDir), { withFileTypes: true })) {
    if (!familyDir.isDirectory()) continue;
    const familyId = familyDir.name;
    const dir = path.resolve(rootDir, familyId);
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (!item.isFile() || !item.name.endsWith('.json')) continue;
      const sampleId = item.name.replace(/\.json$/u, '');
      const fixture = loadReferenceSampleFixture({
        rootDir,
        familyId,
        sampleId,
      });
      const record = {
        overlay: fixture.meta.overlay,
        profile_id: fixture.meta.profileId,
        sample_id: fixture.meta.sampleId,
        approval: fixture.meta.approval || null,
        provenance: fixture.meta.provenance || null,
      };
      if (fixture.validation.ok && fixture.meta.status === 'approved') {
        approvedSamples.push(record);
      } else {
        invalidSamples.push({
          ...record,
          errors: fixture.validation.errors,
        });
      }
    }
  }

  return {
    surface_kind: 'reference_sample_catalog',
    approved_samples: approvedSamples,
    invalid_samples: invalidSamples,
  };
}

export function listPromotedReferences({ workspaceRoot }) {
  if (!isNonEmptyString(workspaceRoot)) {
    throw new Error('workspaceRoot 不能为空');
  }

  const topicsDir = path.resolve(workspaceRoot, 'topics');
  if (!existsSync(topicsDir)) {
    return [];
  }

  const promotedReferences = [];
  for (const topicEntry of readdirSync(topicsDir, { withFileTypes: true })) {
    if (!topicEntry.isDirectory()) continue;
    const topicId = topicEntry.name;
    const deliverablesDir = path.join(topicsDir, topicId, 'deliverables');
    if (!existsSync(deliverablesDir)) continue;

    for (const deliverableEntry of readdirSync(deliverablesDir, { withFileTypes: true })) {
      if (!deliverableEntry.isDirectory()) continue;
      const deliverableId = deliverableEntry.name;
      const deliverableDir = path.join(deliverablesDir, deliverableId);
      const deliverableFile = path.join(deliverableDir, 'deliverable.json');
      const reviewStateFile = path.join(deliverableDir, 'reports', 'review-state.json');
      if (!existsSync(deliverableFile) || !existsSync(reviewStateFile)) continue;

      const deliverable = readJson(deliverableFile);
      const reviewState = readJson(reviewStateFile);
      const baseline = reviewState?.baseline || null;
      if (baseline?.promotion_state !== 'promoted') continue;

      promotedReferences.push({
        promoted_reference_id: baseline.promoted_reference_id,
        promoted_at: baseline.promoted_at || null,
        promoted_by: baseline.promoted_by || null,
        source_deliverable_id: baseline.source_deliverable_id || deliverableId,
        deliverable_id: deliverableId,
        topic_id: topicId,
        overlay: deliverable.overlay,
        profile_id: deliverable.profile_id,
      });
    }
  }

  return promotedReferences;
}
