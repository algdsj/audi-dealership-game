export const updateDailyMarketPrices = ({
  marketPrices,
  carModels,
  inventory,
  marketEnvironment,
  activeRegion,
  getDynamicMsrp,
  random = Math.random,
}) => {
  const nextMarketPrices = { ...marketPrices };

  carModels.forEach(model => {
    const dynamicMsrp = getDynamicMsrp(model.id);
    const myCars = inventory.filter(car => car.modelId === model.id);
    const competitorAffectsModel = marketEnvironment.competitorEvent.affectedSegments.includes(model.segment);
    const dailyFlux = (random() - 0.48) * 0.006;
    const environmentDrift = (
      (marketEnvironment.seasonIndex - 1) * 0.015
      + marketEnvironment.supplyChain.priceDrift
      + (competitorAffectsModel ? marketEnvironment.competitorEvent.priceDrift : 0)
      + (activeRegion.pricePressure || 0) * 0.08
    );

    nextMarketPrices[model.id] *= (1 + dailyFlux);
    nextMarketPrices[model.id] *= (1 + environmentDrift);

    if (myCars.length > 0) {
      const myAvgPrice = myCars.reduce((sum, car) => sum + car.price, 0) / myCars.length;
      if (myAvgPrice < nextMarketPrices[model.id]) {
        nextMarketPrices[model.id] -= (nextMarketPrices[model.id] - myAvgPrice) * 0.1;
      } else {
        nextMarketPrices[model.id] += (dynamicMsrp - nextMarketPrices[model.id]) * 0.02;
      }
    }

    nextMarketPrices[model.id] += (dynamicMsrp - model.msrp) * 0.05;
    const floor = model.baseCost * 0.8;
    const ceil = dynamicMsrp * 1.1;
    nextMarketPrices[model.id] = Math.max(floor, Math.min(ceil, nextMarketPrices[model.id]));
  });

  return nextMarketPrices;
};
