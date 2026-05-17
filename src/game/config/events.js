export const SALES_COMPLAINTS = [
  { title: '交车延期投诉', desc: '客户认为销售承诺的交车时间没有兑现，要求店总给说法。', impact: 5 },
  { title: '赠品承诺争议', desc: '销售顾问口头承诺的精品礼包没有在交车时准备好。', impact: 4 },
  { title: '金融方案解释不清', desc: '客户对月供、手续费和GPS费用产生质疑，要求重新解释并补偿。', impact: 4 },
  { title: '价格前后不一致', desc: '客户发现报价单与沟通价格存在差异，情绪已经比较激动。', impact: 6 },
];

export const AFTERSALES_COMPLAINTS = [
  { title: '维修等待过长', desc: '客户在售后等待时间过长，认为服务接待安排混乱。', impact: 4 },
  { title: '返修争议', desc: '车辆维修后同一问题再次出现，客户要求免费处理并补偿。', impact: 6 },
  { title: '配件缺货投诉', desc: '客户对配件等待周期不满，担心影响用车。', impact: 4 },
  { title: '维修报价争议', desc: '客户认为售后报价过高，质疑存在过度维修。', impact: 5 },
];

export const NEGOTIATION_TEMPLATES = {
  manufacturer_subsidy: {
    title: '向厂家申请长库龄专项补贴',
    from: '厂家商务部',
    desc: '把库龄压力说清楚，争取额外返利或区域清库支持。',
    options: [
      { id: 'data', label: '拿数据谈库存压力', successRate: 0.58, desc: '成功率中等，成功后补贴更稳。' },
      { id: 'commit', label: '承诺下月订车换支持', successRate: 0.72, desc: '成功率高，但投资人可能认为激进。' },
      { id: 'hard', label: '强硬压厂家给政策', successRate: 0.42, desc: '成功则补贴高，失败会影响关系。' },
    ],
  },
  bank_credit: {
    title: '向银行申请临时授信',
    from: '合作银行',
    desc: '用库存、现金流和月底返利预期说服银行给一段临时额度。',
    options: [
      { id: 'conservative', label: '保守申请100万', successRate: 0.72, desc: '容易通过，额度有限。' },
      { id: 'growth', label: '申请300万冲量额度', successRate: 0.48, desc: '成败看经营数据。' },
      { id: 'pledge', label: '质押库存换500万', successRate: 0.34, desc: '额度大，失败会被银行重点盯防。' },
    ],
  },
  investor_cash: {
    title: '向投资人申请追加现金',
    from: '投资人办公室',
    desc: '请求股东注入现金，换取更多经营缓冲。',
    options: [
      { id: 'bridge', label: '申请80万周转资金', successRate: 0.62, desc: '较温和，主要看信任度。' },
      { id: 'expansion', label: '申请200万扩张资金', successRate: 0.38, desc: '适合冲量型投资人。' },
      { id: 'emergency', label: '承认危机求救300万', successRate: 0.28, desc: '可能救命，但失败会伤害评价。' },
    ],
  },
  marketing_support: {
    title: '向厂家争取区域营销支持',
    from: '厂家市场部',
    desc: '争取区域广告、车展资源或置换专项线索。',
    options: [
      { id: 'local', label: '申请本地投流共担', successRate: 0.56, desc: '获得线索和少量现金支持。' },
      { id: 'autoshow', label: '申请区域车展资源', successRate: 0.46, desc: '直接提升短期自然客流。' },
      { id: 'tradein', label: '申请置换专项活动', successRate: 0.50, desc: '适合新能源强势区。' },
    ],
  },
  loss_explain: {
    title: '向投资人解释本月亏损原因',
    from: '投资人办公室',
    desc: '用经营逻辑解释亏损，争取避免被限制预算或订车。',
    options: [
      { id: 'market', label: '归因市场价格战', successRate: 0.50, desc: '适合高竞争区域。' },
      { id: 'investment', label: '强调前置投入换增长', successRate: 0.52, desc: '适合冲量和赌徒型投资人。' },
      { id: 'fix', label: '提交降本整改清单', successRate: 0.66, desc: '更容易稳住保守/财务型投资人。' },
    ],
  },
};
