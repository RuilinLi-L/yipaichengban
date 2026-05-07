const ASSET_KEY = 'zhicun.assets.v1';
const ENGINE_KEY = 'zhicun.engine.v1';

export function loadAssets(seedAssets) {
  try {
    const cached = uni.getStorageSync(ASSET_KEY);
    return Array.isArray(cached) && cached.length > 0 ? cached : [...seedAssets];
  } catch {
    return [...seedAssets];
  }
}

export function saveAssets(assets) {
  uni.setStorageSync(ASSET_KEY, JSON.parse(JSON.stringify(assets)));
}

export function loadEngine() {
  try {
    const cached = uni.getStorageSync(ENGINE_KEY);
    return cached === '' || cached === null || typeof cached === 'undefined' ? true : cached === true;
  } catch {
    return true;
  }
}

export function saveEngine(on) {
  uni.setStorageSync(ENGINE_KEY, on);
}
