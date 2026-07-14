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

test('package handoff prompt keeps the quality loop under the StageRun controller', () => {
  const prompt = fs.readFileSync(
    path.join(repoRoot, 'agent/prompts/package_and_handoff.md'),
    'utf8',
  );

  assert.doesNotMatch(prompt, /Run the focused formal quality loop/);
  assert.match(prompt, /controller-managed formal quality loop/);
  assert.match(prompt, /current executor call performs only its injected Attempt role/);
  assert.match(prompt, /must not run the whole sequence or create the next StageAttempt/);
  assert.match(prompt, /Only the OPL StageRunController creates each fresh role Attempt/);
  assert.match(prompt, /producer -> reviewer -> repairer -> re_reviewer/);
});

test('RCA capability map routes visual feedback fixtures through declarative professional skills', () => {
  const capabilityMap = readJson('contracts/capability_map.json');
  const handoff = readJson('contracts/agent_lab_handoff.json');
  const capabilities = new Map(
    capabilityMap.capabilities.map((entry) => [entry.capability_id, entry]),
  );

  assert.equal(handoff.agent_lab_owner, 'one-person-lab');
  assert.equal(handoff.authority_boundary.domain_repo_can_own_agent_lab_runtime, false);
  for (const token of handoff.visual_feedback_failure_fixture.tokens) {
    const mapping = capabilityMap.feedback_token_index[token];
    assert.ok(mapping, token);
    assert.notDeepEqual(mapping.canonical_capability_ids, [], token);
    for (const capabilityId of mapping.canonical_capability_ids) {
      const capability = capabilities.get(capabilityId);
      assert.ok(capability, `${token}:${capabilityId}`);
      assert.equal(capability.surface_role, 'professional_skill');
      assertCleanAgentRepoPathRef(
        capability.physical_source_ref,
        'agent/professional_skills/',
        `${token}:${capabilityId}`,
      );
    }
  }
});

test('RCA capability map dry-run tokens resolve without private runtime callers', () => {
  const capabilityMap = readJson('contracts/capability_map.json');
  const dryRun = capabilityMap.dry_run_token_mapping_check;

  assert.equal(dryRun.dry_run_only, true);
  assert.equal(dryRun.invokes_live_provider, false);
  assert.equal(dryRun.writes_runtime_state, false);
  for (const tokenCase of dryRun.token_cases) {
    assert.ok(capabilityMap.feedback_token_index[tokenCase.feedback_token], tokenCase.feedback_token);
    for (const skillRef of tokenCase.primary_skill_refs) {
      assertCleanAgentRepoPathRef(
        { ref_kind: 'repo_path', ref: skillRef },
        'agent/professional_skills/',
        `${tokenCase.feedback_token}:${skillRef}`,
      );
    }
  }
});
