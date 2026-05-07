const STORAGE_KEY = 'yipaichengban.vault.v1';

export function loadVault() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVault(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createCapture({ name, source, previewUrl, mockText }) {
  return {
    id: crypto.randomUUID(),
    name,
    source,
    previewUrl,
    mockText,
    status: 'captured',
    createdAt: new Date().toISOString(),
  };
}

export function persistActionCard(capture, result) {
  return {
    ...capture,
    status: 'saved',
    result,
    updatedAt: new Date().toISOString(),
  };
}
