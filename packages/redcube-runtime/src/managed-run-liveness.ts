import { loadHermesRun } from '@redcube/runtime-protocol';
import type {
  RuntimeManagedRunRecord,
  RuntimeManagedRuntimeLivenessAudit,
} from './types.js';

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueList(items: unknown): string[] {
  return [...new Set(safeArray(items).map((item) => safeText(item)).filter(Boolean))];
}

export function reconcileManagedRunLiveness({
  workspaceRoot,
  managedRun,
  buildRuntimeLivenessAudit,
}: {
  workspaceRoot: string;
  managedRun: RuntimeManagedRunRecord;
  buildRuntimeLivenessAudit: (input: {
    status: RuntimeManagedRuntimeLivenessAudit['status'];
    reasonCode: string;
  }) => RuntimeManagedRuntimeLivenessAudit;
}): RuntimeManagedRunRecord {
  if (managedRun.status === 'running' && safeText(managedRun.active_run_id)) {
    const activeRun = loadHermesRun({
      workspaceRoot,
      runId: managedRun.active_run_id,
    });
    if (activeRun.status === 'expired' || activeRun.status === 'orphaned') {
      managedRun.worker_running = false;
      managedRun.active_run_id = null;
      managedRun.current_blockers = uniqueList([
        ...safeArray(managedRun.current_blockers),
        `active route run ${activeRun.run_id} marked ${activeRun.status}`,
      ]);
      managedRun.runtime_liveness_audit = buildRuntimeLivenessAudit({
        status: 'none',
        reasonCode: `active_route_run_marked_${activeRun.status}`,
      });
      managedRun.runtime_health_status = 'escalated';
      managedRun.parking_reason_code = 'active_route_run_stale';
      managedRun.next_system_action = '检查 stale route run 后从明确阶段恢复。';
    }
  }
  if (managedRun.status === 'running' && managedRun.worker_running !== true && managedRun.runtime_health_status !== 'escalated') {
    managedRun.runtime_liveness_audit = buildRuntimeLivenessAudit({
      status: 'none',
      reasonCode: 'supervisor_tick_detected_non_live_runtime',
    });
    managedRun.runtime_health_status = 'degraded';
    managedRun.next_system_action = safeText(
      managedRun.next_system_action,
      '等待下一次 supervisor tick 或重新进入托管执行。',
    );
  }
  return managedRun;
}
