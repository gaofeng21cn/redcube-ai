import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  buildPythonHelperEnv,
  resolvePythonNativeHelper,
} from '@redcube/runtime-protocol';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const DEFAULT_PROBE_TIMEOUT_MS = 60000;
const DEFAULT_GENERATION_TIMEOUT_MS = 600000;

const HERMES_NATIVE_BRIDGE_COMMAND_ENV = 'REDCUBE_HERMES_NATIVE_BRIDGE_COMMAND';
const HERMES_NATIVE_PYTHON_COMMAND_ENV = 'REDCUBE_HERMES_NATIVE_PYTHON_COMMAND';
const HERMES_NATIVE_PROOF_ADAPTER = 'hermes_native_proof';
const HERMES_NATIVE_PROOF_RUNTIME_SURFACE = 'hermes_native_full_agent_loop';
const HERMES_NATIVE_DEFAULT_MODEL_SELECTION = 'inherit_local_hermes_default';
const HERMES_NATIVE_DEFAULT_REASONING_SELECTION = 'inherit_local_hermes_default';
const HERMES_NATIVE_FREEZE_ORIGIN = 'Hermes.Proof.A';

const DEFAULT_BRIDGE_HELPER = resolvePythonNativeHelper(REPO_ROOT, 'hermes_native_proof_bridge');
const DEFAULT_BRIDGE_MODULE = DEFAULT_BRIDGE_HELPER.packageModule;

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function parseCommand(value, fallback) {
  const raw = safeText(value);
  if (!raw) {
    return [...fallback];
  }
  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(`${HERMES_NATIVE_BRIDGE_COMMAND_ENV} 若使用 JSON array，必须是非空字符串数组`);
    }
    const command = parsed.map((item) => safeText(item)).filter(Boolean);
    if (command.length === 0) {
      throw new Error(`${HERMES_NATIVE_BRIDGE_COMMAND_ENV} 解析后不能为空`);
    }
    return command;
  }
  return [raw];
}

function resolveBridgeCommand(env = process.env) {
  const explicitBridge = safeText(env?.[HERMES_NATIVE_BRIDGE_COMMAND_ENV]);
  if (explicitBridge) {
    return {
      argv: parseCommand(explicitBridge, []),
      env,
    };
  }
  const pythonCommand = safeText(env?.[HERMES_NATIVE_PYTHON_COMMAND_ENV], 'python3');
  return {
    argv: [pythonCommand, '-m', DEFAULT_BRIDGE_MODULE],
    env: buildPythonHelperEnv(DEFAULT_BRIDGE_HELPER.pythonRoot, env),
  };
}

