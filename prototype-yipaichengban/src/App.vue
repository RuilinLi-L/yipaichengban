<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { sampleCaptures, sceneLabels } from './data/samples';
import { analyzeCapture } from './services/aiAdapter';
import { createCapture, loadVault, persistActionCard, saveVault } from './services/vaultStore';

const vault = ref(loadVault());
const activeTab = ref('capture');
const query = ref('');
const selected = ref(vault.value[0] || null);
const analyzing = ref(false);
const toast = ref('');
const draft = reactive(makeEmptyDraft());
const fileInput = ref(null);

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

watch(
  vault,
  (items) => {
    saveVault(items);
  },
  { deep: true },
);

async function importSample(sample) {
  const capture = createCapture({
    name: sample.title,
    source: sample.source,
    previewUrl: '',
    mockText: sample.mockText,
  });
  await runAnalysis(capture);
}

function openFilePicker() {
  fileInput.value?.click();
}

async function handleFile(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const capture = createCapture({
    name: file.name,
    source: '应用私有目录 / user-capture',
    previewUrl: URL.createObjectURL(file),
    mockText: '',
  });

  await runAnalysis(capture);
  event.target.value = '';
}

async function runAnalysis(capture) {
  analyzing.value = true;
  selected.value = { ...capture, status: 'analyzing' };
  activeTab.value = 'card';

  try {
    const result = await analyzeCapture(capture);
    selected.value = persistActionCard(capture, result);
    applyDraft(result);
    showToast('AI 已生成行动卡，先确认再保存');
  } catch {
    selected.value = { ...capture, status: 'offline' };
    showToast('模型暂时不可用，截图已先存入沙盒');
  } finally {
    analyzing.value = false;
  }
}

function saveCurrentCard() {
  if (!selected.value) return;

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
  showToast('本地演示数据已清空');
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

function showToast(message) {
  toast.value = message;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.value = '';
  }, 2400);
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
</script>

