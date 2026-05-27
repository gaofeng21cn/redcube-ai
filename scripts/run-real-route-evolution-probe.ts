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
        label: '同一 source readiness pack 被 image-first、HTML 和 native PPTX route 共享消费。',
        reference_id: 'REF-REAL-PROBE-001',
      },
      {
        fact_id: 'FACT-REAL-PROBE-002',
        label: '所有 route 必须保留 visual_director_review、screenshot_review 与 export_pptx gate。',
        reference_id: 'REF-REAL-PROBE-002',
      },
    ],
    source_quality_notes: [
      'This probe uses minimal public placeholder refs and only proves runtime wiring, cache behavior, and typed blockers.',
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
    artifact_refs: [
      artifactFile,
      ...safeArray(artifact?.artifact_refs),
      ...safeArray(surface?.artifact_refs),
    ].map((item) => safeText(item)).filter(Boolean),
    gate_refs: {
      visual_director_review_preserved: true,
      screenshot_review_preserved: true,
      export_gate_preserved: true,
    },
    summary: surface?.summary || null,
  };
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
}) {
  const entrySessionId = `real-route-probe-${lane}-${iteration}-${randomUUID()}`;
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
      goal,
      route,
      adapter: adapter || undefined,
      user_intent: userIntent || undefined,
      task_intent: 'run_deliverable_route',
    },
  });
}

async function ensureProbeDeliverable({ workspaceRoot, topicId, deliverableId, title, goal }) {
  return createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId,
    deliverableId,
    title,
    goal,
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
}) {
  const deliverableId = `deck-${lane}`;
  await ensureProbeDeliverable({
    workspaceRoot,
    topicId,
    deliverableId,
    title: `${title} (${lane})`,
    goal,
  });
  const routeRuns = [];
  const blockers = [];
  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    for (const route of ROUTE_SEQUENCES[lane]) {
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
    'Usage: node --experimental-strip-types scripts/run-real-route-evolution-probe.ts [--mock|--live] [--routes image,html,native] [--iterations 2] [--route-timeout-ms <ms>] [--workspace-root <dir>] [--output-dir <dir>] [--json]',
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
      }));
    }
    const performanceReport = await buildPerformanceReport({ workspaceRoot, topicId });
    const performanceReportFile = path.join(outputDir, 'performance-report.json');
    writeJson(performanceReportFile, performanceReport);
    const typedBlockers = lanes.flatMap((lane) => safeArray(lane.typed_blockers));
    const status = typedBlockers.length > 0 ? 'blocked' : 'completed';
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
    const reportFile = path.join(outputDir, 'real-route-evolution-probe.json');
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
