import { useState } from 'react';

export function useInventoryState() {
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [testDriveCars, setTestDriveCars] = useState([]);

  return {
    inventory,
    pendingOrders,
    setInventory,
    setPendingOrders,
    setTestDriveCars,
    testDriveCars,
  };
}
