export const settleActiveMarketingActivities = ({
  marketing,
  previousDay,
  absoluteDay,
}) => {
  const stillActive = (marketing.activeActivities || []).filter(activity => activity.endDay > absoluteDay);
  const expired = (marketing.activeActivities || []).filter(activity => activity.endDay <= absoluteDay && activity.endDay > previousDay);
  const bonuses = {
    activeDccWalkinBonus: 0,
    activeNaturalBonus: 0,
    activeConvBonus: 0,
  };

  for (const activity of marketing.activeActivities || []) {
    if (activity.endDay > absoluteDay) {
      if (activity.effect === 'dcc_walkin') bonuses.activeDccWalkinBonus += activity.effectValue;
      if (activity.effect === 'natural_walkin') bonuses.activeNaturalBonus += activity.effectValue;
      if (activity.effect === 'conversion') bonuses.activeConvBonus += activity.effectValue;
      if (activity.effect2 === 'conversion') bonuses.activeConvBonus += activity.effect2Value;
    }
  }

  return {
    marketing: { ...marketing, activeActivities: stillActive },
    bonuses,
    logs: expired.map(activity => ({ day: absoluteDay, type: 'info', message: `${activity.icon}【${activity.name}】活动已结束。` })),
  };
};
