<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { flowSteps, privacyItems, sampleCaptures, sceneLabels } from '../../utils/data';
import { analyzeCapture } from '../../utils/ai';
import {
  createCapture,
  getDefaultAiConfig,
  loadAiConfig,
  loadVault,
  persistActionCard,
  saveAiConfig,
  saveVault,
} from '../../utils/storage';

const vault = ref(loadVault());
const activeTab = ref('capture');
const query = ref('');
const selected = ref(vault.value[0] || null);
const analyzing = ref(false);
const toast = ref('');
const aiError = ref('');
const draft = reactive(makeEmptyDraft());
const aiConfig = reactive(loadAiConfig());

const filteredVault = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return vault.value;

  return vault.value.filter((item) => {
    const haystack = [
      item.name,
      item.source,
      item.result?.title,
      item.result?.summary,
      item.result?.location,
      ...(item.result?.tags || []),
      ...(item.result?.tasks || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });
});

const vaultStats = computed(() => {
  const saved = vault.value.filter((item) => item.status === 'saved');
  const taskCount = saved.reduce((count, item) => count + (item.result?.tasks?.length || 0), 0);
  const tagCount = new Set(saved.flatMap((item) => item.result?.tags || [])).size;
  return { saved: saved.length, taskCount, tagCount };
});

const modelModeLabel = computed(() => {
  if (aiConfig.proxyUrl) return '代理模型';
  if (aiConfig.apiKey) return '直连模型';
  return '本地演示';
});

watch(
  vault,
  (items) => {
    saveVault(items);
  },
  { deep: true },
);

function importSample(sample) {
  const capture = createCapture({
    name: sample.title,
    source: sample.source,
    mockText: sample.mockText,
  });
  runAnalysis(capture);
}

function openFilePicker() {
  if (typeof uni === 'undefined' || !uni.chooseImage) {
    showToast('当前环境无法选择图片');
    return;
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    async success(res) {
      const filePath = Array.isArray(res.tempFilePaths) ? res.tempFilePaths[0] : '';
      if (!filePath) {
        showToast('未读取到图片路径');
        return;
      }

      const fileName = filePath.split('/').pop() || '本地截图';
      const imageDataUrl = await readImageAsDataUrl(filePath).catch(() => '');
      const capture = createCapture({
        name: fileName.replace(/\.[^.]+$/, ''),
        source: '应用私有目录 / user-capture',
        previewUrl: filePath,
        imageDataUrl,
        mockText: '',
      });

      runAnalysis(capture);
    },
    fail() {
      showToast('未选择截图');
    },
  });
}

async function runAnalysis(capture) {
  analyzing.value = true;
  aiError.value = '';
  selected.value = { ...capture, status: 'analyzing' };
  activeTab.value = 'card';

  try {
    const result = await analyzeCapture(capture);
    selected.value = persistActionCard(capture, result);
    applyDraft(result);
    showToast(result.modelProvider === 'local-mock' ? '已生成本地演示行动卡' : '模型已生成行动卡');
  } catch (error) {
    selected.value = { ...capture, status: 'offline' };
    aiError.value = normalizeAiError(error);
    showToast('模型调用失败，请检查配置');
  } finally {
    analyzing.value = false;
  }
}

function saveCurrentCard() {
  if (!selected.value?.result) return;

  const next = persistActionCard(selected.value, {
    ...selected.value.result,
    title: draft.title,
    summary: draft.summary,
    datetime: draft.datetime,
    location: draft.location,
    nextAction: draft.nextAction,
    tasks: splitLines(draft.tasks),
    materials: splitLines(draft.materials),
    tags: splitTags(draft.tags),
    confidence: Number(draft.confidence) || 0,
    updatedAt: new Date().toISOString(),
  });

  const index = vault.value.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    vault.value.splice(index, 1, next);
  } else {
    vault.value.unshift(next);
  }

  selected.value = next;
  activeTab.value = 'library';
  showToast('已保存到应用私有知识库');
}

function selectItem(item) {
  selected.value = item;
  applyDraft(item.result);
  activeTab.value = 'card';
}

function clearVault() {
  vault.value = [];
  selected.value = null;
  activeTab.value = 'capture';
  showToast('本地知识库已清空');
}

function saveModelSettings() {
  const saved = saveAiConfig(aiConfig);
  Object.assign(aiConfig, saved);
  showToast('模型配置已保存');
}

function resetModelSettings() {
  const defaults = getDefaultAiConfig();
  const saved = saveAiConfig(defaults);
  Object.assign(aiConfig, saved);
  showToast('模型配置已重置');
}

function applyDraft(result = {}) {
  draft.title = result.title || '';
  draft.summary = result.summary || '';
  draft.datetime = result.datetime || '';
  draft.location = result.location || '';
  draft.nextAction = result.nextAction || '';
  draft.tasks = (result.tasks || []).join('\n');
  draft.materials = (result.materials || []).join('\n');
  draft.tags = (result.tags || []).join('，');
  draft.confidence = result.confidence || 0;
}

