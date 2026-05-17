import { STAFF_ROLE_META } from '../config/staff.js';
import { estimateTurnoverRiskPercent } from './staffing.js';

const STAFF_TYPES = ['dcc', 'sales', 'service', 'streamer'];

const buildTurnoverLog = ({ type, member, absoluteDay }) => {
  const roleName = STAFF_ROLE_META[type]?.label || '员工';
  return {
    day: absoluteDay,
    type: 'warning',
    message: `🚪【人员流失】${roleName}【${member.nickname}】（能力值 ${member.skill}）被竞店高薪挖走！${member.skill >= 80 ? '核心骨干流失，团队实力受损。' : ''}${member.retained ? '尽管有留任津贴仍未能挽留。' : '如需留住高能力员工，请开启留任津贴。'}`,
  };
};

export const settleStaffTurnover = ({
  staff,
  afterSales,
  regionTurnover = 1,
  absoluteDay,
  random = Math.random,
}) => {
  const lostMembers = [];
  const logs = [];
  const staffMembersByType = {};

  STAFF_TYPES.forEach(type => {
    const members = staff[type]?.members || [];
    staffMembersByType[type] = [...members];
    members.forEach(member => {
      const risk = estimateTurnoverRiskPercent(type, member, regionTurnover) / 100;
      if (random() < risk) lostMembers.push({ type, member });
    });
  });

  const techMembers = [...(afterSales.technicians || [])];
  techMembers.forEach(member => {
    const risk = estimateTurnoverRiskPercent('tech', member, regionTurnover) / 100;
    if (random() < risk) lostMembers.push({ type: 'tech', member });
  });

  let nextTechMembers = techMembers;
  lostMembers.forEach(({ type, member }) => {
    logs.push(buildTurnoverLog({ type, member, absoluteDay }));
    if (type === 'tech') {
      nextTechMembers = nextTechMembers.filter(item => item.id !== member.id);
      return;
    }
    staffMembersByType[type] = (staffMembersByType[type] || []).filter(item => item.id !== member.id);
  });

  return {
    lostMembers,
    logs,
    dccMembers: staffMembersByType.dcc || [],
    salesMembers: staffMembersByType.sales || [],
    serviceMembers: staffMembersByType.service || [],
    streamerMembers: staffMembersByType.streamer || [],
    techMembers: nextTechMembers,
  };
};
