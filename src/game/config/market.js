export const SEASON_MARKET_FACTORS = [
  { name: '平季', index: 1.0, desc: '市场需求平稳，客流和价格无明显扰动。' },
  { name: '春季焕新', index: 1.08, desc: '换车需求回暖，家庭与年轻客群更活跃。' },
  { name: '暑期淡季', index: 0.92, desc: '高温和出游分流客流，进店节奏放缓。' },
  { name: '金九银十', index: 1.15, desc: '传统旺季到来，客流和成交意愿同步走强。' },
  { name: '年底冲量', index: 1.12, desc: '厂家冲量与消费者年底购车叠加，市场波动加大。' },
  { name: '春节前后', index: 0.88, desc: '节假日打断成交节奏，但返乡用车需求仍有机会。' },
];

export const COMPETITOR_EVENTS = [
  { name: '竞品新车上市', desc: '同级竞品集中发布新款，年轻客群被分流。', affectedSegments: ['年轻'], affectedSeries: ['A3L', 'A5L'], priceDrift: -0.012, demandImpact: -0.08 },
  { name: '豪华品牌价格战', desc: '竞品终端折扣扩大，商务客群对价格更敏感。', affectedSegments: ['商务'], affectedSeries: ['A6L'], priceDrift: -0.018, demandImpact: -0.06 },
  { name: '新能源SUV热销', desc: '家庭与新能源客群关注纯电SUV，Q5L和Q6 e-tron同时面对强竞品比价。', affectedSegments: ['家庭', '新能源'], affectedSeries: ['Q5L', 'Q6L e-tron'], priceDrift: -0.014, demandImpact: -0.07 },
  { name: '竞品缺货', desc: '主要竞品交付周期拉长，奥迪门店截流机会增加。', affectedSegments: ['年轻', '商务', '家庭', '新能源'], affectedSeries: ['A3L', 'A5L', 'A6L', 'Q5L', 'Q6L e-tron'], priceDrift: 0.008, demandImpact: 0.06 },
];

export const SUPPLY_CHAIN_EVENTS = [
  { name: '供应稳定', desc: '物流与厂家排产正常。', priceDrift: 0, delayDays: 0 },
  { name: '物流紧张', desc: '运输资源紧张，到货周期略有延长。', priceDrift: 0.006, delayDays: 1 },
  { name: '厂家配额收紧', desc: '部分车型配额偏紧，市场价获得支撑。', priceDrift: 0.012, delayDays: 2 },
  { name: '区域库存充足', desc: '区域库存偏多，市场终端价格承压。', priceDrift: -0.008, delayDays: 0 },
];

export const DEALER_REGIONS = [
  { id: 'low_comp', name: '低竞争三四线', marketSizeId: 'small', desc: '客流少、价格稳、人才少，库存压力低。', demand: 0.84, pricePressure: 0.014, leadCost: 0.94, turnover: 0.76, credit: 0.86, competitorChance: 0.42, csiPressure: 0, inventoryPressure: 0.88, staffSupply: 0.82 },
  { id: 'capital', name: '中竞争省会', marketSizeId: 'medium', desc: '客流正常、价格有波动，竞品动作频繁。', demand: 1.0, pricePressure: 0, leadCost: 1.0, turnover: 1.0, credit: 1.0, competitorChance: 0.6, csiPressure: 0, inventoryPressure: 1.0, staffSupply: 1.0 },
  { id: 'tier1', name: '高竞争一线', marketSizeId: 'large', desc: '客流高但价格战严重，员工容易被挖，CSI压力高。', demand: 1.24, pricePressure: -0.026, leadCost: 1.12, turnover: 1.22, credit: 1.22, competitorChance: 0.72, csiPressure: 0.16, inventoryPressure: 1.08, staffSupply: 1.18 },
  { id: 'nev_hot', name: '新能源强势区', marketSizeId: 'medium', desc: '燃油豪华车承压，Q5/A6转化更难，但置换和纯电SUV机会更多。', demand: 1.0, pricePressure: -0.018, leadCost: 1.04, turnover: 1.04, credit: 1.04, competitorChance: 0.68, csiPressure: 0.06, inventoryPressure: 1.0, staffSupply: 1.04, segmentPressure: ['家庭', '商务'], segmentDemandImpact: -0.035, tradeInBoost: 0.26 },
];