function sampleTileStyle(sample) {
  return {
    background: `linear-gradient(90deg, rgba(255,255,255,.78) 22%, transparent 22% 30%, rgba(255,255,255,.82) 30% 68%, transparent 68%), ${sample.color}`,
  };
}

function showToast(message) {
  toast.value = message;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.value = '';
  }, 2400);
}

function normalizeAiError(error) {
  const message = error?.message || '未知错误';
  if (message.includes('API key') || message.includes('401')) {
    return '模型 Key 不可用，请检查右上角的模型配置。';
  }
  if (message.includes('无法连接') || message.includes('timeout') || message.includes('timed out')) {
    return '暂时连不上模型服务，可以先用本地演示卡继续流程。';
  }
  return message;
}

function makeEmptyDraft() {
  return {
    title: '',
    summary: '',
    datetime: '',
    location: '',
    nextAction: '',
    tasks: '',
    materials: '',
    tags: '',
    confidence: 0,
  };
}

function splitLines(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value) {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readImageAsDataUrl(filePath) {
  return new Promise((resolve, reject) => {
    if (typeof plus !== 'undefined' && plus.io) {
      plus.io.resolveLocalFileSystemURL(
        filePath,
        (entry) => {
          entry.file((file) => {
            const reader = new plus.io.FileReader();
            reader.onloadend = (event) => resolve(String(event.target?.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }, reject);
        },
        reject,
      );
      return;
    }

    if (typeof uni !== 'undefined' && uni.getFileSystemManager) {
      try {
        uni.getFileSystemManager().readFile({
          filePath,
          encoding: 'base64',
          success(res) {
            resolve(`data:image/jpeg;base64,${res.data}`);
          },
          fail: reject,
        });
        return;
      } catch {}
    }

    resolve('');
  });
}
</script>

<template>
  <view class="app-shell">
    <view class="phone-frame">
      <view class="top-bar">
        <view>
          <text class="eyebrow">vivo 移动端原型 · {{ modelModeLabel }}</text>
          <text class="app-title">一拍成办</text>
        </view>
        <button class="icon-button" aria-label="模型与隐私" @click="activeTab = 'privacy'">
          <text>?</text>
        </button>
      </view>

      <view class="segmented" aria-label="主要页面">
        <button :class="{ active: activeTab === 'capture' }" @click="activeTab = 'capture'">捕获</button>
        <button :class="{ active: activeTab === 'card' }" @click="activeTab = 'card'">行动卡</button>
        <button :class="{ active: activeTab === 'library' }" @click="activeTab = 'library'">知识库</button>
      </view>

      <scroll-view class="screen" scroll-y>
        <view v-if="activeTab === 'capture'" class="capture-screen">
          <view class="hero-panel">
            <text class="eyebrow">私有截图沙盒</text>
            <text class="hero-title">把通知、海报、攻略截图变成下一步行动。</text>
            <text class="body-copy">
              图片先进入应用私有目录，AI 只输出可确认的结构化卡片；生活相册和知识截图分开管理。
            </text>
            <view class="hero-actions">
              <button class="primary-action" @click="openFilePicker">上传截图</button>
              <button class="secondary-action" @click="importSample(sampleCaptures[0])">演示报名通知</button>
            </view>
          </view>

          <view class="quick-grid" aria-label="样例截图">
            <button
              v-for="sample in sampleCaptures"
              :key="sample.id"
              class="sample-tile"
              @click="importSample(sample)"
            >
              <view class="sample-visual" :style="sampleTileStyle(sample)"></view>
              <text class="sample-title">{{ sample.title }}</text>
              <text class="sample-source">{{ sample.source }}</text>
            </button>
          </view>

          <view class="flow-strip" aria-label="核心流程">
            <text v-for="step in flowSteps" :key="step">{{ step }}</text>
          </view>
        </view>

        <view v-else-if="activeTab === 'card'" class="card-screen">
          <view v-if="analyzing" class="analysis-state">
            <view class="scanner"></view>
            <text class="eyebrow">AIAdapter / Action Card</text>
            <text class="state-title">正在识别截图里的时间、地点和任务</text>
            <text class="body-copy">优先调用已配置的模型服务；未配置时使用本地演示识别。</text>
          </view>

          <view v-else-if="selected?.result" class="action-card">
            <view class="card-head">
              <view class="card-head-text">
                <text class="eyebrow">{{ sceneLabels[selected.result.sceneType] || '行动卡' }}</text>
                <text class="card-title">{{ selected.result.title }}</text>
              </view>
              <text class="confidence">{{ selected.result.confidence }}%</text>
            </view>

            <text class="summary">{{ selected.result.summary }}</text>

            <view class="provider-row">
              <text>{{ selected.result.modelProvider || 'unknown' }}</text>
              <text>{{ selected.source }}</text>
            </view>

            <view class="meta-grid">
              <view class="field">
                <text class="label">时间</text>
                <input v-model="draft.datetime" class="input" type="text" />
              </view>
              <view class="field">
                <text class="label">地点</text>
                <input v-model="draft.location" class="input" type="text" />
              </view>
            </view>

            <view class="field">
              <text class="label">标题</text>
              <input v-model="draft.title" class="input" type="text" />
            </view>

            <view class="field">
              <text class="label">摘要</text>
              <textarea v-model="draft.summary" class="textarea" :maxlength="-1" />
            </view>

            <view class="field">
              <text class="label">待办，每行一项</text>
              <textarea v-model="draft.tasks" class="textarea tall" :maxlength="-1" />
            </view>

            <view class="field">
              <text class="label">材料清单</text>
              <textarea v-model="draft.materials" class="textarea" :maxlength="-1" />
            </view>

            <view class="field">
              <text class="label">知识标签</text>
              <input v-model="draft.tags" class="input" type="text" />
            </view>

            <view class="field">
              <text class="label">下一步建议</text>
              <input v-model="draft.nextAction" class="input" type="text" />
            </view>

            <view class="card-actions">
              <button class="primary-action" @click="saveCurrentCard">确认保存</button>
              <button class="secondary-action" @click="activeTab = 'capture'">继续捕获</button>
            </view>
          </view>

          <view v-else class="empty-state">
            <text class="state-title">还没有待确认的行动卡</text>
            <text v-if="aiError" class="body-copy">{{ aiError }}</text>
            <text v-else class="body-copy">从“捕获”导入一张截图，AI 会把它整理成可编辑的任务、日程和标签。</text>
            <button class="primary-action single" @click="activeTab = 'capture'">去捕获截图</button>
          </view>
        </view>

        <view v-else-if="activeTab === 'library'" class="library-screen">
          <view class="library-head">
            <view>
              <text class="eyebrow">本地轻量数据库</text>
              <text class="section-title">私有知识库</text>
            </view>
            <button class="text-button" :disabled="vault.length === 0" @click="clearVault">清空</button>
          </view>

          <view class="stats-row">
            <view>
              <text class="stat-number">{{ vaultStats.saved }}</text>
              <text class="stat-label">截图卡片</text>
            </view>
            <view>
              <text class="stat-number">{{ vaultStats.taskCount }}</text>
              <text class="stat-label">待办项</text>
            </view>
            <view>
              <text class="stat-number">{{ vaultStats.tagCount }}</text>
              <text class="stat-label">标签</text>
            </view>
          </view>

          <view class="search-box">
            <text class="label">检索</text>
            <input v-model="query" class="input" type="text" placeholder="搜竞赛、讲座、旅行..." />
          </view>

          <view v-if="filteredVault.length" class="vault-list">
            <button v-for="item in filteredVault" :key="item.id" class="vault-item" @click="selectItem(item)">
              <view class="scene-dot"></view>
              <view class="vault-content">
                <text class="vault-title">{{ item.result?.title || item.name }}</text>
                <text class="vault-summary">{{ item.result?.summary || '已进入截图沙盒，等待重新识别' }}</text>
                <view class="tag-row">
                  <text v-for="tag in item.result?.tags || ['待整理']" :key="tag" class="tag">{{ tag }}</text>
                </view>
              </view>
            </button>
          </view>

          <view v-else class="empty-state compact">
            <text class="state-title small">知识库还是空的</text>
            <text class="body-copy">导入一张样例截图，看看卡片如何沉淀到本地。</text>
            <button class="secondary-action single" @click="importSample(sampleCaptures[1])">导入讲座样例</button>
          </view>
        </view>

        <view v-else class="privacy-screen">
          <text class="eyebrow">模型服务</text>
          <text class="section-title">AI 接入配置</text>

          <view class="action-card settings-card">
            <view class="field">
              <text class="label">代理服务地址</text>
              <input v-model="aiConfig.proxyUrl" class="input" type="text" placeholder="https://your-domain.com" />
            </view>
            <view class="field">
              <text class="label">API Key</text>
              <input v-model="aiConfig.apiKey" class="input" type="password" placeholder="sk-..." />
            </view>
            <view class="meta-grid">
              <view class="field">
                <text class="label">Base URL</text>
                <input v-model="aiConfig.baseUrl" class="input" type="text" />
              </view>
              <view class="field">
                <text class="label">模型</text>
                <input v-model="aiConfig.model" class="input" type="text" />
              </view>
            </view>
            <view class="field">
              <text class="label">Reasoning Effort</text>
              <input v-model="aiConfig.reasoningEffort" class="input" type="text" />
            </view>
            <view class="card-actions">
              <button class="primary-action" @click="saveModelSettings">保存配置</button>
              <button class="secondary-action" @click="resetModelSettings">重置</button>
            </view>
          </view>

          <view class="privacy-list">
            <view v-for="item in privacyItems" :key="item.title" class="privacy-item">
              <text class="privacy-title">{{ item.title }}</text>
              <text class="body-copy">{{ item.body }}</text>
            </view>
          </view>

          <button class="secondary-action single" @click="activeTab = 'capture'">返回捕获</button>
        </view>
      </scroll-view>

      <button class="floating-capture" aria-label="快速上传截图" @click="openFilePicker">+</button>
      <text v-if="toast" class="toast">{{ toast }}</text>
    </view>
  </view>
</template>
