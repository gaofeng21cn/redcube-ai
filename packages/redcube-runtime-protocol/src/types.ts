export interface WorkspaceContract {
  workspaceRoot: string;
  workspaceFile: string;
  topicsDir: string;
  runtimeDir: string;
  publishDir: string;
  overlaysDir: string;
}

export interface TopicPaths {
  topicId: string;
  topicDir: string;
  topicFile: string;
  inputsDir: string;
  canonicalDir: string;
  deliverablesDir: string;
  notesDir: string;
  runsDir: string;
}

export interface DeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  deliverableFile: string;
  artifactsDir: string;
  contractsDir: string;
  reportsDir: string;
  viewsDir: string;
}

export interface NotePaths {
  noteId: string;
  noteDir: string;
  noteFile: string;
  artifactsDir: string;
  reportsDir: string;
  viewsDir: string;
}

export interface SourceArtifactPaths {
  topicPaths: TopicPaths;
  sourceIndexFile: string;
  extractedMaterialsFile: string;
  sourceAuditFile: string;
  sourceBriefFile: string;
}

export interface CreateRunRecordInput {
  runId?: string;
  route?: string;
  scope?: string;
  target?: string;
  overlay?: string;
}

export interface RunRecord {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  error: unknown;
}
