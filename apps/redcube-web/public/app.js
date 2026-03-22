const TABS = [
  { id: 'workbench', label: '工作台' },
  { id: 'projects', label: '项目' },
  { id: 'runs', label: '运行' },
  { id: 'models', label: '模型' },
];

const STAGE_LABELS = [
  { id: 'planning', label: '单篇策划' },
  { id: 'infographic_outline', label: '信息图大纲' },
  { id: 'visual_direction', label: '视觉导演稿' },
  { id: 'html_generation', label: 'HTML 生成' },
  { id: 'publish_copy', label: '发布文案' },
  { id: 'visual_review', label: '视觉质控' },
];

const INPUT_CATEGORY_META = [
  { id: 'task_brief', label: '任务说明', description: '任务目标、启动说明、项目边界' },
  { id: 'reference_material', label: '参考材料', description: '原始材料、补充资料、联网检索结果' },
  { id: 'persona_rule', label: '人设与规则', description: '身份设定、系统规则、行为约束' },
  { id: 'style', label: '风格基调', description: '语言风格、语气、表达偏好' },
  { id: 'template', label: '模板', description: '阶段模板与默认骨架文件' },
  { id: 'other', label: '其他', description: '暂未归类的补充输入文件' },
];

const TOPIC_WORKFLOW_STEPS = [
  { id: 'sync_inputs', title: '同步输入材料' },
  { id: 'storyline', title: '生成故事线' },
  { id: 'workflow', title: '生成笔记产物' },
  { id: 'truth_sync', title: '回写真相源' },
];

const state = {
  activeTab: 'workbench',
  workbenchMode: 'overview',
  overview: null,
  modelConfig: null,
  runtimeConfig: null,
  selectedTopicSlug: '',
  selectedNoteSlug: '',
  selectedPreviewKey: '',
  selectedInputFilePath: '',
  selectedInputCategory: 'task_brief',
  inputDraftName: '',
  inputDraftContent: '',
  inputDraftLoadedPath: '',
  inputLoading: false,
  inputSaving: false,
  inputUploading: false,
  previewCache: new Map(),
  logs: [],
  smokeRunning: false,
  instructionRunning: false,
  deletingTopicSlug: '',
  workflowRunningTopicSlug: '',
  instructionDraft: {
    scope: 'page',
    text: '',
  },
};

let workflowPollTimer = 0;

const el = {
  workspaceRoot: document.getElementById('workspaceRoot'),
  workspaceBadgeValue: document.getElementById('workspaceBadgeValue'),
  workspaceEditor: document.getElementById('workspaceEditor'),
  toggleWorkspaceBtn: document.getElementById('toggleWorkspaceBtn'),
  tabsNav: document.getElementById('tabsNav'),
  metricsStrip: document.getElementById('metricsStrip'),
  contentRoot: document.getElementById('contentRoot'),
  openSettingsLink: document.getElementById('openSettingsLink'),
  openCreateTaskBtn: document.getElementById('openCreateTaskBtn'),
  createTaskModal: document.getElementById('createTaskModal'),
  closeCreateTaskBtn: document.getElementById('closeCreateTaskBtn'),
  submitCreateTaskBtn: document.getElementById('submitCreateTaskBtn'),
  createTaskTopic: document.getElementById('createTaskTopic'),
  createTaskBrief: document.getElementById('createTaskBrief'),
  createTaskMaterials: document.getElementById('createTaskMaterials'),
  createTaskWebResearch: document.getElementById('createTaskWebResearch'),
  inputFileUpload: document.getElementById('inputFileUpload'),
};

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function logAction(title, detail) {
  state.logs.unshift({
    title,
    detail,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });
  state.logs = state.logs.slice(0, 12);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `请求失败: ${url}`);
  }
  return payload;
}

function getWorkspaceRoot() {
  return el.workspaceRoot.value.trim() || state.runtimeConfig?.workspaceRoot || '';
}

function syncUrl() {
  const params = new URLSearchParams();
  params.set('workspaceRoot', getWorkspaceRoot());
  params.set('tab', state.activeTab);
  if (state.activeTab === 'workbench' && state.selectedTopicSlug) {
    params.set('topic', state.selectedTopicSlug);
    params.set('mode', state.workbenchMode);
    if (state.selectedNoteSlug) params.set('note', state.selectedNoteSlug);
    if (state.selectedPreviewKey) params.set('preview', state.selectedPreviewKey);
  }
  history.replaceState(null, '', `/?${params.toString()}`);
}

function syncSettingsLink() {
  const params = new URLSearchParams({ workspaceRoot: getWorkspaceRoot() });
  el.openSettingsLink.href = `/settings?${params.toString()}`;
}

function renderWorkspaceBadge() {
  el.workspaceBadgeValue.textContent = getWorkspaceRoot();
}

function getSelectedTopic() {
  return state.overview?.topics?.find((topic) => topic.slug === state.selectedTopicSlug) || null;
}

function getSelectedNote() {
  return getSelectedTopic()?.notes?.find((note) => note.slug === state.selectedNoteSlug) || null;
}

function getTopicInputFiles(topic = getSelectedTopic()) {
  return (topic?.inputFiles || []).slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-Hans-CN'));
}

function getInputCategoryMeta(categoryId) {
  return INPUT_CATEGORY_META.find((item) => item.id === categoryId) || INPUT_CATEGORY_META[INPUT_CATEGORY_META.length - 1];
}

function getTopicInputCategories(topic = getSelectedTopic()) {
  const files = getTopicInputFiles(topic);
  return INPUT_CATEGORY_META
    .map((item) => ({
      ...item,
      files: files.filter((file) => file.category === item.id),
      count: files.filter((file) => file.category === item.id).length,
    }))
    .filter((item) => item.count > 0 || item.id === 'reference_material' || item.id === 'task_brief');
}

function isEditableTextFile(filePath) {
  const normalized = String(filePath || '').toLowerCase();
  return ['.md', '.markdown', '.txt', '.json', '.yaml', '.yml', '.csv', '.html', '.htm'].some((ext) => normalized.endsWith(ext));
}

function getSelectedInputFile(topic = getSelectedTopic()) {
  return getTopicInputFiles(topic).find((file) => file.path === state.selectedInputFilePath) || null;
}

function getSelectedInputCategory(topic = getSelectedTopic()) {
  const categories = getTopicInputCategories(topic);
  return categories.find((item) => item.id === state.selectedInputCategory) || categories.find((item) => item.count > 0) || categories[0] || getInputCategoryMeta('task_brief');
}

function getSelectedInputCategoryFiles(topic = getSelectedTopic()) {
  return getTopicInputFiles(topic).filter((file) => file.category === getSelectedInputCategory(topic)?.id);
}

function syncInputSelection(topic = getSelectedTopic()) {
  const categories = getTopicInputCategories(topic);
  if (!categories.length) {
    state.selectedInputCategory = 'task_brief';
    state.selectedInputFilePath = '';
    return;
  }

  const activeCategory = categories.find((item) => item.id === state.selectedInputCategory);
  if (!activeCategory || activeCategory.count === 0) {
    state.selectedInputCategory = categories.find((item) => item.count > 0)?.id || categories[0].id;
  }

  const categoryFiles = getTopicInputFiles(topic).filter((file) => file.category === state.selectedInputCategory);
  if (!categoryFiles.some((file) => file.path === state.selectedInputFilePath)) {
    state.selectedInputFilePath = categoryFiles[0]?.path || '';
  }
}

function getTopicRuns(topic = getSelectedTopic()) {
  const noteSlugs = new Set((topic?.notes || []).map((note) => note.slug));
  return getLedgerRuns().filter((run) => {
    if (run.topic && run.topic === topic?.slug) return true;
    if (run.project && run.project === topic?.slug) return true;
    if (run.noteSlug && noteSlugs.has(run.noteSlug)) return true;
    return false;
  });
}

function getTopicWorkflowRuns(topic = getSelectedTopic()) {
  return getTopicRuns(topic).filter((run) => run.kind === 'topic_workflow');
}

function getLatestTopicWorkflowRun(topic = getSelectedTopic()) {
  return getTopicWorkflowRuns(topic)[0] || null;
}

function hasLedgerRunningTopicWorkflow(topicSlug) {
  return getLedgerRuns().some((run) => run.kind === 'topic_workflow' && run.topic === topicSlug && run.status === 'running');
}

function isTopicWorkflowRunning(topicSlug) {
  return Boolean(topicSlug) && (state.workflowRunningTopicSlug === topicSlug || hasLedgerRunningTopicWorkflow(topicSlug));
}

