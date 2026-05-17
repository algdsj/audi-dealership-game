import { normalizeMarketShare } from '../engine/marketMetrics.js';

export function buildNormalizedMarketShare(marketShare) {
  return normalizeMarketShare(marketShare || {});
}

export function buildMarketShareSegments(marketShare) {
  const normalizedMarketShare = buildNormalizedMarketShare(marketShare);
  return [
    { label: '玩家奥迪', value: normalizedMarketShare.audi || 0, color: '#2563eb' },
    { label: '宝马系', value: normalizedMarketShare.bmw || 0, color: '#0284c7' },
    { label: '奔驰系', value: normalizedMarketShare.benz || 0, color: '#475569' },
    { label: '新能源', value: normalizedMarketShare.ev || 0, color: '#059669' },
    { label: '本品店', value: normalizedMarketShare.audiLocal || 0, color: '#4f46e5' },
    { label: '其他', value: normalizedMarketShare.other || 0, color: '#94a3b8' },
  ].filter(item => item.value > 0);
}

export function calculateOperatingScore({
  dayOfMonth,
  monthlyStats,
  netProfit,
  finance,
  csi,
  highTodoCount,
}) {
  const expectedProgress = Math.max(0.12, dayOfMonth / 30);
  const salesPaceScore = Math.min(32, (monthlyStats.target > 0 ? (monthlyStats.sales / monthlyStats.target) / expectedProgress : 0) * 32);
  return Math.max(0, Math.min(100, Math.round(
    salesPaceScore +
    Math.max(0, Math.min(22, 12 + netProfit / 45000)) +
    Math.max(0, Math.min(18, 18 - (finance.creditLimit > 0 ? finance.loan / finance.creditLimit : 1) * 14 + Math.min(4, finance.cash / 900000))) +
    Math.max(0, Math.min(16, (csi.score - 75) / 25 * 16)) +
    Math.max(0, 12 - highTodoCount * 4)
  )));
}

export function buildBriefingMetrics({
  todoQueue,
  operatingRating,
  operatingScore,
  finance,
  marketEnvironment,
  monthlyStats,
  totalLeadPool,
  csi,
  formatMoney,
}) {
  return [
    { label: '今日重点', value: todoQueue[0]?.title || '经营节奏正常' },
    { label: '经营评级', value: `${operatingRating.grade}级 ${operatingScore}分` },
    { label: '现金/负债', value: `${formatMoney(finance.cash)} / ${formatMoney(finance.loan)}` },
    { label: '市场状态', value: `${marketEnvironment.seasonName} ×${marketEnvironment.seasonIndex.toFixed(2)}` },
    { label: '本月销量', value: `${monthlyStats.sales}/${monthlyStats.target} 台` },
    { label: '线索池', value: `${totalLeadPool} 条` },
    { label: 'CSI', value: `${Math.round(csi.score)} 分` },
  ];
}
