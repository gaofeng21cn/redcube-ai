// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../product-domain-action-test-api.ts';
import { withEnv, withMockCodexRuntime } from '../mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './test-workspace.ts';
import { buildMockPptNativeShapePlan } from './mock-codex-cli-parts/ppt-builders/native.ts';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function patchDeliverableConstraints({
  workspaceRoot,
  topicId = 'topic-a',
  deliverableId,
  constraints,
}) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = readJson(deliverablePaths.deliverableFile);
  deliverable.contract = {
    ...(deliverable.contract || {}),
    delivery_request: {
      ...(deliverable.contract?.delivery_request || {}),
      constraints: {
        ...(deliverable.contract?.delivery_request?.constraints || {}),
        ...(constraints || {}),
      },
    },
  };
  deliverable.hydrated_contract = {
    ...(deliverable.hydrated_contract || {}),
    delivery_request: {
      ...(deliverable.hydrated_contract?.delivery_request || {}),
      constraints: {
        ...(deliverable.hydrated_contract?.delivery_request?.constraints || {}),
        ...(constraints || {}),
      },
    },
  };
  writeJson(deliverablePaths.deliverableFile, deliverable);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const contractFile = path.join(deliverablePaths.deliverableDir, contractRef);
  const hydratedContract = readJson(contractFile);
  hydratedContract.delivery_request = {
    ...(hydratedContract.delivery_request || {}),
    constraints: {
      ...(hydratedContract.delivery_request?.constraints || {}),
      ...(constraints || {}),
    },
  };
  writeJson(contractFile, hydratedContract);
}

function flattenNativeVisibleText(nativeArtifact, shapeManifest) {
  return [
    JSON.stringify(nativeArtifact?.native_ppt_bundle?.slides || []),
    JSON.stringify(shapeManifest?.slides || []),
  ].join('\n');
}

function fileSha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function nativeEngineContract() {
  return readJson(path.resolve('contracts/runtime-program/ppt-native-python-engine-contract.json'));
}

function rectFromInches(shape) {
  const bounds = shape?.bounds || {};
  return {
    left: Number(bounds.left_in || 0),
    top: Number(bounds.top_in || 0),
    right: Number(bounds.left_in || 0) + Number(bounds.width_in || 0),
    bottom: Number(bounds.top_in || 0) + Number(bounds.height_in || 0),
  };
}

function overlapArea(leftShape, rightShape) {
  const left = rectFromInches(leftShape);
  const right = rectFromInches(rightShape);
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
  return Number((width * height).toFixed(5));
}

function contentTextOverlapPairs(shapes) {
  const textShapes = shapes.filter((shape) => (
    shape?.kind === 'text_box'
    && ['title', 'core_sentence', 'point_index', 'point_text', 'body', 'content'].includes(String(shape?.role || ''))
  ));
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < textShapes.length; leftIndex += 1) {
    for (const rightShape of textShapes.slice(leftIndex + 1)) {
      const area = overlapArea(textShapes[leftIndex], rightShape);
      if (area > 0) {
        overlaps.push({
          a: textShapes[leftIndex].shape_id,
          b: rightShape.shape_id,
          area,
        });
      }
    }
  }
  return overlaps;
}

function weightedTextWidthPx(text, fontSize) {
  return [...String(text || '')].reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.32;
    if (char.codePointAt(0) > 127) return width + fontSize * 0.95;
    if (/[A-Z]/.test(char)) return width + fontSize * 0.68;
    if (['-', '/', ':'].includes(char)) return width + fontSize * 0.38;
    return width + fontSize * 0.56;
  }, 0);
}

function textCapacityFailures(shapes) {
  return shapes
    .filter((shape) => shape?.kind === 'text_box' && shape?.role === 'point_text')
    .map((shape) => {
      const bounds = shape.bounds || {};
      const widthPx = Number(bounds.width_in || 0) * 72;
      const heightPx = Number(bounds.height_in || 0) * 72;
      const fontSize = Number(shape.font_size || 18);
      const estimatedLines = Math.max(1, Math.ceil(weightedTextWidthPx(shape.editable_text, fontSize) / Math.max(widthPx - 12, 1)));
      const maxLines = Math.max(1, Math.floor(heightPx / Math.max(fontSize * 1.16, 1)));
      return estimatedLines > maxLines ? {
        shape_id: shape.shape_id,
        estimatedLines,
        maxLines,
      } : null;
    })
    .filter(Boolean);
}

function pointIndexTextFailures(shapePlan) {
  return shapePlan.slides
    .flatMap((slide) => (slide.native_shapes || [])
      .filter((shape) => shape?.role === 'point_index')
      .map((shape) => ({
        slide_id: slide.slide_id,
        shape_id: shape.shape_id,
        editable_text: String(shape.editable_text || shape.text || shape.label || '').trim(),
        font_size: Number(shape.font_size || 0),
      })))
    .filter((shape) => !shape.editable_text || shape.font_size < 16);
}

async function runNativePlanningChain({ workspaceRoot, deliverableId = 'deck-native', constraints = undefined }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId,
    title: 'Native PPT 探索 deck',
    goal: '验证 PPT family 可在 HTML 路线之外直接生成可编辑 PPTX',
    constraints,
  });

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, route);
  }
}

async function withMockNativePptRuntime(testFn) {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    return await withMockCodexRuntime(testFn);
  } finally {
    restoreEnv();
  }
}


export {
  MOCK_REDCUBE_PYTHON_COMMAND,
  contentTextOverlapPairs,
  fileSha256,
  flattenNativeVisibleText,
  nativeEngineContract,
  patchDeliverableConstraints,
  pointIndexTextFailures,
  readJson,
  runNativePlanningChain,
  textCapacityFailures,
  withMockNativePptRuntime,
  writeJson,
};
