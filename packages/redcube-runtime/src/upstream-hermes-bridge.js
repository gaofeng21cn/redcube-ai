import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';
import {
  probeHermesAgentUpstream,
  readHermesAgentRunEvents,
  readHermesAgentUpstreamConfig,
  startHermesAgentRun,
  UPSTREAM_HERMES_AGENT_RUNTIME_OWNER,
} from '@redcube/hermes-agent-client';

export const REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN = 'REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN';
export const REDCUBE_SERVICE_ENTRY_ENVELOPE_END = 'REDCUBE_SERVICE_ENTRY_ENVELOPE_END';

function writeJson(file, content) {
  writeFileSync(file, JSON.stringify(content, null, 2), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function upstreamBridgeDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'upstream-hermes-bridge');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function serviceEntryScriptFile() {
  return fileURLToPath(new URL('./execute-redcube-service-entry.js', import.meta.url));
}

function buildServiceEntryFiles({ workspaceRoot, entryKind }) {
  const bridgeDir = upstreamBridgeDir(workspaceRoot);
  const runKey = `${entryKind}-${randomUUID()}`;
  return {
    requestFile: path.join(bridgeDir, `${runKey}.request.json`),
    responseFile: path.join(bridgeDir, `${runKey}.response.json`),
  };
}

function buildServiceEntryCommand({ requestFile, responseFile }) {
  return `node ${shellEscape(serviceEntryScriptFile())} --request-file ${shellEscape(requestFile)} --response-file ${shellEscape(responseFile)}`;
}

function buildServiceEntryEnvelope({ entryKind, requestFile, responseFile, cwd, command }) {
  return {
    schema_version: 1,
    runtime_owner: UPSTREAM_HERMES_AGENT_RUNTIME_OWNER,
    adapter_surface: '@redcube/hermes-agent-client',
    entry_kind: entryKind,
    cwd,
    command,
    request_file: requestFile,
    response_file: responseFile,
  };
}

function buildHermesRunInput(envelope) {
  return [
    'Execute the following RedCube service entry envelope exactly once.',
    'Use the terminal tool exactly once with the provided command.',
    'Do not rewrite the command and do not improvise.',
    REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN,
    JSON.stringify(envelope, null, 2),
    REDCUBE_SERVICE_ENTRY_ENVELOPE_END,
    'After the command completes, reply with only the absolute response_file path.',
  ].join('\n');
}

function buildHermesRunInstructions() {
  return [
    'You are the runtime substrate relay for RedCube AI.',
    'Always use the terminal tool exactly once with the command inside the RedCube service entry envelope.',
    'If the command succeeds, answer with only the response_file path.',
    'If the command fails, stop and let the run fail instead of guessing.',
  ].join(' ');
}

export async function assertUpstreamHermesReady({ timeoutMs = 15000 } = {}) {
  const config = readHermesAgentUpstreamConfig();
  const probe = await probeHermesAgentUpstream({
    config,
    requireRunSurface: false,
    timeoutMs,
  });

  if (!probe.ok) {
    const error = new Error(
      `upstream Hermes-Agent blocked: ${probe.blocking_reason || probe.error_kind || 'unknown'}`,
    );
    error.runtime_owner = probe.runtime_owner;
    error.probe = probe;
    throw error;
  }

  return {
    config,
    probe,
  };
}

export async function executeServiceEntryViaUpstreamHermes({
  workspaceRoot,
  entryKind,
  request,
  timeoutMs = 180000,
} = {}) {
  const { config, probe } = await assertUpstreamHermesReady({
    timeoutMs: Math.min(timeoutMs, 15000),
  });
  const { requestFile, responseFile } = buildServiceEntryFiles({ workspaceRoot, entryKind });
  writeJson(requestFile, {
    schema_version: 1,
    entry_kind: entryKind,
    request,
  });

  const command = buildServiceEntryCommand({ requestFile, responseFile });
  const envelope = buildServiceEntryEnvelope({
    entryKind,
    requestFile,
    responseFile,
    cwd: process.cwd(),
    command,
  });

  const started = await startHermesAgentRun({
    config,
    input: buildHermesRunInput(envelope),
    instructions: buildHermesRunInstructions(),
    timeoutMs: Math.min(timeoutMs, 30000),
  });
  const eventStream = await readHermesAgentRunEvents({
    config,
    runId: started.run_id,
    timeoutMs,
  });

  return {
    probe,
    envelope,
    requestFile,
    responseFile,
    upstream_run: {
      run_id: started.run_id,
      session_id: started.session_id,
      terminal_event: eventStream.terminal_event,
      events: eventStream.events,
      output: eventStream.output,
      error: eventStream.error,
    },
    response: existsSync(responseFile) ? readJson(responseFile) : null,
  };
}
