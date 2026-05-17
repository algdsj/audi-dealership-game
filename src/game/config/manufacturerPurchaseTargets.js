export const MANUFACTURER_PURCHASE_TARGET_DEFAULTS = {
  targetToSalesMultiplier: 1.2,
  minimumTargetUnits: 10,
  overPurchaseThreshold: 1,
  historyLimit: 8,
};

export const MANUFACTURER_PURCHASE_TARGET_DIFFICULTY = {
  rookie: { targetMultiplier: 0.92, rewardMultiplier: 1.15 },
  standard: { targetMultiplier: 1, rewardMultiplier: 1 },
  hardcore: { targetMultiplier: 1.14, rewardMultiplier: 0.88 },
};

export const MANUFACTURER_PURCHASE_REWARD_POOL = [
  {
    id: 'cash_bonus',
    label: '超采现金奖励',
    desc: '厂家按超采贡献发放一次性采购奖励。',
    baseAmount: 28000,
    perExtraUnit: 9000,
    type: 'cash',
  },
  {
    id: 'marketing_cofund',
    label: '区域市场共投',
    desc: '厂家给到区域活动共投，可直接缓冲现金压力。',
    baseAmount: 18000,
    perExtraUnit: 7000,
    type: 'cash',
  },
  {
    id: 'credit_support',
    label: '库存融资支持函',
    desc: '厂家向合作银行出具支持函，提高下月库存融资授信。',
    baseAmount: 300000,
    perExtraUnit: 70000,
    type: 'credit',
  },
];

export const MANUFACTURER_COMMITMENT_DEFAULTS = {
  historyLimit: 8,
  maxActive: 1,
};

export const MANUFACTURER_COMMITMENT_DIFFICULTY = {
  rookie: { requirementMultiplier: 0.92, successRebateBonus: 0.05, breachRebatePenalty: 0.04 },
  standard: { requirementMultiplier: 1, successRebateBonus: 0.04, breachRebatePenalty: 0.06 },
  hardcore: { requirementMultiplier: 1.08, successRebateBonus: 0.03, breachRebatePenalty: 0.08 },
};

export const MANUFACTURER_COMMITMENT_TYPES = {
  purchase_floor: {
    id: 'purchase_floor',
    label: '下月采购承诺',
    desc: '厂家要求下月继续锁定配额，采购量不能低于承诺台数。',
    metricLabel: '采购台数',
  },
  sales_floor: {
    id: 'sales_floor',
    label: '下月销量承诺',
    desc: '厂家要求把超采库存转化为真实销量，不能只压库。',
    metricLabel: '销量台数',
  },
  csi_floor: {
    id: 'csi_floor',
    label: 'CSI底线承诺',
    desc: '厂家给支持后要求守住客户满意度，避免用激进手段冲量。',
    metricLabel: 'CSI分数',
  },
};

export const MANUFACTURER_COMMITMENT_POOL_BY_REWARD = {
  cash_bonus: ['purchase_floor', 'sales_floor'],
  marketing_cofund: ['sales_floor', 'csi_floor'],
  credit_support: ['purchase_floor', 'csi_floor'],
};
