import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import {
  P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT,
  P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES,
  P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT,
  buildCreativeOwnershipResidueAudit,
} from '../packages/redcube-runtime/src/index.js';

export const AUDIT_FILE = path.resolve('.omx/reports/redcube-runtime-program/P19_CREATIVE_OWNERSHIP_AUDIT.json');

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

function buildTeamGate() {
  return {
    shared_contract_frozen: true,
    shared_lifecycle_contract_frozen: true,
    research_ownership_frozen: true,
    lifecycle_alignment_red_tests_written: true,
    ppt_visual_director_review_contract_frozen: true,
    lane_write_scopes_by_shared_lifecycle: false,
    independent_verification_defined: true,
    final_convergence_order_defined: true,
    missing_gates: [
      'lane_write_scopes_by_shared_lifecycle',
    ],
  };
}

/**
 * @returns {import('../packages/redcube-runtime/src/types.js').RuntimeCreativeOwnershipCloseoutAudit}
 */
export function buildCreativeOwnershipAudit() {
  const residueAudit = buildCreativeOwnershipResidueAudit();

  return {
    milestone: 'P19.A',
    phase: 'freeze_execution_model_and_shared_lifecycle',
    execution_model: {
      mainline_adapter: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.adapter,
      primary_surface: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.primary_executor.runtime,
      adapter_role: 'primary_creative_executor',
      agent_first_requires_external_llm: false,
      external_llm_role: P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT.adapter_roles.external_llm,
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
    team_gate: buildTeamGate(),
  };
}

export function writeAuditFile(audit) {
  mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  writeFileSync(AUDIT_FILE, `${JSON.stringify(audit, null, 2)}\n`, 'utf-8');
}
