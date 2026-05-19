import {
  ONBOARDING_TRAINING_COPY,
  ONBOARDING_TRAINING_DAYS,
  ONBOARDING_TRAINING_WINDOW_DAYS,
} from '../config/onboardingTraining.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const asArray = value => (Array.isArray(value) ? value : []);
const asSet = value => new Set(asArray(value).filter(Boolean));
const safeDay = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : 1;
};

const getTrainingDayNumber = ({ dayOfMonth, currentDay, day }) => safeDay(dayOfMonth ?? currentDay ?? day ?? 1);

const isVisited = (visitedTabs, tabId) => visitedTabs.has(tabId);

const isCompletionKeyMet = ({ completionKey, visitedTabs, activity }) => {
  if (!completionKey) return false;
  if (completionKey.startsWith('visited:')) {
    return isVisited(visitedTabs, completionKey.slice('visited:'.length));
  }
  if (completionKey.startsWith('visitedAny:')) {
    return completionKey
      .slice('visitedAny:'.length)
      .split(',')
      .map(tab => tab.trim())
      .some(tab => isVisited(visitedTabs, tab));
  }
  return Boolean(activity?.[completionKey]);
};

const isChecklistItemComplete = ({ item, training, completedChecklistIds, completedTrainingIds, visitedTabs, activity }) => {
  if (completedTrainingIds.has(training.id)) return true;
  if (completedChecklistIds.has(item.id) || completedChecklistIds.has(`${training.id}.${item.id}`)) return true;
  return isCompletionKeyMet({ completionKey: item.completionKey, visitedTabs, activity });
};

export function getOnboardingTrainingDay(day, trainingDays = ONBOARDING_TRAINING_DAYS) {
  const dayNumber = safeDay(day);
  return trainingDays.find(item => item.day === dayNumber) || null;
}

export function getOnboardingTrainingPlan(trainingDays = ONBOARDING_TRAINING_DAYS) {
  return [...trainingDays].sort((a, b) => a.day - b.day);
}

export function evaluateOnboardingTraining({
  day,
  currentDay,
  dayOfMonth,
  visitedTabs = [],
  completedChecklistIds = [],
  completedTrainingIds = [],
  activity = {},
  trainingDays = ONBOARDING_TRAINING_DAYS,
  copy = ONBOARDING_TRAINING_COPY,
  windowDays = ONBOARDING_TRAINING_WINDOW_DAYS,
} = {}) {
  const plan = getOnboardingTrainingPlan(trainingDays);
  const effectiveDay = clamp(getTrainingDayNumber({ dayOfMonth, currentDay, day }), 1, windowDays);
  const unlockedDays = plan.filter(training => training.day <= effectiveDay);
  const visitedTabSet = asSet(visitedTabs);
  const completedChecklistSet = asSet(completedChecklistIds);
  const completedTrainingSet = asSet(completedTrainingIds);

  const days = plan.map(training => {
    const checklist = asArray(training.checklist).map(item => ({
      ...item,
      completed: isChecklistItemComplete({
        item,
        training,
        completedChecklistIds: completedChecklistSet,
        completedTrainingIds: completedTrainingSet,
        visitedTabs: visitedTabSet,
        activity,
      }),
    }));
    const completed = checklist.length > 0 ? checklist.every(item => item.completed) : completedTrainingSet.has(training.id);

    return {
      ...training,
      locked: training.day > effectiveDay,
      checklist,
      completed,
      completedCount: checklist.filter(item => item.completed).length,
      totalCount: checklist.length,
    };
  });

  const availableDays = days.filter(training => !training.locked);
  const currentTrainingDay =
    availableDays.find(training => !training.completed) ||
    days.find(training => training.day === Math.min(effectiveDay + 1, windowDays)) ||
    days[days.length - 1] ||
    null;
  const firstIncompleteItem = currentTrainingDay?.checklist?.find(item => !item.completed) || null;
  const completedDays = days.filter(training => training.completed);
  const unlockedCompletedDays = unlockedDays.filter(training => days.find(dayItem => dayItem.id === training.id)?.completed);
  const totalChecklistItems = days.reduce((sum, training) => sum + training.totalCount, 0);
  const completedChecklistItems = days.reduce((sum, training) => sum + training.completedCount, 0);
  const isFinished = days.length > 0 && days.every(training => training.completed);

  return {
    effectiveDay,
    windowDays,
    isFinished,
    days,
    currentTrainingDay,
    completedDays,
    progress: {
      completedDays: completedDays.length,
      unlockedCompletedDays: unlockedCompletedDays.length,
      totalDays: days.length,
      completedChecklistItems,
      totalChecklistItems,
      percent: totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0,
    },
    nextStep: isFinished
      ? {
          id: 'finished',
          title: copy.finishedTitle,
          summary: copy.finishedSummary,
          targetTab: null,
          actionHint: null,
        }
      : {
          id: firstIncompleteItem?.id || currentTrainingDay?.id || 'locked',
          trainingId: currentTrainingDay?.id || null,
          title: currentTrainingDay?.title || copy.finishedTitle,
          summary: currentTrainingDay?.summary || copy.finishedSummary,
          targetTab: currentTrainingDay?.targetTab || null,
          checklistItem: firstIncompleteItem || null,
          actionHint: currentTrainingDay?.locked ? copy.defaultLockedHint : currentTrainingDay?.actionHint || null,
          completionText: currentTrainingDay?.completionText || null,
        },
  };
}
