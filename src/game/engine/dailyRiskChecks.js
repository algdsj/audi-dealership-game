export const evaluateDailyRiskChecks = ({
  finance,
  totalWalkIns,
  salesCapacity,
  salesCount,
  absoluteDay,
  formatMoney,
}) => {
  const nextFinance = { ...finance };
  const logs = [];

  if (nextFinance.cash < 0) {
    nextFinance.loan += Math.abs(nextFinance.cash);
    nextFinance.cash = 0;
  }

  const bankrupt = nextFinance.loan > nextFinance.creditLimit;
  if (bankrupt) {
    logs.push({ day: absoluteDay, type: 'expense', message: `【破产警告】二手车收购与当日经营支出导致贷款超额 (超 ${formatMoney(nextFinance.creditLimit)})，资金链断裂！` });
  }

  if (totalWalkIns > salesCapacity) {
    logs.push({ day: absoluteDay, type: 'expense', message: `⚠️ 进店总客流达 ${totalWalkIns} 批，但销售顾问仅有 ${salesCount} 人，最多只能接待 ${salesCapacity} 批。其余客户因无人接待而流失！请考虑招聘销售。` });
  }

  return {
    finance: nextFinance,
    bankrupt,
    logs,
  };
};
