import {
  SALES_OPPORTUNITY_ACTIONS,
  SALES_OPPORTUNITY_DIFFICULTY,
  SALES_OPPORTUNITY_LIMITS,
  SALES_OPPORTUNITY_OWNER_FEEDBACK,
  SALES_OPPORTUNITY_OWNER_RULES,
  SALES_OPPORTUNITY_TYPES,
} from '../config/salesOpportunities.js';
import { CUSTOMER_SERIES_PREFERENCE_WEIGHTS } from '../config/vehicleStructure.js';
import { getEffectiveSkill, normalizeStaffMember } from './staffing.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getDifficultyTuning = (activeDifficulty) => (
  SALES_OPPORTUNITY_DIFFICULTY[activeDifficulty?.id] || SALES_OPPORTUNITY_DIFFICULTY.standard
);

const asArray = value => (Array.isArray(value) ? value : []);

const getMemberName = member => member?.nickname || member?.name || '未命名员工';

const getStaffMembersForRole = (staff = {}, role) => {
  if (role === 'tech') return asArray(staff.tech?.members || staff.afterSales?.technicians);
  if (role === 'service') return asArray(staff.service?.members);
  if (role === 'streamer') return asArray(staff.streamer?.members);
  if (role === 'dcc') return asArray(staff.dcc?.members);
  return asArray(staff.sales?.members);
};

const getOpportunityOwnerWorkloads = opportunities => opportunities.reduce((counts, item) => {
  const ownerId = item.owner?.id;
  if (!ownerId || ['closed', 'discarded', 'expired'].includes(item.status)) return counts;
  return { ...counts, [ownerId]: (counts[ownerId] || 0) + 1 };
}, {});

const getOwnerScore = ({ member, role, workload }) => {
  const normalized = normalizeStaffMember(role, member);
  const traits = asArray(normalized.traits);
  const skill = getEffectiveSkill(role, normalized);
  const stress = Number(normalized.stress) || 0;
  const loyalty = Number(normalized.loyalty) || 0;
  const retainedBonus = normalized.retained ? SALES_OPPORTUNITY_OWNER_RULES.retainedBonus : 0;
  const traitBonus = traits.includes('relationship') ? 4
    : traits.includes('price_killer') ? 3
    : traits.includes('talker') ? 3
    : traits.includes('patient') ? 2
    : 0;
  return skill * SALES_OPPORTUNITY_OWNER_RULES.skillWeight
    + stress * SALES_OPPORTUNITY_OWNER_RULES.stressWeight
    + loyalty * SALES_OPPORTUNITY_OWNER_RULES.loyaltyWeight
    + retainedBonus
    + traitBonus
    - workload * SALES_OPPORTUNITY_OWNER_RULES.workloadPenalty;
};

const findOpportunityOwner = ({ opportunityType, staff, workloads }) => {
  const type = SALES_OPPORTUNITY_TYPES[opportunityType] || SALES_OPPORTUNITY_TYPES.lead;
  const roleOrder = [...(type.ownerRoles || []), ...SALES_OPPORTUNITY_OWNER_RULES.fallbackRoleOrder];
  const uniqueRoles = [...new Set(roleOrder)];
  const candidates = uniqueRoles.flatMap(role => getStaffMembersForRole(staff, role).map(member => ({
    role,
    member,
    score: getOwnerScore({ member, role, workload: workloads[member.id] || 0 }),
  })));
  const picked = candidates.sort((a, b) => b.score - a.score)[0];
  if (!picked) return null;
  return {
    id: picked.member.id,
    role: picked.role,
    name: getMemberName(picked.member),
    skill: Math.round(getEffectiveSkill(picked.role, picked.member)),
    stress: Math.round(Number(picked.member.stress) || 0),
    workload: workloads[picked.member.id] || 0,
  };
};

const getActionOwnerModifier = ({ owner }) => {
  if (!owner) return 0;
  const skillModifier = ((Number(owner.skill) || 50) - 55) / 420;
  const stressModifier = -Math.max(0, (Number(owner.stress) || 0) - 55) / 500;
  return clamp(skillModifier + stressModifier, -0.12, 0.14);
};

