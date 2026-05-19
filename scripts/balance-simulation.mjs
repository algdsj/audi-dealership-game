import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_FEEDBACK } from '../src/game/config/achievements.js';
import { INVESTOR_PROFILES } from '../src/game/config/investors.js';
import { DEALER_REGIONS, MARKET_SIZE_OPTIONS } from '../src/game/config/market.js';
import { DIFFICULTY_MODES, GAME_SCENARIOS } from '../src/game/config/scenarios.js';
import { CAR_MODELS, INITIAL_MARKET_PRICES } from '../src/game/config/vehicles.js';
import { getConfiguredModelPrice, getDynamicMsrp, getDynamicRebate } from '../src/game/engine/pricing.js';
import { createCompetitorState } from '../src/game/engine/competitorState.js';
import { executeVehicleOrder } from '../src/game/engine/purchaseOrders.js';
import { addMonthsToGameDate } from '../src/game/engine/gameDate.js';
import { autoArrangeShowroom } from '../src/game/engine/inventoryOperations.js';
import { resolveCustomerDeal } from '../src/game/engine/customerDealResolution.js';
import { resolvePriceApproval } from '../src/game/engine/priceApprovalResolution.js';
import { resolveComplaintResolution } from '../src/game/engine/complaintResolution.js';
import { addCustomerRecord, createCustomerRecordFromDeal } from '../src/game/engine/customerLifecycle.js';
import { resolveOperatingEvent } from '../src/game/engine/operatingEvents.js';
import { calculateNetAssets } from '../src/game/engine/scenarioEnding.js';
import { calculateRetailQualityScore, estimateDealAddons as estimateDealAddonsCore, getPriceReality as getPriceRealityCore } from '../src/game/engine/dealEvaluation.js';
import { normalizeLeadChannels, sumLeadChannels } from '../src/game/engine/leads.js';
import { getEffectiveSkill, createStaffMember } from '../src/game/engine/staffing.js';
import { calculateCompanyDailyBurn } from '../src/game/engine/operatingCosts.js';
import { buildFeedbackProgress } from '../src/game/engine/feedbackProgress.js';
import { normalizeFeedbackState } from '../src/game/engine/feedback.js';
import {
  createInitialCsi,
  createInitialCustomerLifecycle,
  createInitialDrafts,
  createInitialFacility,
  createInitialFinance,
  createInitialGmWealth,
  createInitialInsuranceRenewals,
  createInitialInvestorRelations,
  createInitialManufacturerPolicy,
  createInitialMarketEnvironment,
  createInitialMarketing,
  createInitialMonthlyStats,
  createInitialOperatingEvents,
  createInitialSalesOpportunities,
  createInitialStaffStoryMemory,
  createInitialStoryState,
  createInitialStrategy,
  createInitialUsedCarShowroom,
  createInitialVirtualSales,
} from '../src/game/state/initialState.js';
import { runDailyAdvance } from '../src/app/runDailyAdvance.js';

const REPORT_DIR = path.resolve('docs/balance-reports');
const TODAY = process.env.BALANCE_REPORT_DATE || new Date().toISOString().slice(0, 10);
const DEFAULT_SAMPLES = Number(process.env.BALANCE_SAMPLES || 8);
const SCENARIO_IDS = (process.env.BALANCE_SCENARIOS || 'survive6,double12,star12').split(',').filter(Boolean);
const REGION_IDS = (process.env.BALANCE_REGIONS || DEALER_REGIONS.map(item => item.id).join(',')).split(',').filter(Boolean);
const DIFFICULTY_IDS = (process.env.BALANCE_DIFFICULTIES || DIFFICULTY_MODES.map(item => item.id).join(',')).split(',').filter(Boolean);
const INVESTOR_IDS = (process.env.BALANCE_INVESTORS || 'cash_guardian,volume_growth,roi_first,brand_keeper,gambler').split(',').filter(Boolean);

const labelById = (items, id, fallback = id) => items.find(item => item.id === id)?.name || fallback;

const STRATEGIES = {
  conservative: {
    label: '保守现金流',
    inventoryTargetMultiplier: 0.72,
    minInventoryTarget: 7,
    maxOrderQty: 2,
    paymentOrder: ['loan', 'cash', 'draft3'],
    marketingBudget: 1200,
    livestreamBudget: 0,
    dealMode: 'balanced',
    priceMode: 'counter',
    complaintMode: 'care',
    eventRiskOption: 'process_fix',
    eventOpportunityOption: 'focus_team',
    orderCadence: 5,
  },
  balanced: {
    label: '均衡经营',
    inventoryTargetMultiplier: 1.02,
    minInventoryTarget: 10,
    maxOrderQty: 4,
    paymentOrder: ['loan', 'draft3', 'cash'],
    marketingBudget: 2600,
    livestreamBudget: 800,
    dealMode: 'finance',
    priceMode: 'counter',
    complaintMode: 'care',
    eventRiskOption: 'contain_now',
    eventOpportunityOption: 'commit_resources',
    orderCadence: 4,
  },
  aggressive: {
    label: '激进冲量',
    inventoryTargetMultiplier: 1.45,
    minInventoryTarget: 15,
    maxOrderQty: 6,
    paymentOrder: ['loan', 'draft3', 'draft6'],
    marketingBudget: 5200,
    livestreamBudget: 2200,
    dealMode: 'close',
    priceMode: 'requested',
    complaintMode: 'strong',
    eventRiskOption: 'contain_now',
    eventOpportunityOption: 'commit_resources',
    orderCadence: 3,
  },
};

const formatMoney = amount => `¥${Math.round(amount || 0).toLocaleString()}`;

function createSeededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const averageSkill = (type, members = []) => {
  if (!members.length) return 0;
  return Math.round(members.reduce((sum, member) => sum + getEffectiveSkill(type, member), 0) / members.length);
};

function makeSetter(state, key) {
  return valueOrUpdater => {
    state[key] = typeof valueOrUpdater === 'function' ? valueOrUpdater(state[key]) : valueOrUpdater;
  };
}

