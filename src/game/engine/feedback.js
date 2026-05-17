import { DEFAULT_FEEDBACK } from '../config/achievements.js';

export const normalizeFeedbackState = (value = {}) => {
  const source = value || {};
  return {
    ...DEFAULT_FEEDBACK,
    ...source,
    unlockedAchievementIds: Array.isArray(source.unlockedAchievementIds) ? source.unlockedAchievementIds : [],
    monthlyBadges: Array.isArray(source.monthlyBadges) ? source.monthlyBadges : [],
    ratingHistory: Array.isArray(source.ratingHistory) ? source.ratingHistory : [],
  };
};

export const getRatingMeta = (score) => {
  if (score >= 92) return { grade: 'S', label: '卓越', tone: 'emerald' };
  if (score >= 82) return { grade: 'A', label: '优秀', tone: 'green' };
  if (score >= 70) return { grade: 'B', label: '稳健', tone: 'blue' };
  if (score >= 58) return { grade: 'C', label: '承压', tone: 'amber' };
  return { grade: 'D', label: '危险', tone: 'red' };
};

export const buildLossDrivers = (stats, currentNetProfit) => {
  if (currentNetProfit >= 0) return [];
  const monthGp1 = (stats.revenue || 0) - (stats.cogs || 0);
  const derivativeProfit = (stats.derivativeRevenue || 0) - (stats.derivativeCost || 0);
  const afterSalesProfit = (stats.afterSalesRevenue || 0) - (stats.afterSalesCost || 0);
  const usedCarProfit = (stats.usedCarRevenue || 0) - (stats.usedCarCost || 0);
  const fixedCost = (stats.rent || 0) + (stats.depreciation || 0) + (stats.labor || 0);
  const drivers = [
    {
      label: '新车前端倒挂',
      amount: Math.max(0, -monthGp1),
      action: '检查车型定价，少用亏本车硬冲成交，把让利留给高返利或高金融意向客户。',
    },
    {
      label: '固定成本过高',
      amount: fixedCost,
      action: '控制招聘和设施扩张节奏，先让现有人员产能吃满。',
    },
    {
      label: '营销投放压力',
      amount: stats.marketingCost || 0,
      action: '看邀约到店率和转化率，低效时先停大额投流，改做老客维系或车展爆点。',
    },
    {
      label: '库存融资利息',
      amount: stats.financeCost || 0,
      action: '优先处理长库龄库存，卖车回款会自动降负债，必要时二网批售止血。',
    },
    {
      label: '仓储与库龄成本',
      amount: stats.storageCost || 0,
      action: '把可卖车型上展，长库龄车申请补贴或批售，避免120天强制处置。',
    },
    {
      label: '衍生业务不足',
      amount: derivativeProfit > 0 ? 0 : Math.abs(derivativeProfit),
      action: '用金融、延保、精品把GP3补起来，前端薄利才不至于变成真亏。',
    },
    {
      label: '售后/二手车贡献弱',
      amount: Math.max(0, -(afterSalesProfit + usedCarProfit)),
      action: '售后要补客服和技师产能，二手车先整备再零售，别让置换车只占现金。',
    },
  ];
  return drivers.filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 3);
};
