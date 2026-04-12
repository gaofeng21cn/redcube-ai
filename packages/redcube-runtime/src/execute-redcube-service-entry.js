import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { executeDeliverableRouteLocally } from './deliverable-route-local.js';

function parseArgs(argv) {
  const args = new Map();
  for (let index = 2; index < argv.length; index += 2) {
    args.set(argv[index], argv[index + 1]);
  }
  return {
    requestFile: String(args.get('--request-file') || '').trim(),
    responseFile: String(args.get('--response-file') || '').trim(),
  };
}

export async function executeRedcubeServiceEntry(argv = process.argv) {
  const { requestFile, responseFile } = parseArgs(argv);
  if (!requestFile || !responseFile) {
    throw new Error('--request-file 与 --response-file 不能为空');
  }

  const payload = JSON.parse(readFileSync(requestFile, 'utf-8'));
  let response;

  try {
    if (payload?.entry_kind !== 'run_deliverable_route') {
      throw new Error(`Unsupported service entry kind: ${payload?.entry_kind || 'unknown'}`);
    }

    const result = await executeDeliverableRouteLocally(payload.request);
    response = {
      ok: true,
      entry_kind: payload.entry_kind,
      result,
    };
    writeFileSync(responseFile, JSON.stringify(response, null, 2), 'utf-8');
  } catch (error) {
    response = {
      ok: false,
      entry_kind: payload?.entry_kind || null,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code || null,
        requires_human_confirmation: error?.requiresHumanConfirmation === true,
        requires_external_secret: error?.requiresExternalSecret === true,
      },
    };
    writeFileSync(responseFile, JSON.stringify(response, null, 2), 'utf-8');
    throw error;
  }
}

export async function main(argv = process.argv) {
  await executeRedcubeServiceEntry(argv);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
