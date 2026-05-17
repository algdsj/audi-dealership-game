import { createStaffMember, getTrait, normalizeStaffMember } from './staffing.js';

const STAFF_TRAINING_COST = 20000;

export const prepareTrainStaffMember = ({
  type,
  memberId,
  staff,
  finance,
  roleMeta,
  cost = STAFF_TRAINING_COST,
}) => {
  if (finance.cash < cost) return { status: 'insufficient_cash', alert: { title: '资金不足', message: '现金不足以支付培训费！' } };

  const member = staff[type]?.members.find(item => item.id === memberId);
  if (!member) return { status: 'missing_member', alert: { title: '提示', message: '找不到该员工！' } };
  if (member.skill >= 100) return { status: 'max_skill', alert: { title: '提示', message: `${member.nickname} 的能力已达满级！` } };

  const roleName = roleMeta[type]?.label || '员工';
  return {
    status: 'ready',
    type,
    member,
    roleName,
    cost,
    confirm: {
      title: '确认培训',
      message: `确定花费 ¥${cost.toLocaleString()} 为 ${roleName}【${member.nickname}】组织专项培训吗？\n能力值将从 ${member.skill} 提升至 ${Math.min(100, member.skill + 10)}。`,
    },
  };
};

export const settleTrainStaffMember = ({
  trainPlan,
  staff,
  finance,
  formatMoney = value => String(value),
}) => {
  if (!trainPlan || trainPlan.status !== 'ready') return { status: 'invalid' };

  const newSkill = Math.min(100, trainPlan.member.skill + 10 + (getTrait(trainPlan.type, trainPlan.member)?.trainBonus || 0));
  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - trainPlan.cost },
    staff: {
      ...staff,
      [trainPlan.type]: {
        ...staff[trainPlan.type],
        members: staff[trainPlan.type].members.map(member => member.id === trainPlan.member.id
          ? normalizeStaffMember(trainPlan.type, {
            ...member,
            skill: newSkill,
            xp: (member.xp || 0) + 28,
            loyalty: (member.loyalty ?? 62) + 3,
            stress: (member.stress ?? 18) - 5,
          })
          : member),
      },
    },
    ledgerItem: { label: `员工培训(${trainPlan.roleName}·${trainPlan.member.nickname})`, amount: -trainPlan.cost, type: 'expense' },
    log: {
      type: 'success',
      message: `花费 ${formatMoney(trainPlan.cost)} 为${trainPlan.roleName}【${trainPlan.member.nickname}】组织专项培训，能力值 ${trainPlan.member.skill} → ${newSkill}，忠诚提升，压力下降。`,
    },
  };
};

export const prepareHireStaffMember = ({
  type,
  roleMeta,
}) => {
  const roleName = roleMeta[type]?.label || '员工';
  return {
    status: 'ready',
    type,
    roleName,
    confirm: {
      title: '确认招聘',
      message: `确定招聘一名新的 ${roleName} 吗？将增加每日固定的工资支出。`,
    },
  };
};

export const settleHireStaffMember = ({
  hirePlan,
  staff,
  random = Math.random,
}) => {
  if (!hirePlan || hirePlan.status !== 'ready') return { status: 'invalid' };

  const newMember = createStaffMember(hirePlan.type, 20 + Math.floor(random() * 20));
  return {
    status: 'settled',
    staff: {
      ...staff,
      [hirePlan.type]: { ...staff[hirePlan.type], members: [...staff[hirePlan.type].members, newMember] },
    },
    log: { type: 'info', message: `新${hirePlan.roleName}【${newMember.nickname}】入职，初始能力值 ${newMember.skill}。` },
  };
};

export const prepareToggleStaffRetention = ({
  type,
  memberId,
  staff,
  roleMeta,
}) => {
  const member = staff[type]?.members.find(item => item.id === memberId);
  if (!member) return { status: 'invalid' };

  const roleName = roleMeta[type]?.label || '员工';
  const enableRetention = !member.retained;
  return {
    status: 'ready',
    type,
    member,
    enableRetention,
    confirm: enableRetention
      ? {
        title: '确认留任',
        message: `为${roleName}【${member.nickname}】（能力值 ${member.skill}）发放留任津贴？\n每日额外支出 ¥${staff[type].salary}（即月薪翻倍），可有效降低其离职风险。`,
      }
      : null,
  };
};

export const settleToggleStaffRetention = ({
  retentionPlan,
  staff,
}) => {
  if (!retentionPlan || retentionPlan.status !== 'ready') return { status: 'invalid' };

  return {
    status: 'settled',
    staff: {
      ...staff,
      [retentionPlan.type]: {
        ...staff[retentionPlan.type],
        members: staff[retentionPlan.type].members.map(member => member.id === retentionPlan.member.id
          ? normalizeStaffMember(retentionPlan.type, {
            ...member,
            retained: retentionPlan.enableRetention,
            loyalty: (member.loyalty ?? 62) + (retentionPlan.enableRetention ? 8 : -2),
            stress: (member.stress ?? 18) + (retentionPlan.enableRetention ? -3 : 0),
          })
          : member),
      },
    },
  };
};
