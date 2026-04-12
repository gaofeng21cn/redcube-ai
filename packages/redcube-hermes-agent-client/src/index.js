import { randomUUID } from 'node:crypto';

export const DEFAULT_HERMES_AGENT_UPSTREAM_BASE_URL = 'http://127.0.0.1:8642';
export const DEFAULT_HERMES_AGENT_MODEL_NAME = 'hermes-agent';

function normalizeBaseUrl(rawBaseUrl) {
  const text = String(rawBaseUrl || '').trim();
  if (!text) {
    throw new Error('REDCUBE_HERMES_UPSTREAM_BASE_URL 不能为空');
  }
  const url = new URL(text);
  return url.toString().replace(/\/$/, '');
}

function isLoopbackBaseUrl(baseUrl) {
  const { hostname } = new URL(baseUrl);
  return hostname === '127.0.0.1'
    || hostname === 'localhost'
    || hostname === '::1';
}

function summarizeError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }
  return JSON.parse(text);
}

function buildBlockedResult({
  config,
  steps,
  errorKind,
  blockingReason,
}) {
  return {
    ok: false,
    status: 'blocked',
    runtime_owner: 'upstream_hermes_agent',
    config: {
      base_url: config.baseUrl,
      model_name: config.modelName,
      api_key_configured: Boolean(config.apiKey),
    },
    steps,
    error_kind: errorKind,
    blocking_reason: blockingReason,
  };
}

