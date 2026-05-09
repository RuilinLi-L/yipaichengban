import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 45000;
const POWERSHELL_TIMEOUT_MS = 60000;

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

export function openaiAnalysisPlugin(options = {}) {
  const config = {
    ...options,
    apiKey: options.apiKey || process.env.OPENAI_API_KEY,
    baseUrl: options.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com',
    model: options.model || process.env.OPENAI_MODEL || 'gpt-5.4',
    reasoningEffort: options.reasoningEffort || process.env.OPENAI_REASONING_EFFORT || 'xhigh',
    disableResponseStorage:
      options.disableResponseStorage || process.env.OPENAI_DISABLE_RESPONSE_STORAGE === 'true',
  };

  return {
    name: 'openai-analysis-proxy',
    configureServer(server) {
      server.middlewares.use('/api/analyze-capture', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          sendJson(res, 204, {});
          return;
        }

        if (req.method !== 'POST') {
          next();
          return;
        }

        if (!config.apiKey) {
          sendJson(res, 503, {
            error: 'OPENAI_API_KEY is not configured. Falling back to local mock on the client.',
          });
          return;
        }

        try {
          const capture = await readJson(req);
          const card = await analyzeWithOpenAI(capture, config);
          sendJson(res, 200, card);
        } catch (error) {
          server.config.logger.error(`[openai-analysis-proxy] ${error.message}`);
          sendJson(res, 502, {
            error: error.message || 'OpenAI analysis failed.',
          });
        }
      });
    },
  };
}

async function analyzeWithOpenAI(capture, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const payload = await callResponsesApi(capture, options, controller.signal).catch(async (responsesError) => {
      try {
        return await callChatCompletionsApi(capture, options, controller.signal);
      } catch (chatError) {
        throw new Error(`Responses failed: ${responsesError.message}; Chat fallback failed: ${chatError.message}`);
      }
    });

    return normalizeActionCard(parseModelJson(payload), capture);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callResponsesApi(capture, options, signal) {
  return postOpenAI(resolveResponsesEndpoint(options.baseUrl), buildResponseRequest(capture, options), options, signal);
}

async function callChatCompletionsApi(capture, options, signal) {
  const endpoint = resolveChatCompletionsEndpoint(options.baseUrl);

  return postOpenAI(endpoint, buildChatRequest(capture, options, 'json_schema'), options, signal).catch(async (schemaError) => {
    try {
      return await postOpenAI(endpoint, buildChatRequest(capture, options, 'json_object'), options, signal);
    } catch (jsonError) {
      throw new Error(`schema chat failed: ${schemaError.message}; json chat failed: ${jsonError.message}`);
    }
  });
}

async function postOpenAI(endpoint, body, options, signal) {
  const bodyText = JSON.stringify(body);
  let response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: bodyText,
      signal,
    });
  } catch (error) {
    if (process.platform === 'win32') {
      return postOpenAIWithPowerShell(endpoint, bodyText, options);
    }
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || payload.message || `HTTP ${response.status}`;
    throw new Error(`${message} (${redactEndpoint(endpoint)})`);
  }

  return payload;
}

