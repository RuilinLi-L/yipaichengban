<script setup>
import { computed, ref } from 'vue';
import { folders, seedAssets, captureSamples } from '../../utils/data';
import { loadAssets, saveAssets, loadEngine, saveEngine } from '../../utils/storage';
import { searchAssets, getHitTags, buildAsset } from '../../utils/ai';

const view = ref('home');
const query = ref('');
const toastText = ref('');
const selectedFolder = ref('travel');
const selectedAsset = ref(null);
const detailOrigin = ref('home');
const engineOn = ref(loadEngine());
const assets = ref(loadAssets(seedAssets));
const searchScrollTop = ref(0);
const stats = computed(() => {
  const foldersSeen = new Set(assets.value.map((item) => item.folderId)).size;
  return {
    assets: assets.value.length,
    folders: foldersSeen,
  };
});

const availableFolders = computed(() => folders.filter((folder) => assets.value.some((item) => item.folderId === folder.id)));

const folderAssets = computed(() => assets.value.filter((item) => item.folderId === selectedFolder.value));

const searchResults = computed(() => searchAssets(assets.value, query.value));

const selectedFolderName = computed(() => {
  const folder = folders.find((item) => item.id === selectedFolder.value);
  return folder ? folder.name : '智能文件夹';
});

const selectedAssetFolderName = computed(() => {
  if (!selectedAsset.value) return '知识资产';
  const folder = folders.find((item) => item.id === selectedAsset.value.folderId);
  return folder ? folder.name : '知识资产';
});

const hasActionModule = computed(() => {
  const asset = selectedAsset.value;
  return Boolean(asset && ((asset.tasks && asset.tasks.length) || (asset.materials && asset.materials.length) || (asset.reminders && asset.reminders.length)));
});

function folderCount(folderId) {
  return assets.value.filter((item) => item.folderId === folderId).length;
}

function showToast(text) {
  toastText.value = text;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toastText.value = '';
  }, 2400);
}

function navigate(target, payload = {}) {
  if (target === 'detail') {
    detailOrigin.value = payload.origin || view.value;
    selectedAsset.value = assets.value.find((item) => item.id === payload.assetId) || null;
  }
  if (target === 'folder' && payload.folderId) {
    selectedFolder.value = payload.folderId;
  }
  view.value = target;
}

function toggleEngine() {
  engineOn.value = !engineOn.value;
  saveEngine(engineOn.value);
  showToast(engineOn.value ? '悬浮引擎已开启' : '悬浮引擎已关闭');
}

function onCaptureSample(sample) {
  const asset = buildAsset(sample.payload, sample.source);
  assets.value.unshift(asset);
  saveAssets(assets.value);
  selectedAsset.value = asset;
  detailOrigin.value = 'capture';
  view.value = 'detail';
  showToast('截图已进入应用私有沙盒');
}

function onPickImage() {
  if (typeof uni === 'undefined' || !uni.chooseImage) {
    showToast('当前环境未启用选择图片');
    return;
  }
  uni.chooseImage({
    count: 1,
    success(res) {
      const filePath = Array.isArray(res.tempFilePaths) ? res.tempFilePaths[0] : '';
      const fileName = filePath ? filePath.split('/').pop() : '本地截图';
      const asset = buildAsset({
        type: 'image',
        variant: 'normal',
        folderId: 'notes',
        source: '本地上传',
        title: fileName.replace(/\.[^.]+$/, ''),
        summary: '已存入应用私有沙盒，后续可接 OCR 与端侧模型。',
        content: fileName,
        tags: ['本地上传', '待识别'],
        semantic: [fileName, '截图', '本地'],
        color: 'linear-gradient(135deg, #efe8db, #dde9e0)',
        confidence: 22,
      }, '本地上传');
      assets.value.unshift(asset);
      saveAssets(assets.value);
      selectedAsset.value = asset;
      detailOrigin.value = 'capture';
      view.value = 'detail';
      showToast('截图已保存到私有沙盒');
    },
    fail() {
      showToast('未选择截图');
    },
  });
}

function openAsset(asset) {
  selectedAsset.value = asset;
  detailOrigin.value = view.value;
  view.value = 'detail';
}

