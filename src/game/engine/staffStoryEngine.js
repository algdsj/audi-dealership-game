import { STAFF_ROLE_META } from '../config/staff.js';
import { STAFF_STORY_LOG_LABEL, STAFF_STORY_THRESHOLDS, STAFF_STORY_TYPES } from '../config/staffStories.js';
import {
  estimateTurnoverRiskPercent,
  getCareerLevel,
  getEffectiveSkill,
  normalizeStaffMember,
} from './staffing.js';

const STAFF_ROLES = ['dcc', 'sales', 'service', 'streamer', 'tech'];
const DEFAULT_RANDOM = () => 0.5;

const getRandom = (rng) => {
  if (typeof rng === 'function') return rng;
  if (typeof rng?.random === 'function') return () => rng.random();
  if (typeof rng?.next === 'function') return () => rng.next();
  return DEFAULT_RANDOM;
};

const toAbsoluteDay = ({ day, month }) => {
  if (Number.isFinite(day)) return day;
  const safeMonth = Number.isFinite(month) ? month : 1;
  return (safeMonth - 1) * 30 + 1;
};

const getRoleLabel = (role) => STAFF_ROLE_META[role]?.label || '员工';

const getRoleMembers = (staff = {}, role) => {
  if (Array.isArray(staff[role]?.members)) return staff[role].members;
  if (Array.isArray(staff[role])) return staff[role];
  if (role === 'tech' && Array.isArray(staff.technicians)) return staff.technicians;
  return [];
};

const flattenStaff = (staff = {}) => STAFF_ROLES.flatMap(role => (
  getRoleMembers(staff, role).map(member => ({
    role,
    member: normalizeStaffMember(role, member),
  }))
));

const buildStaffIndex = (staff = {}) => flattenStaff(staff).reduce((index, item) => {
  index.set(item.member.id, item);
  return index;
}, new Map());

const makeMomentId = ({ type, staffId, day, extra = '' }) => (
  `staff_story_${type}_${staffId || 'team'}_${day}${extra ? `_${extra}` : ''}`.replace(/[^a-zA-Z0-9_]/g, '_')
);

const getStoryMeta = (type) => STAFF_STORY_TYPES[type] || {
  label: type,
  tone: 'info',
  icon: '•',
  memoryWeight: 1,
  tags: [],
};

const createMoment = ({
  type,
  role,
  member,
  day,
  month,
  title,
  summary,
  severity,
  participants,
  metrics,
  relatedLogIds,
  extra,
}) => {
  const meta = getStoryMeta(type);
  const normalized = member ? normalizeStaffMember(role, member) : null;
  const staffId = normalized?.id || participants?.[0]?.staffId || null;
  return {
    id: makeMomentId({ type, staffId, day, extra }),
    type,
    storyType: meta.label,
    tone: meta.tone,
    icon: meta.icon,
    severity,
    title,
    summary,
    day,
    month: Number.isFinite(month) ? month : Math.floor((day - 1) / 30) + 1,
    role,
    roleLabel: role ? getRoleLabel(role) : '团队',
    staffId,
    staffName: normalized?.nickname || participants?.[0]?.name || '团队',
    participants: participants || (normalized ? [{
      staffId: normalized.id,
      name: normalized.nickname,
      role,
      roleLabel: getRoleLabel(role),
      avatarId: normalized.avatarId,
    }] : []),
    tags: meta.tags,
    metrics: metrics || {},
    memoryWeight: meta.memoryWeight,
    relatedLogIds: relatedLogIds || [],
  };
};

const storyLogFromMoment = (moment) => ({
  day: moment.day,
  type: moment.tone === 'danger' ? 'warning' : moment.tone,
  message: `${moment.icon}【${STAFF_STORY_LOG_LABEL}·${moment.storyType}】${moment.summary}`,
  staffStoryMomentId: moment.id,
});

const getMonthlyNumber = (monthlyStats = {}, key) => Number(monthlyStats[key]) || 0;

