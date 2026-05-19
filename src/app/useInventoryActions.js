import {
  autoArrangeShowroom,
  applySeriesPriceStrategy,
  commitModelInventoryPrice,
  moveInventoryCar,
  prepareInventorySubsidy,
  settleInventorySubsidy,
  updateModelInventoryPriceInput,
} from '../game/engine/inventoryOperations.js';
import { prepareRetireTestDriveCar, prepareSetTestDriveCar } from '../game/engine/testDriveFleet.js';
import { prepareVehicleWholesale, settleVehicleWholesale } from '../game/engine/vehicleWholesale.js';

export function useInventoryActions({
  addLog,
  appendLedger,
  carModels,
  currentDay,
  facility,
  finance,
  formatMoney,
  getConfiguredModelPrice,
  getDynamicMsrp,
  inventory,
  marketPrices,
  monthlyStats,
  setDailyLedger,
  setFinance,
  setInventory,
  setModelPriceOverrides,
  setMonthlyStats,
  setTestDriveCars,
  showAlert,
  showConfirm,
  testDriveCars,
}) {
  const handleUpdatePrice = (modelId, newPrice) => {
    setInventory(inv => updateModelInventoryPriceInput({ modelId, newPrice, inventory: inv }));
  };

  const handlePriceBlur = (modelId) => {
    const result = commitModelInventoryPrice({ modelId, inventory, carModels, getDynamicMsrp });
    if (result.status === 'invalid') return;
    setModelPriceOverrides(prev => ({ ...prev, ...result.modelPriceOverrides }));
    setInventory(result.inventory);
  };

  const handleWholesale = (modelId) => {
    const wholesale = prepareVehicleWholesale({ modelId, inventory, carModels, marketPrices });
    if (wholesale.status === 'invalid') return;
    if (wholesale.alert) return showAlert(wholesale.alert.title, wholesale.alert.message);
    showConfirm(wholesale.confirm.title, wholesale.confirm.message, () => {
      const result = settleVehicleWholesale({ wholesale, inventory, finance, monthlyStats, currentDay, formatMoney });
      if (result.status !== 'settled') return;
      setInventory(result.inventory);
      setFinance(result.finance);
      setMonthlyStats(result.monthlyStats);
      setDailyLedger(prev => [...prev, result.ledgerEntry]);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleSetTestDrive = (modelId) => {
    const result = prepareSetTestDriveCar({ modelId, inventory, testDriveCars, carModels, currentDay });
    if (result.status === 'invalid') return;
    if (result.alert) return showAlert(result.alert.title, result.alert.message);
    showConfirm(result.confirm.title, result.confirm.message, () => {
      setInventory(result.inventory);
      setTestDriveCars(result.testDriveCars);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleRetireTestDrive = (modelId) => {
    const result = prepareRetireTestDriveCar({ modelId, inventory, testDriveCars, carModels, getConfiguredModelPrice });
    if (result.status === 'invalid') return;
    showConfirm(result.confirm.title, result.confirm.message, () => {
      setTestDriveCars(result.testDriveCars);
      setInventory(result.inventory);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleApplySubsidy = (modelId) => {
    const subsidyPlan = prepareInventorySubsidy({ modelId, inventory, carModels, monthlyStats, currentDay });
    if (subsidyPlan.status === 'invalid') return;
    if (subsidyPlan.alert) return showAlert(subsidyPlan.alert.title, subsidyPlan.alert.message);
    showConfirm(subsidyPlan.confirm.title, subsidyPlan.confirm.message, () => {
      const result = settleInventorySubsidy({ subsidyPlan, inventory, monthlyStats });
      setInventory(result.inventory);
      setMonthlyStats(result.monthlyStats);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleMoveCar = (modelId, targetLocation) => {
    const result = moveInventoryCar({ modelId, targetLocation, inventory, facility, carModels });
    if (result.status === 'invalid') return;
    if (result.alert) return showAlert(result.alert.title, result.alert.message);
    setInventory(result.inventory);
    addLog(result.log.type, result.log.message);
  };

  const handleAutoShowroom = () => {
    const result = autoArrangeShowroom({ inventory, facility, carModels });
    if (result.alert) return showAlert(result.alert.title, result.alert.message);
    setInventory(result.inventory);
    addLog(result.log.type, result.log.message);
  };

  const handleApplySeriesPriceStrategy = (series) => {
    const result = applySeriesPriceStrategy({ series, inventory, carModels, marketPrices, getDynamicMsrp });
    if (result.status === 'invalid') return;
    setInventory(result.inventory);
    setModelPriceOverrides(prev => ({ ...prev, ...result.modelPriceOverrides }));
    addLog(result.log.type, result.log.message);
  };

  return {
    handleApplySubsidy,
    handleApplySeriesPriceStrategy,
    handleAutoShowroom,
    handleMoveCar,
    handlePriceBlur,
    handleRetireTestDrive,
    handleSetTestDrive,
    handleUpdatePrice,
    handleWholesale,
  };
}
