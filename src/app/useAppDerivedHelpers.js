import { normalizeFeedbackState } from '../game/engine/feedback.js';
import { buildFeedbackProgress } from '../game/engine/feedbackProgress.js';
import { buildFinanceSnapshot } from '../game/engine/financeSnapshot.js';
import { getDraftRemainingDays as getDraftRemainingDaysCore } from '../game/engine/gameDate.js';
import { calculateCompanyDailyBurn } from '../game/engine/operatingCosts.js';

export const formatMoney = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return '¥0';
  return `¥${Math.round(amount).toLocaleString()}`;
};

export function useAppDerivedHelpers({
  afterSales,
  carModels,
  csi,
  dailyLedger,
  day,
  drafts,
  facility,
  feedback,
  finance,
  gmWealth,
  inventory,
  investorRelations,
  marketing,
  month,
  monthlyStats,
  soldVehicles,
  staff,
  usedCars,
  virtualSales,
}) {
  const getDraftFeeRate = (term) => {
    const reputation = drafts.bankReputation ?? 70;
    if (term === 6) return 0.008;
    if (reputation >= 80) return 0.004;
    if (reputation >= 60) return 0.005;
    if (reputation >= 40) return 0.008;
    return 0.01;
  };

  const getDraftRemainingDays = (draft, currentDay = day) => getDraftRemainingDaysCore(draft, currentDay);
  const getAvailableDraftCredit = () => Math.max(0, (drafts.creditLimit || 0) - (drafts.creditUsed || 0));
  const getCompanyDailyBurn = () => calculateCompanyDailyBurn({ facility, staff, afterSales, marketing, finance, inventory });

  const buildFeedbackState = ({ currentFeedback = feedback, monthlyReport = null, context = {} }) => {
    const normalized = normalizeFeedbackState(currentFeedback);
    const achievementContext = {
      totalSold: context.totalSold ?? (soldVehicles.length + (context.extraSold || 0)),
      csiScore: context.csiScore ?? csi.score,
      cash: context.cash ?? finance.cash,
      usedCarCount: context.usedCarCount ?? usedCars.length,
      lastReport: monthlyReport || normalized.lastMonthReport,
      lastInvestorScore: monthlyReport?.investorScore ?? investorRelations.lastScore,
      personalAccount: context.personalAccount ?? (gmWealth.personalAccount || 0),
      monthlySalary: context.monthlySalary ?? (gmWealth.monthlySalary || 0),
      totalBailout: context.totalBailout ?? (gmWealth.totalBailout || 0),
      bailoutCount: context.bailoutCount ?? ((gmWealth.bailoutHistory || []).length),
      activeDraftCount: context.activeDraftCount ?? (drafts.activeDrafts || []).filter(d => d.status === 'active').length,
      overdueDraftCount: context.overdueDraftCount ?? (drafts.activeDrafts || []).filter(d => d.status === 'defaulted').length,
      bankReputation: context.bankReputation ?? (drafts.bankReputation ?? 70),
      totalDraftsDefaulted: context.totalDraftsDefaulted ?? (drafts.totalDraftsDefaulted || 0),
    };
    return buildFeedbackProgress({
      currentFeedback: normalized,
      monthlyReport,
      achievementContext,
    });
  };

  const financeSnapshot = buildFinanceSnapshot({
    monthlyStats,
    drafts,
    currentDay: day,
    currentMonth: month,
    dailyBurnEstimate: getCompanyDailyBurn(),
    dailyLedger,
    inventory,
    carModels,
    virtualSales,
    usedCars,
    finance,
    gmWealth,
    feedback,
  });

  return {
    buildFeedbackState,
    financeSnapshot,
    formatMoney,
    getAvailableDraftCredit,
    getCompanyDailyBurn,
    getDraftFeeRate,
    getDraftRemainingDays,
  };
}
