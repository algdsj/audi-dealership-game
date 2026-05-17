import { useState } from 'react';
import { createInitialDailyStats } from '../game/state/initialState.js';

export function useDailyLedgerState({ currentDay }) {
  const [dailyStats, setDailyStats] = useState(createInitialDailyStats);
  const [dailyLedger, setDailyLedger] = useState([]);

  const appendLedger = (items, ledgerDay = currentDay) => {
    setDailyLedger(prev => [...prev, { day: ledgerDay, items: Array.isArray(items) ? items : [items] }]);
  };

  return {
    appendLedger,
    dailyLedger,
    dailyStats,
    setDailyLedger,
    setDailyStats,
  };
}
