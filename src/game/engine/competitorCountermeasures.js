import { COMPETITOR_BRANDS } from '../config/market.js';
import { getCountermeasureIntelMeta } from './competitorIntel.js';

export const COUNTERMEASURE_CONFIGS = {
  price: { name: '跟价降价', cost: 60000, duration: 10, cooldown: 14, effectValue: 0.08, targetScope: 'external_market', desc: '短期抢回到店量，但毛利承压。' },
  service: { name: '差异化服务', cost: 40000, duration: 30, cooldown: 30, effectValue: 0.10, targetScope: 'external_market', desc: '提高留存和转化，缓冲竞品活动。' },
  referral: { name: '老客转介绍', cost: 16000, duration: 18, cooldown: 7, effectValue: 0.06, targetScope: 'customer_pool', desc: '低成本补充自然客流。' },
  alliance: { name: '联合抗竞', cost: 20000, duration: 21, cooldown: 90, effectValue: 0.12, targetScope: 'audi_local', desc: '与同城奥迪店联合维持价格，压低外部竞品分流。' },
  relation: { name: '提升本品店关系', cost: 30000, duration: 1, cooldown: 30, effectValue: 0, targetScope: 'audi_local', desc: '联谊沟通，关系+6，慢慢修复本品店默契。' },
  subsidy: { name: '厂家补贴申请', cost: 0, duration: 1, cooldown: 90, effectValue: 0, targetScope: 'manufacturer', desc: '申请10-30万区域补贴，用于缓冲价格战。' },
  poach: { name: '反挖人', cost: 50000, duration: 1, cooldown: 30, effectValue: 0, targetScope: 'strongest_visible', desc: '高薪挖竞品骨干，削弱竞品拉客能力。' },
  price_war: { name: '价格战宣言', cost: 90000, duration: 14, cooldown: 60, effectValue: 0.14, targetScope: 'all_market', desc: '大幅降价抢量，到店量上升但本品关系和毛利承压。' },
  csi_push: { name: '提升CSI口碑', cost: 30000, duration: 45, cooldown: 30, effectValue: 0.05, targetScope: 'external_market', desc: '长期口碑投放，降低竞品分流并带动推荐。' },
};

const getBrandLabel = brand => COMPETITOR_BRANDS[brand]?.label || brand || '未知品牌';

const unique = items => [...new Set(items.filter(Boolean))];

const getVisibleStores = competitors => (competitors.stores || []).filter(store => store.isVisible !== false);

const buildStoreTarget = store => ({
  scope: 'store',
  summary: `${getBrandLabel(store.brand)}：${store.name}`,
  brandLabels: [getBrandLabel(store.brand)],
  storeIds: [store.id],
  storeNames: [store.name],
});

const buildBrandTarget = ({ brand, stores }) => {
  const brandStores = stores.filter(store => store.brand === brand);
  return {
    scope: 'brand',
    summary: `${getBrandLabel(brand)}${brandStores.length > 0 ? `：${brandStores.map(store => store.name).join('、')}` : ''}`,
    brandLabels: [getBrandLabel(brand)],
    storeIds: brandStores.map(store => store.id),
    storeNames: brandStores.map(store => store.name),
  };
};

