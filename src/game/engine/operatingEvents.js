import {
  OPERATING_EVENT_DIFFICULTY,
  OPERATING_EVENT_RESOLUTION_OPTIONS,
  OPERATING_EVENT_TYPES,
} from '../config/operatingEvents.js';
import { normalizeLeadChannels, sumLeadChannels } from './leads.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeOperatingEventsState = (operatingEvents) => ({
  pending: Array.isArray(operatingEvents?.pending) ? operatingEvents.pending : [],
  resolved: Array.isArray(operatingEvents?.resolved) ? operatingEvents.resolved : [],
});

export const getOperatingEventConfig = (eventTypeId) => OPERATING_EVENT_TYPES.find(event => event.id === eventTypeId) || null;

export const getOperatingEventTuning = (activeDifficulty) => (
  OPERATING_EVENT_DIFFICULTY[activeDifficulty?.id] || OPERATING_EVENT_DIFFICULTY.standard
);

export const getOperatingEventResolutionOptions = (event) => (
  event?.resolutionOptions || OPERATING_EVENT_RESOLUTION_OPTIONS[event?.tone || 'risk'] || OPERATING_EVENT_RESOLUTION_OPTIONS.risk
);

const getConditionPass = ({ event, context }) => {
  const condition = event.condition || {};
  if ((event.minDay || 0) > context.absoluteDay) return false;
  if (context.pendingEventTypeIds.has(event.id)) return false;
  if (condition.minSalesCount && context.salesCount < condition.minSalesCount) return false;
  if (condition.creditUsageGte) {
    const usage = context.finance.creditLimit > 0 ? context.finance.loan / context.finance.creditLimit : 0;
    if (usage < condition.creditUsageGte) return false;
  }
  if (condition.csiBelow && context.csi.score >= condition.csiBelow) return false;
  if (condition.csiAbove && context.csi.score < condition.csiAbove) return false;
  if (condition.targetProgressBelow) {
    const target = Math.max(1, context.monthlyStats.target || 1);
    if ((context.monthlyStats.sales || 0) / target >= condition.targetProgressBelow) return false;
  }
  if (condition.agedInventoryGte) {
    const agedCount = context.inventory.filter(car => (car.stockDays || 0) >= 60).length;
    if (agedCount < condition.agedInventoryGte) return false;
  }
  return true;
};

const calculateEventChance = ({ event, context, tuning }) => {
  const difficultyChance = tuning.chanceMultiplier || 1;
  const regionalPressure = event.tone === 'risk'
    ? 0.85 + (context.activeRegion.competitorChance || 0.55) * 0.35
    : 0.85 + (context.activeRegion.demand || 1) * 0.15;
  const dayPacing = context.dayOfMonth >= 24 && event.tone === 'risk' ? 1.15 : 1;
  return clamp(event.baseChance * difficultyChance * regionalPressure * dayPacing, 0, 0.45);
};

const scaleActionEffects = ({ effects = {}, tuning }) => {
  const costMultiplier = tuning.responseCostMultiplier || 1;
  const scaled = {};
  Object.entries(effects).forEach(([key, value]) => {
    if (typeof value !== 'number') {
      scaled[key] = value;
      return;
    }
    const isCost = key === 'financeCost' || key === 'manufacturerPenalty' || (key === 'cashDelta' && value < 0);
    scaled[key] = Math.round(value * (isCost ? costMultiplier : 1));
  });
  return scaled;
};

