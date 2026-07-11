import { execFileSync } from 'node:child_process';

export function trackedProductJavaScript(files: readonly string[]): string[] {
  return files.filter((file) => (
    /^(?:apps|packages)\//.test(file)
    && /\.(?:js|mjs|cjs)$/.test(file)
    && !file.includes('/dist/')
  ));
}

export function assertNoTrackedProductJavaScript(files: readonly string[]): void {
  const violations = trackedProductJavaScript(files);
  if (violations.length > 0) {
    throw new Error(`Repo-tracked product JavaScript is forbidden:\n${violations.join('\n')}`);
  }
}

export function main(): void {
  const files = execFileSync('git', ['ls-files', 'apps', 'packages'], { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);
  assertNoTrackedProductJavaScript(files);
  console.log('TypeScript source gate passed.');
}

if (import.meta.main) main();
