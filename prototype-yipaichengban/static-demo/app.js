const STORAGE_KEY = 'zhicun.assets.v1';
const ENGINE_KEY = 'zhicun.engine.v1';

const folders = {
  travel: { id: 'travel', name: '旅行攻略', color: 'oklch(91% 0.07 82)' },
  game: { id: 'game', name: '游戏地图', color: 'oklch(90% 0.058 224)' },
  study: { id: 'study', name: '学习资料', color: 'oklch(91% 0.06 147)' },
  contest: { id: 'contest', name: '竞赛材料', color: 'oklch(91% 0.065 42)' },
  cooking: { id: 'cooking', name: '生活菜谱', color: 'oklch(92% 0.075 64)' },
  notes: { id: 'notes', name: '杂项笔记', color: 'oklch(92% 0.035 300)' },
};

const seedAssets = [
  {
    id: 'asset-xian-food',
    type: 'image',
    variant: 'tall',
    folderId: 'travel',
    source: '小红书截图',
    title: '西安两日美食路线',
    summary: '回民街、钟楼夜景、陕西历史博物馆和大雁塔串成两天路线，重点是提前预约博物馆。',
    content: '西安两日美食攻略：第一天回民街、钟楼夜景；第二天陕西历史博物馆、大雁塔。建议提前预约博物馆，准备身份证。',
    tags: ['西安', '美食攻略', '博物馆预约', '旅行'],
    semantic: ['旅游', '攻略', '路线', '预约', '身份证', '红烧肉做法'],
    confidence: 86,
    color: 'oklch(90% 0.09 78)',
    createdAt: '2026-05-07T08:00:00.000Z',
  },
  {
    id: 'asset-genshin-map',
    type: 'image',
    variant: 'wide',
    folderId: 'game',
    source: '游戏攻略截图',
    title: '风龙废墟路线图',
    summary: '地图标记了传送点、风场入口和高处平台路线，适合下次游戏时快速寻回。',
    content: '游戏地图：风龙废墟入口，从七天神像向西北移动，沿断桥进入风场。',
    tags: ['原神', '风龙废墟', '游戏地图'],
    semantic: ['怎么去风龙废墟', '路线', '地图', '传送点', '游戏攻略'],
    confidence: 91,
    color: 'oklch(89% 0.075 224)',
    createdAt: '2026-05-07T08:03:00.000Z',
  },
  {
    id: 'asset-cet6-note',
    type: 'text',
    variant: 'text',
    folderId: 'study',
    source: '语音速记转文字',
    title: '英语六级作文模板',
    summary: '观点类作文先让步再转折，结尾给具体建议，适合考前背诵。',
    content: '作文模板：Although some people believe..., I still argue that... The reason is not only..., but also...',
    tags: ['英语六级', '作文模板', '学习'],
    semantic: ['考试资料', '英语', '作文', '模板', '复习'],
    confidence: 83,
    color: 'oklch(91% 0.062 147)',
    createdAt: '2026-05-07T08:06:00.000Z',
  },
  {
    id: 'asset-aigc-contest',
    type: 'image',
    variant: 'tall',
    folderId: 'contest',
    source: '班级群截图',
    title: 'AIGC 创新赛报名材料',
    summary: '报名截止为 2026-05-11 08:00，需要策划文档、团队介绍、原型图和指导教师信息。',
    content: 'AIGC创新赛应用赛道报名截止：2026年5月11日08:00。请提交作品策划文档、团队介绍、原型图和指导教师信息。',
    tags: ['AIGC竞赛', '报名材料', '截止时间'],
    semantic: ['比赛', '报名', '材料清单', '截止', '作品策划'],
    confidence: 94,
    color: 'oklch(90% 0.07 42)',
    tasks: ['完成作品策划文档', '整理团队介绍与成员分工', '补齐 5-8 张原型界面图', '提交前确认指导教师信息'],
    materials: ['策划文档', '团队介绍', '原型图', '指导教师信息'],
    reminders: ['2026-05-10 20:00 检查材料', '2026-05-11 07:30 提交提醒'],
    createdAt: '2026-05-07T08:09:00.000Z',
  },
  {
    id: 'asset-pork-recipe',
    type: 'image',
    variant: 'normal',
    folderId: 'cooking',
    source: '短视频截图',
    title: '红烧肉做法要点',
    summary: '先煸出油脂，再炒糖色，加入热水小火焖 45 分钟，最后大火收汁。',
    content: '红烧肉：五花肉焯水，冰糖炒糖色，生抽老抽调味，热水没过肉，小火炖煮。',
    tags: ['红烧肉', '菜谱', '生活'],
    semantic: ['红烧肉做法', '菜谱', '做饭', '五花肉'],
    confidence: 88,
    color: 'oklch(91% 0.085 64)',
    createdAt: '2026-05-07T08:12:00.000Z',
  },
  {
    id: 'asset-python-code',
    type: 'image',
    variant: 'wide',
    folderId: 'study',
    source: '网页长截图',
    title: 'Python 文件读取片段',
    summary: 'AI 已从截图中提取代码片段，可在详情页复制复用。',
    content: "with open('data.txt', 'r', encoding='utf-8') as f:\\n    lines = f.readlines()",
    tags: ['Python', '代码片段', '学习'],
    semantic: ['代码', '教程', '复制', 'Python', '文件读取'],
    confidence: 89,
    color: 'oklch(90% 0.052 147)',
    createdAt: '2026-05-07T08:15:00.000Z',
  },
];

