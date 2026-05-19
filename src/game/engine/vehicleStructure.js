import {
  MANUFACTURER_STRUCTURE_TARGETS,
  VEHICLE_SERIES_STRATEGY,
  VEHICLE_SERIES_COMPETITOR_MAP,
  VEHICLE_STRUCTURE_THRESHOLDS,
} from '../config/vehicleStructure.js';

const safeNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const ratio = (value, base) => (safeNumber(base) > 0 ? safeNumber(value) / safeNumber(base) : 0);

const getModelMap = carModels => new Map((carModels || []).map(model => [model.id, model]));

const getSeriesList = carModels => [...new Set((carModels || []).map(model => model.series).filter(Boolean))];

const createSeriesRow = series => ({
  series,
  label: VEHICLE_SERIES_STRATEGY[series]?.label || series,
  role: VEHICLE_SERIES_STRATEGY[series]?.role || '常规车系',
  audience: VEHICLE_SERIES_STRATEGY[series]?.audience || '综合客群',
  positioning: VEHICLE_SERIES_STRATEGY[series]?.positioning || '',
  tags: VEHICLE_SERIES_STRATEGY[series]?.tags || [],
  showroomWeight: VEHICLE_SERIES_STRATEGY[series]?.showroomWeight || 0.7,
  inventory: 0,
  showroom: 0,
  warehouse: 0,
  transit: 0,
  sales: 0,
  agedCount: 0,
  maxStockDays: 0,
  capital: 0,
  share: 0,
  capitalShare: 0,
});

const buildRowsBySeries = carModels => getSeriesList(carModels).reduce((rows, series) => {
  rows[series] = createSeriesRow(series);
  return rows;
}, {});

const addRecommendation = (items, item) => {
  if (!items.some(existing => existing.id === item.id)) items.push(item);
};

const countCustomerSignals = ({ customerDeals = [], salesOpportunities = [] }) => {
  const signals = { bySegment: {}, byPreferredSeries: {} };
  const addSegment = segment => {
    if (segment) signals.bySegment[segment] = (signals.bySegment[segment] || 0) + 1;
  };
  const addSeries = series => {
    if (series) signals.byPreferredSeries[series] = (signals.byPreferredSeries[series] || 0) + 1;
  };

  (customerDeals || [])
    .filter(item => (item.status || 'pending') === 'pending')
    .forEach(item => {
      addSegment(item.segment);
      (item.preferredSeries || item.profile?.preferredSeries || []).forEach(addSeries);
    });

  (salesOpportunities || [])
    .filter(item => !['closed', 'discarded', 'expired'].includes(item.status))
    .forEach(item => {
      addSegment(item.segment || item.metadata?.segment);
      (item.preferredSeries || item.metadata?.preferredSeries || []).forEach(addSeries);
    });

  return signals;
};

const isNevPressure = ({ activeRegion = {}, marketEnvironment = {}, competitors = {} }) => {
  const affectedSegments = marketEnvironment.competitorEvent?.affectedSegments || [];
  const visibleEvCompetitors = (competitors.stores || []).filter(store => store.brand === 'ev' && store.isVisible !== false).length;
  return activeRegion.id === 'nev_hot'
    || /新能源/.test(activeRegion.name || '')
    || affectedSegments.includes('新能源')
    || visibleEvCompetitors > 0;
};

export const getModelSeries = ({ modelId, carModels = [] }) => (
  (carModels || []).find(model => model.id === modelId)?.series || null
);

export const getSeriesStrategy = series => VEHICLE_SERIES_STRATEGY[series] || null;

export const buildManufacturerStructureTarget = ({
  month = 1,
  targetUnits = 0,
  carModels = [],
}) => {
  const availableSeries = new Set(getSeriesList(carModels));
  const items = MANUFACTURER_STRUCTURE_TARGETS
    .filter(item => availableSeries.has(item.series))
    .map(item => ({
      ...item,
      targetUnits: Math.max(item.minUnits || 1, Math.round(safeNumber(targetUnits) * (item.targetShare || 0))),
      purchasedUnits: 0,
    }));
  return {
    month,
    status: 'active',
    items,
    lastResult: null,
    history: [],
  };
};

