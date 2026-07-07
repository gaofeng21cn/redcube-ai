import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';

import type {
  DeliverablePaths,
  NotePaths,
  TopicPaths,
  WorkspaceContract,
  WorkspaceGitBoundary,
} from './types.js';

const WORKSPACE_GITIGNORE_ENTRIES = [
  '.DS_Store',
  'node_modules/',
  '.redcube/cache/',
  '.redcube/tmp/',
  'runtime/',
  '*.log',
  '*.pid',
  '*.sock',
];

export const WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY = Object.freeze({
  surface_kind: 'workspace_locator_envelope_boundary',
  boundary_contract_id: 'rca.workspace_locator_envelope_refs_only.v1',
  owner: 'redcube_ai',
  consumer: 'opl',
  role: 'workspace_locator_envelope_refs_only_adapter',
  classification: 'refs_only_read_model',
  refs_only: true,
  active_caller_status: 'domain_handler_and_opl_generated_source_shell_locator_refs',
  owns_generic_workspace_shell: false,
  owns_generic_attempt_ledger: false,
  owns_generic_session_runtime: false,
  owns_generic_artifact_lifecycle: false,
  writes_visual_truth: false,
  writes_artifact_blob: false,
  writes_memory_body: false,
  compatibility_alias_allowed: false,
  no_resurrection_gate: {
    generic_workspace_shell_owner_allowed: false,
    generic_runtime_owner_allowed: false,
    generic_gateway_owner_allowed: false,
  },
  exports_only: [
    'workspace_locator_refs',
    'topic_locator_refs',
    'deliverable_locator_refs',
    'note_locator_refs',
  ],
});

interface SegmentOptions {
  disallowParent?: boolean;
  disallowSeparator?: boolean;
}

function requireSegment(name: string, value: unknown, options: SegmentOptions = {}): string {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }

  if (options.disallowParent && text.includes('..')) {
    throw new Error(`${name} 不能包含父目录引用`);
  }

  if (options.disallowSeparator && /[\\/]/.test(text)) {
    throw new Error(`${name} 不能包含路径分隔符`);
  }

  return text;
}

function programIdForWorkspaceRoot(workspaceRoot: string): string {
  const root = path.resolve(requireSegment('workspaceRoot', workspaceRoot));
  const hash = createHash('sha256').update(root).digest('hex').slice(0, 16);
  return `workspace-${hash}`;
}

export function resolveWorkspaceContract({ workspaceRoot }: { workspaceRoot: string }): WorkspaceContract {
  const root = path.resolve(requireSegment('workspaceRoot', workspaceRoot));
  return {
    workspaceRoot: root,
    workspaceFile: path.join(root, 'redcube.workspace.json'),
    topicsDir: path.join(root, 'topics'),
    runtimeDir: path.join(root, 'runtime'),
    publishDir: path.join(root, 'publish'),
    overlaysDir: path.join(root, 'overlays'),
  };
}

export function renderWorkspaceGitignore() {
  return [
    '# RedCube AI workspace-local Git boundary.',
    '# Runtime state is local execution state; topics and deliverable truth stay visible to Git.',
    ...WORKSPACE_GITIGNORE_ENTRIES,
    '',
  ].join('\n');
}

function mergeWorkspaceGitignore(existingContent: string): string {
  const existingLines = new Set(String(existingContent || '').split(/\r?\n/));
  const missingEntries = WORKSPACE_GITIGNORE_ENTRIES.filter((entry) => !existingLines.has(entry));
  if (missingEntries.length === 0) {
    return existingContent;
  }
  const base = String(existingContent || '').trimEnd();
  const separator = base ? '\n\n' : '';
  return `${base}${separator}${missingEntries.join('\n')}\n`;
}

