import {
  MANUFACTURER_AUDIT_RULES,
  MANUFACTURER_MONTHLY_DEMANDS,
  MANUFACTURER_NEGOTIATION_DEFAULTS,
  MANUFACTURER_RESOURCE_REQUESTS,
} from '../config/manufacturerNegotiation.js';
import { adjustManufacturerRole, normalizeManufacturerPolicyRoles } from './manufacturerRoles.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const safeNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const ratio = (value, base) => (safeNumber(base) > 0 ? safeNumber(value) / safeNumber(base) : 0);

export const createInitialManufacturerInteraction = () => ({
  resourceHistory: [],
  audit: {
    riskScore: 0,
    graceUntilMonth: 0,
    lastResult: null,
    history: [],
  },
});

export const normalizeManufacturerInteraction = (interaction = {}) => {
  const initial = createInitialManufacturerInteraction();
  return {
    ...initial,
    ...interaction,
    resourceHistory: Array.isArray(interaction?.resourceHistory)
      ? interaction.resourceHistory.slice(0, MANUFACTURER_NEGOTIATION_DEFAULTS.resourceHistoryLimit)
      : [],
    audit: {
      ...initial.audit,
      ...(interaction?.audit || {}),
      riskScore: clamp(safeNumber(interaction?.audit?.riskScore)),
      history: Array.isArray(interaction?.audit?.history)
        ? interaction.audit.history.slice(0, MANUFACTURER_NEGOTIATION_DEFAULTS.auditHistoryLimit)
        : [],
    },
  };
};

export const normalizeManufacturerPolicyInteraction = (manufacturerPolicy = {}) => ({
  ...normalizeManufacturerPolicyRoles(manufacturerPolicy),
  interaction: normalizeManufacturerInteraction(manufacturerPolicy.interaction),
});

const getDifficultyId = activeDifficulty => activeDifficulty?.id || activeDifficulty || 'standard';

const getAveragePriceRatio = ({ modelPriceOverrides = {}, carModels = [] }) => {
  const overrides = Object.entries(modelPriceOverrides || {});
  if (overrides.length === 0) return 1;
  const ratios = overrides.map(([modelId, price]) => {
    const model = carModels.find(item => item.id === modelId);
    if (!model || !model.msrp) return 1;
    return safeNumber(price) / model.msrp;
  });
  return ratios.reduce((sum, value) => sum + value, 0) / Math.max(1, ratios.length);
};

export const calculateManufacturerAuditRisk = ({
  manufacturerPolicy = {},
  monthlyStats = {},
  inventory = [],
  csi = {},
  virtualSales = {},
  modelPriceOverrides = {},
  carModels = [],
  month = 1,
  rules = MANUFACTURER_AUDIT_RULES,
} = {}) => {
  const policy = normalizeManufacturerPolicyInteraction(manufacturerPolicy);
  const averagePriceRatio = getAveragePriceRatio({ modelPriceOverrides, carModels });
  const csiScore = safeNumber(csi.score || monthlyStats.csiScore || 0);
  const suspicion = safeNumber(virtualSales.suspicionLevel);
  const agedCount = inventory.filter(car => safeNumber(car.stockDays) >= rules.agedInventoryWarningDays).length;
  const dangerAgedCount = inventory.filter(car => safeNumber(car.stockDays) >= rules.agedInventoryDangerDays).length;
  const virtualCars = (virtualSales.virtualCars || []).length;
  const complaints = safeNumber(csi.complaints);
  const graceActive = safeNumber(policy.interaction.audit.graceUntilMonth) >= month;

  const priceRisk = averagePriceRatio < rules.priceDisciplineDanger
    ? 28
    : averagePriceRatio < rules.priceDisciplineWarning
    ? 16
    : 0;
  const csiRisk = csiScore > 0 && csiScore < rules.csiDanger
    ? 26
    : csiScore > 0 && csiScore < rules.csiWarning
    ? 14
    : 0;
  const virtualRisk = suspicion >= rules.virtualSuspicionDanger
    ? 24
    : suspicion >= rules.virtualSuspicionWarning
    ? 12
    : 0;
  const inventoryRisk = dangerAgedCount > 0 ? 14 : agedCount > 0 ? 8 : 0;
  const complaintRisk = Math.min(18, complaints * 6);
  const carryRisk = safeNumber(policy.interaction.audit.riskScore) * 0.35;
  const rawRisk = priceRisk + csiRisk + virtualRisk + inventoryRisk + complaintRisk + carryRisk + (virtualCars > 0 ? 10 : 0);
  const riskScore = clamp(rawRisk + (graceActive ? -18 : 0));

  const factors = [
    priceRisk > 0 ? { id: 'price', label: '价格纪律', detail: `平均成交/挂牌低于指导价约 ${Math.round((1 - averagePriceRatio) * 100)}%。`, level: priceRisk >= 28 ? 'danger' : 'watch' } : null,
    csiRisk > 0 ? { id: 'csi', label: 'CSI口碑', detail: `CSI ${Math.round(csiScore)} 分，投诉 ${complaints} 起。`, level: csiRisk >= 26 ? 'danger' : 'watch' } : null,
    virtualRisk > 0 || virtualCars > 0 ? { id: 'virtual', label: '虚出异常', detail: `虚出 ${virtualCars} 台，稽核疑点 ${Math.round(suspicion)}。`, level: virtualRisk >= 24 ? 'danger' : 'watch' } : null,
    inventoryRisk > 0 ? { id: 'inventory', label: '库存库龄', detail: `${agedCount} 台超过 ${rules.agedInventoryWarningDays} 天，${dangerAgedCount} 台超过 ${rules.agedInventoryDangerDays} 天。`, level: inventoryRisk >= 14 ? 'danger' : 'watch' } : null,
  ].filter(Boolean);

  return {
    riskScore: Math.round(riskScore),
    level: riskScore >= 70 ? 'danger' : riskScore >= 40 ? 'watch' : 'healthy',
    graceActive,
    auditChance: Math.min(0.85, rules.auditChanceBase + riskScore * rules.auditChancePerRiskPoint),
    factors,
  };
};

