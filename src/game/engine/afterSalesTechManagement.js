import { createStaffMember, getTrait, normalizeStaffMember } from './staffing.js';

const HIRE_TECH_COST = 3000;
const TRAIN_TECH_COST = 2000;
const MAX_TECH_COUNT = 6;

export const prepareHireTechnician = ({
  finance,
  afterSales,
  cost = HIRE_TECH_COST,
  maxTechCount = MAX_TECH_COUNT,
}) => {
  if (finance.cash < cost) {
    return { status: 'insufficient_cash', alert: { title: '招聘失败', message: `现金不足，技师招聘费 ¥${cost.toLocaleString()}` } };
  }
  if (afterSales.technicians.length >= maxTechCount) {
    return { status: 'team_full', alert: { title: '招聘失败', message: `技师团队已满（最多${maxTechCount}人）` } };
  }

  return {
    status: 'ready',
    cost,
    confirm: { title: '招聘技师', message: `支付 ¥${cost.toLocaleString()} 招聘一名技师？` },
  };
};

export const settleHireTechnician = ({
  hirePlan,
  finance,
  afterSales,
}) => {
  if (!hirePlan || hirePlan.status !== 'ready') return { status: 'invalid' };

  const newMember = createStaffMember('tech', 30);
  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - hirePlan.cost },
    afterSales: { ...afterSales, technicians: [...afterSales.technicians, newMember] },
    ledgerItem: { label: `招聘售后技师(${newMember.nickname})`, amount: -hirePlan.cost, type: 'expense' },
    log: { type: 'info', message: `🔧【技师招聘】${newMember.nickname} 加入售后团队（能力30）。` },
  };
};

export const prepareTrainTechnician = ({
  techId,
  finance,
  afterSales,
  cost = TRAIN_TECH_COST,
}) => {
  if (finance.cash < cost) {
    return { status: 'insufficient_cash', alert: { title: '培训失败', message: `现金不足，培训费 ¥${cost.toLocaleString()}` } };
  }

  const member = afterSales.technicians.find(item => item.id === techId);
  if (!member || member.skill >= 100) return { status: 'invalid' };

  return {
    status: 'ready',
    cost,
    member,
    confirm: { title: '培训技师', message: `支付 ¥${cost.toLocaleString()} 培训 ${member.nickname}？` },
  };
};

export const settleTrainTechnician = ({
  trainPlan,
  finance,
  afterSales,
  random = Math.random,
}) => {
  if (!trainPlan || trainPlan.status !== 'ready') return { status: 'invalid' };

  const trainGain = 5 + Math.floor(random() * 6) + (getTrait('tech', trainPlan.member)?.trainBonus || 0);
  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - trainPlan.cost },
    afterSales: {
      ...afterSales,
      technicians: afterSales.technicians.map(member => member.id === trainPlan.member.id
        ? normalizeStaffMember('tech', {
          ...member,
          skill: Math.min(100, member.skill + trainGain),
          xp: (member.xp || 0) + 25,
          loyalty: (member.loyalty ?? 62) + 2,
          stress: (member.stress ?? 18) - 4,
        })
        : member),
    },
    ledgerItem: { label: `培训售后技师(${trainPlan.member.nickname})`, amount: -trainPlan.cost, type: 'expense' },
    log: { type: 'info', message: `🔧【技师培训】${trainPlan.member.nickname} 培训完成，能力+${trainGain}，忠诚提升，压力下降。` },
  };
};

export const toggleTechnicianRetention = ({
  techId,
  afterSales,
}) => ({
  ...afterSales,
  technicians: afterSales.technicians.map(member => member.id === techId
    ? normalizeStaffMember('tech', {
      ...member,
      retained: !member.retained,
      loyalty: (member.loyalty ?? 62) + (!member.retained ? 8 : -2),
      stress: (member.stress ?? 18) + (!member.retained ? -3 : 0),
    })
    : member),
});
