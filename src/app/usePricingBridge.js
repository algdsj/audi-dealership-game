import { CAR_MODELS } from '../game/config/vehicles.js';
import {
  getConfiguredModelPrice as getConfiguredModelPriceCore,
  getDynamicMsrp as getDynamicMsrpCore,
  getDynamicRebate as getDynamicRebateCore,
} from '../game/engine/pricing.js';

export function usePricingBridge({ manufacturerPolicy, modelPriceOverrides }) {
  const getDynamicMsrp = (modelId) => getDynamicMsrpCore({
    modelId,
    carModels: CAR_MODELS,
    manufacturerPolicy,
  });

  const getConfiguredModelPrice = (modelId) => getConfiguredModelPriceCore({
    modelId,
    carModels: CAR_MODELS,
    manufacturerPolicy,
    modelPriceOverrides,
  });

  const getDynamicRebate = (modelId) => getDynamicRebateCore({
    modelId,
    carModels: CAR_MODELS,
    manufacturerPolicy,
  });

  return {
    carModels: CAR_MODELS,
    getConfiguredModelPrice,
    getDynamicMsrp,
    getDynamicRebate,
  };
}
