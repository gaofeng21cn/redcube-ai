import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  buildPythonHelperEnv,
  resolvePythonNativeHelper,
} from './python-native-helper.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const DEFAULT_PROBE_TIMEOUT_MS = 60000;
const DEFAULT_GENERATION_TIMEOUT_MS = 600000;

const HERMES_AGENT_LOOP_BRIDGE_COMMAND_ENV = 'REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND';
const HERMES_AGENT_LOOP_PYTHON_COMMAND_ENV = 'REDCUBE_HERMES_AGENT_LOOP_PYTHON_COMMAND';
const HERMES_AGENT_ADAPTER = 'hermes_agent';
const HERMES_AGENT_LOOP_RUNTIME_SURFACE = 'hermes_agent_loop';
const HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION = 'inherit_local_hermes_default';
const HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION = 'inherit_local_hermes_default';
const HERMES_AGENT_LOOP_FREEZE_ORIGIN = 'Hermes.Proof.A';
const OPL_EXECUTOR_ADAPTER_RECEIPT_SOURCE = 'opl_executor_adapter_receipt';
const OPL_HOSTED_HERMES_AGENT_LOOP_REFERENCE = 'opl_hosted:hermes_agent_loop';
const OPL_RUNTIME_MANAGER_OWNER = 'OPL Runtime Manager';
const OPL_RUNTIME_MANAGER_RUNTIME_OWNER = 'opl_runtime_manager';
const RCA_VISUAL_DELIVERABLE_RUNTIME_OWNER = 'redcube_ai_visual_deliverable_runtime';
const RCA_REVIEW_EXPORT_GATE_OWNER = 'redcube_ai';

const DEFAULT_AGENT_LOOP_HELPER = resolvePythonNativeHelper(REPO_ROOT, 'hermes_agent_loop_bridge');
const DEFAULT_AGENT_LOOP_MODULE = DEFAULT_AGENT_LOOP_HELPER.packageModule;

type JsonRecord = Record<string, unknown>;

interface LocalFileInspectionEntry {
  label: string;
  path: string;
  media_type: string;
  purpose: string;
}

interface BridgeCommand {
  argv: string[];
  env: NodeJS.ProcessEnv;
}

interface BridgeRequestOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

interface GenerationInputRequest {
  family: string;
  route: string;
  promptRelativePath: string;
  context: unknown;
  outputContract: unknown;
  localFileInspection?: unknown[];
}

interface HermesAgentLoopContract extends JsonRecord {
  model: string;
  provider: string | null;
  base_url: string | null;
  api_mode: string | null;
  reasoning_effort: string | null;
  model_selection: string;
  reasoning_selection: string;
}

interface GenerateStructuredArtifactRequest {
  family?: unknown;
  route?: unknown;
  promptRelativePath?: unknown;
  context?: unknown;
  outputContract?: unknown;
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  localFileInspection?: unknown[];
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function parseCommand(value: unknown, fallback: string[]): string[] {
  const raw = safeText(value);
  if (!raw) {
    return [...fallback];
  }
  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(`${HERMES_AGENT_LOOP_BRIDGE_COMMAND_ENV} 若使用 JSON array，必须是非空字符串数组`);
    }
    const command = parsed.map((item) => safeText(item)).filter(Boolean);
    if (command.length === 0) {
      throw new Error(`${HERMES_AGENT_LOOP_BRIDGE_COMMAND_ENV} 解析后不能为空`);
    }
    return command;
  }
  return [raw];
}

function resolveBridgeCommand(env: NodeJS.ProcessEnv = process.env): BridgeCommand {
  const explicitBridge = safeText(env?.[HERMES_AGENT_LOOP_BRIDGE_COMMAND_ENV]);
  if (explicitBridge) {
    return {
      argv: parseCommand(explicitBridge, []),
      env,
    };
  }
  const pythonCommand = safeText(env?.[HERMES_AGENT_LOOP_PYTHON_COMMAND_ENV], 'python3');
  return {
    argv: [pythonCommand, '-m', DEFAULT_AGENT_LOOP_MODULE],
    env: buildPythonHelperEnv(DEFAULT_AGENT_LOOP_HELPER.pythonRoot, env) as NodeJS.ProcessEnv,
  };
}

function readPromptGuidance(relativePath: string): string {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${relativePath}`);
  }

  const raw = readFileSync(absolutePath, 'utf-8');
  const runtimeSectionIndex = raw.search(/^##\s+runtime_(seed|artifact)\b/m);
  if (runtimeSectionIndex === -1) {
    return raw.trim();
  }
  return raw.slice(0, runtimeSectionIndex).trim();
}

function normalizeLocalFileInspection(value: unknown): LocalFileInspectionEntry[] {
  return (Array.isArray(value) ? value : [])
    .map((entry) => ({
      label: safeText(entry?.label, 'local-file'),
      path: safeText(entry?.path),
      media_type: safeText(entry?.media_type, 'application/octet-stream'),
      purpose: safeText(entry?.purpose),
    }))
    .filter((entry) => entry.path);
}

function buildLocalFileInspectionSection(localFileInspection: unknown[] = []): string {
  const entries = normalizeLocalFileInspection(localFileInspection);
  if (entries.length === 0) {
    return '';
  }
  return [
    '## Provided Local Files',
    'Only inspect the local files explicitly listed below.',
    '',
    ...entries.flatMap((entry, index) => {
      const block = [
        `### File ${index + 1}: ${entry.label}`,
        `- path: ${entry.path}`,
      ];
      if (entry.purpose) {
        block.push(`- purpose: ${entry.purpose}`);
      }
      block.push('');
      return block;
    }),
  ].join('\n');
}