function writeWorkspaceGitignore(gitignoreFile: string): string {
  if (!existsSync(gitignoreFile)) {
    writeFileSync(gitignoreFile, renderWorkspaceGitignore(), 'utf-8');
    return gitignoreFile;
  }
  const previousContent = readFileSync(gitignoreFile, 'utf-8');
  const nextContent = mergeWorkspaceGitignore(previousContent);
  if (nextContent !== previousContent) {
    writeFileSync(gitignoreFile, nextContent, 'utf-8');
  }
  return gitignoreFile;
}

function runGit(workspaceRoot: string, args: string[], action: string): SpawnSyncReturns<string> {
  const result = spawnSync('git', args, {
    cwd: workspaceRoot,
    encoding: 'utf-8',
  });
  if (result.error) {
    throw new Error(`${action} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${action} failed: ${String(result.stderr || result.stdout || '').trim()}`);
  }
  return result;
}

export function ensureWorkspaceGitBoundary({ workspaceRoot }: { workspaceRoot: string }): WorkspaceGitBoundary {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  mkdirSync(contract.workspaceRoot, { recursive: true });
  const gitignoreFile = path.join(contract.workspaceRoot, '.gitignore');
  writeWorkspaceGitignore(gitignoreFile);

  const gitDir = path.join(contract.workspaceRoot, '.git');
  const alreadyInitialized = existsSync(gitDir);
  if (!alreadyInitialized) {
    runGit(contract.workspaceRoot, ['init'], 'git init');
  }
  runGit(contract.workspaceRoot, ['branch', '-M', 'main'], 'git branch -M main');
  runGit(contract.workspaceRoot, ['config', 'worktree.useRelativePaths', 'true'], 'git config worktree.useRelativePaths');

  return {
    initialized: !alreadyInitialized,
    already_initialized: alreadyInitialized,
    git_dir: gitDir,
    gitignore_path: gitignoreFile,
  };
}

export function getTopicPaths(workspaceRoot: string, topicId: string): TopicPaths {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const topic = requireSegment('topicId', topicId, {
    disallowParent: true,
    disallowSeparator: true,
  });
  const topicDir = path.join(contract.topicsDir, topic);
  return {
    topicId: topic,
    topicDir,
    topicFile: path.join(topicDir, 'topic.json'),
    inputsDir: path.join(topicDir, 'inputs'),
    canonicalDir: path.join(topicDir, 'canonical'),
    deliverablesDir: path.join(topicDir, 'deliverables'),
    notesDir: path.join(topicDir, 'notes'),
    runsDir: path.join(topicDir, 'runs'),
  };
}

export function getDeliverablePaths(
  workspaceRoot: string,
  topicId: string,
  deliverableId: string,
): DeliverablePaths {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  const deliverable = requireSegment('deliverableId', deliverableId, {
    disallowParent: true,
    disallowSeparator: true,
  });
  const deliverableDir = path.join(topicPaths.deliverablesDir, deliverable);
  return {
    programId: programIdForWorkspaceRoot(workspaceRoot),
    topicId: topicPaths.topicId,
    deliverableId: deliverable,
    deliverableDir,
    deliverableFile: path.join(deliverableDir, 'deliverable.json'),
    artifactsDir: path.join(deliverableDir, 'artifacts'),
    contractsDir: path.join(deliverableDir, 'contracts'),
    reportsDir: path.join(deliverableDir, 'reports'),
    viewsDir: path.join(deliverableDir, 'views'),
  };
}

export function readHydratedDeliverableContract({
  workspaceRoot,
  topicId,
  deliverableId,
}: {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
}): unknown {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(
    deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json',
  ).trim();
  return JSON.parse(readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'));
}

export function getNotePaths(workspaceRoot: string, topicId: string, noteId: string): NotePaths {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  const note = requireSegment('noteId', noteId, {
    disallowParent: true,
    disallowSeparator: true,
  });
  const noteDir = path.join(topicPaths.notesDir, note);
  return {
    noteId: note,
    noteDir,
    noteFile: path.join(noteDir, 'note.json'),
    artifactsDir: path.join(noteDir, 'artifacts'),
    reportsDir: path.join(noteDir, 'reports'),
    viewsDir: path.join(noteDir, 'views'),
  };
}
