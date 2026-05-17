import { useState } from 'react';
import {
  createInitialDrafts,
  createInitialFinance,
  createInitialGmWealth,
  createInitialVirtualSales,
} from '../game/state/initialState.js';

export function useFinanceState() {
  const [finance, setFinance] = useState(createInitialFinance);
  const [drafts, setDrafts] = useState(createInitialDrafts);
  const [gmWealth, setGmWealth] = useState(createInitialGmWealth);
  const [virtualSales, setVirtualSales] = useState(createInitialVirtualSales);

  return {
    drafts,
    finance,
    gmWealth,
    setDrafts,
    setFinance,
    setGmWealth,
    setVirtualSales,
    virtualSales,
  };
}
