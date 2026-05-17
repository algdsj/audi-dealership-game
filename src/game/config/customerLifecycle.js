export const CUSTOMER_LIFECYCLE_DIFFICULTY = {
  rookie: { followUpChanceMultiplier: 1.25, successModifier: 0.08, maxDailyFollowUps: 2, costMultiplier: 0.85 },
  standard: { followUpChanceMultiplier: 1, successModifier: 0, maxDailyFollowUps: 2, costMultiplier: 1 },
  hardcore: { followUpChanceMultiplier: 0.8, successModifier: -0.08, maxDailyFollowUps: 1, costMultiplier: 1.18 },
};

export const CUSTOMER_FOLLOWUP_TYPES = {
  referral: {
    title: '老客户转介绍',
    sourceStatus: 'sold',
    minDaysAfter: 3,
    baseChance: 0.11,
    body: '成交客户对交付体验仍有印象，适合请求转介绍或朋友圈背书。',
    successText: '客户愿意转介绍，展厅自然线索增加。',
    effects: { leadChannels: { showroom: 2 }, monthlyStats: { referralLeads: 2 }, csiDelta: 0.2 },
  },
  satisfaction: {
    title: '交付满意回访',
    sourceStatus: 'sold',
    minDaysAfter: 2,
    baseChance: 0.08,
    body: '客户刚完成交付，及时回访能修复小摩擦，稳住口碑。',
    successText: '回访有效，客户满意度提升。',
    effects: { csiDelta: 0.45 },
  },
  revival: {
    title: '战败客户复活',
    sourceStatus: 'lost',
    minDaysAfter: 4,
    baseChance: 0.09,
    body: '此前流失客户仍可能在竞品间犹豫，适合用现车和明确方案二次激活。',
    successText: '客户重新进入购车视野，展厅线索增加。',
    effects: { leadChannels: { showroom: 1 }, monthlyStats: { recoveredLeads: 1 } },
  },
  renewal: {
    title: '续保/回厂机会',
    sourceStatus: 'sold',
    minDaysAfter: 18,
    baseChance: 0.06,
    body: '成交客户进入售后经营周期，适合引导续保、回厂和精品服务。',
    successText: '客户接受后续服务邀约，续保线索增加。',
    effects: { insuranceRenewals: { pending: 1 }, monthlyStats: { insuranceRenewalRevenue: 0 }, csiDelta: 0.15 },
  },
};

export const CUSTOMER_FOLLOWUP_ACTIONS = [
  {
    id: 'message',
    title: '轻触达',
    description: '用短信或微信做低成本提醒，成功率一般。',
    cost: 0,
    successModifier: -0.04,
    effectMultiplier: 0.8,
  },
  {
    id: 'call',
    title: '顾问电话',
    description: '让销售顾问做一次明确沟通，成本低且更稳。',
    cost: 300,
    successModifier: 0.04,
    effectMultiplier: 1,
  },
  {
    id: 'benefit',
    title: '小权益维护',
    description: '给到保养券、精品券或上门服务，成本更高但成功率最好。',
    cost: 1200,
    successModifier: 0.12,
    effectMultiplier: 1.25,
  },
];
