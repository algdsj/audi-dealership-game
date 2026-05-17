import { ACHIEVEMENTS } from '../config/achievements.js';
import { normalizeFeedbackState } from './feedback.js';

export const buildFeedbackProgress = ({
  currentFeedback,
  monthlyReport = null,
  achievementContext = {},
  achievements = ACHIEVEMENTS,
}) => {
  const normalized = normalizeFeedbackState(currentFeedback);
  const newAchievementIds = achievements
    .filter(def => !normalized.unlockedAchievementIds.includes(def.id) && def.check(achievementContext))
    .map(def => def.id);

  return {
    nextFeedback: {
      ...normalized,
      unlockedAchievementIds: [...normalized.unlockedAchievementIds, ...newAchievementIds],
      monthlyBadges: monthlyReport ? [...normalized.monthlyBadges, ...monthlyReport.badges].slice(-36) : normalized.monthlyBadges,
      lastMonthReport: monthlyReport || normalized.lastMonthReport,
      ratingHistory: monthlyReport ? [...normalized.ratingHistory, monthlyReport].slice(-12) : normalized.ratingHistory,
    },
    newAchievementIds,
  };
};
