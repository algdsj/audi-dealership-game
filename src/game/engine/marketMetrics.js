const MARKET_SHARE_KEYS = ['audi', 'bmw', 'benz', 'ev', 'audiLocal'];

export const normalizeMarketShare = (share = {}) => {
  const normalized = {};
  const knownTotal = MARKET_SHARE_KEYS.reduce((sum, key) => sum + Math.max(0, Number(share[key]) || 0), 0);
  const scale = knownTotal > 100 ? 100 / knownTotal : 1;
  MARKET_SHARE_KEYS.forEach(key => {
    normalized[key] = Math.round(Math.max(0, Number(share[key]) || 0) * scale * 10) / 10;
  });
  const knownRoundedTotal = MARKET_SHARE_KEYS.reduce((sum, key) => sum + normalized[key], 0);
  normalized.other = Math.max(0, Math.round((100 - knownRoundedTotal) * 10) / 10);
  const finalTotal = [...MARKET_SHARE_KEYS, 'other'].reduce((sum, key) => sum + normalized[key], 0);
  if (finalTotal !== 100) normalized.other = Math.round((normalized.other + (100 - finalTotal)) * 10) / 10;
  return normalized;
};
