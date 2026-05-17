export const advanceCompetitorDailyState = ({
  competitors,
  dayOfMonth,
  absoluteDay,
  random = Math.random,
}) => {
  const logs = [];
  const nextCompetitors = {
    ...competitors,
    playerCountermeasures: (competitors.playerCountermeasures || [])
      .map(item => ({ ...item, remainingDays: item.remainingDays - 1 }))
      .filter(item => item.remainingDays > 0),
    stores: (competitors.stores || []).map(store => {
      const currentActivity = store.currentActivity
        ? { ...store.currentActivity, remainingDays: store.currentActivity.remainingDays - 1 }
        : null;
      const cooperation = store.cooperation
        ? { ...store.cooperation, remainingDays: store.cooperation.remainingDays - 1 }
        : null;
      if (store.brand === 'audi_local' && cooperation?.remainingDays > 0 && random() < 0.05) {
        logs.push({ day: absoluteDay, type: 'warning', message: `🌐【联盟背刺】${store.name}突然背弃联合抗竞并暗中降价，联盟解除，关系大幅下降。` });
        return {
          ...store,
          currentActivity: { type: 'discount', effect: '背刺降价', pullBoost: 28, remainingDays: 10 },
          cooperation: null,
          priceIndex: Math.max(0.82, (store.priceIndex || 1) - 0.08),
          relationship: Math.max(0, (store.relationship || 50) - 30),
          lastAction: '背弃联盟，暗中降价抢客',
        };
      }
      return {
        ...store,
        currentActivity: currentActivity && currentActivity.remainingDays > 0 ? currentActivity : null,
        cooperation: cooperation && cooperation.remainingDays > 0 ? cooperation : null,
        relationship: store.brand === 'audi_local' && dayOfMonth === 30 ? Math.min(100, (store.relationship || 50) + 1) : store.relationship,
        priceIndex: store.currentActivity?.type === 'discount' && currentActivity?.remainingDays > 0 ? store.priceIndex : Math.min(1, (store.priceIndex || 1) + 0.03),
      };
    }),
    cooldowns: { ...(competitors.cooldowns || {}) },
  };
  Object.keys(nextCompetitors.cooldowns).forEach(key => {
    nextCompetitors.cooldowns[key] = Math.max(0, (nextCompetitors.cooldowns[key] || 0) - 1);
  });
  return { competitors: nextCompetitors, logs };
};
