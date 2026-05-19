import assert from 'node:assert/strict';
import { CAR_MODELS, INITIAL_MARKET_PRICES } from '../src/game/config/vehicles.js';
import { STAFF_ROLE_META, STAFF_TRAITS } from '../src/game/config/staff.js';
import { ONBOARDING_TRAINING_DAYS } from '../src/game/config/onboardingTraining.js';
import { addMonthsToGameDate } from '../src/game/engine/gameDate.js';
import { buildBusinessIntelligenceSnapshot } from '../src/game/engine/businessIntelligence.js';
import {
  buildShowroomStrategySnapshot,
  buildVehicleStructureSnapshot,
  getSeriesCompetitorImpact,
} from '../src/game/engine/vehicleStructure.js';
import { buildFinanceSnapshot } from '../src/game/engine/financeSnapshot.js';
import {
  buildManufacturerInteractionSnapshot,
  resolveManufacturerResourceRequest,
  settleManufacturerComplianceAudit,
} from '../src/game/engine/manufacturerNegotiation.js';
import { buildOperatingReviewReport } from '../src/game/engine/operatingReviewReport.js';
import { evaluateOnboardingTraining } from '../src/game/engine/onboardingTraining.js';
import { evaluateStaffStoryMoments, mergeStaffStoryMemoryPatch } from '../src/game/engine/staffStoryEngine.js';
import { createInitialStoryState, evaluateStoryEvents } from '../src/game/engine/storyEventEngine.js';
import { resolveStoryInboxAction } from '../src/game/engine/storyActions.js';
import { createStaffMember, getSeriesTraitBonus, normalizeStaffMember } from '../src/game/engine/staffing.js';
import { buildStoreBlueprintViewModel } from '../src/features/store/storeBlueprintViewModel.js';
import { buildStoreOverviewViewModel } from '../src/features/store/storeOverviewViewModel.js';
import { buildMessageFeed, getInboxType } from '../src/game/viewModels/messageFeed.js';
import { buildStoryPressureSummary, getStoryInboxDetails } from '../src/game/viewModels/storyInbox.js';
import { APP_VERSION_INFO } from '../src/game/config/appVersion.js';
import {
  applySeriesPriceStrategy,
  autoArrangeShowroom,
  commitModelInventoryPrice,
  moveInventoryCar,
  prepareInventorySubsidy,
  settleInventorySubsidy,
  updateModelInventoryPriceInput,
} from '../src/game/engine/inventoryOperations.js';
import { executeVehicleOrder } from '../src/game/engine/purchaseOrders.js';
import {
  recordPurchaseTargetOrder,
  rollNextMonthPurchaseTarget,
  settleMonthlyPurchaseTarget,
} from '../src/game/engine/manufacturerPurchaseTargets.js';
import { settleMonthlyManufacturerCommitments } from '../src/game/engine/manufacturerCommitments.js';
import { createCustomerDealCase } from '../src/game/engine/caseFactories.js';
import { resolveCustomerDeal } from '../src/game/engine/customerDealResolution.js';
import {
  addCustomerRecord,
  createCustomerRecordFromDeal,
  evaluateCustomerLifecycleDaily,
  resolveCustomerFollowUp,
} from '../src/game/engine/customerLifecycle.js';
import {
  applySalesOpportunityStaffFeedback,
  evaluateSalesOpportunitiesDaily,
  expireSalesOpportunities,
  resolveSalesOpportunityAction,
} from '../src/game/engine/salesOpportunities.js';
import { prepareCompetitorCountermeasure, settleCompetitorCountermeasure } from '../src/game/engine/competitorCountermeasures.js';
import {
  buildCompetitorIntelSnapshot,
  applyCustomerLossCompetitorIntel,
  prepareCompetitorIntelAction,
  settleCompetitorIntelAction,
} from '../src/game/engine/competitorIntel.js';
import { evaluateOperatingEvents, resolveOperatingEvent, settleExpiredOperatingEvents } from '../src/game/engine/operatingEvents.js';
import {
  prepareHireStaffMember,
  prepareToggleStaffRetention,
  prepareTrainStaffMember,
  settleHireStaffMember,
  settleToggleStaffRetention,
  settleTrainStaffMember,
} from '../src/game/engine/staffManagement.js';
import {
  calculateUsedCarRetailChance,
  prepareBuildUsedCarShowroom,
  prepareUsedCarPrep,
  prepareUsedCarRetail,
  prepareUsedCarWholesale,
  settleBuildUsedCarShowroom,
  settleUsedCarPrep,
  settleUsedCarRetail,
  settleUsedCarWholesale,
  updateUsedCarRetailPrice,
} from '../src/game/engine/usedCarOperations.js';
import {
  createInitialDrafts,
  createInitialFacility,
  createInitialFinance,
  createInitialInvestorRelations,
  createInitialManufacturerPolicy,
  createInitialMarketEnvironment,
  createInitialMonthlyStats,
  createInitialUsedCarShowroom,
} from '../src/game/state/initialState.js';
import { buildManualSaveData, normalizeLoadedSaveData } from '../src/game/state/saveData.js';
import { buildSaveExportPayload, normalizeImportedSavePayload } from '../src/game/state/saveImportExport.js';
import {
  getLoadSlotEntries,
  readSaveSlots,
  rotateAutoSaveBackups,
  writeSaveSlots,
  SAVE_SLOTS_KEY,
} from '../src/game/state/saveSlots.js';

const formatMoney = amount => `Y${Math.round(amount).toLocaleString()}`;
const fixedRandom = value => () => value;

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  };
};

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('save data normalizes legacy fields without dropping core state', () => {
  const saveData = buildManualSaveData({
    savedAt: '2026-05-11 00:00:00',
    gameState: 'setup',
    day: 42,
    dealerRegionId: 'capital',
    marketSizeId: 'medium',
    investorProfileId: 'roi_first',
    difficultyMode: 'standard',
    scenarioId: 'survive6',
    tutorial: { enabled: true, dismissed: true },
    endingSummary: null,
    investorRelations: createInitialInvestorRelations(),
    finance: { ...createInitialFinance(), cash: 123456 },
    drafts: createInitialDrafts(),
    gmWealth: {},
    virtualSales: {},
    competitors: null,
    strategy: {},
    marketPrices: null,
    modelPriceOverrides: {},
    marketEnvironment: null,
    manufacturerPolicy: null,
    marketing: { budget: 3500 },
    staff: { dcc: { members: [{ id: 'legacy_dcc', nickname: 'Old DCC', skill: 44 }], salary: 150 }, sales: { members: [], salary: 250 } },
    afterSales: { technicians: [], salary: 200 },
    usedCarShowroom: null,
    usedCars: [],
    testDriveCars: [],
    csi: null,
    insuranceRenewals: null,
    soldVehicles: [],
    monthlyStats: null,
    facility: null,
    inventory: [],
    pendingOrders: [],
    dailyStats: null,
    dailyLedger: [],
    managerInbox: null,
    approvalCases: [],
    customerDeals: [],
    feedback: null,
    logs: null,
  });

  const loaded = normalizeLoadedSaveData(saveData);
  assert.equal(saveData.gameState, 'playing');
  assert.equal(loaded.day, 42);
  assert.equal(loaded.finance.cash, 123456);
  assert.equal(loaded.marketing.leadPurchaseBudget, 3500);
  assert.equal(loaded.marketing.leads, 0);
  assert.equal(loaded.usedCarShowroom.built, false);
  assert.deepEqual(loaded.staff.dcc.members[0].traits, []);
  assert.equal(loaded.staff.service.members.length, 1);
  assert.equal(loaded.managerInbox.length, 1);
  assert.deepEqual(loaded.customerLifecycle, { records: [], followUps: [] });
  assert.deepEqual(loaded.salesOpportunities, { active: [], history: [] });
  assert.deepEqual(loaded.operatingEvents, { pending: [], resolved: [] });
  assert.deepEqual(loaded.tutorial.visitedTabs, []);
  assert.ok(loaded.competitors.stores.every(store => typeof store.intelConfidence === 'number'));
  assert.equal(typeof loaded.manufacturerPolicy.purchaseTarget.targetUnits, 'number');
  assert.deepEqual(loaded.manufacturerPolicy.commitments, { active: [], history: [] });
  assert.equal(typeof loaded.manufacturerPolicy.roles.hq.relationship, 'number');
  assert.equal(typeof loaded.manufacturerPolicy.roles.region.relationship, 'number');
  assert.deepEqual(loaded.manufacturerPolicy.interaction.resourceHistory, []);
  assert.equal(typeof loaded.manufacturerPolicy.interaction.audit.riskScore, 'number');
  assert.equal(loaded.storyState.version, createInitialStoryState().version);
  assert.deepEqual(loaded.staffStoryMemory, {});
});