export const normalizeManufacturerStructureTarget = ({
  structure,
  month = 1,
  targetUnits = 0,
  carModels = [],
  historyLimit = 8,
}) => {
  const initial = buildManufacturerStructureTarget({ month, targetUnits, carModels });
  const previousItems = new Map((structure?.items || []).map(item => [item.id || item.series, item]));
  return {
    ...initial,
    ...(structure || {}),
    month: structure?.month || month,
    status: structure?.status || 'active',
    items: initial.items.map(item => {
      const previous = previousItems.get(item.id) || previousItems.get(item.series) || {};
      return {
        ...item,
        targetUnits: Math.max(1, Number(previous.targetUnits ?? item.targetUnits) || item.targetUnits),
        purchasedUnits: Math.max(0, Number(previous.purchasedUnits ?? item.purchasedUnits) || 0),
      };
    }),
    lastResult: structure?.lastResult || null,
    history: Array.isArray(structure?.history) ? structure.history.slice(0, historyLimit) : [],
  };
};

export const recordManufacturerStructurePurchase = ({
  structure,
  modelId,
  quantity = 0,
  carModels = [],
}) => {
  const series = getModelSeries({ modelId, carModels });
  if (!series) return structure;
  return {
    ...structure,
    items: (structure?.items || []).map(item => item.series === series
      ? { ...item, purchasedUnits: (item.purchasedUnits || 0) + Math.max(0, Number(quantity) || 0) }
      : item),
  };
};

export const settleManufacturerStructureTarget = ({ structure }) => {
  const items = (structure?.items || []).map(item => {
    const achieved = (item.purchasedUnits || 0) >= (item.targetUnits || 0);
    return {
      id: item.id,
      series: item.series,
      label: item.label,
      targetUnits: item.targetUnits || 0,
      purchasedUnits: item.purchasedUnits || 0,
      achieved,
      rewardAmount: achieved ? item.rewardAmount || 0 : 0,
      relationshipDelta: achieved ? item.relationshipDelta || 0 : -1,
    };
  });
  const achievedCount = items.filter(item => item.achieved).length;
  const rewardAmount = items.reduce((sum, item) => sum + item.rewardAmount, 0);
  const relationshipDelta = items.reduce((sum, item) => sum + item.relationshipDelta, 0);
  const result = {
    month: structure?.month || 1,
    achievedCount,
    totalCount: items.length,
    rewardAmount,
    relationshipDelta,
    achieved: achievedCount === items.length && items.length > 0,
    items,
  };
  return result;
};

export const getSeriesCompetitorImpact = ({
  modelDef,
  marketEnvironment = {},
  competitors = {},
}) => {
  if (!modelDef) return { demandImpact: 0, priceDrift: 0, rivalLabels: [], pressureScore: 0 };
  const map = VEHICLE_SERIES_COMPETITOR_MAP[modelDef.series] || {};
  const event = marketEnvironment.competitorEvent || {};
  const eventSeries = event.affectedSeries || [];
  const eventAffectsSeries = eventSeries.includes(modelDef.series);
  const eventAffectsSegment = (event.affectedSegments || []).includes(modelDef.segment);
  const visibleMatchingStores = (competitors.stores || [])
    .filter(store => store.isVisible !== false && (map.competitorBrands || []).includes(store.brand));
  const storePressure = visibleMatchingStores.reduce((sum, store) => {
    const pull = Math.max(0, safeNumber(store.customerPull || 50) - 50) / 1000;
    return sum + pull;
  }, 0);
  const eventMultiplier = eventAffectsSeries ? 1 : eventAffectsSegment ? 0.62 : 0;
  const sensitivity = map.pressureSensitivity || 0.75;
  const priceSensitivity = map.priceSensitivity || sensitivity;
  const pressureScore = Math.min(0.16, storePressure * sensitivity + (competitors.priceWarActive ? 0.025 * sensitivity : 0));
  return {
    demandImpact: safeNumber(event.demandImpact) * eventMultiplier * sensitivity - pressureScore,
    priceDrift: safeNumber(event.priceDrift) * eventMultiplier * priceSensitivity - pressureScore * 0.12,
    rivalLabels: map.rivals || [],
    pressureScore,
  };
};