const getResourceRequestStatus = ({
  request,
  manufacturerPolicy,
  monthlyStats,
  dayOfMonth,
  month,
  auditRisk,
}) => {
  const role = manufacturerPolicy.roles?.[request.ownerRole] || manufacturerPolicy.roles?.region || {};
  const purchaseTarget = manufacturerPolicy.purchaseTarget || {};
  const purchaseProgress = ratio(purchaseTarget.purchasedUnits, purchaseTarget.targetUnits);
  const recent = (manufacturerPolicy.interaction?.resourceHistory || []).find(item => item.id === request.id && item.month === month);
  const progressOk = purchaseProgress >= request.requiredProgress;
  const relationshipOk = safeNumber(role.relationship) >= request.requiredRelationship;
  const dayOk = dayOfMonth >= 8 || request.ownerRole === 'hq';
  const csiOk = request.id !== 'compliance_grace' || auditRisk.riskScore >= 25 || safeNumber(monthlyStats.sales) > 0;
  const available = !recent && progressOk && relationshipOk && dayOk && csiOk;
  const blockers = [
    recent ? '本月已申请过' : null,
    !relationshipOk ? `${role.label || '厂家'}关系不足` : null,
    !progressOk ? '采购目标进度不足' : null,
    !dayOk ? '月初先跑几天经营数据' : null,
    !csiOk ? '当前合规风险较低，暂不需要整改缓冲' : null,
  ].filter(Boolean);
  return { available, blockers, purchaseProgress, relationship: safeNumber(role.relationship) };
};

export const buildManufacturerInteractionSnapshot = ({
  manufacturerPolicy = {},
  monthlyStats = {},
  finance = {},
  inventory = [],
  csi = {},
  virtualSales = {},
  modelPriceOverrides = {},
  carModels = [],
  marketEnvironment = {},
  dayOfMonth = 1,
  month = 1,
  activeDifficulty = 'standard',
} = {}) => {
  const policy = normalizeManufacturerPolicyInteraction(manufacturerPolicy);
  const auditRisk = calculateManufacturerAuditRisk({
    manufacturerPolicy: policy,
    monthlyStats,
    inventory,
    csi,
    virtualSales,
    modelPriceOverrides,
    carModels,
    month,
  });
  const purchaseTarget = policy.purchaseTarget || {};
  const purchaseProgress = ratio(purchaseTarget.purchasedUnits, purchaseTarget.targetUnits);
  const extraUnits = Math.max(0, safeNumber(purchaseTarget.purchasedUnits) - safeNumber(purchaseTarget.targetUnits));
  const regionPressure = purchaseProgress < 0.6 && dayOfMonth >= 18 ? '大区会继续催采' : extraUnits > 0 ? '大区倾向给资源置换' : '大区关系可谈';
  const hqPressure = auditRisk.level === 'danger' ? '总部稽核压力高' : auditRisk.level === 'watch' ? '总部关注合规' : '总部关系平稳';
  const difficultyId = getDifficultyId(activeDifficulty);
  const resourceRequests = Object.values(MANUFACTURER_RESOURCE_REQUESTS).map(request => {
    const status = getResourceRequestStatus({
      request,
      manufacturerPolicy: policy,
      monthlyStats,
      dayOfMonth,
      month,
      auditRisk,
    });
    const multiplier = request.difficultyMultiplier?.[difficultyId] || 1;
    return {
      ...request,
      cashAmount: Math.round(safeNumber(request.cashAmount) * multiplier),
      creditAmount: Math.round(safeNumber(request.creditAmount) * multiplier),
      available: status.available,
      blockers: status.blockers,
      purchaseProgress: status.purchaseProgress,
      relationship: status.relationship,
    };
  });

  return {
    demands: MANUFACTURER_MONTHLY_DEMANDS,
    hqPressure,
    regionPressure,
    priceWarActive: Boolean(marketEnvironment.priceWarActive || marketEnvironment.competitorEvent?.priceDrift < 0),
    purchaseProgress,
    extraUnits,
    auditRisk,
    resourceRequests,
    resourceHistory: policy.interaction.resourceHistory || [],
    auditHistory: policy.interaction.audit.history || [],
    financeHint: {
      cash: safeNumber(finance.cash),
      creditLimit: safeNumber(finance.creditLimit),
    },
  };
};