function formatDateTime(value) {
  if (!value) return '暂无';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeTopicWorkflowSteps(summary = {}) {
  const summarySteps = Array.isArray(summary.steps) ? summary.steps : [];
  const stepMap = new Map(summarySteps.map((step) => [step.id, step]));
  return TOPIC_WORKFLOW_STEPS.map((step) => ({
    ...step,
    status: stepMap.get(step.id)?.status || 'pending',
  }));
}

function getRunBadgeClass(status) {
  if (status === 'running') return 'running';
  if (status === 'failed' || status === 'blocked') return 'failed';
  if (status === 'completed' || status === 'done') return 'done';
  return 'pending';
}

function getTopicWorkspaceNarrative(topic) {
  const inputFiles = getTopicInputFiles(topic);
  const notes = topic?.notes || [];
  if (inputFiles.length === 0) {
    return '这个项目还没有形成可生产的输入层。先补任务说明、参考材料、人设或风格规则，再启动生成。';
  }
  if (notes.length === 0) {
    return '输入层已经建立，但产物层仍是空白。项目首页应该先告诉你当前状态，并直接给出首轮生成入口。';
  }
  return '这个项目已经具备完整的输入和部分产物。先看最近一次运行，再决定是补输入还是继续检查单篇成品。';
}

function getTopicWorkflowState(topic = getSelectedTopic()) {
  const latestRun = getLatestTopicWorkflowRun(topic);
  const steps = normalizeTopicWorkflowSteps(latestRun?.summary || {});
  const completedSteps = Number.isFinite(latestRun?.summary?.completedSteps)
    ? latestRun.summary.completedSteps
    : steps.filter((step) => step.status === 'done').length;
  const totalSteps = Number.isFinite(latestRun?.summary?.totalSteps)
    ? latestRun.summary.totalSteps
    : steps.length;
  const runningStep = steps.find((step) => step.status === 'running');
  const failedStep = steps.find((step) => step.status === 'failed');
  const currentStepTitle = latestRun?.summary?.currentStep?.title
    || runningStep?.title
    || failedStep?.title
    || (latestRun?.status === 'completed' ? '全部阶段完成' : '等待启动');
  const failureReason = latestRun?.summary?.error || '';
  const running = isTopicWorkflowRunning(topic?.slug || '');
  const status = running ? 'running' : (latestRun?.status || 'idle');
  const progressPercent = totalSteps > 0
    ? Math.min(100, Math.max(completedSteps > 0 ? 16 : 6, Math.round((completedSteps / totalSteps) * 100)))
    : 0;

  if (status === 'running') {
    return {
      run: latestRun,
      status,
      pillClass: 'running',
      pillLabel: '运行中',
      headline: '工作流正在执行',
      description: '阶段进度、当前步骤和阶段轨迹会在这里持续刷新，不需要盯着原始日志。',
      currentStepTitle,
      failureReason: '暂无',
      completedSteps,
      totalSteps,
      progressPercent,
      steps,
      actionLabel: '生成进行中',
      canStart: false,
    };
  }

  if (status === 'failed') {
    return {
      run: latestRun,
      status,
      pillClass: 'failed',
      pillLabel: '失败',
      headline: '最近一次运行未完成',
      description: '失败原因已经挂到项目首页，支持从这里直接重新生成，不需要翻日志找入口。',
      currentStepTitle,
      failureReason: failureReason || '未记录失败原因',
      completedSteps,
      totalSteps,
      progressPercent,
      steps,
      actionLabel: '重新生成',
      canStart: true,
    };
  }

  if (status === 'completed') {
    return {
      run: latestRun,
      status,
      pillClass: 'done',
      pillLabel: '已完成',
      headline: '最近一次运行已完成',
      description: '你可以继续查看产物，也可以基于最新输入重新生成一轮。',
      currentStepTitle,
      failureReason: '暂无',
      completedSteps,
      totalSteps,
      progressPercent: totalSteps > 0 ? 100 : progressPercent,
      steps,
      actionLabel: '重新生成',
      canStart: true,
    };
  }

  return {
    run: latestRun,
    status: 'idle',
    pillClass: 'pending',
    pillLabel: '待启动',
    headline: '首轮生产尚未启动',
    description: '项目首页应该先让你看清输入、结构和运行状态，再从这里发起第一轮生产。',
    currentStepTitle: '等待启动',
    failureReason: '暂无',
    completedSteps: 0,
    totalSteps,
    progressPercent: 0,
    steps,
    actionLabel: '开始首轮生成',
    canStart: true,
  };
}

function getAllNotes() {
  return (state.overview?.topics || []).flatMap((topic) => topic.notes || []);
}

function getLedgerRuns() {
  return Object.values(state.overview?.ledger?.runs || {}).sort((a, b) => {
    const left = String(a.finishedAt || a.startedAt || '');
    const right = String(b.finishedAt || b.startedAt || '');
    return right.localeCompare(left);
  });
}

function getInstructionEntries() {
  return state.overview?.ledger?.instructions || [];
}

function getStatusText(status) {
  if (status === 'done' || status === 'completed') return '已完成';
  if (status === 'running') return '运行中';
  if (status === 'failed') return '失败';
  if (status === 'blocked') return '阻断';
  return '待处理';
}

function topicProgress(topic) {
  const notes = topic.notes || [];
  const done = notes.filter((note) => note.workflow?.stages?.every((stage) => stage.status === 'done')).length;
  const blocked = notes.filter((note) => (note.workflow?.stages || []).some((stage) => stage.status === 'blocked')).length;
  const status = blocked > 0 ? 'blocked' : done === notes.length && notes.length > 0 ? 'done' : 'pending';
  return { done, blocked, total: notes.length, status };
}

function findModel(modelId) {
  return state.modelConfig?.models?.find((model) => model.id === modelId) || null;
}

function modelLabelForStage(stageId) {
  if (!state.modelConfig) return '未配置';
  const overrideId = state.modelConfig.stageOverrides?.[stageId];
  const model = findModel(overrideId || state.modelConfig.defaultModelId);
  if (!model) return overrideId || state.modelConfig.defaultModelId || '未配置';
  return model.label || model.modelName || model.id;
}

function getPreviewItems(note) {
  if (!note) return [];

  const items = [];
  const pushFile = (key, label, file, type = 'text') => {
    if (!file?.path) return;
    items.push({ key, label, filePath: file.path, type });
  };

  pushFile('stage-planning', '单篇策划', note.stageFiles?.planning);
  pushFile('stage-outline', '信息图大纲', note.stageFiles?.infographicOutline);
  pushFile('stage-visual', '视觉导演稿', note.stageFiles?.visualDirection);
  pushFile('stage-html-doc', 'HTML 生成说明', note.stageFiles?.htmlGeneration);
  pushFile('stage-copy-doc', '发布文案', note.stageFiles?.publishCopy);
  pushFile('stage-review-doc', '视觉质控', note.stageFiles?.visualReview);
  pushFile('artifact-html', '成品 HTML', note.artifacts?.html, 'html');
  pushFile('artifact-copy', '成品文案', note.artifacts?.publishCopy);

  if (Array.isArray(note.artifacts?.slides) && note.artifacts.slides.length > 0) {
    for (const [index, slide] of note.artifacts.slides.entries()) {
      pushFile(`slide-${index + 1}`, `截图 ${String(index + 1).padStart(2, '0')}`, slide, 'image');
    }
  }

  return items;
}

function getSelectedPreviewItem(note = getSelectedNote()) {
  return getPreviewItems(note).find((item) => item.key === state.selectedPreviewKey) || null;
}

function pickDefaultPreview(note) {
  const items = getPreviewItems(note);
  return items[0]?.key || '';
}

function ensureSelection() {
  const topics = state.overview?.topics || [];
  if (!topics.length) {
    state.selectedTopicSlug = '';
    state.selectedNoteSlug = '';
    state.selectedPreviewKey = '';
    state.selectedInputFilePath = '';
    return;
  }

  if (!topics.some((topic) => topic.slug === state.selectedTopicSlug)) {
    state.selectedTopicSlug = topics[0].slug;
  }

  const currentTopic = getSelectedTopic();
  const notes = currentTopic?.notes || [];
  if (!notes.some((note) => note.slug === state.selectedNoteSlug)) {
    state.selectedNoteSlug = notes[0]?.slug || '';
  }

  const previewItems = getPreviewItems(getSelectedNote());
  if (!previewItems.some((item) => item.key === state.selectedPreviewKey)) {
    state.selectedPreviewKey = pickDefaultPreview(getSelectedNote());
  }

  const inputFiles = getTopicInputFiles(currentTopic);
  syncInputSelection(currentTopic);

  if (!['overview', 'inputs', 'artifacts'].includes(state.workbenchMode)) {
    state.workbenchMode = 'overview';
  }

  if ((notes || []).length === 0 && state.workbenchMode === 'artifacts') {
    state.workbenchMode = 'overview';
  }
}

async function loadOverview() {
  const params = new URLSearchParams({ workspaceRoot: getWorkspaceRoot() });
  state.overview = await requestJson(`/api/GetWorkbenchOverview?${params.toString()}`);
  if (state.workflowRunningTopicSlug && !hasLedgerRunningTopicWorkflow(state.workflowRunningTopicSlug)) {
    state.workflowRunningTopicSlug = '';
  }
  ensureSelection();
}

function syncWorkflowPolling() {
  const hasRunning = getLedgerRuns().some((run) => run.kind === 'topic_workflow' && run.status === 'running');
  if (!hasRunning) {
    if (workflowPollTimer) {
      clearTimeout(workflowPollTimer);
      workflowPollTimer = 0;
    }
    return;
  }

  if (workflowPollTimer) return;

  workflowPollTimer = window.setTimeout(async () => {
    workflowPollTimer = 0;
    try {
      await loadOverview();
      render();
    } catch (error) {
      logAction('运行状态刷新失败', String(error));
      render();
    }
  }, 1800);
}

async function loadModelConfig() {
  const params = new URLSearchParams({ workspaceRoot: getWorkspaceRoot() });
  state.modelConfig = await requestJson(`/api/GetModelSelectionConfig?${params.toString()}`);
}

async function loadRuntimeDefaults() {
  state.runtimeConfig = await requestJson('/api/GetRuntimeConfig');
  if (!el.workspaceRoot.value.trim()) {
    el.workspaceRoot.value = state.runtimeConfig.workspaceRoot || '';
  }
  syncSettingsLink();
  renderWorkspaceBadge();
}

async function loadInitial() {
  try {
    await loadRuntimeDefaults();
    await Promise.all([loadOverview(), loadModelConfig()]);
    logAction('工作台已载入', '已读取真实工作区、主题、单篇、运行摘要和模型选择配置。');
  } catch (error) {
    logAction('加载失败', String(error));
  }
  render();
}

async function readPreview(filePath) {
  if (state.previewCache.has(filePath)) {
    return state.previewCache.get(filePath);
  }

  const payload = await requestJson('/api/GetWorkbenchFile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      filePath,
    }),
  });
  state.previewCache.set(filePath, payload);
  return payload;
}

function clearPreviewCache(filePaths = []) {
  for (const filePath of filePaths) {
    if (filePath) {
      state.previewCache.delete(filePath);
    }
  }
}

function focusWorkbenchElement(elementId) {
  requestAnimationFrame(() => {
    document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function loadInputDraft(filePath = state.selectedInputFilePath) {
  if (!filePath) {
    state.inputDraftLoadedPath = '';
    state.inputDraftContent = '';
    render();
    return;
  }

  if (state.inputDraftLoadedPath === filePath) {
    return;
  }

  state.inputLoading = true;
  render();
  try {
    const payload = await requestJson('/api/GetWorkbenchFile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceRoot: getWorkspaceRoot(),
        filePath,
      }),
    });
    state.inputDraftLoadedPath = filePath;
    state.inputDraftContent = payload.content || '';
  } catch (error) {
    state.inputDraftLoadedPath = filePath;
    state.inputDraftContent = `读取失败：${String(error)}`;
  } finally {
    state.inputLoading = false;
    render();
  }
}

