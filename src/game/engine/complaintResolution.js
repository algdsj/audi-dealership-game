export const resolveComplaintResolution = ({
  item,
  mode,
  finance,
  csi,
  formatMoney = value => String(value),
  random = Math.random,
}) => {
  if (!item || item.type !== 'complaint') return { status: 'invalid' };

  const configs = {
    call: { label: '总经理电话安抚', cost: 0, csiDelta: 1, successRate: 0.55 },
    care: { label: '赠送关怀补偿', cost: item.careCost, csiDelta: 2, successRate: 0.85 },
    strong: { label: '强力补偿闭环', cost: item.strongCost, csiDelta: 4, successRate: 0.96 },
    reject: { label: '拒绝处理', cost: 0, csiDelta: -item.impact, successRate: 1 },
  };
  const config = configs[mode];
  if (!config) return { status: 'invalid' };

  if (config.cost > finance.cash) {
    return {
      status: 'insufficient_cash',
      alert: { title: '预算不足', message: `处理该客诉需要 ${formatMoney(config.cost)}，当前现金不足。` },
    };
  }

  const success = random() < config.successRate;
  const csiDelta = mode === 'reject' ? config.csiDelta : success ? config.csiDelta : -Math.ceil(item.impact / 2);

  return {
    status: 'resolved',
    finance: { ...finance, cash: finance.cash - config.cost },
    csi: {
      ...csi,
      score: Math.max(50, Math.min(100, csi.score + csiDelta)),
      complaints: csi.complaints + (csiDelta < 0 ? 1 : 0),
    },
    ledgerItem: config.cost > 0 ? { label: `客诉处理(${item.title})`, amount: -config.cost, type: 'expense' } : null,
    log: {
      type: csiDelta >= 0 ? 'success' : 'warning',
      message: `😤【客诉处理】${config.label}：${item.title}，CSI${csiDelta >= 0 ? '+' : ''}${csiDelta}。`,
    },
  };
};