function appendLedger(state, items, day = state.day) {
  const normalized = Array.isArray(items) ? items : [items];
  if (normalized.length === 0 || normalized.some(item => !item)) return;
  const existing = state.dailyLedger.find(entry => entry.day === day);
  if (existing) existing.items.push(...normalized.filter(Boolean));
  else state.dailyLedger.push({ day, items: normalized.filter(Boolean) });
}

function addLog(state, type, message) {
  state.logs.push({ day: state.day, type, message });
}

function createStaff() {
  return {
    dcc: { members: [createStaffMember('dcc', 30), createStaffMember('dcc', 30)], salary: 150 },
    sales: { members: [createStaffMember('sales', 30), createStaffMember('sales', 30), createStaffMember('sales', 30)], salary: 250 },
    service: { members: [createStaffMember('service', 30)], salary: 180 },
    streamer: { members: [], salary: 220 },
  };
}

function initializeSimulation({ region, difficulty, investor, scenario, strategyId, seedIndex }) {
  const marketSize = MARKET_SIZE_OPTIONS.find(item => item.id === region.marketSizeId) || MARKET_SIZE_OPTIONS[1];
  const finance = createInitialFinance();
  finance.cash = Math.round(3000000 * difficulty.cashMultiplier);
  finance.loan = 0;
  finance.creditLimit = Math.round(10000000 * (region.credit || 1) * difficulty.creditMultiplier);

  const monthlyStats = createInitialMonthlyStats();
  monthlyStats.target = Math.max(8, Math.round(15 * difficulty.targetMultiplier));

  const csi = createInitialCsi();
  csi.score = Math.max(50, Math.min(100, 90 + difficulty.csiBonus));

  const marketPrices = {};
  CAR_MODELS.forEach(car => {
    marketPrices[car.id] = Math.round(INITIAL_MARKET_PRICES[car.id] * (1 + (region.pricePressure || 0)));
  });

  const marketEnvironment = createInitialMarketEnvironment();
  marketEnvironment.history = [{ month: 1, desc: `${region.name}开局` }];

  return {
    activeDifficulty: difficulty,
    activeInvestor: investor,
    activeMarketSize: marketSize,
    activeRegion: region,
    activeScenario: scenario,
    afterSales: { technicians: [createStaffMember('tech', 30), createStaffMember('tech', 30)], salary: 200 },
    approvalCases: [],
    competitors: createCompetitorState({ marketSize }),
    csi,
    customerDeals: [],
    customerLifecycle: createInitialCustomerLifecycle(),
    dailyLedger: [],
    dailyStats: { newLeads: 0, walkIns: 0, sales: 0 },
    day: 1,
    dealerRegionId: region.id,
    difficultyMode: difficulty.id,
    drafts: createInitialDrafts(),
    endingModalDismissed: true,
    endingSummary: null,
    facility: createInitialFacility(),
    feedback: DEFAULT_FEEDBACK,
    finance,
    gameState: 'playing',
    gmWealth: createInitialGmWealth(),
    inboxFilter: 'all',
    insuranceRenewals: createInitialInsuranceRenewals(),
    inventory: [],
    investorProfileId: investor.id,
    investorRelations: createInitialInvestorRelations(),
    isAdvancingDay: false,
    isFreeScenario: scenario.months === 0,
    logs: [{ day: 1, type: 'info', message: `balance simulation ${strategyId} seed ${seedIndex}` }],
    managerInbox: [],
    manufacturerPolicy: createInitialManufacturerPolicy(),
    marketEnvironment,
    marketPrices,
    marketing: createInitialMarketing(),
    modelPriceOverrides: {},
    monthlyStats,
    monthlySummaryModal: null,
    operatingEvents: createInitialOperatingEvents(),
    pendingOrders: [],
    salesOpportunities: createInitialSalesOpportunities(),
    scenarioDurationDays: scenario.months > 0 ? scenario.months * 30 : 360,
    scenarioId: scenario.id,
    soldVehicles: [],
    staff: createStaff(),
    staffStoryMemory: createInitialStaffStoryMemory(),
    storyState: createInitialStoryState(),
    strategy: createInitialStrategy(),
    testDriveCars: [],
    tutorial: { enabled: false, dismissed: true },
    usedCars: [],
    usedCarShowroom: createInitialUsedCarShowroom(),
    virtualSales: createInitialVirtualSales(),
    simulationMetrics: {
      minCash: finance.cash,
      maxCreditUsage: 0,
      minTrust: 72,
      minCsi: csi.score,
      maxInventoryAndTransit: 0,
      monthEndCount: 0,
    },
  };
}