export const buildCountermeasureTarget = ({ type, competitors, targetSelection = null }) => {
  const config = COUNTERMEASURE_CONFIGS[type];
  const visibleStores = getVisibleStores(competitors);
  const externalStores = visibleStores.filter(store => store.brand !== 'audi_local');
  const audiStores = visibleStores.filter(store => store.brand === 'audi_local');
  const selectedStore = targetSelection?.storeId
    ? visibleStores.find(store => store.id === targetSelection.storeId)
    : null;
  const selectedBrand = targetSelection?.brand || null;
  const strongestStore = [...externalStores].sort((a, b) => (
    ((b.customerPull || 0) + Math.max(0, (1 - (b.priceIndex || 1)) * 180) + (b.currentActivity?.pullBoost || 0))
    - ((a.customerPull || 0) + Math.max(0, (1 - (a.priceIndex || 1)) * 180) + (a.currentActivity?.pullBoost || 0))
  ))[0];

  if (!config) return { scope: 'unknown', summary: '未知目标', brandLabels: [], storeIds: [], storeNames: [] };
  if (selectedStore) return buildStoreTarget(selectedStore);
  if (selectedBrand && visibleStores.some(store => store.brand === selectedBrand)) {
    return buildBrandTarget({ brand: selectedBrand, stores: visibleStores });
  }
  if (config.targetScope === 'audi_local') {
    return {
      scope: config.targetScope,
      summary: audiStores.length > 0 ? `同城奥迪：${audiStores.map(store => store.name).join('、')}` : '同城奥迪',
      brandLabels: ['同城奥迪'],
      storeIds: audiStores.map(store => store.id),
      storeNames: audiStores.map(store => store.name),
    };
  }
  if (config.targetScope === 'strongest_visible') {
    return {
      scope: config.targetScope,
      summary: strongestStore ? `${getBrandLabel(strongestStore.brand)}：${strongestStore.name}` : '可见强势竞品',
      brandLabels: strongestStore ? [getBrandLabel(strongestStore.brand)] : [],
      storeIds: strongestStore ? [strongestStore.id] : [],
      storeNames: strongestStore ? [strongestStore.name] : [],
    };
  }
  if (config.targetScope === 'manufacturer') {
    return { scope: config.targetScope, summary: '厂家/区域政策，不指定竞品品牌', brandLabels: ['厂家'], storeIds: [], storeNames: [] };
  }
  if (config.targetScope === 'customer_pool') {
    const labels = unique(externalStores.map(store => getBrandLabel(store.brand)));
    return {
      scope: config.targetScope,
      summary: labels.length > 0 ? `客户池防守：${labels.join('、')} 分流` : '客户池防守',
      brandLabels: labels,
      storeIds: [],
      storeNames: [],
    };
  }
  const stores = config.targetScope === 'all_market' ? visibleStores : externalStores;
  const labels = unique(stores.map(store => getBrandLabel(store.brand)));
  return {
    scope: config.targetScope,
    summary: labels.length > 0 ? `${config.targetScope === 'all_market' ? '全市场' : '外部竞品'}：${labels.join('、')}` : '外部竞品',
    brandLabels: labels,
    storeIds: stores.map(store => store.id),
    storeNames: stores.map(store => store.name),
  };
};

export const prepareCompetitorCountermeasure = ({
  type,
  competitors,
  finance,
  formatMoney = value => String(value),
  targetSelection = null,
}) => {
  const config = COUNTERMEASURE_CONFIGS[type];
  if (!config) return { status: 'invalid' };
  if ((competitors.cooldowns?.[type] || 0) > 0) {
    return { status: 'cooldown', alert: { title: '冷却中', message: `${config.name}还需${competitors.cooldowns[type]}天后可再次发起。` } };
  }
  if (finance.cash < config.cost) return { status: 'insufficient_cash', alert: { title: '资金不足', message: `${config.name}需要投入 ${formatMoney(config.cost)}。` } };

  const hasAudiLocal = (competitors.stores || []).some(store => store.brand === 'audi_local');
  if ((type === 'alliance' || type === 'relation') && !hasAudiLocal) {
    return { status: 'no_local_audi', alert: { title: '无本品店', message: '当前市场没有同城奥迪店，无法执行该动作。' } };
  }

  const relationshipNotice = type === 'price' && (competitors.stores || []).some(store => store.brand === 'audi_local' && (store.relationship || 50) >= 40)
    ? '本品店关系仍在40以上，主动跟价可能破坏不低于指导价85%的默契底线。\n\n'
    : '';
  const target = buildCountermeasureTarget({ type, competitors, targetSelection });
  const intelMeta = getCountermeasureIntelMeta({ competitors, storeIds: target.storeIds });
  const intelNotice = intelMeta.confidence < 45
    ? `\n情报可信度：${intelMeta.level.label}（${intelMeta.confidence}/100），反制效果可能打折。建议先做市场摸底。`
    : `\n情报可信度：${intelMeta.level.label}（${intelMeta.confidence}/100）。`;

  return {
    status: 'ready',
    type,
    config,
    target,
    intelMeta,
    confirm: {
      title: '确认反制措施',
      message: `${relationshipNotice}是否投入 ${formatMoney(config.cost)} 发起「${config.name}」？\n目标：${target.summary}${intelNotice}\n${config.desc}`,
    },
  };
};

