export const ONBOARDING_TRAINING_WINDOW_DAYS = 7;

export const ONBOARDING_TRAINING_COPY = {
  defaultLockedHint: '先完成前一天训练，再解锁下一步经营动作。',
  finishedTitle: '前7天经营训练完成',
  finishedSummary: '你已经走完BI诊断、订车、布展、投流、成交、CSI/厂家和报表复盘的基础闭环。',
};

export const ONBOARDING_TRAINING_DAYS = [
  {
    id: 'day1_bi',
    day: 1,
    title: '第1天：先看经营BI',
    summary: '开局先用BI判断销量节奏、现金覆盖、库存和CSI风险，避免凭感觉经营。',
    targetTab: 'bi',
    checklist: [
      { id: 'open_bi', text: '打开经营BI页，查看今日风险标题。', completionKey: 'visited:bi' },
      { id: 'review_risk', text: '确认销量、现金、库存、CSI四类风险至少一项。', completionKey: 'reviewedBusinessIntelligence' },
    ],
    actionHint: '从利润中心进入经营BI，先读风险标题，再决定今天先补库存、补客流还是保现金。',
    reward: '完成后解锁订车训练：你会知道为什么不是“有钱就订车”。',
    completionText: '已建立先诊断再行动的经营节奏。',
  },
  {
    id: 'day2_order',
    day: 2,
    title: '第2天：订一批能卖的车',
    summary: '根据BI和现金情况，用厂家订货补齐主力库存，不让展厅和谈判断档。',
    targetTab: 'order',
    checklist: [
      { id: 'open_order', text: '打开厂家订货页，查看可订车型。', completionKey: 'visited:order' },
      { id: 'place_order', text: '形成在途订单或已有可售库存。', completionKey: 'hasPendingOrderOrInventory' },
    ],
    actionHint: '优先选择主力车型和现金可承受的数量，别为了采购目标一次压满库存。',
    reward: '完成后解锁布展训练：库存要进入展厅才会转化为客流信心。',
    completionText: '已完成基础库存补给判断。',
  },
  {
    id: 'day3_showroom',
    day: 3,
    title: '第3天：把车摆进展厅',
    summary: '展厅陈列会影响自然客流、客户信任和成交转化，仓库有车也要会展示。',
    targetTab: 'showroom',
    checklist: [
      { id: 'open_showroom', text: '打开展厅定价页，查看展车和库龄。', completionKey: 'visited:showroom' },
      { id: 'display_car', text: '至少有一台车位于展厅。', completionKey: 'hasShowroomDisplay' },
    ],
    actionHint: '把主力车型优先移入展厅，并留意长库龄车辆是否需要调价或补贴。',
    reward: '完成后解锁投流训练：有展示基础后再买线索更有效。',
    completionText: '已完成展厅陈列基础动作。',
  },
  {
    id: 'day4_marketing',
    day: 4,
    title: '第4天：投流拉客到店',
    summary: '营销不是单纯花钱买线索，要看渠道成本、到店率和库存承接能力。',
    targetTab: 'marketing',
    checklist: [
      { id: 'open_marketing', text: '打开漏斗营销页，查看渠道漏斗。', completionKey: 'visited:marketing' },
      { id: 'launch_campaign', text: '产生投流成本、活动或新增线索。', completionKey: 'hasMarketingSpendOrLeads' },
    ],
    actionHint: '先小额测试一个渠道，观察线索、到店和现金压力，再决定是否加码。',
    reward: '完成后解锁成交训练：客流进入漏斗后，要把机会推进到订单。',
    completionText: '已完成基础获客动作。',
  },
  {
    id: 'day5_deal',
    day: 5,
    title: '第5天：推进一次成交',
    summary: '成交训练关注机会池、客户谈判和审批，核心是把到店客户转成有效订单。',
    targetTab: 'opportunities',
    checklist: [
      { id: 'open_opportunities', text: '打开机会池或客户谈判页，查看待跟进客户。', completionKey: 'visitedAny:opportunities,customer' },
      { id: 'handle_deal', text: '处理一次机会、谈判、审批或成交结果。', completionKey: 'hasHandledDealFlow' },
    ],
    actionHint: '优先处理高意向客户，报价时兼顾毛利、库存压力和金融衍生收益。',
    reward: '完成后解锁CSI/厂家训练：卖出去以后，口碑和厂家关系会继续影响利润。',
    completionText: '已完成基础销售转化动作。',
  },
  {
    id: 'day6_csi_factory',
    day: 6,
    title: '第6天：处理CSI和厂家关系',
    summary: 'CSI、客诉、采购目标和厂家政策会影响返利、授权和后续经营空间。',
    targetTab: 'csi',
    checklist: [
      { id: 'open_csi_or_rebate', text: '打开CSI满意度、返利或厂家相关页面。', completionKey: 'visitedAny:csi,rebate,order' },
      { id: 'review_factory', text: '检查CSI、投诉、采购目标或厂家返利进度。', completionKey: 'hasReviewedCsiOrManufacturer' },
    ],
    actionHint: 'CSI低时先处理投诉和交付体验；厂家目标落后时先评估现金，再决定是否补采。',
    reward: '完成后解锁报表训练：月底复盘要把销量、利润、现金和口碑放在一起看。',
    completionText: '已完成口碑与厂家压力检查。',
  },
  {
    id: 'day7_reports',
    day: 7,
    title: '第7天：看报表复盘',
    summary: '用财务报表和经营结果复盘一周动作，确认利润、现金、库存和目标节奏。',
    targetTab: 'reports',
    checklist: [
      { id: 'open_reports', text: '打开财务报表页，查看收入、成本和利润结构。', completionKey: 'visited:reports' },
      { id: 'review_report', text: '形成至少一条报表、经营评分或复盘样本。', completionKey: 'hasReportSample' },
    ],
    actionHint: '先看净利润和现金覆盖，再回看销量节奏、库存库龄、CSI和厂家目标。',
    reward: '完成后你已经掌握前7天经营闭环，可以开始独立安排日常节奏。',
    completionText: '已完成新手经营闭环复盘。',
  },
];