const getTraitActionModifier = ({ actionId, owner, staff }) => {
  if (!owner) return 0;
  const member = getStaffMembersForRole(staff, owner.role).find(item => item.id === owner.id);
  const traitBonus = SALES_OPPORTUNITY_OWNER_RULES.traitActionBonus[actionId] || {};
  return asArray(member?.traits).reduce((sum, traitId) => sum + (traitBonus[traitId] || 0), 0);
};

export const normalizeSalesOpportunityPool = (pool) => ({
  active: asArray(pool?.active)
    .filter(item => item && item.id)
    .slice(0, SALES_OPPORTUNITY_LIMITS.maxActive),
  history: asArray(pool?.history).slice(0, SALES_OPPORTUNITY_LIMITS.maxHistory),
});

const buildOpportunity = ({
  typeId,
  sourceId,
  title,
  body,
  customerName,
  modelId,
  modelName,
  score,
  heat,
  trust,
  dueDay,
  day,
  segment = null,
  preferredSeries = [],
  metadata = {},
}) => {
  const type = SALES_OPPORTUNITY_TYPES[typeId] || SALES_OPPORTUNITY_TYPES.lead;
  return {
    id: `sales_opp_${typeId}_${sourceId}_${day}`,
    typeId,
    status: type.status,
    title: title || type.title,
    body: body || type.description,
    sourceName: type.sourceName,
    customerName: customerName || '意向客户',
    modelId: modelId || null,
    modelName: modelName || '',
    segment,
    preferredSeries,
    score: Math.round(clamp(score, 0, 100)),
    heat: Math.round(clamp(heat, 0, 100)),
    trust: Math.round(clamp(trust, 0, 100)),
    createdDay: day,
    dueDay,
    lastActionDay: null,
    suggestedAction: type.description,
    actions: (type.actions || []).map(actionId => SALES_OPPORTUNITY_ACTIONS[actionId]).filter(Boolean),
    owner: metadata.owner || null,
    metadata: { ...metadata, sourceId, segment, preferredSeries },
  };
};

const summarizeStaff = (staff = {}) => {
  const salesMembers = asArray(staff.sales?.members);
  const dccMembers = asArray(staff.dcc?.members);
  const allMembers = [...salesMembers, ...dccMembers];
  const averageSkill = allMembers.length
    ? allMembers.reduce((sum, member) => sum + (Number(member.skill) || 0), 0) / allMembers.length
    : 50;
  const averageStress = allMembers.length
    ? allMembers.reduce((sum, member) => sum + (Number(member.stress) || 0), 0) / allMembers.length
    : 45;
  return {
    averageSkill,
    averageStress,
    capacity: Math.max(1, salesMembers.length + Math.ceil(dccMembers.length / 2)),
  };
};

const scoreInventoryPressure = (inventory = []) => {
  const stock = asArray(inventory);
  const agedStock = stock.filter(car => (Number(car.stockDays) || 0) >= 45);
  const showroomStock = stock.filter(car => car.location === 'showroom');
  return {
    agedCount: agedStock.length,
    showroomCount: showroomStock.length,
    pressure: clamp(agedStock.length * 8 + Math.max(0, stock.length - showroomStock.length) * 1.5, 0, 40),
    sampleCar: agedStock[0] || stock[0] || null,
  };
};

const countMarketingLeads = (marketing = {}) => {
  if (marketing.leadChannels) {
    return Object.values(marketing.leadChannels).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }
  return Number(marketing.leads) || 0;
};

const getPreferredSeriesForSegment = segment => Object.entries(CUSTOMER_SERIES_PREFERENCE_WEIGHTS[segment] || {})
  .sort((a, b) => b[1] - a[1])
  .slice(0, 2)
  .map(([series]) => series);

const inferOpportunitySeriesPreference = ({ candidate, carModels = [] }) => {
  const model = carModels.find(item => item.id === candidate.modelId);
  if (model?.series) return [model.series, ...getPreferredSeriesForSegment(model.segment).filter(series => series !== model.series)].slice(0, 2);
  return getPreferredSeriesForSegment(candidate.segment || candidate.metadata?.segment);
};

