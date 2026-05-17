import {
  COMPETITOR_BRANDS,
  COMPETITOR_INTEL_ACTIONS,
  COMPETITOR_INTEL_DIFFICULTY,
  COMPETITOR_INTEL_LEVELS,
  CUSTOMER_LOSS_INTEL_CONFIG,
} from '../config/market.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const getDifficultyTuning = activeDifficulty => (
  COMPETITOR_INTEL_DIFFICULTY[activeDifficulty?.id || activeDifficulty] || COMPETITOR_INTEL_DIFFICULTY.standard
);

export const getCompetitorIntelLevel = (confidence = 0) => {
  const safeConfidence = clamp(Number.isFinite(confidence) ? confidence : 0);
  return [...COMPETITOR_INTEL_LEVELS]
    .sort((a, b) => b.minConfidence - a.minConfidence)
    .find(level => safeConfidence >= level.minConfidence) || COMPETITOR_INTEL_LEVELS[0];
};

export const getDefaultCompetitorIntelConfidence = (store = {}, index = 0) => {
  if (typeof store.intelConfidence === 'number') return clamp(store.intelConfidence);
  if (store.brand === 'audi_local') return 72;
  if (store.isVisible === false) return 24;
  return clamp(58 - index * 3, 45, 68);
};

export const normalizeCompetitorStoreIntel = (store = {}, index = 0) => {
  const intelConfidence = getDefaultCompetitorIntelConfidence(store, index);
  const intelLevel = getCompetitorIntelLevel(intelConfidence);
  return {
    ...store,
    intelConfidence,
    intelLevel: intelLevel.id,
    lastIntelDay: store.lastIntelDay || null,
  };
};

export const normalizeCompetitorIntelState = (competitors = {}) => ({
  ...competitors,
  stores: (competitors.stores || []).map((store, index) => normalizeCompetitorStoreIntel(store, index)),
});

export const getCompetitorIntelActionCost = ({ actionId, activeDifficulty }) => {
  const action = COMPETITOR_INTEL_ACTIONS[actionId];
  if (!action) return 0;
  const tuning = getDifficultyTuning(activeDifficulty);
  return Math.round(action.cost * tuning.costMultiplier);
};

const roundToNearest = (value, step) => Math.round(value / step) * step;

export const buildCompetitorIntelSnapshot = (store = {}) => {
  const confidence = getDefaultCompetitorIntelConfidence(store);
  const level = getCompetitorIntelLevel(confidence);
  const priceIndex = store.priceIndex || 1;
  const monthlySales = store.monthlySales || 0;
  const threat = (store.customerPull || 0) + Math.max(0, (1 - priceIndex) * 180) + (store.currentActivity?.pullBoost || 0);

  if (confidence >= 75) {
    return {
      confidence,
      level,
      threat,
      threatLabel: String(Math.round(threat)),
      priceIndexLabel: priceIndex.toFixed(2),
      monthlySalesLabel: `${monthlySales}台`,
      dataLabel: '实采样本',
    };
  }

  if (confidence >= 45) {
    return {
      confidence,
      level,
      threat,
      threatLabel: `约${roundToNearest(threat, 5)}`,
      priceIndexLabel: `约${priceIndex.toFixed(2)}`,
      monthlySalesLabel: `约${roundToNearest(monthlySales, 5)}台`,
      dataLabel: '估算样本',
    };
  }

  return {
    confidence,
    level,
    threat,
    threatLabel: threat >= 90 ? '偏高' : threat >= 70 ? '中等' : '偏低',
    priceIndexLabel: '区间估算',
    monthlySalesLabel: '样本不足',
    dataLabel: '低可信',
  };
};

const getBrandLabel = brand => COMPETITOR_BRANDS[brand]?.label || brand || '未知品牌';

const buildIntelTargets = ({ action, competitors, storeId }) => {
  const stores = competitors.stores || [];
  if (action.scope === 'store') return stores.filter(store => store.id === storeId);
  if (action.scope === 'external_visible') {
    return stores.filter(store => store.brand !== 'audi_local' && store.isVisible !== false);
  }
  return stores.filter(store => store.isVisible !== false);
};

const pickHiddenStoresToReveal = ({ action, competitors }) => {
  if (!action.revealCount) return [];
  return [...(competitors.stores || [])]
    .filter(store => store.isVisible === false)
    .sort((a, b) => (b.customerPull || 0) - (a.customerPull || 0))
    .slice(0, action.revealCount);
};

