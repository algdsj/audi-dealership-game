export const MANUFACTURER_NEGOTIATION_DEFAULTS = {
  resourceHistoryLimit: 8,
  auditHistoryLimit: 8,
  minDaysBetweenRequests: 5,
};

export const MANUFACTURER_RESOURCE_REQUESTS = {
  market_cofund: {
    id: 'market_cofund',
    ownerRole: 'region',
    label: '申请区域市场共投',
    desc: '用采购配合和区域销量换取市场活动共投，适合价格战或线索不足时使用。',
    resourceLabel: '区域市场共投',
    cashAmount: 45000,
    creditAmount: 0,
    relationCost: 4,
    relationGain: 2,
    requiredRelationship: 52,
    requiredProgress: 0.55,
    difficultyMultiplier: { rookie: 1.12, standard: 1, hardcore: 0.86 },
  },
  credit_letter: {
    id: 'credit_letter',
    ownerRole: 'region',
    label: '申请库存融资支持函',
    desc: '请大区向合作银行背书，换取额外库存融资额度；适合现金紧但还能消化库存时使用。',
    resourceLabel: '库存融资支持函',
    cashAmount: 0,
    creditAmount: 420000,
    relationCost: 5,
    relationGain: 2,
    requiredRelationship: 56,
    requiredProgress: 0.65,
    difficultyMultiplier: { rookie: 1.1, standard: 1, hardcore: 0.82 },
  },
  compliance_grace: {
    id: 'compliance_grace',
    ownerRole: 'hq',
    label: '提交合规整改计划',
    desc: '向总部承诺价格纪律、CSI修复和虚出整改，降低本月合规稽核风险。',
    resourceLabel: '总部合规缓冲',
    cashAmount: 0,
    creditAmount: 0,
    auditRiskDelta: -18,
    relationCost: 3,
    relationGain: 3,
    requiredRelationship: 50,
    requiredProgress: 0,
    difficultyMultiplier: { rookie: 1, standard: 1, hardcore: 1 },
  },
};

export const MANUFACTURER_AUDIT_RULES = {
  priceDisciplineWarning: 0.92,
  priceDisciplineDanger: 0.88,
  csiWarning: 82,
  csiDanger: 75,
  virtualSuspicionWarning: 35,
  virtualSuspicionDanger: 65,
  agedInventoryWarningDays: 75,
  agedInventoryDangerDays: 105,
  auditChanceBase: 0.08,
  auditChancePerRiskPoint: 0.006,
  penaltyBaseAmount: 55000,
  penaltyPerRiskPoint: 1800,
  rebatePenalty: 0.06,
  monthlyRiskDecay: 12,
};

export const MANUFACTURER_MONTHLY_DEMANDS = {
  hq: [
    { id: 'price_discipline', label: '守住价格纪律', detail: '低于指导价过深会触发总部关注，影响返利质量和稽核概率。' },
    { id: 'csi_quality', label: 'CSI与投诉控制', detail: '总部更看重客户口碑和品牌体验，CSI低会压返利与星级评价。' },
    { id: 'real_sales', label: '真实销量质量', detail: '虚出和浮库不能替代真实交付，异常冲量会提高合规风险。' },
  ],
  region: [
    { id: 'purchase_target', label: '采购目标推进', detail: '大区希望经销商锁定配额，超采能换支持，也会带来库存压力。' },
    { id: 'share_defense', label: '区域份额防守', detail: '竞品价格战时，大区更希望门店配合本地反制动作。' },
    { id: 'inventory_digest', label: '库存消化节奏', detail: '大区接受压库，但会要求下月销量或采购承诺兑现。' },
  ],
};