test('save import/export payload uses current normalize path', () => {
  const legacySave = {
    savedAt: '2026-05-12 08:00:00',
    gameState: 'setup',
    day: 7,
    dealerRegionId: 'capital',
    investorProfileId: 'roi_first',
    marketing: { budget: 2800 },
    finance: { cash: 88888 },
    staff: { dcc: { members: [], salary: 150 }, sales: { members: [], salary: 250 } },
  };
  const payload = buildSaveExportPayload({ saveData: legacySave, exportedAt: '2026-05-18T00:00:00.000Z' });
  const loaded = normalizeImportedSavePayload(payload);

  assert.equal(payload.format, 'audi-dealership-save-json');
  assert.equal(payload.saveSchemaVersion, APP_VERSION_INFO.saveSchemaVersion);
  assert.equal(loaded.gameState, 'playing');
  assert.equal(loaded.day, 7);
  assert.equal(loaded.finance.cash, 88888);
  assert.equal(loaded.marketing.leadPurchaseBudget, 2800);
  assert.equal(loaded.staff.service.members.length, 1);
});

test('auto save rotation keeps the latest three backups without changing save slot key', () => {
  const storage = createMemoryStorage();
  let allSlots = readSaveSlots(storage);

  for (let day = 1; day <= 5; day += 1) {
    allSlots = rotateAutoSaveBackups(allSlots);
    allSlots.slots.auto = {
      version: APP_VERSION_INFO.saveSchemaVersion,
      slotName: '自动存档',
      savedAt: `2026-05-${10 + day} 00:00:00 (自动)`,
      gameState: 'playing',
      day,
      finance: { cash: 100000 + day },
    };
  }

  writeSaveSlots(allSlots, storage);
  const persisted = readSaveSlots(storage);
  const rawPersisted = JSON.parse(storage.getItem(SAVE_SLOTS_KEY));
  const entries = getLoadSlotEntries(persisted);

  assert.equal(storage.getItem(SAVE_SLOTS_KEY) !== null, true);
  assert.ok(rawPersisted.slots.auto);
  assert.equal(persisted.autoBackups.length, 3);
  assert.deepEqual(persisted.autoBackups.map(slot => slot.day), [4, 3, 2]);
  assert.equal(entries.find(entry => entry.slotId === 'auto_backup_1').slot.day, 4);
  assert.equal(entries.filter(entry => entry.isAutoBackup).length, 3);
});

test('vehicle catalog has five series with three trims each and market prices', () => {
  const expectedSeries = ['A3L', 'A5L', 'A6L', 'Q5L', 'Q6L e-tron'];
  const expectedTrimsBySeries = {
    A3L: ['35 TFSI 进取致雅型', '35 TFSI 时尚运动型', '35 TFSI 豪华运动型'],
    A5L: ['运动版', '运动版 Plus', '运动版 quattro'],
    A6L: ['40 TFSI 豪华动感型', '45 TFSI 尊享致雅型', '45 TFSI quattro 尊享动感型'],
    Q5L: ['40 TFSI 时尚动感型', '40 TFSI 豪华动感型', '45 TFSI 臻选动感型'],
    'Q6L e-tron': ['长续航版', '超长续航乾崑智驾版', 'quattro 乾崑智驾版'],
  };

  assert.equal(CAR_MODELS.length, 15);
  expectedSeries.forEach(series => {
    const seriesModels = CAR_MODELS.filter(model => model.series === series);
    assert.equal(seriesModels.length, 3, `${series} should have three trims`);
    assert.deepEqual(seriesModels.map(model => model.trim), expectedTrimsBySeries[series]);
    seriesModels.forEach(model => {
      assert.equal(typeof INITIAL_MARKET_PRICES[model.id], 'number');
      assert.ok(INITIAL_MARKET_PRICES[model.id] < model.msrp);
    });
  });
  assert.equal(CAR_MODELS.find(model => model.id === 'Q6_ETRON_M')?.segment, '新能源');
});

test('vehicle structure snapshot diagnoses series mix and showroom gaps', () => {
  const a6 = CAR_MODELS.find(model => model.series === 'A6L');
  const q5 = CAR_MODELS.find(model => model.series === 'Q5L');
  const q6 = CAR_MODELS.find(model => model.series === 'Q6L e-tron');
  const snapshot = buildVehicleStructureSnapshot({
    inventory: [
      { id: 'a6_1', modelId: a6.id, location: 'warehouse', stockDays: 8, costPrice: a6.baseCost },
      { id: 'q5_1', modelId: q5.id, location: 'showroom', stockDays: 12, costPrice: q5.baseCost },
      { id: 'q6_1', modelId: q6.id, location: 'warehouse', stockDays: 70, costPrice: q6.baseCost },
    ],
    pendingOrders: [],
    soldVehicles: [{ id: 'sold_q5', modelId: q5.id }],
    monthlyStats: { ...createInitialMonthlyStats(), target: 16, leads: 35 },
    customerDeals: [{ id: 'young_1', status: 'pending', segment: '年轻', preferredSeries: ['A5L'] }],
    salesOpportunities: [],
    carModels: CAR_MODELS,
    financeSnapshot: { cashCoverageDays: 9 },
    activeRegion: { id: 'nev_hot', name: '新能源强势区' },
    marketEnvironment: { competitorEvent: { affectedSegments: ['新能源'] } },
    competitors: { stores: [{ brand: 'ev', isVisible: true }] },
  });

  assert.equal(snapshot.rows.find(row => row.series === 'Q5L').sales, 1);
  assert.ok(snapshot.recommendations.some(item => item.id === 'young_series_shortage'));
  assert.ok(snapshot.recommendations.some(item => item.id === 'ev_series_pressure'));
  assert.ok(snapshot.recommendations.some(item => item.id === 'capital_heavy_mix'));
});

test('vehicle competitor mapping and showroom strategy create series-level effects', () => {
  const q6 = CAR_MODELS.find(model => model.series === 'Q6L e-tron');
  const a6 = CAR_MODELS.find(model => model.series === 'A6L');
  const impact = getSeriesCompetitorImpact({
    modelDef: q6,
    marketEnvironment: { competitorEvent: { affectedSegments: ['新能源'], affectedSeries: ['Q6L e-tron'], demandImpact: -0.08, priceDrift: -0.02 } },
    competitors: { priceWarActive: true, stores: [{ brand: 'ev', customerPull: 74, isVisible: true }] },
  });
  const a6Impact = getSeriesCompetitorImpact({
    modelDef: a6,
    marketEnvironment: { competitorEvent: { affectedSegments: ['新能源'], affectedSeries: ['Q6L e-tron'], demandImpact: -0.08, priceDrift: -0.02 } },
    competitors: { priceWarActive: true, stores: [{ brand: 'ev', customerPull: 74, isVisible: true }] },
  });
  const showroom = buildShowroomStrategySnapshot({
    inventory: [
      { id: 'q6_show', modelId: q6.id, location: 'showroom' },
      { id: 'a6_show', modelId: a6.id, location: 'showroom' },
    ],
    carModels: CAR_MODELS,
  });

  assert.ok(impact.rivalLabels.includes('Model Y'));
  assert.ok(impact.demandImpact < a6Impact.demandImpact);
  assert.ok(showroom.segmentBonus.新能源 > 0);
  assert.ok(showroom.segmentBonus.商务 > 0);
  assert.ok(showroom.competitorShield > 0);
});

test('onboarding training guides the first seven operating days', () => {
  const firstDay = evaluateOnboardingTraining({
    dayOfMonth: 1,
    visitedTabs: ['dashboard'],
    activity: {},
  });
  assert.equal(ONBOARDING_TRAINING_DAYS.length, 7);
  assert.equal(firstDay.currentTrainingDay.id, 'day1_bi');
  assert.equal(firstDay.nextStep.targetTab, 'bi');
  assert.equal(firstDay.progress.totalDays, 7);

  const lateWeek = evaluateOnboardingTraining({
    dayOfMonth: 7,
    visitedTabs: ['bi', 'order', 'showroom', 'marketing', 'opportunities', 'csi'],
    activity: {
      reviewedBusinessIntelligence: true,
      hasPendingOrderOrInventory: true,
      hasShowroomDisplay: true,
      hasMarketingSpendOrLeads: true,
      hasHandledDealFlow: true,
      hasReviewedCsiOrManufacturer: true,
    },
  });
  assert.equal(lateWeek.currentTrainingDay.id, 'day7_reports');
  assert.equal(lateWeek.nextStep.targetTab, 'reports');
  assert.equal(lateWeek.progress.unlockedCompletedDays, 6);
});

