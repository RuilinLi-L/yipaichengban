export const sampleCaptures = [
  {
    id: 'competition',
    title: '比赛报名通知',
    source: '班级群截图',
    color: '#dff4e7',
    mockText:
      'AIGC创新赛应用赛道报名截止：2026年5月11日08:00。请各队在5月8日前提交作品策划文档、团队介绍、原型图和指导教师信息。联系人：李老师，地点：创新楼304。',
  },
  {
    id: 'lecture',
    title: '讲座海报',
    source: '校园海报拍照',
    color: '#e4efff',
    mockText:
      '蓝心大模型校园技术沙龙将于2026年6月3日19:00在图书馆报告厅举行。主题：端侧AI与移动应用创新。请提前10分钟签到，携带学生证。',
  },
  {
    id: 'guide',
    title: '攻略收藏截图',
    source: '网页/小红书截图',
    color: '#fff0d7',
    mockText:
      '西安两日美食攻略：第一天回民街、钟楼夜景；第二天陕西历史博物馆、大雁塔。建议提前预约博物馆，准备身份证，收藏店铺：子午路张记、马二酸汤水饺。',
  },
];

export const sceneLabels = {
  competition: '竞赛报名',
  lecture: '讲座活动',
  travel: '出行攻略',
  coursework: '课程任务',
  generic: '知识截图',
};

export const flowSteps = ['图片入沙盒', 'AI 抽取', '人工确认', '本地沉淀'];

export const privacyItems = [
  {
    title: '应用私有目录',
    body: '截图先进入应用侧数据区，和系统相册、社交软件内容保持边界。',
  },
  {
    title: '本地轻量库',
    body: '行动卡、标签、待办和检索字段使用本地存储保存，后续可替换为 SQLite 或 KV。',
  },
  {
    title: 'AIAdapter',
    body: '页面只依赖统一行动卡协议，代理服务、OpenAI 兼容接口、OCR 或端侧模型都能替换。',
  },
  {
    title: '人工确认',
    body: '模型只生成草稿，时间、地点、任务和材料需要用户确认后才进入知识库。',
  },
];
