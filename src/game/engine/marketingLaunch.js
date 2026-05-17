import { normalizeLeadChannels, sumLeadChannels } from './leads.js';

export const prepareMarketingActivityLaunch = ({
  activityId,
  activities,
  finance,
  marketing,
}) => {
  const activity = activities.find(item => item.id === activityId);
  if (!activity || activity.costType === 'daily') return { status: 'invalid' };
  if (finance.cash < activity.cost) {
    return { status: 'insufficient_cash', alert: { title: '资金不足', message: `现金不足以支付 ${activity.name} 的费用！` } };
  }
  if (marketing.activeActivities.find(item => item.activityId === activityId)) {
    return { status: 'already_active', alert: { title: '活动冲突', message: `${activity.name} 已在进行中，请等待结束后再发起。` } };
  }

  return {
    status: 'ready',
    activity,
    confirm: {
      title: `确认发起${activity.name}`,
      message: `是否花费 ¥${activity.cost.toLocaleString()} 发起【${activity.name}】？\n${activity.description}`,
    },
  };
};

export const settleMarketingActivityLaunch = ({
  launchPlan,
  finance,
  marketing,
  monthlyStats,
  leadChannels,
  currentDay,
  now = Date.now,
}) => {
  if (!launchPlan || launchPlan.status !== 'ready') return { status: 'invalid' };

  const activity = launchPlan.activity;
  const newActivity = {
    id: `act_${now()}`,
    activityId: activity.id,
    name: activity.name,
    icon: activity.icon,
    startDay: currentDay,
    endDay: currentDay + activity.duration,
    effect: activity.effect,
    effectValue: activity.effectValue,
    effect2: activity.effect2 || null,
    effect2Value: activity.effect2Value || 0,
  };

  const nextMarketing = {
    ...marketing,
    activeActivities: [...marketing.activeActivities, newActivity],
  };
  const nextMonthlyStats = {
    ...monthlyStats,
    marketingCost: monthlyStats.marketingCost + activity.cost,
    activitySpend: (monthlyStats.activitySpend || 0) + activity.cost,
  };

  if (activity.leadBonus) {
    const channels = normalizeLeadChannels(nextMarketing);
    channels[activity.channel || 'showroom'] += activity.leadBonus;
    nextMarketing.leadChannels = channels;
    nextMarketing.leads = sumLeadChannels(channels);
    nextMonthlyStats.leads += activity.leadBonus;
  }

  if (activity.effect === 'recover') {
    const recovered = activity.effectValue;
    const channels = normalizeLeadChannels(nextMarketing);
    channels[activity.channel || 'showroom'] += recovered;
    nextMarketing.leadChannels = channels;
    nextMarketing.leads = sumLeadChannels(channels);
    nextMonthlyStats.recoveredLeads = (nextMonthlyStats.recoveredLeads || 0) + recovered;
    nextMonthlyStats.leads += recovered;
    return {
      status: 'settled',
      finance: { ...finance, cash: finance.cash - activity.cost },
      marketing: nextMarketing,
      monthlyStats: nextMonthlyStats,
      ledgerItem: { label: `营销活动(${activity.name})`, amount: -activity.cost, type: 'expense' },
      log: { type: 'success', message: `🤝【老客维系】DCC回访战败客户，成功回收 ${recovered} 条展厅线索进入跟进池！` },
    };
  }

  const channelName = leadChannels.find(channel => channel.id === activity.channel)?.name || '';
  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - activity.cost },
    marketing: nextMarketing,
    monthlyStats: nextMonthlyStats,
    ledgerItem: { label: `营销活动(${activity.name})`, amount: -activity.cost, type: 'expense' },
    log: {
      type: 'success',
      message: `${activity.icon}【${activity.name}】活动已启动！${activity.description}${activity.leadBonus ? `，新增${activity.leadBonus}条${channelName}线索` : ''}，持续${activity.duration}天。`,
    },
  };
};
