// @ts-nocheck
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { safeText } from '../runtime-utils.js';

export function sha256Text(value) {
  return createHash('sha256').update(String(value || ''), 'utf-8').digest('hex');
}

export function normalizeKeywords(input) {
  if (Array.isArray(input)) {
    return input.map((item) => safeText(item)).filter(Boolean);
  }
  return safeText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeSourceFiles(input) {
  if (Array.isArray(input)) {
    return input.map((item) => safeText(item)).filter(Boolean);
  }
  return safeText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeOperatorFiles(input) {
  if (Array.isArray(input)) {
    return input.map((item) => safeText(item)).filter(Boolean);
  }
  return safeText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function sourceContentHashInput(source) {
  if (source.kind === 'brief') return `brief\n${safeText(source.brief_text)}`;
  if (source.kind === 'keywords') return `keywords\n${source.keywords.join('\n')}`;
  if (source.kind === 'markdown' || source.kind === 'text' || source.kind === 'pdf') {
    return readFileSync(source.absolute_path);
  }
  return `${source.kind}\n${safeText(source.relative_path)}`;
}

export function enrichSourceFingerprint(source) {
  const content = sourceContentHashInput(source);
  const contentHash = createHash('sha256').update(content).digest('hex');
  return {
    ...source,
    content_hash: contentHash,
  };
}

export function sourceReuseKey(source) {
  return `${safeText(source?.source_role)}:${safeText(source?.content_hash)}`;
}

export function previousSourceByHash(previousManifest) {
  return new Map(
    (Array.isArray(previousManifest?.sources) ? previousManifest.sources : [])
      .filter((source) => safeText(source?.content_hash))
      .map((source) => [sourceReuseKey(source), source]),
  );
}

export function previousMaterialBySourceHash(previousManifest, previousMaterials) {
  const materialById = new Map(
    (Array.isArray(previousMaterials?.materials) ? previousMaterials.materials : [])
      .filter((material) => safeText(material?.material_id))
      .map((material) => [material.material_id, material]),
  );
  return new Map(
    (Array.isArray(previousManifest?.sources) ? previousManifest.sources : [])
      .map((source) => [sourceReuseKey(source), materialById.get(safeText(source?.material_id))])
      .filter(([reuseKey, material]) => reuseKey && material),
  );
}

export function unchangedSourcePackReuseDecision({ previousManifest, intakeSources }) {
  if (!previousManifest || safeText(previousManifest.artifact_kind) !== 'source_pack_manifest') {
    return {
      canReuseFrozenPack: false,
      reason: 'previous_manifest_missing',
    };
  }
  const previousSources = Array.isArray(previousManifest.sources) ? previousManifest.sources : [];
  if (previousSources.length !== intakeSources.length) {
    return {
      canReuseFrozenPack: false,
      reason: 'source_count_changed',
    };
  }
  const previousKeys = previousSources
    .map((source) => `${safeText(source.source_role)}:${safeText(source.kind)}:${safeText(source.content_hash)}`)
    .sort();
  const currentKeys = intakeSources
    .map((source) => `${safeText(source.source_role)}:${safeText(source.kind)}:${safeText(source.content_hash)}`)
    .sort();
  const unchanged = previousKeys.every((key, index) => key === currentKeys[index]);
  return {
    canReuseFrozenPack: unchanged,
    reason: unchanged ? 'unchanged_source_manifest' : 'source_content_changed',
  };
}
