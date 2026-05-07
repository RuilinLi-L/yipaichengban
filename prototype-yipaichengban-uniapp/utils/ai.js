function normalize(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, '');
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

  return dictionary.some(
    (group) => group.some((word) => query.includes(normalize(word))) && group.some((word) => term.includes(normalize(word))),
  );
}

export function searchAssets(assets, query) {
  const normalized = normalize(query);
  if (!normalized) {
    return assets.map((asset) => ({ asset, score: 1 }));
  }

  return assets
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

export function getHitTags(asset, query) {
  const normalized = normalize(query);
  return (asset.tags || []).filter((tag) => normalize(tag).includes(normalized) || semanticMatch(normalized, normalize(tag)));
}

export function buildAsset(payload, source = '本地导入') {
  return {
    id: `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    confidence: 84,
    status: 'ready',
    source,
    createdAt: new Date().toISOString(),
    ...payload,
  };
}

export function analyzeCapture(sample) {
  return buildAsset(
    {
      ...sample.payload,
      source: sample.source,
    },
    sample.source,
  );
}
