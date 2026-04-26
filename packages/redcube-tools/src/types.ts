export type RedcubeNoteMode = 'auto' | 'single' | 'series';

export interface RedcubeProjectPaths {
  projectDir: string;
  inputsDir: string;
  rawMaterialsDir: string;
  outputsDir: string;
  publishDir: string;
  seriesTocFile: string;
  styleGuideFile: string;
  storylineFile: string;
}

export interface RedcubeProjectStructureResult {
  ok: boolean;
  error?: string;
  project?: string;
  paths?: RedcubeProjectPaths;
  message?: string;
}

export interface RedcubeInputValidationResult {
  errors: string[];
  warnings: string[];
}

export interface RedcubeProjectBundle {
  ok: boolean;
  project?: string;
  paths: RedcubeProjectPaths;
  errors?: string[];
  warnings: string[];
  tocText?: string;
  allTasks?: string[];
  tasks?: string[];
  styleGuide?: string;
  storylineLogic?: string;
  rawMaterials?: string;
}

export interface RedcubeGeneratedTasks {
  mode: Exclude<RedcubeNoteMode, 'auto'>;
  tasks: string[];
}

export interface RedcubeGeneratedTasksRequest {
  projectName: string;
  rawMaterials: string;
  noteMode?: RedcubeNoteMode;
}

export interface RedcubeSeriesTocRequest {
  projectName: string;
  mode: string;
  tasks: string[];
}

export interface RedcubeNoteDraft {
  titleOptions?: string[];
  body?: string;
  hashtags?: string[];
  outline?: string[];
  planningDocMarkdown?: string;
  hookPool?: string[];
  evidencePool?: string[];
  actionPool?: string[];
  interactionPool?: string[];
  [key: string]: unknown;
}

export interface RedcubeDocBuildOptions {
  rootDir?: string;
  workspaceRoot?: string;
  repoRoot?: string;
  runtimeConfig?: unknown;
  profileId?: string;
  signatureDisplay?: string;
  signatureSubtitle?: string;
  [key: string]: unknown;
}

export interface RedcubeVisualReviewReport {
  status?: string;
  issues?: string[];
  summary?: string;
  [key: string]: unknown;
}

export interface RedcubeVisualEvaluation {
  needFix: boolean;
  issues: Array<Record<string, unknown>>;
  metrics?: Record<string, unknown>;
}

export interface RedcubePublishBundleRequest {
  rootDir: string;
  project: string;
}

export interface RedcubePublishBundle {
  project?: string;
  publishDir?: string;
  publishedTasks?: number;
  taskBundles?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}