function buildDerived(state) {
  const getDynamicMsrpForState = modelId => getDynamicMsrp({
    modelId,
    carModels: CAR_MODELS,
    manufacturerPolicy: state.manufacturerPolicy,
  });
  const getDynamicRebateForState = modelId => getDynamicRebate({
    modelId,
    carModels: CAR_MODELS,
    manufacturerPolicy: state.manufacturerPolicy,
  });
  const getConfiguredModelPriceForState = modelId => getConfiguredModelPrice({
    modelId,
    carModels: CAR_MODELS,
    manufacturerPolicy: state.manufacturerPolicy,
    modelPriceOverrides: state.modelPriceOverrides,
  });
  const salesAvgSkill = averageSkill('sales', state.staff.sales.members);
  const leadChannels = normalizeLeadChannels(state.marketing);
  const estimateDealAddons = (modelId, finalPrice) => estimateDealAddonsCore({
    modelId,
    finalPrice,
    carModels: CAR_MODELS,
    getDynamicMsrp: getDynamicMsrpForState,
    getDynamicRebate: getDynamicRebateForState,
  });
  const getRetailQualityScore = () => calculateRetailQualityScore({
    salesAvgSkill,
    csiScore: state.csi.score,
    salesMembers: state.staff.sales.members,
  });
  const getPriceReality = (offerPrice, referencePrice, options = {}) => getPriceRealityCore({
    offerPrice,
    referencePrice,
    qualityScore: options.qualityScore ?? getRetailQualityScore(),
    financeIntent: options.financeIntent,
    mode: options.mode,
  });
  const getActiveCountermeasureValue = (type, competitorState = state.competitors) => (competitorState.playerCountermeasures || [])
    .filter(item => item.type === type && item.remainingDays > 0)
    .reduce((sum, item) => sum + (item.effectValue || 0), 0);
  const getCompetitorPressure = (competitorState = state.competitors) => {
    const stores = competitorState.stores || [];
    const activeThreat = stores.reduce((sum, store) => {
      const activityBoost = store.currentActivity ? (store.currentActivity.pullBoost || 0) : 0;
      const priceBoost = Math.max(0, (1 - (store.priceIndex || 1)) * 180);
      const localMult = store.brand === 'audi_local' ? 1.35 : 1;
      return sum + ((store.customerPull || 50) + activityBoost + priceBoost) * localMult;
    }, 0);
    const serviceShield = getActiveCountermeasureValue('service', competitorState);
    const referralShield = getActiveCountermeasureValue('referral', competitorState);
    const csiShield = getActiveCountermeasureValue('csi_push', competitorState);
    const cooperationShield = stores.some(store => store.brand === 'audi_local' && store.cooperation?.remainingDays > 0) ? 0.12 : 0;
    const warPressure = competitorState.priceWarActive ? 0.08 : 0;
    const pressure = Math.min(0.36, (activeThreat / Math.max(1, (competitorState.totalMarketSize || 200) * 145)) + warPressure);
    return Math.max(0, pressure - serviceShield - referralShield - csiShield - cooperationShield);
  };

  const netAssets = calculateNetAssets({
    finance: state.finance,
    inventory: state.inventory,
    usedCars: state.usedCars,
    carModels: CAR_MODELS,
    usedCarShowroom: state.usedCarShowroom,
    drafts: state.drafts,
    gmWealth: state.gmWealth,
  }).netAssets;

  return {
    carModels: CAR_MODELS,
    convertRateVal: state.monthlyStats.walkIns > 0 ? state.monthlyStats.sales / state.monthlyStats.walkIns : 0,
    dccAvgSkill: averageSkill('dcc', state.staff.dcc.members),
    dccCount: state.staff.dcc.members.length,
    dayOfMonth: ((state.day - 1) % 30) + 1,
    estimateDealAddons,
    getActiveCountermeasureValue,
    getCompanyDailyBurn: () => calculateCompanyDailyBurn({
      facility: state.facility,
      staff: state.staff,
      afterSales: state.afterSales,
      marketing: state.marketing,
      finance: state.finance,
      inventory: state.inventory,
    }),
    getCompetitorPressure,
    getConfiguredModelPrice: getConfiguredModelPriceForState,
    getDraftFeeRate: term => {
      const reputation = state.drafts.bankReputation ?? 70;
      if (term === 6) return 0.008;
      if (reputation >= 80) return 0.004;
      if (reputation >= 60) return 0.005;
      if (reputation >= 40) return 0.008;
      return 0.01;
    },
    getDynamicMsrp: getDynamicMsrpForState,
    getDynamicRebate: getDynamicRebateForState,
    getPriceReality,
    getRetailQualityScore,
    leadChannels,
    month: Math.floor((state.day - 1) / 30) + 1,
    netProfit: state.monthlyStats.revenue - state.monthlyStats.cogs - state.monthlyStats.rent - state.monthlyStats.labor - state.monthlyStats.marketingCost - state.monthlyStats.financeCost,
    ownerEquity: netAssets,
    salesAvgSkill,
    salesCount: state.staff.sales.members.length,
    serviceAvgSkill: averageSkill('service', state.staff.service.members),
    serviceCount: state.staff.service.members.length,
    streamerAvgSkill: averageSkill('streamer', state.staff.streamer.members),
    streamerCount: state.staff.streamer.members.length,
    techAvgSkill: averageSkill('tech', state.afterSales.technicians),
    techCount: state.afterSales.technicians.length,
    totalLeadPool: sumLeadChannels(leadChannels),
  };
}

function createCustomerDealCaseForState(state, derived, { channelId = 'showroom', segment = null, sourceDay = state.day, stockList = state.inventory } = {}) {
  const { createCustomerDealCase } = awaitImportCaseFactories;
  return createCustomerDealCase({
    channelId,
    segment,
    sourceDay,
    stockList,
    carModels: CAR_MODELS,
    marketPrices: state.marketPrices,
    activeRegion: state.activeRegion,
    salesAvgSkill: derived.salesAvgSkill,
    csiScore: state.csi.score,
    getRetailQualityScore: derived.getRetailQualityScore,
    getPriceReality: derived.getPriceReality,
    estimateDealAddons: derived.estimateDealAddons,
  });
}

let awaitImportCaseFactories;

async function loadCaseFactories() {
  awaitImportCaseFactories = await import('../src/game/engine/caseFactories.js');
}

