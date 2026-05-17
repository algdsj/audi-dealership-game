import { normalizeMarketShare } from './marketMetrics.js';

const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const settleCompetitorMonthlyReport = ({
  competitors,
  monthlyStats,
  finance,
  month,
  dayOfMonth,
  absoluteDay,
  random = Math.random,
  formatMoney = defaultFormatMoney,
}) => {
  const nextCompetitors = { ...competitors, stores: [...(competitors.stores || [])] };
  const mStats = { ...monthlyStats };
  const f = { ...finance };
  const ledgerItems = [];
  const logs = [];
  const brandBuckets = { bmw: 0, benz: 0, ev: 0, audiLocal: 0 };
  const marketIntel = [];

  nextCompetitors.stores = (nextCompetitors.stores || []).map(store => {
    let nextStore = { ...store };
    const baseSales = store.brand === 'ev' ? 20 : store.brand === 'audi_local' ? 16 : 18;
    const activitySalesBoost = store.currentActivity ? 1.25 : 1;
    const priceSalesBoost = Math.min(1.5, 1 + Math.max(0, 1 - (store.priceIndex || 1)) * 2.2);
    const monthlySales = Math.max(3, Math.round(baseSales * ((store.customerPull || 55) / 60) * activitySalesBoost * priceSalesBoost * (0.75 + random() * 0.55)));
    nextStore.monthlySales = monthlySales;
    const brandKey = store.brand === 'audi_local' ? 'audiLocal' : store.brand;
    if (brandBuckets[brandKey] !== undefined) brandBuckets[brandKey] += monthlySales;

    const strategy = store.strategy || 'aggressive';
    const relationPenalty = store.brand === 'audi_local' ? (nextStore.relationship < 40 ? 0.16 : nextStore.relationship >= 70 ? -0.08 : 0) : 0;
    const discountChance = (strategy === 'aggressive' ? 0.32 : strategy === 'digital' ? 0.16 : 0.12) + relationPenalty;
    const activityChance = strategy === 'service' ? 0.28 : strategy === 'digital' ? 0.24 : 0.14;
    const digitalChance = store.brand === 'ev' || strategy === 'digital' ? 0.32 : 0.08;

    if (random() < discountChance) {
      const cut = 0.03 + random() * (store.brand === 'audi_local' ? 0.08 : 0.06);
      const tacitFloor = store.brand === 'audi_local' && (nextStore.relationship || 50) >= 40 ? 0.85 : 0.80;
      nextStore.priceIndex = Math.max(tacitFloor, (nextStore.priceIndex || 1) - cut);
      nextStore.activityLevel = Math.min(100, (nextStore.activityLevel || 0) + 24);
      nextStore.currentActivity = { type: 'discount', effect: '客户分流', pullBoost: Math.round(16 + cut * 180), remainingDays: 7 + Math.floor(random() * 12) };
      nextStore.lastAction = `限时降价，优惠力度扩大${Math.round(cut * 100)}%`;
      nextStore.isVisible = true;
      marketIntel.push(`${nextStore.name}开始降价促销，预计会分流到店客户。`);
      if (store.brand === 'audi_local') {
        const playerCutting = (nextCompetitors.playerCountermeasures || []).some(item => item.type === 'price' || item.type === 'price_war');
        nextStore.priceWarCount = playerCutting ? (nextStore.priceWarCount || 0) + 1 : nextStore.priceWarCount || 0;
        nextStore.relationship = Math.max(0, (nextStore.relationship || 50) - (playerCutting ? 15 : 10));
        if (playerCutting) {
          nextCompetitors.priceWarActive = true;
          nextCompetitors.priceWarRound = (nextCompetitors.priceWarRound || 0) + 1;
          marketIntel.push(`${nextStore.name}与本店互相降价，本品价格战升级。`);
        }
      }
    } else if (random() < activityChance) {
      nextStore.activityLevel = Math.min(100, (nextStore.activityLevel || 0) + 18);
      nextStore.currentActivity = { type: 'event', effect: '活动截流', pullBoost: 18, remainingDays: 4 + Math.floor(random() * 4) };
      nextStore.lastAction = store.brand === 'benz' ? '举办高端品鉴会' : '举办试驾/车主活动';
      nextStore.isVisible = true;
      marketIntel.push(`${nextStore.name}${nextStore.lastAction}。`);
    } else if (random() < digitalChance) {
      nextStore.activityLevel = Math.min(100, (nextStore.activityLevel || 0) + 16);
      nextStore.currentActivity = { type: 'digital', effect: '线上线索截流', pullBoost: 14, remainingDays: 3 + Math.floor(random() * 5) };
      nextStore.lastAction = '加大直播和线上限时优惠';
      nextStore.isVisible = true;
      marketIntel.push(`${nextStore.name}正在强化线上获客。`);
    } else {
      nextStore.activityLevel = Math.max(0, (nextStore.activityLevel || 0) - 8);
      nextStore.lastAction = '常规经营';
    }
    return nextStore;
  });

  const playerSalesForShare = Math.max(0, mStats.sales || 0);
  const totalReportedSales = playerSalesForShare + brandBuckets.bmw + brandBuckets.benz + brandBuckets.ev + brandBuckets.audiLocal;
  const denominator = Math.max(nextCompetitors.totalMarketSize || 200, totalReportedSales);
  const otherSales = Math.max(0, denominator - totalReportedSales);
  nextCompetitors.lastMarketShare = nextCompetitors.marketShare;
  nextCompetitors.marketShare = normalizeMarketShare({
    audi: Math.round((playerSalesForShare / denominator) * 1000) / 10,
    bmw: Math.round((brandBuckets.bmw / denominator) * 1000) / 10,
    benz: Math.round((brandBuckets.benz / denominator) * 1000) / 10,
    ev: Math.round((brandBuckets.ev / denominator) * 1000) / 10,
    audiLocal: Math.round((brandBuckets.audiLocal / denominator) * 1000) / 10,
    other: Math.round((otherSales / denominator) * 1000) / 10,
  });
  nextCompetitors.playerMonthlySales = playerSalesForShare;

  const newIntel = marketIntel.slice(0, 6).map(content => ({ month, day: dayOfMonth, source: '市场情报组', content, reliability: '可靠' }));
  if (newIntel.length > 0) {
    nextCompetitors.intelHistory = [...newIntel, ...(nextCompetitors.intelHistory || [])].slice(0, 20);
    logs.push({ day: absoluteDay, type: 'warning', message: `🌐【竞品月报】${newIntel.map(item => item.content).join(' ')}` });
  }

  if (nextCompetitors.priceWarActive) {
    const round = nextCompetitors.priceWarRound || 1;
    const fine = round >= 3 ? 180000 : round >= 2 ? 80000 : 0;
    mStats.financeCost = (mStats.financeCost || 0) + fine;
    mStats.manufacturerPenalty = (mStats.manufacturerPenalty || 0) + fine;
    f.cash -= fine;
    if (fine > 0) ledgerItems.push({ label: `厂家价格战干预罚款(第${round}轮)`, amount: -fine, type: 'expense' });
    logs.push({ day: absoluteDay, type: fine > 0 ? 'expense' : 'warning', message: `🌐【本品价格战】同城奥迪互相降价，第${round}轮：毛利和转化承压，${fine > 0 ? `厂家罚款 ${formatMoney(fine)}。` : '厂家已发出价格秩序警告。'}` });
    if (round >= 3) nextCompetitors.priceWarActive = false;
  }

  return {
    competitors: nextCompetitors,
    monthlyStats: mStats,
    finance: f,
    ledgerItems,
    logs,
  };
};
