export const settleVehicleDailyFinance = ({
  inventory,
  finance,
  monthlyStats,
  ledgerItems,
  carModels,
  activeRegion,
  storageCost,
  stats,
  handledCustomers,
  revenue,
  cogs,
  rebates,
  dailyDerivRev,
  dailyDerivCost,
  dailyFinanceComm,
  dailyTradeInCount,
  dailyTradeInSubsidy,
  dailyUsedCarPurchaseCost,
  soldCarsSummary,
  absoluteDay,
  formatMoney,
}) => {
  const nextInventory = [...inventory];
  const nextFinance = { ...finance };
  const nextMonthlyStats = { ...monthlyStats };
  const nextLedgerItems = [...ledgerItems];
  const logs = [];

  let tieredStorageCost = 0;
  nextInventory.forEach(car => {
    const stockDays = car.stockDays || 0;
    if (stockDays >= 120) tieredStorageCost += 150;
    else if (stockDays >= 90) tieredStorageCost += 100;
    else if (stockDays >= 60) tieredStorageCost += 100;
    else tieredStorageCost += 50;
  });
  tieredStorageCost = Math.round(tieredStorageCost * (activeRegion.inventoryPressure || 1));
  const storageDiff = tieredStorageCost - storageCost;
  if (storageDiff !== 0) {
    nextFinance.cash -= storageDiff;
    nextMonthlyStats.storageCost += storageDiff;
  }

  const forcedWholesale = nextInventory.filter(car => (car.stockDays || 0) >= 120);
  if (forcedWholesale.length > 0) {
    let forcedRevenue = 0;
    forcedWholesale.forEach(car => {
      const modelDef = carModels.find(model => model.id === car.modelId);
      const forcedPrice = Math.round(modelDef.baseCost * 0.80);
      forcedRevenue += forcedPrice;
      const index = nextInventory.findIndex(item => item.id === car.id);
      if (index !== -1) nextInventory.splice(index, 1);
    });
    nextFinance.cash += forcedRevenue;
    nextLedgerItems.push({ label: `强制处置(库龄≥120天,${forcedWholesale.length}台)`, amount: forcedRevenue, type: 'income' });
    logs.push({ day: absoluteDay, type: 'warning', message: `⚠️【强制处置】${forcedWholesale.length} 台库龄超120天的车辆按提车成本80%强制批售，回笼 ${formatMoney(forcedRevenue)}。` });
  }

  if (revenue > 0) nextLedgerItems.push({ label: `卖车收入(${stats.sales}台)`, amount: revenue, type: 'income' });
  if (cogs > 0) nextLedgerItems.push({ label: `卖车成本(${stats.sales}台)`, amount: -cogs, type: 'expense' });
  if (rebates > 0) nextLedgerItems.push({ label: `返利入池(${stats.sales}台)`, amount: rebates, type: 'pending' });
  if (dailyDerivRev - dailyDerivCost > 0) nextLedgerItems.push({ label: '衍生业务毛利', amount: dailyDerivRev - dailyDerivCost, type: 'income' });
  if (dailyFinanceComm > 0) nextLedgerItems.push({ label: '金融按揭佣金', amount: dailyFinanceComm, type: 'income' });
  if (dailyUsedCarPurchaseCost > 0) {
    nextFinance.cash -= dailyUsedCarPurchaseCost;
    nextLedgerItems.push({ label: `二手车置换收购(${dailyTradeInCount}台)`, amount: -dailyUsedCarPurchaseCost, type: 'expense' });
  }
  if (dailyTradeInCount > 0) {
    logs.push({ day: absoluteDay, type: 'info', message: `🔄【二手车置换】${dailyTradeInCount} 位客户置换旧车，厂家置换补贴 ¥${dailyTradeInSubsidy.toLocaleString()} 入池。` });
  }

  const autoLoanRepay = Math.min(revenue, nextFinance.loan);
  if (autoLoanRepay > 0) {
    nextFinance.loan -= autoLoanRepay;
    nextLedgerItems.push({ label: '新车回款自动还贷', amount: -autoLoanRepay, type: 'expense' });
  }
  const netDailyIncome = (revenue - autoLoanRepay) + dailyDerivRev - dailyDerivCost + dailyFinanceComm;
  if (netDailyIncome !== 0) nextFinance.cash += netDailyIncome;

  if (stats.sales > 0) {
    const summaryStr = Object.entries(soldCarsSummary).map(([name, count]) => `${name} x${count}`).join(', ');
    logs.push({ day: absoluteDay, type: 'success', message: `售出 ${stats.sales} 台车(${summaryStr})。收车款 ${formatMoney(revenue)}，其中 ${formatMoney(autoLoanRepay)} 自动归还库存融资，赚取衍生毛利 ${formatMoney(dailyDerivRev - dailyDerivCost)}，二手车收购支出 ${formatMoney(dailyUsedCarPurchaseCost)}，入池返利 ${formatMoney(rebates)}。` });
  } else if (handledCustomers.length > 0) {
    logs.push({ day: absoluteDay, type: 'warning', message: `销售顾问接待了 ${handledCustomers.length} 批客户，但因价格博弈或销售能力不足，未能促成任何交易。` });
  }

  return {
    inventory: nextInventory,
    finance: nextFinance,
    monthlyStats: nextMonthlyStats,
    ledgerItems: nextLedgerItems,
    autoLoanRepay,
    logs,
  };
};
