import { traitSum } from './staffing.js';

export const estimateDealAddons = ({
  modelId,
  finalPrice,
  carModels,
  getDynamicMsrp,
  getDynamicRebate,
}) => {
  const model = carModels.find(item => item.id === modelId);
  if (!model) return { derivativeProfit: 0, financeCommission: 0, rebate: 0, grossProfit: 0 };
  const msrp = getDynamicMsrp(modelId);
  const derivativeProfit = Math.round(msrp * 0.012);
  const financeCommission = Math.round(msrp * 0.7 * 0.018);
  const rebate = getDynamicRebate(modelId);
  const grossProfit = finalPrice - model.baseCost + rebate + derivativeProfit + financeCommission;
  return { derivativeProfit, financeCommission, rebate, grossProfit };
};

export const calculateRetailQualityScore = ({
  salesAvgSkill,
  csiScore,
  salesMembers,
}) => {
  const salesScore = Math.max(0, Math.min(1, salesAvgSkill / 100));
  const normalizedCsiScore = Math.max(0, Math.min(1, (csiScore - 70) / 30));
  const financeTalent = salesMembers.length > 0 ? traitSum('sales', salesMembers, 'financeBonus') / salesMembers.length : 0;
  const financeScore = Math.max(0, Math.min(1, 0.42 + financeTalent + (salesAvgSkill >= 75 ? 0.12 : 0) + (csiScore >= 92 ? 0.08 : 0)));
  return Math.max(0, Math.min(1, salesScore * 0.42 + normalizedCsiScore * 0.34 + financeScore * 0.24));
};

export const getPriceReality = ({
  offerPrice,
  referencePrice,
  qualityScore,
  financeIntent = 0,
  mode,
}) => {
  const reference = Math.max(1, Number(referencePrice) || 1);
  const gapRatio = ((Number(offerPrice) || 0) - reference) / reference;
  const financeModeBoost = mode === 'finance' ? 0.01 + Number(financeIntent || 0) * 0.018 : 0;
  const allowedPremium = Math.min(0.065, 0.006 + qualityScore * 0.038 + financeModeBoost);
  if (gapRatio <= 0) {
    return {
      gapRatio,
      allowedPremium,
      conversionAdj: Math.min(0.18, Math.abs(gapRatio) * 1.25),
      closeCap: 0.96,
      overAllowed: false,
    };
  }
  const overAllowed = Math.max(0, gapRatio - allowedPremium);
  const conversionAdj = -(gapRatio * 3.2 + overAllowed * 8.5 + Math.max(0, gapRatio - 0.06) * 13 + Math.max(0, gapRatio - 0.10) * 18);
  let closeCap = 0.92;
  if (overAllowed > 0) closeCap = Math.max(0.03, 0.24 + qualityScore * 0.08 - overAllowed * 4.6);
  if (gapRatio > 0.08) closeCap = Math.min(closeCap, 0.08 + qualityScore * 0.04);
  if (gapRatio > 0.12) closeCap = Math.min(closeCap, 0.025 + qualityScore * 0.015);
  if (gapRatio > 0.16) closeCap = 0.01;
  return { gapRatio, allowedPremium, conversionAdj, closeCap, overAllowed: overAllowed > 0 };
};
