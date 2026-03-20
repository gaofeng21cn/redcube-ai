export type WorkflowMode = 'full' | 'plan' | 'html';

export interface RunConfig {
  project: string;
  mode?: WorkflowMode;
  tasks?: string;
  fixPages?: string;
  autoFix?: boolean;
}

export interface EvaluationIssue {
  problemType: string;
  severity: 'critical' | 'moderate' | 'info';
  description: string;
  location: string;
}

export interface FixIterationResult {
  taskTitle: string;
  fixed: boolean;
  issuesBefore: EvaluationIssue[];
  issuesAfter: EvaluationIssue[];
}

export interface TaskState {
  index: number;
  taskTitle: string;
  status: 'success' | 'failed';
  folder: string;
  error?: string;
  steps: {
    planned: boolean;
    htmlGenerated: boolean;
    evaluated: boolean;
    fixed: boolean;
    published: boolean;
  };
}

export interface RunState {
  runId: string;
  projectName: string;
  mode: WorkflowMode;
  startedAt: string;
  finishedAt?: string;
  totalTasks: number;
  successTasks: number;
  outputDir: string;
  taskResults: TaskState[];
}

export interface PublishBundle {
  project: string;
  publishDir: string;
  publishedTasks: number;
  taskBundles: Array<{ taskFolder: string; path: string }>;
}

export interface ArtifactIndex {
  project: string;
  outputDir: string;
  taskFolders: string[];
}
