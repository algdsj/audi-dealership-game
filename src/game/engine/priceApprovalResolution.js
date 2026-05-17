export const resolvePriceApproval = ({
  item,
  mode,
  inventory,
  carModels,
  finance,
  monthlyStats,
  dailyStats,
  soldVehicles,
  currentDay,
  getPriceReality,
  estimateDealAddons,
  formatMoney = value => String(value),
  random = Math.random,
  now = Date.now,
}) => {
  if (mode === 'reject') {
    return {
      status: 'rejected',
      log: { type: 'warning', message: `🧾【价格审批】已拒绝 ${item.modelName} 客户批价申请，客户流失。` },
    };
  }

  const car = inventory.find(itemCar => itemCar.id === item.carId);
  const modelDef = carModels.find(model => model.id === item.modelId);
  if (!car || !modelDef) {
    return { status: 'invalid' };
  }

  const finalPrice = mode === 'requested' ? item.requestedPrice : mode === 'counter' ? item.counterPrice : item.currentPrice;
  const priceReality = getPriceReality(finalPrice, item.competitorPrice || item.currentPrice);
  const baseApprovalChance = mode === 'requested' ? 0.88 : mode === 'counter' ? 0.58 : 0.24;
  const closeChance = Math.max(0.02, Math.min(priceReality.closeCap, baseApprovalChance + priceReality.conversionAdj));
  const actionLabel = mode === 'requested' ? '同意让利' : mode === 'counter' ? '小幅让利反批' : '坚持原价';
  if (random() > closeChance) {
    return {
      status: 'lost',
      closeChance,
      log: { type: 'warning', message: `🧾【价格审批】${actionLabel}后，${item.modelName} 客户仍未接受，订单流失。` },
    };
  }

  const addons = estimateDealAddons(item.modelId, finalPrice);
  const autoLoanRepay = Math.min(finalPrice, finance.loan);
  const cashIn = finalPrice - autoLoanRepay + addons.derivativeProfit + addons.financeCommission;
  return {
    status: 'sold',
    closeChance,
    inventory: inventory.filter(itemCar => itemCar.id !== item.carId),
    finance: {
      ...finance,
      loan: Math.max(0, finance.loan - autoLoanRepay),
      cash: finance.cash + cashIn,
    },
    monthlyStats: {
      ...monthlyStats,
      sales: monthlyStats.sales + 1,
      revenue: monthlyStats.revenue + finalPrice,
      cogs: monthlyStats.cogs + modelDef.baseCost,
      baseRebatesPool: monthlyStats.baseRebatesPool + addons.rebate,
      derivativeRevenue: monthlyStats.derivativeRevenue + addons.derivativeProfit,
      financeCommission: monthlyStats.financeCommission + addons.financeCommission,
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
    ledgerItems: [
      { label: `总经理批价成交(${item.modelName})`, amount: finalPrice, type: 'income' },
      { label: `批价卖车成本(${item.modelName})`, amount: -modelDef.baseCost, type: 'expense' },
      { label: '新车回款自动还贷', amount: -autoLoanRepay, type: 'expense' },
      { label: '批价单衍生/金融毛利', amount: addons.derivativeProfit + addons.financeCommission, type: 'income' },
      { label: `批价单返利入池(${item.modelName})`, amount: addons.rebate, type: 'pending' },
    ],
    log: { type: 'success', message: `🧾【批价成交】${actionLabel}，${item.modelName} 以 ${formatMoney(finalPrice)} 成交，预计综合毛利 ${formatMoney(addons.grossProfit)}。` },
    display: {
      actionLabel,
      finalPrice,
      grossProfit: addons.grossProfit,
    },
  };
};
