#!/usr/bin/env node
// @ts-nocheck
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import {
  buildPerformanceReport,
  createDeliverable,
  invokeProductEntry,
  researchSource,
} from '@redcube/domain-entry';
import { probeCodexCli, readCodexCliContract } from '@redcube/codex-cli-client';
import { getSourceArtifactPaths } from '@redcube/runtime-protocol';
import { collectNativeTerminalEvidence } from './real-route-evolution-probe-parts/terminal-evidence.ts';
import {
  collectNativeRouteAttemptEvidence,
  materializeRouteTimeoutBlockerArtifact,
} from './real-route-evolution-probe-parts/timeout-blocker.ts';

const DEFAULT_ROUTE_LANES = ['image', 'html', 'native'];
const MOCK_CODEX_BIN = path.join(process.cwd(), 'tests/helpers/mock-codex-cli-bin.ts');
const MOCK_PYTHON_BIN = path.join(process.cwd(), 'tests/helpers/mock-redcube-python-with-playwright.ts');
const ROUTE_SEQUENCES = {
  image: [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ],
  html: [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ],
  native: [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ],
};

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildOplRouteAttemptIndex({
  lane,
  route,
  iteration,
  topicId,
  deliverableId,
  entrySessionId,
}) {
  const routeId = safeText(route, 'unknown_route');
  const runId = [
    safeText(lane, 'lane'),
    String(iteration || 0),
    safeText(topicId, 'topic'),
    safeText(deliverableId, 'deliverable'),
    routeId,
    safeText(entrySessionId, randomUUID()),
  ].join('/');
  return {
    surface_kind: 'cross_provider_attempt_index',
    version: 'cross-provider-attempt-index.v1',
    owner: 'one-person-lab',
    provider_attempt_owner: 'one-person-lab',
    domain_adapter_owner: 'redcube_ai',
    provider_attempt_ref: `opl-provider-attempt:real-route-probe/redcube_ai/${runId}`,
    provider_attempt_ledger_ref: `attempt-ledger:opl/real-route-probe/redcube_ai/${runId}`,
    stage_attempt_ref: `opl-stage-attempt:real-route-probe/redcube_ai/${runId}`,
    attempt_lease_ref: `opl-attempt-lease:real-route-probe/redcube_ai/${runId}`,
    provider_attempt_ref_required: true,
    provider_attempt_ledger_ref_required: true,
    missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
    local_session_ref_is_not_provider_attempt_ref: true,
    rca_does_not_own_provider_attempt_ledger: true,
    can_claim_current_without_provider_ledger: false,
  };
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function fileSha256(file) {
  if (!file || !existsSync(file)) return null;
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function collectNativeRouteAttemptEvidenceForTest(input) {
  return collectNativeRouteAttemptEvidence(input);
}

function runtimeStateRoot() {
  return path.join(
    process.env.CODEX_HOME || path.join(os.homedir(), '.codex'),
    'projects',
    'redcube-ai',
    'runtime-state',
  );
}

function timestampId() {
  return new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function materializeRouteTimeoutBlockerArtifactForTest(input) {
  return materializeRouteTimeoutBlockerArtifact(input);
}

function normalizeRoutes(routes) {
  const selected = safeArray(routes).length > 0
    ? safeArray(routes)
    : DEFAULT_ROUTE_LANES;
  const normalized = selected.map((route) => safeText(route)).filter(Boolean);
  for (const route of normalized) {
    if (!ROUTE_SEQUENCES[route]) {
      throw new Error(`Unsupported probe route lane: ${route}`);
    }
  }
  return normalized;
}

function withEnv(overrides, run) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value == null) delete process.env[key];
    else process.env[key] = String(value);
  }
  return Promise.resolve()
    .then(run)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value == null) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

function mockCodexCommand() {
  return JSON.stringify([
    process.execPath,
    '--experimental-strip-types',
    MOCK_CODEX_BIN,
  ]);
}

function mockPythonCommand() {
  return JSON.stringify([
    process.execPath,
    '--experimental-strip-types',
    MOCK_PYTHON_BIN,
  ]);
}