const applyEffects = ({ title, effects = {}, context, severity = 1, effectMultiplier = 1 }) => {
  let finance = { ...context.finance };
  let marketing = normalizeLeadChannels(context.marketing);
  let monthlyStats = { ...context.monthlyStats };
  let csi = { ...context.csi };
  const ledgerItems = [];

  const scale = (value, useSeverity = true) => Math.round(value * effectMultiplier * (useSeverity ? severity : 1));

  if (effects.cashDelta) {
    const amount = scale(effects.cashDelta);
    finance.cash += amount;
    ledgerItems.push({
      label: title,
      amount,
      type: amount >= 0 ? 'income' : 'expense',
    });
  }
  if (effects.creditLimitDelta) {
    finance.creditLimit = Math.max(0, finance.creditLimit + scale(effects.creditLimitDelta));
  }
  if (effects.financeCost) {
    const amount = scale(effects.financeCost);
    monthlyStats.financeCost = (monthlyStats.financeCost || 0) + amount;
    finance.cash -= amount;
    ledgerItems.push({ label: `${title}费用`, amount: -amount, type: 'expense' });
  }
  if (effects.csiDelta) {
    csi.score = clamp(csi.score + effects.csiDelta * effectMultiplier * severity, 50, 100);
  }
  if (effects.rebatePoolDelta) {
    monthlyStats.baseRebatesPool = (monthlyStats.baseRebatesPool || 0) + scale(effects.rebatePoolDelta);
  }
  if (effects.manufacturerPenalty) {
    const amount = scale(effects.manufacturerPenalty);
    monthlyStats.manufacturerPenalty = (monthlyStats.manufacturerPenalty || 0) + amount;
  }
  if (effects.monthlyStats) {
    Object.entries(effects.monthlyStats).forEach(([key, value]) => {
      monthlyStats[key] = (monthlyStats[key] || 0) + scale(value, false);
    });
  }
  if (effects.leadChannels) {
    const nextChannels = { ...marketing.leadChannels };
    Object.entries(effects.leadChannels).forEach(([channel, value]) => {
      nextChannels[channel] = Math.max(0, (nextChannels[channel] || 0) + scale(value, false));
    });
    marketing = {
      ...marketing,
      leadChannels: nextChannels,
      leads: sumLeadChannels(nextChannels),
    };
  }

  return {
    csi,
    finance,
    ledgerItems,
    marketing,
    monthlyStats,
  };
};

const normalizeFinanceIfNeeded = (finance) => {
  if (finance.cash >= 0) return finance;
  return { ...finance, loan: finance.loan + Math.abs(finance.cash), cash: 0 };
};

const buildPendingOperatingEvent = ({ event, absoluteDay, activeDifficulty, tuning }) => ({
  id: `op_evt_${event.id}_${absoluteDay}`,
  eventTypeId: event.id,
  day: absoluteDay,
  expiresOn: absoluteDay + (tuning.expiryGraceDays || 3),
  from: event.from,
  title: event.title,
  body: event.body,
  tone: event.tone,
  tags: event.tags || [],
  difficultyId: activeDifficulty?.id || 'standard',
  difficultyName: activeDifficulty?.name || '标准',
  status: 'pending',
});

const appendResolvedEvent = ({ operatingEvents, resolvedEvent }) => ({
  pending: operatingEvents.pending.filter(item => item.id !== resolvedEvent.id),
  resolved: [resolvedEvent, ...operatingEvents.resolved].slice(0, 60),
});

