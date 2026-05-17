import {
  CUSTOMER_FOLLOWUP_ACTIONS,
  CUSTOMER_FOLLOWUP_TYPES,
  CUSTOMER_LIFECYCLE_DIFFICULTY,
} from '../config/customerLifecycle.js';
import { normalizeLeadChannels, sumLeadChannels } from './leads.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const normalizeCustomerLifecycleState = (customerLifecycle) => ({
  records: Array.isArray(customerLifecycle?.records) ? customerLifecycle.records.slice(-120) : [],
  followUps: Array.isArray(customerLifecycle?.followUps) ? customerLifecycle.followUps.slice(-40) : [],
});

const getDifficultyTuning = (activeDifficulty) => (
  CUSTOMER_LIFECYCLE_DIFFICULTY[activeDifficulty?.id] || CUSTOMER_LIFECYCLE_DIFFICULTY.standard
);

const getFollowUpType = (typeId) => CUSTOMER_FOLLOWUP_TYPES[typeId] || null;

export function createCustomerRecordFromDeal({
  currentDay,
  item,
  outcome,
  now = Date.now,
  random = Math.random,
}) {
  const profile = item.profile || {};
  const status = outcome.status === 'sold' ? 'sold' : outcome.status === 'lost' ? 'lost' : 'rejected';
  const valueScore = Math.round(
    (item.financeIntent || 0) * 24
      + (item.tradeInIntent || 0) * 18
      + (item.urgency || 0) * 10
      + (status === 'sold' ? 36 : status === 'lost' ? 18 : 8),
  );

  return {
    id: `crm_${item.id}_${now()}_${random().toString(36).slice(2, 6)}`,
    sourceDealId: item.id,
    customerName: item.customerName,
    status,
    stage: status === 'sold' ? '成交客户' : status === 'lost' ? '战败客户' : '放弃客户',
    createdDay: currentDay,
    lastInteractionDay: currentDay,
    nextFollowUpDay: currentDay + (status === 'sold' ? 3 : 4),
    channelId: item.channelId,
    channelName: item.channelName,
    modelId: item.modelId,
    modelName: item.modelName,
    segment: item.segment,
    archetypeName: item.archetypeName,
    outcomeMode: outcome.mode,
    outcomeReason: outcome.reason || '',
    finalPrice: outcome.finalPrice || null,
    grossProfit: outcome.grossProfit || null,
    closeChance: outcome.closeChance || null,
    profile,
    valueScore,
    referralPotential: status === 'sold' ? clamp(0.25 + (profile.trustNeed || 0) + (item.financeIntent || 0) * 0.12, 0, 0.95) : 0,
    revivalPotential: status !== 'sold' ? clamp(0.18 + (profile.patience || 0) * 0.3 - (profile.competitorPull || 0) * 0.16, 0.03, 0.75) : 0,
    renewalPotential: status === 'sold' ? clamp(0.2 + (item.tradeInIntent || 0) * 0.1 + (profile.trustNeed || 0) * 0.4, 0, 0.95) : 0,
    tags: [...(profile.focus || []), ...(profile.objections || [])].slice(0, 5),
  };
}

export function addCustomerRecord(customerLifecycle, record) {
  const state = normalizeCustomerLifecycleState(customerLifecycle);
  return {
    ...state,
    records: [record, ...state.records.filter(item => item.sourceDealId !== record.sourceDealId)].slice(0, 120),
  };
}

const pickFollowUpTypeId = ({ record, absoluteDay, random }) => {
  if (record.status === 'lost' || record.status === 'rejected') return 'revival';
  if (absoluteDay - record.createdDay >= CUSTOMER_FOLLOWUP_TYPES.renewal.minDaysAfter && random() < 0.35) return 'renewal';
  return random() < 0.62 ? 'referral' : 'satisfaction';
};

export function evaluateCustomerLifecycleDaily({
  activeDifficulty,
  absoluteDay,
  csi,
  customerLifecycle,
  random = Math.random,
}) {
  const tuning = getDifficultyTuning(activeDifficulty);
  let state = normalizeCustomerLifecycleState(customerLifecycle);
  const pendingRecordIds = new Set(state.followUps.filter(item => item.status === 'pending').map(item => item.recordId));
  const newFollowUps = [];

  for (const record of state.records) {
    if (newFollowUps.length >= tuning.maxDailyFollowUps) break;
    if (pendingRecordIds.has(record.id)) continue;
    if ((record.nextFollowUpDay || 1) > absoluteDay) continue;

    const typeId = pickFollowUpTypeId({ record, absoluteDay, random });
    const type = getFollowUpType(typeId);
    if (!type) continue;
    const csiFactor = csi.score >= 90 ? 1.2 : csi.score >= 84 ? 1 : 0.74;
    const potential = typeId === 'revival' ? record.revivalPotential : typeId === 'renewal' ? record.renewalPotential : record.referralPotential;
    const chance = clamp(type.baseChance * tuning.followUpChanceMultiplier * csiFactor + potential * 0.04, 0.02, 0.45);
    if (random() > chance) continue;

    newFollowUps.push({
      id: `crm_follow_${record.id}_${absoluteDay}_${typeId}`,
      recordId: record.id,
      typeId,
      status: 'pending',
      day: absoluteDay,
      dueDay: absoluteDay + 3,
      title: type.title,
      body: type.body,
      customerName: record.customerName,
      modelName: record.modelName,
      valueScore: record.valueScore,
    });
    pendingRecordIds.add(record.id);
  }

  if (newFollowUps.length === 0) {
    return { customerLifecycle: state, inboxItems: [], logs: [] };
  }

  state = { ...state, followUps: [...newFollowUps, ...state.followUps].slice(0, 40) };
  return {
    customerLifecycle: state,
    inboxItems: [{
      id: `inbox_crm_${absoluteDay}`,
      day: absoluteDay,
      from: '客户关系中心',
      title: `新增 ${newFollowUps.length} 个客户跟进机会`,
      body: '客户中心已筛出可跟进客户，请尽快安排销售或客服触达。',
      type: 'crm',
      tags: ['customer', 'crm'],
    }],
    logs: [{ day: absoluteDay, type: 'info', message: `👥【客户中心】新增 ${newFollowUps.length} 个客户跟进机会。` }],
  };
}