function resolvePendingCases(state, strategy) {
  const derived = buildDerived(state);
  const nextApprovalCases = [];
  for (const item of state.approvalCases) {
    if (item.type === 'price') {
      const result = resolvePriceApproval({
        item,
        mode: strategy.priceMode,
        inventory: state.inventory,
        carModels: CAR_MODELS,
        finance: state.finance,
        monthlyStats: state.monthlyStats,
        dailyStats: state.dailyStats,
        soldVehicles: state.soldVehicles,
        currentDay: state.day,
        getPriceReality: derived.getPriceReality,
        estimateDealAddons: derived.estimateDealAddons,
        formatMoney,
      });
      if (result.inventory) state.inventory = result.inventory;
      if (result.finance) state.finance = result.finance;
      if (result.monthlyStats) state.monthlyStats = result.monthlyStats;
      if (result.dailyStats) state.dailyStats = result.dailyStats;
      if (result.soldVehicles) state.soldVehicles = result.soldVehicles;
      if (result.ledgerItems) appendLedger(state, result.ledgerItems);
      if (!['rejected', 'lost', 'sold', 'invalid'].includes(result.status)) nextApprovalCases.push(item);
      continue;
    }
    if (item.type === 'complaint') {
      const result = resolveComplaintResolution({
        item,
        mode: strategy.complaintMode,
        finance: state.finance,
        csi: state.csi,
        formatMoney,
      });
      if (result.alert) {
        nextApprovalCases.push(item);
        continue;
      }
      if (result.finance) state.finance = result.finance;
      if (result.csi) state.csi = result.csi;
      if (result.ledgerItem) appendLedger(state, result.ledgerItem);
      continue;
    }
    nextApprovalCases.push(item);
  }
  state.approvalCases = nextApprovalCases;

  const remainingDeals = [];
  for (const item of state.customerDeals) {
    if (item.status !== 'pending') {
      remainingDeals.push(item);
      continue;
    }
    const freshDerived = buildDerived(state);
    const result = resolveCustomerDeal({
      item,
      mode: strategy.dealMode,
      inventory: state.inventory,
      carModels: CAR_MODELS,
      finance: state.finance,
      monthlyStats: state.monthlyStats,
      dailyStats: state.dailyStats,
      soldVehicles: state.soldVehicles,
      usedCars: state.usedCars,
      csi: state.csi,
      currentDay: state.day,
      getPriceReality: freshDerived.getPriceReality,
      estimateDealAddons: freshDerived.estimateDealAddons,
      formatMoney,
    });
    if (result.inventory) state.inventory = result.inventory;
    if (result.finance) state.finance = result.finance;
    if (result.usedCars) state.usedCars = result.usedCars;
    if (result.monthlyStats) state.monthlyStats = result.monthlyStats;
    if (result.dailyStats) state.dailyStats = result.dailyStats;
    if (result.soldVehicles) state.soldVehicles = result.soldVehicles;
    if (result.csi) state.csi = result.csi;
    if (result.ledgerItems) appendLedger(state, result.ledgerItems);
    if (result.crmOutcome && ['rejected', 'lost', 'sold'].includes(result.status)) {
      const record = createCustomerRecordFromDeal({ currentDay: state.day, item, outcome: result.crmOutcome });
      state.customerLifecycle = addCustomerRecord(state.customerLifecycle, record);
    }
    if (!['rejected', 'lost', 'sold', 'invalid'].includes(result.status)) remainingDeals.push(item);
  }
  state.customerDeals = remainingDeals;
}

function resolveOperatingEventsForStrategy(state, strategy) {
  for (const eventInstance of [...(state.operatingEvents.pending || [])]) {
    const optionId = eventInstance.tone === 'opportunity' ? strategy.eventOpportunityOption : strategy.eventRiskOption;
    const result = resolveOperatingEvent({
      activeDifficulty: state.activeDifficulty,
      csi: state.csi,
      eventInstance,
      finance: state.finance,
      formatMoney,
      marketing: state.marketing,
      monthlyStats: state.monthlyStats,
      operatingEvents: state.operatingEvents,
      optionId,
      resolvedDay: state.day,
    });
    if (!result.ok) continue;
    state.finance = result.finance;
    state.marketing = result.marketing;
    state.monthlyStats = result.monthlyStats;
    state.csi = result.csi;
    state.operatingEvents = result.operatingEvents;
    if (result.ledgerItems.length > 0) appendLedger(state, result.ledgerItems);
    state.logs.push(...result.logs);
    state.managerInbox.push(...result.inboxItems);
  }
}

function maintainInventory(state, strategy) {
  const derived = buildDerived(state);
  state.marketing = {
    ...state.marketing,
    budget: strategy.marketingBudget,
    leadPurchaseBudget: strategy.marketingBudget,
    livestreamBudget: strategy.livestreamBudget,
  };

  const arrangement = autoArrangeShowroom({ inventory: state.inventory, facility: state.facility });
  if (arrangement.status === 'arranged') state.inventory = arrangement.inventory;

  const dayOfMonth = derived.dayOfMonth;
  if (dayOfMonth % strategy.orderCadence !== 1) return;
  const stockAndTransit = state.inventory.length + state.pendingOrders.reduce((sum, order) => sum + order.quantity, 0);
  const target = Math.max(strategy.minInventoryTarget, Math.round(state.monthlyStats.target * strategy.inventoryTargetMultiplier));
  const needed = Math.max(0, target - stockAndTransit);
  if (needed <= 0) return;

  const modelOrder = strategy === STRATEGIES.conservative
    ? ['A3_L', 'A3_M', 'A5_L', 'Q5_L', 'A6_L', 'Q6_ETRON_L', 'Q6_ETRON_M', 'A5_M', 'Q5_M', 'A6_M']
    : strategy === STRATEGIES.aggressive
    ? ['A6_H', 'Q5_H', 'Q6_ETRON_H', 'A5_H', 'A6_M', 'Q5_M', 'Q6_ETRON_M', 'A3_H', 'A3_M']
    : ['A6_M', 'Q5_M', 'A5_M', 'Q6_ETRON_M', 'A3_M', 'A6_L', 'Q5_L', 'A5_L', 'Q6_ETRON_L', 'A3_L'];

  const modelId = modelOrder[(Math.floor(state.day / strategy.orderCadence)) % modelOrder.length];
  const model = CAR_MODELS.find(item => item.id === modelId) || CAR_MODELS[0];
  const quantity = Math.min(strategy.maxOrderQty, needed);

  for (const paymentMethod of strategy.paymentOrder) {
    const result = executeVehicleOrder({
      orderForm: { isOpen: true, model, quantity, color: '黑', paymentMethod },
      investorRelations: state.investorRelations,
      currentDay: state.day,
      facility: state.facility,
      inventory: state.inventory,
      pendingOrders: state.pendingOrders,
      finance: state.finance,
      drafts: state.drafts,
      monthlyStats: state.monthlyStats,
      month: derived.month,
      dayOfMonth,
      marketEnvironment: state.marketEnvironment,
      getDraftFeeRate: derived.getDraftFeeRate,
      addMonthsToGameDate,
      formatMoney,
    });
    if (result.status !== 'settled') continue;
    state.finance = result.finance;
    state.drafts = result.drafts;
    state.monthlyStats = result.monthlyStats;
    state.pendingOrders = result.pendingOrders;
    appendLedger(state, result.ledgerItem);
    addLog(state, result.log.type, result.log.message);
    break;
  }
}