export function evaluateOperatingEvents({
  activeDifficulty,
  activeRegion,
  absoluteDay,
  csi,
  dayOfMonth,
  finance,
  formatMoney,
  inventory,
  marketing,
  monthlyStats,
  operatingEvents,
  salesCount,
  random = Math.random,
}) {
  const tuning = getOperatingEventTuning(activeDifficulty);
  const operatingEventsState = normalizeOperatingEventsState(operatingEvents);
  const context = {
    activeRegion,
    absoluteDay,
    csi,
    dayOfMonth,
    finance,
    inventory,
    marketing,
    monthlyStats,
    pendingEventTypeIds: new Set(operatingEventsState.pending.map(event => event.eventTypeId)),
    salesCount,
  };
  const candidates = OPERATING_EVENT_TYPES.filter(event => getConditionPass({ event, context }));
  const triggered = [];

  for (const event of candidates) {
    if (triggered.length >= tuning.maxDailyEvents) break;
    const chance = calculateEventChance({ event, context, tuning });
    if (random() < chance) triggered.push(event);
  }

  if (triggered.length === 0) {
    return {
      inboxItems: [],
      logs: [],
      pendingEvents: [],
      triggeredEvents: [],
    };
  }

  const logs = [];
  const inboxItems = [];
  const pendingEvents = triggered.map(event => buildPendingOperatingEvent({
    activeDifficulty,
    absoluteDay,
    event,
    tuning,
  }));

  pendingEvents.forEach(pendingEvent => {
    const event = getOperatingEventConfig(pendingEvent.eventTypeId);
    logs.push({
      day: absoluteDay,
      type: event.tone === 'opportunity' ? 'success' : 'warning',
      message: `📌【经营事件】${event.title} 已进入待处理队列，请在 D${pendingEvent.expiresOn} 前选择处理方案。`,
    });
    inboxItems.push({
      id: `inbox_operating_${event.id}_${absoluteDay}`,
      day: absoluteDay,
      from: event.from,
      title: event.title,
      body: `${event.body}\n\n已进入事件中心待处理。难度系数：${activeDifficulty?.name || '标准'}；最晚处理日：D${pendingEvent.expiresOn}。${formatMoney ? '' : ''}`,
      type: 'operating_event',
      tags: event.tags,
      eventTone: event.tone,
      operatingEventId: pendingEvent.id,
    });
  });

  return {
    inboxItems,
    logs,
    pendingEvents,
    triggeredEvents: triggered,
  };
}

export function resolveOperatingEvent({
  activeDifficulty,
  csi,
  eventInstance,
  finance,
  formatMoney,
  marketing,
  monthlyStats,
  operatingEvents,
  optionId,
  random = Math.random,
  resolvedDay,
}) {
  const event = getOperatingEventConfig(eventInstance?.eventTypeId);
  if (!event || !eventInstance) {
    return { ok: false, reason: 'event_not_found' };
  }

  const tuning = getOperatingEventTuning(activeDifficulty);
  const option = getOperatingEventResolutionOptions(event).find(item => item.id === optionId);
  if (!option) {
    return { ok: false, reason: 'option_not_found' };
  }

  const successChance = clamp((option.successChance || 0.6) + (tuning.successModifier || 0), 0.05, 0.95);
  const succeeded = random() < successChance;
  const eventEffectMultiplier = succeeded
    ? (option.eventEffectMultiplier ?? 1)
    : (option.failureEventEffectMultiplier ?? 1);

  const context = { csi, finance, marketing, monthlyStats };
  const actionEffects = applyEffects({
    title: `${event.title}：${option.title}`,
    effects: scaleActionEffects({ effects: option.effects, tuning }),
    context,
    severity: 1,
    effectMultiplier: 1,
  });
  const eventEffects = applyEffects({
    title: event.title,
    effects: event.effects,
    context: actionEffects,
    severity: tuning.severityMultiplier || 1,
    effectMultiplier: eventEffectMultiplier,
  });

  const nextFinance = normalizeFinanceIfNeeded(eventEffects.finance);
  const resolvedEvent = {
    ...eventInstance,
    status: 'resolved',
    resolvedDay,
    optionId: option.id,
    optionTitle: option.title,
    success: succeeded,
    successChance,
    eventEffectMultiplier,
  };
  const nextOperatingEvents = appendResolvedEvent({
    operatingEvents: normalizeOperatingEventsState(operatingEvents),
    resolvedEvent,
  });
  const ledgerItems = [...actionEffects.ledgerItems, ...eventEffects.ledgerItems];
  const resultLabel = succeeded ? '处理成功' : '处理未达预期';
  const moneyText = nextFinance.creditLimit !== finance.creditLimit ? ` 当前授信 ${formatMoney(nextFinance.creditLimit)}。` : '';

  return {
    ok: true,
    csi: eventEffects.csi,
    finance: nextFinance,
    inboxItems: [{
      id: `inbox_operating_resolved_${eventInstance.id}_${resolvedDay}`,
      day: resolvedDay,
      from: event.from,
      title: `${event.title}：${resultLabel}`,
      body: `已选择“${option.title}”。${succeeded ? '团队执行到位，事件影响得到控制。' : '执行效果一般，仍产生部分影响。'}${moneyText}`,
      type: 'operating_event',
      tags: event.tags,
      eventTone: event.tone,
      operatingEventId: eventInstance.id,
    }],
    ledgerItems,
    logs: [{
      day: resolvedDay,
      type: succeeded || event.tone === 'opportunity' ? 'success' : 'warning',
      message: `📌【经营事件处理】${event.title}：${option.title}，${resultLabel}。${moneyText}`,
    }],
    marketing: eventEffects.marketing,
    monthlyStats: eventEffects.monthlyStats,
    operatingEvents: nextOperatingEvents,
    resolvedEvent,
  };
}

