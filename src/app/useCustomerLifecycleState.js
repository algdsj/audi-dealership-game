import { useState } from 'react';
import {
  createInitialCsi,
  createInitialCustomerLifecycle,
  createInitialInsuranceRenewals,
} from '../game/state/initialState.js';
import { createStaffMember } from '../game/engine/staffing.js';

export function useCustomerLifecycleState() {
  const [afterSales, setAfterSales] = useState({
    technicians: [
      createStaffMember('tech', 30),
      createStaffMember('tech', 30),
    ],
    salary: 200,
  });
  const [csi, setCsi] = useState(createInitialCsi);
  const [customerLifecycle, setCustomerLifecycle] = useState(createInitialCustomerLifecycle);
  const [insuranceRenewals, setInsuranceRenewals] = useState(createInitialInsuranceRenewals);
  const [soldVehicles, setSoldVehicles] = useState([]);

  return {
    afterSales,
    csi,
    customerLifecycle,
    insuranceRenewals,
    setAfterSales,
    setCsi,
    setCustomerLifecycle,
    setInsuranceRenewals,
    setSoldVehicles,
    soldVehicles,
  };
}
