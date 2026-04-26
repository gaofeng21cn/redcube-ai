export interface CodexCliContract {
  command: string[];
  sandbox: string;
  model: string | null;
  reasoning_effort: string | null;
  model_selection: string;
  reasoning_selection: string;
}

export interface CodexCliProbeStepResult {
  ok: boolean;
  command: string[];
  detail: string | null;
  exit_code: number | null;
  terminal_event?: string | null;
  run_id?: string | null;
}

export interface CodexCliProbeResult {
  ok: boolean;
  status: 'ready' | 'blocked';
  runtime_owner: 'codex_cli';
  contract: {
    command: string[];
    sandbox: string;
    model_selection: string;
    reasoning_selection: string;
  };
  steps: {
    exec_surface: CodexCliProbeStepResult;
  };
  error_kind: string | null;
  blocking_reason: string | null;
}

export interface StructuredArtifactGenerationRuntime {
  owner: 'codex_cli';
  adapter_surface: '@redcube/codex-cli-client';
  run_id: string;
  session_id: string;
  model_selection: string;
  reasoning_selection: string;
  sandbox: string;
  prompt_pack_file: string;
  usage: Record<string, unknown> | null;
}

export interface StructuredArtifactGenerationResult {
  data: Record<string, unknown>;
  generationRuntime: StructuredArtifactGenerationRuntime;
}

export interface CodexCliBatchStageOptions {
  stage_id?: string;
  family?: string;
  route: string;
  promptRelativePath: string;
  context?: Record<string, unknown>;
  outputContract?: Record<string, unknown>;
  localFileInspection?: Array<Record<string, unknown>>;
  timeoutMs?: number;
  cwd?: string;
}

export interface CodexCliBatchSessionPoolDescriptor {
  descriptor_id?: string;
  reuse_strategy?: string;
}

export interface StructuredArtifactBatchGenerationResult {
  data: Array<{
    stage_id: string;
    data: Record<string, unknown>;
    generationRuntime: StructuredArtifactGenerationRuntime;
  }>;
  batchRuntime: {
    owner: 'codex_cli';
    adapter_surface: '@redcube/codex-cli-client';
    batch_descriptor: {
      kind: 'codex_cli_batch_descriptor';
      stage_count: number;
      stage_ids: string[];
      timeout_policy: 'per_stage';
      json_contract_policy: 'per_stage';
      cleanup_policy: 'per_invocation_timeout_cleanup';
    };
    session_pool: {
      descriptor_id: string;
      reuse_strategy: string;
      reuse_supported: false;
      reuse_claimed: false;
      reuse_status: 'unsupported_by_exec_surface';
      invocation_surface: 'codex_exec_ephemeral_per_stage';
      invocation_count: number;
      stage_session_ids: string[];
    };
  };
}

export {
  REDCUBE_CODEX_RUNTIME_OWNER,
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_CREATIVE_GENERATION_META_END,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
  probeCodexCli,
  readCodexCliContract,
} from './index.impl.js';
