import {
  MANUFACTURER_PURCHASE_REWARD_POOL,
  MANUFACTURER_PURCHASE_TARGET_DEFAULTS,
  MANUFACTURER_PURCHASE_TARGET_DIFFICULTY,
} from '../config/manufacturerPurchaseTargets.js';
import { CAR_MODELS } from '../config/vehicles.js';
import { normalizeManufacturerPolicyInteraction } from './manufacturerNegotiation.js';
import { attachNextMonthCommitment, normalizeManufacturerPolicyCommitments } from './manufacturerCommitments.js';
import { adjustManufacturerRole, normalizeManufacturerPolicyRoles } from './manufacturerRoles.js';
import {
  buildManufacturerStructureTarget,
  normalizeManufacturerStructureTarget,
  recordManufacturerStructurePurchase,
  settleManufacturerStructureTarget,
} from './vehicleStructure.js';

const getDifficultyTuning = activeDifficulty => (
  MANUFACTURER_PURCHASE_TARGET_DIFFICULTY[activeDifficulty?.id || activeDifficulty] || MANUFACTURER_PURCHASE_TARGET_DIFFICULTY.standard
);

export const createMonthlyPurchaseTarget = ({
  month,
  salesTarget,
  activeDifficulty,
  carModels = CAR_MODELS,
}) => {
  const tuning = getDifficultyTuning(activeDifficulty);
  const targetUnits = Math.max(
    MANUFACTURER_PURCHASE_TARGET_DEFAULTS.minimumTargetUnits,
    Math.round((salesTarget || 15) * MANUFACTURER_PURCHASE_TARGET_DEFAULTS.targetToSalesMultiplier * tuning.targetMultiplier),
  );
  return {
    month,
    targetUnits,
    purchasedUnits: 0,
    status: 'active',
    lastReward: null,
    structure: buildManufacturerStructureTarget({ month, targetUnits, carModels }),
    history: [],
  };
};

export const normalizeManufacturerPurchaseTarget = ({
  purchaseTarget,
  month = 1,
  salesTarget = 15,
  activeDifficulty,
  carModels = CAR_MODELS,
}) => {
  const initialTarget = createMonthlyPurchaseTarget({ month, salesTarget, activeDifficulty, carModels });
  const targetUnits = Math.max(1, Number(purchaseTarget?.targetUnits ?? initialTarget.targetUnits) || initialTarget.targetUnits);
  return {
    ...initialTarget,
    ...(purchaseTarget || {}),
    targetUnits,
    purchasedUnits: Math.max(0, Number(purchaseTarget?.purchasedUnits ?? initialTarget.purchasedUnits) || 0),
    structure: normalizeManufacturerStructureTarget({
      structure: purchaseTarget?.structure,
      month,
      targetUnits,
      carModels,
      historyLimit: MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit,
    }),
    history: Array.isArray(purchaseTarget?.history) ? purchaseTarget.history.slice(-MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit) : [],
  };
};

export const normalizeManufacturerPolicyPurchaseTarget = ({
  manufacturerPolicy = {},
  month = manufacturerPolicy.policyMonth || 1,
  salesTarget = 15,
  activeDifficulty,
  carModels = CAR_MODELS,
}) => ({
  ...normalizeManufacturerPolicyInteraction(normalizeManufacturerPolicyCommitments(normalizeManufacturerPolicyRoles(manufacturerPolicy))),
  purchaseTarget: normalizeManufacturerPurchaseTarget({
    purchaseTarget: manufacturerPolicy.purchaseTarget,
    month,
    salesTarget,
    activeDifficulty,
    carModels,
  }),
});

export const recordPurchaseTargetOrder = ({
  manufacturerPolicy,
  quantity,
  modelId,
  carModels = CAR_MODELS,
}) => {
  const policy = normalizeManufacturerPolicyPurchaseTarget({ manufacturerPolicy, carModels });
  return {
    ...policy,
    purchaseTarget: {
      ...policy.purchaseTarget,
      purchasedUnits: (policy.purchaseTarget.purchasedUnits || 0) + Math.max(0, Number(quantity) || 0),
      structure: recordManufacturerStructurePurchase({
        structure: policy.purchaseTarget.structure,
        modelId,
        quantity,
        carModels,
      }),
    },
  };
};

