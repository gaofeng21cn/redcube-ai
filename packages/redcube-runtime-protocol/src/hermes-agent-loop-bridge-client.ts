import { hermesAgentAdapterRetirementBoundary } from './executor-runtime.js';

const HERMES_AGENT_ADAPTER = 'hermes_agent';
const HERMES_AGENT_LOOP_RUNTIME_SURFACE = 'hermes_agent_loop';
const HERMES_AGENT_LOOP_HELPER_ID = 'hermes_agent_loop_bridge';

type JsonRecord = Record<string, unknown>;

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

function retiredHermesAgentLoopError() {
  const boundary = hermesAgentAdapterRetirementBoundary();
  return new Error(
    [
      'RCA-owned Hermes-Agent loop bridge has been retired.',
      `surface=${HERMES_AGENT_LOOP_RUNTIME_SURFACE}`,
      `helper_id=${HERMES_AGENT_LOOP_HELPER_ID}`,
      `backend_lifecycle=${boundary.backend_lifecycle}`,
      `adapter_deletion_gate_owner=${boundary.adapter_deletion_gate_owner}`,
      'active production importers still require the exported symbol; use OPL executor adapter receipt refs instead.',
    ].join(' '),
  );
}

export function readHermesAgentLoopContract(_request: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  throw retiredHermesAgentLoopError();
}

export function probeHermesAgentLoop(_request: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  const error = retiredHermesAgentLoopError();
  return {
    ok: false,
    runtime_owner: HERMES_AGENT_ADAPTER,
    contract: null,
    error_kind: 'hermes_agent_loop_retired',
    blocking_reason: error.message,
    retirement_boundary: hermesAgentAdapterRetirementBoundary(),
  };
}

export function generateStructuredArtifactViaHermesAgentLoop(
  _request: GenerateStructuredArtifactRequest,
): JsonRecord {
  throw retiredHermesAgentLoopError();
}
