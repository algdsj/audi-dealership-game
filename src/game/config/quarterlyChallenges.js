export const QUARTERLY_CHALLENGES = [
  {
    id: 'q1_cash_defense',
    quarter: 1,
    label: 'Q1 保现金流',
    theme: '现金安全与生存质量',
    desc: '第一季度先活下来：现金覆盖、负债和库存不要一起失控。',
    focusTabs: ['bi', 'reports', 'draft'],
    targets: {
      cashCoverageDays: 18,
      debtRatioMax: 0.78,
      netProfitFloor: -180000,
    },
  },
  {
    id: 'q2_regional_rank',
    quarter: 2,
    label: 'Q2 冲区域排名',
    theme: '销量节奏与区域份额',
    desc: '第二季度要开始抢区域存在感：销量达成、市场份额和厂家区域关系要抬起来。',
    focusTabs: ['order', 'rebate', 'market'],
    targets: {
      salesAchieveRate: 0.95,
      marketShare: 0.16,
      regionRelationship: 68,
    },
  },
  {
    id: 'q3_csi_repair',
    quarter: 3,
    label: 'Q3 修复 CSI',
    theme: '客户口碑与售后能力',
    desc: '第三季度别只冲量：CSI、投诉、售后回厂和老客运营要回到健康区间。',
    focusTabs: ['csi', 'aftersales', 'crm'],
    targets: {
      csiScore: 88,
      complaintMax: 1,
      afterSalesReturnVisits: 6,
    },
  },
  {
    id: 'q4_star_store',
    quarter: 4,
    label: 'Q4 年度返利/星级店',
    theme: '年度收官与厂家评价',
    desc: '第四季度争取把年度经营做成可续约的样子：净利润、返利、厂家总部关系和 A/S 月评是核心。',
    focusTabs: ['rebate', 'reports', 'dashboard'],
    targets: {
      netProfitFloor: 0,
      hqRelationship: 70,
      excellentMonthCount: 3,
    },
  },
];

export const getQuarterByMonth = month => Math.min(4, Math.max(1, Math.ceil((Number(month) || 1) / 3)));

export const getQuarterlyChallengeByMonth = month => (
  QUARTERLY_CHALLENGES.find(item => item.quarter === getQuarterByMonth(month)) || QUARTERLY_CHALLENGES[0]
);
