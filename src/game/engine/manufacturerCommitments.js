import {
  MANUFACTURER_COMMITMENT_DEFAULTS,
  MANUFACTURER_COMMITMENT_DIFFICULTY,
  MANUFACTURER_COMMITMENT_POOL_BY_REWARD,
  MANUFACTURER_COMMITMENT_TYPES,
} from '../config/manufacturerPurchaseTargets.js';
import { adjustManufacturerRole, normalizeManufacturerPolicyRoles } from './manufacturerRoles.js';

const getDifficultyTuning = activeDifficulty => (
  MANUFACTURER_COMMITMENT_DIFFICULTY[activeDifficulty?.id || activeDifficulty] || MANUFACTURER_COMMITMENT_DIFFICULTY.standard
);

const pickCommitmentType = ({ reward, random }) => {
  const pool = MANUFACTURER_COMMITMENT_POOL_BY_REWARD[reward?.id] || ['purchase_floor'];
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return MANUFACTURER_COMMITMENT_TYPES[pool[index]] || MANUFACTURER_COMMITMENT_TYPES.purchase_floor;
};

export const normalizeManufacturerCommitments = (commitments = {}) => ({
  active: Array.isArray(commitments.active) ? commitments.active.slice(0, MANUFACTURER_COMMITMENT_DEFAULTS.maxActive) : [],
  history: Array.isArray(commitments.history) ? commitments.history.slice(0, MANUFACTURER_COMMITMENT_DEFAULTS.historyLimit) : [],
});

export const normalizeManufacturerPolicyCommitments = (manufacturerPolicy = {}) => ({
  ...normalizeManufacturerPolicyRoles(manufacturerPolicy),
  commitments: normalizeManufacturerCommitments(manufacturerPolicy.commitments),
});

export const createCommitmentFromReward = ({
  reward,
  month,
  nextPurchaseTarget,
  nextMonthSalesTarget,
  activeDifficulty,
  random = Math.random,
}) => {
  if (!reward) return null;
  const type = pickCommitmentType({ reward, random });
  const tuning = getDifficultyTuning(activeDifficulty);
  const targetValue = type.id === 'purchase_floor'
    ? Math.max(1, Math.round((nextPurchaseTarget?.targetUnits || 10) * tuning.requirementMultiplier))
    : type.id === 'sales_floor'
    ? Math.max(1, Math.round((nextMonthSalesTarget || 10) * 0.82 * tuning.requirementMultiplier))
    : Math.round((activeDifficulty?.id === 'hardcore' ? 90 : activeDifficulty?.id === 'rookie' ? 86 : 88) * tuning.requirementMultiplier);

  return {
    id: `mfg_commit_${month}_${reward.id}_${type.id}`,
    month,
    typeId: type.id,
    label: type.label,
    desc: type.desc,
    metricLabel: type.metricLabel,
    targetValue,
    sourceRewardLabel: reward.label,
    ownerRole: type.id === 'csi_floor' ? 'hq' : 'region',
    status: 'active',
  };
};

export const attachNextMonthCommitment = ({
  manufacturerPolicy,
  nextMonth,
  nextPurchaseTarget,
  nextMonthSalesTarget,
  activeDifficulty,
  random = Math.random,
}) => {
  const policy = normalizeManufacturerPolicyCommitments(manufacturerPolicy);
  const reward = policy.purchaseTarget?.lastReward || null;
  if (!reward) return policy;
  const commitment = createCommitmentFromReward({
    reward,
    month: nextMonth,
    nextPurchaseTarget,
    nextMonthSalesTarget,
    activeDifficulty,
    random,
  });
  if (!commitment) return policy;
  return {
    ...policy,
    commitments: {
      ...policy.commitments,
      active: [commitment],
    },
  };
};

const getCommitmentActualValue = ({ commitment, monthlyStats, csi }) => {
  if (commitment.typeId === 'purchase_floor') return Number(monthlyStats?.purchaseUnits || 0);
  if (commitment.typeId === 'sales_floor') return Number(monthlyStats?.sales || 0);
  if (commitment.typeId === 'csi_floor') return Number(csi?.score || monthlyStats?.csiScore || 0);
  return 0;
};

export const settleMonthlyManufacturerCommitments = ({
  manufacturerPolicy,
  monthlyStats,
  csi,
  activeDifficulty,
  month,
  absoluteDay,
}) => {
  const policy = normalizeManufacturerPolicyCommitments(manufacturerPolicy);
  const dueCommitments = policy.commitments.active.filter(item => (item.month || month) <= month);
  if (dueCommitments.length === 0) {
    return { manufacturerPolicy: policy, logs: [], inboxItems: [], settled: [] };
  }

  const tuning = getDifficultyTuning(activeDifficulty);
  let rebateMultiplier = policy.rebateMultiplier || 1;
  let nextPolicy = policy;
  const settled = dueCommitments.map(commitment => {
    const actualValue = getCommitmentActualValue({ commitment, monthlyStats, csi });
    const achieved = actualValue >= (commitment.targetValue || 0);
    const rebateDelta = achieved ? tuning.successRebateBonus : -tuning.breachRebatePenalty;
    rebateMultiplier = Math.max(0.5, Math.min(1.8, rebateMultiplier + rebateDelta));
    nextPolicy = adjustManufacturerRole({
      manufacturerPolicy: nextPolicy,
      role: commitment.ownerRole || (commitment.typeId === 'csi_floor' ? 'hq' : 'region'),
      delta: achieved ? 5 : -7,
      reason: `${commitment.label}${achieved ? '兑现' : '违约'}：${Math.round(actualValue)}/${commitment.targetValue}`,
    });
    return {
      ...commitment,
      actualValue,
      achieved,
      status: achieved ? 'fulfilled' : 'breached',
      rebateDelta,
    };
  });

  const summary = settled.map(item => `${item.label}${item.achieved ? '完成' : '违约'}：${Math.round(item.actualValue)}/${item.targetValue}`).join('；');
  const from = settled.some(item => item.ownerRole === 'hq') ? '厂家总部商务部' : '厂家区域经理';
  return {
    manufacturerPolicy: {
      ...nextPolicy,
      rebateMultiplier,
      lastChange: `${policy.lastChange || '商务政策延续'} | 厂家承诺结算：${summary}`,
      commitments: {
        active: policy.commitments.active.filter(item => !dueCommitments.some(due => due.id === item.id)),
        history: [...settled, ...(policy.commitments.history || [])].slice(0, MANUFACTURER_COMMITMENT_DEFAULTS.historyLimit),
      },
    },
    logs: [{
      day: absoluteDay,
      type: settled.every(item => item.achieved) ? 'success' : 'warning',
      message: `🤝【厂家承诺结算】${summary}。返利系数调整为×${rebateMultiplier.toFixed(2)}。`,
    }],
    inboxItems: [{
      id: `inbox_manufacturer_commitment_${absoluteDay}`,
      day: absoluteDay,
      from,
      title: '厂家承诺结算',
      body: `${summary}。兑现承诺会改善后续返利支持，违约会压低厂家支持。当前返利系数×${rebateMultiplier.toFixed(2)}。`,
      type: 'manufacturer',
      tags: ['manufacturer', 'commitment'],
    }],
    settled,
  };
};

export const formatCommitmentProgress = ({ commitment, monthlyStats, csi }) => {
  const actualValue = getCommitmentActualValue({ commitment, monthlyStats, csi });
  return {
    actualValue,
    targetValue: commitment?.targetValue || 0,
    progress: commitment?.targetValue ? Math.min(160, Math.round((actualValue / commitment.targetValue) * 100)) : 0,
  };
};
