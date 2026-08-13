import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve('.');
const inputSchema = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'contracts/schemas/rca-stage-action.input.schema.json'),
  'utf8',
));
const actionCatalog = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'contracts/action_catalog.json'),
  'utf8',
));
const sourceIntakePrompt = fs.readFileSync(
  path.join(repoRoot, 'agent/prompts/source_intake.md'),
  'utf8',
);
const sourceIntakeStage = fs.readFileSync(
  path.join(repoRoot, 'agent/stages/source_intake.md'),
  'utf8',
);

const validRefs = {
  manifest_ref: 'opl-source-manifest:run-001',
  readiness_ref: 'opl-source-readiness:run-001',
  source_package_digest_ref: 'sha256:0123456789abcdef',
};

function validateInput(value) {
  assert.equal(typeof value, 'object');
  assert.equal(value !== null, true);
  assert.equal(Array.isArray(value), false);
  assert.equal(typeof value.workspace_root, 'string');
  assert.equal(value.workspace_root.length > 0, true);
  assert.match(value.workspace_root, /^\//);

  const topLevelKeys = new Set(['workspace_root', 'source_truth_refs']);
  for (const key of Object.keys(value)) {
    assert.equal(topLevelKeys.has(key), true, `unexpected input field: ${key}`);
  }

  if (value.source_truth_refs === undefined) return;
  assert.equal(typeof value.source_truth_refs, 'object');
  assert.equal(value.source_truth_refs !== null, true);
  assert.equal(Array.isArray(value.source_truth_refs), false);
  for (const key of ['manifest_ref', 'readiness_ref', 'source_package_digest_ref']) {
    assert.equal(typeof value.source_truth_refs[key], 'string', `missing or invalid ${key}`);
    assert.equal(value.source_truth_refs[key].length > 0, true, `${key} must be non-empty`);
  }
  for (const key of Object.keys(value.source_truth_refs)) {
    assert.equal(
      ['manifest_ref', 'readiness_ref', 'source_package_digest_ref'].includes(key),
      true,
      `unexpected source truth field: ${key}`,
    );
  }
}

function assertRejected(value, message) {
  assert.throws(() => validateInput(value), /.+/, message);
}

test('RCA stage action accepts absent or complete refs-only source truth input', () => {
  assert.deepEqual(inputSchema.required, ['workspace_root']);
  assert.equal(inputSchema.additionalProperties, false);
  assert.deepEqual(Object.keys(inputSchema.properties), ['workspace_root', 'source_truth_refs']);
  assert.deepEqual(inputSchema.properties.source_truth_refs.required, [
    'manifest_ref',
    'readiness_ref',
    'source_package_digest_ref',
  ]);
  assert.deepEqual(Object.keys(inputSchema.properties.source_truth_refs.properties), [
    'manifest_ref',
    'readiness_ref',
    'source_package_digest_ref',
  ]);
  assert.equal(inputSchema.properties.source_truth_refs.additionalProperties, false);
  assert.equal(inputSchema.properties.source_truth_refs.properties.source_package_digest_ref.type, 'string');
  validateInput({ workspace_root: '/tmp/redcube-workspace' });
  validateInput({
    workspace_root: '/tmp/redcube-workspace',
    source_truth_refs: validRefs,
  });
});

test('RCA stage action rejects incomplete or body-bearing source truth input', () => {
  assertRejected({
    workspace_root: '/tmp/redcube-workspace',
    source_truth_refs: {
      manifest_ref: validRefs.manifest_ref,
      readiness_ref: validRefs.readiness_ref,
    },
  }, 'digest ref is required');
  assertRejected({
    workspace_root: '/tmp/redcube-workspace',
    source_truth_refs: {
      ...validRefs,
      source_materials_full_text: 'source body must stay out of refs-only input',
    },
  }, 'source bodies are forbidden');
  assertRejected({
    workspace_root: '/tmp/redcube-workspace',
    source_truth_refs: {
      ...validRefs,
      digest: validRefs.source_package_digest_ref,
    },
  }, 'unknown digest alias is forbidden');
});

test('all hosted RCA actions expose the same optional refs-only contract', () => {
  assert.deepEqual(
    actionCatalog.actions.map((action) => action.required_fields),
    actionCatalog.actions.map(() => ['workspace_root']),
  );
  for (const action of actionCatalog.actions) {
    assert.deepEqual(action.optional_fields, ['source_truth_refs'], action.action_id);
  }
});

test('source_intake keeps semantic readiness in RCA and transport currentness in OPL', () => {
  assert.match(sourceIntakePrompt, /source_truth_refs/);
  assert.match(sourceIntakePrompt, /manifest_ref/);
  assert.match(sourceIntakePrompt, /readiness_ref/);
  assert.match(sourceIntakePrompt, /source_package_digest_ref/);
  assert.match(sourceIntakePrompt, /digest is a locator\/currentness hint, not a content or readiness verdict/);
  assert.match(sourceIntakePrompt, /OPL owns locator scope, immutable byte identity, currentness, session\/StageRun binding/);
  assert.match(sourceIntakePrompt, /does not rescan or rehash an already accepted package/);
  assert.match(sourceIntakeStage, /OPL remains responsible for byte\/currentness validation/);
  assert.match(sourceIntakeStage, /duplicate workspace discovery or hashing/);
});