function backFromDetail() {
  if (detailOrigin.value === 'search') {
    view.value = 'search';
  } else if (detailOrigin.value === 'folder') {
    view.value = 'folder';
  } else if (detailOrigin.value === 'capture') {
    view.value = 'capture';
  } else if (detailOrigin.value === 'home') {
    view.value = 'home';
  } else {
    view.value = 'vault';
  }
}

function deleteSelectedAsset() {
  if (!selectedAsset.value) return;
  assets.value = assets.value.filter((item) => item.id !== selectedAsset.value.id);
  saveAssets(assets.value);
  showToast('资产已从本地演示库删除');
  view.value = 'vault';
}

function resetDemo() {
  assets.value = [...seedAssets];
  saveAssets(assets.value);
  showToast('演示数据已恢复');
}

function onSearchScroll(e) {
  if (view.value === 'search') {
    searchScrollTop.value = e.detail.scrollTop || 0;
  }
}

function onSearchInput(e) {
  query.value = e.detail.value;
}

function openVoiceDemo() {
  query.value = '怎么去风龙废墟';
  showToast('已填入语音搜索示例');
}

function openTech() {
  view.value = 'tech';
}

function saveCurrentCard() {
  if (!selectedAsset.value) return;
  saveAssets(assets.value);
  showToast('已保存到应用私有知识库');
}
</script>

