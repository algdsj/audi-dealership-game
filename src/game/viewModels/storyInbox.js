import { STORY_EVENT_CHAIN_BY_ID } from '../config/storyEvents.js';

export const STORY_SEVERITY_META = {
  info: {
    label: '观察',
    tone: 'info',
    cardClass: 'border-blue-200 bg-blue-50/70',
    badgeClass: 'border-blue-200 bg-blue-100 text-blue-700',
  },
  warning: {
    label: '预警',
    tone: 'warning',
    cardClass: 'border-amber-200 bg-amber-50/70',
    badgeClass: 'border-amber-200 bg-amber-100 text-amber-700',
  },
  high: {
    label: '高压',
    tone: 'high',
    cardClass: 'border-orange-200 bg-orange-50/70',
    badgeClass: 'border-orange-200 bg-orange-100 text-orange-700',
  },
  critical: {
    label: '危机',
    tone: 'critical',
    cardClass: 'border-red-200 bg-red-50/70',
    badgeClass: 'border-red-200 bg-red-100 text-red-700',
  },
};

export const isStoryInboxMessage = (message = {}) => (
  message.type === 'story'
  || Boolean(message.storyEventId)
  || Boolean(message.chainId && STORY_EVENT_CHAIN_BY_ID[message.chainId])
);

export const getStoryInboxDetails = (message = {}) => {
  if (!isStoryInboxMessage(message)) return null;
  const chain = STORY_EVENT_CHAIN_BY_ID[message.chainId] || {};
  const severity = message.storySeverity || message.severity || 'info';
  const severityMeta = STORY_SEVERITY_META[severity] || STORY_SEVERITY_META.info;

  return {
    chainTitle: message.chainTitle || chain.title || '剧情线',
    source: message.from || chain.source || '经营事件',
    stageLabel: message.storyStageLabel || message.stageLabel || '',
    severity,
    severityLabel: severityMeta.label,
    severityMeta,
    participants: Array.isArray(message.participants) ? message.participants : chain.participants || [],
    suggestedActions: Array.isArray(message.suggestedActions) ? message.suggestedActions : chain.suggestedActions || [],
    effectsPreview: Array.isArray(message.effectsPreview) ? message.effectsPreview : chain.effectsPreview || [],
    tags: Array.isArray(message.tags) ? message.tags : chain.tags || [],
    expiresAt: message.expiresAt || null,
  };
};

const severityRank = {
  critical: 4,
  high: 3,
  warning: 2,
  info: 1,
};

export const buildStoryPressureSummary = (storyState = {}, currentDay = storyState.lastEvaluatedDay || 1) => {
  const chains = storyState.chains || storyState.chainProgress || {};
  const day = Math.max(1, Number(currentDay) || 1);
  return Object.entries(chains)
    .map(([chainId, progress]) => {
      const chain = STORY_EVENT_CHAIN_BY_ID[chainId];
      if (!chain || !['active', 'critical'].includes(progress?.status)) return null;
      const severity = progress.severity || 'info';
      const severityMeta = STORY_SEVERITY_META[severity] || STORY_SEVERITY_META.info;
      const stage = chain.stages.find(item => item.id === progress.stage);
      const mitigationUntil = progress.mitigationUntil || null;
      const mitigationScoreReduction = Number(progress.mitigationScoreReduction) || 0;
      const isMitigated = Boolean(mitigationUntil && mitigationUntil >= day && mitigationScoreReduction > 0);
      return {
        chainId,
        title: chain.title,
        source: chain.source,
        stageLabel: stage?.label || progress.stage || '',
        severity,
        severityLabel: severityMeta.label,
        severityMeta,
        lastScore: Number.isFinite(progress.lastScore) ? progress.lastScore : null,
        lastEventAt: progress.lastEventAt || null,
        cooldownUntil: progress.cooldownUntil || null,
        lastAction: progress.lastAction || null,
        lastActionAt: progress.lastActionAt || null,
        mitigationUntil,
        mitigationScoreReduction,
        isMitigated,
        mitigationLabel: isMitigated ? `已缓冲 · 风险-${mitigationScoreReduction} 至D${mitigationUntil}` : '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => (
      (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
      || (b.lastScore || 0) - (a.lastScore || 0)
      || (b.lastEventAt || 0) - (a.lastEventAt || 0)
    ));
};
