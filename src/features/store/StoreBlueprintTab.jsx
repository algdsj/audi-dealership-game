import { buildStoreBlueprintViewModel } from './storeBlueprintViewModel.js';
import { StoreBlueprintMap } from './StoreBlueprintMap.jsx';

const slotTargetByZone = {
  showroom: 'showroom',
  warehouse: 'showroom',
  usedCarLot: 'usedcar',
};

const getStaffPayload = (payload) => ({
  role: payload?.role || payload?.workstation?.role,
  employeeId: payload?.employeeId || payload?.employee?.id,
});

export function StoreBlueprintTab({
  inventory,
  pendingOrders,
  usedCars,
  usedCarShowroom,
  facility,
  afterSales,
  staff,
  finance,
  drafts,
  investorRelations,
  manufacturerPolicy,
  monthlyStats,
  csi,
  competitors,
  marketing,
  storyState,
  staffStoryMemory,
  logs,
  carModels,
  dayOfMonth,
  onSelectTab,
  onTrainMember,
  onTrainTech,
  onToggleRetention,
  onToggleTechRetention,
}) {
  const viewModel = buildStoreBlueprintViewModel({
    inventory,
    pendingOrders,
    usedCars,
    usedCarShowroom,
    facility,
    afterSales,
    staff,
    finance,
    drafts,
    investorRelations,
    manufacturerPolicy,
    monthlyStats,
    csi,
    competitors,
    marketing,
    storyState,
    staffStoryMemory,
    logs,
    carModels,
    dayOfMonth,
  });

  const openStaffTarget = (payload) => {
    if (payload?.clickTarget && payload.clickTarget !== 'staff') {
      onSelectTab?.(payload.clickTarget);
      return;
    }
    onSelectTab?.('staff');
  };

  const trainFromPayload = (payload) => {
    const { role, employeeId } = getStaffPayload(payload);
    if (!employeeId) return;
    if (role === 'tech') {
      onTrainTech?.(employeeId);
      return;
    }
    onTrainMember?.(role, employeeId);
  };

  const toggleRetentionFromPayload = (payload) => {
    const { role, employeeId } = getStaffPayload(payload);
    if (!employeeId) return;
    if (role === 'tech') {
      onToggleTechRetention?.(employeeId);
      return;
    }
    onToggleRetention?.(role, employeeId);
  };

  return (
    <StoreBlueprintMap
      viewModel={viewModel}
      onZoneClick={zone => zone?.clickTarget && onSelectTab?.(zone.clickTarget)}
      onSlotClick={slot => onSelectTab?.(slotTargetByZone[slot?.zoneId] || 'showroom')}
      onOpenStaff={openStaffTarget}
      onWorkstationClick={openStaffTarget}
      onTrainMember={trainFromPayload}
      onToggleRetention={toggleRetentionFromPayload}
    />
  );
}

