const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const calculateMonthlyRebateSettlement = ({
  monthStats,
  csiScore,
  finance,
  facility,
  absoluteDay,
  formatMoney = defaultFormatMoney,
}) => {
  const f = { ...finance };
  const achieveRate = monthStats.target > 0 ? monthStats.sales / monthStats.target : 0;
  let stepMultiplier = 0.5;
  if (achieveRate >= 1.2) stepMultiplier = 1.2;
  else if (achieveRate >= 1.0) stepMultiplier = 1.0;
  else if (achieveRate >= 0.8) stepMultiplier = 0.8;

  const inviteRate = monthStats.leads > 0 ? monthStats.dccWalkIns / monthStats.leads : 0;
  const convertRate = monthStats.walkIns > 0 ? monthStats.sales / monthStats.walkIns : 0;
  let processScore = 0;
  if (inviteRate >= 0.1) processScore += 0.5;
  if (convertRate >= 0.2) processScore += 0.5;
  const processPassed = inviteRate >= 0.1 && convertRate >= 0.2;

  let csiMultiplier = 1.0;
  if (csiScore >= 95) csiMultiplier = 1.03;
  else if (csiScore >= 90) csiMultiplier = 1.0;
  else if (csiScore >= 85) csiMultiplier = 0.95;
  else csiMultiplier = 0.85;
  const csiWarning = csiMultiplier < 1.0 ? ` ⚠️ CSI仅${Math.round(csiScore)}分，返利打${csiMultiplier}折！` : csiMultiplier > 1.0 ? ` 🎉 CSI优秀${Math.round(csiScore)}分，返利+3%!` : '';

  const volumeRebatePool = monthStats.baseRebatesPool * 0.8;
  const processRebatePool = monthStats.baseRebatesPool * 0.2;
  const volumePayout = Math.floor(volumeRebatePool * stepMultiplier * csiMultiplier);
  const processPayout = Math.floor(processRebatePool * processScore * csiMultiplier);
  const finalPayout = volumePayout + processPayout;

  f.cash += finalPayout;
  const newCreditLimit = Math.floor(8000000 + ((facility?.level || 0) * 2000000) + (monthStats.revenue * 0.4) + (f.cash * 0.3));
  f.creditLimit = newCreditLimit;
  const creditWarning = f.loan > newCreditLimit
    ? ` ⚠️ 银行抽贷预警：下月授信降至 ${formatMoney(newCreditLimit)}，负债已超额！`
    : ` 银行下月授信: ${formatMoney(newCreditLimit)}。`;

  return {
    finance: f,
    achieveRate,
    inviteRate,
    convertRate,
    processScore,
    processPassed,
    csiMultiplier,
    csiWarning,
    volumePayout,
    processPayout,
    finalPayout,
    newCreditLimit,
    ledgerItems: [
      { label: `月底返利兑付(达成${(achieveRate * 100).toFixed(0)}%·CSI×${csiMultiplier})`, amount: finalPayout, type: 'income' },
      { label: '授信额度更新', amount: newCreditLimit, type: 'pending' },
    ],
    logs: [{
      day: absoluteDay,
      type: f.loan > newCreditLimit ? 'warning' : 'success',
      message: `【月底结算】达成率 ${(achieveRate * 100).toFixed(1)}%。返利兑付 ${formatMoney(finalPayout)}（销量${formatMoney(volumePayout)}+过程${formatMoney(processPayout)}·CSI×${csiMultiplier}）。${creditWarning}${csiWarning}`,
    }],
  };
};

export const applyInvestorMonthlyAuthorization = ({
  finance,
  investorRelations,
  investorReview,
  investor,
  currentDay,
  formatMoney = defaultFormatMoney,
}) => {
  const f = { ...finance };
  const score = investorReview.score;
  const trustDelta = score >= 86 ? 12 : score >= 72 ? 5 : score >= 60 ? -4 : score >= 45 ? -12 : -22;
  const nextBadReviews = score < 60 ? (investorRelations.badReviews || 0) + 1 : Math.max(0, (investorRelations.badReviews || 0) - 1);
  let nextBudgetStatus = '正常授权';
  let nextOrderRestrictionUntil = investorRelations.orderRestrictionUntil;
  const ledgerItems = [];

  if (score >= 86) {
    const extraCredit = investor.budgetStyle === 'growth' || investor.id === 'gambler' ? 1800000 : 900000;
    f.creditLimit += extraCredit;
    nextBudgetStatus = `追加授权 ${formatMoney(extraCredit)}`;
    ledgerItems.push({ label: '投资人追加下月授权', amount: extraCredit, type: 'pending' });
  } else if (score < 60) {
    nextBudgetStatus = score < 45 ? '强制降本与订车限制' : '订车限制';
    nextOrderRestrictionUntil = currentDay + 31;
    f.creditLimit = Math.max(3000000, Math.round(f.creditLimit * (score < 45 ? 0.82 : 0.9)));
  } else if (score < 72 && investor.budgetStyle === 'tight') {
    nextBudgetStatus = '谨慎授权';
    nextOrderRestrictionUntil = currentDay + 16;
  }

  return {
    finance: f,
    investorRelations: {
      ...investorRelations,
      trust: Math.max(0, Math.min(100, (investorRelations.trust || 0) + trustDelta)),
      badReviews: nextBadReviews,
      lastScore: score,
      lastGrade: investorReview.grade,
      lastComment: investorReview.comment,
      budgetStatus: nextBudgetStatus,
      orderRestrictionUntil: nextOrderRestrictionUntil,
    },
    trustDelta,
    nextBadReviews,
    nextBudgetStatus,
    ledgerItems,
  };
};
