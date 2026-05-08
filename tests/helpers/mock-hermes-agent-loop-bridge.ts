// @ts-nocheck
import process from 'node:process';
import { readFileSync } from 'node:fs';

import { buildMockCreativeOutput } from './mock-codex-cli.ts';

function readRequest() {
  const requestPath = String(process.argv[2] || '').trim();
  if (!requestPath) {
    throw new Error('mock hermes native bridge requires request json path');
  }
  return JSON.parse(readFileSync(requestPath, 'utf-8'));
}

function buildProbeResponse() {
  return {
    ok: true,
    contract: {
      entrypoint: 'run_agent.AIAgent.run_conversation',
      full_agent_loop_required: true,
      model: 'mock-local-hermes-default',
      provider: 'mock-provider',
      base_url: 'http://127.0.0.1:8080/v1',
      api_mode: 'responses',
      reasoning_effort: 'xhigh',
      model_selection: 'inherit_local_hermes_default',
      reasoning_selection: 'inherit_local_hermes_default',
    },
  };
}

function buildGenerateResponse(request) {
  const meta = {
    family: request.family,
    route: request.route,
    context: request.context,
  };
  return {
    ok: true,
    payload: buildMockCreativeOutput(meta),
    contract: {
      entrypoint: 'run_agent.AIAgent.run_conversation',
      full_agent_loop_required: true,
      model: 'mock-local-hermes-default',
      provider: 'mock-provider',
      base_url: 'http://127.0.0.1:8080/v1',
      api_mode: 'responses',
      reasoning_effort: 'xhigh',
      model_selection: 'inherit_local_hermes_default',
      reasoning_selection: 'inherit_local_hermes_default',
    },
    proof: {
      proof_kind: 'full_agent_loop_aiaagent',
      full_agent_loop_proved: true,
      session_id: 'mock-hermes-session',
      api_calls: 1,
      tool_call_count: 2,
      event_count: 4,
      event_stream: [
        { type: 'tool_start', tool: 'read_file' },
        { type: 'tool_complete', tool: 'read_file' },
        { type: 'step', step: 1 },
        { type: 'status', event: 'completed' },
      ],
      reasoning_semantics_status: 'proved_via_mock_bridge',
    },
  };
}

function main() {
  const request = readRequest();
  const action = String(request.action || '').trim();
  if (action === 'probe') {
    process.stdout.write(`${JSON.stringify(buildProbeResponse())}\n`);
    return;
  }
  if (action === 'generate') {
    process.stdout.write(`${JSON.stringify(buildGenerateResponse(request))}\n`);
    return;
  }
  throw new Error(`unsupported mock hermes native bridge action: ${action}`);
}

main();