test('store overview view model summarizes core dealership zones', () => {
  const model = CAR_MODELS[0];
  const viewModel = buildStoreOverviewViewModel({
    inventory: [
      { id: 'car1', modelId: model.id, location: 'showroom', stockDays: 12 },
      { id: 'car2', modelId: model.id, location: 'warehouse', stockDays: 72 },
    ],
    pendingOrders: [{ quantity: 2, daysLeft: 2 }],
    usedCars: [{ id: 'uc1', status: 'stock', prepped: false }],
    facility: createInitialFacility(),
    afterSales: { technicians: [{ id: 't1', skill: 50, stress: 40, loyalty: 70 }], complaints: 1 },
    staff: {
      sales: { members: [{ id: 's1', skill: 70, stress: 45, loyalty: 68 }] },
      dcc: { members: [] },
      service: { members: [] },
      streamer: { members: [] },
    },
    finance: { cash: 500000, loan: 2000000, creditLimit: 5000000 },
    monthlyStats: { ...createInitialMonthlyStats(), sales: 4, target: 12, afterSalesReturnVisits: 4 },
    csi: { score: 82, complaints: 1 },
    carModels: CAR_MODELS,
    dayOfMonth: 10,
  });

  assert.equal(viewModel.showroom.totalInventory, 2);
  assert.equal(viewModel.warehouse.inTransitCount, 2);
  assert.equal(viewModel.afterSales.complaintCount, 1);
  assert.equal(viewModel.usedCar.stock, 1);
  assert.ok(viewModel.overview.healthScore >= 0);
});

test('store blueprint view model provides drawable dealership coordinates', () => {
  const model = CAR_MODELS[0];
  const viewModel = buildStoreBlueprintViewModel({
    inventory: [
      { id: 'car1', modelId: model.id, location: 'showroom', stockDays: 12 },
      { id: 'car2', modelId: model.id, location: 'warehouse', stockDays: 72 },
    ],
    pendingOrders: [{ quantity: 2, daysLeft: 2 }],
    usedCars: [{ id: 'uc1', status: 'stock', prepped: false }],
    usedCarShowroom: { built: true, capacity: 4 },
    facility: createInitialFacility(),
    afterSales: { technicians: [{ id: 't1', nickname: 'Tech', skill: 50, stress: 40, loyalty: 70 }] },
    staff: {
      sales: { members: [{ id: 's1', nickname: 'Sales', skill: 70, stress: 45, loyalty: 68 }] },
      dcc: { members: [] },
      service: { members: [] },
      streamer: { members: [] },
    },
    finance: { cash: 500000, loan: 2000000, creditLimit: 5000000 },
    drafts: createInitialDrafts(),
    monthlyStats: { ...createInitialMonthlyStats(), sales: 4, target: 12, afterSalesReturnVisits: 4 },
    csi: { score: 82, complaints: 1 },
    carModels: CAR_MODELS,
    dayOfMonth: 10,
  });

  assert.equal(viewModel.zones.length, 11);
  assert.ok(viewModel.floors.some(floor => floor.id === 'floor1'));
  assert.ok(viewModel.floors.some(floor => floor.id === 'floor2'));
  assert.ok(viewModel.zones.every(zone => zone.rect && Number.isFinite(zone.rect.x)));
  assert.ok(viewModel.zones.some(zone => zone.id === 'office' && zone.floor === 'floor2'));
  assert.ok(viewModel.zones.some(zone => zone.id === 'dccOffice' && zone.floor === 'floor2'));
  assert.ok(viewModel.zones.some(zone => zone.id === 'financeDelivery' && zone.floor === 'floor2'));
  assert.ok(viewModel.zones.some(zone => zone.id === 'showroom' && zone.floor === 'floor1'));
  assert.ok(viewModel.vehicleSlots.every(slot => slot.rect && Number.isFinite(slot.rect.w)));
  assert.ok(viewModel.serviceBays.every(bay => bay.rect && Number.isFinite(bay.rect.h)));
  assert.ok(viewModel.workstations.some(station => station.role === 'streamer' && station.occupied === false));
  assert.ok(viewModel.workstations.every(station => station.floor === (['office', 'dccOffice', 'financeDelivery'].includes(station.zoneId) ? 'floor2' : 'floor1')));
  assert.ok(viewModel.workstations.every(station => Number.isFinite(station.x) && Number.isFinite(station.y)));
  assert.ok(viewModel.flowLines.every(line => (
    Array.isArray(line.points)
    && line.points.length >= 2
    && line.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))
  )));
  assert.ok(viewModel.flowLines.every(line => line.points.slice(1).every((point, index) => (
    point.x === line.points[index].x || point.y === line.points[index].y
  ))));
});

test('story event engine emits deterministic narrative events', () => {
  const result = evaluateStoryEvents({
    gameState: {
      finance: { cash: 100000, loan: 9200000, creditLimit: 10000000 },
      monthlyStats: { ...createInitialMonthlyStats(), sales: 1, target: 15, walkIns: 20 },
      csi: { score: 72, complaints: 3 },
      drafts: { activeDrafts: [{ status: 'defaulted', amount: 500000 }], bankReputation: 45 },
      inventory: [{ id: 'car1', stockDays: 95 }],
      facility: createInitialFacility(),
      investorRelations: { badReviews: 2, lastScore: 55 },
      staff: {
        sales: { members: [{ id: 's1', nickname: 'Tester', skill: 86, stress: 90, loyalty: 30 }] },
        dcc: { members: [] },
        service: { members: [] },
        streamer: { members: [] },
      },
      competitors: { priceWarActive: true, priceWarRound: 2, stores: [] },
    },
    storyState: createInitialStoryState(),
    day: 30,
    dayOfMonth: 30,
    month: 1,
    rng: fixedRandom(0),
  });

  assert.ok(result.events.length >= 1);
  assert.ok(result.logs.length >= 1);
  assert.ok(result.inboxMessages.length >= 1);
  assert.equal(getInboxType(result.inboxMessages[0]), 'story');
  assert.ok(getStoryInboxDetails(result.inboxMessages[0]).suggestedActions.length >= 1);
  assert.ok(getStoryInboxDetails(result.inboxMessages[0]).effectsPreview.length >= 1);
  const feed = buildMessageFeed({ managerInbox: result.inboxMessages, logs: [] });
  assert.equal(feed.visibleMessageFeed[0].label, '剧情');
  assert.equal(feed.visibleMessageFeed[0].sourceType, 'story');
  assert.ok(buildStoryPressureSummary(result.storyState).length >= 1);
  const actionResult = resolveStoryInboxAction({
    storyState: result.storyState,
    message: result.inboxMessages[0],
    actionId: 'mitigate',
    day: 30,
  });
  assert.equal(actionResult.inboxPatch.storyResolved, true);
  assert.equal(actionResult.storyState.resolutions[0].actionId, 'mitigate');
  assert.equal(actionResult.storyState.chains[result.inboxMessages[0].chainId].lastAction, 'mitigate');
  assert.equal(actionResult.storyState.chains[result.inboxMessages[0].chainId].mitigationScoreReduction, 10);
  assert.ok(actionResult.storyState.chains[result.inboxMessages[0].chainId].cooldownUntil >= 34);
  assert.ok(actionResult.storyState.chains[result.inboxMessages[0].chainId].mitigationUntil >= 40);
  assert.ok(actionResult.inboxPatch.storyResolution.effect.summary.includes('风险-10'));
  assert.ok(buildStoryPressureSummary(actionResult.storyState, 30)[0].mitigationLabel.includes('风险-10'));
  assert.equal(result.storyState.lastEvaluatedDay, 30);
});

