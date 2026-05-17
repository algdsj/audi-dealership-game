import { STORY_EVENT_CHAINS, STORY_EVENT_VERSION } from '../config/storyEvents.js';

const DEFAULT_RANDOM = () => 0.5;
const STAFF_TYPES = ['dcc', 'sales', 'service', 'streamer'];

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

const toRandom = (rng) => {
  if (typeof rng === 'function') return rng;
  if (rng && typeof rng.random === 'function') return () => rng.random();
  if (rng && typeof rng.next === 'function') return () => rng.next();
  return DEFAULT_RANDOM;
};

const asArray = (value) => Array.isArray(value) ? value : [];

const getDayOfMonth = (day = 1) => ((Math.max(1, Number(day) || 1) - 1) % 30) + 1;
const getMonth = (day = 1, month) => Number(month) || Math.floor((Math.max(1, Number(day) || 1) - 1) / 30) + 1;

const formatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

const getInventory = (gameState = {}) => asArray(gameState.inventory || gameState.stockList);

const getCsiScore = (gameState = {}) => {
  if (Number.isFinite(gameState.csiScore)) return gameState.csiScore;
  if (Number.isFinite(gameState.csi?.score)) return gameState.csi.score;
  if (Number.isFinite(gameState.monthlyStats?.csiScore)) return gameState.monthlyStats.csiScore;
  return 90;
};

const getActiveDrafts = (drafts = {}) => asArray(drafts.activeDrafts);

const countOverdueDrafts = (gameState = {}) => {
  if (Number.isFinite(gameState.overdueDraftCount)) return gameState.overdueDraftCount;
  return getActiveDrafts(gameState.drafts).filter(draft => draft.status === 'defaulted').length;
};

const getNetProfit = (monthlyStats = {}) => (
  (monthlyStats.revenue || 0)
  + (monthlyStats.derivativeRevenue || 0)
  + (monthlyStats.afterSalesRevenue || 0)
  + (monthlyStats.financeCommission || 0)
  + (monthlyStats.usedCarRevenue || 0)
  + (monthlyStats.insuranceRenewalRevenue || 0)
  - (monthlyStats.cogs || 0)
  - (monthlyStats.derivativeCost || 0)
  - (monthlyStats.afterSalesCost || 0)
  - (monthlyStats.usedCarCost || 0)
  - (monthlyStats.usedCarPrepCost || 0)
  - (monthlyStats.rent || 0)
  - (monthlyStats.depreciation || 0)
  - (monthlyStats.labor || 0)
  - (monthlyStats.financeCost || 0)
  - (monthlyStats.marketingCost || 0)
  - (monthlyStats.storageCost || 0)
  - (monthlyStats.floatingCost || 0)
  - (monthlyStats.manufacturerPenalty || 0)
);

const getInventoryMetrics = (gameState = {}) => {
  const inventory = getInventory(gameState);
  const facility = gameState.facility || {};
  const capacity = Math.max(1, (facility.showroomSpots || 0) + (facility.warehouseCapacity || 0));
  const stockDays = inventory.map(car => Number(car.stockDays) || 0);
  const avgStockDays = stockDays.length > 0
    ? stockDays.reduce((sum, days) => sum + days, 0) / stockDays.length
    : 0;
  const longStockCount = stockDays.filter(days => days >= 60).length;
  const veryLongStockCount = stockDays.filter(days => days >= 90).length;
  return {
    count: inventory.length,
    capacity,
    fillRate: inventory.length / capacity,
    avgStockDays,
    longStockCount,
    veryLongStockCount,
  };
};

const getAllStaffMembers = (gameState = {}) => {
  const staff = gameState.staff || {};
  const frontOffice = STAFF_TYPES.flatMap(type => asArray(staff[type]?.members).map(member => ({ ...member, type })));
  const techs = asArray(gameState.afterSales?.technicians).map(member => ({ ...member, type: 'tech' }));
  return [...frontOffice, ...techs];
};

const scoreStaffMemberRisk = (member = {}) => {
  const skill = clamp(member.skill, 0, 100);
  const stress = clamp(member.stress, 0, 100);
  const loyalty = Number.isFinite(member.loyalty) ? clamp(member.loyalty, 0, 100) : 62;
  const retentionShield = member.retained ? 22 : 0;
  return clamp((skill * 0.24) + (stress * 0.48) + ((100 - loyalty) * 0.42) - retentionShield, 0, 100);
};