function postOpenAIWithPowerShell(endpoint, bodyText, options) {
  const encodedBody = Buffer.from(bodyText, 'utf8').toString('base64');
  const script = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$encodedBody = [Console]::In.ReadToEnd()
$requestBody = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encodedBody))
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $client = [System.Net.WebClient]::new()
  $client.Encoding = [System.Text.UTF8Encoding]::new($false)
  $client.Headers.Add('Authorization', "Bearer $env:OPENAI_PROXY_API_KEY")
  $client.Headers.Add('Content-Type', 'application/json; charset=utf-8')
  $requestBytes = [System.Text.Encoding]::UTF8.GetBytes($requestBody)
  $responseBytes = $client.UploadData($env:OPENAI_PROXY_ENDPOINT, 'POST', $requestBytes)
  [Console]::Write([System.Text.Encoding]::UTF8.GetString($responseBytes))
} catch {
  $message = $_.Exception.Message
  if ($_.Exception.Response) {
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      if ($stream) {
        $memory = [System.IO.MemoryStream]::new()
        $stream.CopyTo($memory)
        $body = [System.Text.Encoding]::UTF8.GetString($memory.ToArray())
        if ($body) { $message = $body }
      }
    } catch {}
  }
  [Console]::Error.Write($message)
  exit 1
}
`;

  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      {
        env: {
          ...process.env,
          OPENAI_PROXY_API_KEY: options.apiKey,
          OPENAI_PROXY_ENDPOINT: endpoint,
        },
        windowsHide: true,
      },
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`PowerShell API request timed out (${redactEndpoint(endpoint)})`));
    }, POWERSHELL_TIMEOUT_MS);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`${stderr || `PowerShell request failed with exit code ${code}`} (${redactEndpoint(endpoint)})`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`PowerShell API response was not JSON (${redactEndpoint(endpoint)})`));
      }
    });

    child.stdin.end(encodedBody);
  });
}

function buildResponseRequest(capture, options) {
  const request = {
    model: options.model,
    instructions: [
      '你是“一拍成办”的截图理解 AIAdapter。',
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

  if (options.reasoningEffort) {
    request.reasoning = { effort: options.reasoningEffort };
  }

  if (options.disableResponseStorage) {
    request.store = false;
  }

  return request;
}

function buildChatRequest(capture, options, formatType) {
  const request = {
    model: options.model,
    messages: [
      {
        role: 'system',
        content: [
          '你是“一拍成办”的截图理解 AIAdapter。',
          '请把用户主动导入的截图或文字整理成可确认的行动卡。',
          '只抽取能从内容中合理判断的信息；不确定的时间、地点写“待确认”。',
          '任务、材料和标签要短，适合手机端直接编辑。',
          '必须输出一个中文 JSON object，不要输出解释文字。',
        ].join('\n'),
      },
      {
        role: 'user',
        content: buildChatContent(capture),
      },
    ],
  };

  if (formatType === 'json_schema') {
    request.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'action_card',
        strict: true,
        schema: actionCardSchema,
      },
    };
  } else {
    request.response_format = { type: 'json_object' };
  }

  if (options.disableResponseStorage) {
    request.store = false;
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

function buildChatContent(capture = {}) {
  const text = [
    `文件名：${capture.name || '未命名截图'}`,
    `来源：${capture.source || '本地上传'}`,
    capture.mockText ? `已知文字：${capture.mockText}` : '已知文字：无，请优先根据图片内容理解。',
  ].join('\n');

  const content = [{ type: 'text', text }];

  if (capture.imageDataUrl) {
    content.push({
      type: 'image_url',
      image_url: {
        url: capture.imageDataUrl,
      },
    });
  }

  return content;
}

function parseModelJson(payload) {
  const outputText = payload.output_text || collectOutputText(payload);
  if (!outputText) {
    throw new Error('The model returned no text output.');
  }

  try {
    return JSON.parse(outputText);
  } catch {
    const match = outputText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('The model output was not valid JSON.');
    }
    return JSON.parse(match[0]);
  }
}

function collectOutputText(payload) {
  const chatText = payload.choices?.[0]?.message?.content;
  if (chatText) return chatText;

  if (typeof payload === 'string') return payload;
  if (!payload.output) return '';

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

function normalizeActionCard(card, capture = {}) {
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
    modelProvider: 'openai-responses',
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

function resolveResponsesEndpoint(baseUrl = 'https://api.openai.com') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/responses')) return cleanBase;
  if (cleanBase.endsWith('/v1')) return `${cleanBase}/responses`;
  return `${cleanBase}/v1/responses`;
}

function resolveChatCompletionsEndpoint(baseUrl = 'https://api.openai.com') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/chat/completions')) return cleanBase;
  if (cleanBase.endsWith('/v1')) return `${cleanBase}/chat/completions`;
  return `${cleanBase}/v1/chat/completions`;
}

function redactEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    return `${url.origin}${url.pathname}`;
  } catch {
    return 'configured endpoint';
  }
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(statusCode === 204 ? '' : JSON.stringify(payload));
}