const getTargetProgress = (monthlyStats = {}) => {
  const target = getMonthlyNumber(monthlyStats, 'target');
  if (target <= 0) return 0;
  return getMonthlyNumber(monthlyStats, 'sales') / target;
};

const findRelatedLogs = (logs = [], patterns = [], day) => logs
  .map((log, index) => ({ log, index }))
  .filter(({ log }) => !Number.isFinite(day) || !Number.isFinite(log.day) || log.day === day)
  .filter(({ log }) => patterns.some(pattern => String(log.message || '').includes(pattern)))
  .map(({ index }) => index);

const hasMemoryToday = (storyMemory = {}, staffId, type, day) => (
  (storyMemory?.[staffId]?.timeline || []).some(item => item.type === type && item.day === day)
);

const shouldEmit = ({ storyMemory, staffId, type, day }) => (
  staffId ? !hasMemoryToday(storyMemory, staffId, type, day) : true
);

const pushMoment = (moments, moment, storyMemory) => {
  if (shouldEmit({ storyMemory, staffId: moment.staffId, type: moment.type, day: moment.day })) {
    moments.push(moment);
  }
};

const evaluateGrowthMoments = ({ currentIndex, previousIndex, monthlyStats, logs, day, month, storyMemory }) => {
  const moments = [];
  const sales = getMonthlyNumber(monthlyStats, 'sales');
  const progress = getTargetProgress(monthlyStats);
  const growthLogs = findRelatedLogs(logs, ['【员工成长】', '晋升'], day);

  currentIndex.forEach(({ role, member }, staffId) => {
    if (role !== STAFF_STORY_THRESHOLDS.salesChampion.minRole) return;
    const previous = previousIndex.get(staffId)?.member;
    const level = getCareerLevel(member);
    const previousLevel = previous ? getCareerLevel(previous) : null;
    const effectiveSkill = getEffectiveSkill(role, member);
    const levelUp = previousLevel && level.level > previousLevel.level;
    const championReady = effectiveSkill >= STAFF_STORY_THRESHOLDS.salesChampion.minSkill
      && level.level >= STAFF_STORY_THRESHOLDS.salesChampion.minLevel
      && (sales >= STAFF_STORY_THRESHOLDS.salesChampion.minMonthlySales || progress >= STAFF_STORY_THRESHOLDS.salesChampion.minTargetProgress);

    if (!levelUp && !championReady) return;

    pushMoment(moments, createMoment({
      type: 'sales_champion_growth',
      role,
      member,
      day,
      month,
      severity: level.level >= 4 ? 'major' : 'normal',
      title: `${member.nickname}打出销冠苗头`,
      summary: `${getRoleLabel(role)}【${member.nickname}】成长到Lv.${level.level} ${level.title}，本月销量推进到${sales}台，开始具备撑起展厅节奏的能力。`,
      metrics: { level: level.level, effectiveSkill, monthlySales: sales, targetProgress: Number(progress.toFixed(2)) },
      relatedLogIds: growthLogs,
    }), storyMemory);
  });

  return moments;
};

const evaluatePressureMoments = ({ currentIndex, previousIndex, day, month, storyMemory }) => {
  const moments = [];
  currentIndex.forEach(({ role, member }, staffId) => {
    const previous = previousIndex.get(staffId)?.member;
    const previousStress = previous ? Number(previous.stress) || 0 : 0;
    const crossedStress = member.stress >= STAFF_STORY_THRESHOLDS.pressureAlert.stress
      && previousStress < STAFF_STORY_THRESHOLDS.pressureAlert.stress - STAFF_STORY_THRESHOLDS.pressureAlert.previousStressBuffer;
    const loyaltyCrash = member.loyalty <= STAFF_STORY_THRESHOLDS.pressureAlert.loyaltyDanger
      && (!previous || (Number(previous.loyalty) || 0) > STAFF_STORY_THRESHOLDS.pressureAlert.loyaltyDanger);

    if (!crossedStress && !loyaltyCrash) return;

    pushMoment(moments, createMoment({
      type: 'pressure_alert',
      role,
      member,
      day,
      month,
      severity: member.stress >= 92 || member.loyalty <= 25 ? 'critical' : 'major',
      title: `${member.nickname}压力爆表`,
      summary: `${getRoleLabel(role)}【${member.nickname}】压力${Math.round(member.stress)}、忠诚${Math.round(member.loyalty)}，已经从普通疲劳变成明确的人才风险。`,
      metrics: { stress: Math.round(member.stress), loyalty: Math.round(member.loyalty), previousStress: Math.round(previousStress) },
    }), storyMemory);
  });
  return moments;
};