const getStaffRiskMetrics = (gameState = {}) => {
  const members = getAllStaffMembers(gameState);
  const riskRows = members
    .map(member => ({ member, risk: scoreStaffMemberRisk(member) }))
    .sort((a, b) => b.risk - a.risk);
  const highRiskMembers = riskRows.filter(row => row.risk >= 58);
  const avgStress = members.length > 0
    ? members.reduce((sum, member) => sum + clamp(member.stress, 0, 100), 0) / members.length
    : 0;
  const avgLoyalty = members.length > 0
    ? members.reduce((sum, member) => sum + (Number.isFinite(member.loyalty) ? clamp(member.loyalty, 0, 100) : 62), 0) / members.length
    : 62;
  const coreMembers = members.filter(member => clamp(member.skill, 0, 100) >= 78);
  const unretainedCore = coreMembers.filter(member => !member.retained).length;
  return {
    members,
    riskRows,
    highRiskMembers,
    topRisk: riskRows[0] || null,
    avgStress,
    avgLoyalty,
    unretainedCore,
  };
};

const getCompetitorPressure = (competitors = {}) => {
  const stores = asArray(competitors.stores);
  const visibleActivities = stores.filter(store => store.currentActivity || store.isVisible);
  const priceWarScore = competitors.priceWarActive ? 28 + (competitors.priceWarRound || 1) * 8 : 0;
  const activityScore = visibleActivities.reduce((sum, store) => {
    const activity = store.currentActivity || {};
    const actionScore = activity.type === 'discount' ? 16 : activity.type === 'digital' ? 12 : activity.type === 'event' ? 10 : 6;
    return sum + actionScore + Math.max(0, (store.staffQuality || 58) - 65) * 0.25;
  }, 0);
  return clamp(priceWarScore + activityScore, 0, 100);
};

const scoreInvestorPressure = (gameState = {}, timing = {}) => {
  const monthlyStats = gameState.monthlyStats || {};
  const finance = gameState.finance || {};
  const investorRelations = gameState.investorRelations || {};
  const target = Math.max(1, monthlyStats.target || 1);
  const actualRate = (monthlyStats.sales || 0) / target;
  const expectedRate = timing.dayOfMonth / 30;
  const paceGap = Math.max(0, expectedRate - actualRate);
  const netProfit = getNetProfit(monthlyStats);
  const cash = finance.cash || 0;
  const loanRatio = finance.creditLimit > 0 ? (finance.loan || 0) / finance.creditLimit : 1;
  return clamp(
    (paceGap * 85)
    + (netProfit < 0 ? Math.min(28, Math.abs(netProfit) / 45000) : 0)
    + (cash < 800000 ? (800000 - cash) / 26000 : 0)
    + (loanRatio > 0.72 ? (loanRatio - 0.72) * 70 : 0)
    + (getCsiScore(gameState) < 86 ? (86 - getCsiScore(gameState)) * 1.8 : 0)
    + ((investorRelations.badReviews || 0) * 16)
    + (investorRelations.lastScore < 60 ? 18 : investorRelations.lastScore < 72 ? 8 : 0),
  );
};

const scoreManufacturerPressure = (gameState = {}) => {
  const monthlyStats = gameState.monthlyStats || {};
  const policy = gameState.manufacturerPolicy || {};
  const inventory = getInventoryMetrics(gameState);
  const achieveRate = monthlyStats.target > 0 ? (monthlyStats.sales || 0) / monthlyStats.target : 0;
  const lowInventoryPressure = inventory.count <= Math.max(3, Math.floor((monthlyStats.target || 15) * 0.35)) ? 22 : 0;
  return clamp(
    lowInventoryPressure
    + Math.max(0, (inventory.fillRate - 0.72) * 45)
    + Math.max(0, (inventory.avgStockDays - 38) * 0.55)
    + (inventory.longStockCount * 5)
    + (inventory.veryLongStockCount * 8)
    + (achieveRate < 0.72 ? (0.72 - achieveRate) * 44 : 0)
    + (policy.rebateMultiplier > 1.18 ? 10 : 0)
    + (policy.lastChange?.includes('返利') ? 6 : 0),
  );
};