const captureSamples = [
  {
    label: '导入旅游攻略截图',
    source: '网页截图',
    payload: {
      type: 'image',
      variant: 'tall',
      folderId: 'travel',
      title: '长沙三天夜宵清单',
      summary: '坡子街、黄兴路、文和友和茶颜悦色串成一条夜游路线。',
      content: '长沙夜宵攻略：坡子街臭豆腐、黄兴路步行街、超级文和友。建议避开周末晚高峰。',
      tags: ['长沙', '夜宵', '旅行'],
      semantic: ['长沙攻略', '旅游', '美食', '夜宵'],
      color: 'oklch(90% 0.08 82)',
    },
  },
  {
    label: '添加纯文本速记',
    source: '手动速记',
    payload: {
      type: 'text',
      variant: 'text',
      folderId: 'notes',
      title: '答辩开场话术',
      summary: '先讲痛点，再讲端侧隐私优势，最后演示搜索状态保活。',
      content: '答辩顺序：痛点 - 沙盒 - 悬浮捕获 - AI 打标 - 金库 - 语义搜索 - 状态保活。',
      tags: ['答辩', '演示脚本', '项目'],
      semantic: ['答辩', '计划', '项目介绍', '演示'],
      color: 'oklch(92% 0.035 300)',
    },
  },
  {
    label: '模拟 AI 失败保存',
    source: '离线捕获',
    payload: {
      type: 'image',
      variant: 'normal',
      folderId: 'notes',
      title: '待重新识别截图',
      summary: '网络或模型暂不可用，图片已先进入应用沙盒，稍后可重新识别。',
      content: '离线状态下捕获的截图，等待端侧模型重新处理。',
      tags: ['待识别', '离线保存'],
      semantic: ['失败', '离线', '重新识别'],
      confidence: 22,
      status: 'pending',
      color: 'oklch(91% 0.04 25)',
    },
  },
];

const state = {
  route: 'home',
  previousRoute: 'home',
  assets: loadAssets(),
  engineOn: localStorage.getItem(ENGINE_KEY) === 'on',
  selectedFolder: null,
  selectedAsset: null,
  detailOrigin: null,
  search: {
    query: '',
    scrollTop: 0,
  },
};

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const floatBall = document.querySelector('#floatBall');
const fileInput = document.querySelector('#fileInput');

document.addEventListener('click', (event) => {
  const routeTarget = event.target.closest('[data-route]');
  if (routeTarget) {
    navigate(routeTarget.dataset.route);
    return;
  }

  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;
  handleAction(actionTarget.dataset.action, actionTarget.dataset);
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const asset = buildAsset({
    type: 'image',
    variant: 'normal',
    folderId: 'notes',
    source: '本地上传',
    title: file.name.replace(/\.[^.]+$/, '') || '本地截图',
    summary: '已存入应用私有沙盒。当前静态原型使用文件名生成基础标签，后续接 OCR 和端侧模型。',
    content: file.name,
    tags: ['本地上传', '待精读'],
    semantic: [file.name, '截图', '本地'],
    color: 'oklch(91% 0.045 147)',
  });
  state.assets.unshift(asset);
  saveAssets();
  fileInput.value = '';
  showToast('截图已进入应用私有沙盒');
  navigate('detail', { assetId: asset.id, origin: 'vault' });
});