export const resolveManufacturerResourceRequest = ({
  requestId,
  manufacturerPolicy,
  finance,
  monthlyStats,
  inventory = [],
  csi = {},
  virtualSales = {},
  modelPriceOverrides = {},
  carModels = [],
  marketEnvironment = {},
  currentDay,
  month,
  dayOfMonth,
  activeDifficulty,
  formatMoney = value => String(value),
}) => {
  const policy = normalizeManufacturerPolicyInteraction(manufacturerPolicy);
  const snapshot = buildManufacturerInteractionSnapshot({
    manufacturerPolicy: policy,
    finance,
    monthlyStats,
    inventory,
    csi,
    virtualSales,
    modelPriceOverrides,
    carModels,
    marketEnvironment,
    month,
    dayOfMonth,
    activeDifficulty,
  });
  const request = snapshot.resourceRequests.find(item => item.id === requestId);
  if (!request) {
    return { status: 'invalid', alert: { title: '厂家资源申请失败', message: '未找到这项厂家资源。' } };
  }
  if (!request.available) {
    return {
      status: 'blocked',
      alert: {
        title: '暂时谈不下来',
        message: request.blockers.length > 0 ? request.blockers.join('、') : '当前条件不足，先推进经营数据再谈。',
      },
    };
  }

  let nextFinance = { ...finance };
  let nextMonthlyStats = { ...monthlyStats };
  let nextPolicy = policy;
  if (request.cashAmount > 0) {
    nextFinance.cash = safeNumber(nextFinance.cash) + request.cashAmount;
    nextMonthlyStats.manufacturerSupportIncome = safeNumber(nextMonthlyStats.manufacturerSupportIncome) + request.cashAmount;
  }
  if (request.creditAmount > 0) {
    nextFinance.creditLimit = safeNumber(nextFinance.creditLimit) + request.creditAmount;
  }
  if (request.auditRiskDelta) {
    nextPolicy = {
      ...nextPolicy,
      interaction: {
        ...nextPolicy.interaction,
        audit: {
          ...nextPolicy.interaction.audit,
          riskScore: clamp(safeNumber(nextPolicy.interaction.audit.riskScore) + request.auditRiskDelta),
          graceUntilMonth: month,
        },
      },
    };
  }
  nextPolicy = adjustManufacturerRole({
    manufacturerPolicy: nextPolicy,
    role: request.ownerRole,
    delta: request.relationGain - request.relationCost,
    reason: `${request.label}已提交：${request.resourceLabel}。`,
  });
  const historyItem = {
    id: request.id,
    month,
    day: currentDay,
    label: request.label,
    resourceLabel: request.resourceLabel,
    cashAmount: request.cashAmount,
    creditAmount: request.creditAmount,
    ownerRole: request.ownerRole,
  };
  nextPolicy = {
    ...nextPolicy,
    interaction: {
      ...normalizeManufacturerInteraction(nextPolicy.interaction),
      resourceHistory: [historyItem, ...(nextPolicy.interaction?.resourceHistory || [])].slice(0, MANUFACTURER_NEGOTIATION_DEFAULTS.resourceHistoryLimit),
    },
  };

  const benefit = request.cashAmount > 0
    ? formatMoney(request.cashAmount)
    : request.creditAmount > 0
    ? `授信+${formatMoney(request.creditAmount)}`
    : '合规风险下降';
  return {
    status: 'resolved',
    finance: nextFinance,
    monthlyStats: nextMonthlyStats,
    manufacturerPolicy: nextPolicy,
    ledgerItem: request.cashAmount > 0
      ? { label: `厂家资源：${request.resourceLabel}`, amount: request.cashAmount, type: 'income' }
      : null,
    log: {
      type: 'success',
      message: `🤝【厂家资源】${request.resourceLabel}谈成，获得${benefit}。`,
    },
    alert: {
      title: '厂家资源谈成',
      message: `${request.resourceLabel}已落地：${benefit}。关系会根据配合度微调。`,
    },
  };
};

