import { applyInvestorMonthlyAuthorization } from './monthEndSettlement.js';
import { buildInvestorReview, buildMonthlyFeedbackReport } from './monthlyReview.js';

export const settleMonthlyInvestorReview = ({
  month,
  monthStats,
  finance,
  investorRelations,
  gmWealth,
  stockList,
  csiScore,
  lostCount,
  overdueDraftCount,
  investor,
  facility,
  companyDailyBurn,
  priceWarActive,
  finalPayout,
  manufacturerPolicy = {},
  feedback = {},
  competitors = {},
  csi = {},
  currentDay,
  absoluteDay,
  formatMoney,
}) => {
  let nextFinance = { ...finance };
  const nextGmWealth = { ...gmWealth };
  const logs = [];
  const inboxItems = [];

  const investorReview = buildInvestorReview({
    monthStats,
    settlementCash: nextFinance.cash,
    settlementLoan: nextFinance.loan,
    settlementCreditLimit: nextFinance.creditLimit,
    stockList,
    csiScore,
    lostCount,
    overdueDraftCount,
    investor,
    facility,
    companyDailyBurn,
    priceWarActive,
    formatMoney,
  });
  const score = investorReview.score;
  const investorAuthorization = applyInvestorMonthlyAuthorization({
    finance: nextFinance,
    investorRelations,
    investorReview,
    investor,
    currentDay,
    formatMoney,
  });
  nextFinance = investorAuthorization.finance;
  const nextInvestorRelations = investorAuthorization.investorRelations;
  const { trustDelta, nextBadReviews, nextBudgetStatus } = investorAuthorization;

  logs.push({
    day: absoluteDay,
    type: score >= 72 ? 'success' : score >= 60 ? 'warning' : 'expense',
    message: `💼【投资人月度评价】${investorReview.grade} ${score}分。${investorReview.comment} 下月授权：${nextBudgetStatus}。${nextBadReviews >= 2 ? `连续差评风险 ${nextBadReviews}/3。` : ''}`,
  });
  inboxItems.push({
    id: `inbox_investor_${absoluteDay}`,
    day: absoluteDay,
    from: '投资人办公室',
    title: `M${month}月经营评价：${investorReview.grade}`,
    body: `${investorReview.comment} 综合评分${score}分。信任度${trustDelta >= 0 ? '+' : ''}${trustDelta}，下月预算状态：${nextBudgetStatus}。`,
  });

  const monthlyFeedbackReport = buildMonthlyFeedbackReport({
    monthNo: month,
    monthStats,
    finalPayout,
    investorReview,
    csiScore,
    settlementCash: nextFinance.cash,
    settlementLoan: nextFinance.loan,
    settlementCreditLimit: nextFinance.creditLimit,
    stockList,
    finance: nextFinance,
    financeSnapshot: {
      cashCoverageDays: Math.floor((nextFinance.cash || 0) / Math.max(1, companyDailyBurn || 1)),
      debtRatio: nextFinance.creditLimit > 0 ? (nextFinance.loan || 0) / nextFinance.creditLimit : 1,
      netProfit: investorReview.monthNetProfit,
    },
    csi,
    manufacturerPolicy,
    feedback,
    competitors,
    formatMoney,
  });

  nextGmWealth.yearlyNetProfit = (nextGmWealth.yearlyNetProfit || 0) + investorReview.monthNetProfit;
  nextGmWealth.investorScoreHistory = [...(nextGmWealth.investorScoreHistory || []), score].slice(-12);
  if (investorReview.monthNetProfit <= 0) {
    nextGmWealth.morale = Math.max(0, (nextGmWealth.morale || 80) - 3);
  }

  logs.push({
    day: absoluteDay,
    type: monthlyFeedbackReport.score >= 70 ? 'success' : monthlyFeedbackReport.score >= 58 ? 'warning' : 'expense',
    message: `🎖️【月度经营评级】${monthlyFeedbackReport.headline}${monthlyFeedbackReport.badges.length > 0 ? ` 获得徽章：${monthlyFeedbackReport.badges.map(b => b.name).join('、')}。` : ' 暂无徽章，下月继续补短板。'}`,
  });
  if (monthlyFeedbackReport.lossDrivers.length > 0) {
    const topLoss = monthlyFeedbackReport.lossDrivers[0];
    logs.push({
      day: absoluteDay,
      type: 'warning',
      message: `📉【亏损原因分析】本月首要压力是${topLoss.label}（影响约${formatMoney(topLoss.amount)}）。${topLoss.action}`,
    });
    inboxItems.push({
      id: `inbox_loss_review_${absoluteDay}`,
      day: absoluteDay,
      from: '经营诊断室',
      title: `M${month}亏损复盘`,
      body: monthlyFeedbackReport.lossDrivers.map(item => `${item.label}约${formatMoney(item.amount)}：${item.action}`).join(' '),
    });
  }

  const dismissedByInvestor = nextBadReviews >= 3;
  if (dismissedByInvestor) {
    logs.push({ day: absoluteDay, type: 'expense', message: '💼【被解聘】连续三次投资人差评，董事会决定更换运营总经理。游戏失败。' });
  }

  return {
    finance: nextFinance,
    investorRelations: nextInvestorRelations,
    gmWealth: nextGmWealth,
    ledgerItems: investorAuthorization.ledgerItems,
    investorReview,
    monthlyFeedbackReport,
    dismissedByInvestor,
    logs,
    inboxItems,
  };
};