function buildGenerationInstructions(family: string, route: string, localFileInspection: unknown[] = []): string {
  const localFiles = normalizeLocalFileInspection(localFileInspection);
  return [
    'You are the RedCube AI Hermes-Agent loop creative generation runtime.',
    `Produce the ${family}:${route} artifact as audience-facing creative output.`,
    'This route is running as a full Hermes agent loop proof. You must use tools to read the provided local prompt file before answering.',
    localFiles.length > 0
      ? 'You may inspect only the provided local files explicitly listed in the prompt. Do not browse external sources or inspect any other files.'
      : 'Do not browse external sources.',
    'Work only from the provided guidance, context, and output contract.',
    'Treat operator meta instructions as production constraints, not deck/note/poster copy.',
    'Never quote internal workflow notes, cover instructions, hidden review rules, or process directives into audience-facing fields.',
    'Return a JSON object only.',
  ].join(' ');
}

function buildGenerationInput({
  family,
  route,
  promptRelativePath,
  context,
  outputContract,
  localFileInspection = [],
}: GenerationInputRequest): string {
  const guidance = readPromptGuidance(promptRelativePath);
  const localFileSection = buildLocalFileInspectionSection(localFileInspection);
  return [
    '# RedCube Structured Generation',
    '',
    '## Prompt Pack Guidance',
    guidance,
    '',
    '## Context',
    '```json',
    JSON.stringify(context, null, 2),
    '```',
    '',
    '## Output Contract',
    '```json',
    JSON.stringify(outputContract, null, 2),
    '```',
    '',
    ...(localFileSection ? [localFileSection, ''] : []),
    '## Output Rule',
    `Return the final ${family}:${route} payload as a JSON object only.`,
  ].join('\n');
}

function buildHermesAgentLoopExecutionModel(requestedAdapter = HERMES_AGENT_ADAPTER) {
  const oplExecutorAdapterReceipt = {
    source: OPL_EXECUTOR_ADAPTER_RECEIPT_SOURCE,
    owner: OPL_RUNTIME_MANAGER_RUNTIME_OWNER,
    hosted_adapter_reference: OPL_HOSTED_HERMES_AGENT_LOOP_REFERENCE,
    adapter: HERMES_AGENT_ADAPTER,
    selected_executor_backend: HERMES_AGENT_ADAPTER,
    runtime_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
    domain_truth_owner: RCA_VISUAL_DELIVERABLE_RUNTIME_OWNER,
    review_export_gate_owner: RCA_REVIEW_EXPORT_GATE_OWNER,
    activation: 'explicit_opt_in_only',
    auditability: 'receipt_backed',
    failure_mode: 'fail_closed',
    effect_equivalence_guaranteed: false,
  };
  return {
    mainline_adapter: HERMES_AGENT_ADAPTER,
    primary_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
    adapter_role: 'opl_hosted_executor_adapter_proof',
    runtime_substrate_owner: OPL_RUNTIME_MANAGER_OWNER,
    deployment_host: 'local_hermes_agent_bridge',
    deployment_host_status: 'opt_in_available',
    requested_adapter: requestedAdapter,
    default_model_selection: HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: HERMES_AGENT_LOOP_FREEZE_ORIGIN,
    opl_executor_adapter_receipt: oplExecutorAdapterReceipt,
  };
}

