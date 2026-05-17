export const DIFFICULTY_MODES = [
  { id: 'rookie', name: '新手', desc: '现金更厚，授信更宽，厂家任务更低。', cashMultiplier: 1.32, creditMultiplier: 1.28, targetMultiplier: 0.74, csiBonus: 7 },
  { id: 'standard', name: '标准', desc: '按当前经营模型运行，适合完整体验。', cashMultiplier: 1, creditMultiplier: 1, targetMultiplier: 1, csiBonus: 0 },
  { id: 'hardcore', name: '硬核', desc: '现金更紧，授信更少，任务更重，口碑起点更低。', cashMultiplier: 0.70, creditMultiplier: 0.76, targetMultiplier: 1.36, csiBonus: -10 },
];

export const GAME_SCENARIOS = [
  { id: 'free', name: '自由模式', months: 0, goal: '没有固定任期目标，长期经营门店；只要不破产、不被解聘，就可以一直玩。', targetNetAssets: 0 },
  { id: 'survive6', name: '6个月保住职位', months: 6, goal: '任期内不破产、不被投资人连续差评解聘。', targetNetAssets: 3000000 },
  { id: 'double12', name: '12个月净资产翻倍', months: 12, goal: '12个月后净资产达到600万。', targetNetAssets: 6000000 },
  { id: 'star12', name: '12个月区域明星店', months: 12, goal: '守住净资产，并拿到至少3个月A/S级月评。', targetNetAssets: 3600000, minExcellentMonths: 3 },
];

export const TUTORIAL_STEPS = [
  { id: 'order', title: '第一步：订车', detail: '从销售运营进入厂家订货，先用库存融资或汇票订一批主力车型。', tab: 'order', done: ctx => ctx.inventory.length + ctx.pendingOrders.length > 0 },
  { id: 'arrival', title: '第二步：等车到货', detail: '推进日结，车辆会在3-7天后抵达仓储区。', tab: 'order', done: ctx => ctx.inventory.length > 0 },
  { id: 'showroom', title: '第三步：布展', detail: '把仓储车辆移入展厅，展车会提升自然客流和成交转化。', tab: 'showroom', done: ctx => ctx.inventory.some(car => car.location === 'showroom') },
  { id: 'deal', title: '第四步：成交', detail: '推进经营并处理客户谈判或总经理批价，完成第一台真实成交。', tab: 'customer', done: ctx => ctx.monthlyStats.sales > 0 || ctx.soldVehicles.length > 0 },
  { id: 'month', title: '第五步：月结', detail: '经营到M1 D30，查看返利、投资人评分和下月政策。', tab: 'dashboard', done: ctx => ctx.month > 1 || ctx.feedbackState.ratingHistory.length > 0 },
];
