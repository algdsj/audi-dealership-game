const BUILD_SHOWROOM_COST = 150000;
const UPGRADE_SHOWROOM_COST = 80000;
const PREP_USED_CAR_COST = 3000;

const updateUsedCar = (usedCars, ucId, updater) => usedCars.map(car => (car.id === ucId ? updater(car) : car));

export const prepareBuildUsedCarShowroom = ({ usedCarShowroom, cost = BUILD_SHOWROOM_COST }) => {
  if (usedCarShowroom.built) {
    return { status: 'already_built', alert: { title: '已建设', message: '二手车展厅已建设，可升级扩容。' } };
  }

  return {
    status: 'ready',
    cost,
    confirm: {
      title: '建设二手车展厅',
      message: `投资 ¥${cost.toLocaleString()} 建设二手车展厅？\n展厅容量：6台\n建成后可整备和零售二手车，零售成功率大幅提升。`,
    },
  };
};

export const settleBuildUsedCarShowroom = ({ buildPlan, finance }) => {
  if (!buildPlan || buildPlan.status !== 'ready') return { status: 'invalid' };
  if (finance.cash < buildPlan.cost) {
    return { status: 'insufficient_cash', alert: { title: '资金不足', message: `现金不足，需要 ¥${buildPlan.cost.toLocaleString()}` } };
  }

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - buildPlan.cost },
    usedCarShowroom: { built: true, level: 1, capacity: 6 },
    ledgerItem: { label: '建设二手车展厅', amount: -buildPlan.cost, type: 'expense' },
    log: { type: 'success', message: '🏗️【展厅建设】二手车展厅建设完成！容量6台，可整备零售。' },
  };
};

export const prepareUpgradeUsedCarShowroom = ({ usedCarShowroom, cost = UPGRADE_SHOWROOM_COST }) => {
  if (!usedCarShowroom.built) {
    return { status: 'not_built', alert: { title: '未建设', message: '请先建设二手车展厅。' } };
  }
  if (usedCarShowroom.level >= 3) {
    return { status: 'max_level', alert: { title: '已满级', message: '二手车展厅已达最高等级。' } };
  }

  const newLevel = usedCarShowroom.level + 1;
  const newCapacity = 6 + (newLevel - 1) * 3;
  return {
    status: 'ready',
    cost,
    newLevel,
    newCapacity,
    confirm: {
      title: '升级二手车展厅',
      message: `投资 ¥${cost.toLocaleString()} 升级展厅至Lv.${newLevel}？\n新容量：${newCapacity}台`,
    },
  };
};

export const settleUpgradeUsedCarShowroom = ({ upgradePlan, finance, usedCarShowroom }) => {
  if (!upgradePlan || upgradePlan.status !== 'ready') return { status: 'invalid' };
  if (finance.cash < upgradePlan.cost) {
    return { status: 'insufficient_cash', alert: { title: '资金不足', message: `现金不足，需要 ¥${upgradePlan.cost.toLocaleString()}` } };
  }

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - upgradePlan.cost },
    usedCarShowroom: { ...usedCarShowroom, level: upgradePlan.newLevel, capacity: upgradePlan.newCapacity },
    ledgerItem: { label: `升级二手车展厅至Lv.${upgradePlan.newLevel}`, amount: -upgradePlan.cost, type: 'expense' },
    log: { type: 'success', message: `🏗️【展厅升级】二手车展厅升级至Lv.${upgradePlan.newLevel}，容量${upgradePlan.newCapacity}台。` },
  };
};

export const prepareUsedCarPrep = ({ ucId, usedCars, cost = PREP_USED_CAR_COST }) => {
  const usedCar = usedCars.find(car => car.id === ucId);
  if (!usedCar || usedCar.status !== 'stock') return { status: 'invalid' };
  if (usedCar.prepped) return { status: 'already_prepped', alert: { title: '已整备', message: '该车已完成整备。' } };

  return {
    status: 'ready',
    usedCar,
    cost,
    confirm: {
      title: '整备二手车',
      message: `支付 ¥${cost.toLocaleString()} 对 ${usedCar.brand} 进行整备？\n整备后零售成功率从30%提升至55%，次日完成。`,
    },
  };
};

export const settleUsedCarPrep = ({ prepPlan, usedCars, finance, monthlyStats }) => {
  if (!prepPlan || prepPlan.status !== 'ready') return { status: 'invalid' };
  if (finance.cash < prepPlan.cost) {
    return { status: 'insufficient_cash', alert: { title: '资金不足', message: `现金不足，整备费 ¥${prepPlan.cost.toLocaleString()}` } };
  }

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - prepPlan.cost },
    monthlyStats: { ...monthlyStats, usedCarPrepCost: (monthlyStats.usedCarPrepCost || 0) + prepPlan.cost },
    usedCars: updateUsedCar(usedCars, prepPlan.usedCar.id, car => ({ ...car, prepped: true, prepCost: (car.prepCost || 0) + prepPlan.cost })),
    ledgerItem: { label: `二手车整备(${prepPlan.usedCar.brand})`, amount: -prepPlan.cost, type: 'expense' },
    log: { type: 'info', message: `🔧【二手车整备】${prepPlan.usedCar.brand} 整备完成，可上架零售。` },
  };
};

export const updateUsedCarRetailPrice = ({ ucId, newPrice, usedCars }) => {
  const usedCar = usedCars.find(car => car.id === ucId);
  if (!usedCar) return usedCars;

  const parsedPrice = parseInt(newPrice, 10) || 0;
  const minPrice = Math.round(usedCar.purchasePrice * 1.0);
  const maxPrice = Math.round(usedCar.purchasePrice * 1.5);
  const customRetailPrice = Math.max(minPrice, Math.min(maxPrice, parsedPrice));
  return updateUsedCar(usedCars, ucId, car => ({ ...car, customRetailPrice }));
};

