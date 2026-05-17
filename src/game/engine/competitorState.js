import { COMPETITOR_BRANDS, COMPETITOR_STRATEGIES } from '../config/market.js';
import { normalizeCompetitorStoreIntel } from './competitorIntel.js';

export const createCompetitorStore = ({ brand, index, random = Math.random }) => {
  const meta = COMPETITOR_BRANDS[brand] || COMPETITOR_BRANDS.bmw;
  const strategy = COMPETITOR_STRATEGIES[(index + (brand === 'ev' ? 2 : brand === 'benz' ? 1 : 0)) % COMPETITOR_STRATEGIES.length];
  return normalizeCompetitorStoreIntel({
    id: `comp_${brand}_${index + 1}_${random().toString(36).slice(2, 6)}`,
    name: meta.names[index % meta.names.length],
    brand,
    tier: meta.tier,
    strategy: strategy.id,
    priceIndex: 1.0,
    activityLevel: 0,
    currentActivity: null,
    staffQuality: 58 + Math.floor(random() * 28),
    customerPull: meta.basePull + Math.floor(random() * 16),
    monthlySales: 0,
    lastAction: '开局常规经营',
    isVisible: brand === 'audi_local' || index < 2,
    relationship: brand === 'audi_local' ? 50 : undefined,
    cooperation: null,
    priceWarCount: 0,
  }, index);
};

export const createCompetitorState = ({ marketSize, random = Math.random }) => {
  const stores = [];
  Object.entries(marketSize.counts).forEach(([key, count]) => {
    const brand = key === 'audiLocal' ? 'audi_local' : key;
    for (let index = 0; index < count; index++) stores.push(createCompetitorStore({ brand, index, random }));
  });
  return {
    marketSize: marketSize.id,
    stores,
    marketShare: { audi: 12, bmw: 24, benz: 24, ev: marketSize.counts.ev ? 14 : 0, audiLocal: marketSize.counts.audiLocal ? 8 : 0, other: 18 },
    lastMarketShare: null,
    totalMarketSize: marketSize.totalMarketSize,
    playerMonthlySales: 0,
    priceWarActive: false,
    priceWarRound: 0,
    intelHistory: [{ month: 1, day: 1, source: '市场情报组', content: `${marketSize.name}竞品版图已建立，建议持续关注降价和活动。`, reliability: '可靠' }],
    playerCountermeasures: [],
    cooldowns: {},
  };
};
