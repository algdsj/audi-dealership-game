export const DEFAULT_FEEDBACK = {
  unlockedAchievementIds: [],
  monthlyBadges: [],
  lastMonthReport: null,
  ratingHistory: [],
};

export const ACHIEVEMENTS = [
  { id: 'first_sale', name: '第一张订单', desc: '完成任意一台新车成交。', check: ctx => ctx.totalSold >= 1 },
  { id: 'target_month', name: '首个达成月', desc: '任意月份销量达到厂家目标。', check: ctx => ctx.lastReport?.achieveRate >= 1 },
  { id: 'csi_star', name: '口碑标杆', desc: 'CSI达到95分以上。', check: ctx => ctx.csiScore >= 95 },
  { id: 'cash_wall', name: '现金护城河', desc: '自有现金达到500万。', check: ctx => ctx.cash >= 5000000 },
  { id: 'used_car_lane', name: '置换生意人', desc: '累计拥有3台以上二手车库存或成交记录。', check: ctx => ctx.usedCarCount >= 3 },
  { id: 'investor_a', name: '投资人满意', desc: '投资人月评达到良好以上。', check: ctx => (ctx.lastInvestorScore || 0) >= 72 },
  { id: 'first_100k', name: '第一桶金', desc: '个人账户达到10万。', check: ctx => ctx.personalAccount >= 100000 },
  { id: 'millionaire', name: '百万经理人', desc: '个人账户达到100万。', check: ctx => ctx.personalAccount >= 1000000 },
  { id: 'first_bailout', name: '亲自救火', desc: '累计为公司垫资5万以上。', check: ctx => ctx.totalBailout >= 50000 },
  { id: 'self_sacrifice', name: '三次托底', desc: '累计垫资3次。', check: ctx => ctx.bailoutCount >= 3 },
  { id: 'high_salary', name: '高薪上任', desc: 'GM月薪达到3万以上。', check: ctx => ctx.monthlySalary >= 30000 },
  { id: 'draft_master', name: '票据高手', desc: '同时管理5张以上汇票且无逾期。', check: ctx => ctx.activeDraftCount >= 5 && ctx.overdueDraftCount === 0 },
  { id: 'credit_broken', name: '信用警戒线', desc: '银行信用低于30。', check: ctx => ctx.bankReputation < 30 },
  { id: 'credit_recover', name: '信用修复', desc: '经历汇票违约后银行信用恢复到60以上。', check: ctx => ctx.totalDraftsDefaulted > 0 && ctx.bankReputation >= 60 },
];
