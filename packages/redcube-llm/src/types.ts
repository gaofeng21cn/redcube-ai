export interface RedcubeRuntimePromptFile {
  id: string;
  fileName: string;
  label: string;
  description: string;
}

export interface RedcubeLlmConfig {
  mode?: 'offline' | 'pi' | 'openai' | string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  [key: string]: unknown;
}

export interface RedcubeNoteDraftRequest {
  taskTitle: string;
  rawMaterials: string;
  styleGuide?: string;
  storylineLogic?: string;
  llmConfig?: RedcubeLlmConfig | null;
  runtimeConfig?: unknown;
}

export interface RedcubeNoteDraftResult {
  titleOptions: string[];
  body: string;
  hashtags: string[];
  outline: string[];
  planningDocMarkdown: string;
  hookPool: string[];
  evidencePool: string[];
  actionPool: string[];
  interactionPool: string[];
}

export interface RedcubeStorylineRequest {
  projectTitle: string;
  rawMaterials: string;
  promptFile?: string;
  llmConfig?: RedcubeLlmConfig | null;
  runtimeConfig?: unknown;
}
