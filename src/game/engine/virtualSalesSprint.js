export const prepareVirtualSalesSprint = ({
  dayOfMonth,
  virtualPlan,
  inventory,
  carModels,
  getDynamicRebate,
  formatMoney = value => String(value),
}) => {
  if (dayOfMonth < 25 || dayOfMonth > 28) return { status: 'not_available', alert: { title: '时机未到', message: '月底冲刺仅在每月D25-D28开放。' } };

  const entries = Object.entries(virtualPlan)
    .map(([modelId, qty]) => [modelId, Math.max(0, Math.floor(Number(qty) || 0))])
    .filter(([, qty]) => qty > 0);
  if (entries.length === 0) return { status: 'empty', alert: { title: '未选择车辆', message: '请选择至少一台库存车进行虚出。' } };

  let selectedCars = [];
  const riskMessages = [];
  for (const [modelId, qty] of entries) {
    const stock = inventory.filter(car => car.modelId === modelId);
    const selected = stock.slice(0, qty);
    if (selected.length < qty) {
      const model = carModels.find(item => item.id === modelId);
      riskMessages.push(`${model?.name || modelId}库存不足，仅可虚出${selected.length}台`);
    }
    selectedCars = [...selectedCars, ...selected];
  }

  if (selectedCars.length === 0) {
    return { status: 'no_stock', alert: { title: '库存不足', message: riskMessages.join('\n') || '没有可虚出的库存车辆。' } };
  }

  const totalRebate = selectedCars.reduce((sum, car) => sum + getDynamicRebate(car.modelId), 0);
  const suspicionIncrease = selectedCars.length * 5;
  return {
    status: 'ready',
    selectedCars,
    riskMessages,
    totalRebate,
    suspicionIncrease,
    confirm: {
      title: '确认月底虚出',
      message: `本次将虚出 ${selectedCars.length} 台车，账面销量增加 ${selectedCars.length} 台，返利池预计增加 ${formatMoney(totalRebate)}。\n厂家怀疑度将上升 ${suspicionIncrease} 点。\n${riskMessages.join('\n')}`,
    },
  };
};

export const settleVirtualSalesSprint = ({
  sprintPlan,
  inventory,
  virtualSales,
  monthlyStats,
  gmWealth,
  carModels,
  currentDay,
  month,
  getDynamicMsrp,
  formatMoney = value => String(value),
  random = Math.random,
}) => {
  if (!sprintPlan || sprintPlan.status !== 'ready') return { status: 'invalid' };

  const selectedIds = new Set(sprintPlan.selectedCars.map(car => car.id));
  const virtualCars = sprintPlan.selectedCars.map(car => {
    const model = carModels.find(item => item.id === car.modelId);
    return {
      id: `vc_${currentDay}_${random().toString(36).slice(2, 8)}`,
      sourceCarId: car.id,
      modelId: car.modelId,
      carModel: model?.name || car.modelId,
      color: car.color || '黑',
      msrp: getDynamicMsrp(car.modelId),
      price: car.price,
      costPrice: model?.baseCost || 0,
      virtualMonth: month,
      realSold: false,
      draftId: car.draftId || null,
      floatingMonths: 0,
    };
  });
  const virtualRevenue = sprintPlan.selectedCars.reduce((sum, car) => sum + (car.price || 0), 0);
  const virtualCogs = sprintPlan.selectedCars.reduce((sum, car) => sum + (carModels.find(model => model.id === car.modelId)?.baseCost || 0), 0);

  return {
    status: 'settled',
    inventory: inventory.filter(car => !selectedIds.has(car.id)),
    virtualSales: {
      ...virtualSales,
      virtualCars: [...(virtualSales.virtualCars || []), ...virtualCars],
      totalVirtualCount: (virtualSales.totalVirtualCount || 0) + sprintPlan.selectedCars.length,
      suspicionLevel: Math.min(100, (virtualSales.suspicionLevel || 0) + sprintPlan.suspicionIncrease),
      rebateEarnedFromVirtual: (virtualSales.rebateEarnedFromVirtual || 0) + sprintPlan.totalRebate,
      monthlyVirtual: (virtualSales.monthlyVirtual || 0) + sprintPlan.selectedCars.length,
    },
    monthlyStats: {
      ...monthlyStats,
      sales: monthlyStats.sales + sprintPlan.selectedCars.length,
      baseRebatesPool: monthlyStats.baseRebatesPool + sprintPlan.totalRebate,
      virtualRevenue: (monthlyStats.virtualRevenue || 0) + virtualRevenue,
      virtualCogs: (monthlyStats.virtualCogs || 0) + virtualCogs,
      virtualRebate: (monthlyStats.virtualRebate || 0) + sprintPlan.totalRebate,
    },
    gmWealth: { ...gmWealth, morale: Math.min(100, (gmWealth.morale || 80) + 5) },
    ledgerItem: { label: `月底虚出返利入池(${sprintPlan.selectedCars.length}台)`, amount: sprintPlan.totalRebate, type: 'pending' },
    log: { type: 'warning', message: `⚠️【月底虚出】虚出 ${sprintPlan.selectedCars.length} 台车冲抵厂家任务，返利入池 ${formatMoney(sprintPlan.totalRebate)}，厂家怀疑度 +${sprintPlan.suspicionIncrease}。` },
  };
};
