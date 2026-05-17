const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const repayGmBailoutIfCovered = ({
  finance,
  gmWealth,
  dailyExpenses,
  absoluteDay,
  formatMoney = defaultFormatMoney,
}) => {
  if ((gmWealth.outstandingBailout || 0) <= 0) {
    return { finance, gmWealth, ledgerItems: [], logs: [] };
  }

  const safeCashFloor = Math.round(dailyExpenses * 45);
  const repayable = Math.min(gmWealth.outstandingBailout, Math.max(0, (finance.cash || 0) - safeCashFloor));
  if (repayable <= 0) {
    return { finance, gmWealth, ledgerItems: [], logs: [] };
  }

  const nextFinance = { ...finance, cash: finance.cash - repayable };
  const nextGmWealth = {
    ...gmWealth,
    personalAccount: (gmWealth.personalAccount || 0) + repayable,
    outstandingBailout: Math.max(0, (gmWealth.outstandingBailout || 0) - repayable),
  };

  return {
    finance: nextFinance,
    gmWealth: nextGmWealth,
    ledgerItems: [{ label: '归还GM垫资', amount: -repayable, type: 'expense' }],
    logs: [{ day: absoluteDay, type: 'success', message: `💼【垫资归还】公司现金覆盖超过安全线，自动归还GM垫资 ${formatMoney(repayable)}。` }],
  };
};

export const buildCreditRiskInboxItem = ({ finance, absoluteDay }) => {
  if (!finance.creditLimit || finance.loan <= finance.creditLimit * 0.85 || absoluteDay % 5 !== 0) return null;
  return {
    id: `inbox_credit_${absoluteDay}`,
    day: absoluteDay,
    from: '合作银行',
    title: '库存融资风险提醒',
    body: `当前负债已达到授信额度的${((finance.loan / finance.creditLimit) * 100).toFixed(0)}%。建议通过批售、加快成交或手工还贷降低月底抽贷风险。`,
  };
};