async function saveInputDraft() {
  const topic = getSelectedTopic();
  const selectedCategory = getSelectedInputCategory(topic);
  const draftDir = selectedCategory?.id === 'template'
    ? `${topic?.inputDir || ''}/templates`
    : (getSelectedInputFile(topic)?.dirPath || topic?.inputDir || '');
  const filePath = state.selectedInputFilePath || (state.inputDraftName ? `${draftDir}/${state.inputDraftName}` : '');
  if (!filePath) {
    throw new Error('请先选择文件，或填写新文件名');
  }

  state.inputSaving = true;
  render();
  const result = await requestJson('/api/SaveWorkbenchFile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      filePath,
      content: state.inputDraftContent,
    }),
  });
  clearPreviewCache([filePath]);
  await loadOverview();
  state.selectedInputFilePath = result.filePath;
  state.inputDraftLoadedPath = result.filePath;
  state.inputDraftName = '';
  state.inputSaving = false;
  logAction('已保存输入材料', result.filePath.replace(`${getWorkspaceRoot()}/`, ''));
  render();
}

async function uploadInputFile(file) {
  const topic = getSelectedTopic();
  if (!topic?.inputDir || !file) {
    throw new Error('当前项目没有输入目录');
  }

  const targetDir = getSelectedInputFile(topic)?.dirPath || topic.inputDir;
  const buffer = await file.arrayBuffer();
  state.inputUploading = true;
  render();
  const result = await requestJson('/api/UploadWorkbenchFile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      dirPath: targetDir,
      fileName: file.name,
      base64Content: arrayBufferToBase64(buffer),
    }),
  });
  await loadOverview();
  state.selectedInputFilePath = result.filePath;
  state.inputDraftLoadedPath = '';
  state.inputUploading = false;
  logAction('已上传输入文件', result.fileName);
  render();
  if (isEditableTextFile(result.filePath)) {
    await loadInputDraft(result.filePath);
  }
}

async function deleteTopic(topicSlug) {
  const topic = (state.overview?.topics || []).find((item) => item.slug === topicSlug);
  if (!topic) throw new Error(`未找到项目: ${topicSlug}`);
  if (!window.confirm(`确定删除项目「${topic.name}」吗？这会同时删除输入和输出目录。`)) {
    return;
  }

  state.deletingTopicSlug = topicSlug;
  render();

  const result = await requestJson('/api/DeleteWorkbenchTopic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      topic: topicSlug,
    }),
  });

  await loadOverview();
  state.deletingTopicSlug = '';

  if (state.selectedTopicSlug === topicSlug) {
    ensureSelection();
  }

  if (state.activeTab === 'workbench' && !state.selectedTopicSlug) {
    state.activeTab = 'projects';
  }

  logAction('已删除项目', result.deleted.topic);
  render();
}

async function startTopicWorkflow(topicSlug) {
  const topic = (state.overview?.topics || []).find((item) => item.slug === topicSlug);
  if (!topic) throw new Error(`未找到项目: ${topicSlug}`);

  state.workflowRunningTopicSlug = topicSlug;
  render();

  const result = await requestJson('/api/StartWorkbenchTopicWorkflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      topic: topicSlug,
      mode: 'full',
      autoFix: true,
    }),
  });

  await loadOverview();
  state.selectedTopicSlug = topicSlug;
  state.workbenchMode = 'overview';
  logAction('项目已开始生成', `${topicSlug} · run ${result.runId}`);
  render();
}

function renderTabs() {
  el.tabsNav.innerHTML = TABS.map((tab) => `
    <button class="tab-button ${tab.id === state.activeTab ? 'active' : ''}" data-action="select-tab" data-tab="${tab.id}">
      ${tab.label}
    </button>
  `).join('');
}

function renderMetrics() {
  const topics = state.overview?.topics || [];
  const notes = getAllNotes();
  const doneCount = notes.filter((note) => note.workflow?.stages?.every((stage) => stage.status === 'done')).length;
  const blockedCount = notes.filter((note) => (note.workflow?.stages || []).some((stage) => stage.status === 'blocked')).length;
  const models = state.modelConfig?.models?.length || 0;
  const defaultModel = modelLabelForStage('__default__');

  el.metricsStrip.innerHTML = [
    metricPill('主题', topics.length),
    metricPill('笔记', notes.length),
    metricPill('已完结', doneCount),
    metricPill('阻断', blockedCount),
    metricPill('可选模型', models),
    metricPill('默认模型', defaultModel),
  ].join('');
}

