import { sumLeadChannels } from './leads.js';
import { traitMultiplier, traitSum } from './staffing.js';

const COMPLAINT_MESSAGES = ['交车延迟', '精品安装问题', '服务态度差', '承诺未兑现', '价格不透明'];

export const updateDailyCsi = ({
  csi,
  marketing,
  monthlyStats,
  approvalCases,
  staff,
  afterSales,
  activeRegion,
  serviceCount,
  serviceAvgSkill,
  techAvgSkill,
  salesAvgSkill,
  dailyAsRevenue,
  expiredCsiPenalty,
  absoluteDay,
  createComplaintCase,
  random = Math.random,
}) => {
  const nextMarketing = {
    ...marketing,
    leadChannels: { ...(marketing.leadChannels || {}) },
  };
  const nextMonthlyStats = { ...monthlyStats };
  const nextApprovalCases = [...approvalCases];
  const logs = [];
  let csiDelta = 0;
  let complaintMsg = '';
  let complaintOccurred = false;

  const serviceComplaintRelief = Math.max(0.68, 1 - Math.min(0.32, serviceCount * 0.05 + serviceAvgSkill / 600));
  const complaintMult = Math.max(0.45, Math.min(1.8, traitMultiplier('sales', staff.sales.members, 'complaintMult') * traitMultiplier('tech', afterSales.technicians, 'complaintMult') * traitMultiplier('service', staff.service?.members || [], 'complaintMult') * serviceComplaintRelief * (1 + (activeRegion.csiPressure || 0))));
  if (random() < 0.05 * complaintMult) {
    complaintOccurred = true;
    const complaint = COMPLAINT_MESSAGES[Math.floor(random() * COMPLAINT_MESSAGES.length)];
    const source = dailyAsRevenue > 0 && random() < 0.45 ? '售后' : '销售';
    const complaintCase = createComplaintCase(source);
    nextApprovalCases.push(complaintCase);
    logs.push({ day: absoluteDay, type: 'warning', message: `😤【客诉待处理】${source}端出现「${complaintCase.title}」，请在审批中心决定是否花钱安抚。` });
    csiDelta = -3;
    if (techAvgSkill >= 60) csiDelta *= 0.5;
    if (salesAvgSkill >= 60) csiDelta *= 0.7;
    complaintMsg = complaint;
  }

  const serviceCsiRecovery = serviceCount > 0 ? Math.min(0.55, serviceCount * 0.08 + serviceAvgSkill / 350 + traitSum('service', staff.service?.members || [], 'csiBonus')) : 0;
  if (csiDelta === 0 && csi.score < 95) csiDelta = 0.3 + serviceCsiRecovery;
  const newCsiScore = Math.max(50, Math.min(100, csi.score + csiDelta - expiredCsiPenalty));
  if (complaintOccurred) {
    logs.push({ day: absoluteDay, type: 'warning', message: `😤【客户投诉】${complaintMsg}！CSI满意度下降 ${Math.abs(csiDelta).toFixed(1)} 分至 ${Math.round(newCsiScore)} 分。` });
  }

  let referralCount = 0;
  if (newCsiScore >= 95) {
    referralCount = 1 + Math.floor(random() * 3);
    nextMarketing.leadChannels.showroom = (nextMarketing.leadChannels.showroom || 0) + referralCount;
    nextMarketing.leads = sumLeadChannels(nextMarketing.leadChannels);
    nextMonthlyStats.referralLeads += referralCount;
    logs.push({ day: absoluteDay, type: 'success', message: `🌟【转介绍】CSI优秀(${Math.round(newCsiScore)}分)，老客户转介绍 ${referralCount} 条新线索！` });
  }

  return {
    marketing: nextMarketing,
    monthlyStats: nextMonthlyStats,
    approvalCases: nextApprovalCases,
    newCsiScore,
    complaintOccurred,
    complaintMsg,
    referralCount,
    logs,
  };
};
