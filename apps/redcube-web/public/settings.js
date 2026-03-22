const state = {
  config: null,
  runtimeConfig: null,
  logs: [],
};

const el = {
  workspaceRoot: document.getElementById('workspaceRoot'),
  workspaceBadgeValue: document.getElementById('workspaceBadgeValue'),
  toggleWorkspaceBtn: document.getElementById('toggleWorkspaceBtn'),
  summaryText: document.getElementById('summaryText'),
  providerList: document.getElementById('providerList'),
  modelList: document.getElementById('modelList'),
  logList: document.getElementById('logList'),
  backLink: document.getElementById('backLink'),
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
  state.logs = state.logs.slice(0, 8);
  renderLogs();
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

function syncBackLink() {
  const params = new URLSearchParams({ workspaceRoot: getWorkspaceRoot() });
  el.backLink.href = `/?${params.toString()}`;
}

function renderWorkspaceBadge() {
  el.workspaceBadgeValue.textContent = getWorkspaceRoot();
}

function applyWorkspaceRoot(workspaceRoot) {
  const nextWorkspaceRoot = String(workspaceRoot || '').trim();
  el.workspaceRoot.value = nextWorkspaceRoot;
  if (state.runtimeConfig) {
    state.runtimeConfig.workspaceRoot = nextWorkspaceRoot;
  }
  syncBackLink();
  renderWorkspaceBadge();
}

async function loadConfig() {
  const params = new URLSearchParams({ workspaceRoot: getWorkspaceRoot() });
  state.config = await requestJson(`/api/GetModelConfig?${params.toString()}`);
  render();
}

async function loadRuntimeDefaults() {
  state.runtimeConfig = await requestJson('/api/GetRuntimeConfig');
  if (!el.workspaceRoot.value.trim()) {
    applyWorkspaceRoot(state.runtimeConfig.workspaceRoot || '');
    return;
  }
  syncBackLink();
  renderWorkspaceBadge();
}

async function selectWorkspaceDirectory() {
  const result = await requestJson('/api/SelectWorkspaceDirectory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      defaultPath: getWorkspaceRoot(),
    }),
  });

  if (result.canceled || !result.path) {
    logAction('未切换工作区', '你取消了目录选择。');
    return;
  }

  applyWorkspaceRoot(result.path);
  await loadConfig();
  logAction('工作区已切换', result.path);
}

async function saveConfig() {
  state.config = await requestJson('/api/SaveModelConfig', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceRoot: getWorkspaceRoot(),
      providers: state.config.providers,
      models: state.config.models,
      defaultModelId: state.config.defaultModelId,
      stageOverrides: state.config.stageOverrides,
    }),
  });
  render();
  logAction('模型设置已保存', '供应商、Base URL、API Key 与模型库都已写入配置。');
}

function providerOptions(selectedValue = '') {
  const providers = state.config?.providers || [];
  return [
    '<option value="">请选择供应商</option>',
    ...providers.map((provider) => `
      <option value="${escapeHtml(provider.id)}" ${provider.id === selectedValue ? 'selected' : ''}>
        ${escapeHtml(provider.name || provider.id)}
      </option>
    `),
  ].join('');
}

function renderProviders() {
  const providers = state.config?.providers || [];
  el.providerList.innerHTML = providers.length
    ? providers.map((provider, index) => `
      <div class="card">
        <div class="field-grid">
          <div class="field">
            <label>供应商名称</label>
            <input data-kind="provider" data-index="${index}" data-field="name" value="${escapeHtml(provider.name || '')}" />
          </div>
          <div class="field">
            <label>Provider ID</label>
            <input data-kind="provider" data-index="${index}" data-field="id" value="${escapeHtml(provider.id || '')}" />
          </div>
          <div class="field">
            <label>Base URL</label>
            <input data-kind="provider" data-index="${index}" data-field="baseURL" value="${escapeHtml(provider.baseURL || '')}" />
          </div>
          <div class="field">
            <label>API Key</label>
            <input data-kind="provider" data-index="${index}" data-field="apiKey" value="${escapeHtml(provider.apiKey || '')}" />
          </div>
        </div>
        <div class="card-actions" style="margin-top:12px;">
          <button class="button-mini danger" data-action="remove-provider" data-index="${index}">删除供应商</button>
        </div>
      </div>
    `).join('')
    : '<div class="empty">还没有供应商，先新增一个 OpenAI-compatible endpoint。</div>';
}