const hasActiveForSource = (pool, sourceId, typeId) => (
  pool.active.some(item => item.typeId === typeId && item.metadata?.sourceId === sourceId && !['closed', 'discarded', 'expired'].includes(item.status))
);

const makeLifecycleCandidates = ({ customerLifecycle, day, tuning }) => {
  const records = asArray(customerLifecycle?.records);
  const followUps = asArray(customerLifecycle?.followUps);
  const dueFollowUps = followUps
    .filter(item => item.status === 'pending' && (item.dueDay || day) <= day + 1)
    .map(item => ({
      typeId: item.typeId === 'revival' ? 'risk' : 'follow_up',
      sourceId: item.id,
      title: item.title,
      body: item.body,
      customerName: item.customerName,
      modelName: item.modelName,
      score: (item.valueScore || 40) * 0.65 + tuning.qualityModifier,
      heat: SALES_OPPORTUNITY_TYPES.follow_up.baseHeat + 10,
      trust: SALES_OPPORTUNITY_TYPES.follow_up.baseTrust,
      dueDay: item.dueDay || day + 2,
      segment: item.segment || null,
      metadata: { source: 'customer_lifecycle', recordId: item.recordId },
    }));

  const recordCandidates = records
    .filter(record => (record.nextFollowUpDay || 9999) <= day + 1)
    .map(record => ({
      typeId: record.status === 'sold' ? 'follow_up' : 'risk',
      sourceId: record.id,
      title: record.status === 'sold' ? '成交客户二次经营' : '战败客户复活窗口',
      body: record.status === 'sold' ? '客户已完成交付，可尝试转介绍、续保或精品服务。' : '战败客户仍可能回流，需要明确现车和报价优势。',
      customerName: record.customerName,
      modelId: record.modelId,
      modelName: record.modelName,
      score: (record.valueScore || 35) * 0.55 + tuning.qualityModifier,
      heat: record.status === 'sold' ? 38 : 46,
      trust: record.status === 'sold' ? 66 : 34,
      dueDay: day + 3,
      segment: record.segment || null,
      metadata: { source: 'customer_lifecycle', recordId: record.id },
    }));

  return [...dueFollowUps, ...recordCandidates];
};

const makeMarketCandidates = ({ marketing, inventory, staffSummary, day, tuning }) => {
  const leadCount = countMarketingLeads(marketing);
  if (leadCount <= 0) return [];
  const inventoryPressure = scoreInventoryPressure(inventory);
  const count = clamp(Math.ceil((leadCount / 18) * tuning.generationMultiplier), 1, 3);
  return Array.from({ length: count }, (_, index) => {
    const typeId = index === 0 && inventoryPressure.showroomCount > 0 ? 'test_drive' : 'lead';
    const type = SALES_OPPORTUNITY_TYPES[typeId];
    return {
      typeId,
      sourceId: `marketing_${day}_${index}`,
      title: type.title,
      body: leadCount >= 30 ? '今日线索量较高，DCC需要先筛出高意向客户。' : type.description,
      score: type.baseHeat + staffSummary.averageSkill * 0.22 + tuning.qualityModifier - staffSummary.averageStress * 0.08,
      heat: type.baseHeat + Math.min(18, leadCount / 3),
      trust: type.baseTrust + Math.max(0, staffSummary.averageSkill - 55) * 0.12,
      dueDay: day + type.dueInDays + tuning.expiryPressure,
      segment: typeId === 'test_drive' ? null : '年轻',
      metadata: { source: 'marketing', leadCount },
    };
  });
};

const makeInventoryRiskCandidate = ({ inventory, day, tuning }) => {
  const pressure = scoreInventoryPressure(inventory);
  if (pressure.agedCount <= 0) return [];
  const car = pressure.sampleCar;
  return [{
    typeId: 'risk',
    sourceId: `inventory_${car?.id || 'aged'}`,
    title: '长库龄库存成交风险',
    body: `${pressure.agedCount} 台库存库龄偏长，销售机会需要优先匹配现车。`,
    modelId: car?.modelId || null,
    score: 36 + pressure.pressure + tuning.qualityModifier,
    heat: 34 + pressure.pressure,
    trust: 34,
    dueDay: day + 1,
    metadata: { source: 'inventory', agedCount: pressure.agedCount, carId: car?.id || null },
  }];
};