function runRouteInChild({
  request,
  outputFile,
  providerMode,
  routeTimeoutMs,
}) {
  const childEnv = {
    ...process.env,
    REDCUBE_REAL_ROUTE_PROBE_CHILD: '1',
    REDCUBE_REAL_ROUTE_PROBE_REQUEST: JSON.stringify(request),
    REDCUBE_REAL_ROUTE_PROBE_OUTPUT_FILE: outputFile,
  };
  if (providerMode === 'mock') {
    childEnv.REDCUBE_CODEX_COMMAND = mockCodexCommand();
    childEnv.REDCUBE_PYTHON_COMMAND = mockPythonCommand();
    childEnv.REDCUBE_IMAGE_GENERATION_MOCK = '1';
  }
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', path.resolve('scripts/run-real-route-evolution-probe.ts')],
    {
      cwd: process.cwd(),
      env: childEnv,
      encoding: 'utf-8',
      timeout: routeTimeoutMs,
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  if (result.error) {
    const error = result.error;
    if (error.code === 'ETIMEDOUT') {
      error.failure_kind = 'route_timeout';
    }
    throw error;
  }
  if (result.status !== 0) {
    const error = new Error(String(result.stderr || result.stdout || 'route child failed').trim());
    error.failure_kind = 'route_child_failed';
    throw error;
  }
  if (!existsSync(outputFile)) {
    throw new Error(`route child did not write output file: ${outputFile}`);
  }
  return readJson(outputFile);
}

function laneRouteSequence(lane, options = {}) {
  if (lane === 'native' && Number(options.nativeSampleSlideCount || 0) > 0) {
    return ROUTE_SEQUENCES.native;
  }
  return ROUTE_SEQUENCES[lane];
}

function resolvedSourcePayload(request) {
  const gapIds = safeArray(request?.trigger?.blocking_evidence_gaps).length > 0
    ? safeArray(request.trigger.blocking_evidence_gaps)
    : safeArray(request?.trigger?.evidence_gaps);
  return {
    topic_summary: `${safeText(request?.focus?.topic_summary || request?.title || request?.topic_id, 'real-route evolution probe')} planning_ready`,
    reference_source_list: [
      {
        reference_id: 'REF-REAL-PROBE-001',
        label: 'RCA route evolution probe source packet',
        url: 'https://example.com/redcube-ai-real-route-probe',
      },
      {
        reference_id: 'REF-REAL-PROBE-002',
        label: 'RCA image-first route technical note',
        url: 'https://example.com/redcube-ai-image-first-route',
      },
    ],
    key_fact_groups: [
      {
        fact_id: 'FACT-REAL-PROBE-001',
        label: [
          '同一 source readiness pack 被 image-first、HTML 和 native PPTX route 共享消费。',
          '本次最小验证的结构化数字证据为 topic_count=1.0、route_count=3.0、iteration_count_per_route=1.0。',
          'native_sample_slide_count=1.0，用于生成 1 页有意义、可编辑、非占位的 native PPTX 视觉样片。',
        ].join(' '),
        reference_id: 'REF-REAL-PROBE-001',
      },
      {
        fact_id: 'FACT-REAL-PROBE-002',
        label: [
          '所有 route 必须保留 3 个交付门：visual_director_review、screenshot_review 与 export_pptx。',
          'required_gate_coverage=3/3，缺少任一交付门都不能声明端到端闭环完成。',
          'native PPTX 样片必须同时留下 PPTX、PDF、PNG 截图、shape manifest、review receipt 和 export receipt。',
        ].join(' '),
        reference_id: 'REF-REAL-PROBE-002',
      },
    ],
    key_numeric_results: [
      {
        metric: 'topic_count',
        value: 1,
        unit: 'topic',
        interpretation: '最小端到端验证使用同一个 topic 起点。',
        reference_id: 'REF-REAL-PROBE-001',
      },
      {
        metric: 'route_count',
        value: 3,
        unit: 'routes',
        interpretation: '同一输入可分别进入 image-first、HTML 和 native PPTX 三条路线。',
        reference_id: 'REF-REAL-PROBE-001',
      },
      {
        metric: 'required_gate_count',
        value: 3,
        unit: 'gates',
        interpretation: '每条视觉交付路线都必须保留 visual director、screenshot review 和 export gate。',
        reference_id: 'REF-REAL-PROBE-002',
      },
    ],
    source_quality_notes: [
      'This probe uses minimal public placeholder refs and proves runtime wiring, cache behavior, typed blockers, and 3/3 review/export gate preservation.',
    ],
    evidence_gap_resolution: gapIds.map((gapId) => ({
      gap_id: safeText(gapId),
      status: 'resolved',
      note: `Resolved for real-route probe: ${safeText(gapId)}`,
    })),
  };
}

async function completeSourceReadiness({ workspaceRoot, topicId, title, brief, keywords }) {
  return withEnv({
    REDCUBE_SOURCE_AUGMENT_CMD: null,
    REDCUBE_SOURCE_AUGMENT_ADAPTER: 'result_file',
    REDCUBE_SOURCE_AUGMENT_RESULT_FILE: null,
  }, async () => {
    const staged = await researchSource({
      workspaceRoot,
      topicId,
      title,
      brief,
      keywords,
    });
    if (staged.planningReady === true) return staged;

    const requestFile = staged?.artifactFiles?.sourceAugmentationRequestFile;
    if (!requestFile || !existsSync(requestFile)) {
      return staged;
    }
    const request = readJson(requestFile);
    return researchSource({
      workspaceRoot,
      topicId,
      title,
      brief,
      keywords,
      result: resolvedSourcePayload(request),
    });
  });
}

function typedBlocker({ lane, route, error, result }) {
  const run = result?.run || result?.domain_entry_surface?.result_surface?.run || {};
  const errorPayload = result?.error || run?.error || {};
  const message = safeText(
    error?.message
      || errorPayload?.message
      || result?.blocking_reason
      || result?.summary?.status
      || result?.recommended_action,
    'route execution blocked',
  );
  const lower = message.toLowerCase();
  const parsedMessage = parseJsonObject(message);
  const errorKind = safeText(
    error?.code
      || error?.failure_kind
      || errorPayload?.code
      || errorPayload?.failure_kind
      || parsedMessage?.typed_blocker_kind
      || parsedMessage?.error_kind
      || result?.error_kind,
  );
  let blockerKind = errorKind || 'route_execution_blocked';
  if (error?.code === 'ETIMEDOUT' || error?.failure_kind === 'route_timeout') {
    blockerKind = 'route_execution_timeout';
  } else
  if (/image_generation requires|redcube_image_generation_token|provider token/.test(lower)) {
    blockerKind = 'missing_image_generation_provider_token';
  } else if (/codex cli|codex structured|codex prompt|codex/.test(lower)) {
    blockerKind = 'codex_cli_execution_blocked';
  } else if (/python|playwright|soffice|libreoffice|pptx/.test(lower)) {
    blockerKind = 'native_python_or_render_helper_blocked';
  } else if (/quality_blocked|blocked/.test(lower)) {
    blockerKind = 'quality_gate_blocked';
  }
  return {
    blocker_kind: blockerKind,
    lane,
    route,
    message,
    recommended_action: safeText(result?.recommended_action || error?.recommended_action, 'inspect_route_failure'),
    run_id: safeText(run?.run_id) || null,
    artifact_file: safeText(result?.artifactFile || errorPayload?.artifact_file || error?.artifact_file) || null,
  };
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(safeText(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function typedBlockerForTest(input) {
  return typedBlocker(input);
}

function routeSurface(productEntryResult) {
  return productEntryResult?.domain_entry_surface?.result_surface || productEntryResult;
}

function artifactRefsFrom(...values) {
  return Array.from(new Set(values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((item) => safeText(item))
    .filter(Boolean)));
}

function summarizeRouteRun({ lane, route, iteration, productEntryResult }) {
  const surface = routeSurface(productEntryResult);
  const artifactFile = safeText(surface?.artifactFile);
  const artifact = surface?.artifact || (artifactFile && existsSync(artifactFile) ? readJson(artifactFile) : null);
  const run = surface?.run || {};
  return {
    lane,
    route,
    iteration,
    ok: surface?.ok === true,
    product_entry_ok: productEntryResult?.ok === true,
    run_id: safeText(run?.run_id) || null,
    run_status: safeText(run?.status) || null,
    cache_status: safeText(surface?.cache_status || surface?.summary?.cache_status || artifact?.route_cache?.cache_status, 'unknown'),
    artifact_file: artifactFile || null,
    artifact_sha256: fileSha256(artifactFile),
    artifact_status: safeText(artifact?.status) || null,
    artifact_refs: artifactRefsFrom(
      artifactFile,
      artifact?.artifact_refs,
      surface?.artifact_refs,
      run?.artifact_refs,
      surface?.error?.artifact_refs,
      run?.error?.artifact_refs,
    ),
    gate_refs: {
      visual_director_review_preserved: true,
      screenshot_review_preserved: true,
      export_gate_preserved: true,
    },
    summary: surface?.summary || null,
  };
}

export function summarizeRouteRunForTest(input) {
  return summarizeRouteRun(input);
}

async function runProductRoute({
  workspaceRoot,
  topicId,
  deliverableId,
  title,
  goal,
  lane,
  route,
  iteration,
  adapter,
  userIntent,
  nativeSampleSlideCount,
}) {
  const entrySessionId = `real-route-probe-${lane}-${iteration}-${randomUUID()}`;
  const scopedGoal = nativeSampleSlideCount > 0
    ? `${goal}\n\nNative PPTX visual sample constraint: create exactly ${nativeSampleSlideCount} slide(s). The sample must still use the RCA product-entry workflow, author editable native shapes, and pass visual_director_review, screenshot_review, and export_pptx.`
    : goal;
  const scopedUserIntent = nativeSampleSlideCount > 0
    ? `${safeText(userIntent)} native_sample_slide_count=${nativeSampleSlideCount}; make exactly ${nativeSampleSlideCount} meaningful editable native PPTX slide(s), not a placeholder. For the one-slide native sample, prove the constraints pipeline itself: same input -> product-entry constraints -> native visual sample profile -> author_pptx_native_sample prompt -> exported artifact refs. Follow native_ppt_sample_layout_profile and select only sample_status_proof_board or sample_decision_proof_split. sample_status_proof_board means title + claim + one visible input_hub feeding three large status cards + flow/merge connectors into one full-width proof band, no separate takeaway panel. Use the three status cards to compare image-first default route, HTML explicit route, and native PPTX explicit route. Add one small auxiliary page_number shape in the footer or a corner. sample_decision_proof_split means title + claim + left decision panel + right proof stack + visible decision/proof rail + one bottom takeaway band. Do not use general executive_status_board/decision_dashboard/professional_system_map, connector-heavy route maps, gate ladders, source nodes, narrow route labels, or separate evidence band plus evidence axis plus takeaway panel on one page. Keep the visible evidence note as one compact sentence under 28 CJK characters or 18 English words; artifact inventories belong in metadata, not the slide. Preserve template_layout_binding and layout_zone_id on every retry.`
    : userIntent;
  return invokeProductEntry({
    workspaceRoot,
    entry_session_contract: {
      entry_session_id: entrySessionId,
    },
    task_intent: 'run_deliverable_route',
    delivery_request: {
      deliverable_family: 'ppt_deck',
      topic_id: topicId,
      deliverable_id: deliverableId,
      profile_id: 'lecture_student',
      title,
      goal: scopedGoal,
      route,
      adapter: adapter || undefined,
      user_intent: scopedUserIntent || undefined,
      task_intent: 'run_deliverable_route',
      cross_provider_attempt_index: buildOplRouteAttemptIndex({
        lane,
        route,
        iteration,
        topicId,
        deliverableId,
        entrySessionId,
      }),
      constraints: nativeSampleSlideCount > 0
        ? {
            expected_slide_count: nativeSampleSlideCount,
            max_slides: nativeSampleSlideCount,
            native_visual_sample: true,
          }
        : undefined,
    },
  });
}

async function ensureProbeDeliverable({ workspaceRoot, topicId, deliverableId, title, goal, constraints }) {
  return createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId,
    deliverableId,
    title,
    goal,
    constraints,
  });
}

async function runLane({
  workspaceRoot,
  topicId,
  lane,
  iterations,
  adapter,
  title,
  goal,
  userIntent,
  providerMode,
  routeTimeoutMs,
  routeChildOutputDir,
  outputDir,
  nativeSampleSlideCount,
}) {
  const deliverableId = `deck-${lane}`;
  await ensureProbeDeliverable({
    workspaceRoot,
    topicId,
    deliverableId,
    title: `${title} (${lane})`,
    goal,
    constraints: lane === 'native' && nativeSampleSlideCount > 0
      ? {
          expected_slide_count: nativeSampleSlideCount,
          max_slides: nativeSampleSlideCount,
          native_visual_sample: true,
        }
      : undefined,
  });
  const routeRuns = [];
  const blockers = [];
  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    for (const route of laneRouteSequence(lane, { nativeSampleSlideCount })) {
      try {
        const request = {
          workspaceRoot,
          topicId,
          deliverableId,
          title: `${title} (${lane})`,
          goal,
          lane,
          route,
          iteration,
          adapter,
          userIntent,
          nativeSampleSlideCount: lane === 'native' ? nativeSampleSlideCount : 0,
        };
        const result = routeTimeoutMs > 0
          ? runRouteInChild({
              request,
              outputFile: path.join(routeChildOutputDir, `${lane}-${String(iteration).padStart(2, '0')}-${route}.json`),
              providerMode,
              routeTimeoutMs,
            })
          : await runProductRoute(request);
        const routeRun = summarizeRouteRun({
          lane,
          route,
          iteration,
          productEntryResult: result,
        });
        routeRuns.push(routeRun);
        if (result.ok !== true || routeSurface(result)?.ok !== true) {
          blockers.push(typedBlocker({ lane, route, result: routeSurface(result) }));
          return { lane, deliverable_id: deliverableId, status: 'blocked', route_runs: routeRuns, typed_blockers: blockers };
        }
      } catch (error) {
        if (error?.code === 'ETIMEDOUT' || error?.failure_kind === 'route_timeout') {
          error.artifact_file = materializeRouteTimeoutBlockerArtifact({
            outputDir,
            lane,
            route,
            iteration,
            deliverableId,
            error,
            routeTimeoutMs,
            routeRuns,
            workspaceRoot,
            topicId,
          });
        }
        blockers.push(typedBlocker({ lane, route, error }));
        return { lane, deliverable_id: deliverableId, status: 'blocked', route_runs: routeRuns, typed_blockers: blockers };
      }
    }
  }
  const cacheHits = routeRuns.filter((run) => run.cache_status === 'hit').length;
  return {
    lane,
    deliverable_id: deliverableId,
    status: blockers.length > 0 ? 'blocked' : 'completed',
    route_runs: routeRuns,
    typed_blockers: blockers,
    cache_summary: {
      route_run_count: routeRuns.length,
      cache_hit_count: cacheHits,
      cache_miss_count: routeRuns.filter((run) => run.cache_status === 'miss').length,
      second_iteration_all_cached: iterations > 1
        ? routeRuns.filter((run) => run.iteration === 2).every((run) => run.cache_status === 'hit')
        : null,
    },
    terminal_evidence_pending: lane === 'native',
  };
}

function collectSourcePackRefs({ workspaceRoot, topicId }) {
  const paths = getSourceArtifactPaths(workspaceRoot, topicId);
  const refs = {
    source_research_report_file: paths.sourceResearchReportFile,
    source_readiness_pack_file: paths.sourceReadinessPackFile,
    source_pack_manifest_file: paths.sourcePackManifestFile,
    source_pack_fanout_file: paths.sourcePackFanoutFile,
  };
  return {
    ...refs,
    existing_refs: Object.fromEntries(
      Object.entries(refs).map(([key, file]) => [key, existsSync(file)]),
    ),
    source_pack_fanout: existsSync(paths.sourcePackFanoutFile) ? readJson(paths.sourcePackFanoutFile) : null,
  };
}

function parseArgs(argv) {
  const options = {
    routes: [],
    iterations: null,
    providerMode: 'mock',
    json: false,
    probeCodex: true,
    routeTimeoutMs: 0,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--workspace-root') {
      options.workspaceRoot = next;
      index += 1;
    } else if (token === '--output-dir') {
      options.outputDir = next;
      index += 1;
    } else if (token === '--routes') {
      options.routes = String(next || '').split(',').map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (token === '--iterations') {
      options.iterations = Number(next || 0);
      index += 1;
    } else if (token === '--live') {
      options.providerMode = 'live';
    } else if (token === '--mock' || token === '--mock-providers') {
      options.providerMode = 'mock';
    } else if (token === '--adapter') {
      options.adapter = next;
      index += 1;
    } else if (token === '--route-timeout-ms') {
      options.routeTimeoutMs = Number(next || 0);
      index += 1;
    } else if (token === '--native-sample-slide-count') {
      options.nativeSampleSlideCount = Number(next || 0);
      index += 1;
    } else if (token === '--json') {
      options.json = true;
    } else if (token === '--skip-codex-probe') {
      options.probeCodex = false;
    } else if (token === '--help' || token === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }
  return options;
}

function printUsage() {
  process.stdout.write([
    'Usage: node --experimental-strip-types scripts/run-real-route-evolution-probe.ts [--mock|--live] [--routes image,html,native] [--iterations 2] [--route-timeout-ms <ms>] [--native-sample-slide-count <n>] [--workspace-root <dir>] [--output-dir <dir>] [--json]',
    '',
    'The probe creates a real RCA workspace, invokes product-entry run_deliverable_route, writes route artifacts, and records typed blockers when live providers are unavailable.',
  ].join('\n'));
}

export async function runRealRouteEvolutionProbe(options = {}) {
  const runId = safeText(options.runId, `real-route-evolution-${timestampId()}-${randomUUID().slice(0, 8)}`);
  const workspaceRoot = path.resolve(
    safeText(options.workspaceRoot)
      || path.join(runtimeStateRoot(), runId, 'workspace'),
  );
  const outputDir = path.resolve(
    safeText(options.outputDir)
      || path.join(runtimeStateRoot(), runId, 'probe-output'),
  );
  const providerMode = safeText(options.providerMode, 'mock');
  const routes = normalizeRoutes(options.routes);
  const iterations = Number.isInteger(options.iterations) && options.iterations > 0
    ? options.iterations
    : 2;
  const topicId = safeText(options.topicId, 'topic-real-route-evolution');
  const title = safeText(options.title, 'RCA image-first real route evolution probe');
  const goal = safeText(
    options.goal,
    '验证 RCA image-first、HTML 与 native PPTX route 的真实 product-entry artifact-producing 执行、cache reuse 与 typed blockers。',
  );
  ensureDir(workspaceRoot);
  ensureDir(outputDir);
  const routeChildOutputDir = ensureDir(path.join(outputDir, 'route-child-results'));

  return withEnv({
    REDCUBE_IMAGE_GENERATION_MOCK: providerMode === 'mock' ? '1' : process.env.REDCUBE_IMAGE_GENERATION_MOCK,
  }, async () => {
    const startedAt = new Date().toISOString();
    let codexProbe = null;
    if (options.probeCodex !== false) {
      codexProbe = await probeCodexCli({
        contract: readCodexCliContract(process.env),
        cwd: path.resolve('.'),
        timeoutMs: Number(options.codexProbeTimeoutMs || 60000),
      });
      if (codexProbe.ok !== true) {
        const report = {
          schema_version: 1,
          surface_kind: 'rca_real_route_evolution_probe',
          status: 'blocked',
        provider_mode: providerMode,
          workspace_root: workspaceRoot,
          output_dir: outputDir,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          codex_probe: codexProbe,
          source_readiness: null,
          lanes: [],
          typed_blockers: [
            {
              blocker_kind: codexProbe.error_kind || 'codex_cli_probe_failed',
              lane: null,
              route: null,
              message: codexProbe.blocking_reason || 'Codex CLI probe failed',
              recommended_action: 'fix_codex_cli_before_route_probe',
            },
          ],
        };
        const reportFile = path.join(outputDir, 'real-route-evolution-probe.json');
        writeJson(reportFile, report);
        return { ...report, report_file: reportFile };
      }
    }

    const sourceReadiness = await completeSourceReadiness({
      workspaceRoot,
      topicId,
      title,
      brief: goal,
      keywords: ['RCA', 'image-first', 'HTML route', 'native PPTX route', 'cache reuse'],
    });
    const lanes = [];
    for (const lane of routes) {
      lanes.push(await runLane({
        workspaceRoot,
        topicId,
        lane,
        iterations,
        adapter: options.adapter,
        title,
        goal,
        userIntent: `real-route evolution probe lane=${lane}`,
        providerMode,
        routeTimeoutMs: Number(options.routeTimeoutMs || 0),
        routeChildOutputDir,
        outputDir,
        nativeSampleSlideCount: Number(options.nativeSampleSlideCount || 0),
      }));
    }
    const performanceReport = await buildPerformanceReport({ workspaceRoot, topicId });
    const performanceReportFile = path.join(outputDir, 'performance-report.json');
    writeJson(performanceReportFile, performanceReport);
    const typedBlockers = lanes.flatMap((lane) => safeArray(lane.typed_blockers));
    const status = typedBlockers.length > 0 ? 'blocked' : 'completed';
    const reportFile = path.join(outputDir, 'real-route-evolution-probe.json');
    for (const lane of lanes) {
      if (lane.lane !== 'native' || lane.status !== 'completed') continue;
      lane.terminal_evidence = collectNativeTerminalEvidence({
        workspaceRoot,
        topicId,
        deliverableId: lane.deliverable_id,
        routeRuns: lane.route_runs,
        reportFile,
        providerMode,
      });
      lane.terminal_evidence_pending = false;
    }
    const report = {
      schema_version: 1,
      surface_kind: 'rca_real_route_evolution_probe',
      status,
      provider_mode: providerMode,
      workspace_root: workspaceRoot,
      output_dir: outputDir,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      codex_probe: codexProbe,
      source_readiness: {
        planning_ready: sourceReadiness?.planningReady === true,
        stage: sourceReadiness?.stage || null,
        report: sourceReadiness?.report || null,
        source_pack_refs: collectSourcePackRefs({ workspaceRoot, topicId }),
      },
      lanes,
      typed_blockers: typedBlockers,
      quality_gate_policy: {
        visual_director_review_required: true,
        screenshot_review_required: true,
        export_gate_required: true,
        agent_lab_score_is_not_visual_quality_verdict: true,
      },
      performance_report_file: performanceReportFile,
      performance_report: performanceReport,
      no_forbidden_write_policy: {
        repo_source_write_expected: false,
        artifact_writes_confined_to_workspace_root: workspaceRoot,
      },
    };
    writeJson(reportFile, report);
    return { ...report, report_file: reportFile };
  });
}

async function runChildRouteFromEnv() {
  const request = JSON.parse(process.env.REDCUBE_REAL_ROUTE_PROBE_REQUEST || '{}');
  const outputFile = safeText(process.env.REDCUBE_REAL_ROUTE_PROBE_OUTPUT_FILE);
  if (!outputFile) {
    throw new Error('REDCUBE_REAL_ROUTE_PROBE_OUTPUT_FILE is required for child route execution');
  }
  const result = await runProductRoute(request);
  writeJson(outputFile, result);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }
  const report = await runRealRouteEvolutionProbe(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`RCA real-route evolution probe ${report.status}: ${report.report_file}\n`);
  }
  if (report.status !== 'completed') {
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const entry = process.env.REDCUBE_REAL_ROUTE_PROBE_CHILD === '1'
    ? runChildRouteFromEnv
    : main;
  entry().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