test('staff story engine creates moments and mergeable memory', () => {
  const previousStaff = {
    sales: { members: [{ id: 's1', nickname: 'Tester', skill: 82, stress: 45, loyalty: 68 }] },
    dcc: { members: [] },
    service: { members: [] },
    streamer: { members: [] },
    tech: { members: [] },
  };
  const staff = {
    sales: { members: [{ id: 's1', nickname: 'Tester', skill: 84, stress: 92, loyalty: 28 }] },
    dcc: { members: [] },
    service: { members: [] },
    streamer: { members: [] },
    tech: { members: [] },
  };

  const result = evaluateStaffStoryMoments({
    staff,
    previousStaff,
    monthlyStats: { ...createInitialMonthlyStats(), sales: 6, target: 8 },
    logs: [],
    rng: fixedRandom(0),
    day: 5,
    month: 1,
    activeRegion: { turnover: 1.2 },
  });
  const memory = mergeStaffStoryMemoryPatch({
    memory: {},
    patch: result.staffStoryMemoryPatch,
  });

  assert.ok(result.moments.some(moment => moment.staffId === 's1'));
  assert.ok(memory.s1.timeline.length >= 1);
});

test('finance snapshot balances assets, liabilities, profit, and draft warnings', () => {
  const model = CAR_MODELS[0];
  const snapshot = buildFinanceSnapshot({
    monthlyStats: {
      revenue: 500000,
      cogs: 420000,
      baseRebatesPool: 30000,
      derivativeRevenue: 20000,
      derivativeCost: 5000,
      rent: 10000,
      labor: 15000,
      marketingCost: 3000,
    },
    drafts: {
      creditLimit: 1000000,
      creditUsed: 300000,
      activeDrafts: [
        { id: 'd1', status: 'active', amount: 300000, dueDate: { month: 1, day: 8 } },
      ],
    },
    currentDay: 3,
    currentMonth: 1,
    dailyBurnEstimate: 10000,
    dailyLedger: [{ day: 2, items: [{ label: 'cash sale', amount: 1000, type: 'income' }] }],
    inventory: [{ id: 'car1', modelId: model.id }],
    carModels: CAR_MODELS,
    virtualSales: { virtualCars: [{ costPrice: 100000 }] },
    usedCars: [{ id: 'uc1', status: 'stock', purchasePrice: 80000 }],
    finance: { cash: 200000, loan: 50000 },
    gmWealth: { outstandingBailout: 20000 },
  });

  assert.equal(snapshot.netProfit, 97000);
  assert.equal(snapshot.warningDrafts.length, 1);
  assert.equal(snapshot.draftCreditUsage, 30);
  assert.equal(snapshot.balanceAssets, 200000 + model.baseCost + 100000 + 80000);
  assert.equal(snapshot.balanceLiabilities, 50000 + 300000 + 20000);
  assert.equal(snapshot.ownerEquity, snapshot.balanceAssets - snapshot.balanceLiabilities);
});

test('business intelligence snapshot highlights sales and cash risks', () => {
  const monthlyStats = {
    ...createInitialMonthlyStats(),
    target: 15,
    sales: 2,
    leads: 30,
    walkIns: 12,
    revenue: 800000,
    cogs: 760000,
    derivativeRevenue: 20000,
    derivativeCost: 8000,
    afterSalesRevenue: 10000,
    usedCarRevenue: 0,
  };
  const finance = { ...createInitialFinance(), cash: 90000, loan: 9000000 };
  const financeSnapshot = buildFinanceSnapshot({
    monthlyStats,
    drafts: createInitialDrafts(),
    currentDay: 20,
    currentMonth: 1,
    dailyBurnEstimate: 15000,
    dailyLedger: [],
    inventory: [{ id: 'car1', modelId: CAR_MODELS[0].id, stockDays: 95 }],
    carModels: CAR_MODELS,
    virtualSales: {},
    usedCars: [],
    finance,
    gmWealth: {},
  });
  const snapshot = buildBusinessIntelligenceSnapshot({
    monthlyStats,
    finance,
    financeSnapshot,
    inventory: [{ id: 'car1', modelId: CAR_MODELS[0].id, stockDays: 95 }],
    csi: { score: 72, complaints: 1 },
    dayOfMonth: 20,
    manufacturerPolicy: {
      ...createInitialManufacturerPolicy(),
      purchaseTarget: { targetUnits: 10, purchasedUnits: 5, bonus: null },
    },
  });

  assert.equal(snapshot.kpis.salesProgress > 0, true);
  assert.equal(snapshot.riskItems.some(item => item.id === 'cash' && item.level === 'danger'), true);
  assert.equal(snapshot.riskItems.some(item => item.id === 'inventory' && item.level === 'danger'), true);
  assert.equal(snapshot.actions.some(item => item.tab === 'opportunities'), true);
});

test('operating review report builds quarterly challenge and practical findings', () => {
  const report = buildOperatingReviewReport({
    month: 1,
    monthlyStats: { ...createInitialMonthlyStats(), target: 15, sales: 3, revenue: 600000, cogs: 650000 },
    finance: { ...createInitialFinance(), cash: 120000, loan: 6000000, creditLimit: 8000000 },
    financeSnapshot: { cashCoverageDays: 8, debtRatio: 0.75, netProfit: -220000 },
    inventory: [{ id: 'aged1', stockDays: 92 }, { id: 'fresh1', stockDays: 12 }],
    csi: { score: 78, complaints: 1 },
    manufacturerPolicy: {
      ...createInitialManufacturerPolicy(),
      roles: {
        hq: { relationship: 55 },
        region: { relationship: 62 },
      },
    },
    investorReview: { score: 58, monthNetProfit: -220000 },
    feedback: { ratingHistory: [] },
    formatMoney,
  });

  assert.equal(report.challenge.id, 'q1_cash_defense');
  assert.ok(report.challenge.progress < 100);
  assert.equal(report.findings.some(item => item.id === 'cash_pressure'), true);
  assert.equal(report.nextActions.length > 0, true);
});

test('inventory operations clamp prices, move cars, arrange showroom, and subsidize aged stock', () => {
  const model = CAR_MODELS[0];
  const inventory = [
    { id: 'car1', modelId: model.id, location: 'warehouse', stockDays: 45, price: model.msrp },
    { id: 'car2', modelId: CAR_MODELS[1].id, location: 'warehouse', stockDays: 3, price: CAR_MODELS[1].msrp },
  ];

  const inputInventory = updateModelInventoryPriceInput({ modelId: model.id, newPrice: '999999999', inventory });
  const committed = commitModelInventoryPrice({
    modelId: model.id,
    inventory: inputInventory,
    carModels: CAR_MODELS,
    getDynamicMsrp: () => model.msrp,
  });
  assert.equal(committed.status, 'committed');
  assert.equal(committed.inventory.find(car => car.id === 'car1').price, Math.round(model.msrp * 1.3));

  const moved = moveInventoryCar({
    modelId: model.id,
    targetLocation: 'showroom',
    inventory: committed.inventory,
    facility: { showroomSpots: 1 },
    carModels: CAR_MODELS,
  });
  assert.equal(moved.status, 'moved');
  assert.equal(moved.inventory.find(car => car.id === 'car1').location, 'showroom');

  const arranged = autoArrangeShowroom({
    inventory,
    facility: { showroomSpots: 2 },
  });
  assert.equal(arranged.status, 'arranged');
  assert.equal(arranged.inventory.filter(car => car.location === 'showroom').length, 2);

  const strategy = applySeriesPriceStrategy({
    series: 'A3L',
    inventory,
    carModels: CAR_MODELS,
    marketPrices: { [model.id]: model.msrp * 0.94, [CAR_MODELS[1].id]: CAR_MODELS[1].msrp * 0.94 },
    getDynamicMsrp: modelId => CAR_MODELS.find(item => item.id === modelId).msrp,
  });
  assert.equal(strategy.status, 'applied');
  assert.equal(Object.keys(strategy.modelPriceOverrides).length, 3);
  assert.ok(strategy.inventory.find(car => car.id === 'car1').price <= model.msrp);

  const subsidyPlan = prepareInventorySubsidy({
    modelId: model.id,
    inventory,
    carModels: CAR_MODELS,
    monthlyStats: { lastMonthProcessPassed: true },
    currentDay: 31,
  });
  assert.equal(subsidyPlan.status, 'ready');
  const subsidy = settleInventorySubsidy({
    subsidyPlan,
    inventory,
    monthlyStats: { baseRebatesPool: 0 },
  });
  assert.equal(subsidy.monthlyStats.baseRebatesPool, 5000);
  assert.equal(subsidy.inventory.find(car => car.id === 'car1').subsidized, true);
});

