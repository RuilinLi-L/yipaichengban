import { loadAiConfig } from './storage';

const RESPONSE_TIMEOUT_MS = 45000;

const actionCardSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'sceneType',
    'title',
    'summary',
    'datetime',
    'location',
    'sourceNote',
    'tasks',
    'materials',
    'tags',
    'nextAction',
    'confidence',
  ],
  properties: {
    sceneType: {
      type: 'string',
      enum: ['competition', 'lecture', 'travel', 'coursework', 'generic'],
    },
    title: { type: 'string' },
    summary: { type: 'string' },
    datetime: { type: 'string' },
    location: { type: 'string' },
    sourceNote: { type: 'string' },
    tasks: {
      type: 'array',
      items: { type: 'string' },
    },
    materials: {
      type: 'array',
      items: { type: 'string' },
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
    nextAction: { type: 'string' },
    confidence: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
  },
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeCapture(capture) {
  const config = loadAiConfig();
  const hasRemoteConfig = Boolean(config.proxyUrl || config.apiKey);

  if (config.proxyUrl) {
    const payload = await callProxy(capture, config);
    return normalizeActionCard(payload, capture, 'proxy-model');
  }

  if (config.apiKey) {
    const payload = await callOpenAIResponses(capture, config);
    return normalizeActionCard(parseModelJson(payload), capture, 'openai-responses');
  }

  if (hasRemoteConfig) {
    throw new Error('模型服务配置不完整。');
  }

  return analyzeCaptureMock(capture);
}

async function callProxy(capture, config) {
  const endpoint = normalizeProxyEndpoint(config.proxyUrl);
  return postJson(endpoint, {
    name: capture.name,
    source: capture.source,
    mockText: capture.mockText,
    imageDataUrl: capture.imageDataUrl,
  });
}

async function callOpenAIResponses(capture, config) {
  const endpoint = resolveResponsesEndpoint(config.baseUrl);
  return postJson(
    endpoint,
    buildResponseRequest(capture, config),
    {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  );
}

function postJson(url, data, headers = { 'Content-Type': 'application/json' }) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'POST',
      data,
      header: headers,
      timeout: RESPONSE_TIMEOUT_MS,
      success(response) {
        const statusCode = response.statusCode || 0;
        const payload = typeof response.data === 'string' ? parseJsonText(response.data) : response.data;

        if (statusCode < 200 || statusCode >= 300) {
          const message = payload?.error?.message || payload?.error || payload?.message || `模型服务返回 ${statusCode}`;
          reject(new Error(message));
          return;
        }

        resolve(payload);
      },
      fail(error) {
        reject(new Error(error?.errMsg || '无法连接模型服务'));
      },
    });
  });
}

function buildResponseRequest(capture, config) {
  const request = {
    model: config.model,
    instructions: [
      '你是一拍成办的截图理解 AIAdapter。',
      '请把用户主动导入的截图或文字整理成可确认的行动卡。',
      '只抽取能从内容中合理判断的信息；不确定的时间、地点写“待确认”。',
      '任务、材料和标签要短，适合手机端直接编辑。',
      '必须输出符合 schema 的中文 JSON，不要输出解释文字。',
    ].join('\n'),
    input: [
      {
        role: 'user',
        content: buildInputContent(capture),
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'action_card',
        strict: true,
        schema: actionCardSchema,
      },
    },
    max_output_tokens: 1200,
  };

  if (config.reasoningEffort) {
    request.reasoning = { effort: config.reasoningEffort };
  }

  return request;
}

function buildInputContent(capture = {}) {
  const text = [
    `文件名：${capture.name || '未命名截图'}`,
    `来源：${capture.source || '本地上传'}`,
    capture.mockText ? `已知文字：${capture.mockText}` : '已知文字：无，请优先根据图片内容理解。',
  ].join('\n');

  const content = [{ type: 'input_text', text }];

  if (capture.imageDataUrl) {
    content.push({
      type: 'input_image',
      image_url: capture.imageDataUrl,
      detail: 'auto',
    });
  }

  return content;
}

function parseModelJson(payload) {
  const outputText = payload?.output_text || collectOutputText(payload);
  if (!outputText) {
    throw new Error('模型没有返回文本结果。');
  }

  try {
    return JSON.parse(outputText);
  } catch {
    const match = outputText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('模型输出不是有效 JSON。');
    }
    return JSON.parse(match[0]);
  }
}

function collectOutputText(payload) {
  const chatText = payload?.choices?.[0]?.message?.content;
  if (chatText) return chatText;

  if (typeof payload === 'string') return payload;
  if (!payload?.output) return '';

  const texts = [];
  collectTextNodes(payload.output, texts);
  return texts.join('\n').trim();
}

function collectTextNodes(value, texts) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectTextNodes(item, texts));
    return;
  }

  if (typeof value !== 'object') return;

  if ((value.type === 'output_text' || value.type === 'text') && typeof value.text === 'string') {
    texts.push(value.text);
    return;
  }

  if (typeof value.content === 'string') {
    texts.push(value.content);
    return;
  }

  Object.values(value).forEach((item) => collectTextNodes(item, texts));
}