function readPromptGuidance(relativePath) {
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

function normalizeLocalFileInspection(value) {
  return (Array.isArray(value) ? value : [])
    .map((entry) => ({
      label: safeText(entry?.label, 'local-file'),
      path: safeText(entry?.path),
      media_type: safeText(entry?.media_type, 'application/octet-stream'),
      purpose: safeText(entry?.purpose),
    }))
    .filter((entry) => entry.path);
}

function buildLocalFileInspectionSection(localFileInspection = []) {
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

function buildGenerationInstructions(family, route, localFileInspection = []) {
  const localFiles = normalizeLocalFileInspection(localFileInspection);
  return [
    'You are the RedCube AI Hermes-native creative generation runtime.',
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
}) {
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

function buildHermesNativeExecutionModel(requestedAdapter = HERMES_NATIVE_PROOF_ADAPTER) {
  return {
    mainline_adapter: HERMES_NATIVE_PROOF_ADAPTER,
    primary_surface: HERMES_NATIVE_PROOF_RUNTIME_SURFACE,
    adapter_role: 'opt_in_proof_executor',
    runtime_substrate_owner: 'Hermes',
    deployment_host: 'local_hermes_agent_bridge',
    deployment_host_status: 'opt_in_available',
    requested_adapter: requestedAdapter,
    default_model_selection: HERMES_NATIVE_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: HERMES_NATIVE_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: HERMES_NATIVE_FREEZE_ORIGIN,
  };
}

function runBridgeRequest(
  request,
  {
    cwd = process.cwd(),
    env = process.env,
    timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
  } = {},
) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-native-proof-'));
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
      throw new Error(stderr || stdout || `Hermes-native bridge exited with status ${completed.status}`);
    }

    const stdout = safeText(completed.stdout);
    if (!stdout) {
      throw new Error('Hermes-native bridge returned empty stdout');
    }
    return JSON.parse(stdout);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function normalizeContract(contract) {
  const resolved = contract && typeof contract === 'object'
    ? { ...contract }
    : {};
  const model = safeText(resolved.model);
  if (!model) {
    throw new Error('Hermes-native proof 缺少可执行 model');
  }
  return {
    ...resolved,
    model,
    provider: safeText(resolved.provider) || null,
    base_url: safeText(resolved.base_url) || null,
    api_mode: safeText(resolved.api_mode) || null,
    reasoning_effort: safeText(resolved.reasoning_effort) || null,
    model_selection: safeText(resolved.model_selection, HERMES_NATIVE_DEFAULT_MODEL_SELECTION),
    reasoning_selection: safeText(resolved.reasoning_selection, HERMES_NATIVE_DEFAULT_REASONING_SELECTION),
  };
}

export function readHermesNativeProofContract({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  const response = runBridgeRequest(
    { action: 'probe' },
    { cwd, env, timeoutMs: DEFAULT_PROBE_TIMEOUT_MS },
  );
  if (response?.ok !== true) {
    throw new Error(safeText(response?.blocking_reason, 'Hermes-native proof probe failed'));
  }
  return normalizeContract(response.contract);
}

export function probeHermesNativeProof({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  try {
    const contract = readHermesNativeProofContract({ cwd, env });
    return {
      ok: true,
      runtime_owner: HERMES_NATIVE_PROOF_ADAPTER,
      contract,
      error_kind: null,
      blocking_reason: null,
    };
  } catch (error) {
    return {
      ok: false,
      runtime_owner: HERMES_NATIVE_PROOF_ADAPTER,
      contract: null,
      error_kind: 'hermes_native_proof_probe_failed',
      blocking_reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export function generateStructuredArtifactViaHermesNativeProof({
  family,
  route,
  promptRelativePath,
  context,
  outputContract,
  cwd = process.cwd(),
  timeoutMs = DEFAULT_GENERATION_TIMEOUT_MS,
  env = process.env,
  localFileInspection = [],
}) {
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
    throw new Error(safeText(response?.blocking_reason, `Hermes-native structured generation failed: ${safeFamily}:${safeRoute}`));
  }

  const contract = normalizeContract(response.contract);
  const payload = response?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`Hermes-native structured generation returned invalid JSON for route: ${safeFamily}:${safeRoute}`);
  }

  const proof = response?.proof && typeof response.proof === 'object'
    ? response.proof
    : {};
  if (proof.full_agent_loop_proved !== true) {
    throw new Error(`Hermes-native proof missing full agent loop evidence for route: ${safeFamily}:${safeRoute}`);
  }

  const executionModel = buildHermesNativeExecutionModel(HERMES_NATIVE_PROOF_ADAPTER);
  return {
    data: payload,
    generationRuntime: {
      owner: HERMES_NATIVE_PROOF_ADAPTER,
      adapter_surface: '@redcube/hermes-substrate',
      run_id: safeText(proof.session_id, `hermes-native-${randomUUID()}`),
      session_id: safeText(proof.session_id) || null,
      model_selection: contract.model_selection,
      reasoning_selection: contract.reasoning_selection,
      model: contract.model,
      provider: contract.provider,
      api_mode: contract.api_mode,
      reasoning_effort: contract.reasoning_effort,
      prompt_pack_file: safePromptRelativePath,
      proof,
      creative_owner: HERMES_NATIVE_PROOF_ADAPTER,
      primary_surface: HERMES_NATIVE_PROOF_RUNTIME_SURFACE,
      execution_model: executionModel,
    },
  };
}
