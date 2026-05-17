import { ACHIEVEMENTS } from '../game/config/achievements.js';
import { LEAD_CHANNELS } from '../game/config/marketing.js';
import { CAR_MODELS } from '../game/config/vehicles.js';
import { settleDueDraftsForDay } from '../game/engine/draftSettlement.js';
import { evaluateOperatingEvents, settleExpiredOperatingEvents } from '../game/engine/operatingEvents.js';
import { calculateDailyOperatingCosts, applyDailyOperatingCosts } from '../game/engine/operatingCosts.js';
import { calculateMonthlyRebateSettlement } from '../game/engine/monthEndSettlement.js';
import { createNextMonthlyStats, resetVirtualSalesMonth } from '../game/engine/monthlyStats.js';
import { applyAnnualGmDividendAndDraftCredit, payGmMonthlySalary } from '../game/engine/gmCompensation.js';
import { settleMonthlyManufacturerPolicy } from '../game/engine/manufacturerPolicy.js';
import { rollNextMonthPurchaseTarget, settleMonthlyPurchaseTarget } from '../game/engine/manufacturerPurchaseTargets.js';
import { settleMonthlyManufacturerCommitments } from '../game/engine/manufacturerCommitments.js';
import { evaluateScenarioEnding } from '../game/engine/scenarioEnding.js';
import { buildCreditRiskInboxItem, repayGmBailoutIfCovered } from '../game/engine/gmBailout.js';
import { settleVirtualSalesAudit } from '../game/engine/virtualSalesAudit.js';
import { settleCompetitorMonthlyReport } from '../game/engine/competitorMonthlyReport.js';
import { buildMarketEnvironmentMonthlyMessages, buildMarketEnvironmentStartMessages, createNextMarketEnvironment as createNextMarketEnvironmentCore } from '../game/engine/marketEnvironment.js';
import { settleArrivingOrders } from '../game/engine/orderArrival.js';
import { expirePendingCases } from '../game/engine/pendingCaseExpiry.js';
import { generateDailyMarketingLeads, normalizeMarketingBudgetState } from '../game/engine/marketingEngine.js';
import { processDailyWalkIns } from '../game/engine/leadProcessing.js';
import { advanceCompetitorDailyState } from '../game/engine/competitorDailyUpdate.js';
import { settleActiveMarketingActivities } from '../game/engine/marketingActivities.js';
import { settleStaffTurnover } from '../game/engine/staffTurnover.js';
import { advanceDailyStaffProgression } from '../game/engine/staffProgression.js';
import { settleDailyVehicleSales } from '../game/engine/dailyVehicleSales.js';
import { settleUsedCarDailyStock } from '../game/engine/usedCarDailyStock.js';
import { settleAfterSalesDailyService } from '../game/engine/afterSalesDailyService.js';
import { updateDailyCsi } from '../game/engine/csiDailyUpdate.js';
import { settleVehicleDailyFinance } from '../game/engine/vehicleDailyFinance.js';
import { evaluateDailyRiskChecks } from '../game/engine/dailyRiskChecks.js';
import { updateDailyMarketPrices } from '../game/engine/marketPriceDailyUpdate.js';
import { settleMonthlyInvestorReview } from '../game/engine/monthlyInvestorSettlement.js';
import { evaluateStoryEvents } from '../game/engine/storyEventEngine.js';
import { evaluateStaffStoryMoments, mergeStaffStoryMemoryPatch } from '../game/engine/staffStoryEngine.js';
import { evaluateCustomerLifecycleDaily } from '../game/engine/customerLifecycle.js';
import { evaluateSalesOpportunitiesDaily, expireSalesOpportunities } from '../game/engine/salesOpportunities.js';
import { traitSum } from '../game/engine/staffing.js';
import { buildAfterSalesStateAfterTurn, buildCsiStateAfterTurn, buildInsuranceRenewalsAfterTurn, buildStaffStateAfterTurn } from '../game/state/dayEndState.js';
import { writeDailyAutoSave } from './dailyAdvanceAutoSave.js';

const buildStaffStorySnapshot = ({ staff, afterSales }) => ({
  ...staff,
  tech: {
    salary: afterSales?.salary || 200,
    members: afterSales?.technicians || [],
  },
});

