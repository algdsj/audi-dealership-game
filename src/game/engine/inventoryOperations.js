import { getSeriesStrategy } from './vehicleStructure.js';
import { VEHICLE_SERIES_PRICE_STRATEGIES } from '../config/vehicleStructure.js';

export const prepareInventorySubsidy = ({
  modelId,
  inventory,
  carModels,
  monthlyStats,
  currentDay,
}) => {
  const modelDef = carModels.find(model => model.id === modelId);
  if (!modelDef) return { status: 'invalid' };

  const cars30 = inventory.filter(car => car.modelId === modelId && !car.subsidized && (car.stockDays || 0) >= 30 && (car.stockDays || 0) < 60);
  const cars60 = inventory.filter(car => car.modelId === modelId && !car.subsidized && (car.stockDays || 0) >= 60 && (car.stockDays || 0) < 90);
  const cars90 = inventory.filter(car => car.modelId === modelId && !car.subsidized && (car.stockDays || 0) >= 90 && (car.stockDays || 0) < 120);
  const eligibleCars = [...cars30, ...cars60, ...cars90];

  if (eligibleCars.length === 0) {
    const oldCars = inventory.filter(car => car.modelId === modelId && !car.subsidized);
    if (oldCars.length === 0) {
      return { status: 'no_stock', alert: { title: '申请失败', message: '该车型当前库存为空或已全部申请过补贴。' } };
    }
    return {
      status: 'not_aged',
      alert: { title: '申请失败', message: `该车型暂无库龄超过30天的车辆，当前最长库龄: ${Math.max(...oldCars.map(car => car.stockDays || 0))} 天。` },
    };
  }

  if (!monthlyStats.lastMonthProcessPassed && currentDay > 30) {
    return { status: 'process_failed', alert: { title: '申请失败', message: '上月过程考核未达标（邀约到店率≥10%且销售转化率≥20%），无法申请长库龄补贴。' } };
  }

  const subsidy30 = cars30.length * 5000;
  const subsidy60 = cars60.length * 12000;
  const subsidy90 = cars90.length * 20000;
  const totalSubsidy = subsidy30 + subsidy60 + subsidy90;
  const breakdown = [];
  if (cars30.length > 0) breakdown.push(`30-59天: ${cars30.length}台 × ¥5,000 = ¥${subsidy30.toLocaleString()}`);
  if (cars60.length > 0) breakdown.push(`60-89天: ${cars60.length}台 × ¥12,000 = ¥${subsidy60.toLocaleString()}`);
  if (cars90.length > 0) breakdown.push(`90-119天: ${cars90.length}台 × ¥20,000 = ¥${subsidy90.toLocaleString()}`);

  return {
    status: 'ready',
    modelId,
    modelName: modelDef.name,
    eligibleCount: eligibleCars.length,
    totalSubsidy,
    confirm: {
      title: '申请库存补贴',
      message: `是否向厂家申请 ${modelDef.name} 的滞销特批补贴？\n\n${breakdown.join('\n')}\n\n合计: ¥${totalSubsidy.toLocaleString()}`,
    },
  };
};

export const settleInventorySubsidy = ({
  subsidyPlan,
  inventory,
  monthlyStats,
}) => {
  if (!subsidyPlan || subsidyPlan.status !== 'ready') return { status: 'invalid' };

  return {
    status: 'settled',
    inventory: inventory.map(car => car.modelId === subsidyPlan.modelId && !car.subsidized && (car.stockDays || 0) >= 30
      ? { ...car, subsidized: true }
      : car),
    monthlyStats: { ...monthlyStats, baseRebatesPool: monthlyStats.baseRebatesPool + subsidyPlan.totalSubsidy },
    ledgerItem: { label: `库存补贴入池(${subsidyPlan.modelName})`, amount: subsidyPlan.totalSubsidy, type: 'pending' },
    log: { type: 'success', message: `💰 厂家特批！${subsidyPlan.eligibleCount} 台 ${subsidyPlan.modelName} 获得分级补贴共 ¥${subsidyPlan.totalSubsidy.toLocaleString()} 注入待结返利池。` },
  };
};

export const moveInventoryCar = ({
  modelId,
  targetLocation,
  inventory,
  facility,
  carModels,
}) => {
  const modelDef = carModels.find(model => model.id === modelId);
  if (!modelDef) return { status: 'invalid' };

  const showroomUsed = inventory.filter(car => car.location === 'showroom').length;
  const modelInShowroom = inventory.filter(car => car.modelId === modelId && car.location === 'showroom').length;
  const modelInWarehouse = inventory.filter(car => car.modelId === modelId && car.location === 'warehouse').length;

  if (targetLocation === 'showroom') {
    if (modelInWarehouse === 0) return { status: 'no_warehouse_stock', alert: { title: '操作失败', message: '该车型仓储区无车可上展。' } };
    if (showroomUsed >= facility.showroomSpots) {
      return { status: 'showroom_full', alert: { title: '展厅已满', message: `展厅展位已满 (${showroomUsed}/${facility.showroomSpots})，请先移出其他展车。` } };
    }

    const updatedInventory = [...inventory];
    const index = updatedInventory.findIndex(car => car.modelId === modelId && car.location === 'warehouse');
    if (index === -1) return { status: 'invalid' };
    updatedInventory[index] = { ...updatedInventory[index], location: 'showroom' };
    return {
      status: 'moved',
      inventory: updatedInventory,
      log: { type: 'info', message: `🏪 ${modelDef.name} 移入展厅展示，可提升该车型转化率 +12%。` },
    };
  }

  if (modelInShowroom === 0) return { status: 'no_showroom_stock', alert: { title: '操作失败', message: '该车型无展厅展车可移出。' } };
  const updatedInventory = [...inventory];
  const index = updatedInventory.findIndex(car => car.modelId === modelId && car.location === 'showroom');
  if (index === -1) return { status: 'invalid' };
  updatedInventory[index] = { ...updatedInventory[index], location: 'warehouse' };
  return {
    status: 'moved',
    inventory: updatedInventory,
    log: { type: 'info', message: `📦 ${modelDef.name} 移回仓储区，将产生 ¥50/天仓储费用。` },
  };
};

