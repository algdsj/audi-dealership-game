export const INVESTOR_PROFILES = [
  { id: 'cash_guardian', name: '保守现金流型投资人', desc: '要求低负债、稳利润，不喜欢激进订车。', weights: { profit: 0.25, cash: 0.35, sales: 0.12, csi: 0.14, inventory: 0.14, staff: 0.00 }, riskTolerance: 0.55, budgetStyle: 'tight' },
  { id: 'volume_growth', name: '冲量扩张型投资人', desc: '要求销量增长，容忍短期亏损。', weights: { profit: 0.16, cash: 0.10, sales: 0.44, csi: 0.10, inventory: 0.12, staff: 0.08 }, riskTolerance: 0.85, budgetStyle: 'growth' },
  { id: 'roi_first', name: '财务回报型投资人', desc: '盯净利润、ROA和库存周转。', weights: { profit: 0.38, cash: 0.16, sales: 0.12, csi: 0.08, inventory: 0.22, staff: 0.04 }, riskTolerance: 0.65, budgetStyle: 'roi' },
  { id: 'brand_keeper', name: '品牌口碑型投资人', desc: '盯CSI、投诉和人员稳定。', weights: { profit: 0.16, cash: 0.12, sales: 0.12, csi: 0.36, inventory: 0.10, staff: 0.14 }, riskTolerance: 0.7, budgetStyle: 'brand' },
  { id: 'gambler', name: '赌徒型投资人', desc: '追求高增长，月底评价非常极端。', weights: { profit: 0.12, cash: 0.08, sales: 0.52, csi: 0.08, inventory: 0.10, staff: 0.10 }, riskTolerance: 1.05, budgetStyle: 'volatile', swing: 1.35 },
];

export const INVESTOR_WEIGHT_LABELS = [
  ['sales', '销量'],
  ['profit', '利润'],
  ['cash', '现金'],
  ['csi', '口碑'],
  ['inventory', '库存'],
  ['staff', '人员'],
];
