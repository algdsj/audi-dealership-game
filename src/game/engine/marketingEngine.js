import { normalizeLeadChannels, sumLeadChannels } from './leads.js';

export const normalizeMarketingBudgetState = (marketing) => {
  const leadChannels = normalizeLeadChannels(marketing);
  const leadPurchaseBudget = Number.isFinite(marketing.leadPurchaseBudget) ? marketing.leadPurchaseBudget : (marketing.budget || 0);
  const livestreamBudget = Number.isFinite(marketing.livestreamBudget) ? marketing.livestreamBudget : 0;
  return {
    ...marketing,
    leadChannels,
    leadPurchaseBudget,
    livestreamBudget,
    budget: leadPurchaseBudget,
    leads: sumLeadChannels(leadChannels),
  };
};

export const generateDailyMarketingLeads = ({
  marketing,
  monthlyStats,
  stats,
  leadPurchaseBudget,
  livestreamBudget,
  activeRegion,
  streamerCount,
  streamerAvgSkill,
  streamerLeadBonus = 0,
  absoluteDay,
  random = Math.random,
}) => {
  const nextMarketing = { ...marketing, leadChannels: { ...marketing.leadChannels } };
  const nextMonthlyStats = { ...monthlyStats };
  const nextStats = { ...stats };
  const logs = [];
  const newLeads = Math.floor((leadPurchaseBudget / (50 * (activeRegion.leadCost || 1))) * (0.7 + random() * 0.6) * (activeRegion.demand || 1));
  const streamerEfficiency = streamerCount > 0 ? Math.min(2.2, 0.45 + streamerCount * 0.18 + streamerAvgSkill / 120 + streamerLeadBonus) : 0;
  const livestreamLeads = Math.floor((livestreamBudget / (70 * (activeRegion.leadCost || 1))) * (0.65 + random() * 0.7) * (activeRegion.demand || 1) * streamerEfficiency);

  if (newLeads > 0) nextMarketing.leadChannels.sourcing += newLeads;
  if (livestreamLeads > 0) nextMarketing.leadChannels.livestream += livestreamLeads;
  nextMarketing.leads = sumLeadChannels(nextMarketing.leadChannels);
  nextStats.newLeads = newLeads + livestreamLeads;
  nextMonthlyStats.leads = (nextMonthlyStats.leads || 0) + newLeads + livestreamLeads;

  if (livestreamLeads > 0) {
    logs.push({ day: absoluteDay, type: 'success', message: `🎙️【直播投流】主播团队承接投流，带来 ${livestreamLeads} 条直播线索。` });
  }
  if (livestreamBudget > 0 && streamerCount === 0) {
    logs.push({ day: absoluteDay, type: 'warning', message: '🎙️【直播投流浪费】今天投入了直播预算，但没有主播承接，未产生直播线索。' });
  }

  return {
    marketing: nextMarketing,
    monthlyStats: nextMonthlyStats,
    stats: nextStats,
    newLeads,
    livestreamLeads,
    logs,
  };
};
