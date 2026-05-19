import {
  CUSTOMER_ARCHETYPE_SERIES_BIAS,
  CUSTOMER_SERIES_PREFERENCE_WEIGHTS,
  CUSTOMER_SERIES_SENSITIVITY,
} from '../config/vehicleStructure.js';

const PURPOSE_BY_SEGMENT = {
  年轻: ['年轻家庭第一台豪华车', '通勤兼顾周末出游', '希望车看起来更有面子'],
  商务: ['商务接待和日常通勤', '公司用车预算审批', '替换现有老车提升形象'],
  家庭: ['家庭换购SUV', '接送孩子和长途出游', '需要兼顾空间与安全感'],
  新能源: ['希望换一台豪华纯电SUV', '关注智能座舱和补能体验', '想用新能源牌照兼顾品牌感'],
};

const DECISION_ROLES = [
  { id: 'self', label: '本人拍板', desc: '现场反馈会比较直接，价格和体验都要当场说清。', patience: 0.04 },
  { id: 'family', label: '家人共决策', desc: '需要给到安全、空间、售后保障的理由，回家还会再比较。', patience: 0.08, trustNeed: 0.08 },
  { id: 'company', label: '公司/合伙人审批', desc: '关注预算合规、发票和交付确定性，话术要偏理性。', priceSensitivity: 0.06, patience: 0.02 },
  { id: 'spouse', label: '伴侣有否决权', desc: '价格之外，颜色、配置、保养成本都会影响临门一脚。', trustNeed: 0.06 },
];

const FOCUS_POOL = [
  { id: 'price', label: '终端价格', archetypes: ['price', 'comparison'], modeFit: { close: 0.05, balanced: 0.03, margin: -0.05 } },
  { id: 'monthly_payment', label: '月供压力', archetypes: ['finance'], modeFit: { finance: 0.08, close: -0.02 } },
  { id: 'tradein_value', label: '旧车估值', archetypes: ['tradein'], modeFit: { balanced: 0.03, finance: 0.02 } },
  { id: 'delivery', label: '提车速度', archetypes: ['urgent'], modeFit: { margin: 0.02, close: 0.04 } },
  { id: 'brand_trust', label: '品牌与口碑', archetypes: ['comparison'], modeFit: { balanced: 0.03, finance: 0.01 } },
  { id: 'service', label: '售后安心', archetypes: ['tradein', 'finance'], modeFit: { finance: 0.03, balanced: 0.02 } },
  { id: 'configuration', label: '配置体验', archetypes: ['urgent', 'comparison'], modeFit: { margin: 0.02, balanced: 0.02 } },
];

const OBJECTION_POOL = [
  { id: 'competitor_quote', label: '竞品/同城报价更低', archetypes: ['price', 'comparison'], penalty: 0.07 },
  { id: 'budget_ceiling', label: '预算上限卡得很紧', archetypes: ['price', 'finance'], penalty: 0.05 },
  { id: 'loan_terms', label: '担心金融条款不透明', archetypes: ['finance'], penalty: 0.04 },
  { id: 'tradein_gap', label: '旧车估值低于预期', archetypes: ['tradein'], penalty: 0.05 },
  { id: 'family_review', label: '还要回去和家人商量', archetypes: ['comparison', 'urgent'], penalty: 0.03 },
  { id: 'delivery_risk', label: '怕交车和赠品承诺落空', archetypes: ['urgent'], penalty: 0.03 },
];

const pickOne = (items, random) => items[Math.floor(random() * items.length)];

const getSeriesCatalog = carModels => [...new Set((carModels || []).map(model => model.series).filter(Boolean))];