const pickReward = ({ random }) => {
  const index = Math.min(MANUFACTURER_PURCHASE_REWARD_POOL.length - 1, Math.floor(random() * MANUFACTURER_PURCHASE_REWARD_POOL.length));
  return MANUFACTURER_PURCHASE_REWARD_POOL[index];
};

export const settleMonthlyPurchaseTarget = ({
  manufacturerPolicy,
  finance,
  activeDifficulty,
  month,
  absoluteDay,
  formatMoney = value => String(value),
  random = Math.random,
}) => {
  const policy = normalizeManufacturerPolicyPurchaseTarget({ manufacturerPolicy, month });
  const target = policy.purchaseTarget;
  const structureResult = settleManufacturerStructureTarget({ structure: target.structure });
  const hasStructureActivity = structureResult.items.some(item => item.purchasedUnits > 0);
  const structureRewardAmount = hasStructureActivity ? structureResult.rewardAmount : 0;
  const structureRelationshipDelta = hasStructureActivity ? structureResult.relationshipDelta : 0;
  const extraUnits = Math.max(0, (target.purchasedUnits || 0) - (target.targetUnits || 0));
  const achieved = extraUnits >= MANUFACTURER_PURCHASE_TARGET_DEFAULTS.overPurchaseThreshold;
  const settledTarget = {
    month: target.month || month,
    targetUnits: target.targetUnits || 0,
    purchasedUnits: target.purchasedUnits || 0,
    extraUnits,
    achieved,
    structureResult: hasStructureActivity ? structureResult : null,
  };

  if (!achieved) {
    return {
      finance: structureRewardAmount > 0 ? { ...finance, cash: (finance.cash || 0) + structureRewardAmount } : finance,
      manufacturerPolicy: adjustManufacturerRole({
        manufacturerPolicy: {
          ...policy,
          purchaseTarget: {
            ...target,
            status: 'missed',
            lastReward: null,
            structure: {
              ...target.structure,
              status: 'settled',
              lastResult: hasStructureActivity ? structureResult : null,
              history: hasStructureActivity ? [structureResult, ...(target.structure?.history || [])].slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit) : target.structure?.history || [],
            },
            history: [settledTarget, ...(target.history || [])].slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit),
          },
        },
        role: 'region',
        delta: -2 + structureRelationshipDelta,
        reason: `采购目标未超采：${target.purchasedUnits || 0}/${target.targetUnits || 0}台。`,
      }),
      ledgerItems: structureRewardAmount > 0 ? [{ label: '厂家结构任务奖励', amount: structureRewardAmount, type: 'income' }] : [],
      logs: [{
        day: absoluteDay,
        type: 'info',
        message: `📦【厂家采购目标】本月采购${target.purchasedUnits || 0}/${target.targetUnits || 0}台，未触发超采奖励。`,
      }, ...(hasStructureActivity ? [{
        day: absoluteDay,
        type: structureResult.achieved ? 'success' : 'warning',
        message: `🚗【厂家结构任务】完成 ${structureResult.achievedCount}/${structureResult.totalCount} 项结构目标${structureRewardAmount > 0 ? `，获得${formatMoney(structureRewardAmount)}结构奖励` : ''}。`,
      }] : [])],
      inboxItems: hasStructureActivity ? [{
        id: `inbox_purchase_structure_${absoluteDay}`,
        day: absoluteDay,
        from: '厂家区域经理',
        title: `车型结构任务 ${structureResult.achievedCount}/${structureResult.totalCount}`,
        body: structureResult.items.map(item => `${item.label}：${item.purchasedUnits}/${item.targetUnits}台`).join('；'),
        type: 'manufacturer',
        tags: ['manufacturer', 'vehicle_structure'],
      }] : [],
      reward: null,
    };
  }

  const tuning = getDifficultyTuning(activeDifficulty);
  const rewardConfig = pickReward({ random });
  const amount = Math.round((rewardConfig.baseAmount + rewardConfig.perExtraUnit * extraUnits) * tuning.rewardMultiplier);
  const totalRewardAmount = amount + structureRewardAmount;
  const reward = {
    id: rewardConfig.id,
    label: rewardConfig.label,
    desc: rewardConfig.desc,
    amount,
    structureRewardAmount,
    extraUnits,
    type: rewardConfig.type,
  };
  const nextFinance = reward.type === 'credit'
    ? { ...finance, creditLimit: (finance.creditLimit || 0) + amount, cash: (finance.cash || 0) + structureRewardAmount }
    : { ...finance, cash: (finance.cash || 0) + totalRewardAmount };

  return {
    finance: nextFinance,
    manufacturerPolicy: adjustManufacturerRole({
      manufacturerPolicy: {
        ...policy,
        purchaseTarget: {
          ...target,
          status: 'rewarded',
          lastReward: reward,
          structure: {
            ...target.structure,
            status: 'settled',
            lastResult: hasStructureActivity ? structureResult : null,
            history: hasStructureActivity ? [structureResult, ...(target.structure?.history || [])].slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit) : target.structure?.history || [],
          },
          history: [{ ...settledTarget, reward }, ...(target.history || [])].slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit),
        },
      },
      role: 'region',
      delta: Math.min(10, 4 + extraUnits + structureRelationshipDelta),
      reason: `超采${extraUnits}台，获得${reward.label}。`,
    }),
    ledgerItems: [{
      label: `厂家超采奖励：${reward.label}`,
      amount,
      type: reward.type === 'credit' ? 'pending' : 'income',
    }, ...(structureRewardAmount > 0 ? [{ label: '厂家结构任务奖励', amount: structureRewardAmount, type: 'income' }] : [])],
    logs: [{
      day: absoluteDay,
      type: 'success',
      message: `📦【厂家超采奖励】本月采购${target.purchasedUnits}/${target.targetUnits}台，超采${extraUnits}台，获得${reward.label} ${formatMoney(amount)}。`,
    }, ...(hasStructureActivity ? [{
      day: absoluteDay,
      type: structureResult.achieved ? 'success' : 'warning',
      message: `🚗【厂家结构任务】完成 ${structureResult.achievedCount}/${structureResult.totalCount} 项结构目标${structureRewardAmount > 0 ? `，额外奖励${formatMoney(structureRewardAmount)}` : ''}。`,
    }] : [])],
    inboxItems: [{
      id: `inbox_purchase_target_${absoluteDay}`,
      day: absoluteDay,
      from: '厂家区域经理',
      title: `采购目标超额奖励：${reward.label}`,
      body: `本月采购${target.purchasedUnits}/${target.targetUnits}台，超采${extraUnits}台。${reward.desc}奖励金额/授信 ${formatMoney(amount)}。`,
      type: 'manufacturer',
      tags: ['manufacturer', 'purchase'],
    }, ...(hasStructureActivity ? [{
      id: `inbox_purchase_structure_${absoluteDay}`,
      day: absoluteDay,
      from: '厂家区域经理',
      title: `车型结构任务 ${structureResult.achievedCount}/${structureResult.totalCount}`,
      body: structureResult.items.map(item => `${item.label}：${item.purchasedUnits}/${item.targetUnits}台`).join('；'),
      type: 'manufacturer',
      tags: ['manufacturer', 'vehicle_structure'],
    }] : [])],
    reward,
  };
};

export const rollNextMonthPurchaseTarget = ({
  manufacturerPolicy,
  nextMonth,
  nextMonthSalesTarget,
  activeDifficulty,
  carModels = CAR_MODELS,
  random = Math.random,
}) => {
  const policy = normalizeManufacturerPolicyPurchaseTarget({ manufacturerPolicy, month: nextMonth, carModels });
  const previousTarget = policy.purchaseTarget;
  const nextTarget = createMonthlyPurchaseTarget({
    month: nextMonth,
    salesTarget: nextMonthSalesTarget,
    activeDifficulty,
    carModels,
  });
  const nextPolicy = {
    ...policy,
    purchaseTarget: {
      ...nextTarget,
      history: Array.isArray(previousTarget.history) ? previousTarget.history.slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit) : [],
      lastReward: previousTarget.lastReward || null,
    },
  };
  return attachNextMonthCommitment({
    manufacturerPolicy: nextPolicy,
    nextMonth,
    nextPurchaseTarget: nextTarget,
    nextMonthSalesTarget,
    activeDifficulty,
    random,
  });
};
