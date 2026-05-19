import { AFTERSALES_COMPLAINTS, NEGOTIATION_TEMPLATES, SALES_COMPLAINTS } from '../config/events.js';
import { CUSTOMER_ARCHETYPES, CUSTOMER_NAMES, LEAD_CHANNELS } from '../config/marketing.js';
import { createCustomerProfile } from './customerProfiles.js';

export const createPriceApprovalCase = ({
  car,
  modelDef,
  finalConv,
  day,
  marketPrices,
  estimateDealAddons,
  random = Math.random,
  now = Date.now,
}) => {
  const requestedDiscount = Math.round((6000 + random() * 22000) / 1000) * 1000;
  const requestedPrice = Math.max(Math.round(modelDef.baseCost * 0.82), car.price - requestedDiscount);
  const competitorPrice = Math.round((marketPrices[modelDef.id] || modelDef.msrp) * (0.96 + random() * 0.04));
  const minimumGuardPrice = Math.round(modelDef.baseCost * 0.88);
  const addons = estimateDealAddons(modelDef.id, requestedPrice);
  const customerTypes = ['价格敏感', '金融意向强', '置换客户', '竞品比价中', '月底急提车'];
  return {
    id: `approval_price_${now()}_${random().toString(36).slice(2, 7)}`,
    type: 'price',
    day,
    dueDay: day + 1,
    status: 'pending',
    modelId: modelDef.id,
    modelName: modelDef.name,
    carId: car.id,
    currentPrice: car.price,
    requestedPrice,
    counterPrice: Math.max(requestedPrice, Math.round((requestedPrice + car.price) / 2 / 1000) * 1000),
    competitorPrice,
    minimumGuardPrice,
    customerTag: customerTypes[Math.floor(random() * customerTypes.length)],
    closeChance: Math.round(Math.min(0.92, finalConv + 0.18) * 100),
    ...addons,
  };
};

export const createComplaintCase = ({
  source,
  day,
  random = Math.random,
  now = Date.now,
}) => {
  const pool = source === '售后' ? AFTERSALES_COMPLAINTS : SALES_COMPLAINTS;
  const template = pool[Math.floor(random() * pool.length)];
  const baseCost = source === '售后' ? 1800 : 2500;
  return {
    id: `approval_complaint_${now()}_${random().toString(36).slice(2, 7)}`,
    type: 'complaint',
    day,
    dueDay: day + 1,
    status: 'pending',
    source,
    title: template.title,
    desc: template.desc,
    impact: template.impact,
    careCost: baseCost,
    strongCost: baseCost * 2,
  };
};

export const createCustomerDealCase = ({
  channelId = 'showroom',
  segment = null,
  sourceDay,
  stockList,
  carModels,
  marketPrices,
  activeRegion,
  salesAvgSkill,
  csiScore,
  getRetailQualityScore,
  getPriceReality,
  estimateDealAddons,
  random = Math.random,
  now = Date.now,
}) => {
  const availableCars = stockList.filter(car => {
    const model = carModels.find(item => item.id === car.modelId);
    return model && (!segment || model.segment === segment);
  });
  const pool = availableCars.length > 0 ? availableCars : stockList;
  if (pool.length === 0) return null;
  const car = pool[Math.floor(random() * pool.length)];
  const modelDef = carModels.find(item => item.id === car.modelId);
  if (!modelDef) return null;
  const archetype = CUSTOMER_ARCHETYPES[Math.floor(random() * CUSTOMER_ARCHETYPES.length)];
  const channel = LEAD_CHANNELS.find(item => item.id === channelId) || LEAD_CHANNELS[0];
  const currentMarketPrice = marketPrices[modelDef.id] || modelDef.msrp;
  const competitorPrice = Math.round(currentMarketPrice * (0.96 + random() * 0.04));
  const requestedDiscount = Math.round((8000 + random() * 26000 * archetype.priceFocus) / 1000) * 1000;
  const financeIntent = Math.min(0.95, 0.35 + archetype.financeBias + (channelId === 'livestream' ? 0.1 : 0));
  const qualityScore = getRetailQualityScore();
  const premiumTolerance = 0.006 + qualityScore * 0.035 + financeIntent * 0.012;
  const targetPrice = Math.max(Math.round(modelDef.baseCost * 0.86), Math.min(car.price - requestedDiscount, Math.round(competitorPrice * (1 + premiumTolerance))));
  const floorPrice = Math.max(Math.round(modelDef.baseCost * 0.82), targetPrice - 8000);
  const tradeInIntent = Math.min(0.95, 0.18 + archetype.tradeInBias + (activeRegion.tradeInBoost || 0));
  const urgency = archetype.id === 'urgent' ? 0.85 : 0.35 + random() * 0.45;
  const priceReality = getPriceReality(car.price, competitorPrice, { qualityScore, financeIntent });
  const baseClose = Math.max(0.06, Math.min(0.82, 0.24 + (salesAvgSkill / 360) + (channel.walkInFactor - 0.9) * 0.25 + (csiScore >= 92 ? 0.05 : csiScore >= 86 ? 0 : -0.06) + Math.min(0, priceReality.conversionAdj * 0.35)));
  const estimatedAddons = estimateDealAddons(modelDef.id, targetPrice);
  const profile = createCustomerProfile({
    archetype,
    channel,
    modelDef,
    activeRegion,
    currentPrice: car.price,
    targetPrice,
    competitorPrice,
    financeIntent,
    tradeInIntent,
    urgency,
    carModels,
    random,
  });
  const adjustedBaseClose = Math.max(0.04, Math.min(0.9, baseClose + (profile.seriesFit || 0)));
  return {
    id: `customer_${sourceDay}_${now()}_${random().toString(36).slice(2, 7)}`,
    day: sourceDay,
    dueDay: sourceDay + 1,
    status: 'pending',
    customerName: CUSTOMER_NAMES[Math.floor(random() * CUSTOMER_NAMES.length)],
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    archetypeDesc: archetype.desc,
    channelId,
    channelName: channel.name,
    channelIcon: channel.icon,
    segment: modelDef.segment,
    preferredSeries: profile.preferredSeries || [],
    avoidedSeries: profile.avoidedSeries || [],
    sensitivity: profile.sensitivity || null,
    modelId: modelDef.id,
    modelName: modelDef.name,
    carId: car.id,
    currentPrice: car.price,
    marketPrice: currentMarketPrice,
    targetPrice,
    floorPrice,
    competitorPrice,
    allowedPremium: priceReality.allowedPremium,
    financeIntent,
    tradeInIntent,
    urgency,
    profile,
    baseClose: adjustedBaseClose,
    estimatedGrossProfit: estimatedAddons.grossProfit,
  };
};

export const createNegotiationCase = ({
  kind,
  day,
  random = Math.random,
  now = Date.now,
}) => {
  const template = NEGOTIATION_TEMPLATES[kind];
  if (!template) return null;
  return {
    id: `negotiation_${kind}_${now()}_${random().toString(36).slice(2, 7)}`,
    type: 'negotiation',
    kind,
    day,
    dueDay: day + 2,
    status: 'pending',
    title: template.title,
    from: template.from,
    desc: template.desc,
    options: template.options,
  };
};
