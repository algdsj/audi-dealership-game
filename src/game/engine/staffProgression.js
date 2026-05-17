import { STAFF_ROLE_META } from '../config/staff.js';
import { getCareerLevel, normalizeStaffMember } from './staffing.js';

const advanceCareerMembers = ({ members, type, profile, absoluteDay }) => {
  const roleName = STAFF_ROLE_META[type]?.label || '员工';
  const logs = [];
  const nextMembers = members.map(member => {
    const before = normalizeStaffMember(type, member);
    const beforeLevel = getCareerLevel(before);
    const retainedBonus = before.retained ? 0.25 : 0;
    const next = normalizeStaffMember(type, {
      ...before,
      xp: before.xp + Math.max(0, profile.xp || 0),
      loyalty: before.loyalty + (profile.loyalty || 0) + retainedBonus - ((profile.stress || 0) > 3 ? 0.2 : 0),
      stress: before.stress + (profile.stress || 0) - (before.retained ? 0.25 : 0),
    });
    const afterLevel = getCareerLevel(next);
    if (afterLevel.level > beforeLevel.level) {
      logs.push({ day: absoluteDay, type: 'success', message: `⭐【员工成长】${roleName}【${next.nickname}】晋升为${afterLevel.title}，有效能力获得成长加成。` });
    } else if (next.stress >= 82 && before.stress < 82) {
      logs.push({ day: absoluteDay, type: 'warning', message: `😓【员工压力】${roleName}【${next.nickname}】压力已到${Math.round(next.stress)}，离职风险上升，建议培训、留任或补人分流。` });
    } else if (next.loyalty <= 35 && before.loyalty > 35) {
      logs.push({ day: absoluteDay, type: 'warning', message: `📉【忠诚预警】${roleName}【${next.nickname}】忠诚度跌至${Math.round(next.loyalty)}，团队文化开始松动。` });
    }
    return next;
  });

  return { members: nextMembers, logs };
};

export const advanceDailyStaffProgression = ({
  dccMembers,
  salesMembers,
  serviceMembers,
  streamerMembers,
  techMembers,
  dccCount,
  salesCount,
  serviceCount,
  streamerCount,
  techCount,
  processedLeads,
  dccWalkIns,
  handledCustomers,
  salesCapacity,
  sales,
  asOrdersHandled,
  complaintOccurred,
  complaintMsg,
  newCsiScore,
  livestreamBudget,
  livestreamLeads,
  absoluteDay,
}) => {
  const logs = [];
  const dcc = advanceCareerMembers({
    members: dccMembers,
    type: 'dcc',
    profile: {
      xp: 1 + processedLeads / Math.max(1, dccCount * 70) * 5 + dccWalkIns / Math.max(1, dccCount) * 0.8,
      stress: processedLeads > dccCount * 90 ? 4 : processedLeads > 0 ? 1 : -2,
      loyalty: dccWalkIns > 0 ? 0.35 : -0.1,
    },
    absoluteDay,
  });
  logs.push(...dcc.logs);

  const salesTeam = advanceCareerMembers({
    members: salesMembers,
    type: 'sales',
    profile: {
      xp: 1 + handledCustomers.length / Math.max(1, salesCount) * 0.9 + sales / Math.max(1, salesCount) * 5,
      stress: handledCustomers.length >= salesCapacity && salesCapacity > 0 ? 5 : handledCustomers.length > 0 ? 2 : -1,
      loyalty: sales > 0 ? 0.45 : -0.15,
    },
    absoluteDay,
  });
  logs.push(...salesTeam.logs);

  const service = advanceCareerMembers({
    members: serviceMembers,
    type: 'service',
    profile: {
      xp: 1 + asOrdersHandled / Math.max(1, serviceCount) * 0.8,
      stress: complaintOccurred ? 4 : asOrdersHandled > serviceCount * 2 ? 2 : -1,
      loyalty: newCsiScore >= 90 ? 0.25 : -0.2,
    },
    absoluteDay,
  });
  logs.push(...service.logs);

  const streamer = advanceCareerMembers({
    members: streamerMembers,
    type: 'streamer',
    profile: {
      xp: livestreamBudget > 0 ? 1 + livestreamLeads / Math.max(1, streamerCount) / 6 : 0.3,
      stress: livestreamBudget > 0 ? 2 : -1,
      loyalty: livestreamLeads > 0 ? 0.4 : -0.05,
    },
    absoluteDay,
  });
  logs.push(...streamer.logs);

  const tech = advanceCareerMembers({
    members: techMembers,
    type: 'tech',
    profile: {
      xp: 1 + asOrdersHandled / Math.max(1, techCount) * 0.9,
      stress: asOrdersHandled >= techCount * 3 && techCount > 0 ? 5 : asOrdersHandled > 0 ? 2 : -1,
      loyalty: complaintOccurred && complaintMsg ? -0.25 : 0.2,
    },
    absoluteDay,
  });
  logs.push(...tech.logs);

  return {
    logs,
    dccMembers: dcc.members,
    salesMembers: salesTeam.members,
    serviceMembers: service.members,
    streamerMembers: streamer.members,
    techMembers: tech.members,
  };
};
