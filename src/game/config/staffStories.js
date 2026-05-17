export const STAFF_STORY_TYPES = {
  sales_champion_growth: {
    label: '销冠成长',
    tone: 'success',
    icon: '⭐',
    memoryWeight: 3,
    tags: ['growth', 'sales'],
  },
  pressure_alert: {
    label: '压力警报',
    tone: 'warning',
    icon: '😓',
    memoryWeight: 2,
    tags: ['stress', 'risk'],
  },
  competitor_offer: {
    label: '竞品邀约',
    tone: 'warning',
    icon: '🌐',
    memoryWeight: 3,
    tags: ['competitor', 'turnover'],
  },
  competitor_poached: {
    label: '竞品挖走',
    tone: 'danger',
    icon: '🚪',
    memoryWeight: 4,
    tags: ['competitor', 'turnover'],
  },
  retention_success: {
    label: '挽留成功',
    tone: 'success',
    icon: '🔒',
    memoryWeight: 2,
    tags: ['retention', 'loyalty'],
  },
  retention_failed: {
    label: '挽留失败',
    tone: 'danger',
    icon: '🚪',
    memoryWeight: 4,
    tags: ['retention', 'turnover'],
  },
  mentorship: {
    label: '师徒带教',
    tone: 'info',
    icon: '🤝',
    memoryWeight: 2,
    tags: ['mentor', 'growth'],
  },
  highlight_save: {
    label: '高光救场',
    tone: 'success',
    icon: '🌟',
    memoryWeight: 3,
    tags: ['highlight', 'operation'],
  },
};

export const STAFF_STORY_THRESHOLDS = {
  salesChampion: {
    minRole: 'sales',
    minSkill: 78,
    minLevel: 3,
    minMonthlySales: 4,
    minTargetProgress: 0.75,
  },
  pressureAlert: {
    stress: 82,
    previousStressBuffer: 8,
    loyaltyDanger: 36,
  },
  competitorOffer: {
    minSkill: 76,
    minTurnoverRisk: 3.5,
    stress: 62,
    loyalty: 48,
    chance: 0.28,
  },
  retention: {
    loyaltyLift: 5,
    stressRelief: 3,
  },
  mentorship: {
    seniorLevel: 3,
    juniorLevel: 1,
    seniorSkill: 68,
    chance: 0.35,
  },
  highlight: {
    minDailySales: 2,
    minMonthlySales: 6,
    targetProgress: 1,
    lowStaffSalesPerPerson: 2.4,
  },
};

export const STAFF_STORY_LOG_LABEL = '员工故事';