<template>
  <view class="page-shell">
    <view class="device">
      <view class="header">
        <view>
          <view class="kicker">vivo 端侧 AI 原型</view>
          <text class="title">智存</text>
        </view>
        <button class="pill" @click="openTech">技术路线</button>
      </view>

      <scroll-view class="body" scroll-y :scroll-top="view === 'search' ? searchScrollTop : 0" @scroll="onSearchScroll">
        <view v-if="view === 'home'" class="action-row">
          <view class="section-card">
            <view class="kicker">无感捕获 / 有序沉淀 / 秒级寻回</view>
            <view style="font-size: 44rpx; line-height: 1.08; font-weight: 800; margin-bottom: 16rpx;">让截图变成能被唤醒的知识资产。</view>
            <view style="color: #4b5d56; line-height: 1.7;">独立数据沙盒承接高价值碎片信息，端侧 AI 负责理解、打标、提炼和搜索。</view>
          </view>

          <view class="action-row">
            <button class="section-card" @click="toggleEngine">
              <view style="font-size: 34rpx; font-weight: 800; margin-bottom: 8rpx;">{{ engineOn ? '悬浮引擎已开启' : '点击召唤 AI 管家' }}</view>
              <view style="color: #4b5d56;">长按悬浮球模拟跨 App 截图，点击跳转全局搜索。</view>
            </button>

            <button class="section-card" @click="view = 'vault'">
              <view style="font-size: 34rpx; font-weight: 800; margin-bottom: 8rpx;">AI 知识金库</view>
              <view style="color: #4b5d56;">已沉淀 {{ stats.assets }} 项资产，覆盖 {{ stats.folders }} 个智能文件夹。</view>
            </button>

            <button class="section-card" @click="view = 'search'">
              <view style="font-size: 34rpx; font-weight: 800; margin-bottom: 8rpx;">全局语义搜索</view>
              <view style="color: #4b5d56;">试试搜：风龙废墟、红烧肉做法、报名材料。</view>
            </button>
          </view>

          <view class="action-grid three">
            <view class="pill" style="display:flex;align-items:center;justify-content:center;">应用沙盒</view>
            <view class="pill" style="display:flex;align-items:center;justify-content:center;">AI 打标</view>
            <view class="pill" style="display:flex;align-items:center;justify-content:center;">状态保活</view>
          </view>
        </view>

        <view v-else-if="view === 'vault'" class="action-row">
          <view class="section-card">
            <view class="kicker">The Vault</view>
            <view style="font-size: 40rpx; font-weight: 800;">AI 知识金库</view>
          </view>
          <view class="folder-grid">
          <button
            v-for="folder in availableFolders"
            :key="folder.id"
            class="section-card folder-card"
            @click="selectedFolder = folder.id; view = 'folder';"
          >
            <view class="folder-visual" :style="{ background: folder.color }"></view>
            <view>
              <view style="font-size: 30rpx; font-weight: 800;">{{ folder.name }}</view>
              <view style="color: #73837c; font-size: 24rpx;">{{ folderCount(folder.id) }} 项资产</view>
            </view>
          </button>
          </view>
        </view>

        <view v-else-if="view === 'folder'" class="action-row">
          <view class="section-card" style="display:flex;align-items:center;justify-content:space-between;">
            <view>
              <view class="kicker">异构瀑布流</view>
              <view style="font-size: 40rpx; font-weight: 800;">{{ selectedFolderName }}</view>
            </view>
            <button class="ghost-btn" @click="view = 'vault'">返回</button>
          </view>
          <view class="waterfall">
            <button
              v-for="asset in folderAssets"
              :key="asset.id"
              class="card visual"
              :class="{ tall: asset.variant === 'tall' }"
              @click="openAsset(asset)"
            >
              <view class="thumb" :style="{ background: asset.color }"></view>
              <view style="font-size: 30rpx; font-weight: 800; margin-top: 14rpx;">{{ asset.title }}</view>
              <view style="color: #73837c; margin-top: 8rpx;">{{ asset.summary }}</view>
              <view class="tag-row" style="margin-top: 12rpx;">
                <text class="tag" v-for="tag in asset.tags.slice(0, 3)" :key="tag">{{ tag }}</text>
              </view>
            </button>
          </view>
        </view>

        <view v-else-if="view === 'search'" class="action-row">
          <view class="section-card">
            <view class="kicker">The Finder</view>
            <view style="font-size: 40rpx; font-weight: 800; margin-bottom: 16rpx;">全局语义搜索</view>
            <view class="search-bar">
              <input class="input" :value="query" placeholder="搜红烧肉做法、风龙废墟、报名材料..." @input="onSearchInput" />
              <button class="pill" @click="openVoiceDemo">声</button>
            </view>
          </view>
          <view class="action-grid three">
            <view class="pill" style="display:flex;align-items:center;justify-content:center;">关键词匹配</view>
            <view class="pill" style="display:flex;align-items:center;justify-content:center;">向量语义</view>
            <view class="pill" style="display:flex;align-items:center;justify-content:center;">结果保活</view>
          </view>
          <view class="search-results">
            <view v-if="searchResults.length === 0" class="empty section-card">
              <view style="font-size: 36rpx; font-weight: 800;">没有找到相关资产</view>
              <view style="color: #4b5d56;">换一个更口语的问法，或先导入几张样例截图。</view>
            </view>
            <button
              v-for="item in searchResults"
              :key="item.asset.id"
              class="section-card result-card"
              @click="openAsset(item.asset)"
            >
              <view class="result-thumb" :style="{ background: item.asset.color }"></view>
              <view>
                <view style="font-size: 32rpx; font-weight: 800;">{{ item.asset.title }}</view>
                <view style="color: #4b5d56; margin-top: 8rpx;">{{ item.asset.summary }}</view>
                <view class="tag-row" style="margin-top: 14rpx;">
                  <text
                    v-for="tag in item.asset.tags.slice(0, 4)"
                    :key="tag"
                    class="tag"
                    :class="{ hit: getHitTags(item.asset, query).includes(tag) }"
                  >
                    {{ tag }}
                  </text>
                  <text class="tag">{{ item.score >= 8 ? '语义命中' : '关键词命中' }}</text>
                </view>
              </view>
            </button>
          </view>
        </view>

        <view v-else-if="view === 'detail' && selectedAsset" class="action-row">
          <view class="section-card" style="display:flex;align-items:flex-start;justify-content:space-between;gap:18rpx;">
            <view>
              <view class="kicker">{{ selectedAssetFolderName }} / 置信度 {{ selectedAsset.confidence || 0 }}%</view>
              <view style="font-size: 40rpx; font-weight: 800;">{{ selectedAsset.title }}</view>
            </view>
            <button class="ghost-btn" @click="backFromDetail">返回</button>
          </view>

          <view class="detail-visual" :class="{ 'text-mode': selectedAsset.type === 'text' }" :style="{ background: selectedAsset.color }">
            <text v-if="selectedAsset.type === 'text'">{{ selectedAsset.content }}</text>
          </view>

          <view class="section-card">
            <view class="kicker">AI 提炼</view>
            <view style="line-height: 1.7; color: #4b5d56;">{{ selectedAsset.summary }}</view>
            <view class="tag-row" style="margin-top: 14rpx;">
              <text class="tag" v-for="tag in selectedAsset.tags" :key="tag">{{ tag }}</text>
            </view>
          </view>

          <view v-if="hasActionModule" class="section-card">
            <view class="kicker">一拍成办行动模块</view>
            <view style="line-height: 1.7; color: #4b5d56;">AI 已从该资产中识别出可执行事项，确认后可进入待办或提醒。</view>
            <view class="tech-list">
              <view v-for="item in (selectedAsset.tasks || [])" :key="item" class="tech-item">{{ item }}</view>
              <view v-for="item in (selectedAsset.materials || [])" :key="item" class="tech-item">材料：{{ item }}</view>
              <view v-for="item in (selectedAsset.reminders || [])" :key="item" class="tech-item">提醒：{{ item }}</view>
            </view>
          </view>

          <view class="action-grid two">
            <button class="secondary-btn" @click="view = 'capture'">继续捕获</button>
            <button class="danger-btn" @click="deleteSelectedAsset">删除资产</button>
          </view>

          <view class="action-grid two">
            <button class="secondary-btn" @click="saveCurrentCard">确认保存</button>
            <button class="secondary-btn" @click="view = 'home'">回到首页</button>
          </view>
        </view>

        <view v-else-if="view === 'capture'" class="action-row">
          <view class="section-card">
            <view class="kicker">The Switch / 捕获端</view>
            <view style="font-size: 40rpx; font-weight: 800;">模拟全局无感捕获</view>
            <view style="line-height: 1.7; color: #4b5d56; margin-top: 12rpx;">静态原型用主动导入和样例模拟截图。正式 APK 中替换为 Android 悬浮窗服务与应用私有目录。</view>
          </view>
          <view class="action-grid two">
            <button class="primary-btn" @click="onPickImage">上传截图</button>
            <button class="secondary-btn" @click="toggleEngine">{{ engineOn ? '关闭悬浮引擎' : '开启悬浮引擎' }}</button>
          </view>
          <view class="action-row">
            <button
              v-for="(sample, index) in captureSamples"
              :key="sample.label"
              class="section-card"
              @click="onCaptureSample(sample)"
            >
              <view style="font-size: 30rpx; font-weight: 800;">{{ sample.label }}</view>
              <view style="color: #73837c;">{{ sample.source }}</view>
            </button>
          </view>
        </view>

        <view v-else-if="view === 'tech'" class="action-row">
          <view class="section-card">
            <view class="kicker">复赛 APK 路线</view>
            <view style="font-size: 40rpx; font-weight: 800;">从静态 Demo 到 vivo 真机</view>
          </view>
          <view class="section-card">
            <view style="font-size: 30rpx; font-weight: 800; margin-bottom: 12rpx;">端侧数据沙盒</view>
            <view style="line-height: 1.7; color: #4b5d56;">截图和笔记先写入 App 私有目录，标签、向量和行动项写入 SQLite/KV，避免污染系统相册。</view>
          </view>
          <view class="tech-list">
            <view class="tech-item">悬浮球：Android overlay/service，长按触发 MediaProjection，双击唤醒搜索。</view>
            <view class="tech-item">AIAdapter：OCR、多模态理解、自动打标、智能文件夹归类和资产提炼统一输出。</view>
            <view class="tech-item">隐私护城河：优先使用蓝心端侧能力或本地 OCR，敏感截图不上传云端。</view>
            <view class="tech-item">双路召回：关键词匹配兜底，向量语义搜索负责口语化意图寻回。</view>
          </view>
          <view class="action-grid two">
            <button class="secondary-btn" @click="resetDemo">恢复演示数据</button>
            <button class="secondary-btn" @click="view = 'home'">返回首页</button>
          </view>
        </view>
      </scroll-view>

      <view class="bottom-nav">
        <button class="nav-btn" :class="{ 'is-active': view === 'home' }" @click="view = 'home'">首页</button>
        <button class="nav-btn" :class="{ 'is-active': view === 'vault' || view === 'folder' }" @click="view = 'vault'">金库</button>
        <button class="nav-btn" :class="{ 'is-active': view === 'search' }" @click="view = 'search'">搜索</button>
      </view>

      <view v-if="engineOn" class="float-ball" @click="view = 'search'" @longpress="onCaptureSample(captureSamples[0])"></view>
      <view v-if="toastText" class="toast">{{ toastText }}</view>
    </view>
  </view>
</template>