export const prepareCompetitorIntelAction = ({
  actionId,
  activeDifficulty,
  competitors,
  finance,
  formatMoney = value => String(value),
  storeId = null,
}) => {
  const action = COMPETITOR_INTEL_ACTIONS[actionId];
  if (!action) return { status: 'invalid' };
  const tuning = getDifficultyTuning(activeDifficulty);
  const cost = getCompetitorIntelActionCost({ actionId, activeDifficulty });
  if (finance.cash < cost) {
    return { status: 'insufficient_cash', alert: { title: '资金不足', message: `${action.name}需要投入 ${formatMoney(cost)}。` } };
  }

  const normalizedCompetitors = normalizeCompetitorIntelState(competitors);
  const directTargets = buildIntelTargets({ action, competitors: normalizedCompetitors, storeId });
  const revealedTargets = pickHiddenStoresToReveal({ action, competitors: normalizedCompetitors });
  const targets = [...directTargets, ...revealedTargets];
  if (action.scope === 'store' && directTargets.length === 0) {
    return { status: 'missing_target', alert: { title: '缺少目标', message: '请选择一家已识别竞品门店。' } };
  }

  const gain = Math.max(1, Math.round(action.confidenceGain * tuning.gainMultiplier));
  const targetNames = targets.length > 0
    ? targets.map(store => `${getBrandLabel(store.brand)}·${store.name}`).join('、')
    : '当前可见竞品';

  return {
    status: 'ready',
    action,
    cost,
    gain,
    targetStoreIds: targets.map(store => store.id),
    revealStoreIds: revealedTargets.map(store => store.id),
    targetSummary: targetNames,
    confirm: {
      title: '确认情报动作',
      message: `是否投入 ${formatMoney(cost)} 执行「${action.name}」？\n目标：${targetNames}\n${action.desc}`,
    },
  };
};

export const settleCompetitorIntelAction = ({
  intelPlan,
  competitors,
  finance,
  month,
  dayOfMonth,
  formatMoney = value => String(value),
}) => {
  if (!intelPlan || intelPlan.status !== 'ready') return { status: 'invalid' };
  const targetStoreIds = new Set(intelPlan.targetStoreIds || []);
  const revealStoreIds = new Set(intelPlan.revealStoreIds || []);
  const updatedCompetitors = normalizeCompetitorIntelState(competitors);

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - intelPlan.cost },
    competitors: {
      ...updatedCompetitors,
      stores: (updatedCompetitors.stores || []).map(store => {
        if (!targetStoreIds.has(store.id)) return store;
        const nextConfidence = clamp((store.intelConfidence || 0) + intelPlan.gain);
        return {
          ...store,
          isVisible: revealStoreIds.has(store.id) ? true : store.isVisible,
          intelConfidence: nextConfidence,
          intelLevel: getCompetitorIntelLevel(nextConfidence).id,
          lastIntelDay: month * 30 + dayOfMonth,
        };
      }),
      intelHistory: [{
        month,
        day: dayOfMonth,
        source: '市场情报组',
        content: `执行${intelPlan.action.name}，目标：${intelPlan.targetSummary}，情报可信度提升${intelPlan.gain}点${intelPlan.revealStoreIds.length ? '，并识别出隐藏竞品门店。' : '。'}`,
        reliability: '可参考',
      }, ...(updatedCompetitors.intelHistory || [])].slice(0, 20),
    },
    ledgerItem: { label: `竞品情报：${intelPlan.action.name}`, amount: -intelPlan.cost, type: 'expense' },
    log: { type: 'info', message: `🌐【竞品情报】${intelPlan.action.name}完成，目标：${intelPlan.targetSummary}，花费 ${formatMoney(intelPlan.cost)}。` },
  };
};

export const getCountermeasureIntelMeta = ({ competitors, storeIds = [] }) => {
  const normalizedCompetitors = normalizeCompetitorIntelState(competitors);
  const stores = storeIds.length > 0
    ? normalizedCompetitors.stores.filter(store => storeIds.includes(store.id))
    : normalizedCompetitors.stores.filter(store => store.isVisible !== false);
  if (stores.length === 0) {
    const level = getCompetitorIntelLevel(50);
    return { confidence: 50, level, multiplier: level.countermeasureMultiplier };
  }
  const confidence = Math.round(stores.reduce((sum, store) => sum + (store.intelConfidence || 0), 0) / stores.length);
  const level = getCompetitorIntelLevel(confidence);
  return { confidence, level, multiplier: level.countermeasureMultiplier };
};

const addBrandScore = (scores, weights = {}, multiplier = 1) => {
  Object.entries(weights || {}).forEach(([brand, value]) => {
    scores[brand] = (scores[brand] || 0) + value * multiplier;
  });
  return scores;
};

