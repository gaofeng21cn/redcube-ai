import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { dispatchDomainAction } from 'opl-framework/domain-task-runtime';
import {
  auditDeliverable, applyReviewMutation, createDeliverable, doctorWorkspace, getDeliverable,
  getOverlayCatalog, getPublicationProjection, getReviewState, invokeDomainEntry, invokeProductEntry,
  buildPerformanceReport, intakeSource, researchSource, prepareSourceAugmentation,
  prepareSourceAugmentationResult, writeSourceAugmentationResult, executeSourceAugmentation,
  listTopics as listTopicsDomainEntry,
} from '@redcube/domain-entry';

import { buildCommandHelp, buildHelp } from './help.js';
import { buildCliJsonSummary } from './json-summary.js';
import { parseArgs, resolveWorkspaceRoot } from './options.js';
import { printJson } from './output.js';
import type { CliDependenciesMap, JsonMap } from './types.js';

const DEFAULT_DOMAIN_ACTIONS = {
  auditDeliverable, applyReviewMutation, createDeliverable, doctorWorkspace, getDeliverable,
  getOverlayCatalog, getPublicationProjection, getReviewState, invokeDomainEntry, invokeProductEntry,
  buildPerformanceReport, intakeSource, researchSource, prepareSourceAugmentation,
  prepareSourceAugmentationResult, writeSourceAugmentationResult, executeSourceAugmentation,
  listTopics: listTopicsDomainEntry,
  exportDomainHandler: async (request: Record<string, unknown>) => (await import('@redcube/domain-entry') as any).exportDomainHandler(request),
  dispatchDomainHandler: async (request: Record<string, unknown>) => (await import('@redcube/domain-entry') as any).dispatchDomainHandler(request),
  runNativePptProductEntryProof: async (request: Record<string, unknown>) => (await import('@redcube/domain-entry') as any).runNativePptProductEntryProof(request),
};

export function getCliDomainActions(overrides: Record<string, unknown> = {}): typeof DEFAULT_DOMAIN_ACTIONS {
  return { ...DEFAULT_DOMAIN_ACTIONS, ...overrides };
}

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const workspace = (options: JsonMap, cwd: () => string) => resolveWorkspaceRoot(options, cwd);