const evaluateCompetitorOfferMoments = ({ currentIndex, activeRegion, random, day, month, storyMemory }) => {
  const moments = [];
  currentIndex.forEach(({ role, member }) => {
    const risk = estimateTurnoverRiskPercent(role, member, activeRegion?.turnover || 1);
    const effectiveSkill = getEffectiveSkill(role, member);
    const eligible = effectiveSkill >= STAFF_STORY_THRESHOLDS.competitorOffer.minSkill
      && risk >= STAFF_STORY_THRESHOLDS.competitorOffer.minTurnoverRisk
      && (member.stress >= STAFF_STORY_THRESHOLDS.competitorOffer.stress || member.loyalty <= STAFF_STORY_THRESHOLDS.competitorOffer.loyalty);

    if (!eligible || random() >= STAFF_STORY_THRESHOLDS.competitorOffer.chance) return;

    pushMoment(moments, createMoment({
      type: 'competitor_offer',
      role,
      member,
      day,
      month,
      severity: risk >= 6 ? 'major' : 'normal',
      title: `${member.nickname}收到竞品邀约`,
      summary: `${getRoleLabel(role)}【${member.nickname}】被同城竞店盯上，当前流失风险${risk.toFixed(1)}%，最好尽快用留任、培训或减压稳住。`,
      metrics: { risk: Number(risk.toFixed(1)), effectiveSkill, stress: Math.round(member.stress), loyalty: Math.round(member.loyalty) },
    }), storyMemory);
  });
  return moments;
};

const evaluateRetentionMoments = ({ currentIndex, previousIndex, day, month, storyMemory }) => {
  const moments = [];

  previousIndex.forEach(({ role, member: previous }, staffId) => {
    const current = currentIndex.get(staffId)?.member;
    if (!current) {
      if (!previous.retained) {
        pushMoment(moments, createMoment({
          type: 'competitor_poached',
          role,
          member: previous,
          day,
          month,
          severity: getEffectiveSkill(role, previous) >= 80 ? 'critical' : 'major',
          title: `${previous.nickname}被竞品挖走`,
          summary: `${getRoleLabel(role)}【${previous.nickname}】离开团队，传闻去了同城竞店。这个缺口会留在团队故事里。`,
          metrics: { retained: false, skill: previous.skill, stress: Math.round(previous.stress), loyalty: Math.round(previous.loyalty) },
        }), storyMemory);
        return;
      }
      pushMoment(moments, createMoment({
        type: 'retention_failed',
        role,
        member: previous,
        day,
        month,
        severity: 'critical',
        title: `${previous.nickname}挽留失败`,
        summary: `${getRoleLabel(role)}【${previous.nickname}】即使曾经开启留任，仍然离开团队，这会成为门店的人事记忆点。`,
        metrics: { retained: true, skill: previous.skill, stress: Math.round(previous.stress), loyalty: Math.round(previous.loyalty) },
      }), storyMemory);
      return;
    }

    const newlyRetained = !previous.retained && current.retained;
    const materiallyImproved = current.retained
      && ((current.loyalty - previous.loyalty) >= STAFF_STORY_THRESHOLDS.retention.loyaltyLift
        || (previous.stress - current.stress) >= STAFF_STORY_THRESHOLDS.retention.stressRelief);

    if (!newlyRetained && !materiallyImproved) return;

    pushMoment(moments, createMoment({
      type: 'retention_success',
      role,
      member: current,
      day,
      month,
      severity: getEffectiveSkill(role, current) >= 80 ? 'major' : 'normal',
      title: `${current.nickname}被稳住了`,
      summary: `${getRoleLabel(role)}【${current.nickname}】接受留任安排，忠诚${Math.round(current.loyalty)}、压力${Math.round(current.stress)}，短期流失风险被压住。`,
      metrics: {
        retained: true,
        loyalty: Math.round(current.loyalty),
        stress: Math.round(current.stress),
        loyaltyDelta: Number((current.loyalty - previous.loyalty).toFixed(1)),
        stressDelta: Number((current.stress - previous.stress).toFixed(1)),
      },
    }), storyMemory);
  });

  return moments;
};

