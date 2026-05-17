import { LEAD_CHANNELS } from '../config/marketing.js';
import { normalizeLeadChannels, sumLeadChannels } from './leads.js';

export const evaluateNegotiationOpening = ({
  kind,
  approvalCases,
  inventory,
  netProfit,
}) => {
  if (approvalCases.some(item => item.type === 'negotiation' && item.kind === kind && item.status === 'pending')) {
    return {
      ok: false,
      title: '谈判已在推进',
      message: '同类谈判已经进入审批中心，请先处理当前事项。',
    };
  }
  if (kind === 'manufacturer_subsidy' && !inventory.some(car => !car.subsidized && (car.stockDays || 0) >= 30)) {
    return {
      ok: false,
      title: '谈判条件不足',
      message: '当前没有库龄超过30天且未申请过补贴的新车库存。',
    };
  }
  if (kind === 'loss_explain' && netProfit >= 0) {
    return {
      ok: false,
      title: '暂不需要解释亏损',
      message: '本月当前净利润为正，投资人暂时不会要求亏损解释。',
    };
  }
  return { ok: true };
};

export const resolveNegotiationOutcome = ({
  item,
  option,
  investorRelations,
  csiScore,
  activeInvestor,
  activeRegion,
  inventory,
  monthlyStats,
  finance,
  marketing,
  currentDay,
  formatMoney,
  random = Math.random,
}) => {
  const trustAdj = ((investorRelations.trust || 0) - 70) / 200;
  const csiAdj = (csiScore - 90) / 500;
  const investorFit =
    (item.kind === 'investor_cash' && activeInvestor.budgetStyle === 'growth' && option.id === 'expansion') ? 0.14 :
    (item.kind === 'loss_explain' && activeInvestor.budgetStyle === 'tight' && option.id === 'fix') ? 0.12 :
    (item.kind === 'loss_explain' && activeInvestor.id === 'gambler' && option.id === 'investment') ? 0.16 :
    (item.kind === 'marketing_support' && activeRegion.id === 'nev_hot' && option.id === 'tradein') ? 0.10 : 0;
  const successRate = Math.max(0.08, Math.min(0.92, option.successRate + trustAdj + csiAdj + investorFit));
  const success = random() < successRate;

  if (!success) {
    return {
      success,
      successRate,
      investorRelations: {
        ...investorRelations,
        trust: Math.max(0, (investorRelations.trust || 0) - (item.kind.startsWith('investor') || item.kind === 'loss_explain' ? 8 : 3)),
        budgetStatus: item.kind === 'bank_credit' ? '银行重点观察' : investorRelations.budgetStatus,
      },
      log: {
        type: 'warning',
        message: `📨【谈判失败】${item.title}：${option.label} 未被接受。成功率约${Math.round(successRate * 100)}%，对方要求先拿出更扎实的经营结果。`,
      },
    };
  }

  if (item.kind === 'manufacturer_subsidy') {
    const eligible = inventory.filter(car => !car.subsidized && (car.stockDays || 0) >= 30 && (car.stockDays || 0) < 120);
    const mult = option.id === 'hard' ? 1.35 : option.id === 'commit' ? 1.15 : 1.0;
    const subsidy = Math.round(eligible.reduce((sum, car) => {
      const days = car.stockDays || 0;
      if (days >= 90) return sum + 22000;
      if (days >= 60) return sum + 13000;
      return sum + 6000;
    }, 0) * mult);
    return {
      success,
      successRate,
      inventory: inventory.map(car => !car.subsidized && (car.stockDays || 0) >= 30 ? { ...car, subsidized: true } : car),
      monthlyStats: { ...monthlyStats, baseRebatesPool: (monthlyStats.baseRebatesPool || 0) + subsidy },
      ledgerItem: { label: `谈判专项补贴入池(${eligible.length}台)`, amount: subsidy, type: 'pending' },
      log: {
        type: 'success',
        message: `📨【厂家谈判成功】${eligible.length}台长库龄车获得专项补贴 ${formatMoney(subsidy)} 入池。`,
      },
    };
  }

  if (item.kind === 'bank_credit') {
    const amount = option.id === 'pledge' ? 5000000 : option.id === 'growth' ? 3000000 : 1000000;
    return {
      success,
      successRate,
      finance: { ...finance, creditLimit: finance.creditLimit + amount },
      ledgerItem: { label: '银行临时授信增加', amount, type: 'pending' },
      log: {
        type: 'success',
        message: `🏦【银行谈判成功】临时授信增加 ${formatMoney(amount)}，本月资金缓冲提升。`,
      },
    };
  }

  if (item.kind === 'investor_cash') {
    const amount = option.id === 'emergency' ? 3000000 : option.id === 'expansion' ? 2000000 : 800000;
    return {
      success,
      successRate,
      finance: { ...finance, cash: finance.cash + amount },
      investorRelations: {
        ...investorRelations,
        trust: Math.max(0, (investorRelations.trust || 0) - 4),
        cashInjected: (investorRelations.cashInjected || 0) + amount,
      },
      ledgerItem: { label: '投资人追加现金', amount, type: 'income' },
      log: {
        type: 'success',
        message: `💼【投资人追加现金】到账 ${formatMoney(amount)}。这不是免费午餐，月底会更认真盯结果。`,
      },
    };
  }

  if (item.kind === 'marketing_support') {
    const leadBonus = option.id === 'autoshow' ? 70 : option.id === 'tradein' ? 55 : 40;
    const channel = option.id === 'autoshow' ? 'autoshow' : option.id === 'tradein' ? 'showroom' : 'sourcing';
    const channels = normalizeLeadChannels(marketing);
    channels[channel] += leadBonus;
    return {
      success,
      successRate,
      marketing: { ...marketing, leadChannels: channels, leads: sumLeadChannels(channels) },
      monthlyStats: {
        ...monthlyStats,
        leads: (monthlyStats.leads || 0) + leadBonus,
        referralLeads: (monthlyStats.referralLeads || 0) + (option.id === 'tradein' ? 15 : 0),
      },
      log: {
        type: 'success',
        message: `📣【厂家营销支持】获得 ${leadBonus} 条${LEAD_CHANNELS.find(item => item.id === channel)?.name || ''}线索${option.id === 'tradein' ? '，其中一批为置换意向客户' : ''}。`,
      },
    };
  }

  if (item.kind === 'loss_explain') {
    return {
      success,
      successRate,
      investorRelations: {
        ...investorRelations,
        trust: Math.min(100, (investorRelations.trust || 0) + 10),
        budgetStatus: '正常授权',
        orderRestrictionUntil: Math.min(investorRelations.orderRestrictionUntil, currentDay),
      },
      log: {
        type: 'success',
        message: `💼【投资人沟通成功】${option.label} 被接受，投资人信任度回升，预算限制压力缓解。`,
      },
    };
  }

  return {
    success,
    successRate,
    log: {
      type: 'warning',
      message: `📨【谈判完成】${item.title}：${option.label} 已记录，但暂无额外经营影响。`,
    },
  };
};