floatBall.addEventListener('dblclick', () => {
  state.search.query = '';
  showToast('双击悬浮球，已唤起全局搜索');
  navigate('search');
});

let pressTimer = null;
floatBall.addEventListener('pointerdown', () => {
  pressTimer = window.setTimeout(() => {
    importCapture(captureSamples[0]);
    showToast('长按悬浮球，已模拟跨 App 截图');
  }, 680);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => {
  floatBall.addEventListener(name, () => window.clearTimeout(pressTimer));
});

render();

function handleAction(action, data) {
  if (action === 'toggle-engine') {
    state.engineOn = !state.engineOn;
    localStorage.setItem(ENGINE_KEY, state.engineOn ? 'on' : 'off');
    showToast(state.engineOn ? '悬浮引擎已开启' : '悬浮引擎已关闭');
    render();
  }

  if (action === 'open-folder') {
    state.selectedFolder = data.folder;
    navigate('folder');
  }

  if (action === 'open-asset') {
    if (state.route === 'search') {
      const scroller = document.querySelector('#searchResults');
      state.search.scrollTop = scroller?.scrollTop || 0;
    }
    navigate('detail', { assetId: data.asset, origin: state.route });
  }

  if (action === 'back-detail') {
    const target = state.detailOrigin || 'vault';
    navigate(target);
  }

  if (action === 'capture-file') {
    fileInput.click();
  }

  if (action === 'capture-sample') {
    importCapture(captureSamples[Number(data.index) || 0]);
  }

  if (action === 'delete-asset') {
    state.assets = state.assets.filter((item) => item.id !== state.selectedAsset?.id);
    saveAssets();
    showToast('资产已从本地演示库移除');
    navigate('vault');
  }

  if (action === 'voice-demo') {
    state.search.query = '怎么去风龙废墟';
    render();
    showToast('已填入语音搜索示例');
  }

  if (action === 'quick-search') {
    state.search.query = data.query || '';
    navigate('search');
  }

  if (action === 'reset-data') {
    state.assets = [...seedAssets];
    saveAssets();
    showToast('演示数据已恢复');
    render();
  }
}

function navigate(route, params = {}) {
  state.previousRoute = state.route;
  state.route = route;

  if (route === 'detail') {
    state.selectedAsset = state.assets.find((item) => item.id === params.assetId) || null;
    state.detailOrigin = params.origin || state.previousRoute || 'vault';
  }

  if (route !== 'folder' && route !== 'detail') {
    state.selectedFolder = null;
  }

  render();
}

function render() {
  updateNav();
  floatBall.hidden = !state.engineOn;

  if (state.route === 'home') app.innerHTML = renderHome();
  if (state.route === 'vault') app.innerHTML = renderVault();
  if (state.route === 'folder') app.innerHTML = renderFolder();
  if (state.route === 'search') app.innerHTML = renderSearch();
  if (state.route === 'detail') app.innerHTML = renderDetail();
  if (state.route === 'capture') app.innerHTML = renderCapture();
  if (state.route === 'tech') app.innerHTML = renderTech();

  if (state.route === 'search') {
    const input = document.querySelector('#searchInput');
    if (input) {
      input.value = state.search.query;
      input.addEventListener('input', (event) => {
        state.search.query = event.target.value;
        renderSearchResults();
      });
    }
    const scroller = document.querySelector('#searchResults');
    if (scroller) scroller.scrollTop = state.search.scrollTop;
  }
}

function updateNav() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    const target = item.dataset.route;
    const active =
      state.route === target ||
      (target === 'vault' && ['folder', 'detail', 'capture', 'tech'].includes(state.route));
    item.classList.toggle('is-active', active);
  });
}