const applyFollowUpEffects = ({ effects, finance, marketing, monthlyStats, csi, insuranceRenewals, multiplier }) => {
  let nextFinance = { ...finance };
  let nextMarketing = normalizeLeadChannels(marketing);
  let nextMonthlyStats = { ...monthlyStats };
  let nextCsi = { ...csi };
  let nextInsuranceRenewals = { ...insuranceRenewals };

  if (effects.cashDelta) nextFinance.cash += Math.round(effects.cashDelta * multiplier);
  if (effects.csiDelta) nextCsi.score = clamp(nextCsi.score + effects.csiDelta * multiplier, 50, 100);
  if (effects.leadChannels) {
    const nextChannels = { ...nextMarketing.leadChannels };
    Object.entries(effects.leadChannels).forEach(([channel, value]) => {
      nextChannels[channel] = Math.max(0, (nextChannels[channel] || 0) + Math.round(value * multiplier));
    });
    nextMarketing = { ...nextMarketing, leadChannels: nextChannels, leads: sumLeadChannels(nextChannels) };
  }
  if (effects.monthlyStats) {
    Object.entries(effects.monthlyStats).forEach(([key, value]) => {
      nextMonthlyStats[key] = (nextMonthlyStats[key] || 0) + Math.round(value * multiplier);
    });
  }
  if (effects.insuranceRenewals) {
    Object.entries(effects.insuranceRenewals).forEach(([key, value]) => {
      nextInsuranceRenewals[key] = (nextInsuranceRenewals[key] || 0) + Math.round(value * multiplier);
    });
  }
  if (nextFinance.cash < 0) {
    nextFinance = { ...nextFinance, loan: nextFinance.loan + Math.abs(nextFinance.cash), cash: 0 };
  }

  return {
    csi: nextCsi,
    finance: nextFinance,
    insuranceRenewals: nextInsuranceRenewals,
    marketing: nextMarketing,
    monthlyStats: nextMonthlyStats,
  };
};

export function resolveCustomerFollowUp({
  actionId,
  activeDifficulty,
  csi,
  customerLifecycle,
  finance,
  formatMoney,
  insuranceRenewals,
  marketing,
  monthlyStats,
  followUpId,
  currentDay,
  random = Math.random,
}) {
  const state = normalizeCustomerLifecycleState(customerLifecycle);
  const followUp = state.followUps.find(item => item.id === followUpId && item.status === 'pending');
  if (!followUp) return { ok: false, reason: 'followup_not_found' };
  const type = getFollowUpType(followUp.typeId);
  const action = CUSTOMER_FOLLOWUP_ACTIONS.find(item => item.id === actionId) || CUSTOMER_FOLLOWUP_ACTIONS[1];
  if (!type) return { ok: false, reason: 'type_not_found' };

  const tuning = getDifficultyTuning(activeDifficulty);
  const successChance = clamp(0.58 + (action.successModifier || 0) + (tuning.successModifier || 0) + (csi.score >= 90 ? 0.06 : csi.score < 82 ? -0.08 : 0), 0.08, 0.95);
  const success = random() < successChance;
  const contactCost = Math.round((action.cost || 0) * (tuning.costMultiplier || 1));
  const baseEffects = success ? type.effects : {};
  const effectResult = applyFollowUpEffects({
    csi,
    effects: baseEffects,
    finance: { ...finance, cash: finance.cash - contactCost },
    insuranceRenewals,
    marketing,
    monthlyStats,
    multiplier: action.effectMultiplier || 1,
  });
  const nextFollowUps = state.followUps.map(item => item.id === followUpId
    ? { ...item, status: success ? 'resolved' : 'failed', actionId: action.id, resolvedDay: currentDay, success }
    : item);
  const nextRecords = state.records.map(record => record.id === followUp.recordId
    ? { ...record, lastInteractionDay: currentDay, nextFollowUpDay: currentDay + (success ? 8 : 5), lastFollowUpResult: success ? type.title : `${type.title}未成功` }
    : record);
  const ledgerItems = contactCost > 0 ? [{ label: `客户维护-${action.title}`, amount: -contactCost, type: 'expense' }] : [];
  const message = success ? type.successText : `${followUp.customerName} 暂未响应本次${action.title}。`;

  return {
    ok: true,
    ...effectResult,
    customerLifecycle: { records: nextRecords, followUps: nextFollowUps },
    ledgerItems,
    logs: [{ day: currentDay, type: success ? 'success' : 'info', message: `👥【客户跟进】${followUp.customerName}：${action.title}，${message}${contactCost > 0 ? ` 成本${formatMoney(contactCost)}。` : ''}` }],
    success,
  };
}
