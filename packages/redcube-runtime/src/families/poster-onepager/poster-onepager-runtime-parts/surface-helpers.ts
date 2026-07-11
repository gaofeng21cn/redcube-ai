// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  canonicalStageForRoute,
  readStageFolderArtifact,
  runRedCubePythonHelper,
  stageFolderArtifactPath,
  stageOrderForCanonicalStage,
} from '@redcube/runtime-protocol';
import { readJson, writeJson } from '../../../runtime-utils.js';

export { readJson, writeJson };

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function copySurfaceFile(source, destination) {
  const sourceFile = safeText(source);
  const destinationFile = safeText(destination);
  if (!sourceFile || !destinationFile || !existsSync(sourceFile)) return null;
  ensureDir(path.dirname(destinationFile));
  writeFileSync(destinationFile, readFileSync(sourceFile));
  return destinationFile;
}

export function getDeliverableViewSurfacePaths(deliverablePaths, deliverableId) {
  return {
    stableHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.html`),
    stableSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`),
    draftHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.html`),
    draftSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.slides.json`),
  };
}

export function seedStableViewIfMissing(paths, htmlFile, slidesFile) {
  const refs = [];
  if (!existsSync(paths.stableHtmlFile)) {
    const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
    if (stableHtmlRef) refs.push(stableHtmlRef);
  }
  if (!existsSync(paths.stableSlidesFile)) {
    const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
    if (stableSlidesRef) refs.push(stableSlidesRef);
  }
  return refs;
}

export function promoteStableView(paths, htmlFile, slidesFile) {
  const refs = [];
  const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
  if (stableHtmlRef) refs.push(stableHtmlRef);
  const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
  if (stableSlidesRef) refs.push(stableSlidesRef);
  return refs;
}

export function writeText(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, value, 'utf-8');
}

export function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
  const canonicalStageId = canonicalStageForRoute(stageId);
  return stageFolderArtifactPath({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: safeText(deliverablePaths.programId),
    topicId: safeText(deliverablePaths.topicId),
    deliverableId: deliverablePaths.deliverableId,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    outputName: safeText(stage?.output_artifact, `${stageId}.json`),
  });
}

export function readStageArtifact(contract, deliverablePaths, stageId) {
  const loaded = readStageFolderArtifact({
    deliverablePaths,
    routeStageId: stageId,
    canonicalStageId: canonicalStageForRoute(stageId),
  });
  return loaded?.status === 'success' || loaded?.status === 'blocked'
    ? loaded.artifact
    : null;
}

export function normalizeInlineText(value, maxLength = 220) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function runPython(helper, args) {
  return runRedCubePythonHelper(helper, args, {
    failureMessagePrefix: 'python helper failed',
  }).payload;
}