const evaluateMentorshipMoments = ({ currentStaff, random, day, month, storyMemory }) => {
  const moments = [];

  STAFF_ROLES.forEach(role => {
    const members = getRoleMembers(currentStaff, role).map(member => normalizeStaffMember(role, member));
    const senior = members
      .filter(member => getCareerLevel(member).level >= STAFF_STORY_THRESHOLDS.mentorship.seniorLevel && getEffectiveSkill(role, member) >= STAFF_STORY_THRESHOLDS.mentorship.seniorSkill)
      .sort((a, b) => getEffectiveSkill(role, b) - getEffectiveSkill(role, a))[0];
    const junior = members
      .filter(member => member.id !== senior?.id && getCareerLevel(member).level <= STAFF_STORY_THRESHOLDS.mentorship.juniorLevel)
      .sort((a, b) => (a.xp || 0) - (b.xp || 0))[0];

    if (!senior || !junior || random() >= STAFF_STORY_THRESHOLDS.mentorship.chance) return;

    pushMoment(moments, createMoment({
      type: 'mentorship',
      role,
      member: senior,
      day,
      month,
      severity: 'normal',
      title: `${senior.nickname}带${junior.nickname}上手`,
      summary: `${getRoleLabel(role)}【${senior.nickname}】开始带教新人【${junior.nickname}】，团队不再只是单兵作战。`,
      participants: [
        { staffId: senior.id, name: senior.nickname, role, roleLabel: getRoleLabel(role), avatarId: senior.avatarId },
        { staffId: junior.id, name: junior.nickname, role, roleLabel: getRoleLabel(role), avatarId: junior.avatarId },
      ],
      metrics: {
        seniorLevel: getCareerLevel(senior).level,
        juniorLevel: getCareerLevel(junior).level,
        seniorSkill: getEffectiveSkill(role, senior),
      },
      extra: junior.id,
    }), storyMemory);
  });

  return moments;
};

const evaluateHighlightMoments = ({ currentIndex, monthlyStats, logs, day, month, storyMemory }) => {
  const moments = [];
  const sales = getMonthlyNumber(monthlyStats, 'sales');
  const targetProgress = getTargetProgress(monthlyStats);
  const salesTeam = [...currentIndex.values()].filter(item => item.role === 'sales');
  const dailySaleLogIds = findRelatedLogs(logs, ['售出 ', '【虚出消化】', '【价格审批】', '【重点客户】'], day);
  const dailySaleLogCount = dailySaleLogIds.length;
  const shortHanded = salesTeam.length > 0 && sales / salesTeam.length >= STAFF_STORY_THRESHOLDS.highlight.lowStaffSalesPerPerson;
  const highlightReady = dailySaleLogCount >= STAFF_STORY_THRESHOLDS.highlight.minDailySales
    || sales >= STAFF_STORY_THRESHOLDS.highlight.minMonthlySales
    || targetProgress >= STAFF_STORY_THRESHOLDS.highlight.targetProgress
    || shortHanded;

  if (!highlightReady || salesTeam.length === 0) return moments;

  const lead = salesTeam
    .sort((a, b) => getEffectiveSkill(b.role, b.member) - getEffectiveSkill(a.role, a.member))[0];

  pushMoment(moments, createMoment({
    type: 'highlight_save',
    role: lead.role,
    member: lead.member,
    day,
    month,
    severity: targetProgress >= 1 ? 'major' : 'normal',
    title: `${lead.member.nickname}关键订单救场`,
    summary: `展厅销售【${lead.member.nickname}】在关键节点扛住成交压力，本月销量${sales}台，厂家任务进度${Math.round(targetProgress * 100)}%。`,
    metrics: {
      monthlySales: sales,
      targetProgress: Number(targetProgress.toFixed(2)),
      salesTeamSize: salesTeam.length,
      effectiveSkill: getEffectiveSkill(lead.role, lead.member),
    },
    relatedLogIds: dailySaleLogIds,
  }), storyMemory);

  return moments;
};

