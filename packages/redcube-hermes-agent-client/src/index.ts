export interface HermesAgentUpstreamConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface HermesAgentProbeHeaders {
  Accept: string;
  Authorization?: string;
}

export interface HermesAgentProbeStepResult {
  ok: boolean;
  status: number | null;
  url: string;
  detail: string | null;
  terminal_event?: string | null;
  run_id?: string | null;
}

export interface HermesAgentProbeResult {
  ok: boolean;
  status: 'ready' | 'blocked';
  runtime_owner: 'upstream_hermes_agent';
  config: {
    base_url: string;
    model_name: string;
    api_key_configured: boolean;
  };
  steps: {
    health: HermesAgentProbeStepResult;
    models: HermesAgentProbeStepResult;
    run_surface: HermesAgentProbeStepResult | null;
  };
  error_kind: string | null;
  blocking_reason: string | null;
}

export declare const DEFAULT_HERMES_AGENT_UPSTREAM_BASE_URL: 'http://127.0.0.1:8642';
export declare const DEFAULT_HERMES_AGENT_MODEL_NAME: 'hermes-agent';

export declare function readHermesAgentUpstreamConfig(
  env?: Record<string, string | undefined>,
): HermesAgentUpstreamConfig;

export declare function buildHermesAgentProbeHeaders(
  config: HermesAgentUpstreamConfig,
): HermesAgentProbeHeaders;

export declare function probeHermesAgentUpstream(options?: {
  config?: HermesAgentUpstreamConfig;
  fetchImpl?: typeof globalThis.fetch;
  requireRunSurface?: boolean;
  runInput?: string;
  sessionId?: string;
  timeoutMs?: number;
}): Promise<HermesAgentProbeResult>;