export const autoArrangeShowroom = ({
  inventory,
  facility,
  carModels = [],
}) => {
  const showroomUsed = inventory.filter(car => car.location === 'showroom').length;
  const availableSpots = facility.showroomSpots - showroomUsed;
  if (availableSpots <= 0) return { status: 'showroom_full', alert: { title: '展厅已满', message: '展厅展位已满，无法布展。' } };

  const displayedModelIds = new Set(inventory.filter(car => car.location === 'showroom').map(car => car.modelId));
  const modelMap = new Map((carModels || []).map(model => [model.id, model]));
  const getShowroomWeight = modelId => {
    const series = modelMap.get(modelId)?.series;
    return getSeriesStrategy(series)?.showroomWeight || 0.5;
  };
  const candidates = [...new Set(inventory.filter(car => car.location === 'warehouse').map(car => car.modelId))]
    .filter(modelId => !displayedModelIds.has(modelId))
    .sort((a, b) => getShowroomWeight(b) - getShowroomWeight(a));

  const updatedInventory = [...inventory];
  if (candidates.length === 0) {
    const warehouseModels = [...new Set(inventory.filter(car => car.location === 'warehouse').map(car => car.modelId))]
      .sort((a, b) => getShowroomWeight(b) - getShowroomWeight(a));
    if (warehouseModels.length === 0) return { status: 'no_stock', alert: { title: '无可布展车辆', message: '仓储区无车辆可上展。' } };

    const toDisplay = warehouseModels.slice(0, availableSpots);
    for (const modelId of toDisplay) {
      const index = updatedInventory.findIndex(car => car.modelId === modelId && car.location === 'warehouse');
      if (index !== -1) updatedInventory[index] = { ...updatedInventory[index], location: 'showroom' };
    }
    return {
      status: 'arranged',
      inventory: updatedInventory,
      log: { type: 'info', message: `🏪 快速布展：将 ${toDisplay.length} 台车移入展厅（补充同车型展位）。` },
    };
  }

  const toDisplay = candidates.slice(0, availableSpots);
  for (const modelId of toDisplay) {
    const index = updatedInventory.findIndex(car => car.modelId === modelId && car.location === 'warehouse');
    if (index !== -1) updatedInventory[index] = { ...updatedInventory[index], location: 'showroom' };
  }
  return {
    status: 'arranged',
    inventory: updatedInventory,
    log: { type: 'success', message: `🏪 快速布展：将 ${toDisplay.length} 款新车型移入展厅，展车多样性提升自然客流！` },
  };
};

export const updateModelInventoryPriceInput = ({
  modelId,
  newPrice,
  inventory,
}) => {
  const price = parseInt(newPrice, 10) || 0;
  return inventory.map(car => car.modelId === modelId ? { ...car, price } : car);
};

export const commitModelInventoryPrice = ({
  modelId,
  inventory,
  carModels,
  getDynamicMsrp,
}) => {
  const sampleCar = inventory.find(car => car.modelId === modelId);
  if (!sampleCar) return { status: 'invalid' };

  const modelDef = carModels.find(model => model.id === modelId);
  const minPrice = modelDef ? Math.round(modelDef.baseCost * 0.8) : 100000;
  const maxPrice = modelDef ? Math.round(getDynamicMsrp(modelId) * 1.3) : 9999999;
  const price = Math.max(minPrice, Math.min(maxPrice, sampleCar.price));
  return {
    status: 'committed',
    modelPriceOverrides: { [modelId]: price },
    inventory: inventory.map(car => car.modelId === modelId ? { ...car, price } : car),
  };
};

export const applySeriesPriceStrategy = ({
  series,
  inventory,
  carModels,
  marketPrices = {},
  getDynamicMsrp,
}) => {
  const strategy = VEHICLE_SERIES_PRICE_STRATEGIES[series];
  if (!strategy) return { status: 'invalid' };
  const seriesModels = carModels.filter(model => model.series === series);
  if (seriesModels.length === 0) return { status: 'invalid' };

  const modelPriceOverrides = {};
  const pricesByModel = {};
  seriesModels.forEach(model => {
    const dynamicMsrp = getDynamicMsrp(model.id);
    const marketPrice = marketPrices[model.id] || dynamicMsrp;
    const target = Math.round(Math.min(
      dynamicMsrp * strategy.msrpRatio,
      marketPrice * strategy.marketRatio,
    ) / 1000) * 1000;
    const minPrice = Math.round(model.baseCost * strategy.minCostRatio / 1000) * 1000;
    const maxPrice = Math.round(dynamicMsrp * 1.12 / 1000) * 1000;
    const price = Math.max(minPrice, Math.min(maxPrice, target));
    modelPriceOverrides[model.id] = price;
    pricesByModel[model.id] = price;
  });

  const changedCount = inventory.filter(car => pricesByModel[car.modelId] != null).length;
  return {
    status: 'applied',
    series,
    strategy,
    modelPriceOverrides,
    inventory: inventory.map(car => pricesByModel[car.modelId] != null ? { ...car, price: pricesByModel[car.modelId] } : car),
    changedCount,
    log: {
      type: 'info',
      message: `🏷️【车系价格策略】${series} 已应用“${strategy.label}”，同步调整 ${changedCount} 台库存车标价。`,
    },
  };
};
