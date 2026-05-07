const ASSET_KEY = 'zhicun.assets.v1';
const ENGINE_KEY = 'zhicun.engine.v1';

export function loadAssets(seedAssets) {
  try {
    return uni.getStorageSync(ASSET_KEY) || [...seedAssets];
  } catch {
    return [...seedAssets];
  }
}

export function saveAssets(assets) {
  uni.setStorageSync(ASSET_KEY, assets);
}

export function loadEngine() {
  try {
    return uni.getStorageSync(ENGINE_KEY) === true;
  } catch {
    return true;
  }
}

export function saveEngine(on) {
  uni.setStorageSync(ENGINE_KEY, on);
}
