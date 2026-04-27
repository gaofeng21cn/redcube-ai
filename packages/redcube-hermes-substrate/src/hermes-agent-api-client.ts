import { randomUUID } from 'node:crypto';

const HERMES_AGENT_API_OWNER = 'upstream_hermes_agent';
const HERMES_AGENT_API_SURFACE = 'hermes_agent_api_server';
const CHAT_COMPLETIONS_PATH = '/v1/chat/completions';
const RUNS_PATH = '/v1/runs';
const DEFAULT_COMPAT_MODEL = 'redcube-api-compat';

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
  runEvents = [],
}: {
  callSurface: 'structured_call' | 'agent_loop';
  endpoint: string;
  response: JsonRecord;
  requestedModel: string;
  runEvents?: unknown[];
}) {
  return {
    proof_id: `hermes-agent-api-${randomUUID()}`,
    runtime_owner: HERMES_AGENT_API_OWNER,
    adapter_surface: '@redcube/hermes-substrate',
    api_surface: HERMES_AGENT_API_SURFACE,
    call_surface: callSurface,
    endpoint,
    provider: requireText('Hermes-Agent proof provider', response.provider),
    model: requireText('Hermes-Agent proof model', response.model),
    requested_model: requestedModel,
    request_model_role: 'api_compatibility_only',
    model_selection_basis: 'hermes_agent_server_runtime',
    session_id: optionalText(response.session_id),
    run_id: optionalText(response.run_id),
    run_events: runEvents,
  };
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
      runEvents,
    }),
  };
}
