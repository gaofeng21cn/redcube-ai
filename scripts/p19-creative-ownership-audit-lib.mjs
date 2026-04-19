import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import {
  P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT,
  P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT,
  P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES,
  P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT,
  P19_TEAM_GATE_CONTRACT,
  buildCreativeOwnershipResidueAudit,
  resolveRuntimeStatePath,
} from '../packages/redcube-runtime/src/index.js';

export const AUDIT_FILE = resolveRuntimeStatePath('reports', 'redcube-runtime-program', 'P19_CREATIVE_OWNERSHIP_AUDIT.json');
export const STATUS_FILE = resolveRuntimeStatePath('reports', 'redcube-runtime-program', 'P19_CREATIVE_OWNERSHIP_STATUS.json');

function mapFindings(familyAudit) {
  return familyAudit.violations
    .filter((violation) => violation.status === 'present')
    .map((violation) => ({
      file: violation.file,
      protected_output: violation.protected_surface,
      residue_kind: violation.stage,
      evidence_patterns: violation.evidence_patterns,
      summary: violation.why_blocked,
    }));
}

function hasEntries(value) {
  return Array.isArray(value) && value.length > 0;
}

function collectLaneWriteScopeOverlaps(lanes) {
  const seen = new Map();
  const overlaps = [];

  for (const lane of lanes) {
    for (const scope of lane.write_scopes || []) {
      if (seen.has(scope)) {
        overlaps.push({
          scope,
          lanes: [seen.get(scope), lane.lane_id],
        });
        continue;
      }
      seen.set(scope, lane.lane_id);
    }
  }

  return overlaps;
}

function buildTeamLaneContract() {
  const lanes = P19_TEAM_GATE_CONTRACT.candidate_lanes;
  return {
    tracking_model: P19_TEAM_GATE_CONTRACT.tracking_model,
    lanes,
    overlapping_write_scopes: collectLaneWriteScopeOverlaps(lanes),
    final_convergence_order: P19_TEAM_GATE_CONTRACT.final_convergence_order,
  };
}

function buildTeamGate() {
  const laneContract = buildTeamLaneContract();
  const laneIds = new Set(P19_TEAM_GATE_CONTRACT.candidate_lanes.map((lane) => lane.lane_id));
  const convergenceOrder = P19_TEAM_GATE_CONTRACT.final_convergence_order || [];

  const gate = {
    shared_contract_frozen: hasEntries(P19_TEAM_GATE_CONTRACT.frozen_contracts?.shared_contract),
    shared_lifecycle_contract_frozen: hasEntries(P19_TEAM_GATE_CONTRACT.frozen_contracts?.shared_lifecycle_contract),
    research_ownership_frozen: hasEntries(P19_TEAM_GATE_CONTRACT.frozen_contracts?.research_ownership),
    lifecycle_alignment_red_tests_written: hasEntries(P19_TEAM_GATE_CONTRACT.lifecycle_alignment_red_tests),
    ppt_visual_director_review_contract_frozen: hasEntries(P19_TEAM_GATE_CONTRACT.frozen_contracts?.ppt_visual_director_review_contract),
    lane_write_scopes_by_shared_lifecycle: hasEntries(P19_TEAM_GATE_CONTRACT.candidate_lanes)
      && P19_TEAM_GATE_CONTRACT.candidate_lanes.every((lane) => hasEntries(lane.lifecycle_focus) && hasEntries(lane.write_scopes))
      && laneContract.overlapping_write_scopes.length === 0,
    independent_verification_defined: hasEntries(P19_TEAM_GATE_CONTRACT.candidate_lanes)
      && P19_TEAM_GATE_CONTRACT.candidate_lanes.every((lane) => hasEntries(lane.verification_commands)),
    final_convergence_order_defined: convergenceOrder.length === laneIds.size
      && convergenceOrder.every((laneId) => laneIds.has(laneId)),
  };

  return {
    ...gate,
    missing_gates: P19_TEAM_GATE_CONTRACT.required_gates.filter((key) => gate[key] !== true),
  };
}

/**
 * @returns {import('../packages/redcube-runtime/src/types.js').RuntimeCreativeOwnershipCloseoutAudit}
 */
export function buildCreativeOwnershipAudit() {
  const residueAudit = buildCreativeOwnershipResidueAudit();

  return {
    milestone: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.current_milestone,
    phase: 'shared_execution_and_audit_closeout',
    completed_milestones: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.completed_milestones,
    closeout_ready: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.closeout_ready,
    execution_model: {
      mainline_adapter: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.adapter,
      primary_surface: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.runtime,
      adapter_role: 'primary_creative_executor',
      proof_executor: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.proof_executor.adapter,
      freeze_origin_milestone: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.milestone,
    },
    unified_lifecycle: {
      stages: P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.macro_lifecycle,
      family_mapping: P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.family_mapping,
    },
    research_ownership: {
      positioning: 'shared_source_readiness_optional_augmentation',
      trigger_conditions: P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.research_ownership.trigger_conditions,
    },
    review_overlay: {
      shared_layers: P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT.review_overlay,
      xiaohongshu: {
        status: 'active',
      },
      ppt_deck: {
        status: residueAudit.review_overlay.ppt_deck.status,
      },
    },
    creative_ownership_boundary: {
      code_allowed_responsibilities: P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES.allowed_code_responsibilities,
      code_forbidden_outputs: Array.from(new Set([
        ...P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES.forbidden_code_authorship.xiaohongshu,
        ...P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES.forbidden_code_authorship.ppt_deck,
      ])),
    },
    residue: {
      xiaohongshu: {
        status: residueAudit.families.xiaohongshu.status === 'cleared' ? 'cleared' : 'open',
        findings: mapFindings(residueAudit.families.xiaohongshu),
      },
      ppt_deck: {
        status: residueAudit.families.ppt_deck.status === 'cleared' ? 'cleared' : 'open',
        findings: mapFindings(residueAudit.families.ppt_deck),
      },
    },
    closeout_scope: P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT.closeout_scope,
    team_lane_contract: buildTeamLaneContract(),
    team_gate: buildTeamGate(),
  };
}

export function writeAuditFile(audit) {
  mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  writeFileSync(AUDIT_FILE, `${JSON.stringify(audit, null, 2)}\n`, 'utf-8');
}

/**
 * @param {{ currentMode?: string }} [options]
 * @returns {import('../packages/redcube-runtime/src/types.js').RuntimeCreativeOwnershipProgramStatus}
 */
export function buildCreativeOwnershipStatus({ currentMode = 'ralph' } = {}) {
  const residueAudit = buildCreativeOwnershipResidueAudit();
  const closeout = buildCreativeOwnershipAudit();

  return {
    program: 'P19',
    current_milestone: closeout.milestone,
    completed_milestones: closeout.completed_milestones,
    closeout_ready: closeout.closeout_ready,
    current_mode: currentMode,
    macro_lifecycle_stage: residueAudit.macro_lifecycle_stage,
    shared_execution_contract: residueAudit.shared_execution_contract,
    unified_lifecycle: residueAudit.unified_lifecycle,
    residue_by_family: residueAudit.families,
    shared_closeout: closeout.closeout_scope,
    team_lane_contract: closeout.team_lane_contract,
    team_gate: {
      satisfied: closeout.team_gate.missing_gates.length === 0,
      missing_gates: closeout.team_gate.missing_gates,
    },
  };
}

export function writeStatusFile(status) {
  mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
  writeFileSync(STATUS_FILE, `${JSON.stringify(status, null, 2)}\n`, 'utf-8');
}