function renderHome() {
  const stats = getStats();
  return `
    <section class="hero-dashboard">
      <div class="hero-copy">
        <p class="kicker">无感捕获 / 有序沉淀 / 秒级寻回</p>
        <h2>让截图变成能被唤醒的知识资产。</h2>
        <p>独立数据沙盒承接高价值碎片信息，端侧 AI 负责理解、打标、提炼和搜索。</p>
      </div>

      <div class="axis-grid">
        <button class="axis-card ${state.engineOn ? 'switch-on' : ''}" type="button" data-action="toggle-engine">
          <span>
            <strong>${state.engineOn ? '悬浮引擎已开启' : '点击召唤 AI 管家'}</strong>
            <small>长按悬浮球模拟跨 App 截图，双击直接进入全局搜索。</small>
          </span>
          <span class="axis-mark">In</span>
        </button>

        <button class="axis-card" type="button" data-route="vault">
          <span>
            <strong>AI 知识金库</strong>
            <small>已沉淀 ${stats.assets} 项资产，覆盖 ${stats.folders} 个智能文件夹。</small>
          </span>
          <span class="axis-mark">Store</span>
        </button>

        <button class="axis-card finder" type="button" data-route="search">
          <span>
            <strong>全局语义搜索</strong>
            <small>试试搜：风龙废墟、红烧肉做法、报名材料。</small>
          </span>
          <span class="axis-mark">Out</span>
        </button>
      </div>

      <div class="status-strip" aria-label="端侧流程">
        <span>应用沙盒</span>
        <span>AI 打标</span>
        <span>状态保活</span>
      </div>
    </section>
  `;
}

function renderVault() {
  const groups = groupByFolder();
  return `
    <section>
      <div class="section-head">
        <div>
          <p class="kicker">The Vault</p>
          <h2>AI 知识金库</h2>
        </div>
        <button class="secondary-button" type="button" data-route="capture">捕获</button>
      </div>

      <div class="folder-grid">
        ${Object.values(folders)
          .filter((folder) => groups[folder.id]?.length)
          .map((folder) => renderFolderCard(folder, groups[folder.id].length))
          .join('')}
      </div>
    </section>
  `;
}

function renderFolderCard(folder, count) {
  return `
    <button class="folder-card" type="button" data-action="open-folder" data-folder="${folder.id}">
      <span class="folder-visual" style="--folder-color: ${folder.color}"></span>
      <span>
        <strong>${folder.name}</strong>
        <span class="folder-count">${count} 项资产</span>
      </span>
    </button>
  `;
}

function renderFolder() {
  const folder = folders[state.selectedFolder] || Object.values(folders)[0];
  const assets = state.assets.filter((asset) => asset.folderId === folder.id);
  return `
    <section>
      <div class="section-head">
        <div>
          <p class="kicker">异构瀑布流</p>
          <h2>${folder.name}</h2>
        </div>
        <button class="ghost-button" type="button" data-route="vault">返回</button>
      </div>
      <div class="waterfall">
        ${assets.map((asset) => renderAssetCard(asset)).join('')}
      </div>
    </section>
  `;
}

function renderAssetCard(asset) {
  const visual =
    asset.type === 'text'
      ? `<span class="asset-visual text" style="--asset-color: ${asset.color}">${escapeHtml(asset.summary.slice(0, 42))}</span>`
      : `<span class="asset-visual" style="--asset-color: ${asset.color}"></span>`;
  return `
    <button class="asset-card ${asset.variant || ''}" type="button" data-action="open-asset" data-asset="${asset.id}">
      ${visual}
      <strong>${escapeHtml(asset.title)}</strong>
      <small>${escapeHtml(asset.summary)}</small>
      <span class="tag-row">${asset.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</span>
    </button>
  `;
}

function renderSearch() {
  return `
    <section class="search-panel">
      <div>
        <p class="kicker">The Finder</p>
        <h2>全局语义搜索</h2>
      </div>
      <div class="search-bar">
        <input id="searchInput" type="search" placeholder="搜红烧肉做法、风龙废墟、报名材料..." />
        <button class="icon-button" type="button" data-action="voice-demo" aria-label="语音搜索示例">声</button>
      </div>
      <div class="tech-strip">
        <span>关键词匹配</span>
        <span>向量语义</span>
        <span>结果保活</span>
      </div>
      <div id="searchResults" class="search-results">${renderSearchResultList()}</div>
    </section>
  `;
}