const getCustomerLossReason = record => {
  const objections = record?.profile?.objections || [];
  if (objections.includes('竞品/同城报价更低')) return '竞品报价压力';
  if (objections[0]) return objections[0];
  return record?.outcomeReason || '客户流失';
};

export const inferCustomerLossCompetitorSignal = ({ record, competitors }) => {
  if (!record || !['lost', 'rejected'].includes(record.status)) return null;
  const stores = normalizeCompetitorIntelState(competitors).stores || [];
  const externalBrands = [...new Set(stores.filter(store => store.brand !== 'audi_local').map(store => store.brand))];
  if (externalBrands.length === 0) return null;

  const scores = {};
  addBrandScore(scores, CUSTOMER_LOSS_INTEL_CONFIG.segmentBrandWeights[record.segment]);
  for (const objection of record.profile?.objections || []) {
    addBrandScore(scores, CUSTOMER_LOSS_INTEL_CONFIG.objectionBrandWeights[objection]);
  }
  if ((record.profile?.competitorPull || 0) >= 0.45) {
    addBrandScore(scores, { bmw: 2, benz: 2, ev: 2 }, record.profile.competitorPull);
  }
  if (record.outcomeMode === 'margin') addBrandScore(scores, { bmw: 2, ev: 1 });
  if (record.outcomeMode === 'finance') addBrandScore(scores, { benz: 2, bmw: 1 });

  const targetBrand = externalBrands
    .map(brand => ({ brand, score: scores[brand] || 1 }))
    .sort((a, b) => b.score - a.score)[0]?.brand;
  if (!targetBrand) return null;

  const hasCompetitorQuote = (record.profile?.objections || []).includes('竞品/同城报价更低');
  const competitorPull = Number(record.profile?.competitorPull) || 0;
  const gain = clamp(Math.round(
    CUSTOMER_LOSS_INTEL_CONFIG.baseGain
      + (CUSTOMER_LOSS_INTEL_CONFIG.statusGain[record.status] || 0)
      + competitorPull * CUSTOMER_LOSS_INTEL_CONFIG.competitorPullGain
      + (hasCompetitorQuote ? CUSTOMER_LOSS_INTEL_CONFIG.competitorQuoteBonus : 0),
  ), 1, CUSTOMER_LOSS_INTEL_CONFIG.maxGain);

  return {
    brand: targetBrand,
    brandLabel: getBrandLabel(targetBrand),
    gain,
    reason: getCustomerLossReason(record),
    shouldReveal: competitorPull >= CUSTOMER_LOSS_INTEL_CONFIG.revealCompetitorPullThreshold || hasCompetitorQuote,
  };
};

export const applyCustomerLossCompetitorIntel = ({
  competitors,
  record,
  month,
  dayOfMonth,
}) => {
  const normalizedCompetitors = normalizeCompetitorIntelState(competitors);
  const signal = inferCustomerLossCompetitorSignal({ record, competitors: normalizedCompetitors });
  if (!signal) return { competitors: normalizedCompetitors, changed: false, signal: null };

  const targetStores = (normalizedCompetitors.stores || []).filter(store => store.brand === signal.brand);
  const hiddenTarget = signal.shouldReveal
    ? [...targetStores].filter(store => store.isVisible === false).sort((a, b) => (b.customerPull || 0) - (a.customerPull || 0))[0]
    : null;
  const targetStoreIds = new Set(targetStores.map(store => store.id));

  return {
    changed: true,
    signal,
    competitors: {
      ...normalizedCompetitors,
      stores: (normalizedCompetitors.stores || []).map(store => {
        if (!targetStoreIds.has(store.id)) return store;
        const nextConfidence = clamp((store.intelConfidence || 0) + signal.gain);
        return {
          ...store,
          isVisible: hiddenTarget?.id === store.id ? true : store.isVisible,
          intelConfidence: nextConfidence,
          intelLevel: getCompetitorIntelLevel(nextConfidence).id,
          lastIntelDay: month * 30 + dayOfMonth,
        };
      }),
      intelHistory: [{
        month,
        day: dayOfMonth,
        source: '客户战败复盘',
        content: `${record.customerName || '客户'}（${record.modelName || '意向车型'}）战败原因：${signal.reason}，疑似流向${signal.brandLabel}，情报可信度+${signal.gain}${hiddenTarget ? `，识别出${hiddenTarget.name}。` : '。'}`,
        reliability: signal.gain >= 14 ? '可靠' : '可参考',
      }, ...(normalizedCompetitors.intelHistory || [])].slice(0, 20),
    },
  };
};
