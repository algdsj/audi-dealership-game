import { DIFFICULTY_MODES, GAME_SCENARIOS } from '../config/scenarios.js';
import { INITIAL_MARKET_PRICES } from '../config/vehicles.js';
import { DEALER_REGIONS, MARKET_SIZE_OPTIONS } from '../config/market.js';
import { STAFF_ROLE_META } from '../config/staff.js';
import { normalizeLeadChannels, sumLeadChannels } from '../engine/leads.js';
import { normalizeFeedbackState } from '../engine/feedback.js';
import { createCompetitorState } from '../engine/competitorState.js';
import { normalizeCompetitorIntelState } from '../engine/competitorIntel.js';
import { normalizeCustomerLifecycleState } from '../engine/customerLifecycle.js';
import { normalizeManufacturerPolicyPurchaseTarget } from '../engine/manufacturerPurchaseTargets.js';
import { normalizeSalesOpportunityPool } from '../engine/salesOpportunities.js';
import { createStaffMember, normalizeStaffMember } from '../engine/staffing.js';
import {
  createInitialCsi,
  createInitialCustomerLifecycle,
  createInitialDailyStats,
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
} from './initialState.js';

export const buildManualSaveData = ({
  savedAt = new Date().toLocaleString('zh-CN'),
  gameState,
  day,
  dealerRegionId,
  marketSizeId,
  investorProfileId,
  difficultyMode,
  scenarioId,
  tutorial,
  endingSummary,
  investorRelations,
  finance,
  drafts,
  gmWealth,
  virtualSales,
  competitors,
  strategy,
  marketPrices,
  modelPriceOverrides,
  marketEnvironment,
  manufacturerPolicy,
  marketing,
  staff,
  afterSales,
  usedCarShowroom,
  usedCars,
  testDriveCars,
  csi,
  customerLifecycle,
  insuranceRenewals,
  soldVehicles,
  monthlyStats,
  operatingEvents,
  facility,
  inventory,
  pendingOrders,
  dailyStats,
  dailyLedger,
  managerInbox,
  approvalCases,
  customerDeals,
  salesOpportunities,
  feedback,
  storyState,
  staffStoryMemory,
  logs,
}) => ({
  version: 1,
  savedAt,
  gameState: gameState === 'setup' ? 'playing' : gameState,
  day,
  dealerRegionId,
  marketSizeId,
  investorProfileId,
  difficultyMode,
  scenarioId,
  tutorial,
  endingSummary,
  investorRelations,
  finance,
  drafts,
  gmWealth,
  virtualSales,
  competitors,
  strategy,
  marketPrices,
  modelPriceOverrides,
  marketEnvironment,
  manufacturerPolicy,
  marketing,
  staff,
  afterSales,
  usedCarShowroom,
  usedCars,
  testDriveCars,
  csi,
  customerLifecycle,
  insuranceRenewals,
  soldVehicles,
  monthlyStats,
  operatingEvents,
  facility,
  inventory,
  pendingOrders,
  dailyStats,
  dailyLedger,
  managerInbox,
  approvalCases,
  customerDeals,
  salesOpportunities,
  feedback,
  storyState,
  staffStoryMemory,
  logs,
});

const normalizeStoryState = (storyState) => {
  const initialStoryState = createInitialStoryState();
  return {
    ...initialStoryState,
    ...(storyState || {}),
    chains: {
      ...initialStoryState.chains,
      ...((storyState && (storyState.chains || storyState.chainProgress)) || {}),
    },
    eventHistory: Array.isArray(storyState?.eventHistory) ? storyState.eventHistory.slice(-60) : initialStoryState.eventHistory,
    resolutions: Array.isArray(storyState?.resolutions) ? storyState.resolutions.slice(-80) : initialStoryState.resolutions,
  };
};

const normalizeOperatingEvents = (operatingEvents) => {
  const initialOperatingEvents = createInitialOperatingEvents();
  return {
    ...initialOperatingEvents,
    ...(operatingEvents || {}),
    pending: Array.isArray(operatingEvents?.pending) ? operatingEvents.pending.slice(-24) : initialOperatingEvents.pending,
    resolved: Array.isArray(operatingEvents?.resolved) ? operatingEvents.resolved.slice(-60) : initialOperatingEvents.resolved,
  };
};