test('used car operations cover showroom build, prep, pricing, retail, and wholesale', () => {
  const buildPlan = prepareBuildUsedCarShowroom({ usedCarShowroom: createInitialUsedCarShowroom() });
  const showroom = settleBuildUsedCarShowroom({ buildPlan, finance: { cash: 200000 } });
  assert.equal(showroom.status, 'settled');
  assert.equal(showroom.usedCarShowroom.built, true);
  assert.equal(showroom.finance.cash, 50000);

  const usedCars = [{
    id: 'uc1',
    brand: 'Audi A6L 2022',
    status: 'stock',
    purchasePrice: 100000,
    retailPrice: 120000,
    prepped: false,
  }];
  const prepPlan = prepareUsedCarPrep({ ucId: 'uc1', usedCars });
  const prepped = settleUsedCarPrep({
    prepPlan,
    usedCars,
    finance: { cash: 10000 },
    monthlyStats: {},
  });
  assert.equal(prepped.usedCars[0].prepped, true);
  assert.equal(prepped.monthlyStats.usedCarPrepCost, 3000);

  const repriced = updateUsedCarRetailPrice({ ucId: 'uc1', newPrice: '999999', usedCars: prepped.usedCars });
  assert.equal(repriced[0].customRetailPrice, 150000);
  assert.ok(calculateUsedCarRetailChance(repriced[0]) <= 0.65);

  const retailPlan = prepareUsedCarRetail({
    ucId: 'uc1',
    usedCars: repriced,
    usedCarShowroom: showroom.usedCarShowroom,
  });
  const retailed = settleUsedCarRetail({
    retailPlan,
    usedCars: repriced,
    finance: { cash: 0 },
    monthlyStats: {},
    random: fixedRandom(0),
  });
  assert.equal(retailed.status, 'sold');
  assert.equal(retailed.finance.cash, 150000);

  const wholesaleCars = [{ ...usedCars[0], id: 'uc2' }];
  const wholesalePlan = prepareUsedCarWholesale({ ucId: 'uc2', usedCars: wholesaleCars });
  const wholesaled = settleUsedCarWholesale({
    wholesalePlan,
    usedCars: wholesaleCars,
    finance: { cash: 0 },
    monthlyStats: {},
  });
  assert.equal(wholesaled.status, 'settled');
  assert.equal(wholesaled.finance.cash, 95000);
});

test('staff operations train, hire, and toggle retention', () => {
  const staff = {
    dcc: { salary: STAFF_ROLE_META.dcc.salary, members: [{ id: 'dcc1', nickname: 'Tester', skill: 40 }] },
    sales: { salary: STAFF_ROLE_META.sales.salary, members: [] },
  };
  const normalizedLegacyMember = normalizeStaffMember('dcc', staff.dcc.members[0]);
  assert.deepEqual(normalizedLegacyMember.traits, []);

  const generatedMember = createStaffMember('sales', 32, fixedRandom(0.9));
  assert.ok(generatedMember.traits.length >= 1 && generatedMember.traits.length <= 2);
  assert.ok(generatedMember.traits.every(traitId => STAFF_TRAITS.sales.some(trait => trait.id === traitId)));

  const trainPlan = prepareTrainStaffMember({
    type: 'dcc',
    memberId: 'dcc1',
    staff,
    finance: { cash: 50000 },
    roleMeta: STAFF_ROLE_META,
  });
  const trained = settleTrainStaffMember({
    trainPlan,
    staff,
    finance: { cash: 50000 },
    formatMoney,
  });
  assert.equal(trained.status, 'settled');
  assert.equal(trained.finance.cash, 30000);
  assert.equal(trained.staff.dcc.members[0].skill, 50);
  assert.deepEqual(trained.staff.dcc.members[0].traits, []);

  const hirePlan = prepareHireStaffMember({ type: 'sales', roleMeta: STAFF_ROLE_META });
  const hired = settleHireStaffMember({
    hirePlan,
    staff: trained.staff,
    random: fixedRandom(0),
  });
  assert.equal(hired.staff.sales.members.length, 1);
  assert.ok(hired.staff.sales.members[0].traits.length >= 1);
  assert.ok(hired.staff.sales.members[0].traits.length <= 2);

  const retentionPlan = prepareToggleStaffRetention({
    type: 'sales',
    memberId: hired.staff.sales.members[0].id,
    staff: hired.staff,
    roleMeta: STAFF_ROLE_META,
  });
  const retained = settleToggleStaffRetention({ retentionPlan, staff: hired.staff });
  assert.equal(retained.staff.sales.members[0].retained, true);
});

test('sales staff series specialties contribute targeted bonuses', () => {
  const members = [
    normalizeStaffMember('sales', { id: 's_business', nickname: '商务', skill: 70, traits: ['business_specialist'] }),
    normalizeStaffMember('sales', { id: 's_ev', nickname: '新能源', skill: 68, traits: ['ev_product'] }),
  ];

  assert.ok(getSeriesTraitBonus({ type: 'sales', members, series: 'A6L' }) > 0);
  assert.ok(getSeriesTraitBonus({ type: 'sales', members, series: 'Q6L e-tron' }) > 0);
  assert.equal(getSeriesTraitBonus({ type: 'sales', members, series: 'Q5L' }), 0);
});

test('manufacturer purchase target tracks orders and rewards over-purchase', () => {
  const policy = {
    ...createInitialManufacturerPolicy(),
    purchaseTarget: { month: 1, targetUnits: 2, purchasedUnits: 0, status: 'active', history: [] },
  };
  const trackedPolicy = recordPurchaseTargetOrder({ manufacturerPolicy: policy, quantity: 4 });
  assert.equal(trackedPolicy.purchaseTarget.purchasedUnits, 4);

  const settled = settleMonthlyPurchaseTarget({
    manufacturerPolicy: trackedPolicy,
    finance: { ...createInitialFinance(), cash: 100000, creditLimit: 1000000 },
    activeDifficulty: { id: 'standard' },
    month: 1,
    absoluteDay: 30,
    formatMoney,
    random: fixedRandom(0),
  });
  assert.equal(settled.reward.id, 'cash_bonus');
  assert.equal(settled.reward.extraUnits, 2);
  assert.equal(settled.finance.cash, 100000 + 28000 + 9000 * 2);
  assert.equal(settled.manufacturerPolicy.purchaseTarget.history[0].achieved, true);
  assert.ok(settled.manufacturerPolicy.roles.region.relationship > policy.roles.region.relationship);

  const rolled = rollNextMonthPurchaseTarget({
    manufacturerPolicy: settled.manufacturerPolicy,
    nextMonth: 2,
    nextMonthSalesTarget: 12,
    activeDifficulty: { id: 'standard' },
    random: fixedRandom(0),
  });
  assert.equal(rolled.commitments.active.length, 1);
  assert.equal(rolled.commitments.active[0].typeId, 'purchase_floor');
  assert.equal(rolled.commitments.active[0].ownerRole, 'region');

  const fulfilled = settleMonthlyManufacturerCommitments({
    manufacturerPolicy: rolled,
    monthlyStats: { ...createInitialMonthlyStats(), purchaseUnits: rolled.commitments.active[0].targetValue },
    csi: { score: 90 },
    activeDifficulty: { id: 'standard' },
    month: 2,
    absoluteDay: 60,
    formatMoney,
  });
  assert.equal(fulfilled.settled[0].achieved, true);
  assert.ok(fulfilled.manufacturerPolicy.rebateMultiplier > rolled.rebateMultiplier);
  assert.ok(fulfilled.manufacturerPolicy.roles.region.relationship > rolled.roles.region.relationship);
});

test('manufacturer purchase target tracks structure tasks by vehicle series', () => {
  const a3 = CAR_MODELS.find(model => model.series === 'A3L');
  const a6 = CAR_MODELS.find(model => model.series === 'A6L');
  const q5 = CAR_MODELS.find(model => model.series === 'Q5L');
  const q6 = CAR_MODELS.find(model => model.series === 'Q6L e-tron');
  const policy = {
    ...createInitialManufacturerPolicy(),
    purchaseTarget: { month: 1, targetUnits: 8, purchasedUnits: 0, status: 'active', history: [] },
  };
  const tracked = [
    [a3.id, 2],
    [a6.id, 2],
    [q5.id, 2],
    [q6.id, 1],
  ].reduce((nextPolicy, [modelId, quantity]) => recordPurchaseTargetOrder({
    manufacturerPolicy: nextPolicy,
    quantity,
    modelId,
    carModels: CAR_MODELS,
  }), policy);
  const structure = tracked.purchaseTarget.structure;

  assert.equal(structure.items.find(item => item.series === 'A3L').purchasedUnits, 2);
  assert.equal(structure.items.find(item => item.series === 'Q6L e-tron').purchasedUnits, 1);

  const settled = settleMonthlyPurchaseTarget({
    manufacturerPolicy: tracked,
    finance: { ...createInitialFinance(), cash: 100000, creditLimit: 1000000 },
    activeDifficulty: { id: 'standard' },
    month: 1,
    absoluteDay: 30,
    formatMoney,
    random: fixedRandom(0),
  });

  assert.equal(settled.manufacturerPolicy.purchaseTarget.structure.lastResult.achievedCount, 4);
  assert.ok(settled.ledgerItems.some(item => item.label === '厂家结构任务奖励'));
  assert.ok(settled.inboxItems.some(item => item.tags.includes('vehicle_structure')));
});

