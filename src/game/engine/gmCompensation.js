const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const applyAnnualGmDividendAndDraftCredit = ({
  finance,
  gmWealth,
  drafts,
  nextMonthNo,
  absoluteDay,
  formatMoney = defaultFormatMoney,
}) => {
  if (nextMonthNo % 12 !== 1 || nextMonthNo <= 1) {
    return { finance, gmWealth, drafts, ledgerItems: [], logs: [] };
  }

  const f = { ...finance };
  const nextGmWealth = { ...gmWealth };
  const nextDrafts = { ...drafts };
  const ledgerItems = [];
  const logs = [];
  const yearlyProfit = nextGmWealth.yearlyNetProfit || 0;
  const scoreList = nextGmWealth.investorScoreHistory || [];
  const avgInvestorScore = scoreList.length > 0 ? scoreList.reduce((sum, item) => sum + item, 0) / scoreList.length : 0;
  const dividendRate = avgInvestorScore >= 85 ? 0.12 : avgInvestorScore >= 70 ? 0.08 : avgInvestorScore >= 55 ? 0.05 : 0;
  const dividendAmount = yearlyProfit > 0 ? Math.floor(yearlyProfit * dividendRate) : 0;

  nextGmWealth.dividendRate = dividendRate;
  if (dividendAmount > 0 && f.cash >= dividendAmount) {
    f.cash -= dividendAmount;
    nextGmWealth.personalAccount = (nextGmWealth.personalAccount || 0) + dividendAmount;
    nextGmWealth.totalDividend = (nextGmWealth.totalDividend || 0) + dividendAmount;
    nextGmWealth.totalEarned = (nextGmWealth.totalEarned || 0) + dividendAmount;
    nextGmWealth.morale = Math.min(100, (nextGmWealth.morale || 80) + (dividendAmount >= 300000 ? 10 : 5));
    ledgerItems.push({ label: `GM年度分红(${Math.round(dividendRate * 100)}%)`, amount: -dividendAmount, type: 'expense' });
    logs.push({ day: absoluteDay, type: 'success', message: `💰【年度分红】年度净利润 ${formatMoney(yearlyProfit)}，投资人平均分 ${avgInvestorScore.toFixed(1)}，GM获得分红 ${formatMoney(dividendAmount)}。` });
  } else {
    nextGmWealth.morale = Math.max(0, (nextGmWealth.morale || 80) - 10);
    logs.push({ day: absoluteDay, type: 'warning', message: `💰【年度分红】年度净利润 ${formatMoney(yearlyProfit)}，投资人平均分 ${avgInvestorScore.toFixed(1)}，本年无可发放分红。` });
  }

  const annualDraftDelta = Math.round(
    (yearlyProfit > 0 ? 400000 : -300000) +
    (avgInvestorScore >= 80 ? 400000 : avgInvestorScore >= 65 ? 150000 : -250000) +
    ((nextDrafts.bankReputation || 70) >= 80 ? 300000 : (nextDrafts.bankReputation || 70) < 45 ? -500000 : 0) -
    Math.min(800000, nextDrafts.totalDraftsDefaulted || 0)
  );
  nextDrafts.creditLimit = Math.max(nextDrafts.creditUsed || 0, Math.max(500000, Math.min(6000000, (nextDrafts.creditLimit || 1500000) + annualDraftDelta)));
  logs.push({ day: absoluteDay, type: annualDraftDelta >= 0 ? 'success' : 'warning', message: `🏦【年度汇票授信评估】银行结合年度利润、投资人评分和信用记录，将汇票额度调整 ${annualDraftDelta >= 0 ? '+' : ''}${formatMoney(annualDraftDelta)}，新额度 ${formatMoney(nextDrafts.creditLimit)}。` });
  nextGmWealth.yearlyNetProfit = 0;
  nextGmWealth.investorScoreHistory = [];

  return { finance: f, gmWealth: nextGmWealth, drafts: nextDrafts, ledgerItems, logs };
};

export const payGmMonthlySalary = ({
  finance,
  gmWealth,
  monthlyStats,
  absoluteDay,
  formatMoney = defaultFormatMoney,
}) => {
  const f = { ...finance };
  const nextGmWealth = { ...gmWealth };
  const nextMonthlyStats = { ...monthlyStats };
  const ledgerItems = [];
  const logs = [];
  const gmSalaryPaid = Math.max(766, Math.min(60000, Math.round(nextGmWealth.monthlySalary || 25000)));

  f.cash -= gmSalaryPaid;
  nextGmWealth.personalAccount = (nextGmWealth.personalAccount || 0) + gmSalaryPaid;
  nextGmWealth.totalEarned = (nextGmWealth.totalEarned || 0) + gmSalaryPaid;
  if (nextGmWealth.personalAccount < 10000) {
    nextGmWealth.morale = Math.max(0, (nextGmWealth.morale || 80) - 10);
  }
  nextMonthlyStats.labor = (nextMonthlyStats.labor || 0) + gmSalaryPaid;
  ledgerItems.push({ label: 'GM月薪发放', amount: -gmSalaryPaid, type: 'expense' });
  logs.push({ day: absoluteDay, type: 'info', message: `💼【GM月薪】新月发放总经理月薪 ${formatMoney(gmSalaryPaid)}，已从公司现金转入个人账户。` });

  if (f.cash < 0) {
    f.loan += Math.abs(f.cash);
    f.cash = 0;
    logs.push({ day: absoluteDay, type: 'warning', message: '🏦【薪资垫贷】发放GM月薪后现金不足，自动使用银行库存融资垫付。' });
  }
  const bankrupt = f.loan > f.creditLimit;
  if (bankrupt) {
    logs.push({ day: absoluteDay, type: 'expense', message: '【破产警告】GM薪资发放后融资超额，资金链断裂。' });
  }

  return { finance: f, gmWealth: nextGmWealth, monthlyStats: nextMonthlyStats, ledgerItems, logs, bankrupt };
};
