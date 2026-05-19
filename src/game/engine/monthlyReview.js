import { buildLossDrivers, getRatingMeta } from './feedback.js';
import { buildOperatingReviewReport } from './operatingReviewReport.js';

const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const buildInvestorReview = ({
  monthStats,
  settlementCash,
  settlementLoan,
  settlementCreditLimit,
  stockList = [],
  csiScore,
  lostCount,
  overdueDraftCount = 0,
  investor,
  facility,
  companyDailyBurn,
  priceWarActive = false,
  formatMoney = defaultFormatMoney,
}) => {
  const monthGp1 = (monthStats.revenue || 0) - (monthStats.cogs || 0);
  const monthDeriv = (monthStats.derivativeRevenue || 0) - (monthStats.derivativeCost || 0);
  const monthAfterSales = (monthStats.afterSalesRevenue || 0) - (monthStats.afterSalesCost || 0);
  const monthUsedCar = (monthStats.usedCarRevenue || 0) - (monthStats.usedCarCost || 0);
  const monthOpex = (monthStats.rent || 0) + (monthStats.depreciation || 0) + (monthStats.labor || 0) + (monthStats.marketingCost || 0) + (monthStats.financeCost || 0) + (monthStats.storageCost || 0);
  const monthNetProfit = monthGp1 + (monthStats.baseRebatesPool || 0) + monthDeriv + (monthStats.financeCommission || 0) + monthAfterSales + monthUsedCar + (monthStats.insuranceRenewalRevenue || 0) - monthOpex;
  const achieve = monthStats.target > 0 ? monthStats.sales / monthStats.target : 0;
  const debtRatio = settlementCreditLimit > 0 ? settlementLoan / settlementCreditLimit : 1;
  const avgStockDays = stockList.length > 0 ? stockList.reduce((sum, car) => sum + (car.stockDays || 0), 0) / stockList.length : 0;
  const stockCapacity = Math.max(1, (facility?.showroomSpots || 0) + (facility?.warehouseCapacity || 0));
  const stockPressure = Math.min(1, (stockList.length / stockCapacity) * 0.55 + (avgStockDays / 120) * 0.45);
  const cashCoverageDaysReview = Math.floor((settlementCash || 0) / Math.max(1, companyDailyBurn || 1));
  const cashFlowAdj = cashCoverageDaysReview >= 45 ? 6 : cashCoverageDaysReview >= 30 ? 4 : cashCoverageDaysReview >= 15 ? 1 : -10;
  const assetAdj = debtRatio < 0.45 ? 5 : debtRatio < 0.6 ? 3 : debtRatio <= 0.82 ? 0 : -8;
  const overdueDraftAdj = overdueDraftCount * -5;
  const manufacturerPenaltyAdj = (monthStats.manufacturerPenalty || 0) > 0 || priceWarActive ? -10 : 0;
  const poorOutcomeAdj = monthNetProfit < 0 && achieve < 0.5 ? -18 : monthNetProfit < 0 && achieve < 0.8 ? -10 : monthNetProfit < -100000 ? -6 : 0;
  const scoreParts = {
    profit: Math.max(0, Math.min(100, 45 + monthNetProfit / 4500)),
    cash: Math.max(0, Math.min(monthNetProfit < 0 && achieve < 0.6 ? 78 : 100, 88 - debtRatio * 68 + Math.min(12, settlementCash / 360000))),
    sales: Math.max(0, Math.min(120, achieve * 100)),
    csi: Math.max(0, Math.min(100, csiScore)),
    inventory: Math.max(0, Math.min(100, 100 - stockPressure * 80)),
    staff: Math.max(0, Math.min(100, 96 - lostCount * 18)),
  };
  let score = Object.entries(investor.weights).reduce((sum, [key, weight]) => sum + (scoreParts[key] || 0) * weight, 0);
  if (investor.swing) score = 50 + (score - 50) * investor.swing;
  score += cashFlowAdj + assetAdj + overdueDraftAdj + manufacturerPenaltyAdj + poorOutcomeAdj;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade = score >= 86 ? '优秀' : score >= 72 ? '良好' : score >= 60 ? '勉强过关' : score >= 45 ? '差评' : '严重差评';
  const comment = `${investor.name}评价：销量${Math.round(achieve * 100)}%，净利润${formatMoney(monthNetProfit)}，现金覆盖${cashCoverageDaysReview}天，负债率${Math.round(debtRatio * 100)}%，平均库龄${Math.round(avgStockDays)}天，逾期汇票${overdueDraftCount}张，CSI ${Math.round(csiScore)}分，人员流失${lostCount}人。`;
  return { score, grade, comment, monthNetProfit, achieve, scoreFactors: { cashCoverageDaysReview, cashFlowAdj, assetAdj, overdueDraftAdj, manufacturerPenaltyAdj, poorOutcomeAdj } };
};