export const calculateUsedCarRetailChance = usedCar => {
  const sellPrice = usedCar.customRetailPrice || usedCar.retailPrice;
  const priceRatio = sellPrice / usedCar.purchasePrice;
  let successRate = usedCar.prepped ? 0.55 : 0.30;
  if (priceRatio > 1.2) successRate -= Math.floor((priceRatio - 1.2) / 0.1) * 0.05;
  return Math.max(0.15, Math.min(0.65, successRate));
};

export const prepareUsedCarRetail = ({ ucId, usedCars, usedCarShowroom }) => {
  const usedCar = usedCars.find(car => car.id === ucId);
  if (!usedCar || usedCar.status !== 'stock') return { status: 'invalid' };
  if (!usedCarShowroom.built) {
    return { status: 'not_built', alert: { title: '无法零售', message: '未建设二手车展厅，无法零售。只能批售或先建设展厅。' } };
  }

  const sellPrice = usedCar.customRetailPrice || usedCar.retailPrice;
  const successRate = calculateUsedCarRetailChance(usedCar);
  const successPercent = Math.round(successRate * 100);
  const realizedCost = usedCar.purchasePrice + (usedCar.prepCost || 0);

  return {
    status: 'ready',
    usedCar,
    sellPrice,
    successRate,
    realizedCost,
    confirm: {
      title: '零售二手车',
      message: `尝试零售 ${usedCar.brand}？\n零售价: ¥${sellPrice.toLocaleString()}（收车价 ¥${usedCar.purchasePrice.toLocaleString()}${usedCar.prepCost ? `，整备¥${usedCar.prepCost.toLocaleString()}` : ''}）\n${successPercent}%概率成交，未成交则继续持有。`,
    },
  };
};

export const settleUsedCarRetail = ({
  retailPlan,
  usedCars,
  finance,
  monthlyStats,
  random = Math.random,
}) => {
  if (!retailPlan || retailPlan.status !== 'ready') return { status: 'invalid' };

  if (random() >= retailPlan.successRate) {
    return {
      status: 'missed',
      log: { type: 'info', message: `♻️【二手车零售】${retailPlan.usedCar.brand} 未能成交，继续持有。` },
    };
  }

  const profit = retailPlan.sellPrice - retailPlan.realizedCost;
  return {
    status: 'sold',
    usedCars: updateUsedCar(usedCars, retailPlan.usedCar.id, car => ({ ...car, status: 'retailed', soldPrice: retailPlan.sellPrice })),
    finance: { ...finance, cash: finance.cash + retailPlan.sellPrice },
    monthlyStats: {
      ...monthlyStats,
      usedCarRevenue: (monthlyStats.usedCarRevenue || 0) + retailPlan.sellPrice,
      usedCarCost: (monthlyStats.usedCarCost || 0) + retailPlan.realizedCost,
    },
    ledgerItems: [
      { label: `二手车零售(${retailPlan.usedCar.brand})`, amount: retailPlan.sellPrice, type: 'income' },
      { label: `二手车实现成本(${retailPlan.usedCar.brand})`, amount: -retailPlan.realizedCost, type: 'expense' },
    ],
    log: { type: 'success', message: `♻️【二手车零售】${retailPlan.usedCar.brand} 以 ¥${retailPlan.sellPrice.toLocaleString()} 成交！利润 ¥${profit.toLocaleString()}。` },
  };
};

export const prepareUsedCarWholesale = ({ ucId, usedCars }) => {
  const usedCar = usedCars.find(car => car.id === ucId);
  if (!usedCar || usedCar.status !== 'stock') return { status: 'invalid' };

  const wholesalePrice = Math.round(usedCar.purchasePrice * 0.95);
  const realizedCost = usedCar.purchasePrice + (usedCar.prepCost || 0);
  return {
    status: 'ready',
    usedCar,
    wholesalePrice,
    realizedCost,
    confirm: {
      title: '批售二手车',
      message: `将 ${usedCar.brand} 批售给二手车商？\n批售价: ¥${wholesalePrice.toLocaleString()}（收车价 ¥${usedCar.purchasePrice.toLocaleString()}，亏损5%）\n立即成交。`,
    },
  };
};

export const settleUsedCarWholesale = ({ wholesalePlan, usedCars, finance, monthlyStats }) => {
  if (!wholesalePlan || wholesalePlan.status !== 'ready') return { status: 'invalid' };

  return {
    status: 'settled',
    usedCars: updateUsedCar(usedCars, wholesalePlan.usedCar.id, car => ({ ...car, status: 'wholesaled' })),
    finance: { ...finance, cash: finance.cash + wholesalePlan.wholesalePrice },
    monthlyStats: {
      ...monthlyStats,
      usedCarRevenue: (monthlyStats.usedCarRevenue || 0) + wholesalePlan.wholesalePrice,
      usedCarCost: (monthlyStats.usedCarCost || 0) + wholesalePlan.realizedCost,
    },
    ledgerItems: [
      { label: `二手车批售(${wholesalePlan.usedCar.brand})`, amount: wholesalePlan.wholesalePrice, type: 'income' },
      { label: `二手车实现成本(${wholesalePlan.usedCar.brand})`, amount: -wholesalePlan.realizedCost, type: 'expense' },
    ],
    log: { type: 'info', message: `♻️【二手车批售】${wholesalePlan.usedCar.brand} 以 ¥${wholesalePlan.wholesalePrice.toLocaleString()} 批售给车商。` },
  };
};