function jsonOption(label: string, value: unknown) {
  if (!value || value === true) return {};
  const parsed = JSON.parse(String(value));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${label} must be a JSON object`);
  return parsed;
}

function constraints(options: JsonMap) {
  const value = {
    ...jsonOption('--constraints-json', options.constraintsJson),
    ...(options.constraintsFile && options.constraintsFile !== true ? jsonOption('--constraints-file', readFileSync(String(options.constraintsFile), 'utf8')) : {}),
  } as JsonMap;
  const count = Number(options.nativeSampleSlideCount || 0);
  if (options.nativeVisualSample === true || count > 0) value.native_visual_sample = true;
  if (count > 0) Object.assign(value, { expected_slide_count: count, max_slides: count });
  return Object.keys(value).length ? object(value) : undefined;
}

function stagePlan(options: JsonMap, cwd: () => string, routeAsStop = false) {
  return {
    target_domain_id: 'redcube_ai', task_intent: 'run_opl_stage_execution_plan', entry_mode: 'service_call',
    workspace_locator: { workspace_root: workspace(options, cwd) },
    runtime_session_contract: { runtime_owner: 'configured_family_runtime_provider', session_mode: 'ephemeral_run' },
    return_surface_contract: { surface_kind: 'opl_stage_execution_plan' },
    domain_payload: {
      deliverable_family: options.overlay || '', topic_id: options.topicId || '', deliverable_id: options.deliverableId || '',
      route: options.route || '', adapter: options.adapter || undefined, user_intent: options.userIntent || '',
      stop_after_stage: options.stopAfterStage || (routeAsStop ? options.route || '' : ''), mode: options.mode || 'draft_new',
      baseline_deliverable_id: options.baselineDeliverableId || '',
    },
  };
}

function imageProof(options: JsonMap, cwd: () => string) {
  const root = path.resolve(cwd());
  const outputDir = String(options.outputDir || 'artifacts/image-ppt-proof');
  const args = ['tools/image-ppt-proof/run.sh', '--output-dir', outputDir, options.liveImageGeneration === true ? '--live-image-generation' : '--mock-image-generation'];
  if (options.skipSystemDeps === true) args.push('--skip-system-deps');
  if (options.fixture) args.push('--fixture', String(options.fixture));
  if (options.styleReferenceDir) args.push('--style-reference-dir', String(options.styleReferenceDir));
  const result = spawnSync(args[0], args.slice(1), { cwd: root, encoding: 'utf8', env: process.env });
  if (result.status !== 0) throw new Error(`redcube image-ppt proof failed: ${result.stderr || result.stdout}`);
  return { ok: true, surface_kind: 'image_ppt_product_entry_proof', command: 'redcube image-ppt proof', output_dir: path.resolve(root, outputDir), artifact_index_file: path.resolve(root, outputDir, 'artifact-index.json'), runner_stdout: result.stdout };
}

function bindings(options: JsonMap, cwd: () => string, domain: any) {
  const root = () => workspace(options, cwd);
  return {
    'workspace doctor': () => domain.doctorWorkspace({ workspaceRoot: root() }),
    'topics list': () => domain.listTopics({ workspaceRoot: root() }),
    'source intake': () => domain.intakeSource({ workspaceRoot: root(), topicId: options.topicId || '', title: options.title || '', brief: options.brief || '', keywords: options.keywords || '', sourceFiles: options.sourceFiles || '', operatorFiles: options.operatorFiles || '' }),
    'source research': () => domain.researchSource({ workspaceRoot: root(), topicId: options.topicId || '', title: options.title || '', brief: options.brief || '', keywords: options.keywords || '', sourceFiles: options.sourceFiles || '', operatorFiles: options.operatorFiles || '', payloadFile: options.payloadFile || '' }),
    'source augment': () => domain.prepareSourceAugmentation({ workspaceRoot: root(), topicId: options.topicId || '', title: options.title || '' }),
    'source prepare-augmentation-result': () => domain.prepareSourceAugmentationResult({ workspaceRoot: root(), topicId: options.topicId || '' }),
    'source write-augmentation-result': () => domain.writeSourceAugmentationResult({ workspaceRoot: root(), topicId: options.topicId || '', inputFile: options.inputFile || '', payloadFile: options.payloadFile || '' }),
    'source execute-augmentation': () => domain.executeSourceAugmentation({ workspaceRoot: root(), topicId: options.topicId || '' }),
    'deliverable create': () => domain.createDeliverable({ workspaceRoot: root(), overlay: options.overlay || '', profileId: options.profileId || '', topicId: options.topicId || '', deliverableId: options.deliverableId || '', title: options.title || '', goal: options.goal || '' }),
    'deliverable get': () => domain.getDeliverable({ workspaceRoot: root(), topicId: options.topicId || '', deliverableId: options.deliverableId || '' }),
    'deliverable audit': () => domain.auditDeliverable({ workspaceRoot: root(), overlay: options.overlay || '', topicId: options.topicId || '', deliverableId: options.deliverableId || '', mode: options.mode || 'draft_new', baselineDeliverableId: options.baselineDeliverableId || '' }),
    'deliverable run': () => domain.invokeDomainEntry(stagePlan(options, cwd, true)),
    'deliverable execute': () => domain.invokeDomainEntry(stagePlan(options, cwd)),
    'product invoke': () => domain.invokeProductEntry({ workspace_locator: { workspace_root: root() }, entry_session_contract: { entry_session_id: options.entrySessionId || '' }, task_intent: options.taskIntent || '', delivery_request: { deliverable_family: options.overlay || '', topic_id: options.topicId || '', deliverable_id: options.deliverableId || '', profile_id: options.profileId || '', title: options.title || '', goal: options.goal || '', route: options.route || '', adapter: options.adapter || '', user_intent: options.userIntent || '', lifecycle_policy: options.lifecyclePolicy || '', stop_after_stage: options.stopAfterStage || '', mode: options.mode || 'draft_new', baseline_deliverable_id: options.baselineDeliverableId || '', constraints: constraints(options) } }),
    'domain-handler export': () => domain.exportDomainHandler({ workspace_root: root(), format: options.format || 'json', ...(options.workspaceReceiptScaleoutRoot ? { workspace_receipt_scaleout_roots: String(options.workspaceReceiptScaleoutRoot).split(',').map((item) => item.trim()).filter(Boolean) } : {}) }),
    'domain-handler dispatch': () => domain.dispatchDomainHandler({ task_file: options.task || options.taskFile || '', format: options.format || 'json' }),
    'native-ppt proof': () => domain.runNativePptProductEntryProof({ workspace_root: root(), entry_session_id: options.entrySessionId || '', topic_id: options.topicId || '', deliverable_id: options.deliverableId || '', route: options.route || 'author_pptx_native', adapter: options.adapter || '', user_intent: options.userIntent || '', stop_after_stage: options.stopAfterStage || '', constraints: constraints(options) }),
    'image-ppt proof': () => imageProof(options, cwd),
    'review get': () => domain.getReviewState({ workspaceRoot: root(), topicId: options.topicId || '', deliverableId: options.deliverableId || '' }),
    'review projection': () => domain.getPublicationProjection({ workspaceRoot: root(), topicId: options.topicId || '' }),
    'review mutate': () => domain.applyReviewMutation({ workspaceRoot: root(), topicId: options.topicId || '', deliverableId: options.deliverableId || '', mutation: { type: options.type || '', actor: options.actor || 'agent', review_stage: options.reviewStage || '', rerun_from_stage: options.rerunFromStage || '', issues: String(options.issues || '').split(',').map((item) => item.trim()).filter(Boolean), baseline_deliverable_id: options.baselineDeliverableId || '', notes: options.notes || '' } }),
    'report performance': () => domain.buildPerformanceReport({ workspaceRoot: root(), topicId: options.topicId || null, deliverableId: options.deliverableId || null }),
    'profile list': () => domain.getOverlayCatalog(),
  };
}

export async function executeCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  const [command, ...rest] = argv;
  const subcommand = rest[0] && !rest[0].startsWith('--') ? rest[0] : '';
  const options = parseArgs(rest);
  const domain = getCliDomainActions(deps.domainActions || {});
  const cwd = deps.cwd || process.cwd;
  if (!command || ['help', '--help'].includes(command)) return buildHelp(domain);
  if (options.help === true) return buildCommandHelp([command, subcommand].filter(Boolean).join(' ')) || buildHelp(domain);
  const actionId = [command, subcommand || options.action].filter(Boolean).join(' ');
  return await dispatchDomainAction(actionId, options, bindings(options, cwd, domain)) as JsonMap;
}

export async function runCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  const result = await executeCli(argv, deps);
  const options = parseArgs(argv);
  (deps.printJson || printJson)(options.jsonSummary === true || options.quiet === true ? buildCliJsonSummary(result) : result);
  return result;
}

export async function main(argv = process.argv.slice(2), deps: CliDependenciesMap = {}): Promise<JsonMap> {
  return runCli(argv, deps);
}
