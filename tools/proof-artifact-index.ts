import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';

type DirectoryArtifactEntry = {
  relative_path: string;
  bytes: number;
  sha256: string;
};

function buildDeveloperProofDirectoryIndex(root: string, excludePaths: string[]) {
  const excluded = new Set(excludePaths);
  const entries: DirectoryArtifactEntry[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
      if (excluded.has(relativePath)) continue;
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const bytes = fs.readFileSync(absolutePath);
      entries.push({
        relative_path: relativePath,
        bytes: bytes.byteLength,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      });
    }
  };
  visit(root);
  entries.sort((left, right) => left.relative_path.localeCompare(right.relative_path));
  return {
    surface_kind: 'rca_developer_proof_directory_index',
    status: 'developer_evidence_only',
    entries,
    authority_boundary: {
      index_can_write_visual_truth: false,
      index_can_authorize_review_or_export: false,
      index_can_sign_owner_receipt: false,
      index_can_claim_domain_ready: false,
    },
  };
}

const { values } = parseArgs({
  options: {
    profile: { type: 'string' },
    'output-dir': { type: 'string' },
    'index-file': { type: 'string' },
  },
});
const profile = values.profile;
const outputRoot = path.resolve(values['output-dir'] || '');
const indexFile = path.resolve(values['index-file'] || path.join(outputRoot, 'artifact-index.json'));
if (!['native-ppt', 'image-ppt'].includes(profile || '') || !values['output-dir']) {
  throw new Error('Usage: proof-artifact-index.ts --profile native-ppt|image-ppt --output-dir <dir> [--index-file <file>]');
}

const readJson = (file: string) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const relative = (file: string) => path.relative(outputRoot, path.resolve(file)).split(path.sep).join('/');
const mediaType = (file: string) => ({
  '.json': 'application/json', '.png': 'image/png', '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.md': 'text/markdown',
}[path.extname(file).toLowerCase()] || 'application/octet-stream');

const generic = buildDeveloperProofDirectoryIndex(outputRoot, [relative(indexFile)]);
const indexed = new Map(generic.entries.map((entry) => [entry.relative_path, entry]));
function artifact(artifactId: string, file: string, category: string, required = true, sourceRefPresent = true) {
  const relativePath = relative(file);
  const entry = indexed.get(relativePath);
  return {
    artifact_id: artifactId,
    relative_path: relativePath,
    media_type: mediaType(file),
    category,
    required,
    exists: Boolean(entry) && sourceRefPresent,
    ...(entry && sourceRefPresent ? { bytes: entry.bytes, sha256: entry.sha256 } : {}),
  };
}

function nativeIndex() {
  const helper = readJson(path.join(outputRoot, 'native-helper-output.json'));
  const summary = readJson(path.join(outputRoot, 'proof-summary.json'));
  const renderProof = helper.render_proof || {};
  const required = [
    ['doctor_json', 'doctor.json', 'runtime_doctor'],
    ['agent_package_manifest_json', 'agent-package-manifest.json', 'agent_package_contract'],
    ['native_helper_catalog_json', 'native-helper-catalog.json', 'native_helper_contract'],
    ['native_helper_input_json', 'native-helper-input.json', 'native_helper'],
    ['native_helper_output_json', 'native-helper-output.json', 'native_helper'],
    ['native_package_readback_json', 'native-package-readback.json', 'native_quality'],
    ['native_quality_verdict_json', 'native-quality-verdict.json', 'native_quality'],
    ['proof_summary_json', 'proof-summary.json', 'proof_summary'],
  ].map(([id, file, category]) => artifact(id, path.join(outputRoot, file), category));
  required.push(
    artifact('editable_pptx', helper.pptx_file || path.join(outputRoot, 'native-helper/benchmark-author.pptx'), 'native_render', true, Boolean(helper.pptx_file)),
    artifact('rendered_pdf', helper.pdf_file || path.join(outputRoot, 'native-helper/benchmark-author.pdf'), 'native_render', true, Boolean(helper.pdf_file)),
    artifact('shape_manifest_json', helper.shape_manifest_file || path.join(outputRoot, 'native-helper/benchmark-shape-manifest.json'), 'native_render', true, Boolean(helper.shape_manifest_file)),
  );
  const previews = Array.isArray(renderProof.preview_screenshots) ? renderProof.preview_screenshots.filter(Boolean) : [];
  for (let index = 0; index < 6; index += 1) {
    required.push(artifact(`preview_png_${String(index + 1).padStart(2, '0')}`, previews[index] || path.join(outputRoot, `native-helper/previews/slide-${String(index + 1).padStart(2, '0')}.png`), 'native_render', true, Boolean(previews[index])));
  }
  const summaryPreviews = Array.isArray(summary.native_helper?.preview_screenshots) ? summary.native_helper.preview_screenshots.map((value: string) => path.resolve(value)) : [];
  const declaredPreviews = previews.map((value: string) => path.resolve(value));
  const checks = {
    proof_summary_status: summary.status === 'passed',
    renderer_pipeline: summary.native_helper?.renderer_pipeline === 'libreoffice_headless_pdf_png_v1',
    native_helper_page_count: summary.native_helper?.page_count === 6,
    native_package_slide_count: summary.native_package_readback?.slide_count === 6,
    native_quality_verdict_status: summary.native_quality_verdict?.status === 'pass_candidate',
    preview_png_count: previews.length === 6,
    preview_png_unique: new Set(declaredPreviews).size === previews.length,
    preview_summary_binding: JSON.stringify(summaryPreviews) === JSON.stringify(declaredPreviews),
  };
  const missing = required.filter((entry) => entry.required && !entry.exists).map((entry) => entry.artifact_id);
  const failedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([id]) => id);
  return {
    schema_version: 'native_ppt_proof_artifact_index.v2', output_root: outputRoot,
    status: missing.length || failedChecks.length ? 'failed' : 'passed',
    missing_required_artifacts: missing, failed_required_checks: failedChecks,
    retention_contract: {
      required_artifact_ids: required.map((entry) => entry.artifact_id),
      preview_png_count: previews.length,
      preview_png_unique_count: new Set(declaredPreviews).size,
      summary_preview_png_count: summaryPreviews.length,
      preview_summary_bound: checks.preview_summary_binding,
      doctor_status: summary.doctor_status,
      proof_summary_status: summary.status,
      renderer_pipeline: summary.native_helper?.renderer_pipeline,
      native_helper_page_count: summary.native_helper?.page_count,
      native_package_slide_count: summary.native_package_readback?.slide_count,
      native_quality_verdict_status: summary.native_quality_verdict?.status,
    },
    artifacts: required,
    developer_proof_directory_index: generic,
  };
}

