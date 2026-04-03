function requireIdentity(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function createRunRecord(input = {}) {
  const run_id = requireIdentity('runId', input.runId);
  const route = requireIdentity('route', input.route);
  const scope = requireIdentity('scope', input.scope);
  const target = requireIdentity('target', input.target);
  const overlay = requireIdentity('overlay', input.overlay);

  return {
    run_id,
    route,
    scope,
    target,
    overlay,
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    error: null,
  };
}
