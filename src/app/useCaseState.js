import { useState } from 'react';
import { createInitialSalesOpportunities } from '../game/state/initialState.js';

export function useCaseState() {
  const [approvalCases, setApprovalCases] = useState([]);
  const [customerDeals, setCustomerDeals] = useState([]);
  const [salesOpportunities, setSalesOpportunities] = useState(createInitialSalesOpportunities);

  return {
    approvalCases,
    customerDeals,
    salesOpportunities,
    setApprovalCases,
    setCustomerDeals,
    setSalesOpportunities,
  };
}