const buildMemoryPatch = ({ moments, existingMemory = {} }) => moments.reduce((patch, moment) => {
  moment.participants.forEach(participant => {
    if (!participant.staffId) return;
    const previous = existingMemory[participant.staffId] || {};
    const pending = patch[participant.staffId] || {};
    const previousCounters = pending.counters || previous.counters || {};
    const timelineItem = {
      id: moment.id,
      type: moment.type,
      label: moment.storyType,
      title: moment.title,
      day: moment.day,
      month: moment.month,
      severity: moment.severity,
      memoryWeight: moment.memoryWeight,
    };
    patch[participant.staffId] = {
      staffId: participant.staffId,
      nickname: participant.name,
      role: participant.role,
      roleLabel: participant.roleLabel,
      lastMomentDay: moment.day,
      counters: {
        ...previousCounters,
        [moment.type]: (previousCounters[moment.type] || 0) + 1,
      },
      appendTimeline: [...(pending.appendTimeline || []), timelineItem],
    };
  });
  return patch;
}, {});

export const mergeStaffStoryMemoryPatch = ({
  memory = {},
  patch = {},
  maxTimelineItems = 12,
} = {}) => Object.entries(patch).reduce((nextMemory, [staffId, item]) => {
  const previous = nextMemory[staffId] || {};
  const appendTimeline = Array.isArray(item.appendTimeline) ? item.appendTimeline : [];
  const timeline = [
    ...(previous.timeline || []),
    ...appendTimeline,
  ].slice(-maxTimelineItems);

  nextMemory[staffId] = {
    ...previous,
    ...item,
    counters: {
      ...(previous.counters || {}),
      ...(item.counters || {}),
    },
    timeline,
    appendTimeline: undefined,
  };
  delete nextMemory[staffId].appendTimeline;
  return nextMemory;
}, { ...memory });

export function evaluateStaffStoryMoments({
  staff = {},
  previousStaff = {},
  monthlyStats = {},
  logs = [],
  rng,
  day,
  month,
  activeRegion,
  storyMemory = {},
  maxMoments = 6,
} = {}) {
  const absoluteDay = toAbsoluteDay({ day, month });
  const storyMonth = Number.isFinite(month) ? month : Math.floor((absoluteDay - 1) / 30) + 1;
  const random = getRandom(rng);
  const currentIndex = buildStaffIndex(staff);
  const previousIndex = buildStaffIndex(previousStaff);

  const evaluatedMoments = [
    ...evaluateRetentionMoments({ currentIndex, previousIndex, day: absoluteDay, month: storyMonth, storyMemory }),
    ...evaluateGrowthMoments({ currentIndex, previousIndex, monthlyStats, logs, day: absoluteDay, month: storyMonth, storyMemory }),
    ...evaluatePressureMoments({ currentIndex, previousIndex, day: absoluteDay, month: storyMonth, storyMemory }),
    ...evaluateCompetitorOfferMoments({ currentIndex, activeRegion, random, day: absoluteDay, month: storyMonth, storyMemory }),
    ...evaluateMentorshipMoments({ currentStaff: staff, random, day: absoluteDay, month: storyMonth, storyMemory }),
    ...evaluateHighlightMoments({ currentIndex, monthlyStats, logs, day: absoluteDay, month: storyMonth, storyMemory }),
  ];

  const moments = evaluatedMoments.slice(0, Math.max(0, maxMoments));
  return {
    moments,
    staffStoryMemoryPatch: buildMemoryPatch({ moments, existingMemory: storyMemory }),
    logs: moments.map(storyLogFromMoment),
  };
}
