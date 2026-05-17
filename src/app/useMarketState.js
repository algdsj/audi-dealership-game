import { useState } from 'react';
import { INITIAL_MARKET_PRICES } from '../game/config/vehicles.js';
import {
  createInitialManufacturerPolicy,
  createInitialMarketEnvironment,
  createInitialMarketing,
} from '../game/state/initialState.js';
import { createCompetitorState as createCompetitorStateCore } from '../game/engine/competitorState.js';
import { usePricingBridge } from './usePricingBridge.js';

export function useMarketState({ activeMarketSize }) {
  const [marketPrices, setMarketPrices] = useState(INITIAL_MARKET_PRICES);
  const [modelPriceOverrides, setModelPriceOverrides] = useState({});
  const [marketEnvironment, setMarketEnvironment] = useState(createInitialMarketEnvironment);
  const [competitors, setCompetitors] = useState(() => createCompetitorStateCore({ marketSize: activeMarketSize }));
  const [manufacturerPolicy, setManufacturerPolicy] = useState(createInitialManufacturerPolicy);
  const [marketing, setMarketing] = useState(createInitialMarketing);

  const pricing = usePricingBridge({ manufacturerPolicy, modelPriceOverrides });

  return {
    ...pricing,
    competitors,
    manufacturerPolicy,
    marketEnvironment,
    marketPrices,
    marketing,
    modelPriceOverrides,
    setCompetitors,
    setManufacturerPolicy,
    setMarketEnvironment,
    setMarketPrices,
    setMarketing,
    setModelPriceOverrides,
  };
}
