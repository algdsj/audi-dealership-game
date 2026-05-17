export const settleUsedCarDailyStock = ({
  usedCars,
  newSoldVehicles,
  finance,
  monthlyStats,
  ledgerItems,
  absoluteDay,
  random = Math.random,
}) => {
  const nextFinance = { ...finance };
  const nextMonthlyStats = { ...monthlyStats };
  const nextLedgerItems = [...ledgerItems];
  const logs = [];

  const newUsedCars = newSoldVehicles.filter(vehicle => vehicle.type === 'usedCar').map(vehicle => ({
    id: `uc_${Date.now()}_${random().toString(36).slice(2, 6)}`,
    brand: vehicle.brand,
    purchasePrice: vehicle.purchasePrice,
    retailPrice: vehicle.retailPrice,
    customRetailPrice: vehicle.retailPrice,
    stockDays: 0,
    status: 'stock',
    prepped: false,
  }));

  const agedUsedCars = [
    ...usedCars.map(car => {
      const newDays = car.stockDays + 1;
      let newRetailPrice = car.customRetailPrice || car.retailPrice;
      if (newDays > 30) {
        const depPeriods = Math.floor(newDays / 30) - Math.floor(car.stockDays / 30);
        if (depPeriods > 0) {
          for (let i = 0; i < depPeriods; i++) newRetailPrice = Math.round(newRetailPrice * 0.95);
        }
      }
      return { ...car, stockDays: newDays, customRetailPrice: newRetailPrice };
    }),
    ...newUsedCars,
  ];

  let forcedWholesaleRevenue = 0;
  let forcedWholesaleCost = 0;
  let forcedWholesaleCount = 0;
  const finalUsedCars = agedUsedCars.map(car => {
    if (car.status === 'stock' && car.stockDays >= 90) {
      const wholesalePrice = Math.round(car.purchasePrice * 0.85);
      forcedWholesaleRevenue += wholesalePrice;
      forcedWholesaleCost += car.purchasePrice + (car.prepCost || 0);
      forcedWholesaleCount++;
      nextFinance.cash += wholesalePrice;
      logs.push({ day: absoluteDay, type: 'warning', message: `⚠️【强制批售】${car.brand} 库龄${car.stockDays}天超标，强制批售 ¥${wholesalePrice.toLocaleString()}（收车价¥${car.purchasePrice.toLocaleString()}，亏损¥${(car.purchasePrice - wholesalePrice).toLocaleString()}）` });
      return { ...car, status: 'forcedWholesale', forcedPrice: wholesalePrice };
    }
    return car;
  });

  if (forcedWholesaleRevenue > 0) {
    nextMonthlyStats.usedCarRevenue = (nextMonthlyStats.usedCarRevenue || 0) + forcedWholesaleRevenue;
    nextMonthlyStats.usedCarCost = (nextMonthlyStats.usedCarCost || 0) + forcedWholesaleCost;
    nextLedgerItems.push({ label: '二手车强制批售收入', amount: forcedWholesaleRevenue, type: 'income' });
    nextLedgerItems.push({ label: '二手车强制批售成本', amount: -forcedWholesaleCost, type: 'expense' });
    logs.push({ day: absoluteDay, type: 'info', message: `♻️【库龄清仓】${forcedWholesaleCount}台二手车因库龄超标强制批售，回收 ¥${forcedWholesaleRevenue.toLocaleString()}。` });
  }

  return {
    usedCars: finalUsedCars,
    finance: nextFinance,
    monthlyStats: nextMonthlyStats,
    ledgerItems: nextLedgerItems,
    logs,
  };
};
