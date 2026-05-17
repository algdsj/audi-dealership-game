export const getDynamicMsrp = ({ modelId, carModels, manufacturerPolicy }) => {
  const model = carModels.find(item => item.id === modelId);
  if (!model) return 0;
  return Math.round(model.msrp * (1 + (manufacturerPolicy.msrpTrend || 0) / 100));
};

export const getConfiguredModelPrice = ({
  modelId,
  carModels,
  manufacturerPolicy,
  modelPriceOverrides = {},
}) => {
  const price = modelPriceOverrides[modelId];
  return Number.isFinite(price) && price > 0
    ? price
    : getDynamicMsrp({ modelId, carModels, manufacturerPolicy });
};

export const getDynamicRebate = ({ modelId, carModels, manufacturerPolicy }) => {
  const model = carModels.find(item => item.id === modelId);
  if (!model) return 0;
  return Math.round(model.rebate * (manufacturerPolicy.rebateMultiplier || 1));
};
