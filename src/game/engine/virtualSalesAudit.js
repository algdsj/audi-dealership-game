const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const settleVirtualSalesAudit = ({
  finance,
  monthlyStats,
  virtualSales,
  gmWealth,
  month,
  absoluteDay,
  random = Math.random,
  formatMoney = defaultFormatMoney,
}) => {
  const f = { ...finance };
  const mStats = { ...monthlyStats };
  const nextVirtualSales = { ...virtualSales };
  const nextGmWealth = { ...gmWealth };
  const ledgerItems = [];
  const logs = [];

  const floatingCars = (nextVirtualSales.virtualCars || []).filter(car => (month - (car.virtualMonth || month)) >= 3);
  if (floatingCars.length > 0) {
    const floatingCost = Math.round(floatingCars.reduce((sum, car) => sum + (car.costPrice || 0) * 0.005, 0));
    f.cash -= floatingCost;
    mStats.financeCost = (mStats.financeCost || 0) + floatingCost;
    mStats.floatingCost = (mStats.floatingCost || 0) + floatingCost;
    nextVirtualSales.suspicionLevel = Math.min(100, (nextVirtualSales.suspicionLevel || 0) + floatingCars.length * 3);
    ledgerItems.push({ label: `虚出浮库资金占用费(${floatingCars.length}台)`, amount: -floatingCost, type: 'expense' });
    logs.push({ day: absoluteDay, type: 'warning', message: `⚠️【浮库压力】${floatingCars.length}台虚出车超过3个月未真实售出，产生资金占用费 ${formatMoney(floatingCost)}，厂家怀疑度上升。` });
    if (floatingCars.length > 5) nextGmWealth.morale = Math.max(0, (nextGmWealth.morale || 80) - 10);
  }

  const suspicionLevel = nextVirtualSales.suspicionLevel || 0;
  const auditChance = suspicionLevel >= 100 ? 1 : 0.05 + (suspicionLevel * 0.005);
  if ((nextVirtualSales.virtualCars || []).length > 0 && random() < auditChance) {
    const caughtCount = (nextVirtualSales.caughtCount || 0) + 1;
    const penaltyMult = caughtCount === 1 ? 2 : caughtCount === 2 ? 3 : 5;
    const penalty = Math.round((nextVirtualSales.rebateEarnedFromVirtual || 0) * penaltyMult);
    f.cash -= penalty;
    mStats.financeCost = (mStats.financeCost || 0) + penalty;
    mStats.manufacturerPenalty = (mStats.manufacturerPenalty || 0) + penalty;
    nextVirtualSales.caughtCount = caughtCount;
    nextVirtualSales.penaltyPaid = (nextVirtualSales.penaltyPaid || 0) + penalty;
    nextVirtualSales.suspicionLevel = Math.min(100, (nextVirtualSales.suspicionLevel || 0) + 20);
    nextGmWealth.morale = Math.max(0, (nextGmWealth.morale || 80) - 25);
    ledgerItems.push({ label: `厂家虚出稽核罚款(第${caughtCount}次)`, amount: -penalty, type: 'expense' });
    logs.push({ day: absoluteDay, type: 'expense', message: `🚨【厂家稽核】虚出车辆被厂家抽查发现，第${caughtCount}次处罚，罚款 ${formatMoney(penalty)}，GM士气大幅下降。` });
  } else {
    nextVirtualSales.suspicionLevel = Math.max(0, (nextVirtualSales.suspicionLevel || 0) - ((nextVirtualSales.monthlyVirtual || 0) > 0 ? 0 : 3));
  }

  if (f.cash < 0) {
    f.loan += Math.abs(f.cash);
    f.cash = 0;
  }

  return {
    finance: f,
    monthlyStats: mStats,
    virtualSales: nextVirtualSales,
    gmWealth: nextGmWealth,
    ledgerItems,
    logs,
  };
};