export const normalizeLoadedSaveData = (saveData) => {
  const day = saveData.day || 1;
  const month = Math.floor((day - 1) / 30) + 1;
  const monthlyStats = { ...createInitialMonthlyStats(), lastInvestorComment: '旧存档补齐：尚未进入投资人评价。' };
  const manufacturerPolicy = {
    ...createInitialManufacturerPolicy(),
    policyMonth: month,
    lastChange: '旧存档补齐：标准商务政策',
  };
  const marketEnvironment = {
    ...createInitialMarketEnvironment(),
    seasonDesc: '旧存档补齐：市场需求平稳。',
    history: [{ month, desc: '旧存档补齐市场环境' }],
  };

  const dealerRegionId = saveData.dealerRegionId || 'capital';
  const dealerRegion = DEALER_REGIONS.find(region => region.id === dealerRegionId) || DEALER_REGIONS[1];
  const marketSize = MARKET_SIZE_OPTIONS.find(item => item.id === (dealerRegion.marketSizeId || 'medium')) || MARKET_SIZE_OPTIONS[1];
  const rawMarketing = saveData.marketing || {};
  const marketing = {
    ...createInitialMarketing(),
    leadPurchaseBudget: rawMarketing.leadPurchaseBudget ?? rawMarketing.budget ?? 2000,
    livestreamBudget: rawMarketing.livestreamBudget ?? 0,
    leads: 0,
    ...rawMarketing,
  };
  marketing.leadPurchaseBudget = marketing.leadPurchaseBudget ?? marketing.budget ?? 2000;
  marketing.livestreamBudget = marketing.livestreamBudget ?? 0;
  marketing.budget = marketing.leadPurchaseBudget;
  const leadChannels = normalizeLeadChannels(marketing);

  const savedStaff = saveData.staff || { dcc: { members: [], salary: 150 }, sales: { members: [], salary: 250 } };
  const afterSales = saveData.afterSales || { technicians: [], salary: 200 };

  return {
    gameState: ['playing', 'bankrupt', 'dismissed', 'won'].includes(saveData.gameState) ? saveData.gameState : 'playing',
    dealerRegionId,
    investorProfileId: saveData.investorProfileId || 'roi_first',
    marketSizeId: marketSize.id,
    difficultyMode: DIFFICULTY_MODES.some(item => item.id === saveData.difficultyMode) ? saveData.difficultyMode : 'standard',
    scenarioId: GAME_SCENARIOS.some(item => item.id === saveData.scenarioId) ? saveData.scenarioId : 'survive6',
    tutorial: { enabled: true, dismissed: false, ...(saveData.tutorial || {}) },
    endingSummary: saveData.endingSummary || null,
    investorRelations: {
      ...createInitialInvestorRelations(),
      lastComment: '旧存档补齐：尚未进入投资人评价。',
      ...(saveData.investorRelations || {}),
    },
    day,
    finance: { ...createInitialFinance(), ...(saveData.finance || {}) },
    drafts: { ...createInitialDrafts(), ...(saveData.drafts || {}) },
    gmWealth: { ...createInitialGmWealth(), ...(saveData.gmWealth || {}) },
    virtualSales: { ...createInitialVirtualSales(), ...(saveData.virtualSales || {}) },
    competitors: saveData.competitors
      ? normalizeCompetitorIntelState({ ...saveData.competitors, marketSize: marketSize.id, totalMarketSize: marketSize.totalMarketSize })
      : normalizeCompetitorIntelState(createCompetitorState({ marketSize })),
    strategy: { ...createInitialStrategy(), ...(saveData.strategy || {}) },
    marketPrices: saveData.marketPrices || INITIAL_MARKET_PRICES,
    modelPriceOverrides: saveData.modelPriceOverrides || {},
    marketEnvironment: { ...marketEnvironment, ...(saveData.marketEnvironment || {}) },
    manufacturerPolicy: normalizeManufacturerPolicyPurchaseTarget({
      manufacturerPolicy: { ...manufacturerPolicy, ...(saveData.manufacturerPolicy || {}) },
      month,
      salesTarget: (saveData.monthlyStats?.target || monthlyStats.target || 15),
      activeDifficulty: saveData.difficultyMode || 'standard',
    }),
    marketing: { ...marketing, leadChannels, leads: sumLeadChannels(leadChannels) },
    staff: {
      dcc: { salary: STAFF_ROLE_META.dcc.salary, ...savedStaff.dcc, members: (savedStaff.dcc?.members || []).map(member => normalizeStaffMember('dcc', member)) },
      sales: { salary: STAFF_ROLE_META.sales.salary, ...savedStaff.sales, members: (savedStaff.sales?.members || []).map(member => normalizeStaffMember('sales', member)) },
      service: { salary: STAFF_ROLE_META.service.salary, ...(savedStaff.service || {}), members: (savedStaff.service?.members || [createStaffMember('service', 30)]).map(member => normalizeStaffMember('service', member)) },
      streamer: { salary: STAFF_ROLE_META.streamer.salary, ...(savedStaff.streamer || {}), members: (savedStaff.streamer?.members || []).map(member => normalizeStaffMember('streamer', member)) },
    },
    afterSales: { ...afterSales, technicians: (afterSales.technicians || []).map(member => normalizeStaffMember('tech', member)) },
    usedCarShowroom: saveData.usedCarShowroom || createInitialUsedCarShowroom(),
    usedCars: saveData.usedCars || [],
    testDriveCars: saveData.testDriveCars || [],
    csi: { ...createInitialCsi(), ...(saveData.csi || {}) },
    customerLifecycle: saveData.customerLifecycle
      ? normalizeCustomerLifecycleState(saveData.customerLifecycle)
      : createInitialCustomerLifecycle(),
    insuranceRenewals: saveData.insuranceRenewals || createInitialInsuranceRenewals(),
    soldVehicles: saveData.soldVehicles || [],
    monthlyStats: { ...monthlyStats, ...(saveData.monthlyStats || {}) },
    operatingEvents: normalizeOperatingEvents(saveData.operatingEvents),
    facility: saveData.facility || createInitialFacility(),
    inventory: saveData.inventory || [],
    pendingOrders: saveData.pendingOrders || [],
    dailyStats: saveData.dailyStats || createInitialDailyStats(),
    dailyLedger: saveData.dailyLedger || [],
    approvalCases: saveData.approvalCases || [],
    customerDeals: saveData.customerDeals || [],
    salesOpportunities: saveData.salesOpportunities
      ? normalizeSalesOpportunityPool(saveData.salesOpportunities)
      : createInitialSalesOpportunities(),
    feedback: normalizeFeedbackState(saveData.feedback),
    storyState: normalizeStoryState(saveData.storyState),
    staffStoryMemory: saveData.staffStoryMemory || createInitialStaffStoryMemory(),
    managerInbox: saveData.managerInbox || [
      { id: 'inbox_legacy', day, from: '系统', title: '旧存档字段已补齐', body: '已为旧版存档补齐收件箱、市场环境、售后和二手车等新版经营字段。' },
    ],
    logs: saveData.logs || [{ day, type: 'info', message: '已加载旧版存档，并补齐新版经营字段。' }],
  };
};