<template>
  <main class="app-shell">
    <section class="phone-frame" aria-label="一拍成办应用原型">
      <header class="top-bar">
        <div>
          <p class="eyebrow">vivo 移动端原型</p>
          <h1>一拍成办</h1>
        </div>
        <button class="icon-button" type="button" aria-label="查看隐私说明" @click="activeTab = 'privacy'">
          <span aria-hidden="true">?</span>
        </button>
      </header>

      <nav class="segmented" aria-label="主要页面">
        <button :class="{ active: activeTab === 'capture' }" type="button" @click="activeTab = 'capture'">捕获</button>
        <button :class="{ active: activeTab === 'card' }" type="button" @click="activeTab = 'card'">行动卡</button>
        <button :class="{ active: activeTab === 'library' }" type="button" @click="activeTab = 'library'">知识库</button>
      </nav>

      <section v-if="activeTab === 'capture'" class="screen capture-screen" aria-labelledby="capture-title">
        <div class="hero-panel">
          <p class="eyebrow">私有截图沙盒</p>
          <h2 id="capture-title">把通知、海报、攻略截图变成下一步行动。</h2>
          <p>
            图片先进入应用私有目录，AI 只输出可确认的结构化卡片；生活相册和知识截图分开管理。
          </p>
          <div class="hero-actions">
            <button class="primary-action" type="button" @click="openFilePicker">上传截图</button>
            <button class="secondary-action" type="button" @click="importSample(sampleCaptures[0])">演示报名通知</button>
          </div>
          <input ref="fileInput" class="visually-hidden" type="file" accept="image/*" @change="handleFile" />
        </div>

        <div class="quick-grid" aria-label="样例截图">
          <button
            v-for="sample in sampleCaptures"
            :key="sample.id"
            class="sample-tile"
            type="button"
            :style="{ '--tile-color': sample.color }"
            @click="importSample(sample)"
          >
            <span class="sample-visual" aria-hidden="true"></span>
            <strong>{{ sample.title }}</strong>
            <small>{{ sample.source }}</small>
          </button>
        </div>

        <section class="flow-strip" aria-label="核心流程">
          <span>图片入沙盒</span>
          <span>AI 抽取</span>
          <span>人工确认</span>
          <span>本地沉淀</span>
        </section>
      </section>

      <section v-else-if="activeTab === 'card'" class="screen card-screen" aria-labelledby="card-title">
        <div v-if="analyzing" class="analysis-state">
          <div class="scanner" aria-hidden="true"></div>
          <p class="eyebrow">AIAdapter / mock-v1</p>
          <h2 id="card-title">正在识别截图里的时间、地点和任务</h2>
          <p>原型使用可替换适配层；后续可接 OCR、第三方大模型或蓝心能力。</p>
        </div>

        <div v-else-if="selected?.result" class="action-card">
          <div class="card-head">
            <div>
              <p class="eyebrow">{{ sceneLabels[selected.result.sceneType] || '行动卡' }}</p>
              <h2 id="card-title">{{ selected.result.title }}</h2>
            </div>
            <span class="confidence">{{ selected.result.confidence }}%</span>
          </div>

          <p class="summary">{{ selected.result.summary }}</p>

          <div class="meta-grid">
            <label>
              <span>时间</span>
              <input v-model="draft.datetime" type="text" />
            </label>
            <label>
              <span>地点</span>
              <input v-model="draft.location" type="text" />
            </label>
          </div>

          <label class="field-block">
            <span>标题</span>
            <input v-model="draft.title" type="text" />
          </label>

          <label class="field-block">
            <span>摘要</span>
            <textarea v-model="draft.summary" rows="3"></textarea>
          </label>

          <label class="field-block">
            <span>待办，每行一项</span>
            <textarea v-model="draft.tasks" rows="5"></textarea>
          </label>

          <label class="field-block">
            <span>材料清单</span>
            <textarea v-model="draft.materials" rows="3"></textarea>
          </label>

          <label class="field-block">
            <span>知识标签</span>
            <input v-model="draft.tags" type="text" />
          </label>

          <label class="field-block">
            <span>下一步建议</span>
            <input v-model="draft.nextAction" type="text" />
          </label>

          <div class="card-actions">
            <button class="primary-action" type="button" @click="saveCurrentCard">确认保存</button>
            <button class="secondary-action" type="button" @click="activeTab = 'capture'">继续捕获</button>
          </div>
        </div>

        <div v-else class="empty-state">
          <h2 id="card-title">还没有待确认的行动卡</h2>
          <p>从“捕获”导入一张截图，AI 会把它整理成可编辑的任务、日程和标签。</p>
          <button class="primary-action" type="button" @click="activeTab = 'capture'">去捕获截图</button>
        </div>
      </section>

      <section v-else-if="activeTab === 'library'" class="screen library-screen" aria-labelledby="library-title">
        <div class="library-head">
          <div>
            <p class="eyebrow">本地轻量数据库</p>
            <h2 id="library-title">私有知识库</h2>
          </div>
          <button class="text-button" type="button" :disabled="vault.length === 0" @click="clearVault">清空</button>
        </div>

        <div class="stats-row">
          <div><strong>{{ vaultStats.saved }}</strong><span>截图卡片</span></div>
          <div><strong>{{ vaultStats.taskCount }}</strong><span>待办项</span></div>
          <div><strong>{{ vaultStats.tagCount }}</strong><span>标签</span></div>
        </div>

        <label class="search-box">
          <span>检索</span>
          <input v-model="query" type="search" placeholder="搜竞赛、讲座、旅行..." />
        </label>

        <div v-if="filteredVault.length" class="vault-list">
          <button v-for="item in filteredVault" :key="item.id" class="vault-item" type="button" @click="selectItem(item)">
            <span class="scene-dot" aria-hidden="true"></span>
            <span>
              <strong>{{ item.result?.title || item.name }}</strong>
              <small>{{ item.result?.summary || '已进入截图沙盒，等待重新识别' }}</small>
              <span class="tag-row">
                <em v-for="tag in item.result?.tags || ['待整理']" :key="tag">{{ tag }}</em>
              </span>
            </span>
          </button>
        </div>

        <div v-else class="empty-state compact">
          <h3>知识库还是空的</h3>
          <p>导入一张样例截图，看看卡片如何沉淀到本地。</p>
          <button class="secondary-action" type="button" @click="importSample(sampleCaptures[1])">导入讲座样例</button>
        </div>
      </section>

      <section v-else class="screen privacy-screen" aria-labelledby="privacy-title">
        <p class="eyebrow">vivo 适配路线</p>
        <h2 id="privacy-title">先做主动导入，再扩展系统能力</h2>
        <ul class="privacy-list">
          <li>
            <strong>应用私有目录</strong>
            <span>原型用浏览器本地存储模拟。打包 Android 后可改为应用沙盒文件目录。</span>
          </li>
          <li>
            <strong>本地轻量库</strong>
            <span>当前使用 localStorage；uni-app/Android 可替换为 SQLite、KV-Store 或 SharedPreferences。</span>
          </li>
          <li>
            <strong>AIAdapter</strong>
            <span>接口固定，OCR、蓝心大模型或第三方 API 都可以接入，不影响前端流程。</span>
          </li>
          <li>
            <strong>隐私边界</strong>
            <span>初版不读取微信、短信、系统通知，不自动写系统日历，所有内容由用户主动导入。</span>
          </li>
        </ul>
      </section>

      <button class="floating-capture" type="button" aria-label="快速上传截图" @click="openFilePicker">+</button>

      <p v-if="toast" class="toast" role="status">{{ toast }}</p>
    </section>
  </main>
</template>
