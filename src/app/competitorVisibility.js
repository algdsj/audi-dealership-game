export function buildCompetitorVisibility(competitors) {
  const visibleCompetitorStores = (competitors.stores || []).filter(store => store.isVisible !== false);
  const hiddenCompetitorCount = Math.max(0, (competitors.stores || []).length - visibleCompetitorStores.length);

  return {
    hiddenCompetitorCount,
    visibleCompetitorStores,
  };
}
