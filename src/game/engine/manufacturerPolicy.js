import { adjustManufacturerRole, normalizeManufacturerPolicyRoles } from './manufacturerRoles.js';

export const buildNextManufacturerPolicy = ({
  manufacturerPolicy,
  achieveRate,
  random = Math.random,
}) => {
  const newPolicyMonth = (manufacturerPolicy.policyMonth || 1) + 1;
  let rebateMultiplier = manufacturerPolicy.rebateMultiplier;
  let msrpTrend = manufacturerPolicy.msrpTrend;
  let policyDesc = '';

  if (achieveRate >= 1.2) {
    const rebateUp = 0.1 + random() * 0.1;
    rebateMultiplier = Math.min(1.5, rebateMultiplier + rebateUp);
    msrpTrend = Math.min(5, msrpTrend + (random() * 1.5));
    policyDesc = `超额达成${(achieveRate * 100).toFixed(0)}%，厂家加大返利支持+${(rebateUp * 100).toFixed(0)}%`;
  } else if (achieveRate >= 0.8) {
    const rebateShift = (random() - 0.5) * 0.1;
    rebateMultiplier = Math.max(0.7, Math.min(1.3, rebateMultiplier + rebateShift));
    msrpTrend += (random() - 0.5) * 1.0;
    msrpTrend = Math.max(-3, Math.min(5, msrpTrend));
    policyDesc = `达成率${(achieveRate * 100).toFixed(0)}%，厂家维持标准政策，微调返利${rebateShift >= 0 ? '+' : ''}${(rebateShift * 100).toFixed(1)}%`;
  } else {
    const rescueRebate = 0.05 + random() * 0.15;
    rebateMultiplier = Math.min(1.6, rebateMultiplier + rescueRebate);
    msrpTrend = Math.max(-5, msrpTrend - random() * 2);
    policyDesc = `达成率仅${(achieveRate * 100).toFixed(0)}%，厂家加大促销返利+${(rescueRebate * 100).toFixed(0)}%，但指导价承压下调`;
  }

  if (random() < 0.2) {
    const events = [
      { desc: '厂家年度冲量，全线返利临时+15%', rebate: 0.15, msrp: 0 },
      { desc: '竞品降价压力，厂家下调指导价2%', rebate: 0, msrp: -2 },
      { desc: '新车上市旧款清库，返利+20%', rebate: 0.2, msrp: -1 },
      { desc: '原材料涨价，厂家上调指导价1.5%', rebate: -0.05, msrp: 1.5 },
    ];
    const event = events[Math.floor(random() * events.length)];
    rebateMultiplier = Math.max(0.5, Math.min(1.8, rebateMultiplier + event.rebate));
    msrpTrend = Math.max(-5, Math.min(8, msrpTrend + event.msrp));
    policyDesc += ` | 📢 ${event.desc}`;
  }

  const policyWithRole = adjustManufacturerRole({
    manufacturerPolicy: normalizeManufacturerPolicyRoles(manufacturerPolicy),
    role: 'hq',
    delta: achieveRate >= 1.2 ? 6 : achieveRate >= 0.8 ? 1 : -5,
    reason: `月度销量达成率${(achieveRate * 100).toFixed(0)}%，总部调整返利和指导价政策。`,
  });

  return {
    ...policyWithRole,
    rebateMultiplier,
    msrpTrend,
    policyMonth: newPolicyMonth,
    lastChange: policyDesc,
    history: [...(manufacturerPolicy.history || []), { month: newPolicyMonth, desc: policyDesc, rebate: rebateMultiplier, msrpTrend }],
  };
};

export const applyPolicyMsrpToInventory = ({
  inventory = [],
  carModels = [],
  modelPriceOverrides = {},
  policy,
}) => inventory.map(car => {
  const modelDef = carModels.find(model => model.id === car.modelId);
  if (modelDef && modelPriceOverrides[car.modelId] === undefined && car.price === modelDef.msrp) {
    return { ...car, price: Math.round(modelDef.msrp * (1 + (policy.msrpTrend || 0) / 100)) };
  }
  return car;
});

export const buildManufacturerPolicyMessages = ({
  policy,
  absoluteDay,
}) => ({
  log: {
    day: absoluteDay,
    type: 'info',
    message: `📋【商务政策更新】M${policy.policyMonth}月政策：返利系数 ×${policy.rebateMultiplier.toFixed(2)}，指导价${policy.msrpTrend >= 0 ? '上浮' : '下调'} ${Math.abs(policy.msrpTrend).toFixed(1)}%。${policy.lastChange}`,
  },
  inboxItem: {
    id: `inbox_policy_${absoluteDay}`,
    day: absoluteDay,
    from: '厂家总部商务部',
    title: `M${policy.policyMonth}月商务政策`,
    body: `返利系数调整为×${policy.rebateMultiplier.toFixed(2)}，指导价${policy.msrpTrend >= 0 ? '上浮' : '下调'}${Math.abs(policy.msrpTrend).toFixed(1)}%。${policy.lastChange}`,
  },
});

export const settleMonthlyManufacturerPolicy = ({
  manufacturerPolicy,
  achieveRate,
  inventory,
  carModels,
  modelPriceOverrides,
  currentMarketEnvironment,
  activeRegion,
  absoluteDay,
  buildNextMarketEnvironment,
  buildMarketEnvironmentMonthlyMessages,
  random = Math.random,
}) => {
  const policy = buildNextManufacturerPolicy({ manufacturerPolicy, achieveRate, random });
  const inventoryWithPolicyMsrp = applyPolicyMsrpToInventory({
    inventory,
    carModels,
    modelPriceOverrides,
    policy,
  });
  const policyMessages = buildManufacturerPolicyMessages({ policy, absoluteDay });
  const nextMarketEnvironment = buildNextMarketEnvironment({
    currentEnvironment: currentMarketEnvironment,
    nextMonth: policy.policyMonth,
    activeRegion,
    random,
  });
  const marketMessages = buildMarketEnvironmentMonthlyMessages({
    environment: nextMarketEnvironment,
    policyMonth: policy.policyMonth,
    absoluteDay,
  });

  return {
    inventory: inventoryWithPolicyMsrp,
    manufacturerPolicy: policy,
    marketEnvironment: nextMarketEnvironment,
    logs: [policyMessages.log, marketMessages.log],
    inboxItems: [policyMessages.inboxItem, marketMessages.inboxItem],
  };
};