async function analyzeCaptureMock(capture) {
  await delay(700);

  const text = `${capture.name || ''} ${capture.mockText || ''}`.toLowerCase();

  if (text.includes('aigc') || text.includes('比赛') || text.includes('报名')) {
    return buildResult({
      sceneType: 'competition',
      title: 'AIGC 创新赛报名行动卡',
      summary: '这是一条比赛报名通知，需要在截止前整理策划文档、团队介绍、原型图和指导教师信息。',
      datetime: '2026-05-11 08:00',
      location: '线上提交 / 创新楼304咨询',
      sourceNote: capture.source || '截图导入',
      tasks: ['完成作品策划文档', '整理团队介绍与成员分工', '补齐 5-8 张原型界面图', '提交前确认指导教师信息'],
      materials: ['策划文档', '团队介绍', '原型图', '指导教师信息'],
      tags: ['竞赛', '截止时间', '材料清单', '校园'],
      nextAction: '先把策划文档和原型图打包成一份提交清单。',
      confidence: 92,
    });
  }

  if (text.includes('讲座') || text.includes('沙龙') || text.includes('报告厅')) {
    return buildResult({
      sceneType: 'lecture',
      title: '蓝心大模型校园沙龙',
      summary: '这是一场端侧 AI 技术沙龙，适合加入日程并生成签到提醒。',
      datetime: '2026-06-03 19:00',
      location: '图书馆报告厅',
      sourceNote: capture.source || '图片导入',
      tasks: ['提前预约/报名', '18:50 前到场签到', '携带学生证', '记录端侧 AI 可用点'],
      materials: ['学生证', '笔记应用', '问题清单'],
      tags: ['讲座', '蓝心大模型', '端侧AI', '学习'],
      nextAction: '保存日程，并在活动前30分钟提醒出发。',
      confidence: 88,
    });
  }

  if (text.includes('攻略') || text.includes('西安') || text.includes('博物馆')) {
    return buildResult({
      sceneType: 'travel',
      title: '西安两日攻略知识卡',
      summary: '这张截图更适合作为知识收藏，系统会提取地点、预约事项和可复用标签。',
      datetime: '待确认',
      location: '西安：回民街 / 钟楼 / 陕西历史博物馆 / 大雁塔',
      sourceNote: capture.source || '网页截图',
      tasks: ['预约陕西历史博物馆', '整理两日路线', '收藏餐厅名单', '出发前检查身份证'],
      materials: ['身份证', '预约记录', '餐厅收藏'],
      tags: ['旅行', '美食', '西安', '知识收藏'],
      nextAction: '把“博物馆预约”设为出发前三天的待办。',
      confidence: 81,
    });
  }

  return buildResult({
    sceneType: 'generic',
    title: '待整理知识截图',
    summary: '已保存到私有截图沙盒。当前内容不足以稳定抽取时间地点，可先作为知识笔记保存。',
    datetime: '待确认',
    location: '待确认',
    sourceNote: capture.source || '本地上传',
    tasks: ['补充这张截图要解决什么问题', '手动添加标签', '稍后重新识别'],
    materials: [],
    tags: ['待整理', '知识截图'],
    nextAction: '先保存，等模型或网络可用时重新识别。',
    confidence: 54,
  });
}

function buildResult(payload) {
  return {
    ...payload,
    reminders: buildReminders(payload.datetime),
    createdAt: new Date().toISOString(),
    schemaVersion: 'action-card.v1',
    modelProvider: 'local-mock',
  };
}

function normalizeActionCard(card, capture = {}, modelProvider = 'remote-model') {
  const normalized = {
    sceneType: normalizeSceneType(card.sceneType),
    title: cleanString(card.title, '待整理知识截图'),
    summary: cleanString(card.summary, '已保存到私有截图沙盒，可继续补充信息。'),
    datetime: cleanString(card.datetime, '待确认'),
    location: cleanString(card.location, '待确认'),
    sourceNote: cleanString(card.sourceNote, capture.source || '本地上传'),
    tasks: cleanArray(card.tasks),
    materials: cleanArray(card.materials),
    tags: cleanArray(card.tags),
    nextAction: cleanString(card.nextAction, '先保存，稍后再确认下一步。'),
    confidence: clampConfidence(card.confidence),
  };

  return {
    ...normalized,
    reminders: buildReminders(normalized.datetime),
    createdAt: new Date().toISOString(),
    schemaVersion: 'action-card.v1',
    modelProvider,
  };
}

function normalizeSceneType(value) {
  const allowed = new Set(['competition', 'lecture', 'travel', 'coursework', 'generic']);
  return allowed.has(value) ? value : 'generic';
}

function cleanString(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function cleanArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[，,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 60;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function buildReminders(datetime) {
  if (!datetime || datetime.includes('待')) {
    return ['保存为知识卡，不创建具体时间提醒'];
  }

  return ['提前1天提醒', '提前30分钟提醒'];
}

function normalizeProxyEndpoint(proxyUrl = '') {
  const clean = proxyUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api/analyze-capture')) return clean;
  return `${clean}/api/analyze-capture`;
}

function resolveResponsesEndpoint(baseUrl = 'https://api.openai.com') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/responses')) return cleanBase;
  if (cleanBase.endsWith('/v1')) return `${cleanBase}/responses`;
  return `${cleanBase}/v1/responses`;
}

function parseJsonText(value) {
  try {
    return JSON.parse(value);
  } catch {
    return { message: value };
  }
}
