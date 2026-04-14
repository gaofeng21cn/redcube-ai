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