export const buildShowroomStrategySnapshot = ({
  inventory = [],
  carModels = [],
}) => {
  const modelMap = getModelMap(carModels);
  const displayedSeries = [...new Set(inventory
    .filter(car => car.location === 'showroom')
    .map(car => modelMap.get(car.modelId)?.series)
    .filter(Boolean))];
  const effects = displayedSeries.map(series => ({
    series,
    label: VEHICLE_SERIES_STRATEGY[series]?.label || series,
    role: VEHICLE_SERIES_STRATEGY[series]?.role || '展厅车型',
    ...(VEHICLE_SERIES_STRATEGY[series]?.showroomEffect || {}),
  }));
  const segmentBonus = effects.reduce((acc, effect) => {
    Object.entries(effect.segmentBonus || {}).forEach(([segment, value]) => {
      acc[segment] = (acc[segment] || 0) + value;
    });
    return acc;
  }, {});
  return {
    displayedSeries,
    effects,
    naturalWalkInBonus: effects.reduce((sum, effect) => sum + safeNumber(effect.naturalWalkInBonus), 0),
    conversionBonusBySeries: effects.reduce((acc, effect) => ({
      ...acc,
      [effect.series]: safeNumber(effect.conversionBonus),
    }), {}),
    competitorShield: effects.reduce((sum, effect) => sum + safeNumber(effect.competitorShield), 0),
    tradeInBonus: effects.reduce((sum, effect) => sum + safeNumber(effect.tradeInBonus), 0),
    segmentBonus,
  };
};