const makeNegotiationCandidates = ({ approvalCases, day, tuning }) => asArray(approvalCases)
  .filter(item => ['pending', 'open'].includes(item.status || 'pending'))
  .filter(item => item.type === 'negotiation' || item.type === 'price' || item.kind)
  .slice(0, 2)
  .map(item => ({
    typeId: item.type === 'price' ? 'quote' : 'risk',
    sourceId: item.id || `${item.kind}_${day}`,
    title: item.type === 'price' ? '批价报价跟进' : '谈判窗口转销售机会',
    body: item.title || '审批/谈判事项可能影响今日成交节奏。',
    score: 52 + tuning.qualityModifier,
    heat: item.type === 'price' ? 70 : 42,
    trust: item.type === 'price' ? 48 : 38,
    dueDay: day + 1,
    metadata: { source: 'negotiation', approvalCaseId: item.id || null, kind: item.kind || item.type },
  }));

export function evaluateSalesOpportunitiesDaily({
  activeDifficulty,
  absoluteDay,
  approvalCases = [],
  customerLifecycle,
  inventory = [],
  marketing = {},
  salesOpportunities,
  staff = {},
  carModels = [],
}) {
  const tuning = getDifficultyTuning(activeDifficulty);
  const pool = normalizeSalesOpportunityPool(salesOpportunities);
  const staffSummary = summarizeStaff(staff);
  const candidates = [
    ...makeLifecycleCandidates({ customerLifecycle, day: absoluteDay, tuning }),
    ...makeMarketCandidates({ marketing, inventory, staffSummary, day: absoluteDay, tuning }),
    ...makeInventoryRiskCandidate({ inventory, day: absoluteDay, tuning }),
    ...makeNegotiationCandidates({ approvalCases, day: absoluteDay, tuning }),
  ];

  const workloads = getOpportunityOwnerWorkloads(pool.active);
  const generated = candidates
    .filter(candidate => !hasActiveForSource(pool, candidate.sourceId, candidate.typeId))
    .map(candidate => {
      const type = SALES_OPPORTUNITY_TYPES[candidate.typeId] || SALES_OPPORTUNITY_TYPES.lead;
      const staffCapacityBonus = Math.min(8, staffSummary.capacity * 2);
      return buildOpportunity({
        ...candidate,
        day: absoluteDay,
        dueDay: Math.max(absoluteDay, candidate.dueDay || absoluteDay + type.dueInDays),
        score: (candidate.score || type.baseHeat) * (type.scoreWeight || 1) + staffCapacityBonus,
        segment: candidate.segment || candidate.metadata?.segment || null,
        preferredSeries: inferOpportunitySeriesPreference({ candidate, carModels }),
        metadata: {
          ...(candidate.metadata || {}),
          preferredSeries: inferOpportunitySeriesPreference({ candidate, carModels }),
          owner: findOpportunityOwner({ opportunityType: candidate.typeId, staff, workloads }),
        },
      });
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, tuning.dailyLimit);

  const nextActive = [...generated, ...pool.active]
    .sort((a, b) => b.score - a.score)
    .slice(0, SALES_OPPORTUNITY_LIMITS.maxActive);

  return {
    salesOpportunities: { ...pool, active: nextActive },
    generated,
    inboxItems: generated.length > 0 ? [{
      id: `inbox_sales_opportunities_${absoluteDay}`,
      day: absoluteDay,
      from: '销售机会池',
      title: `新增 ${generated.length} 个销售机会`,
      body: '销售机会池已按线索、试驾、报价、跟进和风险优先级更新。',
      type: 'sales_opportunity',
      tags: ['sales', 'opportunity'],
    }] : [],
    logs: generated.length > 0 ? [{
      day: absoluteDay,
      type: 'info',
      message: `【销售机会池】新增 ${generated.length} 个机会，最高评分 ${generated[0].score}。`,
    }] : [],
  };
}

const buildActionMetadata = ({ action, opportunity, success, currentDay, cost, revenueIntent }) => ({
  actionId: action.id,
  opportunityId: opportunity.id,
  typeId: opportunity.typeId,
  success,
  cost,
  revenueIntent,
  day: currentDay,
  inboxTag: action.metadata?.inboxTag || null,
});

export function resolveSalesOpportunityAction({
  actionId,
  activeDifficulty,
  currentDay,
  expectedGrossProfit = 0,
  formatMoney = amount => `Y${Math.round(amount).toLocaleString()}`,
  random = Math.random,
  salesOpportunities,
  staff = {},
  opportunityId,
}) {
  const pool = normalizeSalesOpportunityPool(salesOpportunities);
  const actionConfig = SALES_OPPORTUNITY_ACTIONS[actionId];
  if (!actionConfig) return { ok: false, reason: 'action_not_found' };

  const opportunity = pool.active.find(item => item.id === opportunityId);
  if (!opportunity) return { ok: false, reason: 'opportunity_not_found' };
  if (!actionConfig.fromStatuses.includes(opportunity.status)) {
    return { ok: false, reason: 'status_not_allowed' };
  }

  const tuning = getDifficultyTuning(activeDifficulty);
  const urgencyModifier = opportunity.dueDay < currentDay ? -0.12 : opportunity.dueDay === currentDay ? -0.04 : 0.03;
  const qualityModifier = (opportunity.heat + opportunity.trust - 100) / 500;
  const ownerModifier = getActionOwnerModifier({ owner: opportunity.owner });
  const traitModifier = getTraitActionModifier({ actionId, owner: opportunity.owner, staff });
  const successChance = clamp(actionConfig.successBase + tuning.actionSuccessModifier + urgencyModifier + qualityModifier + ownerModifier + traitModifier, 0.05, 0.98);
  const success = random() < successChance;
  const cost = Math.round((actionConfig.cost || 0) * tuning.costMultiplier);
  const nextStatus = success ? actionConfig.nextStatus : opportunity.status === 'new' ? 'at_risk' : opportunity.status;
  const revenueIntent = Boolean(actionConfig.metadata?.revenueIntent);
  const revenue = success && actionId === 'close' ? Math.max(0, Math.round(expectedGrossProfit)) : 0;

  const updatedOpportunity = {
    ...opportunity,
    status: nextStatus,
    heat: clamp(opportunity.heat + (success ? actionConfig.heatDelta : -6), 0, 100),
    trust: clamp(opportunity.trust + (success ? actionConfig.trustDelta : -4), 0, 100),
    dueDay: actionConfig.terminal ? opportunity.dueDay : Math.max(currentDay, opportunity.dueDay + (success ? actionConfig.dueDelta : -1)),
    lastActionDay: currentDay,
    lastActionId: actionId,
    lastSuccessChance: successChance,
    metadata: {
      ...opportunity.metadata,
      lastAction: {
        ...buildActionMetadata({ action: { ...actionConfig, id: actionId }, opportunity, success, currentDay, cost, revenueIntent }),
        owner: opportunity.owner || null,
        ownerModifier,
        traitModifier,
      },
    },
  };

  const terminal = actionConfig.terminal && (success || actionId === 'discard');
  const nextActive = terminal
    ? pool.active.filter(item => item.id !== opportunityId)
    : pool.active.map(item => item.id === opportunityId ? updatedOpportunity : item);
  const historyItem = terminal ? {
    ...updatedOpportunity,
    resolvedDay: currentDay,
    result: success ? actionConfig.nextStatus : 'failed',
  } : null;

  return {
    ok: true,
    success,
    successChance,
    salesOpportunities: {
      active: nextActive,
      history: historyItem ? [historyItem, ...pool.history].slice(0, SALES_OPPORTUNITY_LIMITS.maxHistory) : pool.history,
    },
    customerPatch: {
      trustDelta: success ? actionConfig.trustDelta : -4,
      heatDelta: success ? actionConfig.heatDelta : -6,
      nextFollowUpDay: terminal ? null : updatedOpportunity.dueDay,
    },
    metadata: {
      ...buildActionMetadata({ action: { ...actionConfig, id: actionId }, opportunity, success, currentDay, cost, revenueIntent }),
      owner: opportunity.owner || null,
      ownerModifier,
      traitModifier,
    },
    ledgerItems: [
      ...(cost > 0 ? [{ label: `销售机会-${actionConfig.title}`, amount: -cost, type: 'expense' }] : []),
      ...(revenue > 0 ? [{ label: `销售机会-${actionConfig.title}`, amount: revenue, type: 'pending' }] : []),
    ],
    inboxItems: success && actionConfig.metadata?.inboxTag ? [{
      id: `inbox_sales_opp_${opportunity.id}_${actionId}_${currentDay}`,
      day: currentDay,
      from: '销售机会池',
      title: `${actionConfig.title}完成`,
      body: `${opportunity.customerName} 的${opportunity.title}已推进到 ${updatedOpportunity.status}。${opportunity.owner?.name ? `负责人：${opportunity.owner.name}。` : ''}`,
      type: 'sales_opportunity',
      tags: ['sales', actionConfig.metadata.inboxTag],
    }] : [],
    logs: [{
      day: currentDay,
      type: success ? actionConfig.metadata?.logType || 'success' : 'warning',
      message: `【销售机会池】${opportunity.customerName}：${actionConfig.title}${success ? '成功' : '未达预期'}，成功率约${Math.round(successChance * 100)}%${opportunity.owner?.name ? `，负责人${opportunity.owner.name}` : ''}${cost > 0 ? `，成本${formatMoney(cost)}` : ''}。`,
    }],
  };
}

export function applySalesOpportunityStaffFeedback({
  actionId,
  result,
  staff,
}) {
  const owner = result?.metadata?.owner;
  if (!owner?.id || !staff?.[owner.role]?.members) return { staff, logs: [] };
  const profile = actionId === 'discard'
    ? SALES_OPPORTUNITY_OWNER_FEEDBACK.discard
    : actionId === 'close' && result.success
    ? SALES_OPPORTUNITY_OWNER_FEEDBACK.close
    : result.success
    ? SALES_OPPORTUNITY_OWNER_FEEDBACK.success
    : SALES_OPPORTUNITY_OWNER_FEEDBACK.failed;
  const nextStaff = {
    ...staff,
    [owner.role]: {
      ...staff[owner.role],
      members: staff[owner.role].members.map(member => {
        if (member.id !== owner.id) return member;
        const normalized = normalizeStaffMember(owner.role, member);
        return normalizeStaffMember(owner.role, {
          ...normalized,
          xp: normalized.xp + profile.xp,
          stress: normalized.stress + profile.stress,
          loyalty: normalized.loyalty + profile.loyalty,
        });
      }),
    },
  };
  return {
    staff: nextStaff,
    logs: [{
      day: result.metadata.day,
      type: result.success ? 'success' : 'info',
      message: `【机会负责人】${owner.name} 完成${result.metadata.actionId}，经验${profile.xp > 0 ? '+' : ''}${profile.xp}，压力${profile.stress > 0 ? '+' : ''}${profile.stress.toFixed(1)}。`,
    }],
  };
}

export function expireSalesOpportunities({
  absoluteDay,
  salesOpportunities,
}) {
  const pool = normalizeSalesOpportunityPool(salesOpportunities);
  const expired = pool.active
    .filter(item => (item.dueDay || absoluteDay) < absoluteDay - SALES_OPPORTUNITY_LIMITS.staleAfterDays)
    .map(item => ({ ...item, status: 'expired', resolvedDay: absoluteDay, result: 'expired' }));
  if (expired.length === 0) return { salesOpportunities: pool, expired: [], logs: [] };
  const expiredIds = new Set(expired.map(item => item.id));
  return {
    salesOpportunities: {
      active: pool.active.filter(item => !expiredIds.has(item.id)),
      history: [...expired, ...pool.history].slice(0, SALES_OPPORTUNITY_LIMITS.maxHistory),
    },
    expired,
    logs: [{
      day: absoluteDay,
      type: 'warning',
      message: `【销售机会池】${expired.length} 个过期机会已移入历史。`,
    }],
  };
}
