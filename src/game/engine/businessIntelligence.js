import { BI_THRESHOLDS } from '../config/businessIntelligence.js';
import { buildVehicleStructureSnapshot } from './vehicleStructure.js';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const safeNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const ratio = (value, base) => (safeNumber(base) > 0 ? safeNumber(value) / safeNumber(base) : 0);

const getRiskLevel = (value, warning, danger, lowerIsWorse = false) => {
  if (lowerIsWorse) {
    if (value <= danger) return 'danger';
    if (value <= warning) return 'watch';
    return 'healthy';
  }
  if (value >= danger) return 'danger';
  if (value >= warning) return 'watch';
  return 'healthy';
};

const buildAction = (id, title, body, tab, level = 'watch') => ({ id, title, body, tab, level });

export function buildBusinessIntelligenceSnapshot({
  monthlyStats = {},
  finance = {},
  financeSnapshot = {},
  inventory = [],
  pendingOrders = [],
  usedCars = [],
  csi = {},
  customerLifecycle = {},
  customerDeals = [],
  salesOpportunities = {},
  soldVehicles = [],
  carModels = [],
  manufacturerPolicy = {},
  competitors = {},
  marketEnvironment = {},
  activeRegion = {},
  feedback = {},
  dayOfMonth = 1,
  month = 1,
  thresholds = BI_THRESHOLDS,
} = {}) {
  const expectedProgress = clamp(dayOfMonth / 30, 0.08, 1);
  const salesProgress = ratio(monthlyStats.sales, monthlyStats.target);
  const salesPace = expectedProgress > 0 ? salesProgress / expectedProgress : 0;
  const purchaseTarget = manufacturerPolicy.purchaseTarget || {};
  const purchaseProgress = ratio(purchaseTarget.purchasedUnits, purchaseTarget.targetUnits);
  const leadConversion = ratio(monthlyStats.sales, monthlyStats.walkIns);
  const inviteConversion = ratio(monthlyStats.walkIns, monthlyStats.leads);
  const grossProfit = safeNumber(financeSnapshot.gp3);
  const netProfit = safeNumber(financeSnapshot.netProfit);
  const grossRevenue = safeNumber(monthlyStats.revenue) + safeNumber(monthlyStats.derivativeRevenue) + safeNumber(monthlyStats.afterSalesRevenue) + safeNumber(monthlyStats.usedCarRevenue);
  const grossMargin = ratio(grossProfit, grossRevenue);
  const netMargin = ratio(netProfit, grossRevenue);
  const cashCoverageDays = safeNumber(financeSnapshot.cashCoverageDays);
  const debtRatio = safeNumber(financeSnapshot.debtRatio);
  const agedInventoryCount = inventory.filter(car => safeNumber(car.stockDays) >= thresholds.inventoryAgingWarningDays).length;
  const dangerInventoryCount = inventory.filter(car => safeNumber(car.stockDays) >= thresholds.inventoryAgingDangerDays).length;
  const inventoryCount = inventory.length;
  const orderUnits = pendingOrders.reduce((sum, order) => sum + safeNumber(order.quantity), 0);
  const usedCarStock = usedCars.filter(car => car.status === 'stock').length;
  const activeOpportunities = (salesOpportunities.active || []).length;
  const followUps = (customerLifecycle.followUps || []).filter(item => item.status !== 'done').length;
  const csiScore = safeNumber(csi.score || monthlyStats.csiScore || 0);
  const priceWarActive = Boolean(competitors.priceWarActive);
  const vehicleStructure = buildVehicleStructureSnapshot({
    inventory,
    pendingOrders,
    soldVehicles,
    monthlyStats,
    customerDeals,
    salesOpportunities: salesOpportunities.active || [],
    carModels,
    financeSnapshot,
    activeRegion,
    marketEnvironment,
    competitors,
  });

  const riskItems = [
    {
      id: 'sales_pace',
      label: '销量节奏',
      value: `${Math.round(salesProgress * 100)}%`,
      level: getRiskLevel(salesPace, thresholds.salesPaceWarning, thresholds.salesPaceDanger, true),
      detail: `按 D${dayOfMonth} 进度应完成约 ${Math.round(expectedProgress * 100)}%，当前节奏为 ${Math.round(salesPace * 100)}%。`,
    },
    {
      id: 'cash',
      label: '现金覆盖',
      value: `${cashCoverageDays}天`,
      level: getRiskLevel(cashCoverageDays, thresholds.cashCoverageWarningDays, thresholds.cashCoverageDangerDays, true),
      detail: `现金 ${safeNumber(finance.cash).toLocaleString()}，负债 ${safeNumber(finance.loan).toLocaleString()}。`,
    },
    {
      id: 'debt',
      label: '杠杆风险',
      value: `${Math.round(debtRatio * 100)}%`,
      level: getRiskLevel(debtRatio, thresholds.debtRatioWarning, thresholds.debtRatioDanger),
      detail: `资产负债率越高，银行和投资人越容易收紧授权。`,
    },
    {
      id: 'inventory',
      label: '库存库龄',
      value: `${agedInventoryCount}/${inventoryCount}`,
      level: dangerInventoryCount > 0 ? 'danger' : agedInventoryCount > 0 ? 'watch' : 'healthy',
      detail: `${agedInventoryCount} 台超过 ${thresholds.inventoryAgingWarningDays} 天，${dangerInventoryCount} 台超过 ${thresholds.inventoryAgingDangerDays} 天。`,
    },
    {
      id: 'csi',
      label: 'CSI口碑',
      value: `${Math.round(csiScore)}分`,
      level: getRiskLevel(csiScore, thresholds.csiWarning, thresholds.csiDanger, true),
      detail: `${safeNumber(csi.complaints)} 个投诉会影响厂家和投资人评价。`,
    },
    {
      id: 'factory',
      label: '厂家采购',
      value: `${purchaseTarget.purchasedUnits || 0}/${purchaseTarget.targetUnits || 0}`,
      level: purchaseTarget.targetUnits > 0 && purchaseProgress < thresholds.purchaseTargetWarning && dayOfMonth >= 20 ? 'watch' : 'healthy',
      detail: `区域采购目标进度 ${Math.round(purchaseProgress * 100)}%，销量目标进度 ${Math.round(salesProgress * 100)}%。`,
    },
  ];

  const actions = [];
  if (salesPace < thresholds.salesPaceWarning) {
    actions.push(buildAction('sales_pace', '补销售节奏', '优先处理机会池、客户谈判和展厅布展，别等月底再靠虚出救场。', 'opportunities', salesPace < thresholds.salesPaceDanger ? 'danger' : 'watch'));
  }
  if (cashCoverageDays < thresholds.cashCoverageWarningDays) {
    actions.push(buildAction('cash', '稳现金流', '压缩订车和营销支出，检查汇票到期与贷款占用，必要时去总经理办公室处理授权。', 'reports', cashCoverageDays < thresholds.cashCoverageDangerDays ? 'danger' : 'watch'));
  }
  if (agedInventoryCount > 0) {
    actions.push(buildAction('inventory', '清长库龄库存', '长库龄会拖累ROA和厂家评价，建议调价、补贴或批售。', 'showroom', dangerInventoryCount > 0 ? 'danger' : 'watch'));
  }
  if (leadConversion < thresholds.conversionWarning && monthlyStats.walkIns >= 5) {
    actions.push(buildAction('conversion', '复盘转化漏斗', '到店转成交偏低，优先检查销售接待、报价和金融方案。', 'marketing', leadConversion < thresholds.conversionDanger ? 'danger' : 'watch'));
  }
  if (csiScore < thresholds.csiWarning || safeNumber(csi.complaints) > 0) {
    actions.push(buildAction('csi', '修复CSI', '投诉和低CSI会压返利系数，也会拖累投资人评价。', 'csi', csiScore < thresholds.csiDanger ? 'danger' : 'watch'));
  }
  if (purchaseTarget.targetUnits > 0 && purchaseProgress < thresholds.purchaseTargetWarning && dayOfMonth >= 20) {
    actions.push(buildAction('purchase_target', '评估厂家采购目标', '若现金允许，可在厂家订货补采购进度；现金紧张时别为了奖励盲目超采。', 'order'));
  }
  if (priceWarActive) {
    actions.push(buildAction('market', '应对竞品价格战', '价格战中不要只降价，结合金融、置换和售后权益做反制。', 'market'));
  }
  vehicleStructure.recommendations.forEach(item => {
    actions.push(buildAction(`vehicle_${item.id}`, item.title, item.detail, item.tab, item.level));
  });

  const history = [...(feedback.ratingHistory || [])].slice(-6);
  const trends = {
    netProfit: [...history.map(item => safeNumber(item.netProfit)), netProfit].slice(-6),
    sales: [...history.map(item => safeNumber(item.sales)), safeNumber(monthlyStats.sales)].slice(-6),
    csi: [...history.map(item => safeNumber(item.csiScore)), csiScore].slice(-6),
  };

  return {
    month,
    dayOfMonth,
    headline: actions[0]?.title || '经营节奏正常',
    headlineDetail: actions[0]?.body || '当前没有明显高危项，继续关注销量节奏、现金覆盖和厂家目标。',
    kpis: {
      salesProgress,
      salesPace,
      purchaseProgress,
      leadConversion,
      inviteConversion,
      grossMargin,
      netMargin,
      netProfit,
      grossProfit,
      cashCoverageDays,
      debtRatio,
      inventoryCount,
      agedInventoryCount,
      orderUnits,
      usedCarStock,
      activeOpportunities,
      followUps,
      csiScore,
    },
    funnel: [
      { id: 'leads', label: '线索', value: safeNumber(monthlyStats.leads), rate: 1 },
      { id: 'walkIns', label: '到店', value: safeNumber(monthlyStats.walkIns), rate: inviteConversion },
      { id: 'sales', label: '成交', value: safeNumber(monthlyStats.sales), rate: leadConversion },
      { id: 'afterSales', label: '回厂', value: safeNumber(monthlyStats.afterSalesReturnVisits), rate: ratio(monthlyStats.afterSalesReturnVisits, monthlyStats.sales) },
    ],
    profitMix: [
      { id: 'newCar', label: '新车+返利', value: safeNumber(financeSnapshot.gp2), color: 'bg-blue-500' },
      { id: 'derivative', label: '衍生', value: safeNumber(monthlyStats.derivativeRevenue) - safeNumber(monthlyStats.derivativeCost) + safeNumber(monthlyStats.financeCommission) + safeNumber(monthlyStats.insuranceRenewalRevenue), color: 'bg-emerald-500' },
      { id: 'usedCar', label: '二手车', value: safeNumber(financeSnapshot.usedCarProfit), color: 'bg-violet-500' },
      { id: 'afterSales', label: '售后', value: safeNumber(financeSnapshot.afterSalesProfit), color: 'bg-amber-500' },
      { id: 'opex', label: 'OPEX', value: -safeNumber(financeSnapshot.opex), color: 'bg-red-500' },
    ],
    vehicleStructure,
    riskItems,
    actions: actions.slice(0, 5),
    market: {
      seasonName: marketEnvironment.seasonName || '平季',
      seasonIndex: safeNumber(marketEnvironment.seasonIndex || 1),
      priceWarActive,
    },
    trends,
  };
}
