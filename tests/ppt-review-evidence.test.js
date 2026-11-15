import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

const python = resolveRedCubePythonCommand();
function scenario(code) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rca-evidence-'));
  try {
    const result = spawnSync(python.command, [...python.args, '-c', `
import hashlib,json,sys
from pathlib import Path
from PIL import Image
from redcube_ai.native_helpers.ppt_deck.review_evidence import collect_evidence
root=Path(sys.argv[1]).resolve()
# Test-only pixels exercise decoding/identity, never visual-quality evidence.
Image.new('RGB',(160,90),'white').save(root/'first.png')
Image.new('RGB',(160,90),'grey').save(root/'repair.png')
sha=lambda n:hashlib.sha256((root/n).read_bytes()).hexdigest()
gen=lambda n,phase:{'image_ref':n,'sha256':sha(n),'phase':phase,'attempt_id':phase,'model':'test-only','elapsed_seconds':10}
review={'image_sha256':sha('first.png'),'reviewer_ref':'test-observation','content':'pass','facts':'pass','style':'fail','readability':'pass'}
page={'slide_id':'pivot','source_page_ids':['a','b'],'generations':[gen('first.png','initial'),gen('repair.png','repair')],'first_review':review,'selected_image_sha256':sha('repair.png')}
m={'schema_version':'rca.ppt-review-evidence.v1','evidence_kind':'rendered_images','pages':[page]}
${code}
`, root], { encoding: 'utf8', env: { ...process.env, PYTHONPATH: path.resolve('python'), PYTHONDONTWRITEBYTECODE: '1' } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return result.stdout.trim() ? JSON.parse(result.stdout) : null;
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('real-file measurements retain first failure, unknown cost and refinement separately', () => {
  const report = scenario(`print(json.dumps(collect_evidence(m,root)))`);
  const x = report.metrics.candidate;
  assert.equal(x.generation_calls, 2);
  assert.equal(x.first_images_usable, 0);
  assert.equal(x.first_attempt_failure_counts.style, 1);
  assert.equal(x.calls_per_selected_page, 2);
  assert.equal(x.sum_generation_elapsed_seconds, 20);
  assert.equal(x.known_cost_usd, null);
  assert.equal(x.uncosted_generation_count, 2);
  assert.equal(report.bound_pages[0].images.length, 2);
  assert.equal(report.bound_pages[0].images[0].image_ref, 'first.png');
  assert.equal(report.bound_pages[0].first_review.style, 'fail');
  assert.equal(report.bound_pages[0].first_review.image_sha256, report.bound_pages[0].images[0].sha256);
  assert.equal(report.bound_pages[0].selected_image_sha256, report.bound_pages[0].images[1].sha256);
  assert.match(report.revision, /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(report, 'visual_ready'), false);
});

test('reopening preserves the reviewed bytes and human observations without writing the manifest', () => {
  const report = scenario(`
before=json.dumps(m,sort_keys=True)
first=collect_evidence(m,root)
reopened=collect_evidence(m,root,first['revision'])
assert first==reopened
assert json.dumps(m,sort_keys=True)==before
print(json.dumps(reopened))`);
  assert.equal(report.bound_pages[0].first_review.reviewer_ref, 'test-observation');
  assert.equal(report.bound_pages[0].selected_image_sha256, report.bound_pages[0].images[1].sha256);
});

test('review and selection changes require a fresh evidence revision before continuation', () => scenario(`
first=collect_evidence(m,root)
page['selected_image_sha256']=sha('first.png')
review['style']='pass'
try:
 collect_evidence(m,root,first['revision'])
except ValueError as error:
 assert 'changed' in str(error)
else:
 raise AssertionError('Stale review selection was accepted')
current=collect_evidence(m,root)
assert current['revision']!=first['revision']
assert current['bound_pages'][0]['selected_image_sha256']==sha('first.png')
assert current['bound_pages'][0]['first_review']['style']=='pass'
`));

test('unselected and unreviewed candidates remain explicit in the review projection', () => {
  const report = scenario(`del page['selected_image_sha256']; del page['first_review']; print(json.dumps(collect_evidence(m,root)))`);
  assert.equal(report.bound_pages[0].selected_image_sha256, null);
  assert.equal(report.bound_pages[0].first_review, null);
});

test('selection by image hash does not invent a unique attempt when generation bytes match', () => {
  const report = scenario(`
(root/'repair.png').write_bytes((root/'first.png').read_bytes())
page['generations'][1]['sha256']=sha('repair.png')
page['selected_image_sha256']=sha('repair.png')
print(json.dumps(collect_evidence(m,root)))`);
  const page = report.bound_pages[0];
  assert.equal(page.images.filter((image) => image.sha256 === page.selected_image_sha256).length, 2);
  assert.deepEqual(page.images.map((image) => image.attempt_id), ['initial', 'repair']);
});

test('unassessed dimensions never become a first-attempt pass', () => {
  const report = scenario(`review['facts']='unassessed'; print(json.dumps(collect_evidence(m,root)))`);
  assert.equal(report.metrics.candidate.first_images_fully_assessed, 0);
  assert.equal(report.metrics.candidate.first_attempt_usable_fraction, null);
});

test('selected attempt retains its actual prompt, shared style and scoped image inputs', () => {
  const report = scenario(`
(root/'submitted.txt').write_text('Actual selected request')
(root/'shared.txt').write_text('Accepted shared craft')
page['generations'][1]['request']={'prompt_ref':'submitted.txt','prompt_sha256':sha('submitted.txt'),
 'shared_style_ref':'shared.txt','shared_style_sha256':sha('shared.txt'),
 'style_profile_id':'test-profile','style_revision':'r1','input_images':[{
 'image_ref':'first.png','sha256':sha('first.png'),'role':'style',
 'allowed_borrowing':['lettering','light'],'excluded_borrowing':['scenery','layout']}]}
page['selected_attempt_id']='repair'
print(json.dumps(collect_evidence(m,root)))`);
  const selected = report.bound_pages[0].selected_generation;
  assert.equal(selected.attempt_id, 'repair');
  assert.equal(selected.request.prompt_ref, 'submitted.txt');
  assert.deepEqual(selected.request.input_images[0].excluded_borrowing, ['scenery', 'layout']);
  assert.equal(report.bound_pages[0].first_review.style, 'fail');
});

test('a later prompt edit cannot replace the selected generation request', () => scenario(`
(root/'submitted.txt').write_text('Original request')
page['generations'][1]['request']={'prompt_ref':'submitted.txt','prompt_sha256':sha('submitted.txt')}
(root/'submitted.txt').write_text('Later experiment')
try:
 collect_evidence(m,root)
except ValueError as error:
 assert 'request text hash mismatch' in str(error)
else:
 raise AssertionError('Edited prompt was promoted to the selected request')`));

test('explicit selected attempt cannot be substituted by a different image attempt', () => scenario(`
page['selected_attempt_id']='initial'
try:
 collect_evidence(m,root)
except ValueError as error:
 assert 'Selected attempt' in str(error)
else:
 raise AssertionError('Wrong selected attempt was accepted')`));

for (const [name, mutation] of [
  ['tampered image', "(root/'first.png').write_bytes((root/'repair.png').read_bytes())"],
  ['final review substituted for first', "review['image_sha256']=sha('repair.png')"],
  ['placeholder evidence', "m['evidence_kind']='placeholder_manifest_hash'"],
  ['outside asset root', "page['generations'][0]['image_ref']='../first.png'"],
  ['duplicate first phase', "page['generations'][1]['phase']='initial'"],
  ['invalid cost', "page['generations'][0]['cost_usd']=-1"],
  ['invalid mapping', "page['source_page_ids']='ab'"],
  ['variant source drift', "other=dict(page,variant='baseline',source_page_ids=['different']);m['pages'].append(other)"],
]) {
  test(`rejects ${name}`, () => scenario(`${mutation}
try:
 collect_evidence(m,root)
except ValueError:
 pass
else:
 raise AssertionError('Invalid evidence was accepted')`));
}
