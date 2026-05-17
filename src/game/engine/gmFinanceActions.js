export const preparePersonalBailout = ({
  amount,
  gmWealth,
  formatMoney = value => String(value),
}) => {
  const bailoutAmount = Math.floor(amount || 0);
  if (bailoutAmount < 10000) return { status: 'too_low', alert: { title: '垫资金额过低', message: '单次垫资至少 ¥10,000。' } };

  const maxBailout = Math.floor((gmWealth.personalAccount || 0) * 0.9);
  if (bailoutAmount > maxBailout) {
    return { status: 'insufficient_personal_cash', alert: { title: '个人账户不足', message: `最多可垫资个人账户的90%，当前上限 ${formatMoney(maxBailout)}。` } };
  }

  return {
    status: 'ready',
    bailoutAmount,
    confirm: {
      title: '确认个人垫资',
      message: `确定从个人账户垫资 ${formatMoney(bailoutAmount)} 到公司账户吗？\n这不会计入公司收入，现金流好转后再归还。`,
    },
  };
};

export const settlePersonalBailout = ({
  bailoutPlan,
  gmWealth,
  finance,
  month,
  formatMoney = value => String(value),
}) => {
  if (!bailoutPlan || bailoutPlan.status !== 'ready') return { status: 'invalid' };

  return {
    status: 'settled',
    gmWealth: {
      ...gmWealth,
      personalAccount: gmWealth.personalAccount - bailoutPlan.bailoutAmount,
      totalBailout: (gmWealth.totalBailout || 0) + bailoutPlan.bailoutAmount,
      outstandingBailout: (gmWealth.outstandingBailout || 0) + bailoutPlan.bailoutAmount,
      morale: Math.min(100, (gmWealth.morale || 80) + 5),
      bailoutHistory: [{ month, amount: bailoutPlan.bailoutAmount, reason: '经营现金流垫资' }, ...(gmWealth.bailoutHistory || [])].slice(0, 12),
    },
    finance: { ...finance, cash: finance.cash + bailoutPlan.bailoutAmount },
    ledgerItem: { label: 'GM个人垫资入账', amount: bailoutPlan.bailoutAmount, type: 'income' },
    log: { type: 'success', message: `💼【个人垫资】GM个人账户垫资 ${formatMoney(bailoutPlan.bailoutAmount)}，公司现金流暂时缓一口气。` },
  };
};

export const prepareOverdueDraftRepayment = ({
  draftId,
  drafts,
  finance,
  formatMoney = value => String(value),
}) => {
  const draft = (drafts.activeDrafts || []).find(item => item.id === draftId && item.status === 'defaulted');
  if (!draft) return { status: 'missing', alert: { title: '未找到逾期汇票', message: '该汇票可能已经还清或状态已变化。' } };

  const due = Math.round((draft.overduePrincipal || 0) + (draft.overduePenalty || 0));
  if (due <= 0) return { status: 'no_due', alert: { title: '无需还款', message: '该汇票没有未结清逾期金额。' } };
  if ((finance.cash || 0) < due) {
    return { status: 'insufficient_cash', alert: { title: '现金不足', message: `还清该逾期汇票需要 ${formatMoney(due)}，当前现金不足。可先回款或由GM垫资。` } };
  }

  return {
    status: 'ready',
    draft,
    due,
    confirm: {
      title: '确认还清逾期汇票',
      message: `本次将支付 ${formatMoney(due)}，包含逾期本金 ${formatMoney(draft.overduePrincipal || 0)} 与罚息 ${formatMoney(draft.overduePenalty || 0)}。`,
    },
  };
};

export const settleOverdueDraftRepayment = ({
  repaymentPlan,
  drafts,
  finance,
  month,
  dayOfMonth,
  formatMoney = value => String(value),
}) => {
  if (!repaymentPlan || repaymentPlan.status !== 'ready') return { status: 'invalid' };
  const { draft, due } = repaymentPlan;

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - due },
    drafts: {
      ...drafts,
      activeDrafts: (drafts.activeDrafts || []).map(item => item.id === draft.id
        ? { ...item, status: 'paid', paidDate: { month, day: dayOfMonth }, overduePrincipal: 0, overduePenalty: 0, creditReleased: true }
        : item),
      creditUsed: draft.creditReleased ? (drafts.creditUsed || 0) : Math.max(0, (drafts.creditUsed || 0) - (draft.amount || 0)),
      totalDraftsPaid: (drafts.totalDraftsPaid || 0) + (draft.overduePrincipal || 0),
      bankReputation: Math.min(100, (drafts.bankReputation || 70) + 5),
    },
    ledgerItem: { label: `还清逾期汇票(${draft.carModel} ×${draft.carCount})`, amount: -due, type: 'expense' },
    log: { type: 'success', message: `🏦【逾期汇票还款】已还清 ${draft.carModel} ${draft.carCount}台对应逾期汇票，支付 ${formatMoney(due)}，银行信用回升。` },
  };
};

export const adjustGmSalary = ({
  delta,
  gmWealth,
  monthlyStats,
  month,
  formatMoney = value => String(value),
}) => {
  const oldSalary = gmWealth.monthlySalary || 25000;
  const nextSalary = Math.max(766, Math.min(60000, Math.round(oldSalary * (1 + delta))));
  if (nextSalary === oldSalary) return { status: 'unchanged' };

  if (delta > 0) {
    const currentNetProfit = (monthlyStats.revenue || 0) - (monthlyStats.cogs || 0) + (monthlyStats.baseRebatesPool || 0)
      - ((monthlyStats.rent || 0) + (monthlyStats.depreciation || 0) + (monthlyStats.labor || 0) + (monthlyStats.marketingCost || 0) + (monthlyStats.financeCost || 0) + (monthlyStats.storageCost || 0));
    if (currentNetProfit <= 0) {
      return { status: 'profit_required', alert: { title: '暂不能加薪', message: '本月经营利润尚未转正，投资人不会接受总经理先给自己加薪。' } };
    }
  }

  return {
    status: 'settled',
    gmWealth: {
      ...gmWealth,
      monthlySalary: nextSalary,
      morale: Math.max(0, Math.min(100, (gmWealth.morale || 80) + (delta > 0 ? 10 : -15))),
      salaryHistory: [{ month, oldSalary, newSalary: nextSalary, reason: delta > 0 ? '主动加薪' : '主动降薪' }, ...(gmWealth.salaryHistory || [])].slice(0, 12),
    },
    log: { type: delta > 0 ? 'success' : 'warning', message: `💼【GM薪资调整】月薪由 ${formatMoney(oldSalary)} 调整为 ${formatMoney(nextSalary)}。` },
  };
};
