import { useState } from 'react';
import { DEALER_REGIONS, MARKET_SIZE_OPTIONS } from '../game/config/market.js';
import { DIFFICULTY_MODES, GAME_SCENARIOS } from '../game/config/scenarios.js';
import { INVESTOR_PROFILES } from '../game/config/investors.js';
import { getGameDayOfMonth, getGameMonth } from '../game/engine/gameDate.js';

export function useCoreGameState() {
  const [gameState, setGameState] = useState('setup');
  const [dealerRegionId, setDealerRegionId] = useState('capital');
  const [marketSizeId, setMarketSizeId] = useState('medium');
  const [investorProfileId, setInvestorProfileId] = useState('roi_first');
  const [difficultyMode, setDifficultyMode] = useState('standard');
  const [scenarioId, setScenarioId] = useState('survive6');
  const [tutorial, setTutorial] = useState({ enabled: true, dismissed: false, visitedTabs: [] });
  const [endingSummary, setEndingSummary] = useState(null);
  const [endingModalDismissed, setEndingModalDismissed] = useState(false);
  const [day, setDay] = useState(1);

  const activeRegion = DEALER_REGIONS.find(region => region.id === dealerRegionId) || DEALER_REGIONS[1];
  const activeMarketSize = MARKET_SIZE_OPTIONS.find(option => option.id === (activeRegion.marketSizeId || marketSizeId)) || MARKET_SIZE_OPTIONS[1];
  const activeInvestor = INVESTOR_PROFILES.find(investor => investor.id === investorProfileId) || INVESTOR_PROFILES[2];
  const activeDifficulty = DIFFICULTY_MODES.find(item => item.id === difficultyMode) || DIFFICULTY_MODES[1];
  const activeScenario = GAME_SCENARIOS.find(item => item.id === scenarioId) || GAME_SCENARIOS[0];
  const month = getGameMonth(day);
  const dayOfMonth = getGameDayOfMonth(day);
  const scenarioDurationDays = activeScenario.months * 30;
  const isFreeScenario = activeScenario.id === 'free';

  return {
    activeDifficulty,
    activeInvestor,
    activeMarketSize,
    activeRegion,
    activeScenario,
    day,
    dayOfMonth,
    dealerRegionId,
    difficultyMode,
    endingModalDismissed,
    endingSummary,
    gameState,
    investorProfileId,
    isFreeScenario,
    marketSizeId,
    month,
    scenarioDurationDays,
    scenarioId,
    setDay,
    setDealerRegionId,
    setDifficultyMode,
    setEndingModalDismissed,
    setEndingSummary,
    setGameState,
    setInvestorProfileId,
    setMarketSizeId,
    setScenarioId,
    setTutorial,
    tutorial,
  };
}
