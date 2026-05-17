import { MODULE_GROUPS } from './navigation.js';
import { ACHIEVEMENTS } from '../game/config/achievements.js';
import { TUTORIAL_STEPS } from '../game/config/scenarios.js';
import { normalizeFeedbackState, getRatingMeta, buildLossDrivers } from '../game/engine/feedback.js';
import { buildBriefingMetrics, buildMarketShareSegments, buildNormalizedMarketShare, calculateOperatingScore } from '../game/viewModels/dashboardMetrics.js';
import { buildDailyChecklist, buildTodoQueue } from '../game/viewModels/dashboardTasks.js';
import { buildCurrentEnding, getEndingMeta } from '../game/viewModels/endingSummary.js';
import { buildMessageFeed, countUrgentOperations } from '../game/viewModels/messageFeed.js';

export function usePlayingViewModel({
  activeDifficulty,
  activeScenario,
  activeTab,
  approvalCases,
  balanceAssets,
  balanceLiabilities,
  competitors,
  csi,
  currentDay,
  customerDeals,
  salesOpportunities,
  dccCount,
  defaultedDrafts,
  dayOfMonth,
  endingModalDismissed,
  endingSummary,
  facility,
  feedback,
  finance,
  formatMoney,
  gameState,
  inventory,
  isFreeScenario,
  logs,
  managerInbox,
  marketEnvironment,
  month,
  monthlyStats,
  netProfit,
  ownerEquity,
  pendingOrders,
  salesCount,
  scenarioDurationDays,
  setActiveTab,
  soldVehicles,
  totalLeadPool,
  tutorial,
  usedCars,
  usedCarShowroom,
}) {
  const normalizedMarketShare = buildNormalizedMarketShare(competitors.marketShare);
  const marketShareSegments = buildMarketShareSegments(normalizedMarketShare);
  const targetProgress = monthlyStats.target > 0 ? Math.min(100, (monthlyStats.sales / monthlyStats.target) * 100) : 0;
  const inviteRateVal = monthlyStats.leads > 0 ? monthlyStats.dccWalkIns / monthlyStats.leads : 0;
  const convertRateVal = monthlyStats.walkIns > 0 ? monthlyStats.sales / monthlyStats.walkIns : 0;
  const todoQueue = buildTodoQueue({
    facility,
    inventory,
    pendingOrders,
    usedCars,
    usedCarShowroom,
    approvalCases,
    customerDeals,
    salesOpportunities,
    totalLeadPool,
    dccCount,
    salesCount,
    csi,
    currentDay,
  });
  const pendingApprovalCases = approvalCases.filter(item => item.status === 'pending');
  const currentLossDrivers = buildLossDrivers(monthlyStats, netProfit);
  const hasProfitSample = monthlyStats.sales > 0 || monthlyStats.walkIns > 0 || monthlyStats.derivativeRevenue > 0 || monthlyStats.afterSalesRevenue > 0 || monthlyStats.usedCarRevenue > 0;
  const highTodoCount = todoQueue.filter(item => item.level === 'high').length;
  const operatingScore = calculateOperatingScore({ dayOfMonth, monthlyStats, netProfit, finance, csi, highTodoCount });
  const operatingRating = getRatingMeta(operatingScore);
  const feedbackState = normalizeFeedbackState(feedback);
  const unlockedAchievements = ACHIEVEMENTS.filter(def => feedbackState.unlockedAchievementIds.includes(def.id));
  const latestBadges = feedbackState.monthlyBadges.slice(-5).reverse();
  const excellentMonthCount = feedbackState.ratingHistory.filter(item => (item.score || 0) >= 82 || (item.investorScore || 0) >= 82).length;
  const scenarioProgressValue = isFreeScenario
    ? Math.min(1, Math.max(0, ownerEquity / 6000000))
    : activeScenario.id === 'double12'
    ? ownerEquity / activeScenario.targetNetAssets
    : activeScenario.id === 'star12'
    ? Math.min(ownerEquity / activeScenario.targetNetAssets, excellentMonthCount / (activeScenario.minExcellentMonths || 3))
    : currentDay / scenarioDurationDays;
  const scenarioProgress = Math.max(0, Math.min(100, Math.round(scenarioProgressValue * 100)));
  const tutorialContext = { inventory, pendingOrders, monthlyStats, soldVehicles, month, feedbackState };
  const activeTutorialStep = tutorial.enabled && !tutorial.dismissed ? TUTORIAL_STEPS.find(step => !step.done(tutorialContext)) : null;
  const dailyChecklist = buildDailyChecklist({ approvalCases, customerDeals, salesOpportunities, inventory, pendingOrders, facility, finance, formatMoney });
  const openTaskTarget = (item) => {
    setActiveTab(item.tab || 'dashboard');
  };
  const briefingMetrics = buildBriefingMetrics({ todoQueue, operatingRating, operatingScore, finance, marketEnvironment, monthlyStats, totalLeadPool, csi, formatMoney });
  const moduleGroups = MODULE_GROUPS;
  const activeGroup = moduleGroups.find(group => group.tabs.some(tab => tab.id === activeTab)) || moduleGroups[0];
  const { messageFeed, visibleMessageFeed } = buildMessageFeed({ managerInbox, logs });
  const urgentOperationCount = countUrgentOperations({ approvalCases, customerDeals, salesOpportunities, defaultedDrafts, currentDay });
  const currentEnding = buildCurrentEnding({
    endingModalDismissed,
    endingSummary,
    gameState,
    activeScenario,
    activeDifficulty,
    day: currentDay,
    ownerEquity,
    finance,
    balanceLiabilities,
    balanceAssets,
    excellentMonthCount,
  });
  const endingMeta = getEndingMeta(currentEnding);

  return {
    activeGroup,
    activeTutorialStep,
    briefingMetrics,
    convertRateVal,
    currentEnding,
    currentLossDrivers,
    dailyChecklist,
    endingMeta,
    excellentMonthCount,
    feedbackState,
    getRatingMeta,
    hasProfitSample,
    inviteRateVal,
    latestBadges,
    marketShareSegments,
    messageFeed,
    moduleGroups,
    normalizedMarketShare,
    openTaskTarget,
    operatingRating,
    operatingScore,
    pendingApprovalCases,
    scenarioProgress,
    targetProgress,
    todoQueue,
    unlockedAchievements,
    urgentOperationCount,
    visibleMessageFeed,
  };
}