function buildRunContext(state) {
  const derived = buildDerived(state);
  const setters = [
    'afterSales', 'approvalCases', 'competitors', 'csi', 'customerLifecycle', 'customerDeals',
    'dailyLedger', 'dailyStats', 'day', 'drafts', 'endingSummary', 'feedback', 'finance',
    'gameState', 'gmWealth', 'insuranceRenewals', 'inventory', 'investorRelations',
    'isAdvancingDay', 'logs', 'managerInbox', 'manufacturerPolicy', 'marketEnvironment',
    'marketing', 'marketPrices', 'monthlyStats', 'operatingEvents', 'salesOpportunities', 'monthlySummaryModal',
    'pendingOrders', 'soldVehicles', 'storyState', 'staffStoryMemory', 'staff', 'usedCars',
    'virtualSales',
  ].reduce((acc, key) => {
    const name = `set${key[0].toUpperCase()}${key.slice(1)}`;
    acc[name] = makeSetter(state, key);
    return acc;
  }, {});

  const buildFeedbackState = ({ currentFeedback = state.feedback, monthlyReport = null, context = {} }) => {
    const normalized = normalizeFeedbackState(currentFeedback);
    const achievementContext = {
      totalSold: context.totalSold ?? state.soldVehicles.length,
      csiScore: context.csiScore ?? state.csi.score,
      cash: context.cash ?? state.finance.cash,
      usedCarCount: context.usedCarCount ?? state.usedCars.length,
      lastReport: monthlyReport || normalized.lastMonthReport,
      lastInvestorScore: monthlyReport?.investorScore ?? state.investorRelations.lastScore,
      personalAccount: state.gmWealth.personalAccount || 0,
      monthlySalary: state.gmWealth.monthlySalary || 0,
      totalBailout: state.gmWealth.totalBailout || 0,
      bailoutCount: (state.gmWealth.bailoutHistory || []).length,
      activeDraftCount: (state.drafts.activeDrafts || []).filter(draft => draft.status === 'active').length,
      overdueDraftCount: (state.drafts.activeDrafts || []).filter(draft => draft.status === 'defaulted').length,
      bankReputation: state.drafts.bankReputation ?? 70,
      totalDraftsDefaulted: state.drafts.totalDraftsDefaulted || 0,
    };
    return buildFeedbackProgress({ currentFeedback: normalized, monthlyReport, achievementContext });
  };

  return {
    ...state,
    ...derived,
    ...setters,
    buildFeedbackState,
    formatMoney,
    createComplaintCase: source => awaitImportCaseFactories.createComplaintCase({ source, day: state.day }),
    createCustomerDealCase: options => createCustomerDealCaseForState(state, derived, options),
    createPriceApprovalCase: (car, modelDef, finalConv) => awaitImportCaseFactories.createPriceApprovalCase({
      car,
      modelDef,
      finalConv,
      day: state.day,
      marketPrices: state.marketPrices,
      estimateDealAddons: derived.estimateDealAddons,
    }),
    getSaveSlots: () => ({ version: 1, slots: {} }),
    setEndingModalDismissed: valueOrUpdater => {
      state.endingModalDismissed = typeof valueOrUpdater === 'function' ? valueOrUpdater(state.endingModalDismissed) : valueOrUpdater;
    },
    setMonthlySummaryModal: makeSetter(state, 'monthlySummaryModal'),
    setTestDriveCars: makeSetter(state, 'testDriveCars'),
  };
}

function collectSnapshot(state) {
  const assets = calculateNetAssets({
    finance: state.finance,
    inventory: state.inventory,
    usedCars: state.usedCars,
    carModels: CAR_MODELS,
    usedCarShowroom: state.usedCarShowroom,
    drafts: state.drafts,
    gmWealth: state.gmWealth,
  });
  return {
    day: state.day,
    gameState: state.gameState,
    cash: state.finance.cash,
    loan: state.finance.loan,
    creditLimit: state.finance.creditLimit,
    creditUsage: state.finance.creditLimit > 0 ? state.finance.loan / state.finance.creditLimit : 0,
    maxCreditUsage: state.simulationMetrics?.maxCreditUsage ?? 0,
    minCash: state.simulationMetrics?.minCash ?? state.finance.cash,
    minTrust: state.simulationMetrics?.minTrust ?? state.investorRelations.trust,
    minCsi: state.simulationMetrics?.minCsi ?? state.csi.score,
    maxInventoryAndTransit: state.simulationMetrics?.maxInventoryAndTransit ?? state.inventory.length,
    monthEndCount: state.simulationMetrics?.monthEndCount ?? 0,
    netAssets: assets.netAssets,
    inventory: state.inventory.length,
    pendingOrders: state.pendingOrders.reduce((sum, order) => sum + order.quantity, 0),
    soldVehicles: state.soldVehicles.length,
    csi: state.csi.score,
    trust: state.investorRelations.trust,
    badReviews: state.investorRelations.badReviews,
    defaultedDrafts: (state.drafts.activeDrafts || []).filter(draft => draft.status === 'defaulted').length,
    endingRank: state.endingSummary?.rank || '',
  };
}

function updateSimulationMetrics(state) {
  const metrics = state.simulationMetrics;
  if (!metrics) return;
  const pendingUnits = state.pendingOrders.reduce((sum, order) => sum + order.quantity, 0);
  const creditUsage = state.finance.creditLimit > 0 ? state.finance.loan / state.finance.creditLimit : 0;
  metrics.minCash = Math.min(metrics.minCash, state.finance.cash);
  metrics.maxCreditUsage = Math.max(metrics.maxCreditUsage, creditUsage);
  metrics.minTrust = Math.min(metrics.minTrust, state.investorRelations.trust);
  metrics.minCsi = Math.min(metrics.minCsi, state.csi.score);
  metrics.maxInventoryAndTransit = Math.max(metrics.maxInventoryAndTransit, state.inventory.length + pendingUnits);
  if (((state.day - 1) % 30) + 1 === 1 && state.day > 1) metrics.monthEndCount += 1;
}

