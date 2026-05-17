import {
  prepareHireTechnician,
  prepareTrainTechnician,
  settleHireTechnician,
  settleTrainTechnician,
  toggleTechnicianRetention,
} from '../game/engine/afterSalesTechManagement.js';

export function useAfterSalesTechActions({
  addLog,
  afterSales,
  appendLedger,
  finance,
  setAfterSales,
  setFinance,
  showAlert,
  showConfirm,
}) {
  const handleHireTech = () => {
    const hirePlan = prepareHireTechnician({ finance, afterSales });
    if (hirePlan.alert) return showAlert(hirePlan.alert.title, hirePlan.alert.message);
    showConfirm(hirePlan.confirm.title, hirePlan.confirm.message, () => {
      const result = settleHireTechnician({ hirePlan, finance, afterSales });
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setAfterSales(result.afterSales);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleTrainTech = (techId) => {
    const trainPlan = prepareTrainTechnician({ techId, finance, afterSales });
    if (trainPlan.status === 'invalid') return;
    if (trainPlan.alert) return showAlert(trainPlan.alert.title, trainPlan.alert.message);
    showConfirm(trainPlan.confirm.title, trainPlan.confirm.message, () => {
      const result = settleTrainTechnician({ trainPlan, finance, afterSales });
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setAfterSales(result.afterSales);
      addLog(result.log.type, result.log.message);
    });
  };

  const toggleTechRetention = (techId) => {
    setAfterSales(prev => toggleTechnicianRetention({ techId, afterSales: prev }));
  };

  return {
    handleHireTech,
    handleTrainTech,
    toggleTechRetention,
  };
}
