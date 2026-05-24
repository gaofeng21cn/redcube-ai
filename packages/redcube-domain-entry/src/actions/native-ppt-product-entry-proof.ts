// @ts-nocheck
import { readFileSync } from 'node:fs';

import { invokeProductEntry } from './invoke-product-entry.js';
import { getProductEntrySession } from './get-product-entry-session.js';
import { getProductEntryManifest } from './get-product-entry-manifest.js';

const NATIVE_PPT_ROUTES = ['author_pptx_native', 'repair_pptx_native'];

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function routeFromRequest(request) {
  const route = safeText(request?.route, 'author_pptx_native');
  if (!NATIVE_PPT_ROUTES.includes(route)) {
    throw new Error(`native PPT proof route 仅支持 ${NATIVE_PPT_ROUTES.join('|')}`);
  }
  return route;
}

function nativeArtifactRefs(routeResult, sessionSurface) {
  const artifactRefs = [];
  const artifactFile = safeText(routeResult?.artifactFile);
  if (artifactFile) {
    artifactRefs.push({
      artifact_kind: 'route_artifact',
      path: artifactFile,
      source: 'route_run',
    });
  }

  let artifact = routeResult?.artifact || null;
  if (!artifact && artifactFile) {
    artifact = readJson(artifactFile);
  }
  const bundle = artifact?.native_ppt_bundle || {};
  const renderProof = bundle?.render_proof || {};
  for (const [artifactKind, value] of [
    ['pptx', bundle.pptx_file],
    ['pdf', bundle.pdf_file],
    ['shape_manifest', bundle.shape_manifest_file],
    ['repair_log', bundle.repair_log_file],
  ]) {
    const path = safeText(value);
    if (path) {
      artifactRefs.push({
        artifact_kind: artifactKind,
        path,
        source: 'native_ppt_bundle',
      });
    }
  }
  for (const screenshot of Array.isArray(renderProof.preview_screenshots) ? renderProof.preview_screenshots : []) {
    const path = safeText(screenshot);
    if (path) {
      artifactRefs.push({
        artifact_kind: 'preview_png',
        path,
        source: 'native_render_proof',
      });
    }
  }

  const sessionRefs = Array.isArray(sessionSurface?.artifact_inventory?.artifact_refs)
    ? sessionSurface.artifact_inventory.artifact_refs
    : [];
  for (const path of sessionRefs.map((entry) => safeText(entry)).filter(Boolean)) {
    artifactRefs.push({
      artifact_kind: 'session_artifact',
      path,
      source: 'product_entry_session',
    });
  }

  const seen = new Set();
  return artifactRefs.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
}

export async function runNativePptProductEntryProof(request) {
  const workspaceRoot = requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
  const topicId = requireField('topic_id', request?.topic_id || request?.topicId);
  const deliverableId = requireField('deliverable_id', request?.deliverable_id || request?.deliverableId);
  const entrySessionId = requireField('entry_session_id', request?.entry_session_id || request?.entrySessionId);
  const route = routeFromRequest(request);

  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const nativeRoute = manifest?.native_ppt_operator_ux?.route_selection || {};
  const allowedRoutes = Array.isArray(nativeRoute.runnable_routes) ? nativeRoute.runnable_routes : NATIVE_PPT_ROUTES;
  if (!allowedRoutes.includes(route)) {
    throw new Error(`native PPT proof route is blocked by product-entry manifest: ${route}`);
  }

  const productEntry = await invokeProductEntry({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    entry_session_contract: {
      entry_session_id: entrySessionId,
    },
    task_intent: 'run_deliverable_route',
    delivery_request: {
      deliverable_family: 'ppt_deck',
      topic_id: topicId,
      deliverable_id: deliverableId,
      profile_id: safeText(request?.profile_id || request?.profileId),
      title: safeText(request?.title),
      goal: safeText(request?.goal),
      route,
      adapter: safeText(request?.adapter),
      user_intent: safeText(request?.user_intent || request?.userIntent),
      stop_after_stage: safeText(request?.stop_after_stage || request?.stopAfterStage),
    },
  });
  const routeResult = productEntry?.domain_entry_surface?.result_surface || {};

  const sessionSurface = await getProductEntrySession({ entry_session_id: entrySessionId });
  const artifactRefs = nativeArtifactRefs(routeResult, sessionSurface);

  return {
    ok: routeResult.ok === true,
    surface_kind: 'native_ppt_product_entry_proof',
    recommended_action: routeResult.ok === true ? 'inspect_native_proof_artifacts' : 'inspect_run_failure',
    command: manifest?.native_ppt_operator_ux?.proof_runner?.helper_command || 'redcube native-ppt proof',
    route,
    proof_runner: manifest?.native_ppt_operator_ux?.proof_runner || null,
    dependency_diagnostics: manifest?.native_ppt_operator_ux?.dependency_diagnostics || null,
    blocked_reason: routeResult.ok === true ? null : safeText(routeResult?.error?.message || routeResult?.run?.error?.message, 'native_ppt_route_failed'),
    product_entry_surface: productEntry,
    route_result: routeResult,
    entry_session: sessionSurface?.entry_session || null,
    artifact_inventory: {
      surface_kind: 'native_ppt_proof_artifact_inventory',
      entry_session_id: entrySessionId,
      route,
      artifact_refs: artifactRefs,
      session_artifact_inventory: sessionSurface?.artifact_inventory || null,
      summary: {
        artifact_ref_count: artifactRefs.length,
        has_pptx: artifactRefs.some((entry) => entry.artifact_kind === 'pptx'),
        has_pdf: artifactRefs.some((entry) => entry.artifact_kind === 'pdf'),
        has_preview_png: artifactRefs.some((entry) => entry.artifact_kind === 'preview_png'),
        has_shape_manifest: artifactRefs.some((entry) => entry.artifact_kind === 'shape_manifest'),
      },
    },
    summary: {
      workspace_root: workspaceRoot,
      topic_id: topicId,
      deliverable_id: deliverableId,
      entry_session_id: entrySessionId,
      route,
      run_id: routeResult?.summary?.run_id || routeResult?.run?.run_id || null,
      status: routeResult?.summary?.status || routeResult?.run?.status || null,
      artifact_ref_count: artifactRefs.length,
    },
  };
}