async function runOneSimulation({ region, difficulty, investor, scenario, strategyId, seedIndex }) {
  const strategy = STRATEGIES[strategyId];
  const rng = createSeededRandom(`${region.id}:${difficulty.id}:${investor.id}:${scenario.id}:${strategyId}:${seedIndex}`);
  const originalRandom = Math.random;
  Math.random = rng;
  try {
    const state = initializeSimulation({ region, difficulty, investor, scenario, strategyId, seedIndex });
    const maxDays = scenario.months > 0 ? scenario.months * 30 + 5 : 365;
    while (state.gameState === 'playing' && state.day < maxDays) {
      resolvePendingCases(state, strategy);
      resolveOperatingEventsForStrategy(state, strategy);
      maintainInventory(state, strategy);
      const context = buildRunContext(state);
      runDailyAdvance(context);
      updateSimulationMetrics(state);
    }
    const snapshot = collectSnapshot(state);
    return {
      region: region.id,
      difficulty: difficulty.id,
      investor: investor.id,
      scenario: scenario.id,
      strategy: strategyId,
      seed: seedIndex,
      ...snapshot,
      bankruptcy: state.gameState === 'bankrupt',
      dismissed: state.gameState === 'dismissed',
      won: state.gameState === 'won',
      months: Math.floor((state.day - 1) / 30) + 1,
    };
  } finally {
    Math.random = originalRandom;
  }
}

const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const pct = (count, total) => total ? count / total : 0;

function summarize(results) {
  const groups = new Map();
  for (const row of results) {
    const key = [row.region, row.difficulty, row.scenario, row.strategy].join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, rows]) => {
    const [region, difficulty, scenario, strategy] = key.split('|');
    return {
      region,
      difficulty,
      scenario,
      strategy,
      samples: rows.length,
      winRate: pct(rows.filter(row => row.won).length, rows.length),
      bankruptcyRate: pct(rows.filter(row => row.bankruptcy).length, rows.length),
      dismissalRate: pct(rows.filter(row => row.dismissed).length, rows.length),
      avgNetAssets: mean(rows.map(row => row.netAssets)),
      avgCash: mean(rows.map(row => row.cash)),
      avgLoan: mean(rows.map(row => row.loan)),
      avgCreditUsage: mean(rows.map(row => row.creditUsage)),
      avgMaxCreditUsage: mean(rows.map(row => row.maxCreditUsage)),
      avgMinCash: mean(rows.map(row => row.minCash)),
      avgMinTrust: mean(rows.map(row => row.minTrust)),
      avgMinCsi: mean(rows.map(row => row.minCsi)),
      avgMaxInventoryAndTransit: mean(rows.map(row => row.maxInventoryAndTransit)),
      avgSales: mean(rows.map(row => row.soldVehicles)),
      avgInventory: mean(rows.map(row => row.inventory)),
      avgCsi: mean(rows.map(row => row.csi)),
      avgTrust: mean(rows.map(row => row.trust)),
    };
  }).sort((a, b) => (
    a.scenario.localeCompare(b.scenario)
    || a.difficulty.localeCompare(b.difficulty)
    || a.region.localeCompare(b.region)
    || a.strategy.localeCompare(b.strategy)
  ));
}

const money = value => `¥${Math.round(value).toLocaleString()}`;
const percent = value => `${Math.round(value * 100)}%`;
const oneDecimal = value => Number.isFinite(value) ? value.toFixed(1) : '0.0';

function summarizeBy(rawRows, keyName) {
  const ids = [...new Set(rawRows.map(row => row[keyName]))].sort();
  return ids.map(id => {
    const rows = rawRows.filter(row => row[keyName] === id);
    return {
      id,
      samples: rows.length,
      winRate: pct(rows.filter(row => row.won).length, rows.length),
      bankruptcyRate: pct(rows.filter(row => row.bankruptcy).length, rows.length),
      dismissalRate: pct(rows.filter(row => row.dismissed).length, rows.length),
      avgNetAssets: mean(rows.map(row => row.netAssets)),
      avgSales: mean(rows.map(row => row.soldVehicles)),
      avgMinCash: mean(rows.map(row => row.minCash)),
      avgMaxCreditUsage: mean(rows.map(row => row.maxCreditUsage)),
      avgMinTrust: mean(rows.map(row => row.minTrust)),
      avgMinCsi: mean(rows.map(row => row.minCsi)),
    };
  });
}