export function settleExpiredOperatingEvents({
  activeDifficulty,
  absoluteDay,
  csi,
  finance,
  formatMoney,
  marketing,
  monthlyStats,
  operatingEvents,
}) {
  const tuning = getOperatingEventTuning(activeDifficulty);
  let nextFinance = finance;
  let nextMarketing = marketing;
  let nextMonthlyStats = monthlyStats;
  let nextCsi = csi;
  let nextOperatingEvents = normalizeOperatingEventsState(operatingEvents);
  const inboxItems = [];
  const ledgerItems = [];
  const logs = [];

  const expiredEvents = nextOperatingEvents.pending.filter(item => item.expiresOn < absoluteDay);
  if (expiredEvents.length === 0) {
    return {
      csi,
      finance,
      inboxItems,
      ledgerItems,
      logs,
      marketing,
      monthlyStats,
      operatingEvents: nextOperatingEvents,
    };
  }

  expiredEvents.forEach(eventInstance => {
    const event = getOperatingEventConfig(eventInstance.eventTypeId);
    if (!event) return;

    if (event.tone === 'risk') {
      const expiredResult = applyEffects({
        title: `${event.title}逾期`,
        effects: event.effects,
        context: { csi: nextCsi, finance: nextFinance, marketing: nextMarketing, monthlyStats: nextMonthlyStats },
        severity: tuning.severityMultiplier || 1,
        effectMultiplier: 1,
      });
      nextFinance = normalizeFinanceIfNeeded(expiredResult.finance);
      nextMarketing = expiredResult.marketing;
      nextMonthlyStats = expiredResult.monthlyStats;
      nextCsi = expiredResult.csi;
      ledgerItems.push(...expiredResult.ledgerItems);
    }

    const resolvedEvent = {
      ...eventInstance,
      status: 'expired',
      resolvedDay: absoluteDay,
      optionId: 'expired',
      optionTitle: event.tone === 'risk' ? '逾期未处理' : '错过机会',
      success: false,
      eventEffectMultiplier: event.tone === 'risk' ? 1 : 0,
    };
    nextOperatingEvents = appendResolvedEvent({ operatingEvents: nextOperatingEvents, resolvedEvent });
    logs.push({
      day: absoluteDay,
      type: event.tone === 'risk' ? 'warning' : 'info',
      message: `📌【经营事件逾期】${event.title}${event.tone === 'risk' ? '未及时处理，已形成经营影响。' : '未投入资源，机会已自然消散。'}${nextFinance.creditLimit !== finance.creditLimit ? ` 当前授信 ${formatMoney(nextFinance.creditLimit)}。` : ''}`,
    });
    inboxItems.push({
      id: `inbox_operating_expired_${eventInstance.id}_${absoluteDay}`,
      day: absoluteDay,
      from: event.from,
      title: `${event.title}：${resolvedEvent.optionTitle}`,
      body: event.tone === 'risk'
        ? '事件超过处理期限，系统已按原始风险结算影响。'
        : '机会事件超过处理期限，未产生额外收益。',
      type: 'operating_event',
      tags: event.tags,
      eventTone: event.tone,
      operatingEventId: eventInstance.id,
    });
  });

  return {
    csi: nextCsi,
    finance: nextFinance,
    inboxItems,
    ledgerItems,
    logs,
    marketing: nextMarketing,
    monthlyStats: nextMonthlyStats,
    operatingEvents: nextOperatingEvents,
  };
}
