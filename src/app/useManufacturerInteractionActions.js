import { resolveManufacturerResourceRequest } from '../game/engine/manufacturerNegotiation.js';

export function useManufacturerInteractionActions({
  activeDifficulty,
  addLog,
  appendLedger,
  carModels,
  csi,
  currentDay,
  dayOfMonth,
  finance,
  formatMoney,
  inventory,
  manufacturerPolicy,
  marketEnvironment,
  modelPriceOverrides,
  month,
  monthlyStats,
  setFinance,
  setManufacturerPolicy,
  setMonthlyStats,
  showAlert,
  virtualSales,
}) {
  const handleManufacturerResourceRequest = (requestId) => {
    const result = resolveManufacturerResourceRequest({
      requestId,
      manufacturerPolicy,
      finance,
      monthlyStats,
      inventory,
      csi,
      virtualSales,
      modelPriceOverrides,
      carModels,
      marketEnvironment,
      currentDay,
      month,
      dayOfMonth,
      activeDifficulty,
      formatMoney,
    });
    if (result.alert && result.status !== 'resolved') {
      showAlert(result.alert.title, result.alert.message);
      return;
    }
    setFinance(result.finance);
    setMonthlyStats(result.monthlyStats);
    setManufacturerPolicy(result.manufacturerPolicy);
    if (result.ledgerItem) appendLedger(result.ledgerItem);
    addLog(result.log.type, result.log.message);
    if (result.alert) showAlert(result.alert.title, result.alert.message);
  };

  return {
    handleManufacturerResourceRequest,
  };
}