test('manufacturer interaction supports resource negotiation and headquarters audit', () => {
  const policy = {
    ...createInitialManufacturerPolicy(),
    purchaseTarget: { month: 1, targetUnits: 10, purchasedUnits: 8, status: 'active', history: [] },
  };
  const snapshot = buildManufacturerInteractionSnapshot({
    manufacturerPolicy: policy,
    monthlyStats: { ...createInitialMonthlyStats(), sales: 3, target: 15 },
    finance: createInitialFinance(),
    inventory: [{ id: 'aged1', modelId: CAR_MODELS[0].id, stockDays: 110 }],
    csi: { score: 72, complaints: 2 },
    virtualSales: { virtualCars: [{ id: 'v1' }], suspicionLevel: 70 },
    modelPriceOverrides: { [CAR_MODELS[0].id]: Math.round(CAR_MODELS[0].msrp * 0.86) },
    carModels: CAR_MODELS,
    dayOfMonth: 20,
    month: 1,
    activeDifficulty: { id: 'standard' },
  });
  assert.equal(snapshot.auditRisk.level, 'danger');
  assert.equal(snapshot.resourceRequests.some(item => item.id === 'market_cofund' && item.available), true);

  const negotiated = resolveManufacturerResourceRequest({
    requestId: 'market_cofund',
    manufacturerPolicy: policy,
    finance: { ...createInitialFinance(), cash: 100000 },
    monthlyStats: createInitialMonthlyStats(),
    currentDay: 20,
    month: 1,
    dayOfMonth: 20,
    activeDifficulty: { id: 'standard' },
    formatMoney,
  });
  assert.equal(negotiated.status, 'resolved');
  assert.equal(negotiated.finance.cash, 145000);
  assert.equal(negotiated.manufacturerPolicy.interaction.resourceHistory.length, 1);

  const audit = settleManufacturerComplianceAudit({
    manufacturerPolicy: policy,
    finance: { ...createInitialFinance(), cash: 500000 },
    monthlyStats: createInitialMonthlyStats(),
    inventory: [{ id: 'aged1', modelId: CAR_MODELS[0].id, stockDays: 120 }],
    csi: { score: 70, complaints: 2 },
    virtualSales: { virtualCars: [{ id: 'v1' }], suspicionLevel: 80 },
    modelPriceOverrides: { [CAR_MODELS[0].id]: Math.round(CAR_MODELS[0].msrp * 0.84) },
    carModels: CAR_MODELS,
    activeDifficulty: { id: 'standard' },
    month: 1,
    absoluteDay: 30,
    formatMoney,
    random: fixedRandom(0),
  });
  assert.equal(audit.ledgerItems.length, 1);
  assert.ok(audit.finance.cash < 500000);
  assert.equal(audit.manufacturerPolicy.interaction.audit.history.length, 1);
  assert.ok(audit.manufacturerPolicy.roles.hq.relationship < policy.roles.hq.relationship);
});

test('purchase order supports cash, loan, and draft settlement paths', () => {
  const model = CAR_MODELS[0];
  const base = {
    investorRelations: createInitialInvestorRelations(),
    currentDay: 1,
    facility: createInitialFacility(),
    inventory: [],
    pendingOrders: [],
    finance: { ...createInitialFinance(), cash: 1000000 },
    drafts: createInitialDrafts(),
    monthlyStats: createInitialMonthlyStats(),
    month: 1,
    dayOfMonth: 1,
    marketEnvironment: createInitialMarketEnvironment(),
    getDraftFeeRate: () => 0.005,
    addMonthsToGameDate,
    formatMoney,
    random: fixedRandom(0.25),
  };

  const cashOrder = executeVehicleOrder({
    ...base,
    orderForm: { model, quantity: 1, color: '黑', paymentMethod: 'cash' },
  });
  assert.equal(cashOrder.status, 'settled');
  assert.equal(cashOrder.finance.cash, 1000000 - model.baseCost);
  assert.equal(cashOrder.pendingOrders.length, 1);
  assert.equal(cashOrder.monthlyStats.purchaseUnits, 1);

  const loanOrder = executeVehicleOrder({
    ...base,
    orderForm: { model, quantity: 1, color: '白', paymentMethod: 'loan' },
  });
  assert.equal(loanOrder.status, 'settled');
  assert.equal(loanOrder.finance.loan, model.baseCost);

  const draftOrder = executeVehicleOrder({
    ...base,
    orderForm: { model, quantity: 1, color: '灰', paymentMethod: 'draft3' },
  });
  assert.equal(draftOrder.status, 'settled');
  assert.equal(draftOrder.drafts.activeDrafts.length, 1);
  assert.equal(draftOrder.monthlyStats.financeCost, Math.round(model.baseCost * 0.005));
});

test('customer deal cases include playable profiles and resolve with them', () => {
  const model = CAR_MODELS[0];
  const inventory = [{
    id: 'car_profile_1',
    modelId: model.id,
    price: model.msrp,
    location: 'showroom',
    stockDays: 5,
  }];
  const dealCase = createCustomerDealCase({
    channelId: 'showroom',
    segment: model.segment,
    sourceDay: 6,
    stockList: inventory,
    carModels: CAR_MODELS,
    marketPrices: { [model.id]: model.msrp * 0.98 },
    activeRegion: { tradeInBoost: 0.1, pricePressure: 0 },
    salesAvgSkill: 78,
    csiScore: 91,
    getRetailQualityScore: () => 0.75,
    getPriceReality: () => ({ allowedPremium: 0.035, closeCap: 0.92, conversionAdj: 0.02, overAllowed: false }),
    estimateDealAddons: () => ({ grossProfit: 42000, rebate: 25000, derivativeProfit: 8000, financeCommission: 6000 }),
    random: fixedRandom(0.2),
    now: () => 123,
  });

  assert.equal(dealCase.status, 'pending');
  assert.ok(dealCase.profile);
  assert.ok(dealCase.profile.focus.length >= 1);
  assert.ok(dealCase.profile.objections.length >= 1);
  assert.ok(dealCase.profile.budgetCeiling >= dealCase.targetPrice);
  assert.ok(Number.isFinite(dealCase.profile.modeFit.balanced));
  assert.ok(dealCase.preferredSeries.length >= 1);
  assert.ok(dealCase.profile.sensitivity?.label);
  assert.equal(Number.isFinite(dealCase.profile.seriesFit), true);

  const result = resolveCustomerDeal({
    item: dealCase,
    mode: 'balanced',
    inventory,
    carModels: CAR_MODELS,
    finance: { ...createInitialFinance(), cash: 1000000, loan: 0 },
    monthlyStats: createInitialMonthlyStats(),
    dailyStats: { newLeads: 0, walkIns: 0, sales: 0 },
    soldVehicles: [],
    usedCars: [],
    csi: { score: 91, complaints: 0, monthScore: 0 },
    currentDay: 6,
    getPriceReality: () => ({ allowedPremium: 0.035, closeCap: 0.92, conversionAdj: 0.02, overAllowed: false }),
    estimateDealAddons: () => ({ grossProfit: 42000, rebate: 25000, derivativeProfit: 8000, financeCommission: 6000 }),
    formatMoney,
    random: fixedRandom(0),
    now: () => 456,
  });

  assert.equal(result.status, 'sold');
  assert.equal(result.soldVehicles.length, 1);
  assert.ok(result.closeChance > 0);
  assert.match(result.alert.message, /车型偏好/);
});

