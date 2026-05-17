import { EMPTY_LEAD_CHANNELS } from '../config/marketing.js';

export const sumLeadChannels = (channels = {}) => Object.values({ ...EMPTY_LEAD_CHANNELS, ...channels }).reduce((sum, value) => sum + (Number(value) || 0), 0);

export const normalizeLeadChannels = (marketingState = {}) => {
  const channels = { ...EMPTY_LEAD_CHANNELS, ...(marketingState.leadChannels || {}) };
  if (!marketingState.leadChannels && Number(marketingState.leads) > 0) {
    channels.showroom += Number(marketingState.leads) || 0;
  }
  return channels;
};
