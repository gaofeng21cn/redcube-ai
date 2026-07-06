import { hermesAgentAdapterRetirementBoundary } from './executor-runtime.js';

const HERMES_AGENT_API_SURFACE = 'hermes_agent_api_server';

type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
}>;

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
  metadata?: Record<string, unknown>;
}

export interface HermesAgentLoopRequest extends HermesAgentApiClientOptions {
  model?: string;
  input: unknown;
  metadata?: Record<string, unknown>;
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

function retiredHermesAgentApiError() {
  const boundary = hermesAgentAdapterRetirementBoundary();
  return new Error(
    [
      'RCA-owned Hermes-Agent API client has been retired.',
      `surface=${HERMES_AGENT_API_SURFACE}`,
      `backend_lifecycle=${boundary.backend_lifecycle}`,
      `adapter_deletion_gate_owner=${boundary.adapter_deletion_gate_owner}`,
      'active production importers still require the exported symbol; use OPL executor adapter receipt refs instead.',
    ].join(' '),
  );
}

export async function structuredCallViaHermesAgentApi(_request: HermesAgentStructuredCallRequest) {
  throw retiredHermesAgentApiError();
}

export async function runAgentLoopViaHermesAgentApi(_request: HermesAgentLoopRequest) {
  throw retiredHermesAgentApiError();
}

export async function generateStructuredArtifactViaHermesAgentStructuredCall(
  _request: GenerateStructuredArtifactViaHermesAgentApiRequest,
) {
  throw retiredHermesAgentApiError();
}

export async function generateStructuredArtifactViaHermesAgentApi(
  _request: GenerateStructuredArtifactViaHermesAgentApiRequest,
) {
  throw retiredHermesAgentApiError();
}