test('customer lifecycle stores deal outcomes and resolves follow ups', () => {
  const inventory = [
    { id: 'car_crm', modelId: CAR_MODELS[0].id, price: CAR_MODELS[0].msrp, location: 'showroom' },
  ];
  const deal = createCustomerDealCase({
    channelId: 'showroom',
    sourceDay: 8,
    stockList: inventory,
    carModels: CAR_MODELS,
    marketPrices: { [CAR_MODELS[0].id]: CAR_MODELS[0].msrp },
    activeRegion: { tradeInBoost: 0, pricePressure: 0 },
    salesAvgSkill: 82,
    csiScore: 92,
    getRetailQualityScore: () => 0.8,
    getPriceReality: () => ({ allowedPremium: 0.04, closeCap: 0.95, conversionAdj: 0.06, overAllowed: false }),
    estimateDealAddons: () => ({ grossProfit: 50000, rebate: 20000, derivativeProfit: 9000, financeCommission: 7000 }),
    random: fixedRandom(0),
    now: () => 789,
  });
  const dealResult = resolveCustomerDeal({
    item: deal,
    mode: 'balanced',
    inventory,
    carModels: CAR_MODELS,
    finance: { ...createInitialFinance(), cash: 900000, loan: 0 },
    monthlyStats: createInitialMonthlyStats(),
    dailyStats: { newLeads: 0, walkIns: 0, sales: 0 },
    soldVehicles: [],
    usedCars: [],
    csi: { score: 92, complaints: 0, monthScore: 0 },
    currentDay: 8,
    getPriceReality: () => ({ allowedPremium: 0.04, closeCap: 0.95, conversionAdj: 0.06, overAllowed: false }),
    estimateDealAddons: () => ({ grossProfit: 50000, rebate: 20000, derivativeProfit: 9000, financeCommission: 7000 }),
    formatMoney,
    random: fixedRandom(0),
    now: () => 790,
  });
  const record = createCustomerRecordFromDeal({
    currentDay: 8,
    item: deal,
    outcome: dealResult.crmOutcome,
    random: fixedRandom(0),
    now: () => 791,
  });
  const lifecycle = addCustomerRecord({ records: [], followUps: [] }, record);
  const daily = evaluateCustomerLifecycleDaily({
    activeDifficulty: { id: 'rookie', name: '新手' },
    absoluteDay: 12,
    csi: { score: 94 },
    customerLifecycle: lifecycle,
    random: fixedRandom(0),
  });
  assert.equal(daily.customerLifecycle.records.length, 1);
  assert.ok(daily.customerLifecycle.followUps.length >= 1);

  const followResult = resolveCustomerFollowUp({
    actionId: 'benefit',
    activeDifficulty: { id: 'rookie', name: '新手' },
    csi: { score: 94, complaints: 0, monthScore: 0 },
    customerLifecycle: daily.customerLifecycle,
    finance: { ...createInitialFinance(), cash: 100000 },
    followUpId: daily.customerLifecycle.followUps[0].id,
    formatMoney,
    insuranceRenewals: { pending: 0, renewed: 0, revenue: 0 },
    marketing: { leadChannels: { showroom: 0, sourcing: 0, livestream: 0, autoshow: 0 }, leads: 0 },
    monthlyStats: createInitialMonthlyStats(),
    currentDay: 12,
    random: fixedRandom(0),
  });
  assert.equal(followResult.ok, true);
  assert.equal(followResult.customerLifecycle.followUps[0].status, 'resolved');
  assert.ok(followResult.finance.cash < 100000);
});

test('sales opportunity engine generates opportunities and resolves player actions', () => {
  const pool = { active: [], history: [] };
  const opportunityStaff = {
    sales: { members: [{ id: 'sales_1', nickname: '老销售', skill: 82, stress: 35, traits: ['relationship'] }] },
    dcc: { members: [{ id: 'dcc_1', nickname: '线索王', skill: 76, stress: 42, traits: ['talker'] }] },
  };
  const daily = evaluateSalesOpportunitiesDaily({
    activeDifficulty: { id: 'rookie', name: '新手' },
    absoluteDay: 18,
    approvalCases: [{ id: 'price_case_1', type: 'price', status: 'pending', title: '客户要求批价' }],
    customerLifecycle: {
      records: [{
        id: 'crm_lost_1',
        status: 'lost',
        customerName: '测试客户',
        modelId: CAR_MODELS[0].id,
        modelName: CAR_MODELS[0].name,
        valueScore: 72,
        nextFollowUpDay: 18,
      }],
      followUps: [],
    },
    inventory: [
      { id: 'aged_car_1', modelId: CAR_MODELS[0].id, stockDays: 68, location: 'warehouse' },
      { id: 'showroom_car_1', modelId: CAR_MODELS[1].id, stockDays: 8, location: 'showroom' },
    ],
    marketing: { leadChannels: { showroom: 12, sourcing: 20, livestream: 4, autoshow: 0 }, leads: 36 },
    salesOpportunities: pool,
    staff: opportunityStaff,
  });

  assert.ok(daily.generated.length >= 3);
  assert.ok(daily.generated.some(item => item.typeId === 'lead' || item.typeId === 'test_drive'));
  assert.ok(daily.generated.some(item => item.typeId === 'quote'));
  assert.ok(daily.generated.some(item => item.typeId === 'risk'));
  assert.ok(daily.generated.every(item => item.owner?.id));
  assert.equal(daily.inboxItems.length, 1);

  const leadOpportunity = daily.salesOpportunities.active.find(item => item.status === 'new');
  const qualified = resolveSalesOpportunityAction({
    actionId: 'qualify',
    activeDifficulty: { id: 'rookie', name: '新手' },
    currentDay: 18,
    salesOpportunities: daily.salesOpportunities,
    staff: opportunityStaff,
    opportunityId: leadOpportunity.id,
    random: fixedRandom(0),
  });
  assert.equal(qualified.ok, true);
  assert.equal(qualified.success, true);
  assert.equal(qualified.salesOpportunities.active.find(item => item.id === leadOpportunity.id).status, 'qualified');
  assert.ok(qualified.customerPatch.trustDelta > 0);
  assert.ok(qualified.metadata.owner?.id);
  assert.ok(Number.isFinite(qualified.metadata.ownerModifier));
  const staffFeedback = applySalesOpportunityStaffFeedback({
    actionId: 'qualify',
    result: qualified,
    staff: opportunityStaff,
  });
  const ownerAfter = staffFeedback.staff[qualified.metadata.owner.role].members.find(member => member.id === qualified.metadata.owner.id);
  const ownerBefore = opportunityStaff[qualified.metadata.owner.role].members.find(member => member.id === qualified.metadata.owner.id);
  assert.ok(ownerAfter.xp > (ownerBefore.xp || 0));
  assert.ok(staffFeedback.logs.length >= 1);

  const invited = resolveSalesOpportunityAction({
    actionId: 'inviteTestDrive',
    activeDifficulty: { id: 'rookie', name: '新手' },
    currentDay: 18,
    salesOpportunities: qualified.salesOpportunities,
    opportunityId: leadOpportunity.id,
    random: fixedRandom(0),
    formatMoney,
  });
  assert.equal(invited.ok, true);
  assert.equal(invited.salesOpportunities.active.find(item => item.id === leadOpportunity.id).status, 'test_drive');
  assert.equal(invited.ledgerItems[0].type, 'expense');
  assert.ok(invited.metadata.cost > 0);

  const quotedOpportunity = daily.salesOpportunities.active.find(item => item.status === 'quoted' || item.typeId === 'quote');
  const closed = resolveSalesOpportunityAction({
    actionId: 'close',
    activeDifficulty: { id: 'rookie', name: '新手' },
    currentDay: 18,
    expectedGrossProfit: 42000,
    salesOpportunities: daily.salesOpportunities,
    opportunityId: quotedOpportunity.id,
    random: fixedRandom(0),
  });
  assert.equal(closed.ok, true);
  assert.equal(closed.salesOpportunities.history[0].status, 'closed');
  assert.equal(closed.ledgerItems.find(item => item.type === 'pending').amount, 42000);

  const expired = expireSalesOpportunities({
    absoluteDay: 30,
    salesOpportunities: {
      active: [{ ...leadOpportunity, id: 'expired_opp', dueDay: 18 }],
      history: [],
    },
  });
  assert.equal(expired.salesOpportunities.active.length, 0);
  assert.equal(expired.salesOpportunities.history[0].status, 'expired');
});