const pickWeightedSeries = ({ weights, availableSeries, random }) => {
  const entries = Object.entries(weights || {})
    .filter(([series]) => availableSeries.includes(series))
    .map(([series, weight]) => [series, Math.max(0, Number(weight) || 0)]);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return availableSeries[0] || null;
  let roll = random() * total;
  for (const [series, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return series;
  }
  return entries[entries.length - 1]?.[0] || null;
};

const buildCustomerSeriesPreference = ({ archetype, modelDef, activeRegion, carModels, random }) => {
  const availableSeries = getSeriesCatalog(carModels);
  const baseWeights = {
    ...(CUSTOMER_SERIES_PREFERENCE_WEIGHTS[modelDef.segment] || CUSTOMER_SERIES_PREFERENCE_WEIGHTS.商务),
  };
  Object.entries(CUSTOMER_ARCHETYPE_SERIES_BIAS[archetype.id] || {}).forEach(([series, bias]) => {
    baseWeights[series] = (baseWeights[series] || 0) + bias;
  });
  if (activeRegion?.id === 'nev_hot') {
    baseWeights['Q6L e-tron'] = (baseWeights['Q6L e-tron'] || 0) + 12;
    baseWeights.Q5L = (baseWeights.Q5L || 0) + 5;
  }

  const primary = pickWeightedSeries({ weights: baseWeights, availableSeries, random }) || modelDef.series;
  const secondaryWeights = { ...baseWeights, [primary]: 0 };
  const secondary = pickWeightedSeries({ weights: secondaryWeights, availableSeries, random });
  const preferredSeries = [primary, secondary].filter(Boolean);
  const avoidedSeries = availableSeries
    .filter(series => !preferredSeries.includes(series))
    .sort((a, b) => (baseWeights[a] || 0) - (baseWeights[b] || 0))
    .slice(0, 1);
  const sensitivity = CUSTOMER_SERIES_SENSITIVITY[primary] || { id: 'balanced', label: '综合体验敏感', closeBonus: 0.02 };
  const seriesFit = preferredSeries.includes(modelDef.series)
    ? sensitivity.closeBonus || 0.03
    : avoidedSeries.includes(modelDef.series)
      ? -0.06
      : -0.01;

  return {
    preferredSeries,
    avoidedSeries,
    sensitivity,
    seriesFit,
    preferenceReason: preferredSeries.includes(modelDef.series)
      ? `${modelDef.series} 符合客户的${sensitivity.label}。`
      : `客户更偏向 ${preferredSeries.join(' / ')}，当前车型需要用现车、价格或权益补强。`,
  };
};

const pickWeightedProfileItems = ({ pool, archetypeId, random, count }) => {
  const preferred = pool.filter(item => item.archetypes.includes(archetypeId));
  const rest = pool.filter(item => !item.archetypes.includes(archetypeId));
  const result = [];
  while (result.length < count && (preferred.length > 0 || rest.length > 0)) {
    const source = preferred.length > 0 && random() < 0.72 ? preferred : rest.length > 0 ? rest : preferred;
    const picked = source.splice(Math.floor(random() * source.length), 1)[0];
    if (picked && !result.some(item => item.id === picked.id)) result.push(picked);
  }
  return result;
};

export function createCustomerProfile({
  archetype,
  channel,
  modelDef,
  activeRegion = {},
  currentPrice,
  targetPrice,
  competitorPrice,
  financeIntent,
  tradeInIntent,
  urgency,
  carModels = [],
  random = Math.random,
}) {
  const role = pickOne(DECISION_ROLES, random);
  const purpose = pickOne(PURPOSE_BY_SEGMENT[modelDef.segment] || PURPOSE_BY_SEGMENT.商务, random);
  const focusItems = pickWeightedProfileItems({ pool: FOCUS_POOL.map(item => ({ ...item })), archetypeId: archetype.id, random, count: 3 });
  const objectionItems = pickWeightedProfileItems({ pool: OBJECTION_POOL.map(item => ({ ...item })), archetypeId: archetype.id, random, count: 2 });
  const budgetFlex = 0.012 + random() * 0.045 + urgency * 0.012;
  const budgetCeiling = Math.max(targetPrice, Math.round(targetPrice * (1 + budgetFlex) / 1000) * 1000);
  const statedBudget = Math.max(Math.round(modelDef.baseCost * 0.82), Math.round((targetPrice - 5000 - random() * 12000) / 1000) * 1000);
  const competitorPull = Math.max(0, Math.min(0.95, (archetype.priceFocus || 0) * 0.48 + (activeRegion.pricePressure < 0 ? 0.08 : 0) + (channel.id === 'sourcing' ? 0.05 : 0)));
  const trustNeed = Math.max(0, Math.min(0.95, 0.22 + (role.trustNeed || 0) + (channel.id === 'livestream' ? 0.06 : 0) + (archetype.id === 'comparison' ? 0.12 : 0)));
  const patience = Math.max(0.05, Math.min(0.95, 0.38 + (role.patience || 0) - urgency * 0.18 + (archetype.id === 'urgent' ? -0.12 : 0)));
  const seriesPreference = buildCustomerSeriesPreference({ archetype, modelDef, activeRegion, carModels, random });

  const modeFit = focusItems.reduce((acc, item) => {
    Object.entries(item.modeFit || {}).forEach(([mode, value]) => {
      acc[mode] = (acc[mode] || 0) + value;
    });
    return acc;
  }, {
    margin: 0,
    balanced: 0,
    finance: financeIntent * 0.04,
    close: urgency * 0.03,
  });

  if (tradeInIntent > 0.55) {
    modeFit.balanced += 0.03;
    modeFit.finance += 0.02;
  }
  if (competitorPrice < currentPrice) modeFit.margin -= Math.min(0.06, ((currentPrice - competitorPrice) / currentPrice) * 1.6);

  const communicationTips = [
    `先回应“${focusItems[0]?.label || '核心诉求'}”，再谈价格。`,
    role.id === 'family' || role.id === 'spouse' ? '补一段安全、售后和家庭使用场景，降低回家复盘时的反对点。' : '用总价、月供和交付时间给明确方案，减少反复拉扯。',
    financeIntent > 0.6 ? '金融方案要把首付、月供、手续费一次说透，避免客户觉得被套路。' : '不要强推金融，把让利和现车确定性放在前面。',
  ];

  return {
    purpose,
    decisionRole: role.label,
    decisionRoleDesc: role.desc,
    statedBudget,
    budgetCeiling,
    focus: focusItems.map(item => item.label),
    objections: objectionItems.map(item => item.label),
    preferredSeries: seriesPreference.preferredSeries,
    avoidedSeries: seriesPreference.avoidedSeries,
    sensitivity: seriesPreference.sensitivity,
    seriesFit: seriesPreference.seriesFit,
    preferenceReason: seriesPreference.preferenceReason,
    communicationTips,
    competitorPull,
    trustNeed,
    patience,
    modeFit,
    objectionPenalty: objectionItems.reduce((sum, item) => sum + (item.penalty || 0), 0),
  };
}

export function getCustomerProfileModeFit(item, mode) {
  return item?.profile?.modeFit?.[mode] || 0;
}
