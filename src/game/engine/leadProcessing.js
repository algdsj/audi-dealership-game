import { EMPTY_LEAD_CHANNELS, LEAD_CHANNELS } from '../config/marketing.js';
import { sumLeadChannels } from './leads.js';

export const processDailyWalkIns = ({
  marketing,
  monthlyStats,
  stats,
  dccCount,
  dccAvgSkill,
  dccCapacityBonus = 0,
  gmEfficiency,
  activeDccWalkinBonus,
  activeNaturalBonus,
  competitorPressure,
  playerPriceBoost,
  playerServiceBoost,
  streamerAvgSkill,
  streamerLivestreamWalkinBonus = 0,
  inventory,
  facility,
  marketEnvironment,
  activeRegion,
  salesCount,
  absoluteDay,
  random = Math.random,
}) => {
  const nextMarketing = { ...marketing, leadChannels: { ...EMPTY_LEAD_CHANNELS, ...marketing.leadChannels } };
  const nextMonthlyStats = { ...monthlyStats };
  const nextStats = { ...stats };
  const logs = [];

  const dccCapacity = Math.floor((dccCount * 100 + dccCapacityBonus) * gmEfficiency);
  const currentLeadChannels = { ...EMPTY_LEAD_CHANNELS, ...nextMarketing.leadChannels };
  const currentLeadTotal = sumLeadChannels(currentLeadChannels);
  const processedLeads = Math.min(currentLeadTotal, dccCapacity);
  const baseWalkInRate = 0.05 + (dccAvgSkill / 100) * 0.15;
  const walkInRate = Math.max(0.01, baseWalkInRate + activeDccWalkinBonus - competitorPressure * 0.18 + playerServiceBoost * 0.25);
  let dccWalkIns = 0;
  const processedByChannel = { ...EMPTY_LEAD_CHANNELS };
  const remainingLeadChannels = { ...EMPTY_LEAD_CHANNELS };

  if (currentLeadTotal > 0) {
    let remainingToProcess = processedLeads;
    LEAD_CHANNELS.forEach((channel, index) => {
      const count = currentLeadChannels[channel.id] || 0;
      const proportional = index === LEAD_CHANNELS.length - 1 ? remainingToProcess : Math.floor((count / currentLeadTotal) * processedLeads);
      const processed = Math.min(count, remainingToProcess, proportional);
      remainingToProcess -= processed;
      processedByChannel[channel.id] = processed;
      remainingLeadChannels[channel.id] = Math.max(0, count - processed);
      const livestreamBonus = channel.id === 'livestream' ? Math.min(0.12, streamerAvgSkill / 1000 + streamerLivestreamWalkinBonus) : 0;
      dccWalkIns += Math.floor(processed * walkInRate * (channel.walkInFactor + livestreamBonus));
    });
    if (remainingToProcess > 0) {
      for (const channel of LEAD_CHANNELS) {
        if (remainingToProcess <= 0) break;
        const available = remainingLeadChannels[channel.id] || 0;
        const extra = Math.min(available, remainingToProcess);
        processedByChannel[channel.id] += extra;
        remainingLeadChannels[channel.id] -= extra;
        remainingToProcess -= extra;
        const livestreamBonus = channel.id === 'livestream' ? Math.min(0.12, streamerAvgSkill / 1000 + streamerLivestreamWalkinBonus) : 0;
        dccWalkIns += Math.floor(extra * walkInRate * (channel.walkInFactor + livestreamBonus));
      }
    }
  }

  const showroomModelCount = new Set(inventory.filter(car => car.location === 'showroom').map(car => car.modelId)).size;
  const baseNaturalWalkIns = Math.floor((showroomModelCount * 0.8 + facility.level * 1.0 + random() * 2) * marketEnvironment.seasonIndex * (activeRegion.demand || 1) * gmEfficiency);
  const naturalWalkIns = Math.max(0, Math.floor((baseNaturalWalkIns + activeNaturalBonus) * (1 - competitorPressure + playerPriceBoost)));
  const totalWalkIns = dccWalkIns + naturalWalkIns;

  LEAD_CHANNELS.forEach(channel => {
    remainingLeadChannels[channel.id] = Math.floor((remainingLeadChannels[channel.id] || 0) * 0.85);
  });
  nextMarketing.leadChannels = remainingLeadChannels;
  nextMarketing.leads = sumLeadChannels(nextMarketing.leadChannels);
  nextStats.walkIns = totalWalkIns;
  nextMonthlyStats.walkIns = (nextMonthlyStats.walkIns || 0) + totalWalkIns;
  nextMonthlyStats.dccWalkIns = (nextMonthlyStats.dccWalkIns || 0) + dccWalkIns;
  nextMonthlyStats.naturalWalkIns = (nextMonthlyStats.naturalWalkIns || 0) + naturalWalkIns;

  const processedSummary = LEAD_CHANNELS
    .filter(channel => processedByChannel[channel.id] > 0)
    .map(channel => `${channel.shortName}${processedByChannel[channel.id]}`)
    .join(' / ');
  if (processedSummary) logs.push({ day: absoluteDay, type: 'info', message: `📞【线索跟进】DCC处理 ${processedLeads} 条线索（${processedSummary}），邀约到店 ${dccWalkIns} 批。` });

  const customerSegments = ['年轻', '商务', '家庭'];
  const todayWalkInSegments = [];
  for (let index = 0; index < totalWalkIns; index++) {
    todayWalkInSegments.push(customerSegments[Math.floor(random() * customerSegments.length)]);
  }
  const salesCapacity = Math.max(0, Math.floor(salesCount * 5 * gmEfficiency));
  const handledCustomers = todayWalkInSegments.sort(() => random() - 0.5).slice(0, salesCapacity);

  return {
    marketing: nextMarketing,
    monthlyStats: nextMonthlyStats,
    stats: nextStats,
    processedLeads,
    dccWalkIns,
    naturalWalkIns,
    totalWalkIns,
    processedByChannel,
    salesCapacity,
    handledCustomers,
    logs,
  };
};
