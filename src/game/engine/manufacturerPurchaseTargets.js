import {
  MANUFACTURER_PURCHASE_REWARD_POOL,
  MANUFACTURER_PURCHASE_TARGET_DEFAULTS,
  MANUFACTURER_PURCHASE_TARGET_DIFFICULTY,
} from '../config/manufacturerPurchaseTargets.js';
import { attachNextMonthCommitment, normalizeManufacturerPolicyCommitments } from './manufacturerCommitments.js';
import { adjustManufacturerRole, normalizeManufacturerPolicyRoles } from './manufacturerRoles.js';

const getDifficultyTuning = activeDifficulty => (
  MANUFACTURER_PURCHASE_TARGET_DIFFICULTY[activeDifficulty?.id || activeDifficulty] || MANUFACTURER_PURCHASE_TARGET_DIFFICULTY.standard
);

export const createMonthlyPurchaseTarget = ({
  month,
  salesTarget,
  activeDifficulty,
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
    history: [],
  };
};

export const normalizeManufacturerPurchaseTarget = ({
  purchaseTarget,
  month = 1,
  salesTarget = 15,
  activeDifficulty,
}) => {
  const initialTarget = createMonthlyPurchaseTarget({ month, salesTarget, activeDifficulty });
  return {
    ...initialTarget,
    ...(purchaseTarget || {}),
    targetUnits: Math.max(1, Number(purchaseTarget?.targetUnits ?? initialTarget.targetUnits) || initialTarget.targetUnits),
    purchasedUnits: Math.max(0, Number(purchaseTarget?.purchasedUnits ?? initialTarget.purchasedUnits) || 0),
    history: Array.isArray(purchaseTarget?.history) ? purchaseTarget.history.slice(-MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit) : [],
  };
};

export const normalizeManufacturerPolicyPurchaseTarget = ({
  manufacturerPolicy = {},
  month = manufacturerPolicy.policyMonth || 1,
  salesTarget = 15,
  activeDifficulty,
}) => ({
  ...normalizeManufacturerPolicyCommitments(normalizeManufacturerPolicyRoles(manufacturerPolicy)),
  purchaseTarget: normalizeManufacturerPurchaseTarget({
    purchaseTarget: manufacturerPolicy.purchaseTarget,
    month,
    salesTarget,
    activeDifficulty,
  }),
});

export const recordPurchaseTargetOrder = ({
  manufacturerPolicy,
  quantity,
}) => {
  const policy = normalizeManufacturerPolicyPurchaseTarget({ manufacturerPolicy });
  return {
    ...policy,
    purchaseTarget: {
      ...policy.purchaseTarget,
      purchasedUnits: (policy.purchaseTarget.purchasedUnits || 0) + Math.max(0, Number(quantity) || 0),
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
  const extraUnits = Math.max(0, (target.purchasedUnits || 0) - (target.targetUnits || 0));
  const achieved = extraUnits >= MANUFACTURER_PURCHASE_TARGET_DEFAULTS.overPurchaseThreshold;
  const settledTarget = {
    month: target.month || month,
    targetUnits: target.targetUnits || 0,
    purchasedUnits: target.purchasedUnits || 0,
    extraUnits,
    achieved,
  };

  if (!achieved) {
    return {
      finance,
      manufacturerPolicy: adjustManufacturerRole({
        manufacturerPolicy: {
          ...policy,
          purchaseTarget: {
            ...target,
            status: 'missed',
            lastReward: null,
            history: [settledTarget, ...(target.history || [])].slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit),
          },
        },
        role: 'region',
        delta: -2,
        reason: `采购目标未超采：${target.purchasedUnits || 0}/${target.targetUnits || 0}台。`,
      }),
      ledgerItems: [],
      logs: [{
        day: absoluteDay,
        type: 'info',
        message: `📦【厂家采购目标】本月采购${target.purchasedUnits || 0}/${target.targetUnits || 0}台，未触发超采奖励。`,
      }],
      inboxItems: [],
      reward: null,
    };
  }

  const tuning = getDifficultyTuning(activeDifficulty);
  const rewardConfig = pickReward({ random });
  const amount = Math.round((rewardConfig.baseAmount + rewardConfig.perExtraUnit * extraUnits) * tuning.rewardMultiplier);
  const reward = {
    id: rewardConfig.id,
    label: rewardConfig.label,
    desc: rewardConfig.desc,
    amount,
    extraUnits,
    type: rewardConfig.type,
  };
  const nextFinance = reward.type === 'credit'
    ? { ...finance, creditLimit: (finance.creditLimit || 0) + amount }
    : { ...finance, cash: (finance.cash || 0) + amount };

  return {
    finance: nextFinance,
    manufacturerPolicy: adjustManufacturerRole({
      manufacturerPolicy: {
        ...policy,
        purchaseTarget: {
          ...target,
          status: 'rewarded',
          lastReward: reward,
          history: [{ ...settledTarget, reward }, ...(target.history || [])].slice(0, MANUFACTURER_PURCHASE_TARGET_DEFAULTS.historyLimit),
        },
      },
      role: 'region',
      delta: Math.min(10, 4 + extraUnits),
      reason: `超采${extraUnits}台，获得${reward.label}。`,
    }),
    ledgerItems: [{
      label: `厂家超采奖励：${reward.label}`,
      amount,
      type: reward.type === 'credit' ? 'pending' : 'income',
    }],
    logs: [{
      day: absoluteDay,
      type: 'success',
      message: `📦【厂家超采奖励】本月采购${target.purchasedUnits}/${target.targetUnits}台，超采${extraUnits}台，获得${reward.label} ${formatMoney(amount)}。`,
    }],
    inboxItems: [{
      id: `inbox_purchase_target_${absoluteDay}`,
      day: absoluteDay,
      from: '厂家区域经理',
      title: `采购目标超额奖励：${reward.label}`,
      body: `本月采购${target.purchasedUnits}/${target.targetUnits}台，超采${extraUnits}台。${reward.desc}奖励金额/授信 ${formatMoney(amount)}。`,
      type: 'manufacturer',
      tags: ['manufacturer', 'purchase'],
    }],
    reward,
  };
};

export const rollNextMonthPurchaseTarget = ({
  manufacturerPolicy,
  nextMonth,
  nextMonthSalesTarget,
  activeDifficulty,
  random = Math.random,
}) => {
  const policy = normalizeManufacturerPolicyPurchaseTarget({ manufacturerPolicy, month: nextMonth });
  const previousTarget = policy.purchaseTarget;
  const nextTarget = createMonthlyPurchaseTarget({
    month: nextMonth,
    salesTarget: nextMonthSalesTarget,
    activeDifficulty,
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
