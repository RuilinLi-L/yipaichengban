const VAULT_KEY = 'yipaichengban.vault.v1';
const AI_CONFIG_KEY = 'yipaichengban.ai.config.v1';

const DEFAULT_AI_CONFIG = {
  proxyUrl: '',
  apiKey: '',
  baseUrl: 'https://api.openai.com',
  model: 'gpt-5.4',
  reasoningEffort: 'medium',
};

export function loadVault() {
  try {
    const cached = uni.getStorageSync(VAULT_KEY);
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

export function saveVault(items) {
  uni.setStorageSync(VAULT_KEY, JSON.parse(JSON.stringify(items)));
}

export function createCapture({ name, source, previewUrl = '', imageDataUrl = '', mockText = '' }) {
  return {
    id: createId(),
    name,
    source,
    previewUrl,
    imageDataUrl,
    mockText,
    status: 'captured',
    createdAt: new Date().toISOString(),
  };
}

export function persistActionCard(capture, result) {
  const { imageDataUrl, ...safeCapture } = capture;

  return {
    ...safeCapture,
    status: 'saved',
    result,
    updatedAt: new Date().toISOString(),
  };
}

export function loadAiConfig() {
  try {
    const cached = uni.getStorageSync(AI_CONFIG_KEY);
    return normalizeAiConfig(cached);
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function saveAiConfig(config) {
  const next = normalizeAiConfig(config);

  uni.setStorageSync(AI_CONFIG_KEY, next);
  return next;
}

export function getDefaultAiConfig() {
  return { ...DEFAULT_AI_CONFIG };
}

function createId() {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : null;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  return `capture-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAiConfig(config = {}) {
  const cached = config && typeof config === 'object' ? config : {};
  const merged = {
    ...DEFAULT_AI_CONFIG,
    ...cached,
  };

  return {
    proxyUrl: String(merged.proxyUrl || '').trim(),
    apiKey: String(merged.apiKey || '').trim(),
    baseUrl: String(merged.baseUrl || DEFAULT_AI_CONFIG.baseUrl).trim(),
    model: String(merged.model || DEFAULT_AI_CONFIG.model).trim(),
    reasoningEffort: String(merged.reasoningEffort || DEFAULT_AI_CONFIG.reasoningEffort).trim(),
  };
}