export const settleManufacturerComplianceAudit = ({
  manufacturerPolicy,
  finance,
  monthlyStats,
  inventory,
  csi,
  virtualSales,
  modelPriceOverrides,
  carModels,
  activeDifficulty,
  month,
  absoluteDay,
  formatMoney = value => String(value),
  random = Math.random,
}) => {
  const policy = normalizeManufacturerPolicyInteraction(manufacturerPolicy);
  const risk = calculateManufacturerAuditRisk({
    manufacturerPolicy: policy,
    monthlyStats,
    inventory,
    csi,
    virtualSales,
    modelPriceOverrides,
    carModels,
    month,
  });
  const difficultyId = getDifficultyId(activeDifficulty);
  const chanceMultiplier = difficultyId === 'hardcore' ? 1.18 : difficultyId === 'rookie' ? 0.78 : 1;
  const auditChance = Math.min(0.9, risk.auditChance * chanceMultiplier);
  const triggered = risk.riskScore >= 35 && random() < auditChance;
  const decayedRisk = clamp(Math.max(0, risk.riskScore - MANUFACTURER_AUDIT_RULES.monthlyRiskDecay));

  if (!triggered) {
    return {
      finance,
      monthlyStats,
      manufacturerPolicy: {
        ...policy,
        interaction: {
          ...policy.interaction,
          audit: {
            ...policy.interaction.audit,
            riskScore: decayedRisk,
            lastResult: { month, triggered: false, riskScore: risk.riskScore },
          },
        },
      },
      ledgerItems: [],
      logs: risk.riskScore >= 45 ? [{
        day: absoluteDay,
        type: 'info',
        message: `🏭【总部合规】本月风险${risk.riskScore}，总部暂未抽查，但下月仍会关注价格、CSI和虚出。`,
      }] : [],
      inboxItems: [],
    };
  }

  const penalty = Math.round(MANUFACTURER_AUDIT_RULES.penaltyBaseAmount + risk.riskScore * MANUFACTURER_AUDIT_RULES.penaltyPerRiskPoint);
  const nextFinance = { ...finance, cash: safeNumber(finance.cash) - penalty };
  const nextMonthlyStats = {
    ...monthlyStats,
    manufacturerPenalty: safeNumber(monthlyStats.manufacturerPenalty) + penalty,
  };
  const nextPolicy = adjustManufacturerRole({
    manufacturerPolicy: {
      ...policy,
      rebateMultiplier: Math.max(0.5, safeNumber(policy.rebateMultiplier || 1) - MANUFACTURER_AUDIT_RULES.rebatePenalty),
      interaction: {
        ...policy.interaction,
        audit: {
          ...policy.interaction.audit,
          riskScore: Math.round(risk.riskScore * 0.45),
          lastResult: { month, triggered: true, riskScore: risk.riskScore, penalty },
          history: [{
            month,
            riskScore: risk.riskScore,
            penalty,
            factors: risk.factors.map(item => item.label),
          }, ...(policy.interaction.audit.history || [])].slice(0, MANUFACTURER_NEGOTIATION_DEFAULTS.auditHistoryLimit),
        },
      },
    },
    role: 'hq',
    delta: -8,
    reason: `总部合规抽查扣罚：风险${risk.riskScore}，罚款${formatMoney(penalty)}。`,
  });

  return {
    finance: nextFinance,
    monthlyStats: nextMonthlyStats,
    manufacturerPolicy: nextPolicy,
    ledgerItems: [{ label: '厂家总部合规扣罚', amount: penalty, type: 'expense' }],
    logs: [{
      day: absoluteDay,
      type: 'warning',
      message: `🏭【总部合规稽核】风险${risk.riskScore}触发抽查，罚款${formatMoney(penalty)}，返利系数-0.06。`,
    }],
    inboxItems: [{
      id: `inbox_manufacturer_audit_${absoluteDay}`,
      day: absoluteDay,
      from: '厂家总部商务合规部',
      title: '总部合规稽核扣罚',
      body: `本月价格纪律、CSI、虚出或库存异常触发总部抽查，罚款${formatMoney(penalty)}。建议下月先做合规整改，再谈区域资源。`,
      type: 'manufacturer',
      tags: ['manufacturer', 'audit'],
    }],
  };
};