function buildBalanceFindings({ byDifficulty, byScenario, byStrategy, summaryRows }) {
  const findings = [];
  const rookie = byDifficulty.find(row => row.difficulty === 'rookie');
  const standard = byDifficulty.find(row => row.difficulty === 'standard');
  const hardcore = byDifficulty.find(row => row.difficulty === 'hardcore');
  if (rookie && standard && rookie.bankruptcyRate > standard.bankruptcyRate + 0.03) {
    findings.push('新手难度破产率高于标准难度，说明现金、授信、任务或事件容错需要回看。');
  }
  if (hardcore && standard && hardcore.winRate > standard.winRate + 0.12) {
    findings.push('硬核难度胜率明显高于标准难度，难度梯度可能被策略或区域收益抵消。');
  }
  if (hardcore && hardcore.bankruptcyRate >= 0.35) {
    findings.push('硬核难度破产率较高，注意不要让现金流、厂家任务和投资人差评形成无法挽回的连环惩罚。');
  }

  byScenario
    .filter(row => row.winRate <= 0.35 || row.bankruptcyRate >= 0.3)
    .forEach(row => {
      findings.push(`${labelById(GAME_SCENARIOS, row.id)} 胜率/破产率偏紧，适合检查剧本目标、月评阈值和厂家目标叠加压力。`);
    });

  const strategyRank = [...byStrategy].sort((a, b) => b.winRate - a.winRate);
  if (strategyRank.length >= 2 && strategyRank[0].winRate - strategyRank[1].winRate >= 0.18) {
    findings.push(`${STRATEGIES[strategyRank[0].id].label} 胜率显著领先，可能存在单一最优打法，需要回看资金成本、营销 ROI 或成交策略收益。`);
  }
  const conservative = byStrategy.find(row => row.id === 'conservative');
  const balanced = byStrategy.find(row => row.id === 'balanced');
  const aggressive = byStrategy.find(row => row.id === 'aggressive');
  if (conservative && balanced && conservative.avgSales < balanced.avgSales * 0.4) {
    findings.push('保守现金流几乎不破产，但销量显著不足，说明它更像“苟活策略”，不应该被设计成长期达成 12 个月目标的主路。');
  }
  if (aggressive && balanced && aggressive.bankruptcyRate >= balanced.bankruptcyRate + 0.05) {
    findings.push('激进冲量能换取销量和净资产上限，但破产率明显抬升，当前风险收益关系基本成立。');
  }

  const cashCrush = summaryRows
    .filter(row => row.avgMinCash < -500000 || row.avgMaxCreditUsage >= 0.95)
    .slice(0, 3);
  cashCrush.forEach(row => {
    findings.push(`${labelById(DEALER_REGIONS, row.region)} / ${labelById(DIFFICULTY_MODES, row.difficulty)} / ${labelById(GAME_SCENARIOS, row.scenario)} 在 ${STRATEGIES[row.strategy].label} 下现金或授信压力过高。`);
  });

  return findings.length > 0 ? findings : ['未发现明显数值断层；下一轮可扩大样本并加入人工策略回放验证。'];
}

function buildMarkdown(summaryRows, rawRows) {
  const all = summaryRows;
  const byDifficulty = DIFFICULTY_IDS.map(id => {
    const rows = rawRows.filter(row => row.difficulty === id);
    return {
      difficulty: id,
      samples: rows.length,
      winRate: pct(rows.filter(row => row.won).length, rows.length),
      bankruptcyRate: pct(rows.filter(row => row.bankruptcy).length, rows.length),
      avgNetAssets: mean(rows.map(row => row.netAssets)),
      avgSales: mean(rows.map(row => row.soldVehicles)),
      avgCsi: mean(rows.map(row => row.csi)),
    };
  });
  const byScenario = summarizeBy(rawRows, 'scenario');
  const byInvestor = summarizeBy(rawRows, 'investor');
  const byStrategy = Object.keys(STRATEGIES).map(id => {
    const rows = rawRows.filter(row => row.strategy === id);
    return {
      id,
      strategy: id,
      samples: rows.length,
      winRate: pct(rows.filter(row => row.won).length, rows.length),
      bankruptcyRate: pct(rows.filter(row => row.bankruptcy).length, rows.length),
      avgNetAssets: mean(rows.map(row => row.netAssets)),
      avgSales: mean(rows.map(row => row.soldVehicles)),
      avgMinCash: mean(rows.map(row => row.minCash)),
      avgMaxCreditUsage: mean(rows.map(row => row.maxCreditUsage)),
    };
  });
  const findings = buildBalanceFindings({ byDifficulty, byScenario, byStrategy, summaryRows });
  const risky = all
    .filter(row => row.bankruptcyRate >= 0.5 || row.winRate <= 0.1 || row.avgMaxCreditUsage >= 0.9 || row.avgMinCash < -500000)
    .sort((a, b) => b.bankruptcyRate - a.bankruptcyRate || b.avgMaxCreditUsage - a.avgMaxCreditUsage || a.winRate - b.winRate)
    .slice(0, 20);
  const outliers = [...rawRows]
    .sort((a, b) => a.netAssets - b.netAssets)
    .slice(0, 10);

  const lines = [];
  lines.push('# 奥迪 4S 店经营模拟数据平衡测试报告');
  lines.push('');
  lines.push(`测试日期：${TODAY}`);
  lines.push(`样本：${rawRows.length} 局，按区域 × 难度 × 投资人 × 剧本 × 策略 × seed 批量模拟。`);
  lines.push('');
  lines.push('## 测试方法');
  lines.push('');
  lines.push('- 使用现有 `runDailyAdvance` 日结主循环和 `game/engine` 纯函数。');
  lines.push('- 自动玩家策略包含保守现金流、均衡经营、激进冲量三类。');
  lines.push('- 自动玩家会维护库存、布展、处理价格审批、重点客户、投诉和经营事件。');
  lines.push('- 报告同时记录过程风险：最低现金、最高授信占用、最低投资人信任、最低 CSI 和峰值库存/在途。');
  lines.push('- 本轮重点看宏观平衡，不等同于真人最优策略或完整经济学求解。');
  lines.push('');
  lines.push('## 诊断结论');
  lines.push('');
  findings.forEach(item => lines.push(`- ${item}`));
  lines.push('');
  lines.push('## 难度汇总');
  lines.push('');
  lines.push('| 难度 | 样本 | 胜率 | 破产率 | 平均净资产 | 平均销量 | 平均 CSI |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  byDifficulty.forEach(row => {
    lines.push(`| ${labelById(DIFFICULTY_MODES, row.difficulty)} | ${row.samples} | ${percent(row.winRate)} | ${percent(row.bankruptcyRate)} | ${money(row.avgNetAssets)} | ${oneDecimal(row.avgSales)} | ${oneDecimal(row.avgCsi)} |`);
  });
  lines.push('');
  lines.push('## 剧本汇总');
  lines.push('');
  lines.push('| 剧本 | 样本 | 胜率 | 破产率 | 解聘率 | 平均净资产 | 平均最低现金 | 最高授信占用 |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  byScenario.forEach(row => {
    lines.push(`| ${labelById(GAME_SCENARIOS, row.id)} | ${row.samples} | ${percent(row.winRate)} | ${percent(row.bankruptcyRate)} | ${percent(row.dismissalRate)} | ${money(row.avgNetAssets)} | ${money(row.avgMinCash)} | ${percent(row.avgMaxCreditUsage)} |`);
  });
  lines.push('');
  lines.push('## 投资人压力汇总');
  lines.push('');
  lines.push('| 投资人 | 样本 | 胜率 | 解聘率 | 平均最低信任 | 平均最低现金 | 平均销量 |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  byInvestor.forEach(row => {
    lines.push(`| ${labelById(INVESTOR_PROFILES, row.id)} | ${row.samples} | ${percent(row.winRate)} | ${percent(row.dismissalRate)} | ${oneDecimal(row.avgMinTrust)} | ${money(row.avgMinCash)} | ${oneDecimal(row.avgSales)} |`);
  });
  lines.push('');
  lines.push('## 策略汇总');
  lines.push('');
  lines.push('| 策略 | 样本 | 胜率 | 破产率 | 平均净资产 | 平均销量 | 平均最低现金 | 最高授信占用 |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  byStrategy.forEach(row => {
    lines.push(`| ${STRATEGIES[row.strategy].label} | ${row.samples} | ${percent(row.winRate)} | ${percent(row.bankruptcyRate)} | ${money(row.avgNetAssets)} | ${oneDecimal(row.avgSales)} | ${money(row.avgMinCash)} | ${percent(row.avgMaxCreditUsage)} |`);
  });
  lines.push('');
  lines.push('## 高风险组合');
  lines.push('');
  if (risky.length === 0) {
    lines.push('未发现破产率 >= 50%、胜率 <= 10% 或平均授信使用率 >= 90% 的组合。');
  } else {
    lines.push('| 区域 | 难度 | 剧本 | 策略 | 样本 | 胜率 | 破产率 | 最高授信占用 | 最低现金 | 平均净资产 |');
    lines.push('| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
    risky.forEach(row => {
      lines.push(`| ${labelById(DEALER_REGIONS, row.region)} | ${labelById(DIFFICULTY_MODES, row.difficulty)} | ${labelById(GAME_SCENARIOS, row.scenario)} | ${STRATEGIES[row.strategy].label} | ${row.samples} | ${percent(row.winRate)} | ${percent(row.bankruptcyRate)} | ${percent(row.avgMaxCreditUsage)} | ${money(row.avgMinCash)} | ${money(row.avgNetAssets)} |`);
    });
  }
  lines.push('');
  lines.push('## 最差样本');
  lines.push('');
  lines.push('| 区域 | 难度 | 投资人 | 剧本 | 策略 | seed | 状态 | 天数 | 净资产 | 现金 | 负债 | 销量 | CSI |');
  lines.push('| --- | --- | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  outliers.forEach(row => {
    lines.push(`| ${labelById(DEALER_REGIONS, row.region)} | ${labelById(DIFFICULTY_MODES, row.difficulty)} | ${labelById(INVESTOR_PROFILES, row.investor)} | ${labelById(GAME_SCENARIOS, row.scenario)} | ${STRATEGIES[row.strategy].label} | ${row.seed} | ${row.gameState} | ${row.day} | ${money(row.netAssets)} | ${money(row.cash)} | ${money(row.loan)} | ${row.soldVehicles} | ${oneDecimal(row.csi)} |`);
  });
  lines.push('');
  lines.push('## 初步判读规则');
  lines.push('');
  lines.push('- 新手难度应明显低于标准/硬核破产率。');
  lines.push('- 激进冲量可提高销量，但不应在所有投资人和剧本下无脑最优。');
  lines.push('- 保守现金流应降低破产率，但可能在销量/净资产目标上落后。');
  lines.push('- 若某区域 × 难度长期胜率接近 0，应检查初始现金、授信、任务、市场压力和事件概率。');
  lines.push('- 若某策略在所有组合中胜率显著领先，应检查其订单资金成本、成交价、返利或营销 ROI。');
  lines.push('');
  return lines.join('\n');
}

