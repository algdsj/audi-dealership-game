const PURPOSE_BY_SEGMENT = {
  年轻: ['年轻家庭第一台豪华车', '通勤兼顾周末出游', '希望车看起来更有面子'],
  商务: ['商务接待和日常通勤', '公司用车预算审批', '替换现有老车提升形象'],
  家庭: ['家庭换购SUV', '接送孩子和长途出游', '需要兼顾空间与安全感'],
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
  activeRegion,
  currentPrice,
  targetPrice,
  competitorPrice,
  financeIntent,
  tradeInIntent,
  urgency,
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
