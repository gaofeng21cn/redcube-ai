// @ts-nocheck
import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_AGENT_ADAPTER,
  probeHermesAgentLoop,
} from '@redcube/runtime-protocol';
import { probeCodexCli, readCodexCliContract } from '@redcube/codex-cli-client';

import { safeText } from './managed-run-shared.js';

export function assertSupportedManagedAdapter(adapter) {
  const requestedAdapter = safeText(adapter);
  if (!requestedAdapter || requestedAdapter === CODEX_DEFAULT_ADAPTER) {
    return CODEX_DEFAULT_ADAPTER;
  }
  if (requestedAdapter === HERMES_AGENT_ADAPTER) {
    return HERMES_AGENT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
}

/**
 * @returns {Promise<Record<string, any>>}
 */
export async function probeRequestedRuntime(adapter, workspaceRoot): Promise<Record<string, any>> {
  if (safeText(adapter) === HERMES_AGENT_ADAPTER) {
    return probeHermesAgentLoop({ cwd: workspaceRoot });
  }

  const codexContract = readCodexCliContract();
  const codexReady = await probeCodexCli({
    contract: codexContract,
    cwd: workspaceRoot,
  });
  return {
    ...codexReady,
    contract: codexContract,
  };
}

/**
 * @returns {Record<string, any>}
 */
export function runtimeBridgeFromProbe(adapter, probeResult): Record<string, any> {
  if (safeText(adapter) === HERMES_AGENT_ADAPTER) {
    const contract = probeResult?.contract || {};
    return {
      owner: HERMES_AGENT_ADAPTER,
      adapter_surface: '@redcube/runtime-protocol',
      model_selection: contract.model_selection,
      reasoning_selection: contract.reasoning_selection,
      model: contract.model,
      provider: contract.provider,
      api_mode: contract.api_mode,
      reasoning_effort: contract.reasoning_effort,
      entrypoint: contract.entrypoint,
    };
  }

  const contract = probeResult?.contract || readCodexCliContract();
  return {
    owner: 'codex_cli',
    adapter_surface: '@redcube/codex-cli-client',
    model_selection: contract.model_selection,
    reasoning_selection: contract.reasoning_selection,
    sandbox: contract.sandbox,
  };
}
