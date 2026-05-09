const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeCapture(capture) {
  try {
    return await analyzeCaptureRemote(capture);
  } catch (error) {
    console.warn('[AIAdapter] OpenAI API unavailable, using local mock.', error);
    if (capture.imageDataUrl) {
      throw error;
    }
  }

  return analyzeCaptureMock(capture);
}

async function analyzeCaptureRemote(capture) {
  const response = await fetch('/api/analyze-capture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: capture.name,
      source: capture.source,
      mockText: capture.mockText,
      imageDataUrl: capture.imageDataUrl,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `AI API failed with ${response.status}`);
  }

  return response.json();
}

async function analyzeCaptureMock(capture) {
  await delay(1100);

  const text = `${capture.name || ''} ${capture.mockText || ''}`.toLowerCase();

  if (text.includes('aigc') || text.includes('比赛') || text.includes('报名')) {
    return buildResult({
      sceneType: 'competition',
      title: 'AIGC 创新赛报名行动卡',
      summary: '这是一条比赛报名通知，需要在截止前整理策划文档、原型图和团队信息。',
      datetime: '2026-05-11 08:00',
      location: '线上提交 / 创新楼304咨询',
      sourceNote: capture.source || '截图导入',
      tasks: [
        '完成作品策划文档',
        '整理团队介绍与成员分工',
        '补齐 5-8 张原型界面图',
        '5月8日前向指导教师确认材料',
      ],
      materials: ['策划文档', '团队介绍', '原型图', '指导教师信息'],
      tags: ['竞赛', '截止时间', '材料清单', '校园'],
      nextAction: '先把策划文档和原型图打包成一个提交清单。',
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
      datetime: '待定',
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
    tasks: ['补充一句这张截图要解决什么问题', '手动添加标签', '稍后重新识别'],
    materials: [],
    tags: ['待整理', '知识截图'],
    nextAction: '先保存，等网络或模型可用时重新识别。',
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

function buildReminders(datetime) {
  if (!datetime || datetime.includes('待')) {
    return ['保存为知识卡，不创建具体时间提醒'];
  }

  return ['提前1天提醒', '提前30分钟提醒'];
}