function toCsv(rows) {
  const headers = Object.keys(rows[0] || {});
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(',')),
  ].join('\n');
}

await loadCaseFactories();

const selectedRegions = DEALER_REGIONS.filter(item => REGION_IDS.includes(item.id));
const selectedDifficulties = DIFFICULTY_MODES.filter(item => DIFFICULTY_IDS.includes(item.id));
const selectedInvestors = INVESTOR_PROFILES.filter(item => INVESTOR_IDS.includes(item.id));
const selectedScenarios = GAME_SCENARIOS.filter(item => SCENARIO_IDS.includes(item.id));
const strategyIds = Object.keys(STRATEGIES);

const results = [];
const total = selectedRegions.length * selectedDifficulties.length * selectedInvestors.length * selectedScenarios.length * strategyIds.length * DEFAULT_SAMPLES;
let completed = 0;

for (const region of selectedRegions) {
  for (const difficulty of selectedDifficulties) {
    for (const investor of selectedInvestors) {
      for (const scenario of selectedScenarios) {
        for (const strategyId of strategyIds) {
          for (let seedIndex = 1; seedIndex <= DEFAULT_SAMPLES; seedIndex += 1) {
            results.push(await runOneSimulation({ region, difficulty, investor, scenario, strategyId, seedIndex }));
            completed += 1;
            if (completed % 100 === 0) console.log(`progress ${completed}/${total}`);
          }
        }
      }
    }
  }
}

const summaryRows = summarize(results);
await mkdir(REPORT_DIR, { recursive: true });
await writeFile(path.join(REPORT_DIR, `balance-raw-${TODAY}.csv`), toCsv(results));
await writeFile(path.join(REPORT_DIR, `balance-summary-${TODAY}.csv`), toCsv(summaryRows));
await writeFile(path.join(REPORT_DIR, `balance-report-${TODAY}.md`), buildMarkdown(summaryRows, results));

console.log(`ok - balance simulation complete: ${results.length} runs`);
console.log(`report: ${path.join(REPORT_DIR, `balance-report-${TODAY}.md`)}`);
