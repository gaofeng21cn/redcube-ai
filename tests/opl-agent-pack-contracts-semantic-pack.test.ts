// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  assertCleanAgentRepoPathRef,
  readJson,
  repoRoot,
} from './helpers/opl-agent-pack-contracts.ts';

test('RCA canonical semantic pack remains concrete while root stage/pack contracts are refs-only', () => {
  const packRefs = readJson('contracts/pack_compiler_input.json');
  const stageRefs = readJson('contracts/stage_control_plane.json');

  assert.equal(packRefs.canonical_semantic_pack_root, 'agent/');
  assert.equal(packRefs.canonical_semantic_pack_role, 'repo_source_declarative_visual_pack');
  assert.equal(packRefs.projection_mode, 'repo_source_refs_only');
  assert.equal(stageRefs.surface_kind, 'rca_stage_control_refs');
  assert.equal(stageRefs.stage_descriptor_body_copied, false);

  for (const relativePath of packRefs.required_domain_pack_paths) {
    assert.equal(relativePath.startsWith('agent/'), true, relativePath);
    const fullPath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(fullPath), true, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.notEqual(content.trim(), '', relativePath);
    assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, relativePath);
  }

  assert.deepEqual(stageRefs.stage_ids, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  for (const stageId of stageRefs.stage_ids) {
    assertCleanAgentRepoPathRef(
      { ref_kind: 'repo_path', ref: `agent/prompts/${stageId}.md` },
      'agent/prompts/',
      `${stageId}.prompt_ref`,
    );
    assertCleanAgentRepoPathRef(
      { ref_kind: 'repo_path', ref: `agent/stages/${stageId}.md` },
      'agent/stages/',
      `${stageId}.stage_ref`,
    );
  }

  assert.equal(stageRefs.authority_boundary.opl_can_generate_stage_control_from_refs, true);
  assert.equal(stageRefs.authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(stageRefs.authority_boundary.provider_completion_is_visual_ready, false);
});
