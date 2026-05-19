import { getQuarterlyChallengeByMonth } from '../config/quarterlyChallenges.js';

const safeNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const ratio = (value, base) => (safeNumber(base) > 0 ? safeNumber(value) / safeNumber(base) : 0);
const clampPercent = value => Math.max(0, Math.min(100, Math.round(value)));

const defaultFormatMoney = amount => `¥${Math.round(amount || 0).toLocaleString()}`;

const makeFinding = (id, label, value, detail, action, tone = 'slate') => ({
  id,
  label,
  value,
  detail,
  action,
  tone,
});

export function buildOperatingReviewReport({
  month,
  monthlyStats = {},
  finance = {},
  financeSnapshot = {},
  inventory = [],
  csi = {},
  manufacturerPolicy = {},
  investorReview = {},
  feedback = {},
  competitors = {},
  formatMoney = defaultFormatMoney,
} = {}) {
  const challenge = getQuarterlyChallengeByMonth(month);
  const cashCoverageDays = safeNumber(financeSnapshot.cashCoverageDays);
  const debtRatio = safeNumber(financeSnapshot.debtRatio);
  const salesAchieveRate = ratio(monthlyStats.sales, monthlyStats.target);
  const marketShare = safeNumber(competitors.ownShare || competitors.marketShare || 0);
  const hqRelationship = safeNumber(manufacturerPolicy.roles?.hq?.relationship);
  const regionRelationship = safeNumber(manufacturerPolicy.roles?.region?.relationship);
  const csiScore = safeNumber(csi.score || monthlyStats.csiScore);
  const complaintCount = safeNumber(csi.complaints);
  const netProfit = safeNumber(financeSnapshot.netProfit ?? investorReview.monthNetProfit);
  const inventoryCount = inventory.length;
  const agedInventoryCount = inventory.filter(car => safeNumber(car.stockDays) >= 60).length;
  const avgStockDays = inventoryCount > 0
    ? inventory.reduce((sum, car) => sum + safeNumber(car.stockDays), 0) / inventoryCount
    : 0;
  const excellentMonthCount = (feedback.ratingHistory || []).filter(item => (item.score || 0) >= 82 || (item.investorScore || 0) >= 82).length
    + ((investorReview.score || 0) >= 82 ? 1 : 0);

  const findings = [
    netProfit < 0
      ? makeFinding(
        'profit_loss',
        '利润亏损',
        formatMoney(netProfit),
        `本月 GP3 与固定费用、库存融资、仓储和厂家扣罚相抵后为负。`,
        '先看亏损 driver：前端倒挂、固定成本和库存融资三项通常最先吞利润。',
        'red',
      )
      : makeFinding(
        'profit_positive',
        '利润转正',
        formatMoney(netProfit),
        '本月经营净利润为正，说明返利、衍生、售后或二手车已经覆盖主要费用。',
        '继续保持现金回笼，不要为了下月目标盲目加库存。',
        'emerald',
      ),
    cashCoverageDays < 15
      ? makeFinding(
        'cash_pressure',
        '现金承压',
        `${cashCoverageDays}天`,
        `现金 ${formatMoney(finance.cash)}，现金覆盖低于安全线，汇票或订货会放大风险。`,
        '下月先压订车和投流，优先卖现车、处理长库龄、盯汇票到期。',
        'red',
      )
      : makeFinding(
        'cash_safe',
        '现金安全',
        `${cashCoverageDays}天`,
        `现金覆盖保持在可经营区间，短期有余地处理厂家目标或市场动作。`,
        '可以小步谈厂家资源，但仍要避免库存和负债一起上行。',
        'emerald',
      ),
    agedInventoryCount > 0
      ? makeFinding(
        'inventory_aging',
        '库存老化',
        `${agedInventoryCount}/${inventoryCount}`,
        `平均库龄 ${Math.round(avgStockDays)} 天，长库龄会压现金、库容和厂家/投资人观感。`,
        '把长库龄车列入展厅、补贴、批售或金融组合包，别只等自然成交。',
        agedInventoryCount >= 3 ? 'red' : 'amber',
      )
      : makeFinding(
        'inventory_clean',
        '库存健康',
        `${inventoryCount}台`,
        '本月没有明显长库龄包袱，库存结构暂未拖累经营评分。',
        '保持主销车型周转，别让区域压库奖励掩盖真实消化能力。',
        'emerald',
      ),
    csiScore < 85 || complaintCount > 0
      ? makeFinding(
        'csi_risk',
        '口碑风险',
        `${Math.round(csiScore)}分`,
        `投诉 ${complaintCount} 起，CSI 会同时影响返利、成交转化和总部合规印象。`,
        '下月先处理投诉、交付承诺和售后回访，再考虑强冲销量。',
        csiScore < 75 ? 'red' : 'amber',
      )
      : makeFinding(
        'csi_good',
        '口碑稳定',
        `${Math.round(csiScore)}分`,
        'CSI 保持健康，有利于总部评价、自然进店和老客转介绍。',
        '把高 CSI 转化为售后回厂、续保和转介绍线索。',
        'emerald',
      ),
    regionRelationship < 58 || hqRelationship < 58
      ? makeFinding(
        'manufacturer_relation',
        '厂家关系偏紧',
        `总部${Math.round(hqRelationship)} / 大区${Math.round(regionRelationship)}`,
        '总部和大区的诉求不同，关系偏紧会影响返利质量、资源置换和稽核容忍度。',
        '区域用采购/份额谈资源，总部用CSI/合规换信任，不要混成一个目标处理。',
        'amber',
      )
      : makeFinding(
        'manufacturer_relation',
        '厂家关系稳定',
        `总部${Math.round(hqRelationship)} / 大区${Math.round(regionRelationship)}`,
        '厂家双线关系处于可沟通状态，适合把资源谈判和合规承诺结合起来。',
        '下月可根据现金覆盖决定是否争取市场共投或库存融资支持函。',
        'blue',
      ),
  ];

  const challengeChecks = [
    challenge.targets.cashCoverageDays
      ? { label: '现金覆盖', actual: cashCoverageDays, target: challenge.targets.cashCoverageDays, passed: cashCoverageDays >= challenge.targets.cashCoverageDays, suffix: '天' }
      : null,
    challenge.targets.debtRatioMax
      ? { label: '资产负债率', actual: Math.round(debtRatio * 100), target: Math.round(challenge.targets.debtRatioMax * 100), passed: debtRatio <= challenge.targets.debtRatioMax, suffix: '%' }
      : null,
    challenge.targets.netProfitFloor !== undefined
      ? { label: '净利润', actual: netProfit, target: challenge.targets.netProfitFloor, passed: netProfit >= challenge.targets.netProfitFloor, format: formatMoney }
      : null,
    challenge.targets.salesAchieveRate
      ? { label: '销量达成', actual: Math.round(salesAchieveRate * 100), target: Math.round(challenge.targets.salesAchieveRate * 100), passed: salesAchieveRate >= challenge.targets.salesAchieveRate, suffix: '%' }
      : null,
    challenge.targets.marketShare
      ? { label: '市场份额', actual: Math.round(marketShare * 100), target: Math.round(challenge.targets.marketShare * 100), passed: marketShare >= challenge.targets.marketShare, suffix: '%' }
      : null,
    challenge.targets.regionRelationship
      ? { label: '大区关系', actual: Math.round(regionRelationship), target: challenge.targets.regionRelationship, passed: regionRelationship >= challenge.targets.regionRelationship }
      : null,
    challenge.targets.csiScore
      ? { label: 'CSI', actual: Math.round(csiScore), target: challenge.targets.csiScore, passed: csiScore >= challenge.targets.csiScore }
      : null,
    challenge.targets.complaintMax !== undefined
      ? { label: '投诉数', actual: complaintCount, target: challenge.targets.complaintMax, passed: complaintCount <= challenge.targets.complaintMax }
      : null,
    challenge.targets.afterSalesReturnVisits
      ? { label: '售后回厂', actual: safeNumber(monthlyStats.afterSalesReturnVisits), target: challenge.targets.afterSalesReturnVisits, passed: safeNumber(monthlyStats.afterSalesReturnVisits) >= challenge.targets.afterSalesReturnVisits }
      : null,
    challenge.targets.hqRelationship
      ? { label: '总部关系', actual: Math.round(hqRelationship), target: challenge.targets.hqRelationship, passed: hqRelationship >= challenge.targets.hqRelationship }
      : null,
    challenge.targets.excellentMonthCount
      ? { label: 'A/S月评', actual: excellentMonthCount, target: challenge.targets.excellentMonthCount, passed: excellentMonthCount >= challenge.targets.excellentMonthCount, suffix: '次' }
      : null,
  ].filter(Boolean);
  const passedCount = challengeChecks.filter(item => item.passed).length;
  const progress = challengeChecks.length > 0 ? clampPercent((passedCount / challengeChecks.length) * 100) : 0;

  const nextActions = findings
    .filter(item => item.tone === 'red' || item.tone === 'amber')
    .slice(0, 3)
    .map(item => item.action);
  if (nextActions.length === 0) {
    nextActions.push('保持当前节奏，优先把季度挑战未完成项补齐。');
  }

  const headline = `${challenge.label}进度 ${progress}%：${challenge.theme}`;

  return {
    challenge: {
      ...challenge,
      progress,
      passedCount,
      totalCount: challengeChecks.length,
      checks: challengeChecks,
    },
    findings,
    nextActions,
    headline,
  };
}