async function readTerminalRunEvent({ fetchImpl, baseUrl, headers, runId, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${baseUrl}/v1/runs/${runId}/events`, {
      headers,
      signal: controller.signal,
    });
    const step = {
      ok: false,
      status: response.status,
      url: `${baseUrl}/v1/runs/${runId}/events`,
      detail: null,
      terminal_event: null,
      run_id: runId,
    };

    if (!response.ok) {
      step.detail = `run events endpoint returned ${response.status}`;
      return step;
    }

    const payload = await response.text();
    const dataLines = payload
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice('data: '.length).trim())
      .filter(Boolean);

    for (const line of dataLines) {
      const event = JSON.parse(line);
      if (event.event === 'run.completed' || event.event === 'run.failed') {
        step.ok = event.event === 'run.completed';
        step.terminal_event = event.event;
        step.detail = event.event === 'run.completed'
          ? 'run surface completed successfully'
          : String(event.error || 'run surface returned run.failed');
        return step;
      }
    }

    step.detail = 'run events endpoint did not emit a terminal event';
    return step;
  } finally {
    clearTimeout(timer);
  }
}

export function readHermesAgentUpstreamConfig(env = process.env) {
  const explicitBaseUrl = Object.prototype.hasOwnProperty.call(env, 'REDCUBE_HERMES_UPSTREAM_BASE_URL')
    ? env.REDCUBE_HERMES_UPSTREAM_BASE_URL
    : undefined;
  const baseUrl = normalizeBaseUrl(
    explicitBaseUrl === undefined ? DEFAULT_HERMES_AGENT_UPSTREAM_BASE_URL : explicitBaseUrl,
  );
  const apiKey = String(env.REDCUBE_HERMES_UPSTREAM_API_KEY || '').trim();
  const modelName = String(env.REDCUBE_HERMES_UPSTREAM_MODEL || '').trim()
    || DEFAULT_HERMES_AGENT_MODEL_NAME;

  if (!isLoopbackBaseUrl(baseUrl) && !apiKey) {
    throw new Error('REDCUBE_HERMES_UPSTREAM_API_KEY 在非 loopback upstream host 上不能为空');
  }

  return {
    baseUrl,
    apiKey,
    modelName,
  };
}

export function buildHermesAgentProbeHeaders(config) {
  const headers = {
    Accept: 'application/json',
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  return headers;
}

export async function probeHermesAgentUpstream({
  config = readHermesAgentUpstreamConfig(),
  fetchImpl = globalThis.fetch,
  requireRunSurface = false,
  runInput = 'RedCube upstream Hermes-Agent activation probe. Reply with READY.',
  sessionId = `redcube-probe-${randomUUID()}`,
  timeoutMs = 15000,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const headers = buildHermesAgentProbeHeaders(config);
  const steps = {
    health: {
      ok: false,
      status: null,
      url: `${config.baseUrl}/v1/health`,
      detail: null,
    },
    models: {
      ok: false,
      status: null,
      url: `${config.baseUrl}/v1/models`,
      detail: null,
    },
    run_surface: null,
  };

  try {
    const healthResponse = await fetchImpl(steps.health.url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    steps.health.status = healthResponse.status;
    if (!healthResponse.ok) {
      steps.health.detail = `health endpoint returned ${healthResponse.status}`;
      return buildBlockedResult({
        config,
        steps,
        errorKind: 'upstream_health_check_failed',
        blockingReason: steps.health.detail,
      });
    }
    steps.health.ok = true;
    steps.health.detail = 'health endpoint reachable';
  } catch (error) {
    steps.health.detail = summarizeError(error);
    return buildBlockedResult({
      config,
      steps,
      errorKind: 'upstream_health_check_failed',
      blockingReason: steps.health.detail,
    });
  }

  try {
    const modelsResponse = await fetchImpl(steps.models.url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    steps.models.status = modelsResponse.status;
    if (!modelsResponse.ok) {
      steps.models.detail = `models endpoint returned ${modelsResponse.status}`;
      return buildBlockedResult({
        config,
        steps,
        errorKind: 'upstream_models_check_failed',
        blockingReason: steps.models.detail,
      });
    }
    const payload = await readJsonResponse(modelsResponse);
    const models = Array.isArray(payload?.data) ? payload.data : [];
    const advertisedModel = models.some((entry) => entry?.id === config.modelName);
    if (!advertisedModel) {
      steps.models.detail = `advertised model missing: ${config.modelName}`;
      return buildBlockedResult({
        config,
        steps,
        errorKind: 'upstream_model_not_advertised',
        blockingReason: steps.models.detail,
      });
    }
    steps.models.ok = true;
    steps.models.detail = `advertised model present: ${config.modelName}`;
  } catch (error) {
    steps.models.detail = summarizeError(error);
    return buildBlockedResult({
      config,
      steps,
      errorKind: 'upstream_models_check_failed',
      blockingReason: steps.models.detail,
    });
  }

  if (requireRunSurface) {
    steps.run_surface = {
      ok: false,
      status: null,
      url: `${config.baseUrl}/v1/runs`,
      detail: null,
      terminal_event: null,
      run_id: null,
    };

    try {
      const runResponse = await fetchImpl(steps.run_surface.url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: runInput,
          session_id: sessionId,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      steps.run_surface.status = runResponse.status;
      if (!runResponse.ok) {
        steps.run_surface.detail = `run surface returned ${runResponse.status}`;
        return buildBlockedResult({
          config,
          steps,
          errorKind: 'upstream_run_surface_failed',
          blockingReason: steps.run_surface.detail,
        });
      }

      const runPayload = await readJsonResponse(runResponse);
      const runId = String(runPayload?.run_id || '').trim();
      if (!runId) {
        steps.run_surface.detail = 'run surface did not return run_id';
        return buildBlockedResult({
          config,
          steps,
          errorKind: 'upstream_run_surface_failed',
          blockingReason: steps.run_surface.detail,
        });
      }

      const terminalEvent = await readTerminalRunEvent({
        fetchImpl,
        baseUrl: config.baseUrl,
        headers,
        runId,
        timeoutMs,
      });
      steps.run_surface = {
        ...terminalEvent,
        url: steps.run_surface.url,
      };
      if (!steps.run_surface.ok) {
        return buildBlockedResult({
          config,
          steps,
          errorKind: 'upstream_run_surface_failed',
          blockingReason: steps.run_surface.detail,
        });
      }
    } catch (error) {
      steps.run_surface.detail = summarizeError(error);
      return buildBlockedResult({
        config,
        steps,
        errorKind: 'upstream_run_surface_failed',
        blockingReason: steps.run_surface.detail,
      });
    }
  }

  return {
    ok: true,
    status: 'ready',
    runtime_owner: 'upstream_hermes_agent',
    config: {
      base_url: config.baseUrl,
      model_name: config.modelName,
      api_key_configured: Boolean(config.apiKey),
    },
    steps,
    error_kind: null,
    blocking_reason: null,
  };
}