export function runDailyAdvance(c) {
  const {
    activeDifficulty,
    activeInvestor,
    activeMarketSize,
    activeRegion,
    activeScenario,
    afterSales,
    approvalCases,
    buildFeedbackState,
    createComplaintCase,
    createCustomerDealCase,
    createPriceApprovalCase,
    competitors,
    csi,
    customerLifecycle,
    customerDeals,
    salesOpportunities,
    dailyLedger,
    day,
    dayOfMonth,
    dealerRegionId,
    dccAvgSkill,
    dccCount,
    difficultyMode,
    drafts,
    endingSummary,
    facility,
    feedback,
    finance,
    formatMoney,
    gameState,
    getActiveCountermeasureValue,
    getCompanyDailyBurn,
    getCompetitorPressure,
    getConfiguredModelPrice,
    getDynamicMsrp,
    getDynamicRebate,
    getPriceReality,
    getSaveSlots,
    gmWealth,
    inventory,
    insuranceRenewals,
    investorProfileId,
    investorRelations,
    isAdvancingDay,
    isFreeScenario,
    logs,
    managerInbox,
    manufacturerPolicy,
    marketEnvironment,
    marketPrices,
    marketing,
    modelPriceOverrides,
    month,
    monthlyStats,
    operatingEvents,
    pendingOrders,
    salesAvgSkill,
    salesCount,
    scenarioDurationDays,
    scenarioId,
    serviceAvgSkill,
    serviceCount,
    setAfterSales,
    setApprovalCases,
    setCompetitors,
    setCsi,
    setCustomerLifecycle,
    setCustomerDeals,
    setSalesOpportunities,
    setDailyLedger,
    setDailyStats,
    setDay,
    setDrafts,
    setEndingModalDismissed,
    setEndingSummary,
    setFeedback,
    setFinance,
    setGameState,
    setGmWealth,
    setInsuranceRenewals,
    setInventory,
    setInvestorRelations,
    setIsAdvancingDay,
    setLogs,
    setManagerInbox,
    setManufacturerPolicy,
    setMarketEnvironment,
    setMarketing,
    setMarketPrices,
    setMonthlyStats,
    setOperatingEvents,
    setMonthlySummaryModal,
    setPendingOrders,
    setSoldVehicles,
    setStoryState,
    setStaffStoryMemory,
    setStaff,
    setUsedCars,
    setVirtualSales,
    soldVehicles,
    storyState,
    staffStoryMemory,
    staff,
    strategy,
    streamerAvgSkill,
    streamerCount,
    techAvgSkill,
    techCount,
    testDriveCars,
    tutorial,
    usedCarShowroom,
    usedCars,
    virtualSales,
  } = c;
    if (gameState !== 'playing' || isAdvancingDay) return;
    setIsAdvancingDay(true);

    let f = { ...finance };
    let m = normalizeMarketingBudgetState(marketing);
    let currentCsi = { ...csi };
    let currentLogs = [];
    let inboxItems = [];
    let expiredCsiPenalty = 0;
    let expiredComplaintCount = 0;
    let terminalStop = false;
    let nextEndingSummary = endingSummary;
    const previousStaffStorySnapshot = buildStaffStorySnapshot({ staff, afterSales });
    const expiredCases = expirePendingCases({ approvalCases, customerDeals, absoluteDay: day + 1 });
    let nextApprovalCases = expiredCases.approvalCases;
    let nextCustomerDeals = expiredCases.customerDeals;
    expiredCsiPenalty = expiredCases.expiredCsiPenalty;
    expiredComplaintCount = expiredCases.expiredComplaintCount;
    currentLogs.push(...expiredCases.logs);
    let nextInvestorRelations = { ...investorRelations };
    let nextOperatingEvents = {
      pending: Array.isArray(operatingEvents?.pending) ? [...operatingEvents.pending] : [],
      resolved: Array.isArray(operatingEvents?.resolved) ? [...operatingEvents.resolved] : [],
    };
    let nextCustomerLifecycle = {
      records: Array.isArray(customerLifecycle?.records) ? [...customerLifecycle.records] : [],
      followUps: Array.isArray(customerLifecycle?.followUps) ? [...customerLifecycle.followUps] : [],
    };
    const expiredSalesOpportunities = expireSalesOpportunities({
      absoluteDay: day + 1,
      salesOpportunities,
    });
    let nextSalesOpportunities = expiredSalesOpportunities.salesOpportunities;
    currentLogs.push(...expiredSalesOpportunities.logs);
    let stats = { newLeads: 0, walkIns: 0, sales: 0 };
    let mStats = { ...monthlyStats }; 
    let nextDrafts = { ...drafts, activeDrafts: (drafts.activeDrafts || []).map(d => ({ ...d })) };
    let nextGmWealth = { ...gmWealth };
    const gmMoraleScore = nextGmWealth.morale ?? 80;
    const gmEfficiency = gmMoraleScore >= 90 ? 1.05 : gmMoraleScore >= 70 ? 1 : gmMoraleScore >= 45 ? 0.94 : 0.86;
    let nextVirtualSales = { ...virtualSales, virtualCars: (virtualSales.virtualCars || []).map(car => ({ ...car, floatingMonths: Math.max(0, Math.floor((month - (car.virtualMonth || month)) || 0)) })) };
    let nextCompetitors = {
      ...competitors,
      stores: (competitors.stores || []).map(store => ({
        ...store,
        currentActivity: store.currentActivity ? { ...store.currentActivity } : null,
        cooperation: store.cooperation ? { ...store.cooperation } : null,
      })),
      playerCountermeasures: (competitors.playerCountermeasures || []).map(item => ({ ...item })),
      intelHistory: [...(competitors.intelHistory || [])],
      cooldowns: { ...(competitors.cooldowns || {}) },
    };

    const {
      rent,
      depreciation,
      salaries,
      interest,
      warehouseCarCount,
      storageCost,
      leadPurchaseBudget,
      livestreamBudget,
      dailyMarketingBudget,
      dailyExpenses,
    } = calculateDailyOperatingCosts({
      facility,
      staff,
      afterSales,
      marketing: m,
      finance: f,
      inventory,
      includeRetentionBonus: true,
    });

    // === 记录当日财务流水 ===
    const operatingCostSettlement = applyDailyOperatingCosts({
      finance: f,
      monthlyStats: mStats,
      costs: { rent, depreciation, salaries, interest, warehouseCarCount, storageCost, leadPurchaseBudget, livestreamBudget, dailyMarketingBudget, dailyExpenses },
      employeeCount: dccCount + salesCount + serviceCount + streamerCount + techCount,
    });
    f = operatingCostSettlement.finance;
    mStats = operatingCostSettlement.monthlyStats;
    let todayLedger = [...operatingCostSettlement.ledgerItems];

    const staffTurnover = settleStaffTurnover({
      staff,
      afterSales,
      regionTurnover: activeRegion.turnover || 1,
      absoluteDay: day + 1,
    });
    const lostMembers = staffTurnover.lostMembers;
    currentLogs.push(...staffTurnover.logs);
    let updatedDccMembers = staffTurnover.dccMembers;
    let updatedSalesMembers = staffTurnover.salesMembers;
    let updatedServiceMembers = staffTurnover.serviceMembers;
    let updatedStreamerMembers = staffTurnover.streamerMembers;
    let updatedTechMembers = staffTurnover.techMembers;

    if (f.cash < 0) { f.loan += Math.abs(f.cash); f.cash = 0; }
    if (f.loan > f.creditLimit) {
      setGameState('bankrupt');
      currentLogs.push({ day: day + 1, type: 'expense', message: `【破产警告】贷款超额 (超 ${formatMoney(f.creditLimit)})，资金链彻底断裂！` });
      setFinance(f); setLogs(prev => [...prev, ...currentLogs]);
      setIsAdvancingDay(false);
      return;
    }

    const draftSettlement = settleDueDraftsForDay({
      finance: f,
      drafts: nextDrafts,
      gmWealth: nextGmWealth,
      absoluteDay: day + 1,
      formatMoney,
    });
    f = draftSettlement.finance;
    nextDrafts = draftSettlement.drafts;
    nextGmWealth = draftSettlement.gmWealth;
    todayLedger.push(...draftSettlement.ledgerItems);
    currentLogs.push(...draftSettlement.logs);
    inboxItems.push(...draftSettlement.inboxItems);
    const draftPenaltyToday = draftSettlement.draftPenaltyToday;
    if (draftPenaltyToday > 0) {
      mStats.financeCost += draftPenaltyToday;
      mStats.draftPenalty = (mStats.draftPenalty || 0) + draftPenaltyToday;
      todayLedger.push({ label: '汇票逾期罚息计提', amount: draftPenaltyToday, type: 'pending' });
      currentLogs.push({ day: day + 1, type: 'warning', message: `🏦【逾期罚息】未结清汇票产生罚息 ${formatMoney(draftPenaltyToday)}，已计入逾期应付。` });
    }

    const expiredOperatingEvents = settleExpiredOperatingEvents({
      activeDifficulty,
      absoluteDay: day + 1,
      csi: currentCsi,
      finance: f,
      formatMoney,
      marketing: m,
      monthlyStats: mStats,
      operatingEvents: nextOperatingEvents,
    });
    f = expiredOperatingEvents.finance;
    m = expiredOperatingEvents.marketing;
    mStats = expiredOperatingEvents.monthlyStats;
    currentCsi = expiredOperatingEvents.csi;
    nextOperatingEvents = expiredOperatingEvents.operatingEvents;
    todayLedger.push(...expiredOperatingEvents.ledgerItems);
    currentLogs.push(...expiredOperatingEvents.logs);
    inboxItems.push(...expiredOperatingEvents.inboxItems);

    const dailyMarketingLeads = generateDailyMarketingLeads({
      marketing: m,
      monthlyStats: mStats,
      stats,
      leadPurchaseBudget,
      livestreamBudget,
      activeRegion,
      streamerCount,
      streamerAvgSkill,
      streamerLeadBonus: traitSum('streamer', staff.streamer?.members || [], 'leadBonus'),
      absoluteDay: day + 1,
    });
    m = dailyMarketingLeads.marketing;
    mStats = dailyMarketingLeads.monthlyStats;
    stats = dailyMarketingLeads.stats;
    const livestreamLeads = dailyMarketingLeads.livestreamLeads;
    currentLogs.push(...dailyMarketingLeads.logs);

    // === 活动效果：结算进行中的活动 ===
    const activitySettlement = settleActiveMarketingActivities({
      marketing: m,
      previousDay: day,
      absoluteDay: day + 1,
    });
    m = activitySettlement.marketing;
    const { activeDccWalkinBonus, activeNaturalBonus, activeConvBonus } = activitySettlement.bonuses;
    currentLogs.push(...activitySettlement.logs);

    const competitorDailyState = advanceCompetitorDailyState({
      competitors: nextCompetitors,
      dayOfMonth,
      absoluteDay: day + 1,
    });
    nextCompetitors = competitorDailyState.competitors;
    currentLogs.push(...competitorDailyState.logs);

    const operatingEventResult = evaluateOperatingEvents({
      activeDifficulty,
      activeRegion,
      absoluteDay: day + 1,
      csi: currentCsi,
      dayOfMonth,
      finance: f,
      inventory,
      marketing: m,
      monthlyStats: mStats,
      operatingEvents: nextOperatingEvents,
      salesCount,
    });
    nextOperatingEvents = {
      ...nextOperatingEvents,
      pending: [...nextOperatingEvents.pending, ...operatingEventResult.pendingEvents].slice(-24),
    };
    currentLogs.push(...operatingEventResult.logs);
    inboxItems.push(...operatingEventResult.inboxItems);

    const customerLifecycleDaily = evaluateCustomerLifecycleDaily({
      activeDifficulty,
      absoluteDay: day + 1,
      csi: currentCsi,
      customerLifecycle: nextCustomerLifecycle,
    });
    nextCustomerLifecycle = customerLifecycleDaily.customerLifecycle;
    currentLogs.push(...customerLifecycleDaily.logs);
    inboxItems.push(...customerLifecycleDaily.inboxItems);

    const salesOpportunityDaily = evaluateSalesOpportunitiesDaily({
      activeDifficulty,
      absoluteDay: day + 1,
      approvalCases: nextApprovalCases,
      customerLifecycle: nextCustomerLifecycle,
      inventory,
      marketing: m,
      salesOpportunities: nextSalesOpportunities,
      staff,
    });
    nextSalesOpportunities = salesOpportunityDaily.salesOpportunities;
    currentLogs.push(...salesOpportunityDaily.logs);
    inboxItems.push(...salesOpportunityDaily.inboxItems);

    // === DCC 线索处理 ===
    const competitorPressure = getCompetitorPressure(nextCompetitors);
    const playerPriceBoost = getActiveCountermeasureValue('price', nextCompetitors);
    const playerServiceBoost = getActiveCountermeasureValue('service', nextCompetitors);
    const walkInProcessing = processDailyWalkIns({
      marketing: m,
      monthlyStats: mStats,
      stats,
      dccCount,
      dccAvgSkill,
      dccCapacityBonus: traitSum('dcc', staff.dcc.members, 'capacityBonus'),
      gmEfficiency,
      activeDccWalkinBonus,
      activeNaturalBonus,
      competitorPressure,
      playerPriceBoost,
      playerServiceBoost,
      streamerAvgSkill,
      streamerLivestreamWalkinBonus: traitSum('streamer', staff.streamer?.members || [], 'livestreamWalkinBonus'),
      inventory,
      facility,
      marketEnvironment,
      activeRegion,
      salesCount,
      absoluteDay: day + 1,
    });
    m = walkInProcessing.marketing;
    mStats = walkInProcessing.monthlyStats;
    stats = walkInProcessing.stats;
    const processedLeads = walkInProcessing.processedLeads;
    const dccWalkIns = walkInProcessing.dccWalkIns;
    const naturalWalkIns = walkInProcessing.naturalWalkIns;
    const totalWalkIns = walkInProcessing.totalWalkIns;
    const processedByChannel = walkInProcessing.processedByChannel;
    const salesCapacity = walkInProcessing.salesCapacity;
    const handledCustomers = walkInProcessing.handledCustomers;
    currentLogs.push(...walkInProcessing.logs);
    
    // === 在途车辆到货检查 ===
    const orderArrival = settleArrivingOrders({
      pendingOrders,
      inventory,
      facility,
      absoluteDay: day + 1,
      getConfiguredModelPrice,
    });
    let updatedInventory = orderArrival.inventory;
    const remainingOrders = orderArrival.pendingOrders;
    currentLogs.push(...orderArrival.logs);
    const dailyVehicleSales = settleDailyVehicleSales({
      carModels: CAR_MODELS,
      inventory: updatedInventory,
      virtualSales: nextVirtualSales,
      approvalCases: nextApprovalCases,
      customerDeals: nextCustomerDeals,
      monthlyStats: mStats,
      stats,
      handledCustomers,
      testDriveCars,
      marketPrices,
      marketEnvironment,
      activeRegion,
      facility,
      salesAvgSkill,
      salesFinanceBonus: staff.sales.members.length > 0 ? traitSum('sales', staff.sales.members, 'financeBonus') / staff.sales.members.length : 0,
      salesPriceKillerBonus: staff.sales.members.length > 0 ? traitSum('sales', staff.sales.members, 'priceSensitivity') / staff.sales.members.length : 0,
      strategy,
      csi: currentCsi,
      gmMoraleScore,
      activeConvBonus,
      competitorPressure,
      playerServiceBoost,
      processedByChannel,
      naturalWalkIns,
      leadChannels: LEAD_CHANNELS,
      absoluteDay: day + 1,
      getPriceReality,
      getDynamicMsrp,
      getDynamicRebate,
      createPriceApprovalCase,
      createCustomerDealCase,
      formatMoney,
    });
    updatedInventory = dailyVehicleSales.inventory;
    nextVirtualSales = dailyVehicleSales.virtualSales;
    nextApprovalCases = dailyVehicleSales.approvalCases;
    nextCustomerDeals = dailyVehicleSales.customerDeals;
    mStats = dailyVehicleSales.monthlyStats;
    stats = dailyVehicleSales.stats;
    currentLogs.push(...dailyVehicleSales.logs);
    const {
      revenue,
      cogs,
      rebates,
      dailyDerivRev,
      dailyDerivCost,
      dailyFinanceComm,
      dailyTradeInCount,
      dailyTradeInSubsidy,
      dailyUsedCarPurchaseCost,
      newSoldVehicles,
      soldCarsSummary,
    } = dailyVehicleSales;

    const usedCarDailyStock = settleUsedCarDailyStock({
      usedCars,
      newSoldVehicles,
      finance: f,
      monthlyStats: mStats,
      ledgerItems: todayLedger,
      absoluteDay: day + 1,
    });
    f = usedCarDailyStock.finance;
    mStats = usedCarDailyStock.monthlyStats;
    todayLedger = usedCarDailyStock.ledgerItems;
    currentLogs.push(...usedCarDailyStock.logs);
    const finalUsedCars = usedCarDailyStock.usedCars;

    // 更新已售车辆追踪
    const newSoldCarRecords = newSoldVehicles.filter(v => v.type === 'newCar').map(v => ({
      id: `sv_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      modelId: v.modelId, modelName: v.modelName, soldDay: v.soldDay,
    }));
    const updatedSoldVehicles = [...soldVehicles, ...newSoldCarRecords];

    const afterSalesDailyService = settleAfterSalesDailyService({
      soldVehicles: updatedSoldVehicles,
      finance: f,
      monthlyStats: mStats,
      ledgerItems: todayLedger,
      afterSales,
      staff,
      techCount,
      techAvgSkill,
      serviceCount,
      serviceAvgSkill,
      absoluteDay: day + 1,
    });
    f = afterSalesDailyService.finance;
    mStats = afterSalesDailyService.monthlyStats;
    todayLedger = afterSalesDailyService.ledgerItems;
    const {
      dailyAsRevenue,
      asOrdersHandled,
      renewalEligible,
      dailyInsRevenue,
    } = afterSalesDailyService;

    const dailyCsiUpdate = updateDailyCsi({
      csi: currentCsi,
      marketing: m,
      monthlyStats: mStats,
      approvalCases: nextApprovalCases,
      staff,
      afterSales,
      activeRegion,
      serviceCount,
      serviceAvgSkill,
      techAvgSkill,
      salesAvgSkill,
      dailyAsRevenue,
      expiredCsiPenalty,
      absoluteDay: day + 1,
      createComplaintCase,
    });
    m = dailyCsiUpdate.marketing;
    mStats = dailyCsiUpdate.monthlyStats;
    nextApprovalCases = dailyCsiUpdate.approvalCases;
    currentLogs.push(...dailyCsiUpdate.logs);
    const {
      newCsiScore,
      complaintOccurred,
      complaintMsg,
    } = dailyCsiUpdate;

    const vehicleDailyFinance = settleVehicleDailyFinance({
      inventory: updatedInventory,
      finance: f,
      monthlyStats: mStats,
      ledgerItems: todayLedger,
      carModels: CAR_MODELS,
      activeRegion,
      storageCost,
      stats,
      handledCustomers,
      revenue,
      cogs,
      rebates,
      dailyDerivRev,
      dailyDerivCost,
      dailyFinanceComm,
      dailyTradeInCount,
      dailyTradeInSubsidy,
      dailyUsedCarPurchaseCost,
      soldCarsSummary,
      absoluteDay: day + 1,
      formatMoney,
    });
    updatedInventory = vehicleDailyFinance.inventory;
    f = vehicleDailyFinance.finance;
    mStats = vehicleDailyFinance.monthlyStats;
    todayLedger = vehicleDailyFinance.ledgerItems;
    currentLogs.push(...vehicleDailyFinance.logs);

    const dailyRiskChecks = evaluateDailyRiskChecks({
      finance: f,
      totalWalkIns,
      salesCapacity,
      salesCount,
      absoluteDay: day + 1,
      formatMoney,
    });
    f = dailyRiskChecks.finance;
    currentLogs.push(...dailyRiskChecks.logs);
    if (dailyRiskChecks.bankrupt) {
      setGameState('bankrupt');
      setFinance(f); setLogs(prev => [...prev, ...currentLogs]);
      setIsAdvancingDay(false);
      return;
    }

    const staffProgression = advanceDailyStaffProgression({
      dccMembers: updatedDccMembers,
      salesMembers: updatedSalesMembers,
      serviceMembers: updatedServiceMembers,
      streamerMembers: updatedStreamerMembers,
      techMembers: updatedTechMembers,
      dccCount,
      salesCount,
      serviceCount,
      streamerCount,
      techCount,
      processedLeads,
      dccWalkIns,
      handledCustomers,
      salesCapacity,
      sales: stats.sales,
      asOrdersHandled,
      complaintOccurred,
      complaintMsg,
      newCsiScore,
      livestreamBudget,
      livestreamLeads,
      absoluteDay: day + 1,
    });
    currentLogs.push(...staffProgression.logs);
    updatedDccMembers = staffProgression.dccMembers;
    updatedSalesMembers = staffProgression.salesMembers;
    updatedServiceMembers = staffProgression.serviceMembers;
    updatedStreamerMembers = staffProgression.streamerMembers;
    updatedTechMembers = staffProgression.techMembers;

    if (storageCost > 0) {
      currentLogs.push({ day: day + 1, type: 'expense', message: `📦 仓储费用: ${warehouseCarCount} 台车 × ¥50/天 = ${formatMoney(storageCost)}（含仓储保险/折旧/维护）` });
    }

    let newMarketPrices = updateDailyMarketPrices({
      marketPrices,
      carModels: CAR_MODELS,
      inventory: updatedInventory,
      marketEnvironment,
      activeRegion,
      getDynamicMsrp,
    });

    let newMarketEnvironment = marketEnvironment;
    let newManufacturerPolicy = manufacturerPolicy;
    let monthlyFeedbackReport = null;
    let dismissedByInvestor = false;
    if (dayOfMonth === 1) {
      const marketEnvironmentStartMessages = buildMarketEnvironmentStartMessages({
        environment: marketEnvironment,
        absoluteDay: day + 1,
      });
      currentLogs.push(marketEnvironmentStartMessages.log);
      inboxItems.push(marketEnvironmentStartMessages.inboxItem);
    }

    if (dayOfMonth === 30) {
      const rebateSettlement = calculateMonthlyRebateSettlement({
        monthStats: mStats,
        csiScore: newCsiScore,
        finance: f,
        facility,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = rebateSettlement.finance;
      todayLedger.push(...rebateSettlement.ledgerItems);
      currentLogs.push(...rebateSettlement.logs);
      const {
        achieveRate,
        processPassed,
        finalPayout,
      } = rebateSettlement;

      const investorSettlement = settleMonthlyInvestorReview({
        month,
        monthStats: mStats,
        finance: f,
        investorRelations: nextInvestorRelations,
        gmWealth: nextGmWealth,
        stockList: updatedInventory,
        csiScore: newCsiScore,
        lostCount: lostMembers.length,
        overdueDraftCount: (nextDrafts.activeDrafts || []).filter(d => d.status === 'defaulted').length,
        investor: activeInvestor,
        facility,
        companyDailyBurn: getCompanyDailyBurn(),
        priceWarActive: competitors.priceWarActive,
        finalPayout,
        currentDay: day,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = investorSettlement.finance;
      nextInvestorRelations = investorSettlement.investorRelations;
      nextGmWealth = investorSettlement.gmWealth;
      monthlyFeedbackReport = investorSettlement.monthlyFeedbackReport;
      todayLedger.push(...investorSettlement.ledgerItems);
      currentLogs.push(...investorSettlement.logs);
      inboxItems.push(...investorSettlement.inboxItems);
      setInvestorRelations(nextInvestorRelations);
      if (investorSettlement.dismissedByInvestor) {
        setGameState('dismissed');
        dismissedByInvestor = true;
      }

      const virtualAudit = settleVirtualSalesAudit({
        finance: f,
        monthlyStats: mStats,
        virtualSales: nextVirtualSales,
        gmWealth: nextGmWealth,
        month,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = virtualAudit.finance;
      mStats = virtualAudit.monthlyStats;
      nextVirtualSales = virtualAudit.virtualSales;
      nextGmWealth = virtualAudit.gmWealth;
      todayLedger.push(...virtualAudit.ledgerItems);
      currentLogs.push(...virtualAudit.logs);

      const competitorReport = settleCompetitorMonthlyReport({
        competitors: nextCompetitors,
        monthlyStats: mStats,
        finance: f,
        month,
        dayOfMonth,
        absoluteDay: day + 1,
        formatMoney,
      });
      nextCompetitors = competitorReport.competitors;
      mStats = competitorReport.monthlyStats;
      f = competitorReport.finance;
      todayLedger.push(...competitorReport.ledgerItems);
      currentLogs.push(...competitorReport.logs);

      const commitmentSettlement = settleMonthlyManufacturerCommitments({
        manufacturerPolicy: newManufacturerPolicy,
        monthlyStats: mStats,
        csi: { ...currentCsi, score: newCsiScore },
        activeDifficulty,
        month,
        absoluteDay: day + 1,
        formatMoney,
      });
      newManufacturerPolicy = commitmentSettlement.manufacturerPolicy;
      currentLogs.push(...commitmentSettlement.logs);
      inboxItems.push(...commitmentSettlement.inboxItems);

      const purchaseTargetSettlement = settleMonthlyPurchaseTarget({
        manufacturerPolicy: newManufacturerPolicy,
        finance: f,
        activeDifficulty,
        month,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = purchaseTargetSettlement.finance;
      newManufacturerPolicy = purchaseTargetSettlement.manufacturerPolicy;
      todayLedger.push(...purchaseTargetSettlement.ledgerItems);
      currentLogs.push(...purchaseTargetSettlement.logs);
      inboxItems.push(...purchaseTargetSettlement.inboxItems);

      const nextMonthStats = createNextMonthlyStats({
        previousStats: mStats,
        difficulty: activeDifficulty,
        finalPayout,
        achieveRate,
        processPassed,
        csiScore: newCsiScore,
        investorReview: investorSettlement.investorReview,
      });
      mStats = nextMonthStats.monthlyStats;
      nextVirtualSales = resetVirtualSalesMonth(nextVirtualSales, nextMonthStats.nextMonthTarget);

      const nextMonthNo = month + 1;
      const annualCompensation = applyAnnualGmDividendAndDraftCredit({
        finance: f,
        gmWealth: nextGmWealth,
        drafts: nextDrafts,
        nextMonthNo,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = annualCompensation.finance;
      nextGmWealth = annualCompensation.gmWealth;
      nextDrafts = annualCompensation.drafts;
      todayLedger.push(...annualCompensation.ledgerItems);
      currentLogs.push(...annualCompensation.logs);

      const gmSalaryPayment = payGmMonthlySalary({
        finance: f,
        gmWealth: nextGmWealth,
        monthlyStats: mStats,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = gmSalaryPayment.finance;
      nextGmWealth = gmSalaryPayment.gmWealth;
      mStats = gmSalaryPayment.monthlyStats;
      todayLedger.push(...gmSalaryPayment.ledgerItems);
      currentLogs.push(...gmSalaryPayment.logs);
      if (gmSalaryPayment.bankrupt) {
        setGameState('bankrupt');
        terminalStop = true;
      }

      // === 厂家商务政策月度更新 ===
      if (!terminalStop) {
      const monthlyManufacturerPolicy = settleMonthlyManufacturerPolicy({
        manufacturerPolicy: newManufacturerPolicy,
        achieveRate,
        inventory: updatedInventory,
        carModels: CAR_MODELS,
        modelPriceOverrides,
        currentMarketEnvironment: marketEnvironment,
        activeRegion,
        absoluteDay: day + 1,
        buildNextMarketEnvironment: createNextMarketEnvironmentCore,
        buildMarketEnvironmentMonthlyMessages,
      });
      updatedInventory = monthlyManufacturerPolicy.inventory;
      newManufacturerPolicy = rollNextMonthPurchaseTarget({
        manufacturerPolicy: monthlyManufacturerPolicy.manufacturerPolicy,
        nextMonth: nextMonthNo,
        nextMonthSalesTarget: nextMonthStats.nextMonthTarget,
        activeDifficulty,
      });
      setManufacturerPolicy(newManufacturerPolicy);
      newMarketEnvironment = monthlyManufacturerPolicy.marketEnvironment;
      setMarketEnvironment(newMarketEnvironment);
      currentLogs.push(...monthlyManufacturerPolicy.logs);
      inboxItems.push(...monthlyManufacturerPolicy.inboxItems);
      }
    }

    if (!terminalStop) {
      const bailoutRepayment = repayGmBailoutIfCovered({
        finance: f,
        gmWealth: nextGmWealth,
        dailyExpenses,
        absoluteDay: day + 1,
        formatMoney,
      });
      f = bailoutRepayment.finance;
      nextGmWealth = bailoutRepayment.gmWealth;
      todayLedger.push(...bailoutRepayment.ledgerItems);
      currentLogs.push(...bailoutRepayment.logs);
    }

    if (!terminalStop) {
      const creditRiskItem = buildCreditRiskInboxItem({ finance: f, absoluteDay: day + 1 });
      if (creditRiskItem) inboxItems.push(creditRiskItem);
    }

    // === 剧本终局判定 ===
    const scenarioEnding = evaluateScenarioEnding({
      terminalStop,
      isFreeScenario,
      absoluteDay: day + 1,
      scenarioDurationDays,
      gameState,
      dismissedByInvestor,
      activeScenario,
      activeDifficulty,
      investorRelations: nextInvestorRelations,
      feedback,
      monthlyFeedbackReport,
      finance: f,
      inventory: updatedInventory,
      usedCars: finalUsedCars,
      carModels: CAR_MODELS,
      usedCarShowroom,
      drafts: nextDrafts,
      gmWealth: nextGmWealth,
      formatMoney,
    });
    if (scenarioEnding) {
      nextEndingSummary = scenarioEnding.endingSummary;
      setEndingSummary(nextEndingSummary);
      setEndingModalDismissed(false);
      setGameState(scenarioEnding.gameState);
      dismissedByInvestor = scenarioEnding.dismissedByInvestor;
      currentLogs.push(scenarioEnding.log);
    }

    const { nextFeedback, newAchievementIds } = buildFeedbackState({
      monthlyReport: monthlyFeedbackReport,
      context: {
        totalSold: updatedSoldVehicles.length,
        csiScore: newCsiScore,
        cash: f.cash,
        usedCarCount: finalUsedCars.length,
      },
    });
    if (newAchievementIds.length > 0) {
      newAchievementIds.forEach(id => {
        const def = ACHIEVEMENTS.find(item => item.id === id);
        if (def) currentLogs.push({ day: day + 1, type: 'success', message: `🏆【成就解锁】${def.name}：${def.desc}` });
      });
    }

    const newStaffObj = buildStaffStateAfterTurn({
      staff,
      dccMembers: updatedDccMembers,
      salesMembers: updatedSalesMembers,
      serviceMembers: updatedServiceMembers,
      streamerMembers: updatedStreamerMembers,
    });
    const newAfterSalesObj = buildAfterSalesStateAfterTurn({ afterSales, techMembers: updatedTechMembers });
    const newCsiObj = buildCsiStateAfterTurn({
      csi: currentCsi,
      score: newCsiScore,
      complaintOccurred,
      expiredComplaintCount,
    });
    const newInsRenewals = buildInsuranceRenewalsAfterTurn({
      insuranceRenewals,
      pending: renewalEligible.length,
      dailyRevenue: dailyInsRevenue,
    });

    const nextStaffStorySnapshot = buildStaffStorySnapshot({ staff: newStaffObj, afterSales: newAfterSalesObj });
    const staffStoryResult = evaluateStaffStoryMoments({
      staff: nextStaffStorySnapshot,
      previousStaff: previousStaffStorySnapshot,
      monthlyStats: mStats,
      logs: currentLogs,
      rng: Math.random,
      day: day + 1,
      month,
      activeRegion,
      storyMemory: staffStoryMemory,
    });
    currentLogs.push(...staffStoryResult.logs);
    const nextStaffStoryMemory = mergeStaffStoryMemoryPatch({
      memory: staffStoryMemory,
      patch: staffStoryResult.staffStoryMemoryPatch,
    });

    const nextStoryDayOfMonth = dayOfMonth === 30 ? 30 : dayOfMonth + 1;
    const storyEventResult = evaluateStoryEvents({
      gameState: {
        activeRegion,
        afterSales: newAfterSalesObj,
        competitors: nextCompetitors,
        csi: newCsiObj,
        drafts: nextDrafts,
        facility,
        finance: f,
        inventory: updatedInventory,
        investorRelations: nextInvestorRelations,
        manufacturerPolicy: newManufacturerPolicy,
        monthlyStats: mStats,
        staff: nextStaffStorySnapshot,
      },
      storyState,
      day: day + 1,
      dayOfMonth: nextStoryDayOfMonth,
      month,
      rng: Math.random,
    });
    currentLogs.push(...storyEventResult.logs);
    inboxItems.push(...storyEventResult.inboxMessages);

    setFinance(f); setDrafts(nextDrafts); setGmWealth(nextGmWealth); setVirtualSales(nextVirtualSales); setCompetitors(nextCompetitors); setMarketing(m); setMonthlyStats(mStats); setInventory(updatedInventory);
    setMarketPrices(newMarketPrices); setDailyStats(stats); setLogs(prev => [...prev, ...currentLogs]); setManagerInbox(prev => [...prev, ...inboxItems]); setApprovalCases(nextApprovalCases); setCustomerDeals(nextCustomerDeals); setCustomerLifecycle(nextCustomerLifecycle); setSalesOpportunities(nextSalesOpportunities); setFeedback(nextFeedback); setOperatingEvents(nextOperatingEvents); setDay(day + 1);
    setStoryState(storyEventResult.storyState);
    setStaffStoryMemory(nextStaffStoryMemory);
    setPendingOrders(remainingOrders);
    setDailyLedger(prev => [...prev, { day: day + 1, items: todayLedger }]);
    if (monthlyFeedbackReport) {
      setMonthlySummaryModal({
        month: monthlyFeedbackReport.month,
        day: day + 1,
        headline: monthlyFeedbackReport.headline,
        score: monthlyFeedbackReport.score,
        investorScore: monthlyFeedbackReport.investorScore,
        payout: monthlyFeedbackReport.payout,
        creditLimit: f.creditLimit,
        draftCreditLimit: nextDrafts.creditLimit,
        policy: newManufacturerPolicy.lastChange || '标准商务政策延续',
      });
    }
    setIsAdvancingDay(false);
    // 更新员工状态（处理离职）
    setStaff(newStaffObj);
    setAfterSales(newAfterSalesObj);
    // 更新新状态
    setUsedCars(finalUsedCars);
    setSoldVehicles(updatedSoldVehicles);
    setCsi(newCsiObj);
    setInsuranceRenewals(newInsRenewals);

    writeDailyAutoSave({
      activeMarketSize,
      activeScenario,
      afterSales: newAfterSalesObj,
      approvalCases: nextApprovalCases,
      competitors: nextCompetitors,
      csi: newCsiObj,
      customerLifecycle: nextCustomerLifecycle,
      customerDeals: nextCustomerDeals,
      salesOpportunities: nextSalesOpportunities,
      dailyLedger,
      dailyStats: stats,
      day,
      dealerRegionId,
      difficultyMode,
      dismissedByInvestor,
      drafts: nextDrafts,
      endingSummary: nextEndingSummary,
      facility,
      feedback: nextFeedback,
      finance: f,
      gameState,
      getSaveSlots,
      gmWealth: nextGmWealth,
      inboxItems,
      insuranceRenewals: newInsRenewals,
      inventory: updatedInventory,
      investorProfileId,
      investorRelations: nextInvestorRelations,
      isFreeScenario,
      logs: [...logs, ...currentLogs],
      managerInbox,
      manufacturerPolicy: newManufacturerPolicy,
      marketEnvironment: newMarketEnvironment,
      marketPrices: newMarketPrices,
      marketing: m,
      modelPriceOverrides,
      operatingEvents: nextOperatingEvents,
      monthlyStats: mStats,
      pendingOrders: remainingOrders,
      scenarioDurationDays,
      scenarioId,
      soldVehicles: updatedSoldVehicles,
      storyState: storyEventResult.storyState,
      staffStoryMemory: nextStaffStoryMemory,
      staff: newStaffObj,
      strategy,
      testDriveCars,
      todayLedger,
      tutorial,
      usedCarShowroom,
      usedCars: finalUsedCars,
      virtualSales: nextVirtualSales,
    });
}
