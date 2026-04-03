export function createRunRecord(input = {}) {
  return {
    run_id: String(input.runId || '').trim(),
    route: String(input.route || '').trim(),
    scope: String(input.scope || '').trim(),
    target: String(input.target || '').trim(),
    overlay: String(input.overlay || '').trim(),
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    error: null,
  };
}
