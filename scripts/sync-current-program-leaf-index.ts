import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export {
  buildCurrentProgramLeafIndex,
} from './current-program/leaf-index.ts';
export {
  buildCurrentProgramPackBundleManifest,
  buildCurrentProgramSourceIndex,
  checkCurrentProgramLeafIndex,
  syncCurrentProgramLeafIndex,
} from './current-program/aggregate-rebuild.ts';

import {
  assertGeneratedManifestMatchesSourceParts,
  checkCurrentProgramLeafIndex,
  syncCurrentProgramLeafIndex,
} from './current-program/aggregate-rebuild.ts';

function runCli() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--check')) {
    assertGeneratedManifestMatchesSourceParts();
    const result = checkCurrentProgramLeafIndex();
    if (!result.ok) {
      for (const mismatch of result.mismatches) {
        console.error(mismatch);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`current-program pack bundle is in sync: ${result.source_part_ref_count} source part refs`);
    return;
  }

  const result = syncCurrentProgramLeafIndex();
  console.log(`synced current-program pack bundle: ${result.source_part_ref_count} source part refs`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