export const buildMonthlyFeedbackReport = ({
  monthNo,
  monthStats,
  finalPayout,
  investorReview,
  csiScore,
  settlementCash,
  settlementLoan,
  settlementCreditLimit,
  stockList = [],
  finance = {},
  financeSnapshot = {},
  csi = {},
  manufacturerPolicy = {},
  feedback = {},
  competitors = {},
  formatMoney = defaultFormatMoney,
}) => {
  const achieveRate = monthStats.target > 0 ? monthStats.sales / monthStats.target : 0;
  const inviteRate = monthStats.leads > 0 ? monthStats.dccWalkIns / monthStats.leads : 0;
  const convertRate = monthStats.walkIns > 0 ? monthStats.sales / monthStats.walkIns : 0;
  const debtRatio = settlementCreditLimit > 0 ? settlementLoan / settlementCreditLimit : 1;
  const avgStockDays = stockList.length > 0 ? stockList.reduce((sum, car) => sum + (car.stockDays || 0), 0) / stockList.length : 0;
  const processScore = (inviteRate >= 0.1 ? 8 : Math.min(8, inviteRate / 0.1 * 8)) + (convertRate >= 0.2 ? 8 : Math.min(8, convertRate / 0.2 * 8));
  const score = Math.round(
    Math.min(30, achieveRate * 30) +
    Math.max(0, Math.min(22, 12 + investorReview.monthNetProfit / 35000)) +
    Math.max(0, Math.min(16, 16 - debtRatio * 12 + Math.min(4, settlementCash / 1000000))) +
    Math.max(0, Math.min(14, (csiScore - 75) / 25 * 14)) +
    processScore +
    Math.max(0, Math.min(10, 10 - avgStockDays / 12))
  );
  const rating = getRatingMeta(score);
  const badges = [
    achieveRate >= 1 ? { id: `m${monthNo}_sales`, name: '销量达成', tone: 'blue', desc: `完成${Math.round(achieveRate * 100)}%月度销量目标。` } : null,
    investorReview.monthNetProfit >= 0 ? { id: `m${monthNo}_profit`, name: '利润转正', tone: 'emerald', desc: `本月净利润${formatMoney(investorReview.monthNetProfit)}。` } : null,
    csiScore >= 95 ? { id: `m${monthNo}_csi`, name: 'CSI高光', tone: 'green', desc: `CSI保持在${Math.round(csiScore)}分。` } : null,
    inviteRate >= 0.1 && convertRate >= 0.2 ? { id: `m${monthNo}_funnel`, name: '漏斗健康', tone: 'sky', desc: `邀约和转化过程指标双达标。` } : null,
    settlementLoan <= settlementCreditLimit * 0.55 ? { id: `m${monthNo}_cash`, name: '现金安全', tone: 'slate', desc: `负债率控制在${Math.round(debtRatio * 100)}%。` } : null,
  ].filter(Boolean);
  const lossDrivers = buildLossDrivers(monthStats, investorReview.monthNetProfit);
  const operatingReview = buildOperatingReviewReport({
    month: monthNo,
    monthlyStats: monthStats,
    finance,
    financeSnapshot,
    inventory: stockList,
    csi: { score: csiScore, ...csi },
    manufacturerPolicy,
    investorReview,
    feedback,
    competitors,
    formatMoney,
  });
  const headline = `${rating.grade}级${rating.label}：销量${monthStats.sales}/${monthStats.target}台，净利润${formatMoney(investorReview.monthNetProfit)}，返利到账${formatMoney(finalPayout)}。`;
  return {
    month: monthNo,
    score,
    grade: rating.grade,
    label: rating.label,
    tone: rating.tone,
    headline,
    badges,
    lossDrivers,
    operatingReview,
    quarterlyChallenge: operatingReview.challenge,
    achieveRate,
    inviteRate,
    convertRate,
    netProfit: investorReview.monthNetProfit,
    payout: finalPayout,
    investorScore: investorReview.score,
    sales: monthStats.sales,
    revenue: monthStats.revenue,
    cash: settlementCash,
    loan: settlementLoan,
    csiScore,
  };
};