const scoreBankCredit = (gameState = {}) => {
  const finance = gameState.finance || {};
  const drafts = gameState.drafts || {};
  const loanRatio = finance.creditLimit > 0 ? (finance.loan || 0) / finance.creditLimit : 1;
  const overdueDrafts = countOverdueDrafts(gameState);
  const bankReputation = Number.isFinite(drafts.bankReputation) ? drafts.bankReputation : 70;
  const cash = finance.cash || 0;
  const activeDraftAmount = getActiveDrafts(drafts)
    .filter(draft => draft.status === 'active')
    .reduce((sum, draft) => sum + (draft.amount || 0), 0);
  return clamp(
    (loanRatio > 0.72 ? (loanRatio - 0.72) * 130 : 0)
    + (cash < 600000 ? (600000 - cash) / 18000 : 0)
    + (overdueDrafts * 28)
    + (bankReputation < 62 ? (62 - bankReputation) * 1.5 : 0)
    + (activeDraftAmount > 3000000 ? (activeDraftAmount - 3000000) / 95000 : 0),
  );
};

const scoreCompetitorPoaching = (gameState = {}) => {
  const staffRisk = getStaffRiskMetrics(gameState);
  const competitorPressure = getCompetitorPressure(gameState.competitors);
  return clamp(
    (staffRisk.topRisk?.risk || 0) * 0.72
    + competitorPressure * 0.42
    + staffRisk.unretainedCore * 7
    + (staffRisk.avgStress > 55 ? (staffRisk.avgStress - 55) * 0.8 : 0),
  );
};

const scoreCustomerSentiment = (gameState = {}) => {
  const monthlyStats = gameState.monthlyStats || {};
  const csi = gameState.csi || {};
  const csiScore = getCsiScore(gameState);
  const complaints = (csi.complaints || 0) + (gameState.pendingComplaints || 0);
  const walkIns = monthlyStats.walkIns || 0;
  const closeRate = walkIns > 0 ? (monthlyStats.sales || 0) / walkIns : 0.22;
  const afterSalesBacklog = asArray(gameState.afterSales?.serviceOrders).filter(order => order.status !== 'done').length;
  return clamp(
    (csiScore < 90 ? (90 - csiScore) * 2.4 : 0)
    + complaints * 13
    + (walkIns >= 8 && closeRate < 0.11 ? (0.11 - closeRate) * 120 : 0)
    + (afterSalesBacklog > 4 ? (afterSalesBacklog - 4) * 5 : 0)
    + ((monthlyStats.draftPenalty || 0) > 0 ? 10 : 0),
  );
};

const scoreStaffTurnover = (gameState = {}) => {
  const staffRisk = getStaffRiskMetrics(gameState);
  const regionTurnover = gameState.activeRegion?.turnover || 1;
  const highRiskScore = staffRisk.highRiskMembers.length * 9;
  return clamp(
    (staffRisk.topRisk?.risk || 0) * 0.78
    + highRiskScore
    + (regionTurnover > 1 ? (regionTurnover - 1) * 22 : 0)
    + (staffRisk.avgLoyalty < 55 ? (55 - staffRisk.avgLoyalty) * 0.8 : 0),
  );
};

const SCORE_BY_CHAIN = {
  investor_pressure: scoreInvestorPressure,
  manufacturer_stock_pressure: scoreManufacturerPressure,
  bank_credit_pullback: scoreBankCredit,
  competitor_poaching: scoreCompetitorPoaching,
  customer_sentiment: scoreCustomerSentiment,
  staff_turnover: scoreStaffTurnover,
};

const getBestStage = (chain, score) => [...chain.stages]
  .reverse()
  .find(stage => score >= stage.minScore);