function imageIndex() {
  const imageManifest = readJson(path.join(outputRoot, 'image-manifest.json'));
  const styleManifest = readJson(path.join(outputRoot, 'style-manifest.json'));
  const summary = readJson(path.join(outputRoot, 'proof-summary.json'));
  const artifacts = [
    ['run_manifest_json', 'run-manifest.json', 'run_manifest'],
    ['prompt_manifest_json', 'prompt-manifest.json', 'prompt_manifest'],
    ['image_manifest_json', 'image-manifest.json', 'image_generation'],
    ['style_manifest_json', 'style-manifest.json', 'style_reference'],
    ['review_summary_json', 'review/review-summary.json', 'review'],
    ['proof_summary_json', 'proof-summary.json', 'proof_summary'],
  ].map(([id, file, category]) => artifact(id, path.join(outputRoot, file), category));
  (imageManifest.images || []).forEach((image: any, index: number) => artifacts.push(artifact(`generated_png_${String(index + 1).padStart(2, '0')}`, image.png_file, 'image_generation')));
  (styleManifest.style_references || []).forEach((reference: any, index: number) => {
    if (reference.artifact_copy) artifacts.push(artifact(`style_reference_png_${String(index + 1).padStart(2, '0')}`, path.join(outputRoot, reference.artifact_copy), 'style_reference'));
  });
  const delivery = summary.delivery_artifacts || {};
  for (const [id, key, category] of [
    ['image_first_pptx', 'pptx_file', 'final_delivery'], ['rendered_pdf', 'pdf_file', 'final_delivery'],
    ['export_bundle_json', 'export_bundle_file', 'export_bundle'], ['gallery_json', 'gallery_file', 'gallery'],
    ['gallery_final_manifest_json', 'gallery_final_manifest_file', 'gallery'],
    ['final_delivery_manifest_json', 'final_delivery_manifest_file', 'final_delivery'],
  ]) if (delivery[key]) artifacts.push(artifact(id, delivery[key], category));
  const missing = artifacts.filter((entry) => entry.required && !entry.exists).map((entry) => entry.artifact_id);
  return {
    schema_version: 'image_ppt_proof_artifact_index.v1', output_root: outputRoot,
    status: missing.length ? 'failed' : 'passed', missing_required_artifacts: missing,
    retention_contract: {
      required_artifact_ids: artifacts.map((entry) => entry.artifact_id),
      png_count: (imageManifest.images || []).length,
      style_reference_png_count: (styleManifest.style_references || []).length,
      image_generation_mode: summary.image_generation_mode,
      proof_summary_status: summary.status,
      artifact_categories: [...new Set(artifacts.map((entry) => entry.category))].sort(),
    },
    artifacts,
    developer_proof_directory_index: generic,
  };
}

const result = profile === 'native-ppt' ? nativeIndex() : imageIndex();
fs.mkdirSync(path.dirname(indexFile), { recursive: true });
fs.writeFileSync(indexFile, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'passed') process.exitCode = 1;