export const MARKET_SIZE_OPTIONS = [
  { id: 'small', name: '小城市', icon: '🏘️', desc: '2个竞品，市场小但竞争少，适合稳扎稳打。', totalMarketSize: 120, counts: { audiLocal: 0, bmw: 1, benz: 1, ev: 0 } },
  { id: 'medium', name: '中等城市', icon: '🏙️', desc: '5个竞品，标准强度，既有本品店也有新能源压力。', totalMarketSize: 200, counts: { audiLocal: 1, bmw: 2, benz: 2, ev: 1 } },
  { id: 'large', name: '一线城市', icon: '🌆', desc: '9个竞品，市场大但价格战和挖人更频繁。', totalMarketSize: 320, counts: { audiLocal: 2, bmw: 3, benz: 3, ev: 2 } },
];

export const COMPETITOR_BRANDS = {
  bmw: { label: '宝马', tier: 'premium', names: ['宝马东城店', '宝马星河店', '宝马中心店'], basePull: 58 },
  benz: { label: '奔驰', tier: 'luxury', names: ['奔驰尊享店', '奔驰银座店', '奔驰城南店'], basePull: 60 },
  ev: { label: '新能源', tier: 'ev', names: ['蔚来中心', '理想直营店', '问界用户中心'], basePull: 64 },
  audi_local: { label: '同城奥迪', tier: 'premium', names: ['奥迪同城店', '奥迪北区店'], basePull: 54 },
};

export const COMPETITOR_STRATEGIES = [
  { id: 'aggressive', label: '激进降价' },
  { id: 'service', label: '服务导向' },
  { id: 'digital', label: '线上获客' },
];

export const COMPETITOR_INTEL_LEVELS = [
  { id: 'low', label: '模糊', minConfidence: 0, tone: 'text-slate-500 bg-slate-50 border-slate-200', countermeasureMultiplier: 0.72 },
  { id: 'medium', label: '可参考', minConfidence: 45, tone: 'text-amber-700 bg-amber-50 border-amber-200', countermeasureMultiplier: 0.9 },
  { id: 'high', label: '可靠', minConfidence: 75, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', countermeasureMultiplier: 1 },
];

export const COMPETITOR_INTEL_ACTIONS = {
  market_scout: {
    id: 'market_scout',
    name: '市场摸底',
    cost: 12000,
    confidenceGain: 14,
    revealCount: 1,
    scope: 'market',
    desc: '走访商圈、二网和车友群，补齐一家隐藏竞品并提升可见门店情报。',
  },
  customer_feedback: {
    id: 'customer_feedback',
    name: '客户回访',
    cost: 6000,
    confidenceGain: 8,
    revealCount: 0,
    scope: 'external_visible',
    desc: '从战败和比价客户里复盘竞品报价、金融和交付口径。',
  },
  store_probe: {
    id: 'store_probe',
    name: '定向摸底',
    cost: 9000,
    confidenceGain: 22,
    revealCount: 0,
    scope: 'store',
    desc: '针对一家已识别门店做展厅、报价和人员动态核实。',
  },
};

export const COMPETITOR_INTEL_DIFFICULTY = {
  rookie: { gainMultiplier: 1.15, costMultiplier: 0.9 },
  standard: { gainMultiplier: 1, costMultiplier: 1 },
  hardcore: { gainMultiplier: 0.82, costMultiplier: 1.12 },
};

export const CUSTOMER_LOSS_INTEL_CONFIG = {
  baseGain: 5,
  statusGain: {
    lost: 7,
    rejected: 4,
  },
  competitorPullGain: 8,
  competitorQuoteBonus: 4,
  revealCompetitorPullThreshold: 0.52,
  maxGain: 18,
  segmentBrandWeights: {
    年轻: { bmw: 8, ev: 7, benz: 3 },
    商务: { benz: 8, bmw: 6, ev: 2 },
    家庭: { ev: 8, benz: 5, bmw: 4 },
    新能源: { ev: 10, bmw: 4, benz: 3 },
  },
  objectionBrandWeights: {
    '竞品/同城报价更低': { bmw: 4, benz: 4, ev: 3 },
    '预算上限卡得很紧': { bmw: 3, ev: 3, benz: 2 },
    '担心金融条款不透明': { benz: 3, bmw: 2 },
    '还要回去和家人商量': { ev: 3, benz: 2 },
    '怕交车和赠品承诺落空': { benz: 3, bmw: 2 },
  },
};