export const settleCompetitorCountermeasure = ({
  countermeasurePlan,
  competitors,
  finance,
  monthlyStats,
  month,
  dayOfMonth,
  formatMoney = value => String(value),
  random = Math.random,
}) => {
  if (!countermeasurePlan || countermeasurePlan.status !== 'ready') return { status: 'invalid' };
  const { type, config } = countermeasurePlan;
  const target = countermeasurePlan.target || buildCountermeasureTarget({ type, competitors });
  const intelMeta = countermeasurePlan.intelMeta || getCountermeasureIntelMeta({ competitors, storeIds: target.storeIds });
  const effectMultiplier = intelMeta.multiplier || 1;
  const effectiveEffectValue = Number((config.effectValue * effectMultiplier).toFixed(3));
  const targetStoreIds = new Set(target.storeIds || []);
  const grant = type === 'subsidy' ? 100000 + Math.floor(random() * 200000) : 0;
  const poachImpact = Math.max(3, Math.round(5 * effectMultiplier));

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - config.cost + grant },
    competitors: {
      ...competitors,
      priceWarActive: type === 'price_war' ? true : competitors.priceWarActive,
      priceWarRound: type === 'price_war' ? Math.max(1, (competitors.priceWarRound || 0) + 1) : competitors.priceWarRound,
      cooldowns: { ...(competitors.cooldowns || {}), [type]: config.cooldown },
      playerCountermeasures: [
        ...(competitors.playerCountermeasures || []),
        {
          type,
          name: config.name,
          effectValue: effectiveEffectValue,
          remainingDays: config.duration,
          cost: config.cost,
          targetScope: target.scope,
          targetSummary: target.summary,
          targetBrandLabels: target.brandLabels,
          targetStoreIds: target.storeIds,
          targetStoreNames: target.storeNames,
          intelConfidence: intelMeta.confidence,
          intelLevel: intelMeta.level.id,
        },
      ],
      stores: (competitors.stores || []).map(store => {
        const targetMatches = targetStoreIds.size === 0 || targetStoreIds.has(store.id);
        if (type === 'alliance' && store.brand === 'audi_local' && targetMatches) return { ...store, relationship: Math.min(100, (store.relationship || 50) + 12), cooperation: { type: 'anti_competitor', remainingDays: config.duration } };
        if (type === 'relation' && store.brand === 'audi_local' && targetMatches) return { ...store, relationship: Math.min(100, (store.relationship || 50) + 6) };
        if (type === 'poach' && targetMatches) return { ...store, customerPull: Math.max(35, (store.customerPull || 55) - poachImpact), staffQuality: Math.max(35, (store.staffQuality || 60) - poachImpact) };
        if (type === 'price_war' && store.brand === 'audi_local') return { ...store, relationship: Math.max(0, (store.relationship || 50) - 20), priceWarCount: (store.priceWarCount || 0) + 1 };
        return store;
      }),
      intelHistory: [{ month, day: dayOfMonth, source: '总经理办公室', content: `玩家发起${config.name}，目标：${target.summary}${grant ? `，获得厂家补贴${formatMoney(grant)}` : ''}，情报可信度${intelMeta.confidence}/100，预计${config.duration}天内影响竞品分流。`, reliability: intelMeta.level.label }, ...(competitors.intelHistory || [])].slice(0, 20),
    },
    monthlyStats: { ...monthlyStats, marketingCost: (monthlyStats.marketingCost || 0) + config.cost },
    ledgerItem: { label: `竞品反制：${config.name}`, amount: grant - config.cost, type: grant > config.cost ? 'income' : 'expense' },
    log: { type: 'success', message: `🌐【竞品反制】已发起${config.name}，目标：${target.summary}，${grant ? `获得${formatMoney(grant)}，` : ''}投入 ${formatMoney(config.cost)}。${config.desc}` },
  };
};
