import { CAR_MODELS } from '../game/config/vehicles.js';
import { calculateRetailQualityScore, estimateDealAddons as estimateDealAddonsCore, getPriceReality as getPriceRealityCore } from '../game/engine/dealEvaluation.js';
import { normalizeLeadChannels, sumLeadChannels } from '../game/engine/leads.js';
import { getEffectiveSkill } from '../game/engine/staffing.js';

const averageSkill = (type, members) => {
  if (!members?.length) return 0;
  return Math.round(members.reduce((sum, member) => sum + getEffectiveSkill(type, member), 0) / members.length);
};

export function useOperationalMetrics({
  afterSales,
  competitors,
  csi,
  getDynamicMsrp,
  getDynamicRebate,
  marketing,
  staff,
}) {
  const techCount = afterSales.technicians.length;
  const techAvgSkill = averageSkill('tech', afterSales.technicians);
  const dccCount = staff.dcc.members.length;
  const salesCount = staff.sales.members.length;
  const serviceCount = staff.service?.members?.length || 0;
  const streamerCount = staff.streamer?.members?.length || 0;
  const dccAvgSkill = averageSkill('dcc', staff.dcc.members);
  const salesAvgSkill = averageSkill('sales', staff.sales.members);
  const serviceAvgSkill = averageSkill('service', staff.service?.members);
  const streamerAvgSkill = averageSkill('streamer', staff.streamer?.members);
  const leadChannels = normalizeLeadChannels(marketing);
  const totalLeadPool = sumLeadChannels(leadChannels);

  const getActiveCountermeasureValue = (type, state = competitors) => (state.playerCountermeasures || [])
    .filter(item => item.type === type && item.remainingDays > 0)
    .reduce((sum, item) => sum + (item.effectValue || 0), 0);

  const getCompetitorPressure = (state = competitors) => {
    const stores = state.stores || [];
    const activeThreat = stores.reduce((sum, store) => {
      const activityBoost = store.currentActivity ? (store.currentActivity.pullBoost || 0) : 0;
      const priceBoost = Math.max(0, (1 - (store.priceIndex || 1)) * 180);
      const localMult = store.brand === 'audi_local' ? 1.35 : 1;
      return sum + ((store.customerPull || 50) + activityBoost + priceBoost) * localMult;
    }, 0);
    const serviceShield = getActiveCountermeasureValue('service', state);
    const referralShield = getActiveCountermeasureValue('referral', state);
    const csiShield = getActiveCountermeasureValue('csi_push', state);
    const cooperationShield = stores.some(store => store.brand === 'audi_local' && store.cooperation?.remainingDays > 0) ? 0.12 : 0;
    const warPressure = state.priceWarActive ? 0.08 : 0;
    const pressure = Math.min(0.36, (activeThreat / Math.max(1, (state.totalMarketSize || 200) * 145)) + warPressure);
    return Math.max(0, pressure - serviceShield - referralShield - csiShield - cooperationShield);
  };

  const estimateDealAddons = (modelId, finalPrice) => {
    return estimateDealAddonsCore({
      modelId,
      finalPrice,
      carModels: CAR_MODELS,
      getDynamicMsrp,
      getDynamicRebate,
    });
  };

  const getRetailQualityScore = () => {
    return calculateRetailQualityScore({
      salesAvgSkill,
      csiScore: csi.score,
      salesMembers: staff.sales.members,
    });
  };

  const getPriceReality = (offerPrice, referencePrice, options = {}) => {
    return getPriceRealityCore({
      offerPrice,
      referencePrice,
      qualityScore: options.qualityScore ?? getRetailQualityScore(),
      financeIntent: options.financeIntent,
      mode: options.mode,
    });
  };

  return {
    dccAvgSkill,
    dccCount,
    estimateDealAddons,
    getActiveCountermeasureValue,
    getCompetitorPressure,
    getPriceReality,
    getRetailQualityScore,
    leadChannels,
    salesAvgSkill,
    salesCount,
    serviceAvgSkill,
    serviceCount,
    streamerAvgSkill,
    streamerCount,
    techAvgSkill,
    techCount,
    totalLeadPool,
  };
}
