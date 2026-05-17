import { STAFF_ROLE_META } from '../game/config/staff.js';
import {
  prepareHireStaffMember,
  prepareToggleStaffRetention,
  prepareTrainStaffMember,
  settleHireStaffMember,
  settleToggleStaffRetention,
  settleTrainStaffMember,
} from '../game/engine/staffManagement.js';

export function useStaffActions({
  addLog,
  appendLedger,
  finance,
  formatMoney,
  setFinance,
  setStaff,
  showAlert,
  showConfirm,
  staff,
}) {
  const trainMember = (type, memberId) => {
    const trainPlan = prepareTrainStaffMember({ type, memberId, staff, finance, roleMeta: STAFF_ROLE_META });
    if (trainPlan.alert) return showAlert(trainPlan.alert.title, trainPlan.alert.message);
    showConfirm(trainPlan.confirm.title, trainPlan.confirm.message, () => {
      const result = settleTrainStaffMember({ trainPlan, staff, finance, formatMoney });
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setStaff(result.staff);
      addLog(result.log.type, result.log.message);
    });
  };

  const hireStaff = (type) => {
    const hirePlan = prepareHireStaffMember({ type, roleMeta: STAFF_ROLE_META });
    showConfirm(hirePlan.confirm.title, hirePlan.confirm.message, () => {
      const result = settleHireStaffMember({ hirePlan, staff });
      setStaff(result.staff);
      addLog(result.log.type, result.log.message);
    });
  };

  const toggleRetention = (type, memberId) => {
    const retentionPlan = prepareToggleStaffRetention({ type, memberId, staff, roleMeta: STAFF_ROLE_META });
    if (retentionPlan.status === 'invalid') return;
    const applyRetention = () => {
      const result = settleToggleStaffRetention({ retentionPlan, staff });
      setStaff(result.staff);
    };
    if (retentionPlan.confirm) return showConfirm(retentionPlan.confirm.title, retentionPlan.confirm.message, applyRetention);
    applyRetention();
  };

  return {
    hireStaff,
    toggleRetention,
    trainMember,
  };
}
