const DEFAULT_FACILITY = {
  level: 1,
  showroomSpots: 5,
  warehouseCapacity: 25,
};

const DEFAULT_FINANCE = {
  cash: 0,
  loan: 0,
  creditLimit: 0,
};

const DEFAULT_MONTHLY_STATS = {
  target: 15,
  sales: 0,
  afterSalesRevenue: 0,
  afterSalesCost: 0,
  afterSalesReturnVisits: 0,
  tradeInCount: 0,
  csiScore: 90,
};

const TEAM_META = {
  sales: { label: '销售', roles: ['sales', 'dcc'], defaultStress: 42, defaultMorale: 68 },
  afterSales: { label: '售后', roles: ['tech', 'service'], defaultStress: 45, defaultMorale: 66 },
  market: { label: '市场', roles: ['streamer'], defaultStress: 38, defaultMorale: 64 },
  finance: { label: '财务', roles: [], defaultStress: 40, defaultMorale: 70 },
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const asArray = (value) => (Array.isArray(value) ? value : []);

const asObject = (value) => (value && typeof value === 'object' ? value : {});

const asNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const ratio = (value, total) => {
  const safeTotal = Math.max(1, asNumber(total, 0));
  return clamp(Math.round((asNumber(value, 0) / safeTotal) * 100));
};

const getOrderQuantity = (order) => Math.max(0, asNumber(order?.quantity ?? order?.count ?? order?.total, 0));

const getStockDays = (car) => Math.max(0, asNumber(car?.stockDays ?? car?.daysInStock, 0));

const getCarModelLabel = (car, modelById) => {
  const model = modelById.get(car?.modelId);
  return model?.series || model?.name || car?.series || car?.modelName || car?.modelId || '未标注车型';
};

const summarizeZone = (score, goodLabel, warnLabel, dangerLabel) => {
  if (score >= 80) return { tone: 'good', label: goodLabel };
  if (score >= 58) return { tone: 'warn', label: warnLabel };
  return { tone: 'danger', label: dangerLabel };
};

const getPressureLabel = (value) => {
  if (value >= 78) return '高压';
  if (value >= 55) return '承压';
  return '稳定';
};

const buildModelMix = ({ inventory, carModels }) => {
  const modelById = new Map(asArray(carModels).map(model => [model.id, model]));
  const modelCounts = new Map();

  inventory.forEach(car => {
    const label = getCarModelLabel(car, modelById);
    modelCounts.set(label, (modelCounts.get(label) || 0) + 1);
  });

  return [...modelCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
};

const collectTeamMembers = ({ staff, afterSales, roles }) => {
  const normalizedStaff = asObject(staff);
  const normalizedAfterSales = asObject(afterSales);

  return roles.flatMap(role => {
    if (role === 'tech') return asArray(normalizedAfterSales.technicians).map(member => ({ ...member, role }));
    return asArray(normalizedStaff[role]?.members).map(member => ({ ...member, role }));
  });
};

const averageMemberValue = (members, key, fallback) => {
  if (members.length === 0) return fallback;
  return Math.round(members.reduce((sum, member) => sum + asNumber(member?.[key], fallback), 0) / members.length);
};

const buildTeamLane = ({ key, staff, afterSales, finance, monthlyStats }) => {
  const meta = TEAM_META[key];
  const members = collectTeamMembers({ staff, afterSales, roles: meta.roles });
  let pressure = averageMemberValue(members, 'stress', meta.defaultStress);
  let morale = averageMemberValue(members, 'loyalty', meta.defaultMorale);

  if (key === 'sales') {
    const target = Math.max(1, asNumber(monthlyStats.target, DEFAULT_MONTHLY_STATS.target));
    const salesGap = clamp(100 - ratio(monthlyStats.sales, target));
    pressure = Math.round((pressure * 0.65) + (salesGap * 0.35));
  }

  if (key === 'afterSales') {
    const complaints = asNumber(afterSales.complaints ?? monthlyStats.complaints, 0);
    pressure = clamp(pressure + complaints * 6);
  }

  if (key === 'finance') {
    const creditLimit = asNumber(finance.creditLimit, 0);
    const loanPressure = creditLimit > 0 ? ratio(finance.loan, creditLimit) : 0;
    const cashPressure = finance.cash < 0 ? 95 : finance.cash < 500000 ? 72 : 35;
    pressure = Math.round((loanPressure * 0.55) + (cashPressure * 0.45));
    morale = clamp(100 - pressure + 18);
  }

  return {
    key,
    label: meta.label,
    count: members.length,
    pressure: clamp(pressure),
    morale: clamp(morale),
    status: getPressureLabel(pressure),
    tone: pressure >= 78 ? 'danger' : pressure >= 55 ? 'warn' : 'good',
  };
};

const extractRecentAlerts = ({ alerts, logs }) => {
  const explicitAlerts = asArray(alerts)
    .map(item => item?.title || item?.message || item?.body || item?.summary || item)
    .filter(Boolean);
  const logAlerts = asArray(logs)
    .slice(-5)
    .map(item => item?.message || item?.title || item)
    .filter(Boolean);

  return [...explicitAlerts, ...logAlerts]
    .map(text => String(text))
    .filter(Boolean)
    .slice(-6);
};

export function buildStoreOverviewViewModel({
  inventory,
  pendingOrders,
  usedCars,
  facility,
  afterSales,
  staff,
  finance,
  monthlyStats,
  csi,
  competitors,
  alerts,
  logs,
  carModels,
  usedCarShowroom,
  investorRelations,
  manufacturerPolicy,
  dayOfMonth,
} = {}) {
  const safeInventory = asArray(inventory);
  const safePendingOrders = asArray(pendingOrders);
  const safeUsedCars = asArray(usedCars);
  const safeFacility = { ...DEFAULT_FACILITY, ...asObject(facility) };
  const safeAfterSales = asObject(afterSales);
  const safeStaff = asObject(staff);
  const safeFinance = { ...DEFAULT_FINANCE, ...asObject(finance) };
  const safeMonthlyStats = { ...DEFAULT_MONTHLY_STATS, ...asObject(monthlyStats) };
  const safeCsi = asObject(csi);
  const safeInvestorRelations = asObject(investorRelations);
  const safeManufacturerPolicy = asObject(manufacturerPolicy);
  const safeUsedCarShowroom = asObject(usedCarShowroom);

  const showroomSpots = Math.max(1, asNumber(safeFacility.showroomSpots, DEFAULT_FACILITY.showroomSpots));
  const warehouseCapacity = Math.max(1, asNumber(safeFacility.warehouseCapacity, DEFAULT_FACILITY.warehouseCapacity));
  const dayProgress = clamp(asNumber(dayOfMonth, 15), 1, 31);
  const showroomCars = safeInventory.filter(car => car?.location === 'showroom');
  const warehouseCars = safeInventory.filter(car => car?.location !== 'showroom');
  const stockDays = safeInventory.map(getStockDays);
  const maxStockDays = stockDays.length > 0 ? Math.max(...stockDays) : 0;
  const avgStockDays = stockDays.length > 0 ? Math.round(stockDays.reduce((sum, days) => sum + days, 0) / stockDays.length) : 0;
  const inTransitCount = safePendingOrders.reduce((sum, order) => sum + getOrderQuantity(order), 0);
  const arrivalSoonCount = safePendingOrders
    .filter(order => {
      const daysLeft = asNumber(order?.daysLeft ?? order?.remainingDays ?? order?.arrivalInDays, 99);
      return daysLeft <= 3;
    })
    .reduce((sum, order) => sum + getOrderQuantity(order), 0);
  const totalSlots = showroomSpots + warehouseCapacity;
  const totalStockPressure = ratio(safeInventory.length + inTransitCount, totalSlots);
  const modelMix = buildModelMix({ inventory: safeInventory, carModels });

  const showroomScore = clamp(100 - Math.abs(76 - ratio(showroomCars.length, showroomSpots)) - (safeInventory.length + inTransitCount < showroomSpots ? 18 : 0) - (maxStockDays >= 90 ? 18 : maxStockDays >= 60 ? 8 : 0));
  const warehouseScore = clamp(100 - Math.max(0, totalStockPressure - 78) * 1.6 - (avgStockDays >= 60 ? 14 : 0));
  const warehouseTone = warehouseScore >= 80 ? 'good' : warehouseScore >= 58 ? 'warn' : 'danger';

  const techMembers = asArray(safeAfterSales.technicians);
  const serviceMembers = asArray(safeStaff.service?.members);
  const techCapacityPerDay = Math.max(0, techMembers.length * 3);
  const monthlyCapacity = Math.max(1, techCapacityPerDay * dayProgress);
  const afterSalesVisits = asNumber(safeMonthlyStats.afterSalesReturnVisits, 0);
  const afterSalesLoad = ratio(afterSalesVisits, monthlyCapacity);
  const csiScore = asNumber(safeCsi.score ?? safeMonthlyStats.csiScore, DEFAULT_MONTHLY_STATS.csiScore);
  const complaintCount = asNumber(safeCsi.complaints ?? safeAfterSales.complaints, 0);
  const afterSalesScore = clamp(100 - Math.max(0, afterSalesLoad - 82) * 1.2 - Math.max(0, 90 - csiScore) * 2 - complaintCount * 8);

  const stockUsedCars = safeUsedCars.filter(car => !car?.status || car.status === 'stock');
  const preppedUsedCars = stockUsedCars.filter(car => car?.prepped);
  const usedCapacity = asNumber(safeUsedCarShowroom.capacity, Math.max(4, stockUsedCars.length));
  const usedCarPressure = ratio(stockUsedCars.length, Math.max(1, usedCapacity));
  const usedCarScore = clamp(100 - Math.max(0, usedCarPressure - 85) * 1.3 - (stockUsedCars.length - preppedUsedCars.length) * 8);

  const creditLimit = asNumber(safeFinance.creditLimit, 0);
  const loan = asNumber(safeFinance.loan, 0);
  const cash = asNumber(safeFinance.cash, 0);
  const loanUtilization = creditLimit > 0 ? ratio(loan, creditLimit) : 0;
  const investorScore = asNumber(safeInvestorRelations.trust ?? safeMonthlyStats.lastInvestorScore, 72);
  const salesTarget = Math.max(1, asNumber(safeMonthlyStats.target, DEFAULT_MONTHLY_STATS.target));
  const salesPace = ratio(safeMonthlyStats.sales, salesTarget * (dayProgress / 30));
  const manufacturerPressure = clamp(100 - salesPace + (safeManufacturerPolicy.orderRestrictionUntil ? 18 : 0));
  const cashPressure = cash < 0 ? 100 : cash < 300000 ? 84 : cash < 800000 ? 58 : 28;
  const officeScore = clamp(100 - (loanUtilization * 0.28) - Math.max(0, 70 - investorScore) * 0.75 - manufacturerPressure * 0.2 - cashPressure * 0.25);

  const teamLanes = ['sales', 'afterSales', 'market', 'finance'].map(key => buildTeamLane({
    key,
    staff: safeStaff,
    afterSales: safeAfterSales,
    finance: safeFinance,
    monthlyStats: safeMonthlyStats,
  }));
  const teamScore = clamp(100 - Math.round(teamLanes.reduce((sum, team) => sum + team.pressure, 0) / teamLanes.length) * 0.55);

  const competitorItems = Array.isArray(competitors)
    ? competitors
    : Object.values(asObject(competitors));
  const competitorPressure = competitorItems.reduce((max, item) => Math.max(max, asNumber(item?.pressure ?? item?.pricePressure ?? item?.aggression, 0)), 0);

  const warningItems = [
    safeInventory.length + inTransitCount < showroomSpots ? '新车库存低于展厅基础陈列，销售接待会显得空。' : null,
    totalStockPressure >= 92 ? '含在途库存已接近总库位上限，需准备调拨或批售。' : null,
    maxStockDays >= 90 ? `最长库龄 ${maxStockDays} 天，积压风险进入红区。` : null,
    csiScore < 85 ? `CSI ${Math.round(csiScore)} 分，客诉会压低返利与售后回厂。` : null,
    loanUtilization >= 85 ? `银行授信使用 ${loanUtilization}%，抽贷压力升高。` : null,
    investorScore < 60 ? '投资人信任偏低，月底评价存在授权收紧风险。' : null,
    manufacturerPressure >= 74 ? '厂家目标进度偏慢，商务政策压力升高。' : null,
    competitorPressure >= 70 ? '同城竞品动作偏强，前台价格和线索转化承压。' : null,
  ].filter(Boolean);

  const attentionItems = [...warningItems, ...extractRecentAlerts({ alerts, logs })].slice(0, 7);

  return {
    overview: {
      healthScore: Math.round((showroomScore + warehouseScore + afterSalesScore + usedCarScore + officeScore + teamScore) / 6),
      attentionItems,
    },
    showroom: {
      title: '展厅',
      status: summarizeZone(showroomScore, '陈列健康', '展位待调', '缺货/积压'),
      score: showroomScore,
      showroomSpots,
      usedSpots: showroomCars.length,
      occupancy: ratio(showroomCars.length, showroomSpots),
      totalInventory: safeInventory.length,
      maxStockDays,
      avgStockDays,
      modelMix,
      slots: Array.from({ length: Math.min(showroomSpots, 12) }, (_, index) => ({
        id: `showroom-${index}`,
        filled: index < showroomCars.length,
        label: showroomCars[index] ? getCarModelLabel(showroomCars[index], new Map(asArray(carModels).map(model => [model.id, model]))) : '空位',
      })),
      hiddenSlotCount: Math.max(0, showroomSpots - 12),
    },
    warehouse: {
      title: '库房',
      status: summarizeZone(warehouseScore, '水位安全', '库位偏紧', '库位高压'),
      tone: warehouseTone,
      score: warehouseScore,
      capacity: warehouseCapacity,
      stock: warehouseCars.length,
      occupancy: ratio(warehouseCars.length, warehouseCapacity),
      totalStockPressure,
      inTransitCount,
      arrivalSoonCount,
      avgStockDays,
    },
    afterSales: {
      title: '售后',
      status: summarizeZone(afterSalesScore, '工位顺畅', '负荷偏高', '客诉高压'),
      score: afterSalesScore,
      techCount: techMembers.length,
      serviceCount: serviceMembers.length,
      techCapacityPerDay,
      afterSalesVisits,
      load: afterSalesLoad,
      csiScore,
      complaintCount,
      profit: asNumber(safeMonthlyStats.afterSalesRevenue, 0) - asNumber(safeMonthlyStats.afterSalesCost, 0),
    },
    usedCar: {
      title: '二手车区',
      status: summarizeZone(usedCarScore, '周转正常', '整备待清', '库存承压'),
      score: usedCarScore,
      stock: stockUsedCars.length,
      prepped: preppedUsedCars.length,
      pendingPrep: Math.max(0, stockUsedCars.length - preppedUsedCars.length),
      capacity: usedCapacity,
      occupancy: usedCarPressure,
      tradeInCount: asNumber(safeMonthlyStats.tradeInCount, 0),
    },
    office: {
      title: '办公室',
      status: summarizeZone(officeScore, '授权稳定', '资金承压', '关系高压'),
      score: officeScore,
      cash,
      loan,
      creditLimit,
      loanUtilization,
      investorScore,
      manufacturerPressure,
      salesPace,
      cashPressure,
    },
    teams: {
      title: '员工动线',
      status: summarizeZone(teamScore, '士气稳定', '团队承压', '流失风险'),
      score: teamScore,
      lanes: teamLanes,
    },
  };
}