function renderSearchResults() {
  const container = document.querySelector('#searchResults');
  if (!container) return;
  state.search.scrollTop = container.scrollTop;
  container.innerHTML = renderSearchResultList();
}

function renderSearchResultList() {
  const results = searchAssets(state.search.query);
  if (!results.length) {
    return `
      <div class="empty-state">
        <h3>没有找到相关资产</h3>
        <p>换一个更口语的问法，或先导入几张样例截图。</p>
      </div>
    `;
  }

  return results
    .map(({ asset, score }) => {
      const hits = getHitTags(asset, state.search.query);
      return `
        <button class="result-card" type="button" data-action="open-asset" data-asset="${asset.id}">
          <span class="result-thumb" style="--asset-color: ${asset.color}"></span>
          <span>
            <strong>${escapeHtml(asset.title)}</strong>
            <p>${escapeHtml(asset.summary)}</p>
            <span class="tag-row">
              ${asset.tags
                .slice(0, 4)
                .map((tag) => `<span class="${hits.includes(tag) ? 'hit' : ''}">${escapeHtml(tag)}</span>`)
                .join('')}
              <span>${score >= 8 ? '语义命中' : '关键词命中'}</span>
            </span>
          </span>
        </button>
      `;
    })
    .join('');
}

function renderDetail() {
  const asset = state.selectedAsset;
  if (!asset) {
    return `
      <div class="empty-state">
        <h2>资产不存在</h2>
        <p>它可能已经被删除，返回金库继续查看。</p>
        <button class="primary-button" type="button" data-route="vault">返回金库</button>
      </div>
    `;
  }

  const visualClass = asset.type === 'text' ? 'detail-visual text-mode' : 'detail-visual';
  const visualText = asset.type === 'text' ? escapeHtml(asset.content) : '';
  return `
    <section class="detail-layout">
      <div class="section-head">
        <div>
          <p class="kicker">${folders[asset.folderId]?.name || '知识资产'} / 置信度 ${asset.confidence || 0}%</p>
          <h2>${escapeHtml(asset.title)}</h2>
        </div>
        <button class="ghost-button" type="button" data-action="back-detail">返回</button>
      </div>

      <div class="${visualClass}" style="--asset-color: ${asset.color}">${visualText}</div>

      <div class="detail-copy">
        <div class="info-block">
          <h3>AI 提炼</h3>
          <p>${escapeHtml(asset.summary)}</p>
          <div class="tag-row">${asset.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        </div>

        ${renderActionModule(asset)}

        <div class="detail-actions">
          <button class="secondary-button" type="button" data-route="capture">继续捕获</button>
          <button class="danger-button" type="button" data-action="delete-asset">删除资产</button>
        </div>
      </div>
    </section>
  `;
}

