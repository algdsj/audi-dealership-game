import {
  prepareBuildUsedCarShowroom,
  prepareUpgradeUsedCarShowroom,
  prepareUsedCarPrep,
  prepareUsedCarRetail,
  prepareUsedCarWholesale,
  settleBuildUsedCarShowroom,
  settleUpgradeUsedCarShowroom,
  settleUsedCarPrep,
  settleUsedCarRetail,
  settleUsedCarWholesale,
  updateUsedCarRetailPrice,
} from '../game/engine/usedCarOperations.js';

export function useUsedCarActions({
  addLog,
  appendLedger,
  finance,
  monthlyStats,
  setFinance,
  setMonthlyStats,
  setUsedCars,
  setUsedCarShowroom,
  showAlert,
  showConfirm,
  usedCars,
  usedCarShowroom,
}) {
  const handleBuildShowroom = () => {
    const buildPlan = prepareBuildUsedCarShowroom({ usedCarShowroom });
    if (buildPlan.alert) return showAlert(buildPlan.alert.title, buildPlan.alert.message);
    showConfirm(buildPlan.confirm.title, buildPlan.confirm.message, () => {
      const result = settleBuildUsedCarShowroom({ buildPlan, finance });
      if (result.alert) return showAlert(result.alert.title, result.alert.message);
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setUsedCarShowroom(result.usedCarShowroom);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleUpgradeShowroom = () => {
    const upgradePlan = prepareUpgradeUsedCarShowroom({ usedCarShowroom });
    if (upgradePlan.alert) return showAlert(upgradePlan.alert.title, upgradePlan.alert.message);
    showConfirm(upgradePlan.confirm.title, upgradePlan.confirm.message, () => {
      const result = settleUpgradeUsedCarShowroom({ upgradePlan, finance, usedCarShowroom });
      if (result.alert) return showAlert(result.alert.title, result.alert.message);
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setUsedCarShowroom(result.usedCarShowroom);
      addLog(result.log.type, result.log.message);
    });
  };

  const handlePrepUsedCar = (ucId) => {
    const prepPlan = prepareUsedCarPrep({ ucId, usedCars });
    if (prepPlan.status === 'invalid') return;
    if (prepPlan.alert) return showAlert(prepPlan.alert.title, prepPlan.alert.message);
    showConfirm(prepPlan.confirm.title, prepPlan.confirm.message, () => {
      const result = settleUsedCarPrep({ prepPlan, usedCars, finance, monthlyStats });
      if (result.alert) return showAlert(result.alert.title, result.alert.message);
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setMonthlyStats(result.monthlyStats);
      setUsedCars(result.usedCars);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleUsedCarPriceChange = (ucId, newPrice) => {
    setUsedCars(prev => updateUsedCarRetailPrice({ ucId, newPrice, usedCars: prev }));
  };

  const handleUsedCarRetail = (ucId) => {
    const retailPlan = prepareUsedCarRetail({ ucId, usedCars, usedCarShowroom });
    if (retailPlan.status === 'invalid') return;
    if (retailPlan.alert) return showAlert(retailPlan.alert.title, retailPlan.alert.message);
    showConfirm(retailPlan.confirm.title, retailPlan.confirm.message, () => {
      const result = settleUsedCarRetail({ retailPlan, usedCars, finance, monthlyStats });
      if (result.usedCars) setUsedCars(result.usedCars);
      if (result.finance) setFinance(result.finance);
      if (result.monthlyStats) setMonthlyStats(result.monthlyStats);
      if (result.ledgerItems) appendLedger(result.ledgerItems);
      if (result.log) addLog(result.log.type, result.log.message);
    });
  };

  const handleUsedCarWholesale = (ucId) => {
    const wholesalePlan = prepareUsedCarWholesale({ ucId, usedCars });
    if (wholesalePlan.status === 'invalid') return;
    showConfirm(wholesalePlan.confirm.title, wholesalePlan.confirm.message, () => {
      const result = settleUsedCarWholesale({ wholesalePlan, usedCars, finance, monthlyStats });
      setUsedCars(result.usedCars);
      setFinance(result.finance);
      setMonthlyStats(result.monthlyStats);
      appendLedger(result.ledgerItems);
      addLog(result.log.type, result.log.message);
    });
  };

  return {
    handleBuildShowroom,
    handlePrepUsedCar,
    handleUpgradeShowroom,
    handleUsedCarPriceChange,
    handleUsedCarRetail,
    handleUsedCarWholesale,
  };
}
