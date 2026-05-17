export const ENDING_META = {
  bankrupt: { title: '破产清算', tone: 'bg-red-600', desc: '资金链断裂，银行授信被击穿。' },
  dismissed: { title: '被解聘', tone: 'bg-red-700', desc: '董事会认为目标未达成，决定更换总经理。' },
  failed: { title: '任期未达标', tone: 'bg-amber-600', desc: '保住了部分基本盘，但没有完成本局目标。' },
  renewed: { title: '成功续约', tone: 'bg-blue-600', desc: '你守住了职位，获得下一任期授权。' },
  excellent: { title: '优秀总经理', tone: 'bg-emerald-600', desc: '经营质量获得董事会和投资人认可。' },
  regional_star: { title: '区域明星店', tone: 'bg-violet-600', desc: '门店成为区域标杆，厂家和投资人都愿意继续加码。' },
};

export const DEFAULT_ENDING_META = { title: '经营结局', tone: 'bg-slate-700', desc: '本局已经结束。' };

export function buildCurrentEnding({
  endingModalDismissed,
  endingSummary,
  gameState,
  activeScenario,
  activeDifficulty,
  day,
  ownerEquity,
  finance,
  balanceLiabilities,
  balanceAssets,
  excellentMonthCount,
}) {
  if (endingModalDismissed) return null;
  if (endingSummary) return endingSummary;
  if (gameState !== 'bankrupt' && gameState !== 'dismissed') return null;

  return {
    rank: gameState,
    scenarioName: activeScenario.name,
    difficultyName: activeDifficulty.name,
    day,
    netAssets: ownerEquity,
    loan: finance.loan,
    liabilities: balanceLiabilities,
    totalAssets: balanceAssets,
    excellentMonths: excellentMonthCount,
  };
}

export function getEndingMeta(ending) {
  if (!ending) return null;
  return ENDING_META[ending.rank] || DEFAULT_ENDING_META;
}
