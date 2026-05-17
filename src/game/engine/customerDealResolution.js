import { getCustomerProfileModeFit } from './customerProfiles.js';

const USED_CAR_BRANDS = ['大众帕萨特', '本田雅阁', '丰田凯美瑞', '别克君威', '日产天籁', '福特蒙迪欧'];

export const resolveCustomerDeal = ({
  item,
  mode,
  inventory,
  carModels,
  finance,
  monthlyStats,
  dailyStats,
  soldVehicles,
  usedCars,
  csi,
  currentDay,
  getPriceReality,
  estimateDealAddons,
  formatMoney,
  random = Math.random,
  now = Date.now,
}) => {
  if (mode === 'reject') {
    return {
      status: 'rejected',
      crmOutcome: { status: 'rejected', mode, reason: '主动放弃' },
      log: { type: 'warning', message: `👤【客户谈判】放弃跟进${item.customerName}，该客户流失。` },
      alert: { title: '客户已放弃', message: `${item.customerName} 的重点客户谈判已关闭，客户流失。` },
    };
  }

  const car = inventory.find(itemCar => itemCar.id === item.carId);
  const modelDef = carModels.find(model => model.id === item.modelId);
  if (!car || !modelDef) return { status: 'invalid' };

  const configs = {
    margin: { label: '守价成交', price: item.currentPrice, closeAdj: -0.10, financeMult: 1.0, csiAdj: 0 },
    balanced: { label: '适度让利', price: Math.max(item.targetPrice, Math.round((item.currentPrice + item.targetPrice) / 2 / 1000) * 1000), closeAdj: 0.10, financeMult: 1.05, csiAdj: 0.1 },
    close: { label: '强力收单', price: item.floorPrice, closeAdj: 0.24, financeMult: 0.95, csiAdj: -0.2 },
    finance: { label: '金融方案锁客', price: item.targetPrice, closeAdj: 0.12 + item.financeIntent * 0.12, financeMult: 1.45, csiAdj: 0.15 },
  };
  const config = configs[mode] || configs.balanced;
  const finalPrice = config.price;
  const referencePrice = Math.min(item.marketPrice || item.competitorPrice || finalPrice, item.competitorPrice || item.marketPrice || finalPrice);
  const priceReality = getPriceReality(finalPrice, referencePrice, { financeIntent: item.financeIntent, mode });
  const targetFit = finalPrice <= item.targetPrice
    ? 0.12
    : finalPrice <= Math.round(referencePrice * (1 + (item.allowedPremium || priceReality.allowedPremium)))
      ? 0.03
      : -0.08;
  const financeFit = mode === 'finance' ? item.financeIntent * 0.08 : 0;
  const profile = item.profile || {};
  const budgetFit = profile.budgetCeiling
    ? finalPrice <= profile.budgetCeiling
      ? 0.04
      : -Math.min(0.14, ((finalPrice - profile.budgetCeiling) / finalPrice) * 2.4)
    : 0;
  const profileFit = getCustomerProfileModeFit(item, mode);
  const trustFit = mode === 'balanced' || mode === 'finance' ? (profile.trustNeed || 0) * 0.04 : 0;
  const competitorPenalty = priceReality.overAllowed ? (profile.competitorPull || 0) * 0.06 : 0;
  const objectionPenalty = (profile.objectionPenalty || 0) * (mode === 'margin' ? 0.55 : mode === 'close' ? 0.35 : 0.2);
  const patienceFit = (profile.patience || 0) * (mode === 'margin' ? -0.03 : 0.02);
  const closeChance = Math.max(0.03, Math.min(
    priceReality.closeCap,
    item.baseClose
      + config.closeAdj
      + targetFit
      + financeFit
      + profileFit
      + budgetFit
      + trustFit
      + patienceFit
      + item.urgency * 0.06
      + priceReality.conversionAdj
      - competitorPenalty
      - objectionPenalty,
  ));
  if (random() > closeChance) {
    return {
      status: 'lost',
      closeChance,
      crmOutcome: { status: 'lost', mode, closeChance, reason: '客户观望或转向竞品' },
      log: { type: 'warning', message: `👤【客户谈判失败】${config.label}未打动${item.customerName}（${item.archetypeName}），客户继续观望或转向竞品。` },
      alert: {
        title: '客户未成交',
        message: `${config.label}未打动${item.customerName}，本次成交概率约 ${Math.round(closeChance * 100)}%。${profile.objections?.[0] ? `主要异议：${profile.objections[0]}。` : ''}${priceReality.overAllowed ? '成交价明显高于同城报价，除非销售、口碑和金融方案足够强，否则客户会转向竞品。' : '客户继续观望或转向竞品。'}`,
      },
    };
  }

  const addons = estimateDealAddons(item.modelId, finalPrice);
  const financeCommission = Math.round(addons.financeCommission * config.financeMult);
  const isTradeIn = random() < item.tradeInIntent;
  const tradeInSubsidy = isTradeIn ? 5000 : 0;
  let tradeInPurchaseCost = 0;
  let nextUsedCars = usedCars;
  if (isTradeIn) {
    const tradeInValue = 30000 + Math.floor(random() * 120000);
    tradeInPurchaseCost = Math.round(tradeInValue * 0.85);
    const brand = USED_CAR_BRANDS[Math.floor(random() * USED_CAR_BRANDS.length)];
    nextUsedCars = [
      ...usedCars,
      {
        id: `uc_${now()}_${random().toString(36).slice(2, 6)}`,
        brand,
        purchasePrice: tradeInPurchaseCost,
        retailPrice: Math.round(tradeInPurchaseCost * 1.2),
        customRetailPrice: Math.round(tradeInPurchaseCost * 1.2),
        stockDays: 0,
        status: 'stock',
        prepped: false,
      },
    ];
  }

  const autoLoanRepay = Math.min(finalPrice, finance.loan);
  const cashIn = finalPrice - autoLoanRepay + addons.derivativeProfit + financeCommission - tradeInPurchaseCost;
  let nextCash = finance.cash + cashIn;
  let nextLoan = Math.max(0, finance.loan - autoLoanRepay);
  if (nextCash < 0) {
    nextLoan += Math.abs(nextCash);
    nextCash = 0;
  }
  const grossProfit = finalPrice - modelDef.baseCost + addons.rebate + tradeInSubsidy + addons.derivativeProfit + financeCommission - tradeInPurchaseCost;

  return {
    status: 'sold',
    closeChance,
    crmOutcome: { status: 'sold', mode, finalPrice, grossProfit, isTradeIn, financeCommission, closeChance },
    inventory: inventory.filter(itemCar => itemCar.id !== item.carId),
    finance: { ...finance, cash: nextCash, loan: nextLoan },
    usedCars: nextUsedCars,
    monthlyStats: {
      ...monthlyStats,
      sales: monthlyStats.sales + 1,
      revenue: monthlyStats.revenue + finalPrice,
      cogs: monthlyStats.cogs + modelDef.baseCost,
      baseRebatesPool: monthlyStats.baseRebatesPool + addons.rebate + tradeInSubsidy,
      derivativeRevenue: monthlyStats.derivativeRevenue + addons.derivativeProfit,
      financeCommission: monthlyStats.financeCommission + financeCommission,
      tradeInCount: monthlyStats.tradeInCount + (isTradeIn ? 1 : 0),
      tradeInSubsidy: monthlyStats.tradeInSubsidy + tradeInSubsidy,
    },
    dailyStats: { ...dailyStats, sales: dailyStats.sales + 1 },
    soldVehicles: [
      ...soldVehicles,
      {
        id: `sv_${now()}_${random().toString(36).slice(2, 6)}`,
        modelId: item.modelId,
        modelName: item.modelName,
        soldDay: currentDay,
      },
    ],
    csi: { ...csi, score: Math.max(50, Math.min(100, csi.score + config.csiAdj)) },
    ledgerItems: [
      { label: `重点客户成交(${item.modelName})`, amount: finalPrice, type: 'income' },
      { label: `重点客户卖车成本(${item.modelName})`, amount: -modelDef.baseCost, type: 'expense' },
      { label: '新车回款自动还贷', amount: -autoLoanRepay, type: 'expense' },
      { label: '谈判单衍生/金融毛利', amount: addons.derivativeProfit + financeCommission, type: 'income' },
      ...(tradeInPurchaseCost > 0 ? [{ label: `置换车收购(${item.customerName})`, amount: -tradeInPurchaseCost, type: 'expense' }] : []),
      { label: `谈判单返利入池(${item.modelName})`, amount: addons.rebate + tradeInSubsidy, type: 'pending' },
    ],
    log: {
      type: 'success',
      message: `👤【重点客户成交】${config.label}，${item.customerName}购买${item.modelName}，成交价${formatMoney(finalPrice)}，综合毛利${formatMoney(grossProfit)}${isTradeIn ? '，同步收购置换车' : ''}。`,
    },
    alert: {
      title: '客户成交',
      message: `${item.customerName} 已购买 ${item.modelName}。\n成交价：${formatMoney(finalPrice)}\n综合毛利：${formatMoney(grossProfit)}${isTradeIn ? '\n同步收购置换车。' : ''}`,
    },
  };
};