function renderActionModule(asset) {
  const hasAction = asset.tasks?.length || asset.materials?.length || asset.reminders?.length;
  if (!hasAction) {
    return `
      <div class="action-module">
        <h3>资产复用</h3>
        <p>这张卡以知识寻回为主。后续接入端侧多模态模型后，可继续提取代码、地点、清单或提醒。</p>
      </div>
    `;
  }

  return `
    <div class="action-module">
      <h3>一拍成办行动模块</h3>
      <p>AI 已从该资产中识别出可执行事项，确认后可进入待办或提醒。</p>
      <ul class="action-list">
        ${(asset.tasks || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        ${(asset.materials || []).map((item) => `<li>材料：${escapeHtml(item)}</li>`).join('')}
        ${(asset.reminders || []).map((item) => `<li>提醒：${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderCapture() {
  return `
    <section class="capture-panel">
      <p class="kicker">The Switch / 捕获端</p>
      <h2>模拟全局无感捕获</h2>
      <p>静态 Demo 用主动导入和样例模拟 MediaProjection 截图。正式 APK 中替换为 Android 悬浮窗服务与应用私有目录。</p>
      <div class="capture-actions">
        <button class="primary-button" type="button" data-action="capture-file">上传截图</button>
        <button class="secondary-button" type="button" data-action="toggle-engine">${state.engineOn ? '关闭悬浮引擎' : '开启悬浮引擎'}</button>
      </div>
      <div class="capture-grid">
        ${captureSamples
          .map(
            (sample, index) => `
              <button class="capture-card" type="button" data-action="capture-sample" data-index="${index}">
                <strong>${sample.label}</strong>
                <small>${sample.source}</small>
              </button>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderTech() {
  return `
    <section>
      <div class="section-head">
        <div>
          <p class="kicker">复赛 APK 路线</p>
          <h2>从静态 Demo 到 vivo 真机</h2>
        </div>
        <button class="ghost-button" type="button" data-route="home">返回</button>
      </div>
      <div class="tech-card">
        <h3>端侧数据沙盒</h3>
        <p>截图和笔记先写入 App 私有目录，标签、向量、行动项写入 SQLite/KV，避免污染系统相册。</p>
      </div>
      <ul class="tech-list">
        <li>悬浮球：Android overlay/service，长按触发 MediaProjection，双击唤醒搜索。</li>
        <li>AIAdapter：OCR、多模态理解、自动打标、智能文件夹归类和资产提炼统一输出。</li>
        <li>隐私护城河：优先使用蓝心端侧能力或本地 OCR，敏感截图不上传云端。</li>
        <li>双路召回：关键词匹配兜底，向量语义搜索负责口语化意图寻回。</li>
      </ul>
      <button class="secondary-button" type="button" data-action="reset-data">恢复演示数据</button>
    </section>
  `;
}

function importCapture(sample) {
  const asset = buildAsset(sample.payload);
  asset.source = sample.source;
  state.assets.unshift(asset);
  saveAssets();
  navigate('detail', { assetId: asset.id, origin: 'capture' });
}

function buildAsset(payload) {
  return {
    id: `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    confidence: 84,
    status: 'ready',
    createdAt: new Date().toISOString(),
    ...payload,
  };
}

function loadAssets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...seedAssets];
  } catch {
    return [...seedAssets];
  }
}

function saveAssets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.assets));
}

function groupByFolder() {
  return state.assets.reduce((groups, asset) => {
    groups[asset.folderId] ||= [];
    groups[asset.folderId].push(asset);
    return groups;
  }, {});
}

function getStats() {
  return {
    assets: state.assets.length,
    folders: Object.keys(groupByFolder()).length,
  };
}

function searchAssets(query) {
  const normalized = normalize(query);
  if (!normalized) return state.assets.map((asset) => ({ asset, score: 1 }));

  return state.assets
    .map((asset) => {
      const fields = [asset.title, asset.summary, asset.content, asset.source, ...(asset.tags || [])];
      const exact = fields.some((field) => normalize(field).includes(normalized)) ? 10 : 0;
      const semantic = (asset.semantic || []).some((term) => semanticMatch(normalized, normalize(term))) ? 8 : 0;
      const fuzzy = fields.join('').split('').filter((char) => normalized.includes(char)).length / Math.max(normalized.length, 1);
      const score = exact + semantic + fuzzy;
      return { asset, score };
    })
    .filter((item) => item.score > 1.2)
    .sort((a, b) => b.score - a.score);
}

function semanticMatch(query, term) {
  if (!query || !term) return false;
  if (query.includes(term) || term.includes(query)) return true;

  const dictionary = [
    ['怎么去风龙废墟', '风龙废墟路线图', '原神地图'],
    ['红烧肉做法', '红烧肉', '菜谱', '五花肉'],
    ['报名材料', '竞赛报名', '策划文档', '截止时间'],
    ['考试资料', '英语六级', '作文模板'],
  ];

  return dictionary.some((group) => group.some((word) => query.includes(normalize(word))) && group.some((word) => term.includes(normalize(word))));
}

function getHitTags(asset, query) {
  const normalized = normalize(query);
  return (asset.tags || []).filter((tag) => normalize(tag).includes(normalized) || semanticMatch(normalized, normalize(tag)));
}

function normalize(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}
