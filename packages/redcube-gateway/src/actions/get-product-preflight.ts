import path from 'node:path';
import { existsSync } from 'node:fs';

import { productEntrySessionDir } from '@redcube/runtime';
import {
  buildProductEntryPreflight,
  buildProgramCheck,
} from 'opl-gateway-shared/product-entry-program-companions';

import { doctorWorkspace } from './doctor-workspace.js';
import { buildRuntimeLoopClosureManifestSurface } from './product-entry-continuity-surfaces.js';

const MANAGED_RUNTIME_OWNER = 'upstream_hermes_agent';

type ProductPreflightRequest = Record<string, any>;

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name: string, value: unknown): string {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function normalizeWorkspaceRoot(request: ProductPreflightRequest): string {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
}

export async function getProductPreflight(request: ProductPreflightRequest) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const doctor = await doctorWorkspace({ workspaceRoot });
  const runtimeStateRoot = path.dirname(productEntrySessionDir());
  const workspaceRootExists = existsSync(doctor.workspaceRoot);
  const runtimeStateRootReady = existsSync(runtimeStateRoot);
  const checkCommand = `redcube workspace doctor --workspace-root ${doctor.workspaceRoot}`;
  const startCommand = `redcube product status --workspace-root ${doctor.workspaceRoot}`;
  const checks = [
    buildProgramCheck({
      check_id: 'workspace_root_resolved',
      title: 'Workspace Root Resolved',
      status: workspaceRootExists ? 'pass' : 'fail',
      blocking: true,
      summary: workspaceRootExists
        ? 'workspace root 已解析且目录存在。'
        : 'workspace root 已解析，但目标目录不存在。',
      command: checkCommand,
    }),
    buildProgramCheck({
      check_id: 'workspace_contract_present',
      title: 'Workspace Contract Present',
      status: doctor.workspaceFileExists ? 'pass' : 'fail',
      blocking: true,
      summary: doctor.workspaceFileExists
        ? 'workspace contract 已就位。'
        : 'workspace contract 仍缺失；请先 bootstrap workspace canonical surfaces。',
      command: checkCommand,
    }),
    buildProgramCheck({
      check_id: 'runtime_state_root_ready',
      title: 'Runtime State Root Ready',
      status: runtimeStateRootReady ? 'pass' : 'fail',
      blocking: true,
      summary: runtimeStateRootReady
        ? 'runtime state root 已就位。'
        : 'runtime state root 尚未就位。',
      command: checkCommand,
    }),
    buildProgramCheck({
      check_id: 'product_entry_overview_contract_landed',
      title: 'Product Entry Overview Contract Landed',
      status: 'pass',
      blocking: true,
      summary: 'direct RedCube product-entry overview contract 已 landed，可由 `status` 兼容命令 / manifest 直接消费。',
      command: startCommand,
    }),
  ];
  const hasBlockingChecks = checks.some((check) => check.blocking && check.status !== 'pass');
  const productEntryPreflight = buildProductEntryPreflight({
    summary: hasBlockingChecks
      ? 'Current product-entry preflight is blocked; fix the workspace or runtime-state setup before reading the RedCube product-entry overview.'
      : 'Current product-entry preflight passed; inspect the workspace doctor output and then read the RedCube product-entry overview via the `status` compatibility command.',
    recommended_check_command: checkCommand,
    recommended_start_command: startCommand,
    checks,
  });

  return {
    ok: true,
    target_domain_id: 'redcube_ai',
    workspace_locator: {
      workspace_surface_kind: 'redcube_workspace',
      workspace_root: doctor.workspaceRoot,
    },
    runtime_loop_closure: buildRuntimeLoopClosureManifestSurface({
      runtimeOwner: MANAGED_RUNTIME_OWNER,
      source: 'preflight',
      entryMode: 'preflight_projection',
    }),
    ...productEntryPreflight,
  };
}
