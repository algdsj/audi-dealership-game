export const prepareManualLoanRepayment = ({
  finance,
  formatMoney = value => String(value),
}) => {
  if (finance.loan <= 0) return { status: 'no_loan', alert: { title: '无需还贷', message: '当前没有银行负债。' } };
  if (finance.cash <= 0) return { status: 'no_cash', alert: { title: '现金不足', message: '当前没有可用于手工还贷的自有现金。' } };

  const repayAmount = Math.min(finance.cash, finance.loan);
  return {
    status: 'ready',
    repayAmount,
    confirm: {
      title: '确认手工还贷',
      message: `是否使用自有现金归还银行负债？\n\n还款金额：${formatMoney(repayAmount)}\n还款后现金：${formatMoney(finance.cash - repayAmount)}\n还款后负债：${formatMoney(finance.loan - repayAmount)}`,
    },
  };
};

export const settleManualLoanRepayment = ({
  repaymentPlan,
  finance,
  formatMoney = value => String(value),
}) => {
  if (!repaymentPlan || repaymentPlan.status !== 'ready') return { status: 'invalid' };

  const repayAmount = Math.min(finance.cash, finance.loan);
  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - repayAmount, loan: finance.loan - repayAmount },
    ledgerItem: { label: '手工归还银行负债', amount: -repayAmount, type: 'expense' },
    log: { type: 'info', message: `🏦【手工还贷】使用自有现金归还银行负债 ${formatMoney(repayAmount)}。` },
  };
};

export const prepareDerivativeStrategyChange = ({
  key,
  value,
}) => ({
  status: 'ready',
  key,
  value,
  confirm: {
    title: '策略调整',
    message: `确定将此衍生业务切换至【${value === 'OEM' ? '原厂' : '三方'}】采购吗？\n原厂件客单价和客户接受度高，但毛利低；三方件利润空间大，但客户容易拒绝。`,
  },
});

export const settleDerivativeStrategyChange = ({
  strategyPlan,
  strategy,
}) => {
  if (!strategyPlan || strategyPlan.status !== 'ready') return { status: 'invalid' };
  return {
    status: 'settled',
    strategy: { ...strategy, [strategyPlan.key]: strategyPlan.value },
    log: { type: 'info', message: `衍生策略已调整为 ${strategyPlan.value === 'OEM' ? '原厂采购' : '第三方采购'}。` },
  };
};
