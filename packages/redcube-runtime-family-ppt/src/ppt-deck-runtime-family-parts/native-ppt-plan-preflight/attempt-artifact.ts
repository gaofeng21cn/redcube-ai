import path from 'node:path';

export function nativeAttemptArtifactFile(baseFile: string, attemptIndex: number, suffix: string): string {
  const extension = path.extname(baseFile);
  const stem = path.join(path.dirname(baseFile), path.basename(baseFile, extension));
  return `${stem}-attempt-${String(attemptIndex).padStart(2, '0')}${suffix}${extension || '.json'}`;
}
