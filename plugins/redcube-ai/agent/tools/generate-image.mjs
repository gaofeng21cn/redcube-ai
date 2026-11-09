const INPUT_FIELDS = new Set([
  'prompt', 'output_path', 'model', 'size', 'quality', 'background',
  'reference_image_paths', 'timeout_ms',
]);
const FAILURE_CODES = new Set([
  'invalid_image_request', 'image_provider_unavailable', 'image_provider_rejected',
  'image_generation_unknown', 'image_response_invalid', 'image_output_unavailable',
]);

function failure(failure_code, outcome = 'not_started') {
  return {
    surface_kind: 'rca_image_generation_failure',
    status: 'blocked',
    failure_code,
    outcome,
    retry_allowed: false,
  };
}

function validRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  if (Object.keys(input).some((key) => !INPUT_FIELDS.has(key))) return false;
  for (const key of ['prompt', 'output_path']) {
    if (typeof input[key] !== 'string' || !input[key].trim()) return false;
  }
  if (input.model !== undefined && input.model !== 'gpt-image-2') return false;
  for (const key of ['size', 'quality', 'background']) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || !input[key].trim())) return false;
  }
  if (input.timeout_ms !== undefined
      && (!Number.isSafeInteger(input.timeout_ms) || input.timeout_ms <= 0)) return false;
  return input.reference_image_paths === undefined || (
    Array.isArray(input.reference_image_paths)
    && input.reference_image_paths.every((value) => typeof value === 'string' && value.trim())
  );
}

export async function generateImage(input, loadRuntime = () => import('opl-framework/domain-task-runtime')) {
  if (!validRequest(input)) return failure('invalid_image_request');
  let runtime;
  try {
    runtime = await loadRuntime();
  } catch {
    return failure('framework_image_generation_unavailable');
  }
  if (typeof runtime.runDomainImageGeneration !== 'function') {
    return failure('framework_image_generation_unavailable');
  }
  try {
    const receipt = await runtime.runDomainImageGeneration({ ...input, model: 'gpt-image-2' });
    return {
      surface_kind: receipt.surface_kind,
      status: receipt.status,
      output_path: receipt.output_path,
      image_sha256: receipt.image_sha256,
      model: receipt.model,
      operation: receipt.operation,
      request_id: receipt.request_id ?? null,
    };
  } catch (error) {
    const outcome = error?.details?.outcome;
    const code = error?.details?.failure_code;
    return failure(FAILURE_CODES.has(code) ? code : 'image_generation_unknown',
      ['not_started', 'rejected', 'unknown'].includes(outcome) ? outcome : 'unknown');
  }
}

async function main() {
  let input;
  try {
    let json = '';
    for await (const chunk of process.stdin) json += chunk;
    input = JSON.parse(json);
  } catch {
    process.stdout.write(`${JSON.stringify(failure('invalid_image_request'))}\n`);
    process.exitCode = 1;
    return;
  }
  const result = await generateImage(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status !== 'completed') process.exitCode = 1;
}

if (import.meta.main) await main();
