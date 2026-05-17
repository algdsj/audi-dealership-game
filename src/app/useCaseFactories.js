import { CAR_MODELS } from '../game/config/vehicles.js';
import {
  createComplaintCase as createComplaintCaseCore,
  createCustomerDealCase as createCustomerDealCaseCore,
  createPriceApprovalCase as createPriceApprovalCaseCore,
} from '../game/engine/caseFactories.js';

export function useCaseFactories({
  activeRegion,
  currentDay,
  csi,
  estimateDealAddons,
  getPriceReality,
  getRetailQualityScore,
  inventory,
  marketPrices,
  salesAvgSkill,
}) {
  const createPriceApprovalCase = (car, modelDef, finalConv) => {
    return createPriceApprovalCaseCore({
      car,
      modelDef,
      finalConv,
      day: currentDay,
      marketPrices,
      estimateDealAddons,
    });
  };

  const createComplaintCase = (source) => {
    return createComplaintCaseCore({ source, day: currentDay });
  };

  const createCustomerDealCase = ({ channelId = 'showroom', segment = null, sourceDay = currentDay, stockList = inventory }) => {
    return createCustomerDealCaseCore({
      channelId,
      segment,
      sourceDay,
      stockList,
      carModels: CAR_MODELS,
      marketPrices,
      activeRegion,
      salesAvgSkill,
      csiScore: csi.score,
      getRetailQualityScore,
      getPriceReality,
      estimateDealAddons,
    });
  };

  return {
    createComplaintCase,
    createCustomerDealCase,
    createPriceApprovalCase,
  };
}
