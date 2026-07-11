import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  assertCleanAgentRepoPathRef,
  readJson,
  repoRoot,
} from './helpers/opl-agent-pack-contracts.js';

test('RCA canonical semantic pack remains concrete while root stage/pack contracts are refs-only', () => {
  const packRefs = readJson('contracts/pack_compiler_input.json');
  const stageManifest = readJson('agent/stages/manifest.json');

  assert.equal(packRefs.canonical_semantic_pack_root, 'agent/');
  assert.equal(packRefs.canonical_semantic_pack_role, 'repo_source_declarative_visual_pack');
  assert.equal(packRefs.projection_mode, 'repo_source_refs_only');
  assert.equal(stageManifest.surface_kind, 'opl_standard_agent_declarative_stage_manifest');
  assert.equal(stageManifest.version, 'opl-standard-agent-declarative-stage-manifest.v1');

  for (const relativePath of packRefs.required_domain_pack_paths) {
    assert.equal(relativePath.startsWith('agent/'), true, relativePath);
    const fullPath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(fullPath), true, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.notEqual(content.trim(), '', relativePath);
    assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, relativePath);
  }

  assert.deepEqual(stageManifest.stages.map((stage) => stage.stage_id), [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  for (const stageId of stageManifest.stages.map((stage) => stage.stage_id)) {
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

  assert.equal(stageManifest.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(stageManifest.authority_boundary.provider_completion_is_domain_completion, false);
  assert.equal(packRefs.source_refs.stage_graph_source_ref, 'agent/stages/manifest.json');
});
