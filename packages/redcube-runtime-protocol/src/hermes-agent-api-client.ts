import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { hermesAgentAdapterRetirementBoundary } from './executor-runtime.js';

const HERMES_AGENT_API_OWNER = 'upstream_hermes_agent';
const HERMES_AGENT_API_SURFACE = 'hermes_agent_api_server';
const CHAT_COMPLETIONS_PATH = '/v1/chat/completions';
const RUNS_PATH = '/v1/runs';
const DEFAULT_COMPAT_MODEL = 'redcube-api-compat';
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const HERMES_AGENT_API_BASE_URL_ENV = 'REDCUBE_HERMES_AGENT_API_BASE_URL';
const HERMES_AGENT_API_KEY_ENV = 'REDCUBE_HERMES_AGENT_API_KEY';
const HERMES_AGENT_API_COMPAT_MODEL_ENV = 'REDCUBE_HERMES_AGENT_API_COMPAT_MODEL';

type JsonRecord = Record<string, unknown>;

type FetchResponseLike = {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
};

type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<FetchResponseLike>;

export interface HermesAgentApiClientOptions {
  baseUrl: string;
  apiKey?: string | null;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

export interface HermesAgentStructuredCallRequest extends HermesAgentApiClientOptions {
  model?: string;
  messages: unknown[];
  responseFormat?: unknown;
  metadata?: JsonRecord;
}

export interface HermesAgentLoopRequest extends HermesAgentApiClientOptions {
  model?: string;
  input: unknown;
  metadata?: JsonRecord;
}

export interface GenerateStructuredArtifactViaHermesAgentApiRequest {
  family?: unknown;
  route?: unknown;
  promptRelativePath?: unknown;
  context?: unknown;
  outputContract?: unknown;
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  localFileInspection?: unknown[];
  fetchImpl?: FetchLike;
  hermesProfile?: unknown;
  executorRouting?: unknown;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireText(name: string, value: unknown): string {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function optionalText(value: unknown): string | null {
  const text = String(value || '').trim();
  return text || null;
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeBaseUrl(value: unknown): string {
  return requireText('Hermes-Agent API baseUrl', value).replace(/\/+$/, '');
}

function resolveFetch(fetchImpl?: FetchLike): FetchLike {
  if (fetchImpl) {
    return fetchImpl;
  }
  if (typeof fetch !== 'function') {
    throw new Error('当前 Node runtime 不支持 fetch，无法调用 Hermes-Agent API server');
  }
  return fetch as unknown as FetchLike;
}

function buildHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  const key = optionalText(apiKey);
  if (key) {
    headers.authorization = `Bearer ${key}`;
  }
  return headers;
}

async function requestJson({
  baseUrl,
  apiKey,
  path,
  body,
  fetchImpl,
  timeoutMs = 60000,
}: HermesAgentApiClientOptions & {
  path: string;
  body?: JsonRecord;
}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await resolveFetch(fetchImpl)(`${normalizeBaseUrl(baseUrl)}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: buildHeaders(apiKey),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`Hermes-Agent API ${path} failed: ${response.status} ${response.statusText} ${raw}`.trim());
    }
    if (!raw.trim()) {
      return null;
    }
    return JSON.parse(raw) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

function parseStructuredContent(response: JsonRecord): unknown {
  const firstChoice = Array.isArray(response.choices) ? response.choices[0] : null;
  const content = isJsonRecord(firstChoice)
    && isJsonRecord(firstChoice.message)
    ? firstChoice.message.content
    : response.output;
  if (isJsonRecord(content) || Array.isArray(content)) {
    return content;
  }
  if (typeof content === 'string') {
    const parsed = JSON.parse(content) as unknown;
    if (isJsonRecord(parsed) || Array.isArray(parsed)) {
      return parsed;
    }
  }
  throw new Error('Hermes-Agent structured_call returned no structured JSON payload');
}

function extractRunEvents(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (isJsonRecord(response) && Array.isArray(response.events)) {
    return response.events;
  }
  throw new Error('Hermes-Agent run events response must be an array or { events: [] }');
}

function buildProof({
  callSurface,
  endpoint,
  response,
  requestedModel,
  hermesProfile = null,
  runEvents = [],
}: {
  callSurface: 'structured_call' | 'agent_loop';
  endpoint: string;
  response: JsonRecord;
  requestedModel: string;
  hermesProfile?: string | null;
  runEvents?: unknown[];
}) {
  return {
    proof_id: `hermes-agent-api-${randomUUID()}`,
    runtime_owner: HERMES_AGENT_API_OWNER,
    adapter_surface: '@redcube/runtime-protocol',
    api_surface: HERMES_AGENT_API_SURFACE,
    call_surface: callSurface,
    endpoint,
    provider: requireText('Hermes-Agent proof provider', response.provider),
    model: requireText('Hermes-Agent proof model', response.model),
    requested_model: requestedModel,
    request_model_role: 'api_compatibility_only',
    model_selection_basis: 'hermes_agent_server_runtime',
    hermes_profile: optionalText(response.hermes_profile || response.profile) || optionalText(hermesProfile),
    session_id: optionalText(response.session_id),
    run_id: optionalText(response.run_id),
    run_events: runEvents,
  };
}

function readPromptGuidance(relativePath: string): string {
  const safePath = requireText('Hermes-Agent promptRelativePath', relativePath);
  const absolutePath = path.join(REPO_ROOT, safePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${safePath}`);
  }
  const raw = readFileSync(absolutePath, 'utf-8');
  const runtimeSectionIndex = raw.search(/^##\s+runtime_(seed|artifact)\b/m);
  return (runtimeSectionIndex === -1 ? raw : raw.slice(0, runtimeSectionIndex)).trim();
}

function normalizeLocalFileInspection(value: unknown): JsonRecord[] {
  return (Array.isArray(value) ? value : [])
    .map((entry) => ({
      label: safeText((entry as JsonRecord)?.label, 'local-file'),
      path: safeText((entry as JsonRecord)?.path),
      media_type: safeText((entry as JsonRecord)?.media_type, 'application/octet-stream'),
      purpose: safeText((entry as JsonRecord)?.purpose),
    }))
    .filter((entry) => entry.path);
}

function buildGenerationPrompt({
  family,
  route,
  promptRelativePath,
  context,
  outputContract,
  localFileInspection = [],
}: {
  family: string;
  route: string;
  promptRelativePath: string;
  context: unknown;
  outputContract: unknown;
  localFileInspection?: unknown[];
}): string {
  const inspectedFiles = normalizeLocalFileInspection(localFileInspection);
  return [
    'You are the RedCube AI Hermes-Agent API creative execution runtime.',
    `Produce the ${family}:${route} artifact as audience-facing creative output.`,
    'Use the supplied prompt guidance, context, output contract, and explicitly listed local files only.',
    'Return a JSON object only.',
    '',
    '# Prompt Pack Guidance',
    readPromptGuidance(promptRelativePath),
    '',
    '# Context',
    JSON.stringify(context, null, 2),
    '',
    '# Output Contract',
    JSON.stringify(outputContract, null, 2),
    '',
    '# Local File Inspection',
    JSON.stringify(inspectedFiles, null, 2),
  ].join('\n');
}

function resolveHermesAgentApiOptions(env: NodeJS.ProcessEnv = process.env) {
  return {
    baseUrl: requireText(HERMES_AGENT_API_BASE_URL_ENV, env[HERMES_AGENT_API_BASE_URL_ENV]),
    apiKey: optionalText(env[HERMES_AGENT_API_KEY_ENV]),
    model: safeText(env[HERMES_AGENT_API_COMPAT_MODEL_ENV], DEFAULT_COMPAT_MODEL),
  };
}

function payloadFromHermesAgentOutput(output: unknown): JsonRecord {
  const payload = isJsonRecord(output) && isJsonRecord(output.payload)
    ? output.payload
    : output;
  if (!isJsonRecord(payload)) {
    throw new Error('Hermes-Agent returned no structured artifact payload');
  }
  return payload;
}

export async function structuredCallViaHermesAgentApi({
  baseUrl,
  apiKey = null,
  model = DEFAULT_COMPAT_MODEL,
  messages,
  responseFormat,
  metadata = {},
  fetchImpl,
  timeoutMs,
}: HermesAgentStructuredCallRequest) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Hermes-Agent structured_call messages 不能为空');
  }
  const requestedModel = requireText('Hermes-Agent API compatibility model', model);
  const response = await requestJson({
    baseUrl,
    apiKey,
    path: CHAT_COMPLETIONS_PATH,
    body: {
      model: requestedModel,
      ...(optionalText(metadata.hermes_profile) ? { hermes_profile: optionalText(metadata.hermes_profile) } : {}),
      messages,
      response_format: responseFormat,
      metadata,
    },
    fetchImpl,
    timeoutMs,
  });
  if (!isJsonRecord(response)) {
    throw new Error('Hermes-Agent structured_call response must be a JSON object');
  }
  const proof = buildProof({
    callSurface: 'structured_call',
    endpoint: CHAT_COMPLETIONS_PATH,
    response,
    requestedModel,
    hermesProfile: optionalText(metadata.hermes_profile),
  });
  return {
    data: parseStructuredContent(response),
    proof,
  };
}

export async function runAgentLoopViaHermesAgentApi({
  baseUrl,
  apiKey = null,
  model = DEFAULT_COMPAT_MODEL,
  input,
  metadata = {},
  fetchImpl,
  timeoutMs,
}: HermesAgentLoopRequest) {
  const requestedModel = requireText('Hermes-Agent API compatibility model', model);
  const runResponse = await requestJson({
    baseUrl,
    apiKey,
    path: RUNS_PATH,
    body: {
      model: requestedModel,
      ...(optionalText(metadata.hermes_profile) ? { hermes_profile: optionalText(metadata.hermes_profile) } : {}),
      input,
      metadata,
    },
    fetchImpl,
    timeoutMs,
  });
  if (!isJsonRecord(runResponse)) {
    throw new Error('Hermes-Agent agent_loop response must be a JSON object');
  }
  const runId = requireText('Hermes-Agent run_id', runResponse.run_id);
  const eventsEndpoint = `${RUNS_PATH}/${encodeURIComponent(runId)}/events`;
  const eventsResponse = await requestJson({
    baseUrl,
    apiKey,
    path: eventsEndpoint,
    fetchImpl,
    timeoutMs,
  });
  const runEvents = extractRunEvents(eventsResponse);
  return {
    data: isJsonRecord(runResponse.output) || Array.isArray(runResponse.output)
      ? runResponse.output
      : runResponse,
    proof: buildProof({
      callSurface: 'agent_loop',
      endpoint: `${RUNS_PATH} -> ${eventsEndpoint}`,
      response: runResponse,
      requestedModel,
      hermesProfile: optionalText(metadata.hermes_profile),
      runEvents,
    }),
  };
}

function buildGenerationMessages(prompt: string): Array<{ role: string; content: string }> {
  return [
    {
      role: 'system',
      content: 'You are RedCube AI structured_call runtime. Return only valid JSON that satisfies the requested output contract.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];
}

function buildGenerationRuntime({
  proof,
  promptRelativePath,
  executionShape,
  hermesProfile,
  route,
  executorRouting,
}: {
  proof: JsonRecord;
  promptRelativePath: string;
  executionShape: 'structured_call' | 'agent_loop';
  hermesProfile?: string | null;
  route?: string | null;
  executorRouting?: unknown;
}) {
  return {
    owner: 'hermes_agent',
    adapter_surface: '@redcube/runtime-protocol',
    api_surface: HERMES_AGENT_API_SURFACE,
    run_id: safeText(proof.run_id, `hermes-agent-${randomUUID()}`),
    session_id: safeText(proof.session_id) || null,
    model_selection: 'hermes_agent_server_runtime',
    reasoning_selection: 'hermes_agent_server_runtime',
    model: safeText(proof.model),
    provider: safeText(proof.provider),
    hermes_profile: safeText(proof.hermes_profile || hermesProfile) || null,
    api_mode: 'hermes_agent_api_server',
    prompt_pack_file: promptRelativePath,
    proof,
    ...(executorRouting ? { executor_routing: executorRouting } : {}),
    creative_owner: 'hermes_agent',
    primary_surface: HERMES_AGENT_API_SURFACE,
    ...hermesAgentAdapterRetirementBoundary(),
    execution_model: {
      mainline_adapter: 'hermes_agent',
      executor_backend: 'hermes_agent',
      execution_shape: executionShape,
      primary_surface: HERMES_AGENT_API_SURFACE,
      adapter_role: 'opt_in_external_executor_adapter_proof',
      runtime_substrate_owner: 'Hermes-Agent',
      deployment_host: 'external_hermes_agent_api_server',
      deployment_host_status: 'explicit_runtime_switch',
      requested_adapter: 'hermes_agent',
      route: safeText(route) || null,
      hermes_profile: safeText(proof.hermes_profile || hermesProfile) || null,
      freeze_origin_milestone: 'Hermes.API.A',
      ...hermesAgentAdapterRetirementBoundary(),
    },
  };
}

export async function generateStructuredArtifactViaHermesAgentStructuredCall({
  family,
  route,
  promptRelativePath,
  context,
  outputContract,
  timeoutMs,
  env = process.env,
  localFileInspection = [],
  fetchImpl,
  hermesProfile = null,
  executorRouting = null,
}: GenerateStructuredArtifactViaHermesAgentApiRequest) {
  const safeFamily = safeText(family, 'unknown_family');
  const safeRoute = safeText(route, 'unknown_route');
  const safePromptRelativePath = requireText('Hermes-Agent promptRelativePath', promptRelativePath);
  const api = resolveHermesAgentApiOptions(env);
  const profile = optionalText(hermesProfile);
  const prompt = buildGenerationPrompt({
    family: safeFamily,
    route: safeRoute,
    promptRelativePath: safePromptRelativePath,
    context,
    outputContract,
    localFileInspection,
  });
  const result = await structuredCallViaHermesAgentApi({
    ...api,
    messages: buildGenerationMessages(prompt),
    responseFormat: { type: 'json_object' },
    metadata: {
      family: safeFamily,
      route: safeRoute,
      execution_shape: 'structured_call',
      prompt_relative_path: safePromptRelativePath,
      ...(profile ? { hermes_profile: profile } : {}),
      ...(executorRouting ? { executor_routing: executorRouting } : {}),
    },
    fetchImpl,
    timeoutMs,
  });
  const proof = result.proof as JsonRecord;
  return {
    data: payloadFromHermesAgentOutput(result.data),
    generationRuntime: buildGenerationRuntime({
      proof,
      promptRelativePath: safePromptRelativePath,
      executionShape: 'structured_call',
      hermesProfile: profile,
      route: safeRoute,
      executorRouting,
    }),
  };
}

export async function generateStructuredArtifactViaHermesAgentApi({
  family,
  route,
  promptRelativePath,
  context,
  outputContract,
  timeoutMs,
  env = process.env,
  localFileInspection = [],
  fetchImpl,
  hermesProfile = null,
  executorRouting = null,
}: GenerateStructuredArtifactViaHermesAgentApiRequest) {
  const safeFamily = safeText(family, 'unknown_family');
  const safeRoute = safeText(route, 'unknown_route');
  const safePromptRelativePath = requireText('Hermes-Agent promptRelativePath', promptRelativePath);
  const api = resolveHermesAgentApiOptions(env);
  const prompt = buildGenerationPrompt({
    family: safeFamily,
    route: safeRoute,
    promptRelativePath: safePromptRelativePath,
    context,
    outputContract,
    localFileInspection,
  });
  const result = await runAgentLoopViaHermesAgentApi({
    ...api,
    input: {
      family: safeFamily,
      route: safeRoute,
      prompt,
      context,
      output_contract: outputContract,
      local_file_inspection: normalizeLocalFileInspection(localFileInspection),
    },
    metadata: {
      family: safeFamily,
      route: safeRoute,
      execution_shape: 'agent_loop',
      prompt_relative_path: safePromptRelativePath,
      ...(optionalText(hermesProfile) ? { hermes_profile: optionalText(hermesProfile) } : {}),
      ...(executorRouting ? { executor_routing: executorRouting } : {}),
    },
    fetchImpl,
    timeoutMs,
  });
  const proof = result.proof as JsonRecord;
  return {
    data: payloadFromHermesAgentOutput(result.data),
    generationRuntime: buildGenerationRuntime({
      proof,
      promptRelativePath: safePromptRelativePath,
      executionShape: 'agent_loop',
      hermesProfile: optionalText(hermesProfile),
      route: safeRoute,
      executorRouting,
    }),
  };
}