export function buildVehicleStructureSnapshot({
  inventory = [],
  pendingOrders = [],
  soldVehicles = [],
  monthlyStats = {},
  customerDeals = [],
  salesOpportunities = [],
  carModels = [],
  financeSnapshot = {},
  activeRegion = {},
  marketEnvironment = {},
  competitors = {},
  thresholds = VEHICLE_STRUCTURE_THRESHOLDS,
} = {}) {
  const modelMap = getModelMap(carModels);
  const rowsBySeries = buildRowsBySeries(carModels);

  inventory.forEach(car => {
    const model = modelMap.get(car.modelId);
    if (!model || !rowsBySeries[model.series]) return;
    const row = rowsBySeries[model.series];
    const stockDays = safeNumber(car.stockDays);
    row.inventory += 1;
    row.showroom += car.location === 'showroom' ? 1 : 0;
    row.warehouse += car.location === 'showroom' ? 0 : 1;
    row.agedCount += stockDays >= thresholds.evAgingDays ? 1 : 0;
    row.maxStockDays = Math.max(row.maxStockDays, stockDays);
    row.capital += safeNumber(car.costPrice || car.baseCost || model.baseCost);
  });

  pendingOrders.forEach(order => {
    const model = modelMap.get(order.modelId);
    if (!model || !rowsBySeries[model.series]) return;
    const quantity = safeNumber(order.quantity || 1);
    const row = rowsBySeries[model.series];
    row.transit += quantity;
    row.capital += safeNumber(order.unitCost || order.costPrice || model.baseCost) * quantity;
  });

  soldVehicles.forEach(vehicle => {
    const model = modelMap.get(vehicle.modelId);
    if (!model || !rowsBySeries[model.series]) return;
    rowsBySeries[model.series].sales += 1;
  });

  const rows = Object.values(rowsBySeries);
  const totalInventory = rows.reduce((sum, row) => sum + row.inventory, 0);
  const totalTransit = rows.reduce((sum, row) => sum + row.transit, 0);
  const totalShowroom = rows.reduce((sum, row) => sum + row.showroom, 0);
  const totalCapital = rows.reduce((sum, row) => sum + row.capital, 0);
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);

  rows.forEach(row => {
    row.share = ratio(row.inventory + row.transit, totalInventory + totalTransit);
    row.capitalShare = ratio(row.capital, totalCapital);
  });

  const signals = countCustomerSignals({ customerDeals, salesOpportunities });
  const available = series => (rowsBySeries[series]?.inventory || 0) + (rowsBySeries[series]?.transit || 0);
  const showroom = series => rowsBySeries[series]?.showroom || 0;
  const youngAvailability = available('A3L') + available('A5L');
  const businessSignals = (signals.bySegment.商务 || 0) + (signals.byPreferredSeries.A6L || 0);
  const youngSignals = (signals.bySegment.年轻 || 0) + (signals.byPreferredSeries.A3L || 0) + (signals.byPreferredSeries.A5L || 0);
  const recommendations = [];

  if ((safeNumber(monthlyStats.leads) >= thresholds.youngLeadPressure || youngSignals > 0) && youngAvailability < thresholds.minYoungAvailability) {
    addRecommendation(recommendations, {
      id: 'young_series_shortage',
      level: 'watch',
      title: '年轻客群承接不足',
      detail: `A3L/A5L 库存+在途仅 ${youngAvailability} 台，当前线索多时容易把预算型和个性化客户推给竞品。`,
      tab: 'order',
      series: ['A3L', 'A5L'],
    });
  }

  if ((businessSignals > 0 || safeNumber(monthlyStats.target) >= 12) && available('A6L') < thresholds.minBusinessAvailability) {
    addRecommendation(recommendations, {
      id: 'business_series_shortage',
      level: 'danger',
      title: '商务主力断档',
      detail: `A6L 库存+在途 ${available('A6L')} 台，商务客户和利润贡献会被直接压住。`,
      tab: 'order',
      series: ['A6L'],
    });
  }

  const q6 = rowsBySeries['Q6L e-tron'];
  if (q6 && (q6.maxStockDays >= thresholds.evAgingDays || (isNevPressure({ activeRegion, marketEnvironment, competitors }) && available('Q6L e-tron') <= 0))) {
    addRecommendation(recommendations, {
      id: 'ev_series_pressure',
      level: q6.maxStockDays >= thresholds.evAgingDays ? 'danger' : 'watch',
      title: '新能源节奏要单独盯',
      detail: q6.maxStockDays >= thresholds.evAgingDays
        ? `Q6L e-tron 最长库龄 ${q6.maxStockDays} 天，新能源客户比价快，建议优先布展或做专项邀约。`
        : '本地新能源压力偏强，但 Q6L e-tron 没有可承接车辆，容易丢纯电 SUV 客户。',
      tab: q6.maxStockDays >= thresholds.evAgingDays ? 'showroom' : 'order',
      series: ['Q6L e-tron'],
    });
  }

  const capitalHeavyShare = (rowsBySeries.A6L?.capitalShare || 0) + (rowsBySeries.Q5L?.capitalShare || 0);
  if (capitalHeavyShare >= thresholds.highCapitalShare && safeNumber(financeSnapshot.cashCoverageDays) < thresholds.cashPressureDays) {
    addRecommendation(recommendations, {
      id: 'capital_heavy_mix',
      level: 'danger',
      title: 'A6L/Q5L 占资偏重',
      detail: `A6L/Q5L 占用 ${Math.round(capitalHeavyShare * 100)}% 车辆资金，现金覆盖偏低时要控制继续订货。`,
      tab: 'reports',
      series: ['A6L', 'Q5L'],
    });
  }

  const missingShowroomCore = rows
    .filter(row => row.showroomWeight >= 0.9 && row.inventory + row.transit > 0 && row.showroom <= 0)
    .slice(0, 2);
  if (missingShowroomCore.length > 0 || (showroom('Q6L e-tron') <= 0 && isNevPressure({ activeRegion, marketEnvironment, competitors }))) {
    addRecommendation(recommendations, {
      id: 'showroom_mix_gap',
      level: 'watch',
      title: '展厅车型结构不完整',
      detail: `${missingShowroomCore.map(row => row.label).join('、') || '新能源车型'} 缺少展车，展厅吸引和试驾转化会打折。`,
      tab: 'showroom',
      series: missingShowroomCore.map(row => row.series),
    });
  }

  return {
    summary: {
      totalInventory,
      totalTransit,
      totalShowroom,
      totalCapital,
      totalSales,
      demandSignals: signals,
    },
    rows: rows.sort((a, b) => (b.inventory + b.transit + b.sales) - (a.inventory + a.transit + a.sales)),
    recommendations: recommendations.slice(0, 4),
  };
}
