import * as toolsJs from './index.js';

import type {
  RedcubeDocBuildOptions,
  RedcubeGeneratedTasks,
  RedcubeGeneratedTasksRequest,
  RedcubeInputValidationResult,
  RedcubeNoteDraft,
  RedcubeProjectBundle,
  RedcubeProjectPaths,
  RedcubeProjectStructureResult,
  RedcubePublishBundle,
  RedcubePublishBundleRequest,
  RedcubeSeriesTocRequest,
  RedcubeVisualEvaluation,
  RedcubeVisualReviewReport,
} from './types.js';

export const ensureDir = toolsJs.ensureDir as (dir: string) => string;
export const safeFilename = toolsJs.safeFilename as (name: string) => string;
export const buildTaskFolderName = toolsJs.buildTaskFolderName as (
  index: number,
  title: string,
) => string;
export const parseTasksFromToc = toolsJs.parseTasksFromToc as (
  tocText: string,
) => string[];
export const filterTasks = toolsJs.filterTasks as (
  tasks: string[],
  taskFilter?: string,
) => string[];
export const getProjectPaths = toolsJs.getProjectPaths as (
  rootDir: string,
  project: string,
) => RedcubeProjectPaths;
export const listProjects = toolsJs.listProjects as (rootDir: string) => string[];
export const createProjectStructure = toolsJs.createProjectStructure as (
  rootDir: string,
  projectName: string,
) => RedcubeProjectStructureResult;
export const validateProjectInputs = toolsJs.validateProjectInputs as (
  paths: RedcubeProjectPaths,
) => RedcubeInputValidationResult;
export const loadProjectBundle = toolsJs.loadProjectBundle as (
  rootDir: string,
  project: string,
  taskFilter?: string,
) => RedcubeProjectBundle;
export const loadRawMaterials = toolsJs.loadRawMaterials as (
  rawMaterialsDir: string,
) => string;
export const inferNoteMode = toolsJs.inferNoteMode as (
  rawMaterials: string,
  noteMode?: 'auto' | 'single' | 'series',
) => 'single' | 'series';
export const generateTasksFromRawMaterials = toolsJs.generateTasksFromRawMaterials as (
  request: RedcubeGeneratedTasksRequest,
) => RedcubeGeneratedTasks;
export const buildSeriesTocMarkdown = toolsJs.buildSeriesTocMarkdown as (
  request: RedcubeSeriesTocRequest,
) => string;
export const buildContentPlanMarkdown = toolsJs.buildContentPlanMarkdown as (
  note: RedcubeNoteDraft,
) => string;
export const buildPlanningDocMarkdown = toolsJs.buildPlanningDocMarkdown as (
  note: RedcubeNoteDraft,
  taskTitle: string,
  options?: RedcubeDocBuildOptions,
) => string;
export const buildInfographicOutlineDocMarkdown = toolsJs.buildInfographicOutlineDocMarkdown as (
  note: RedcubeNoteDraft,
  taskTitle: string,
  options?: RedcubeDocBuildOptions,
) => string;
export const buildVisualDirectionDocMarkdown = toolsJs.buildVisualDirectionDocMarkdown as (
  note: RedcubeNoteDraft,
  taskTitle: string,
  options?: RedcubeDocBuildOptions,
) => string;
export const buildHtmlGenerationDocMarkdown = toolsJs.buildHtmlGenerationDocMarkdown as (
  note: RedcubeNoteDraft,
  taskTitle: string,
  options?: RedcubeDocBuildOptions,
) => string;
export const buildPublishCopyDocMarkdown = toolsJs.buildPublishCopyDocMarkdown as (
  note: RedcubeNoteDraft,
  taskTitle: string,
  options?: RedcubeDocBuildOptions,
) => string;
export const buildVisualReviewDocMarkdown = toolsJs.buildVisualReviewDocMarkdown as (
  report?: RedcubeVisualReviewReport,
  options?: RedcubeDocBuildOptions,
) => string;
export const parseContentPlanMarkdown = toolsJs.parseContentPlanMarkdown as (
  contentPlan: string,
  fallbackTitle?: string,
) => RedcubeNoteDraft;
export const buildVisualHtml = toolsJs.buildVisualHtml as (
  note: RedcubeNoteDraft,
  taskTitle: string,
) => string;
export const evaluateVisualHtml = toolsJs.evaluateVisualHtml as (
  html: string,
) => RedcubeVisualEvaluation;
export const applyAutoFix = toolsJs.applyAutoFix as (
  html: string,
  issues: string[],
) => string;
export const writePlaceholderImage = toolsJs.writePlaceholderImage as (
  imagesDir: string,
  fileName?: string,
) => string;
export const writeJson = toolsJs.writeJson as (
  file: string,
  data: unknown,
) => void;
export const writeText = toolsJs.writeText as (
  file: string,
  content: string,
) => void;
export const readJsonIfExists = toolsJs.readJsonIfExists as <T = unknown>(
  file: string,
) => T | null;
export const createPublishBundle = toolsJs.createPublishBundle as (
  request: RedcubePublishBundleRequest,
) => RedcubePublishBundle;

export type {
  RedcubeDocBuildOptions,
  RedcubeGeneratedTasks,
  RedcubeGeneratedTasksRequest,
  RedcubeInputValidationResult,
  RedcubeNoteDraft,
  RedcubeNoteMode,
  RedcubeProjectBundle,
  RedcubeProjectPaths,
  RedcubeProjectStructureResult,
  RedcubePublishBundle,
  RedcubePublishBundleRequest,
  RedcubeSeriesTocRequest,
  RedcubeVisualEvaluation,
  RedcubeVisualReviewReport,
} from './types.js';