function renderModels() {
  const models = state.config?.models || [];
  el.modelList.innerHTML = models.length
    ? models.map((model, index) => `
      <div class="card">
        <div class="field-grid">
          <div class="field">
            <label>模型标签</label>
            <input data-kind="model" data-index="${index}" data-field="label" value="${escapeHtml(model.label || '')}" />
          </div>
          <div class="field">
            <label>模型 ID</label>
            <input data-kind="model" data-index="${index}" data-field="id" value="${escapeHtml(model.id || '')}" />
          </div>
          <div class="field">
            <label>真实模型名</label>
            <input data-kind="model" data-index="${index}" data-field="modelName" value="${escapeHtml(model.modelName || '')}" />
          </div>
          <div class="field">
            <label>所属供应商</label>
            <select data-kind="model" data-index="${index}" data-field="providerId">
              ${providerOptions(model.providerId || '')}
            </select>
          </div>
        </div>
        <div class="card-actions" style="margin-top:12px;">
          <button class="button-mini danger" data-action="remove-model" data-index="${index}">删除模型</button>
        </div>
      </div>
    `).join('')
    : '<div class="empty">还没有模型条目。新增后首页工作台就能选择这些模型。</div>';
}

function renderLogs() {
  el.logList.innerHTML = state.logs.length
    ? state.logs.map((entry) => `
      <div class="log-card">
        <strong>${escapeHtml(entry.time)} · ${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.detail)}</span>
      </div>
    `).join('')
    : '<div class="empty">这里会显示最近的配置动作。</div>';
}

function renderSummary() {
  const providerCount = state.config?.providers?.length || 0;
  const modelCount = state.config?.models?.length || 0;
  el.summaryText.textContent = `${providerCount} 个供应商 · ${modelCount} 个模型`;
}

function render() {
  syncBackLink();
  renderWorkspaceBadge();
  renderSummary();
  renderProviders();
  renderModels();
  renderLogs();
}

function addProvider() {
  state.config.providers.push({
    id: `provider-${Date.now()}`,
    name: '新供应商',
    baseURL: '',
    apiKey: '',
  });
  render();
  logAction('新增供应商', '已创建新的供应商配置行。');
}

function addModel() {
  state.config.models.push({
    id: `model-${Date.now()}`,
    providerId: state.config.providers[0]?.id || '',
    label: '新模型',
    modelName: '',
  });
  render();
  logAction('新增模型', '已创建新的模型条目。');
}

function removeProvider(index) {
  const [removed] = state.config.providers.splice(index, 1);
  if (!removed) return;
  state.config.models = state.config.models.filter((model) => model.providerId !== removed.id);
  if (state.config.defaultModelId && !state.config.models.some((model) => model.id === state.config.defaultModelId)) {
    state.config.defaultModelId = '';
  }
  for (const [stageId, modelId] of Object.entries(state.config.stageOverrides || {})) {
    if (!state.config.models.some((model) => model.id === modelId)) {
      delete state.config.stageOverrides[stageId];
    }
  }
  render();
  logAction('删除供应商', '关联模型已同步清理。');
}

function removeModel(index) {
  const [removed] = state.config.models.splice(index, 1);
  if (!removed) return;
  if (state.config.defaultModelId === removed.id) {
    state.config.defaultModelId = '';
  }
  for (const [stageId, modelId] of Object.entries(state.config.stageOverrides || {})) {
    if (modelId === removed.id) {
      delete state.config.stageOverrides[stageId];
    }
  }
  render();
  logAction('删除模型', '默认模型和阶段覆盖已同步修正。');
}

function updateBoundValue(target) {
  const { kind, index, field } = target.dataset;
  if (!state.config) return;
  if (kind === 'provider') {
    state.config.providers[index][field] = target.value;
  } else if (kind === 'model') {
    state.config.models[index][field] = target.value;
  }
  render();
}

document.getElementById('refreshBtn').addEventListener('click', async () => {
  try {
    await loadConfig();
    logAction('已刷新', getWorkspaceRoot());
  } catch (error) {
    logAction('刷新失败', String(error));
  }
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  try {
    await saveConfig();
  } catch (error) {
    logAction('保存失败', String(error));
  }
});

document.getElementById('addProviderBtn').addEventListener('click', addProvider);
document.getElementById('addModelBtn').addEventListener('click', addModel);
el.toggleWorkspaceBtn.addEventListener('click', () => {
  void selectWorkspaceDirectory().catch((error) => {
    logAction('切换工作区失败', String(error));
  });
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  if (action === 'remove-provider') {
    removeProvider(Number(target.dataset.index));
  } else if (action === 'remove-model') {
    removeModel(Number(target.dataset.index));
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target.dataset.kind) {
    updateBoundValue(target);
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  el.workspaceRoot.value = params.get('workspaceRoot') || '';
  syncBackLink();
  try {
    await loadRuntimeDefaults();
    await loadConfig();
    logAction('模型设置已载入', '可以在这里维护供应商、Base URL、API Key 和模型库。');
  } catch (error) {
    logAction('加载失败', String(error));
  }
});