function metricPill(label, value) {
  return `
    <div class="metric-pill">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function renderTopicStepChips(steps) {
  return steps.map((step) => `
    <span class="step-chip ${escapeHtml(step.status || 'pending')}">${escapeHtml(step.title)}</span>
  `).join('');
}

function renderTopicRunStatusCard(topic, options = {}) {
  const workflowState = getTopicWorkflowState(topic);
  const compact = options.compact === true;
  const failureText = workflowState.status === 'failed' ? workflowState.failureReason : '暂无';
  const updatedAt = workflowState.run?.finishedAt || workflowState.run?.startedAt;

  return `
    <article class="workflow-status-card ${workflowState.pillClass} ${compact ? 'compact' : ''}">
      <div class="workflow-status-top">
        <div>
          <div class="section-title">运行状态</div>
          <div class="workflow-status-title">${escapeHtml(workflowState.headline)}</div>
        </div>
        <span class="status-pill ${workflowState.pillClass}">${escapeHtml(workflowState.pillLabel)}</span>
      </div>
      <div class="section-copy">${escapeHtml(workflowState.description)}</div>
      <div class="workflow-progress-row">
        <div class="workflow-progress-meta">
          <span>阶段进度</span>
          <strong>${escapeHtml(`${workflowState.completedSteps}/${workflowState.totalSteps}`)}</strong>
        </div>
        <div class="workflow-progress-track"><span style="width:${workflowState.progressPercent}%;"></span></div>
      </div>
      <div class="workflow-detail-grid">
        <div class="workflow-detail">
          <span>当前步骤</span>
          <strong>${escapeHtml(workflowState.currentStepTitle)}</strong>
        </div>
        <div class="workflow-detail">
          <span>失败原因</span>
          <strong>${escapeHtml(failureText)}</strong>
        </div>
      </div>
      <div class="step-chip-row">${renderTopicStepChips(workflowState.steps)}</div>
      ${updatedAt ? `<div class="workflow-time">最近更新：${escapeHtml(formatDateTime(updatedAt))}</div>` : ''}
    </article>
  `;
}

function renderTopicOverviewCards(topic, options = {}) {
  const progress = topicProgress(topic);
  const inputFiles = getTopicInputFiles(topic);
  const categories = getTopicInputCategories(topic).filter((item) => item.count > 0);
  const manageInputsAction = options.context === 'projects'
    ? `<button class="btn-secondary" data-action="open-topic-mode" data-topic="${escapeHtml(topic.slug)}" data-mode="inputs">管理输入材料</button>`
    : '<button class="btn-secondary" data-action="show-inputs">管理输入材料</button>';
  const viewArtifactsAction = options.context === 'projects'
    ? `<button class="btn-secondary" data-action="open-topic-mode" data-topic="${escapeHtml(topic.slug)}" data-mode="artifacts" ${(topic.notes || []).length === 0 ? 'disabled' : ''}>查看笔记产物</button>`
    : `<button class="btn-secondary" data-action="show-artifacts" ${(topic.notes || []).length === 0 ? 'disabled' : ''}>查看笔记产物</button>`;

  return `
    <section class="surface content-column workspace-overview-panel">
      <div class="section-title">工作区概览</div>
      <div class="section-copy">项目首页不应该把所有文件和日志同时摊开，而是先把输入、系列结构和产物层级讲清楚。</div>
      <div class="overview-card-grid">
        <article class="overview-card">
          <div class="overview-card-kicker">输入材料</div>
          <div class="overview-card-metric">${escapeHtml(String(inputFiles.length))}</div>
          <div class="overview-card-title">材料系统已接入 ${escapeHtml(String(categories.length || 0))} 类输入</div>
          <div class="overview-card-copy">${escapeHtml(categories.length ? categories.map((item) => `${item.label} ${item.count}`).join(' · ') : '还没有可用输入，建议先补任务说明或上传参考材料。')}</div>
          <div class="card-actions">${manageInputsAction}</div>
        </article>
        <article class="overview-card">
          <div class="overview-card-kicker">系列蓝图</div>
          <div class="overview-card-metric">${escapeHtml(String([topic.stageFiles?.storyline, topic.stageFiles?.seriesPlan].filter(Boolean).length))}/2</div>
          <div class="overview-card-title">故事线与系列目录${topic.stageFiles?.storyline && topic.stageFiles?.seriesPlan ? '已具备' : '待补齐'}</div>
          <div class="overview-card-copy">${escapeHtml(topic.stageFiles?.storyline ? '故事线已生成' : '故事线待生成')} · ${escapeHtml(topic.stageFiles?.seriesPlan ? '系列目录已生成' : '系列目录待生成')}</div>
          <div class="card-actions">
            ${options.context === 'projects'
              ? `<button class="btn-secondary" data-action="open-topic-mode" data-topic="${escapeHtml(topic.slug)}" data-mode="overview">进入项目总览</button>`
              : '<button class="btn-secondary" data-action="show-overview">刷新项目总览</button>'}
          </div>
        </article>
        <article class="overview-card">
          <div class="overview-card-kicker">笔记产物</div>
          <div class="overview-card-metric">${escapeHtml(String(progress.total))}</div>
          <div class="overview-card-title">${escapeHtml(String(progress.done))} 篇已完成 · ${escapeHtml(String(progress.blocked))} 篇阻断</div>
          <div class="overview-card-copy">${escapeHtml(progress.total > 0 ? '产物系统已经建立，可以直接进入单篇查看 HTML、截图和发布文案。' : '还没有产出笔记，首轮生成后产物系统会自动出现。')}</div>
          <div class="card-actions">${viewArtifactsAction}</div>
        </article>
      </div>
    </section>
  `;
}

function renderTopicRunSummaryPanel(topic) {
  const workflowState = getTopicWorkflowState(topic);
  const latestRun = workflowState.run;
  const runCount = getTopicWorkflowRuns(topic).length;
  const updatedAt = latestRun?.finishedAt || latestRun?.startedAt;
  const historyCopy = runCount > 0
    ? `历史运行已保留 ${runCount} 条记录，进入运行总览可查看完整账本。`
    : '历史运行会持续保留在运行总览里，首轮生成后即可查看完整账本。';
  const nextStepCopy = workflowState.status === 'failed'
    ? '先处理当前失败原因，再决定是否直接重新生成。'
    : workflowState.status === 'running'
      ? '当前只需要盯住最新一次运行状态，历史记录放到运行总览统一查看。'
      : '项目页只展示最新状态，历史记录统一收拢到运行总览。';

  return `
    <div class="content-column" style="padding:0;">
      ${renderTopicRunStatusCard(topic)}
      <div class="run-list">
        <div class="run-row status-callout">
          <strong>${escapeHtml(updatedAt ? `最新状态更新于 ${formatDateTime(updatedAt)}` : '等待首轮生成')}</strong>
          <div class="run-meta">${escapeHtml(nextStepCopy)}</div>
        </div>
        <div class="run-row">
          <strong>${escapeHtml(historyCopy)}</strong>
          <div class="run-meta">需要排查旧失败或查看历史完成记录时，再进入运行总览。</div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-secondary" data-action="select-tab" data-tab="runs">查看历史运行</button>
      </div>
    </div>
  `;
}

function renderOnboardingStepCard({ step, title, copy, actionHtml = '' }) {
  return `
    <article class="onboarding-step-card">
      <div class="onboarding-step-index">${escapeHtml(String(step).padStart(2, '0'))}</div>
      <div class="onboarding-step-title">${escapeHtml(title)}</div>
      <div class="onboarding-step-copy">${escapeHtml(copy)}</div>
      ${actionHtml ? `<div class="onboarding-step-actions">${actionHtml}</div>` : ''}
    </article>
  `;
}

function renderWorkbenchOnboarding(options = {}) {
  const contextTitle = options.contextTitle || '工作台尚未接入可识别主题';
  const contextCopy = options.contextCopy || '先连接真实工作区，再创建任务，系统就会自动进入首轮生成。整个入口不应该藏在页头按钮里，而应该直接出现在正文首屏。';

  return `
    <div class="tab-pane active">
      <section class="onboarding-shell surface">
        <div class="onboarding-header">
          <div class="canvas-kicker">三步启动</div>
          <h2 class="onboarding-title">${escapeHtml(contextTitle)}</h2>
          <p class="onboarding-copy">${escapeHtml(contextCopy)}</p>
          <div class="hero-actions">
            <button class="btn-primary" data-action="open-create-task">新建任务</button>
            <button class="btn-secondary" data-action="toggle-workspace-editor">更换工作区</button>
            <button class="btn-secondary" data-action="refresh-overview">刷新工作区</button>
          </div>
        </div>
        <div class="onboarding-grid">
          ${renderOnboardingStepCard({
            step: 1,
            title: '连接工作区',
            copy: '把真实 workspace 挂进来，系统才能识别主题目录、输入材料和运行产物。',
            actionHtml: `
              <button class="btn-secondary" data-action="toggle-workspace-editor">更换工作区</button>
              <button class="btn-secondary" data-action="refresh-overview">刷新工作区</button>
            `,
          })}
          ${renderOnboardingStepCard({
            step: 2,
            title: '创建任务骨架',
            copy: '直接在界面里描述主题、粘贴材料，或勾选允许联网搜集资料，系统会帮你落任务骨架。',
            actionHtml: '<button class="btn-primary" data-action="open-create-task">新建任务</button>',
          })}
          ${renderOnboardingStepCard({
            step: 3,
            title: '自动首轮生成',
            copy: '任务创建后会自动启动首轮流程，你只需要回来看方向是否正确，再决定补输入还是继续细修。',
            actionHtml: '<button class="btn-secondary" data-action="select-tab" data-tab="runs">查看运行页</button>',
          })}
        </div>
        <div class="onboarding-callout">创建后会自动进入首轮生成。你不需要再跳去别的页面手动找运行入口，首轮完成后再回到项目总览检查方向即可。</div>
      </section>
    </div>
  `;
}

function renderFirstRunLaunchpad(topic) {
  const inputFiles = getTopicInputFiles(topic);
  const workflowState = getTopicWorkflowState(topic);
  const hasInputs = inputFiles.length > 0;

  return `
    <section class="onboarding-shell compact surface">
      <div class="onboarding-header">
        <div class="canvas-kicker">首轮启动</div>
        <h3 class="onboarding-title">先把第一轮跑出来，再决定细修哪里。</h3>
        <p class="onboarding-copy">${escapeHtml(hasInputs
          ? '输入层已经接入，可以直接从项目首页发起首轮生成。生成完成后优先看运行摘要和首批产物，再决定是否补材料或继续返工。'
          : '当前主题还缺少足够输入。先补任务说明、原始材料或风格规则，再从这里直接发起首轮生成。')}</p>
      </div>
      <div class="onboarding-grid">
        ${renderOnboardingStepCard({
          step: 1,
          title: '补齐输入材料',
          copy: hasInputs ? '当前已经有输入文件，可继续补充任务说明、参考材料或风格约束。' : '没有足够输入时，先进入材料页补任务说明、原始材料或上传附件。',
          actionHtml: '<button class="btn-secondary" data-action="show-inputs">管理输入材料</button>',
        })}
        ${renderOnboardingStepCard({
          step: 2,
          title: '开始首轮生成',
          copy: '不需要先切别的 tab。项目总览就应该直接承担启动入口和当前阶段状态。',
          actionHtml: `<button class="btn-primary" data-action="start-topic-workflow" data-topic="${escapeHtml(topic.slug)}" ${workflowState.canStart ? '' : 'disabled'}>${escapeHtml(workflowState.actionLabel)}</button>`,
        })}
        ${renderOnboardingStepCard({
          step: 3,
          title: '回看首轮结果',
          copy: '先看最新运行摘要和项目方向，再决定回写输入、局部重跑还是继续看单篇成品。',
          actionHtml: '<button class="btn-secondary" data-action="select-tab" data-tab="runs">查看历史运行</button>',
        })}
      </div>
    </section>
  `;
}

function renderTopicHeroSection(topic, options = {}) {
  const workflowState = getTopicWorkflowState(topic);
  const progress = topicProgress(topic);
  const narrative = options.description || getTopicWorkspaceNarrative(topic);
  const primaryAction = `
    <button class="btn-primary" data-action="start-topic-workflow" data-topic="${escapeHtml(topic.slug)}" ${workflowState.canStart ? '' : 'disabled'}>
      ${escapeHtml(workflowState.actionLabel)}
    </button>
  `;
  const manageInputsAction = options.context === 'projects'
    ? `<button class="btn-secondary" data-action="open-topic-mode" data-topic="${escapeHtml(topic.slug)}" data-mode="inputs">管理输入材料</button>`
    : '<button class="btn-secondary" data-action="show-inputs">管理输入材料</button>';
  const viewArtifactsAction = options.context === 'projects'
    ? `<button class="btn-secondary" data-action="open-topic-mode" data-topic="${escapeHtml(topic.slug)}" data-mode="artifacts" ${(topic.notes || []).length === 0 ? 'disabled' : ''}>查看笔记产物</button>`
    : `<button class="btn-secondary" data-action="show-artifacts" ${(topic.notes || []).length === 0 ? 'disabled' : ''}>查看笔记产物</button>`;
  const returnAction = options.returnActionHtml || '';

  return `
    <section class="project-hero-shell surface">
      <div class="project-hero-grid">
        <div class="project-hero-body">
          <div class="canvas-kicker">${escapeHtml(options.kicker || '项目首页')}</div>
          <h2 class="project-hero-title">${escapeHtml(topic.name)}</h2>
          <p class="project-hero-copy">${escapeHtml(narrative)}</p>
          <div class="inline-stats">
            <div class="stat-chip"><strong>${escapeHtml(String(getTopicInputFiles(topic).length))}</strong> 输入文件</div>
            <div class="stat-chip"><strong>${escapeHtml(String(progress.total))}</strong> 笔记产物</div>
            <div class="stat-chip"><strong>${escapeHtml(String(getTopicWorkflowRuns(topic).length))}</strong> 最近运行</div>
            <span class="status-pill ${workflowState.pillClass}">${escapeHtml(workflowState.pillLabel)}</span>
          </div>
          <div class="section-title" style="margin-top:16px; margin-bottom:0;">项目操作</div>
          <div class="hero-actions">
            ${primaryAction}
            ${manageInputsAction}
            ${viewArtifactsAction}
            ${returnAction}
          </div>
        </div>
        <div class="project-hero-side">
          ${renderTopicRunStatusCard(topic, { compact: true })}
        </div>
      </div>
    </section>
  `;
}

function renderProjectDirectoryCards(topics, selectedTopicSlug) {
  return topics.map((topic) => {
    const progress = topicProgress(topic);
    const workflowState = getTopicWorkflowState(topic);
    return `
      <article class="directory-card ${topic.slug === selectedTopicSlug ? 'active' : ''}">
        <div>
          <div class="directory-card-title">${escapeHtml(topic.name)}</div>
          <div class="directory-card-copy">${escapeHtml(getTopicWorkspaceNarrative(topic))}</div>
          <div class="project-meta-row">
            <span class="tag">${escapeHtml(String(getTopicInputFiles(topic).length))} 个输入</span>
            <span class="tag">${escapeHtml(String(progress.total))} 篇笔记</span>
            <span class="status-pill ${workflowState.pillClass}">${escapeHtml(workflowState.pillLabel)}</span>
          </div>
        </div>
        <div class="directory-card-actions">
          <button class="btn-secondary" data-action="focus-project" data-topic="${escapeHtml(topic.slug)}">${topic.slug === selectedTopicSlug ? '焦点项目' : '设为焦点'}</button>
          <button class="btn-primary" data-action="start-topic-workflow" data-topic="${escapeHtml(topic.slug)}" ${workflowState.canStart ? '' : 'disabled'}>${escapeHtml(workflowState.actionLabel)}</button>
          <button class="btn-secondary" data-action="open-topic-mode" data-topic="${escapeHtml(topic.slug)}" data-mode="overview">进入项目</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderWorkbenchOverviewView(topic) {
  const progress = topicProgress(topic);
  const inputFiles = getTopicInputFiles(topic);
  const workflowState = getTopicWorkflowState(topic);
  const showFirstRunLaunchpad = (topic.notes || []).length === 0;
  const nextActionTitle = inputFiles.length === 0
    ? '先补输入材料'
    : (topic.notes || []).length === 0
      ? '开始首轮生成'
      : '查看最近产物并决定是否重跑';
  const nextActionCopy = inputFiles.length === 0
    ? '建议先进入输入材料页，补任务说明、原始材料、风格或人设约束。'
    : (topic.notes || []).length === 0
      ? '输入层已经准备好，下一步应该从项目首页直接发起首轮生成。'
      : '先看当前运行摘要，如果方向偏了就改输入，如果只是局部问题再进单篇返工。';

  return `
    <div class="tab-pane active">
      <div class="workbench-layout project-home-layout">
        <aside class="rail surface">
          <div class="rail-section">
            <div class="section-title">当前项目</div>
            <div class="rail-project-name">${escapeHtml(topic.name)}</div>
            <button class="btn-secondary rail-project-switch" data-action="open-projects">返回项目列表</button>
            <button class="btn-danger rail-project-switch" data-action="delete-topic" data-topic="${escapeHtml(topic.slug)}" ${state.deletingTopicSlug === topic.slug ? 'disabled' : ''}>${state.deletingTopicSlug === topic.slug ? '删除中…' : '删除项目'}</button>
          </div>
          <div class="rail-section">
            <div class="section-title">项目状态</div>
            <div class="list-stack">
              <div class="run-row">
                <strong>${progress.total} 篇笔记 · ${progress.done} 篇已完成</strong>
                <div class="run-meta">当前状态：${getStatusText(progress.status)}</div>
              </div>
              <div class="run-row">
                <strong>${inputFiles.length} 个输入文件</strong>
                <div class="run-meta">${escapeHtml(topic.inputDir || '未绑定输入目录')}</div>
              </div>
              <div class="run-row">
                <strong>${escapeHtml(workflowState.pillLabel)}</strong>
                <div class="run-meta">当前步骤：${escapeHtml(workflowState.currentStepTitle)}</div>
              </div>
            </div>
          </div>
        </aside>

        <section class="canvas surface project-home-canvas">
          ${renderTopicHeroSection(topic, {
            kicker: '项目首页',
            returnActionHtml: '<button class="btn-secondary" data-action="open-projects">返回项目目录</button>',
          })}
          ${showFirstRunLaunchpad ? renderFirstRunLaunchpad(topic) : ''}
          ${renderTopicOverviewCards(topic)}
        </section>

        <aside class="instruction-panel surface project-trajectory-panel">
          <div>
            <div class="section-title">当前运行摘要</div>
            <div class="section-copy">项目页右侧只保留最新一次运行状态，历史失败和完成记录统一收拢到运行总览。</div>
          </div>
          ${renderTopicRunSummaryPanel(topic)}
          <div>
            <div class="section-title">运行建议</div>
            <div class="run-list">
              <div class="run-row status-callout">
                <strong>${escapeHtml(nextActionTitle)}</strong>
                <div class="run-meta">${escapeHtml(nextActionCopy)}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderWorkbenchArtifactsView(topic, note) {
  const previewItems = getPreviewItems(note);
  const executionTarget = resolveInstructionExecutionTarget(note);
  const stageList = (note.workflow?.stages || []).map((stage, index) => `
    <button class="stage-button ${activeStageIdForPreview(state.selectedPreviewKey) === stage.id ? 'active' : ''}" data-action="select-stage" data-stage="${stage.id}">
      <div class="list-label">${index + 1}. ${escapeHtml(stage.title)}</div>
      <div class="stage-meta">${escapeHtml(modelLabelForStage(stage.id))} · ${getStatusText(stage.status)}</div>
    </button>
  `).join('');

  const noteButtons = (topic.notes || []).map((item) => `
    <button class="list-button ${item.slug === state.selectedNoteSlug ? 'active' : ''}" data-action="select-note" data-note="${escapeHtml(item.slug)}">
      <div class="list-label">${escapeHtml(item.name)}</div>
      <div class="list-meta">下一步：${escapeHtml(item.workflow?.nextAction?.title || '已完成')}</div>
    </button>
  `).join('');

  const previewButtons = previewItems.map((item) => `
    <button class="preview-chip ${item.key === state.selectedPreviewKey ? 'active' : ''}" data-action="select-preview" data-preview="${escapeHtml(item.key)}">
      ${escapeHtml(item.label)}
    </button>
  `).join('');

  const instructionEntries = getInstructionEntries()
    .filter((entry) => !entry.noteSlug || entry.noteSlug === note.slug)
    .slice(0, 4)
    .map((entry) => `
      <div class="run-row">
        <strong>${escapeHtml(entry.scope)} · ${escapeHtml(entry.target || '当前对象')}</strong>
        <div class="run-meta">${escapeHtml(entry.instruction)}</div>
      </div>
    `).join('');

  return `
    <div class="tab-pane active">
      <div class="workbench-layout">
        <aside class="rail surface">
          <div class="rail-section">
            <div class="section-title">当前项目</div>
            <div class="rail-project-name">${escapeHtml(topic.name)}</div>
            <button class="btn-secondary rail-project-switch" data-action="show-overview">返回项目总览</button>
            <button class="btn-secondary rail-project-switch" data-action="show-inputs">管理输入材料</button>
          </div>
          <div class="rail-section">
            <div class="section-title">笔记</div>
            <div class="list-stack">${noteButtons}</div>
          </div>
          <div class="rail-section">
            <div class="section-title">显式阶段</div>
            <div class="stage-stack">${stageList}</div>
          </div>
        </aside>

        <section class="canvas surface">
          <div class="canvas-header">
            <div>
              <div class="canvas-context-row">
                <div class="canvas-kicker">笔记产物 / ${escapeHtml(topic.name)}</div>
                <button class="context-link" data-action="show-overview">返回项目总览</button>
                <button class="context-link" data-action="show-inputs">管理输入材料</button>
              </div>
              <h2 class="canvas-title">${escapeHtml(note.name)}</h2>
              <p class="canvas-subtitle">这里直接看当前笔记的真实阶段文件、成品 HTML、发布文案和截图。工作台里默认聚焦单个项目，不再重复铺开主题列表。</p>
              <div class="inline-stats">
                <div class="status-pill ${note.workflow?.nextAction ? 'pending' : 'done'}">${escapeHtml(note.workflow?.nextAction?.title || '工作流已完结')}</div>
                <div class="stat-chip"><strong>${escapeHtml(previewItems.length)}</strong> 可预览产物</div>
                <div class="stat-chip"><strong>${escapeHtml(note.artifacts?.slides?.length || 0)}</strong> PNG 截图</div>
              </div>
            </div>
          </div>

          <div class="preview-toolbar">${previewButtons || '<div class="empty-state">当前笔记还没有可预览产物。</div>'}</div>
          <div class="preview-canvas" id="previewCanvas"><div class="preview-empty">正在加载预览…</div></div>
        </section>

        <aside class="instruction-panel surface">
          <div>
            <div class="section-title">修改指令</div>
            <div class="section-copy">先选范围，再用自然语言描述要改哪里。现在可以单独保存，也可以直接执行返工。</div>
          </div>
          <div class="field">
            <label>作用范围</label>
            <select id="instructionScope">
              <option value="page" ${state.instructionDraft.scope === 'page' ? 'selected' : ''}>当前页面</option>
              <option value="stage" ${state.instructionDraft.scope === 'stage' ? 'selected' : ''}>当前阶段</option>
              <option value="note" ${state.instructionDraft.scope === 'note' ? 'selected' : ''}>当前笔记</option>
            </select>
          </div>
          <div class="instruction-target" id="instructionTarget">${escapeHtml(getInstructionTarget(note))}</div>
          <div class="field-hint">${executionTarget.previewKind === 'image' ? '当前从截图入口执行时，会改写对应 HTML；截图文件需要重新导出后才会同步。' : '执行会直接改写当前文件，并自动保留一份备份。'}</div>
          <textarea class="instruction-textarea" id="instructionText" placeholder="例如：第 8 页标题缩小 12%，保留总结页结构。">${escapeHtml(state.instructionDraft.text)}</textarea>
          <div class="card-actions">
            <button class="btn-secondary" data-action="save-instruction">保存修改指令</button>
            <button class="btn-primary" data-action="run-instruction" ${state.instructionRunning || !executionTarget.filePath ? 'disabled' : ''}>${state.instructionRunning ? '执行中…' : '执行修改'}</button>
          </div>
          <div>
            <div class="section-title">最近指令</div>
            <div class="run-list">${instructionEntries || '<div class="empty-state">还没有记录修改指令。</div>'}</div>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderWorkbenchInputsView(topic) {
  const inputFiles = getTopicInputFiles(topic);
  const categories = getTopicInputCategories(topic);
  const selectedCategory = getSelectedInputCategory(topic);
  const visibleFiles = getSelectedInputCategoryFiles(topic);
  const selectedFile = getSelectedInputFile(topic);
  const hasNotes = (topic.notes || []).length > 0;
  const canEditSelected = !selectedFile || isEditableTextFile(selectedFile.path);
  const categoryButtons = categories.map((category) => `
    <button class="list-button ${category.id === selectedCategory?.id ? 'active' : ''}" data-action="select-input-category" data-category="${category.id}">
      <div class="list-label">${escapeHtml(category.label)}</div>
      <div class="list-meta">${escapeHtml(category.count)} 个文件 · ${escapeHtml(category.description)}</div>
    </button>
  `).join('');
  const fileButtons = visibleFiles.map((file) => `
    <button class="list-button ${file.path === state.selectedInputFilePath ? 'active' : ''}" data-action="select-input-file" data-file-path="${escapeHtml(file.path)}">
      <div class="list-label">${escapeHtml(file.fileName)}</div>
      <div class="list-meta">${escapeHtml(file.relativePath)}</div>
    </button>
  `).join('');

  return `
    <div class="tab-pane active">
      <div class="workbench-layout">
        <aside class="rail surface">
          <div class="rail-section">
            <div class="section-title">当前项目</div>
            <div class="rail-project-name">${escapeHtml(topic.name)}</div>
            <button class="btn-secondary rail-project-switch" data-action="show-overview">返回项目总览</button>
            ${hasNotes ? '<button class="btn-secondary rail-project-switch" data-action="show-artifacts">查看笔记产物</button>' : '<button class="btn-secondary rail-project-switch" data-action="open-projects">返回项目列表</button>'}
          </div>
          <div class="rail-section">
            <div class="section-title">材料类别</div>
            <div class="list-stack">${categoryButtons || '<div class="empty-state">当前项目输入目录还没有文件。</div>'}</div>
          </div>
          <div class="rail-section">
            <div class="section-title">${escapeHtml(selectedCategory?.label || '输入文件')}</div>
            <div class="list-stack">${fileButtons || '<div class="empty-state">当前类别还没有文件。</div>'}</div>
          </div>
        </aside>

        <section class="canvas surface">
          <div class="canvas-header">
            <div>
              <div class="canvas-context-row">
                <div class="canvas-kicker">输入材料 / ${escapeHtml(topic.name)}</div>
                <button class="context-link" data-action="show-overview">返回项目总览</button>
                ${hasNotes ? '<button class="context-link" data-action="show-artifacts">查看笔记产物</button>' : '<button class="context-link" data-action="open-projects">返回项目列表</button>'}
              </div>
              <h2 class="canvas-title">${hasNotes ? '编辑原始输入材料' : '新项目准备区'}</h2>
              <p class="canvas-subtitle">${hasNotes ? '这里可以直接修改当前项目的输入材料、任务说明、补充素材和模板文件。' : '这个项目还没有产出 Note。先在这里补充任务说明、原始材料或上传附件，然后再继续后续流程。'}</p>
              <div class="inline-stats">
                <div class="stat-chip"><strong>${escapeHtml(inputFiles.length)}</strong> 输入文件</div>
                <div class="stat-chip"><strong>${escapeHtml((topic.notes || []).length)}</strong> 已产出笔记</div>
                <div class="stat-chip"><strong>${escapeHtml(selectedCategory?.count || 0)}</strong> 当前分类文件</div>
              </div>
            </div>
          </div>

          <div class="field">
            <label>${selectedFile ? '当前文件' : '新文件名'}</label>
            ${selectedFile
              ? `<div class="instruction-target">${escapeHtml(selectedFile.relativePath)}</div>`
              : `<input id="inputDraftName" placeholder="例如：source_material.md" value="${escapeHtml(state.inputDraftName)}" />`}
          </div>
          <div class="field-hint">${escapeHtml(selectedCategory?.description || '')}</div>
          <div id="inputEditorArea">
            ${state.inputLoading
              ? '<div class="empty-state">正在加载输入文件…</div>'
              : selectedFile && !canEditSelected
                ? `<div class="empty-state">当前文件类型暂不支持在线编辑：${escapeHtml(selectedFile.relativePath)}。你仍然可以上传同名文件替换，或在输入目录中继续补充文本材料。</div>`
                : `<textarea class="input-editor-textarea" id="inputDraftContent" placeholder="把任务说明、原始材料、补充笔记或联网检索后的内容直接粘贴到这里。">${escapeHtml(state.inputDraftContent)}</textarea>`}
          </div>
        </section>

        <aside class="instruction-panel surface">
          <div>
            <div class="section-title">输入材料操作</div>
            <div class="section-copy">所有会影响项目输入文件的动作，都应该能在这里完成，而不是回到文件系统手工改。</div>
          </div>
          <div class="card-actions">
            <button class="btn-primary" data-action="save-input-file" ${state.inputSaving || state.inputLoading || (selectedFile && !canEditSelected) ? 'disabled' : ''}>${state.inputSaving ? '保存中…' : '保存输入材料'}</button>
            <button class="btn-secondary" data-action="new-input-file">新建文本材料</button>
            <button class="btn-secondary" data-action="trigger-upload-input" ${state.inputUploading ? 'disabled' : ''}>${state.inputUploading ? '上传中…' : '上传材料'}</button>
          </div>
          <div class="field-hint">上传会放到当前项目输入目录；如果你当前选中了某个输入文件，会优先上传到它所在的目录。</div>
          <div class="section-title">当前状态</div>
          <div class="run-list">
            <div class="run-row">
              <strong>${(topic.notes || []).length === 0 ? '还没有产出笔记' : '已有产出，可回到预览继续检查'}</strong>
              <div class="run-meta">${escapeHtml(topic.inputDir || '未找到输入目录')}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderWorkbenchView() {
  const topic = getSelectedTopic();
  const note = getSelectedNote();

  if (!topic) {
    return renderWorkbenchOnboarding({
      contextTitle: '当前工作区还没有可识别主题',
      contextCopy: '先连接真实 workspace，再新建任务。创建后系统会自动进入首轮生成，你回来时应该看到的是项目总览和运行状态，而不是空白面板。',
    });
  }

  if (state.workbenchMode === 'overview') {
    return renderWorkbenchOverviewView(topic);
  }

  if (state.workbenchMode === 'inputs' || !note) {
    return renderWorkbenchInputsView(topic);
  }

  return renderWorkbenchArtifactsView(topic, note);
}

function renderProjectsView() {
  const topics = state.overview?.topics || [];
  const selected = getSelectedTopic() || topics[0] || null;

  if (!topics.length) {
    return renderWorkbenchOnboarding({
      contextTitle: '当前项目目录还是空的',
      contextCopy: '项目页不应该只显示一句“暂无主题”。这里应该直接告诉你如何挂工作区、创建任务，并让首轮生成顺滑发生。',
    });
  }

  return `
    <div class="tab-pane active">
      <div class="projects-home">
        ${renderTopicHeroSection(selected, {
          kicker: '焦点项目',
          context: 'projects',
          description: '项目页顶部应该先像真正的产品首页一样，讲清楚这个项目现在能做什么、跑到了哪一步，以及下一步该去哪。',
          returnActionHtml: `<button class="btn-danger" data-action="delete-topic" data-topic="${escapeHtml(selected.slug)}" ${state.deletingTopicSlug === selected.slug ? 'disabled' : ''}>${state.deletingTopicSlug === selected.slug ? '删除中…' : '删除项目'}</button>`,
        })}
        ${renderTopicOverviewCards(selected, { context: 'projects' })}
        <div class="project-home-grid">
          <section class="surface content-column project-directory-panel">
            <div class="section-title">项目目录</div>
            <div class="section-copy">这里负责切换焦点项目和进入具体工作台，不再使用“左列表右摘要”的后台式结构。</div>
            <div class="project-directory-grid">${renderProjectDirectoryCards(topics, selected.slug)}</div>
          </section>
          <aside class="surface content-column">
            <div class="section-title">当前运行摘要</div>
            <div class="section-copy">当前聚焦项目：${escapeHtml(selected.name)}，历史运行统一进入运行总览查看。</div>
            ${renderTopicRunSummaryPanel(selected)}
          </aside>
        </div>
      </div>
    </div>
  `;
}

function renderRunsView() {
  const notes = getAllNotes();
  const blockedNotes = notes.filter((note) => (note.workflow?.stages || []).some((stage) => stage.status === 'blocked'));
  const pendingNotes = notes.filter((note) => note.workflow?.nextAction);
  const ledgerRuns = getLedgerRuns();

  return `
    <div class="tab-pane active">
      <div class="runs-layout">
        <section class="content-column surface">
          <div class="section-title">运行总览</div>
          <div class="field-grid">
            <div class="matrix-row">
              <div>
              <div class="matrix-title">运行账本</div>
              <div class="field-hint">RedCube 持久化的运行态记录</div>
            </div>
              <div class="status-pill pending">${ledgerRuns.length} 条记录</div>
            </div>
            <div class="matrix-row">
              <div>
                <div class="matrix-title">待处理笔记</div>
                <div class="field-hint">还有下一步动作的单篇</div>
              </div>
              <div class="status-pill pending">${pendingNotes.length} 篇</div>
            </div>
            <div class="matrix-row">
              <div>
                <div class="matrix-title">阻断笔记</div>
                <div class="field-hint">存在阶段依赖未满足的单篇</div>
              </div>
              <div class="status-pill blocked">${blockedNotes.length} 篇</div>
            </div>
          </div>
          <div class="section-title" style="margin-top:8px;">阻断明细</div>
          <div class="run-list">
            ${blockedNotes.length
              ? blockedNotes.map((note) => `
                <div class="run-row">
                  <strong>${escapeHtml(note.name)}</strong>
                  <div class="run-meta">${escapeHtml(note.workflow?.nextAction?.title || '等待上游阶段补齐')}</div>
                </div>
              `).join('')
              : '<div class="empty-state">当前没有阻断项。</div>'}
          </div>
        </section>

        <aside class="content-column surface">
          <div class="section-title">最近运行</div>
          <div class="run-list">
            ${ledgerRuns.length
              ? ledgerRuns.slice(0, 6).map((run) => `
                <div class="run-row">
                  <strong>${escapeHtml(run.kind || 'run')} · ${escapeHtml(run.defaultModelId || '未配置模型')}</strong>
                  <div class="run-meta">${escapeHtml(run.status || 'unknown')} · ${escapeHtml(run.summary?.successTasks ?? '')}/${escapeHtml(run.summary?.totalTasks ?? '')} 任务成功</div>
                </div>
              `).join('')
              : '<div class="empty-state">还没有 smoke run 记录。</div>'}
          </div>
          <div class="section-title" style="margin-top:8px;">最近动作</div>
          <div class="run-list">
            ${state.logs.length
              ? state.logs.map((entry) => `
                <div class="run-row">
                  <strong>${escapeHtml(entry.time)} · ${escapeHtml(entry.title)}</strong>
                  <div class="run-meta">${escapeHtml(entry.detail)}</div>
                </div>
              `).join('')
              : '<div class="empty-state">这里会显示最近的界面动作和运行摘要。</div>'}
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderModelsView() {
  const config = state.modelConfig;
  if (!config) {
    return '<div class="empty-state">尚未加载模型配置。</div>';
  }

  const options = [
    '<option value="">继承默认</option>',
    ...(config.models || []).map((model) => `
      <option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.modelName || model.id)}</option>
    `),
  ].join('');

  const matrix = STAGE_LABELS.map((stage) => `
    <div class="matrix-row">
      <div>
        <div class="matrix-title">${escapeHtml(stage.label)}</div>
        <div class="field-hint">留空则继承默认模型</div>
      </div>
      <div class="field">
        <select data-kind="stage-override" data-stage="${stage.id}">
          ${options.replace(`value="${escapeHtml(config.stageOverrides?.[stage.id] || '')}"`, `value="${escapeHtml(config.stageOverrides?.[stage.id] || '')}" selected`)}
        </select>
      </div>
    </div>
  `).join('');

  const modelList = (config.models || []).map((model) => `
    <span class="model-chip">${escapeHtml(model.label || model.modelName || model.id)}</span>
  `).join('');

  return `
    <div class="tab-pane active">
      <div class="models-layout">
        <section class="content-column surface">
          <div class="section-title">工作流模型</div>
          <div class="section-copy">这里专门负责默认模型和阶段覆盖。供应商、Base URL、API Key 和模型库维护已经收进独立设置页。</div>
          <div class="field-grid">
            <div class="field">
              <label>默认模型</label>
              <select data-kind="default-model">
                <option value="">请选择默认模型</option>
                ${(config.models || []).map((model) => `
                  <option value="${escapeHtml(model.id)}" ${model.id === config.defaultModelId ? 'selected' : ''}>
                    ${escapeHtml(model.label || model.modelName || model.id)}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="model-list">${modelList || '<span class="model-chip">暂无模型</span>'}</div>
          <div class="save-bar">
            <button class="btn-primary" data-action="save-model-config">保存工作流模型</button>
            <button class="btn-secondary" data-action="run-workflow-smoke" ${state.smokeRunning ? 'disabled' : ''} style="margin-left:10px;">${state.smokeRunning ? '验证中…' : '一键跑一轮'}</button>
            <a class="button-link btn-secondary" href="/settings?workspaceRoot=${encodeURIComponent(getWorkspaceRoot())}" style="margin-left:10px;">打开模型设置</a>
          </div>
        </section>

        <aside class="content-column surface">
          <div class="section-title">阶段覆盖</div>
          <div class="matrix-grid">${matrix}</div>
        </aside>
      </div>
    </div>
  `;
}

function renderContent() {
  if (state.activeTab === 'projects') return renderProjectsView();
  if (state.activeTab === 'runs') return renderRunsView();
  if (state.activeTab === 'models') return renderModelsView();
  return renderWorkbenchView();
}

function render() {
  syncUrl();
  syncSettingsLink();
  renderWorkspaceBadge();
  renderTabs();
  renderMetrics();
  el.contentRoot.innerHTML = renderContent();
  renderWorkbenchSupplemental();
  syncWorkflowPolling();
}

function renderWorkbenchSupplemental() {
  if (state.activeTab !== 'workbench') return;
  if (state.workbenchMode === 'overview') return;
  if (state.workbenchMode === 'inputs' || !getSelectedNote()) {
    if (state.selectedInputFilePath && !isEditableTextFile(state.selectedInputFilePath)) {
      state.inputDraftLoadedPath = state.selectedInputFilePath;
      state.inputDraftContent = '';
      return;
    }
    if (state.selectedInputFilePath && state.inputDraftLoadedPath !== state.selectedInputFilePath && !state.inputLoading) {
      loadInputDraft(state.selectedInputFilePath);
    }
    return;
  }
  renderPreviewCanvas();
}

async function renderPreviewCanvas() {
  if (state.activeTab !== 'workbench') return;

  const note = getSelectedNote();
  const canvas = document.getElementById('previewCanvas');
  if (!note || !canvas) return;

  const item = getPreviewItems(note).find((entry) => entry.key === state.selectedPreviewKey);
  canvas.className = 'preview-canvas';
  if (!item) {
    canvas.innerHTML = '<div class="preview-empty">选择一个阶段文档、HTML 或截图开始预览。</div>';
    return;
  }

  try {
    const payload = await readPreview(item.filePath);
    if (item.type === 'html') {
      canvas.classList.add('phone-canvas');
      canvas.innerHTML = `<iframe class="html-viewer" title="${escapeHtml(item.label)}"></iframe>`;
      const frame = canvas.querySelector('iframe');
      frame.srcdoc = payload.content;
      return;
    }

    if (item.type === 'image') {
      const imagePayload = await readPreview(item.filePath);
      canvas.classList.add('phone-canvas');
      canvas.classList.add('image-preview');
      canvas.innerHTML = `
        <div class="image-stage">
          <div class="slide-frame">
            <div class="slide-image-box">
              <img alt="${escapeHtml(item.label)}" src="${imagePayload.content}" />
            </div>
          </div>
        </div>
      `;
      return;
    }

    canvas.innerHTML = `<div class="doc-viewer">${escapeHtml(payload.content)}</div>`;
  } catch (error) {
    canvas.innerHTML = `<div class="preview-empty">预览加载失败：${escapeHtml(String(error))}</div>`;
  }
}

function activeStageIdForPreview(previewKey) {
  const mapping = {
    'stage-planning': 'planning',
    'stage-outline': 'infographic_outline',
    'stage-visual': 'visual_direction',
    'stage-html-doc': 'html_generation',
    'artifact-html': 'html_generation',
    'stage-copy-doc': 'publish_copy',
    'artifact-copy': 'publish_copy',
    'stage-review-doc': 'visual_review',
  };
  return mapping[previewKey] || '';
}

function resolveInstructionExecutionTarget(note) {
  const preview = getSelectedPreviewItem(note);
  const fallbackStageId = activeStageIdForPreview(state.selectedPreviewKey) || note?.workflow?.nextAction?.stageId || 'planning';
  const stageId = state.instructionDraft.scope === 'note'
    ? fallbackStageId
    : activeStageIdForPreview(state.selectedPreviewKey) || fallbackStageId;

  if (!preview) {
    return {
      filePath: '',
      stageId,
      pageNumber: null,
      previewKind: 'text',
    };
  }

  if (preview.type === 'image') {
    const pageMatch = preview.label.match(/(\d+)/);
    return {
      filePath: note?.artifacts?.html?.path || '',
      stageId: 'html_generation',
      pageNumber: pageMatch ? Number.parseInt(pageMatch[1], 10) : null,
      previewKind: 'image',
    };
  }

  return {
    filePath: preview.filePath,
    stageId: stageId || 'planning',
    pageNumber: null,
    previewKind: preview.type || 'text',
  };
}

async function saveModelConfig() {
  state.modelConfig = await requestJson('/api/SaveWorkflowModelSelection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      defaultModelId: state.modelConfig.defaultModelId,
      stageOverrides: state.modelConfig.stageOverrides,
    }),
  });
  logAction('工作流模型已保存', '默认模型和阶段覆盖已写入 RedCube 配置。');
  render();
}

async function runWorkflowSmoke() {
  state.smokeRunning = true;
  render();
  const result = await requestJson('/api/RunWorkflowSmoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
    }),
  });
  await loadOverview();
  state.smokeRunning = false;
  logAction(
    'Smoke workflow 完成',
    `默认模型 ${result.defaultModelId || '未配置'} · ${result.workflow.successTasks}/${result.workflow.totalTasks} 任务成功`,
  );
  render();
}

function getInstructionTarget(note) {
  if (!note) return '未选择笔记';

  if (state.instructionDraft.scope === 'note') {
    return `当前笔记：${note.name}`;
  }

  if (state.instructionDraft.scope === 'stage') {
    const activeStage = (note.workflow?.stages || []).find((stage) => stage.id === activeStageIdForPreview(state.selectedPreviewKey));
    return `当前阶段：${activeStage?.title || '未定位阶段'}`;
  }

  const preview = getPreviewItems(note).find((item) => item.key === state.selectedPreviewKey);
  return `当前页面：${preview?.label || '未选择预览'}`;
}

async function saveInstruction() {
  const note = getSelectedNote();
  const result = await requestJson('/api/SaveWorkbenchInstruction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      scope: state.instructionDraft.scope,
      target: getInstructionTarget(note),
      noteSlug: note?.slug || '',
      instruction: state.instructionDraft.text,
    }),
  });

  await loadOverview();
  state.instructionDraft.text = '';
  logAction('已记录修改指令', `${result.entry.scope} · ${result.entry.target}`);
  render();
}

async function runInstruction() {
  const note = getSelectedNote();
  const executionTarget = resolveInstructionExecutionTarget(note);
  state.instructionRunning = true;
  render();

  const result = await requestJson('/api/RunWorkbenchInstruction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      topic: note?.topicSlug || state.selectedTopicSlug || '',
      scope: state.instructionDraft.scope,
      target: getInstructionTarget(note),
      noteSlug: note?.slug || '',
      instruction: state.instructionDraft.text,
      stageId: executionTarget.stageId,
      filePath: executionTarget.filePath,
      pageNumber: executionTarget.pageNumber,
      previewKind: executionTarget.previewKind,
    }),
  });

  clearPreviewCache([executionTarget.filePath, note?.artifacts?.html?.path]);
  await loadOverview();
  state.instructionDraft.text = '';
  state.instructionRunning = false;

  if (executionTarget.previewKind === 'image' && note?.artifacts?.html?.path) {
    state.selectedPreviewKey = 'artifact-html';
  }

  logAction(
    '修改已执行',
    result.run.summary?.rerun?.ok
      ? `已自动局部重跑 · ${result.entry.scope} · ${result.entry.target}`
      : `${result.entry.scope} · ${result.entry.target}`,
  );
  render();
}

async function createTask() {
  const result = await requestJson('/api/CreateWorkbenchTopic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      topic: el.createTaskTopic.value,
      brief: el.createTaskBrief.value,
      rawMaterialsText: el.createTaskMaterials.value,
      webResearchEnabled: el.createTaskWebResearch.checked,
    }),
  });

  state.activeTab = 'workbench';
  el.createTaskModal.classList.remove('open');
  el.createTaskTopic.value = '';
  el.createTaskBrief.value = '';
  el.createTaskMaterials.value = '';
  el.createTaskWebResearch.checked = false;
  await loadOverview();
  state.selectedTopicSlug = result.topic;
  state.selectedNoteSlug = '';
  state.selectedPreviewKey = '';
  state.selectedInputCategory = 'task_brief';
  state.selectedInputFilePath = '';
  state.inputDraftLoadedPath = '';
  state.workbenchMode = 'overview';
  logAction('已创建新任务', `${result.topic} · ${result.webResearchEnabled ? '允许联网搜集' : '本地材料优先'}`);
  render();

  try {
    await startTopicWorkflow(result.topic);
  } catch (error) {
    logAction('首轮生成未启动', String(error));
    render();
  }
}

function toggleWorkspaceEditor(forceOpen = null) {
  const nextOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : !el.workspaceEditor.classList.contains('open');
  el.workspaceEditor.classList.toggle('open', nextOpen);
  if (nextOpen) {
    queueMicrotask(() => el.workspaceRoot.focus());
  }
}

function openCreateTaskModal() {
  el.createTaskModal.classList.add('open');
  queueMicrotask(() => el.createTaskTopic.focus());
}

function closeCreateTaskModal() {
  el.createTaskModal.classList.remove('open');
}

function updateModelSelection(target) {
  const { kind, stage } = target.dataset;
  if (!state.modelConfig) return;

  if (kind === 'default-model') {
    state.modelConfig.defaultModelId = target.value;
  } else if (kind === 'stage-override') {
    if (!target.value) {
      delete state.modelConfig.stageOverrides[stage];
    } else {
      state.modelConfig.stageOverrides[stage] = target.value;
    }
  }
}

document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  try {
    if (action === 'refresh-overview') {
      await Promise.all([loadOverview(), loadModelConfig()]);
      logAction('工作区已刷新', getWorkspaceRoot());
      render();
      return;
    }

    if (action === 'select-tab') {
      state.activeTab = target.dataset.tab || 'workbench';
      render();
      return;
    }

    if (action === 'toggle-workspace-editor') {
      toggleWorkspaceEditor();
      return;
    }

    if (action === 'open-create-task') {
      openCreateTaskModal();
      return;
    }

    if (action === 'select-topic') {
      state.selectedTopicSlug = target.dataset.topic;
      state.selectedNoteSlug = getSelectedTopic()?.notes?.[0]?.slug || '';
      state.selectedPreviewKey = pickDefaultPreview(getSelectedNote());
      state.selectedInputCategory = 'task_brief';
      state.selectedInputFilePath = '';
      state.workbenchMode = 'overview';
      state.activeTab = 'workbench';
      logAction('切换主题', state.selectedTopicSlug);
      render();
      return;
    }

    if (action === 'select-note') {
      state.selectedNoteSlug = target.dataset.note;
      state.selectedPreviewKey = pickDefaultPreview(getSelectedNote());
      state.workbenchMode = 'artifacts';
      logAction('切换笔记', state.selectedNoteSlug);
      render();
      focusWorkbenchElement('previewCanvas');
      return;
    }

    if (action === 'select-stage') {
      const stageId = target.dataset.stage;
      const previewMap = {
        planning: 'stage-planning',
        infographic_outline: 'stage-outline',
        visual_direction: 'stage-visual',
        html_generation: 'artifact-html',
        publish_copy: 'stage-copy-doc',
        visual_review: 'stage-review-doc',
      };
      state.selectedPreviewKey = previewMap[stageId] || state.selectedPreviewKey;
      logAction('定位阶段', STAGE_LABELS.find((item) => item.id === stageId)?.label || stageId);
      render();
      focusWorkbenchElement('previewCanvas');
      return;
    }

    if (action === 'select-preview') {
      state.selectedPreviewKey = target.dataset.preview;
      logAction('切换预览', state.selectedPreviewKey);
      render();
      focusWorkbenchElement('previewCanvas');
      return;
    }

    if (action === 'open-projects') {
      state.activeTab = 'projects';
      render();
      return;
    }

    if (action === 'focus-project') {
      state.selectedTopicSlug = target.dataset.topic || state.selectedTopicSlug;
      render();
      return;
    }

    if (action === 'show-overview') {
      state.workbenchMode = 'overview';
      render();
      return;
    }

    if (action === 'show-inputs') {
      syncInputSelection(getSelectedTopic());
      state.workbenchMode = 'inputs';
      render();
      focusWorkbenchElement('inputEditorArea');
      return;
    }

    if (action === 'show-artifacts') {
      state.workbenchMode = 'artifacts';
      render();
      focusWorkbenchElement('previewCanvas');
      return;
    }

    if (action === 'open-topic') {
      state.selectedTopicSlug = target.dataset.topic;
      state.selectedNoteSlug = getSelectedTopic()?.notes?.[0]?.slug || '';
      state.selectedPreviewKey = pickDefaultPreview(getSelectedNote());
      state.selectedInputCategory = 'task_brief';
      state.selectedInputFilePath = '';
      state.workbenchMode = 'overview';
      state.activeTab = 'workbench';
      render();
      focusWorkbenchElement('contentRoot');
      return;
    }

    if (action === 'open-topic-mode') {
      state.selectedTopicSlug = target.dataset.topic;
      state.selectedNoteSlug = getSelectedTopic()?.notes?.[0]?.slug || '';
      state.selectedPreviewKey = pickDefaultPreview(getSelectedNote());
      state.selectedInputCategory = 'task_brief';
      state.selectedInputFilePath = '';
      state.workbenchMode = ['overview', 'inputs', 'artifacts'].includes(target.dataset.mode) ? target.dataset.mode : 'overview';
      state.activeTab = 'workbench';
      render();
      focusWorkbenchElement(state.workbenchMode === 'inputs' ? 'inputEditorArea' : 'contentRoot');
      return;
    }

    if (action === 'delete-topic') {
      await deleteTopic(target.dataset.topic || '');
      return;
    }

    if (action === 'start-topic-workflow') {
      await startTopicWorkflow(target.dataset.topic || '');
      return;
    }

    if (action === 'select-input-file') {
      state.selectedInputFilePath = target.dataset.filePath;
      state.inputDraftLoadedPath = '';
      state.inputDraftName = '';
      state.selectedInputCategory = getSelectedInputFile()?.category || state.selectedInputCategory;
      render();
      focusWorkbenchElement('inputEditorArea');
      return;
    }

    if (action === 'select-input-category') {
      state.selectedInputCategory = target.dataset.category;
      const categoryFile = getTopicInputFiles(getSelectedTopic()).filter((file) => file.category === state.selectedInputCategory)[0];
      state.selectedInputFilePath = categoryFile?.path || '';
      state.inputDraftLoadedPath = '';
      state.inputDraftName = '';
      render();
      focusWorkbenchElement('inputEditorArea');
      return;
    }

    if (action === 'save-model-config') {
      await saveModelConfig();
      return;
    }

    if (action === 'run-workflow-smoke') {
      await runWorkflowSmoke();
      return;
    }

    if (action === 'save-instruction') {
      await saveInstruction();
      return;
    }

    if (action === 'run-instruction') {
      await runInstruction();
      return;
    }

    if (action === 'save-input-file') {
      await saveInputDraft();
      return;
    }

    if (action === 'new-input-file') {
      state.selectedInputFilePath = '';
      state.inputDraftLoadedPath = '';
      state.inputDraftContent = '';
      state.inputDraftName = state.inputDraftName || (state.selectedInputCategory === 'template' ? 'new_template.md' : 'new_material.md');
      state.workbenchMode = 'inputs';
      render();
      return;
    }

    if (action === 'trigger-upload-input') {
      el.inputFileUpload.value = '';
      el.inputFileUpload.click();
      return;
    }
  } catch (error) {
    state.smokeRunning = false;
    state.instructionRunning = false;
    state.inputSaving = false;
    state.inputUploading = false;
    state.workflowRunningTopicSlug = '';
    logAction('操作失败', String(error));
    render();
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;

  if (target.id === 'workspaceRoot') {
    syncSettingsLink();
    syncUrl();
    renderWorkspaceBadge();
    return;
  }

  if (target.id === 'instructionScope') {
    state.instructionDraft.scope = target.value;
    render();
    return;
  }

  if (target.id === 'instructionText') {
    state.instructionDraft.text = target.value;
    return;
  }

  if (target.id === 'inputDraftName') {
    state.inputDraftName = target.value;
    return;
  }

  if (target.id === 'inputDraftContent') {
    state.inputDraftContent = target.value;
    return;
  }

  if (target.dataset.kind) {
    updateModelSelection(target);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  el.workspaceRoot.value = params.get('workspaceRoot') || '';
  el.toggleWorkspaceBtn.addEventListener('click', () => {
    toggleWorkspaceEditor();
  });
  el.openCreateTaskBtn.addEventListener('click', () => {
    openCreateTaskModal();
  });
  el.closeCreateTaskBtn.addEventListener('click', () => {
    closeCreateTaskModal();
  });
  el.submitCreateTaskBtn.addEventListener('click', async () => {
    try {
      await createTask();
    } catch (error) {
      logAction('创建任务失败', String(error));
      render();
    }
  });
  el.inputFileUpload.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.files?.[0]) return;
    try {
      await uploadInputFile(target.files[0]);
    } catch (error) {
      state.inputUploading = false;
      logAction('上传材料失败', String(error));
      render();
    }
  });
  el.createTaskModal.addEventListener('click', (event) => {
    if (event.target === el.createTaskModal) {
      closeCreateTaskModal();
    }
  });
  const requestedTab = params.get('tab');
  if (requestedTab && TABS.some((tab) => tab.id === requestedTab)) {
    state.activeTab = requestedTab;
  }
  const requestedTopic = params.get('topic');
  const requestedNote = params.get('note');
  const requestedPreview = params.get('preview');
  const requestedMode = params.get('mode');
  if (requestedTopic) state.selectedTopicSlug = requestedTopic;
  if (requestedNote) state.selectedNoteSlug = requestedNote;
  if (requestedPreview) state.selectedPreviewKey = requestedPreview;
  if (requestedMode && ['overview', 'inputs', 'artifacts'].includes(requestedMode)) {
    state.workbenchMode = requestedMode;
  }
  loadInitial();
});
