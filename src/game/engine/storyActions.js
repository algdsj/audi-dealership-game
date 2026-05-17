import { STORY_EVENT_CHAIN_BY_ID } from '../config/storyEvents.js';

export const STORY_ACTIONS = [
  {
    id: 'acknowledge',
    label: '登记跟进',
    tone: 'slate',
    logVerb: '已登记为本周重点跟进事项',
    cooldownExtensionDays: 1,
    scoreReduction: 4,
    effectDays: 5,
  },
  {
    id: 'mitigate',
    label: '安排专项处理',
    tone: 'blue',
    logVerb: '已安排专项处理并要求相关负责人复盘',
    cooldownExtensionDays: 4,
    scoreReduction: 10,
    effectDays: 10,
  },
  {
    id: 'escalate',
    label: '召开管理会',
    tone: 'amber',
    logVerb: '已升级为管理会讨论事项',
    cooldownExtensionDays: 7,
    scoreReduction: 16,
    effectDays: 14,
  },
];

const asArray = value => Array.isArray(value) ? value : [];

const getAction = actionId => STORY_ACTIONS.find(action => action.id === actionId) || STORY_ACTIONS[0];

const buildEffectSummary = (action, resolvedAt) => {
  const parts = [];
  if (action.cooldownExtensionDays > 0) parts.push(`冷却+${action.cooldownExtensionDays}天`);
  if (action.scoreReduction > 0) parts.push(`风险-${action.scoreReduction}至D${resolvedAt + action.effectDays}`);
  return parts.join('，');
};

export function resolveStoryInboxAction({
  storyState = {},
  message = {},
  actionId = 'acknowledge',
  day = 1,
} = {}) {
  const action = getAction(actionId);
  const chainId = message.chainId;
  const chain = STORY_EVENT_CHAIN_BY_ID[chainId] || {};
  const resolvedAt = Math.max(1, Number(day) || Number(message.day) || 1);
  const eventId = message.storyEventId || message.id;
  const resolution = {
    eventId,
    inboxId: message.id,
    chainId,
    actionId: action.id,
    actionLabel: action.label,
    day: resolvedAt,
  };
  const previousChain = storyState.chains?.[chainId] || {};
  const previousResolutions = asArray(storyState.resolutions);
  const alreadyResolved = previousResolutions.some(item => item.inboxId === message.id);
  const cooldownUntil = Math.max(previousChain.cooldownUntil || 0, resolvedAt + action.cooldownExtensionDays);
  const mitigationUntil = Math.max(previousChain.mitigationUntil || 0, resolvedAt + action.effectDays);
  const mitigationScoreReduction = Math.max(previousChain.mitigationScoreReduction || 0, action.scoreReduction);
  const effectSummary = buildEffectSummary(action, resolvedAt);
  const effect = {
    cooldownExtensionDays: action.cooldownExtensionDays,
    scoreReduction: action.scoreReduction,
    effectDays: action.effectDays,
    cooldownUntil,
    mitigationUntil,
    mitigationScoreReduction,
    summary: effectSummary,
  };
  const nextResolution = { ...resolution, effect };
  const nextResolutions = alreadyResolved
    ? previousResolutions.map(item => item.inboxId === message.id ? nextResolution : item)
    : [...previousResolutions, nextResolution];

  return {
    storyState: {
      ...storyState,
      chains: {
        ...(storyState.chains || {}),
        ...(chainId ? {
          [chainId]: {
            ...previousChain,
            lastAction: action.id,
            lastActionAt: resolvedAt,
            lastActionEffect: effect,
            cooldownUntil,
            mitigationUntil,
            mitigationScoreReduction,
            handledCount: (previousChain.handledCount || 0) + (alreadyResolved ? 0 : 1),
          },
        } : {}),
      },
      resolutions: nextResolutions.slice(-80),
    },
    inboxPatch: {
      storyResolved: true,
      storyResolution: nextResolution,
    },
    log: {
      day: resolvedAt,
      type: action.id === 'acknowledge' ? 'info' : 'success',
      message: `🗂️【剧情处理】${chain.title || message.title || '经营剧情'}：${action.logVerb}${effectSummary ? `（${effectSummary}）` : ''}。`,
    },
  };
}
