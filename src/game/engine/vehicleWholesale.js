export const prepareVehicleWholesale = ({
  modelId,
  inventory,
  carModels,
  marketPrices,
}) => {
  const modelDef = carModels.find(model => model.id === modelId);
  if (!modelDef) return { status: 'invalid' };

  const cars = inventory.filter(car => car.modelId === modelId);
  if (cars.length === 0) {
    return { status: 'no_stock', alert: { title: '无车可批', message: '该车型当前库存为空！' } };
  }

  const avgCityPrice = marketPrices[modelId] || modelDef.msrp;
  const wholesalePrice = Math.round(avgCityPrice * 0.9);
  const lossPerCar = wholesalePrice - modelDef.baseCost;
  const totalRevenue = wholesalePrice * cars.length;
  const totalLoss = lossPerCar * cars.length;

  return {
    status: 'ready',
    modelId,
    modelName: modelDef.name,
    baseCost: modelDef.baseCost,
    carCount: cars.length,
    avgCityPrice,
    wholesalePrice,
    lossPerCar,
    totalRevenue,
    totalLoss,
    confirm: {
      title: '确认二网批售甩车',
      message:
        `将 ${cars.length} 台 ${modelDef.name} 以批售价 ¥${wholesalePrice.toLocaleString()}/台（同城均价90%）全部甩给二网经销商？\n\n` +
        `批售单价: ¥${wholesalePrice.toLocaleString()}（同城均价 ¥${Math.round(avgCityPrice).toLocaleString()} × 90%）\n` +
        `单车盈亏: ${lossPerCar >= 0 ? '+' : ''}¥${lossPerCar.toLocaleString()}（相对提车成本 ¥${modelDef.baseCost.toLocaleString()}）\n` +
        `回笼资金: ¥${totalRevenue.toLocaleString()}\n` +
        `总盈亏: ${totalLoss >= 0 ? '+' : ''}¥${totalLoss.toLocaleString()}\n\n` +
        '⚠️ 批售不享受厂家返利，回款会优先归还库存融资。',
    },
  };
};

export const settleVehicleWholesale = ({
  wholesale,
  inventory,
  finance,
  monthlyStats,
  currentDay,
  formatMoney = value => String(value),
}) => {
  if (!wholesale || wholesale.status !== 'ready') return { status: 'invalid' };

  const autoLoanRepay = Math.min(wholesale.totalRevenue, finance.loan);
  const cashIn = wholesale.totalRevenue - autoLoanRepay;
  const totalCost = wholesale.baseCost * wholesale.carCount;

  return {
    status: 'settled',
    inventory: inventory.filter(car => car.modelId !== wholesale.modelId),
    finance: {
      ...finance,
      loan: Math.max(0, finance.loan - autoLoanRepay),
      cash: finance.cash + cashIn,
    },
    monthlyStats: {
      ...monthlyStats,
      revenue: monthlyStats.revenue + wholesale.totalRevenue,
      cogs: monthlyStats.cogs + totalCost,
    },
    ledgerEntry: {
      day: currentDay,
      items: [
        { label: `二网批售(${wholesale.modelName} ×${wholesale.carCount})`, amount: wholesale.totalRevenue, type: 'income' },
        { label: `批售成本(${wholesale.modelName} ×${wholesale.carCount})`, amount: -totalCost, type: 'expense' },
        ...(autoLoanRepay > 0 ? [{ label: '二网批售回款自动还贷', amount: -autoLoanRepay, type: 'expense' }] : []),
      ],
    },
    log: {
      type: 'warning',
      message: `🚚【二网批售】${wholesale.carCount} 台 ${wholesale.modelName} 以 ¥${wholesale.wholesalePrice.toLocaleString()}/台甩给二网，回款 ${formatMoney(wholesale.totalRevenue)}，其中 ${formatMoney(autoLoanRepay)} 自动还贷。${wholesale.lossPerCar < 0 ? `单车亏损 ¥${Math.abs(wholesale.lossPerCar).toLocaleString()}，不享受返利。` : `单车微赚 ¥${wholesale.lossPerCar.toLocaleString()}，但不享受返利。`}`,
    },
  };
};