const buildContextNotes = ({ chainId, gameState, score }) => {
  const monthlyStats = gameState.monthlyStats || {};
  const finance = gameState.finance || {};
  const inventory = getInventoryMetrics(gameState);
  const staffRisk = getStaffRiskMetrics(gameState);
  const topStaff = staffRisk.topRisk?.member;
  const notesByChain = {
    investor_pressure: [
      `目标进度 ${monthlyStats.sales || 0}/${monthlyStats.target || 0} 台`,
      `现金 ${formatMoney(finance.cash || 0)}`,
      `CSI ${Math.round(getCsiScore(gameState))} 分`,
    ],
    manufacturer_stock_pressure: [
      `库存 ${inventory.count}/${inventory.capacity} 台`,
      `平均库龄 ${Math.round(inventory.avgStockDays)} 天`,
      `长库龄 ${inventory.longStockCount} 台`,
    ],
    bank_credit_pullback: [
      `负债率 ${finance.creditLimit > 0 ? Math.round(((finance.loan || 0) / finance.creditLimit) * 100) : 100}%`,
      `逾期汇票 ${countOverdueDrafts(gameState)} 张`,
      `银行信用 ${gameState.drafts?.bankReputation ?? 70}`,
    ],
    competitor_poaching: [
      `竞品压力 ${Math.round(getCompetitorPressure(gameState.competitors))}`,
      topStaff ? `高风险员工 ${topStaff.nickname || topStaff.id || '未命名员工'}` : '暂无高风险员工',
      `核心未留任 ${staffRisk.unretainedCore} 人`,
    ],
    customer_sentiment: [
      `CSI ${Math.round(getCsiScore(gameState))} 分`,
      `投诉 ${gameState.csi?.complaints || 0} 起`,
      `成交转化 ${monthlyStats.walkIns > 0 ? Math.round(((monthlyStats.sales || 0) / monthlyStats.walkIns) * 100) : 0}%`,
    ],
    staff_turnover: [
      `平均压力 ${Math.round(staffRisk.avgStress)}`,
      `平均忠诚 ${Math.round(staffRisk.avgLoyalty)}`,
      topStaff ? `最高风险 ${topStaff.nickname || topStaff.id || '未命名员工'}` : '暂无高风险员工',
    ],
  };
  return [...(notesByChain[chainId] || []), `风险指数 ${Math.round(score)}`];
};

const enrichParticipants = (chain, gameState) => {
  const staffRisk = getStaffRiskMetrics(gameState);
  const topStaff = staffRisk.topRisk?.member;
  if ((chain.id === 'competitor_poaching' || chain.id === 'staff_turnover') && topStaff) {
    return [...chain.participants, topStaff.nickname || topStaff.id || '高风险员工'];
  }
  const activeCompetitor = asArray(gameState.competitors?.stores).find(store => store.currentActivity || store.isVisible);
  if (chain.id === 'competitor_poaching' && activeCompetitor) {
    return [...chain.participants, activeCompetitor.name];
  }
  return chain.participants;
};

const getTriggerChance = ({ score, stage, previousProgress }) => {
  const baseChance = 0.58 + Math.max(0, score - stage.minScore) / 130;
  const escalationBonus = previousProgress?.stage !== stage.id ? 0.18 : 0;
  return clamp(baseChance + escalationBonus, 0, 0.92);
};

const applyActionMitigation = (score, previousProgress = {}, absoluteDay) => {
  const mitigationUntil = Number(previousProgress.mitigationUntil) || 0;
  if (mitigationUntil < absoluteDay) return score;
  return clamp(score - (Number(previousProgress.mitigationScoreReduction) || 0));
};

const normalizeStoryState = (storyState = {}) => ({
  version: STORY_EVENT_VERSION,
  chains: { ...(storyState.chains || storyState.chainProgress || {}) },
  eventHistory: asArray(storyState.eventHistory).slice(-40),
  resolutions: asArray(storyState.resolutions).slice(-80),
  lastEvaluatedDay: storyState.lastEvaluatedDay ?? null,
});

const isCadenceDue = (chain, timing) => {
  if (chain.cadence === 'daily') return true;
  if (chain.cadence === 'weekly') return timing.absoluteDay % 7 === 0;
  if (chain.cadence === 'monthly') return timing.dayOfMonth >= 28;
  return true;
};

export function createInitialStoryState() {
  return {
    version: STORY_EVENT_VERSION,
    chains: {},
    eventHistory: [],
    resolutions: [],
    lastEvaluatedDay: null,
  };
}