function runBridgeRequest(
  request: JsonRecord,
  {
    cwd = process.cwd(),
    env = process.env,
    timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
  }: BridgeRequestOptions = {},
): JsonRecord {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-agent-loop-'));
  const requestFile = path.join(tempDir, 'request.json');
  writeFileSync(requestFile, JSON.stringify(request, null, 2), 'utf-8');
  const command = resolveBridgeCommand(env);

  try {
    const completed = spawnSync(command.argv[0], [...command.argv.slice(1), requestFile], {
      cwd,
      env: command.env,
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
    });

    if (completed.error) {
      throw new Error(completed.error.message);
    }
    if (completed.status !== 0) {
      const stderr = safeText(completed.stderr);
      const stdout = safeText(completed.stdout);
      throw new Error(stderr || stdout || `Hermes-Agent loop bridge exited with status ${completed.status}`);
    }

    const stdout = safeText(completed.stdout);
    if (!stdout) {
      throw new Error('Hermes-Agent loop bridge returned empty stdout');
    }
    const parsed = JSON.parse(stdout) as unknown;
    if (!isJsonRecord(parsed)) {
      throw new Error('Hermes-Agent loop bridge returned non-object JSON');
    }
    return parsed;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function normalizeContract(contract: unknown): HermesAgentLoopContract {
  const resolved = isJsonRecord(contract)
    ? { ...contract }
    : {};
  const model = safeText(resolved.model);
  if (!model) {
    throw new Error('Hermes-Agent loop 缺少可执行 model');
  }
  return {
    ...resolved,
    model,
    provider: safeText(resolved.provider) || null,
    base_url: safeText(resolved.base_url) || null,
    api_mode: safeText(resolved.api_mode) || null,
    reasoning_effort: safeText(resolved.reasoning_effort) || null,
    model_selection: safeText(resolved.model_selection, HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION),
    reasoning_selection: safeText(resolved.reasoning_selection, HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION),
  };
}

export function readHermesAgentLoopContract({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  const response = runBridgeRequest(
    { action: 'probe' },
    { cwd, env, timeoutMs: DEFAULT_PROBE_TIMEOUT_MS },
  );
  if (response?.ok !== true) {
    throw new Error(safeText(response?.blocking_reason, 'Hermes-Agent loop probe failed'));
  }
  return normalizeContract(response.contract);
}

export function probeHermesAgentLoop({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  try {
    const contract = readHermesAgentLoopContract({ cwd, env });
    return {
      ok: true,
      runtime_owner: HERMES_AGENT_ADAPTER,
      contract,
      error_kind: null,
      blocking_reason: null,
    };
  } catch (error) {
    return {
      ok: false,
      runtime_owner: HERMES_AGENT_ADAPTER,
      contract: null,
      error_kind: 'hermes_agent_loop_probe_failed',
      blocking_reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export function generateStructuredArtifactViaHermesAgentLoop({
  family,
  route,
  promptRelativePath,
  context,
  outputContract,
  cwd = process.cwd(),
  timeoutMs = DEFAULT_GENERATION_TIMEOUT_MS,
  env = process.env,
  localFileInspection = [],
}: GenerateStructuredArtifactRequest): JsonRecord {
  const safeFamily = safeText(family, 'unknown_family');
  const safeRoute = safeText(route, 'unknown_route');
  const safePromptRelativePath = safeText(promptRelativePath);
  const prompt = [
    buildGenerationInstructions(safeFamily, safeRoute, localFileInspection),
    '',
    buildGenerationInput({
      family: safeFamily,
      route: safeRoute,
      promptRelativePath: safePromptRelativePath,
      context,
      outputContract,
      localFileInspection,
    }),
  ].join('\n');
  const response = runBridgeRequest(
    {
      action: 'generate',
      family: safeFamily,
      route: safeRoute,
      promptRelativePath: safePromptRelativePath,
      prompt,
      context,
      outputContract,
      cwd,
      local_file_inspection: normalizeLocalFileInspection(localFileInspection),
      timeout_ms: timeoutMs,
    },
    { cwd, env, timeoutMs },
  );
  if (response?.ok !== true) {
    throw new Error(safeText(response?.blocking_reason, `Hermes-Agent loop structured generation failed: ${safeFamily}:${safeRoute}`));
  }

  const contract = normalizeContract(response.contract);
  const payload = response?.payload;
  if (!isJsonRecord(payload)) {
    throw new Error(`Hermes-Agent loop structured generation returned invalid JSON for route: ${safeFamily}:${safeRoute}`);
  }

  const proof = isJsonRecord(response?.proof)
    ? response.proof
    : {};
  if (proof.full_agent_loop_proved !== true) {
    throw new Error(`Hermes-Agent loop missing full agent loop evidence for route: ${safeFamily}:${safeRoute}`);
  }

  const executionModel = buildHermesAgentLoopExecutionModel(HERMES_AGENT_ADAPTER);
  const oplExecutorAdapterReceipt = executionModel.opl_executor_adapter_receipt;
  return {
    data: payload,
    generationRuntime: {
      owner: OPL_RUNTIME_MANAGER_RUNTIME_OWNER,
      adapter_surface: '@redcube/runtime-protocol',
      run_id: safeText(proof.session_id, `hermes-agent-${randomUUID()}`),
      session_id: safeText(proof.session_id) || null,
      model_selection: contract.model_selection,
      reasoning_selection: contract.reasoning_selection,
      model: contract.model,
      provider: contract.provider,
      api_mode: contract.api_mode,
      reasoning_effort: contract.reasoning_effort,
      prompt_pack_file: safePromptRelativePath,
      proof: {
        ...proof,
        opl_executor_adapter_receipt: oplExecutorAdapterReceipt,
      },
      source: OPL_EXECUTOR_ADAPTER_RECEIPT_SOURCE,
      hosted_adapter_reference: OPL_HOSTED_HERMES_AGENT_LOOP_REFERENCE,
      selected_executor_backend: HERMES_AGENT_ADAPTER,
      creative_owner: RCA_VISUAL_DELIVERABLE_RUNTIME_OWNER,
      domain_truth_owner: RCA_VISUAL_DELIVERABLE_RUNTIME_OWNER,
      review_export_gate_owner: RCA_REVIEW_EXPORT_GATE_OWNER,
      primary_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
      execution_model: executionModel,
      opl_executor_adapter_receipt: oplExecutorAdapterReceipt,
    },
  };
}