test('competitor countermeasures keep selected target brand or store', () => {
  const competitors = {
    stores: [
      { id: 'bmw_1', brand: 'bmw', name: '宝马东城店', isVisible: true, customerPull: 80, staffQuality: 72, priceIndex: 0.96 },
      { id: 'benz_1', brand: 'benz', name: '奔驰尊享店', isVisible: true, customerPull: 62, staffQuality: 70, priceIndex: 0.99 },
      { id: 'audi_local_1', brand: 'audi_local', name: '奥迪同城店', isVisible: true, relationship: 50 },
    ],
    cooldowns: {},
    playerCountermeasures: [],
    intelHistory: [],
  };
  const brandPlan = prepareCompetitorCountermeasure({
    type: 'price',
    competitors,
    finance: { ...createInitialFinance(), cash: 500000 },
    formatMoney,
    targetSelection: { brand: 'bmw' },
  });
  assert.equal(brandPlan.status, 'ready');
  assert.equal(brandPlan.target.brandLabels[0], '宝马');
  assert.match(brandPlan.confirm.message, /宝马/);

  const storePlan = prepareCompetitorCountermeasure({
    type: 'poach',
    competitors,
    finance: { ...createInitialFinance(), cash: 500000 },
    formatMoney,
    targetSelection: { storeId: 'benz_1' },
  });
  const settled = settleCompetitorCountermeasure({
    countermeasurePlan: storePlan,
    competitors,
    finance: { ...createInitialFinance(), cash: 500000 },
    monthlyStats: createInitialMonthlyStats(),
    month: 1,
    dayOfMonth: 12,
    formatMoney,
  });
  assert.equal(settled.competitors.playerCountermeasures[0].targetSummary, '奔驰：奔驰尊享店');
  assert.equal(settled.competitors.stores.find(store => store.id === 'benz_1').customerPull, 57);
  assert.equal(settled.competitors.stores.find(store => store.id === 'bmw_1').customerPull, 80);
});

test('competitor intel actions improve confidence and reveal hidden stores', () => {
  const competitors = {
    stores: [
      { id: 'bmw_1', brand: 'bmw', name: '宝马东城店', isVisible: true, customerPull: 80, monthlySales: 13, priceIndex: 0.96, intelConfidence: 38 },
      { id: 'benz_hidden', brand: 'benz', name: '奔驰城南店', isVisible: false, customerPull: 74, monthlySales: 9, priceIndex: 0.99 },
    ],
    cooldowns: {},
    playerCountermeasures: [],
    intelHistory: [],
  };
  const snapshot = buildCompetitorIntelSnapshot(competitors.stores[0]);
  assert.equal(snapshot.level.id, 'low');
  assert.equal(snapshot.monthlySalesLabel, '样本不足');

  const intelPlan = prepareCompetitorIntelAction({
    actionId: 'market_scout',
    activeDifficulty: { id: 'standard' },
    competitors,
    finance: { ...createInitialFinance(), cash: 100000 },
    formatMoney,
  });
  assert.equal(intelPlan.status, 'ready');
  assert.ok(intelPlan.revealStoreIds.includes('benz_hidden'));

  const settled = settleCompetitorIntelAction({
    intelPlan,
    competitors,
    finance: { ...createInitialFinance(), cash: 100000 },
    month: 1,
    dayOfMonth: 10,
    formatMoney,
  });
  const revealed = settled.competitors.stores.find(store => store.id === 'benz_hidden');
  const improved = settled.competitors.stores.find(store => store.id === 'bmw_1');
  assert.equal(revealed.isVisible, true);
  assert.equal(improved.intelConfidence, 52);
  assert.equal(settled.finance.cash, 88000);
});

test('lost customer profiles feed competitor intel', () => {
  const competitors = {
    stores: [
      { id: 'bmw_1', brand: 'bmw', name: '宝马东城店', isVisible: true, customerPull: 70, priceIndex: 0.97, intelConfidence: 42 },
      { id: 'ev_hidden', brand: 'ev', name: '理想直营店', isVisible: false, customerPull: 82, priceIndex: 0.99, intelConfidence: 24 },
      { id: 'benz_1', brand: 'benz', name: '奔驰尊享店', isVisible: true, customerPull: 62, priceIndex: 1.0, intelConfidence: 50 },
    ],
    intelHistory: [],
  };
  const record = {
    customerName: '陈先生',
    status: 'lost',
    modelName: 'Q5L',
    segment: '家庭',
    outcomeMode: 'margin',
    outcomeReason: '客户观望或转向竞品',
    profile: {
      competitorPull: 0.68,
      objections: ['竞品/同城报价更低', '还要回去和家人商量'],
    },
  };
  const result = applyCustomerLossCompetitorIntel({
    competitors,
    record,
    month: 1,
    dayOfMonth: 12,
  });
  const evStore = result.competitors.stores.find(store => store.id === 'ev_hidden');
  assert.equal(result.changed, true);
  assert.equal(result.signal.brand, 'ev');
  assert.equal(evStore.isVisible, true);
  assert.ok(evStore.intelConfidence > 24);
  assert.match(result.competitors.intelHistory[0].content, /陈先生/);
});

test('operating events are configurable, actionable, and difficulty weighted', () => {
  const baseFinance = { ...createInitialFinance(), cash: 800000, loan: 8200000, creditLimit: 10000000 };
  const result = evaluateOperatingEvents({
    activeDifficulty: { id: 'hardcore', name: '硬核' },
    activeRegion: { competitorChance: 0.8, demand: 1.1 },
    absoluteDay: 16,
    csi: { score: 78, complaints: 0, monthScore: 0 },
    dayOfMonth: 16,
    finance: baseFinance,
    formatMoney,
    inventory: [
      { id: 'aged1', stockDays: 72 },
      { id: 'aged2', stockDays: 80 },
      { id: 'aged3', stockDays: 91 },
    ],
    marketing: { leadChannels: { showroom: 0, sourcing: 0, livestream: 0, autoshow: 0 }, leads: 0 },
    monthlyStats: { ...createInitialMonthlyStats(), target: 18, sales: 4 },
    operatingEvents: { pending: [], resolved: [] },
    salesCount: 2,
    random: fixedRandom(0),
  });

  assert.ok(result.triggeredEvents.length >= 1);
  assert.ok(result.pendingEvents.length >= 1);
  assert.ok(result.logs.length >= 1);
  assert.ok(result.inboxItems.length >= 1);

  const pendingEvent = result.pendingEvents.find(event => event.tone === 'risk') || result.pendingEvents[0];
  const resolved = resolveOperatingEvent({
    activeDifficulty: { id: 'hardcore', name: '硬核' },
    csi: { score: 78, complaints: 0, monthScore: 0 },
    eventInstance: pendingEvent,
    finance: baseFinance,
    formatMoney,
    marketing: { leadChannels: { showroom: 0, sourcing: 0, livestream: 0, autoshow: 0 }, leads: 0 },
    monthlyStats: { ...createInitialMonthlyStats(), target: 18, sales: 4 },
    operatingEvents: { pending: result.pendingEvents, resolved: [] },
    optionId: pendingEvent.tone === 'risk' ? 'contain_now' : 'commit_resources',
    random: fixedRandom(0),
    resolvedDay: 16,
  });

  assert.equal(resolved.ok, true);
  assert.equal(resolved.operatingEvents.pending.length, result.pendingEvents.length - 1);
  assert.equal(resolved.operatingEvents.resolved.length, 1);
  assert.ok(resolved.finance.cash <= baseFinance.cash);
  assert.ok(resolved.logs.length >= 1);
});

test('operating events expire into resolved history', () => {
  const baseFinance = { ...createInitialFinance(), cash: 800000, loan: 8200000, creditLimit: 10000000 };
  const expired = settleExpiredOperatingEvents({
    activeDifficulty: { id: 'standard', name: '标准' },
    absoluteDay: 20,
    csi: { score: 78, complaints: 0, monthScore: 0 },
    finance: baseFinance,
    formatMoney,
    marketing: { leadChannels: { showroom: 0, sourcing: 0, livestream: 0, autoshow: 0 }, leads: 0 },
    monthlyStats: { ...createInitialMonthlyStats(), target: 18, sales: 4 },
    operatingEvents: {
      pending: [{
        id: 'op_evt_bank_credit_recheck_16',
        eventTypeId: 'bank_credit_recheck',
        day: 16,
        expiresOn: 18,
        from: '合作银行',
        title: '银行临时授信复核',
        body: '银行复核库存融资。',
        tone: 'risk',
        status: 'pending',
      }],
      resolved: [],
    },
  });

  assert.equal(expired.operatingEvents.pending.length, 0);
  assert.equal(expired.operatingEvents.resolved.length, 1);
  assert.ok(expired.logs.length >= 1);
  assert.ok(expired.finance.creditLimit < baseFinance.creditLimit);
});

console.log('All smoke tests passed.');