export function evaluateStoryEvents({
  gameState = {},
  storyState,
  day = 1,
  dayOfMonth,
  month,
  rng,
} = {}) {
  const random = toRandom(rng);
  const absoluteDay = Math.max(1, Number(day) || 1);
  const timing = {
    absoluteDay,
    dayOfMonth: Number.isFinite(dayOfMonth) ? clamp(dayOfMonth, 1, 30) : getDayOfMonth(absoluteDay),
    month: getMonth(absoluteDay, month),
  };
  const currentStoryState = normalizeStoryState(storyState || createInitialStoryState());
  const nextStoryState = {
    ...currentStoryState,
    chains: { ...currentStoryState.chains },
    eventHistory: [...currentStoryState.eventHistory],
    lastEvaluatedDay: absoluteDay,
  };
  const events = [];
  const logs = [];
  const inboxMessages = [];

  STORY_EVENT_CHAINS.forEach(chain => {
    const scoreFn = SCORE_BY_CHAIN[chain.id];
    if (!scoreFn) return;
    if (!isCadenceDue(chain, timing)) return;

    const previousProgress = nextStoryState.chains[chain.id] || {};
    if ((previousProgress.cooldownUntil || 0) > absoluteDay) return;

    const rawScore = scoreFn(gameState, timing);
    const score = applyActionMitigation(rawScore, previousProgress, absoluteDay);
    const stage = getBestStage(chain, score);
    if (!stage) return;

    const triggerChance = getTriggerChance({ score, stage, previousProgress });
    if (random() > triggerChance) {
      nextStoryState.chains[chain.id] = {
        ...previousProgress,
        lastScore: Math.round(score),
        lastCheckedAt: absoluteDay,
      };
      return;
    }

    const occurrence = (previousProgress.occurrences || 0) + 1;
    const eventId = `story_${chain.id}_${stage.id}_${absoluteDay}_${occurrence}`;
    const contextNotes = buildContextNotes({ chainId: chain.id, gameState, score });
    const createdAt = { absoluteDay, month: timing.month, dayOfMonth: timing.dayOfMonth };
    const expiresAt = {
      absoluteDay: absoluteDay + chain.expiresInDays,
      month: getMonth(absoluteDay + chain.expiresInDays),
      dayOfMonth: getDayOfMonth(absoluteDay + chain.expiresInDays),
    };
    const event = {
      id: eventId,
      chainId: chain.id,
      stage: stage.id,
      stageLabel: stage.label,
      severity: stage.severity,
      title: stage.title,
      summary: `${stage.summary} ${contextNotes.join('；')}。`,
      participants: enrichParticipants(chain, gameState),
      tags: chain.tags,
      createdAt,
      expiresAt,
      suggestedActions: chain.suggestedActions,
      effectsPreview: chain.effectsPreview,
    };

    events.push(event);
    logs.push({
      day: absoluteDay,
      type: stage.severity === 'critical' || stage.severity === 'high' ? 'warning' : 'info',
      message: `📌【剧情线·${chain.title}】${event.title}：${event.summary}`,
    });
    inboxMessages.push({
      id: `inbox_${eventId}`,
      day: absoluteDay,
      type: 'story',
      from: chain.source,
      title: event.title,
      body: `${event.summary}\n\n建议：${event.suggestedActions.join('、')}。`,
      storyEventId: event.id,
      chainId: chain.id,
      chainTitle: chain.title,
      storyStage: stage.id,
      storyStageLabel: stage.label,
      storySeverity: stage.severity,
      participants: event.participants,
      tags: event.tags,
      suggestedActions: event.suggestedActions,
      effectsPreview: event.effectsPreview,
      expiresAt: event.expiresAt,
    });

    nextStoryState.chains[chain.id] = {
      ...previousProgress,
      stage: stage.id,
      severity: stage.severity,
      lastScore: Math.round(score),
      lastEventAt: absoluteDay,
      lastCheckedAt: absoluteDay,
      cooldownUntil: absoluteDay + chain.cooldownDays,
      occurrences: occurrence,
      status: stage.severity === 'critical' ? 'critical' : 'active',
      participantIds: enrichParticipants(chain, gameState),
      history: [
        ...(previousProgress.history || []),
        { eventId, stage: stage.id, score: Math.round(score), day: absoluteDay },
      ].slice(-8),
    };
    nextStoryState.eventHistory = [
      ...nextStoryState.eventHistory,
      { eventId, chainId: chain.id, stage: stage.id, day: absoluteDay },
    ].slice(-60);
  });

  return {
    storyState: nextStoryState,
    events,
    logs,
    inboxMessages,
  };
}
