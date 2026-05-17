import { prepareFacilityUpgrade, settleFacilityUpgrade } from '../game/engine/facilityOperations.js';

export function useFacilityActions({
  addLog,
  appendLedger,
  facility,
  finance,
  setFacility,
  setFinance,
  showAlert,
  showConfirm,
}) {
  const upgradeFacility = () => {
    const upgradePlan = prepareFacilityUpgrade({ facility, finance });
    if (upgradePlan.alert) return showAlert(upgradePlan.alert.title, upgradePlan.alert.message);
    showConfirm(upgradePlan.confirm.title, upgradePlan.confirm.message, () => {
      const result = settleFacilityUpgrade({ upgradePlan, facility, finance });
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setFacility(result.facility);
      addLog(result.log.type, result.log.message);
    });
  };

  return {
    upgradeFacility,
  };
}
