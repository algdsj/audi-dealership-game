import { useState } from 'react';
import { DEFAULT_FEEDBACK } from '../game/config/achievements.js';
import {
  createInitialFacility,
  createInitialInvestorRelations,
  createInitialMonthlyStats,
  createInitialOrderForm,
  createInitialOperatingEvents,
  createInitialStrategy,
} from '../game/state/initialState.js';

export function useBusinessState() {
  const [investorRelations, setInvestorRelations] = useState(createInitialInvestorRelations);
  const [strategy, setStrategy] = useState(createInitialStrategy);
  const [orderForm, setOrderForm] = useState(createInitialOrderForm);
  const [operatingEvents, setOperatingEvents] = useState(createInitialOperatingEvents);
  const [monthlyStats, setMonthlyStats] = useState(createInitialMonthlyStats);
  const [facility, setFacility] = useState(createInitialFacility);
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);

  return {
    facility,
    feedback,
    investorRelations,
    monthlyStats,
    orderForm,
    operatingEvents,
    setFacility,
    setFeedback,
    setInvestorRelations,
    setMonthlyStats,
    setOrderForm,
    setOperatingEvents,
    setStrategy,
    strategy,
  };
}
