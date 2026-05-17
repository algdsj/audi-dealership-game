export const buildTodoQueue = ({
  facility,
  inventory,
  pendingOrders,
  usedCars,
  usedCarShowroom,
  approvalCases,
  customerDeals,
  salesOpportunities,
  totalLeadPool,
  dccCount,
  salesCount,
  csi,
  currentDay,
}) => {
  const items = [];
  const totalSlots = facility.showroomSpots + facility.warehouseCapacity;
  const freeSlots = totalSlots - inventory.length - pendingOrders.reduce((sum, order) => sum + order.quantity, 0);
  const showroomUsed = inventory.filter(car => car.location === 'showroom').length;
  const warehouseCount = inventory.filter(car => car.location === 'warehouse').length;
  const oldStockCount = inventory.filter(car => !car.subsidized && (car.stockDays || 0) >= 30 && (car.stockDays || 0) < 120).length;
  const veryOldStockCount = inventory.filter(car => (car.stockDays || 0) >= 90).length;
  const unpreppedUsedCars = usedCars.filter(car => car.status === 'stock' && !car.prepped).length;
  const pendingApprovalItems = approvalCases.filter(item => item.status === 'pending');
  const pendingApprovals = pendingApprovalItems.length;
  const pendingCustomerDeals = customerDeals.filter(item => item.status === 'pending').length;
  const urgentSalesOpportunities = (salesOpportunities?.active || []).filter(item => (item.dueDay || currentDay) <= currentDay + 1).length;
  const pendingApprovalSummary = [
    pendingApprovalItems.filter(item => item.type === 'price').length > 0 ? `${pendingApprovalItems.filter(item => item.type === 'price').length}个价格审批` : null,
    pendingApprovalItems.filter(item => item.type === 'complaint').length > 0 ? `${pendingApprovalItems.filter(item => item.type === 'complaint').length}个客诉` : null,
    pendingApprovalItems.filter(item => item.type === 'negotiation').length > 0 ? `${pendingApprovalItems.filter(item => item.type === 'negotiation').length}个外部谈判` : null,
  ].filter(Boolean).join('、') || `${pendingApprovals} 个审批事项`;

  if (pendingCustomerDeals > 0) items.push({ level: 'high', title: '重点客户待谈判', detail: `${pendingCustomerDeals} 位客户正在等报价，过期会流失。`, tab: 'customer' });
  if (urgentSalesOpportunities > 0) items.push({ level: 'high', title: '销售机会待推进', detail: `${urgentSalesOpportunities} 个机会即将过期，建议先处理机会池。`, tab: 'opportunities' });
  if (pendingApprovals > 0) items.push({ level: 'high', title: '总经理审批待处理', detail: `${pendingApprovalSummary}需要拍板，进入首页审批中心处理。`, tab: 'dashboard' });
  if (inventory.length === 0 && pendingOrders.length === 0) items.push({ level: 'high', title: '展厅无现车', detail: '请尽快向厂家订货，否则自然客流和成交都会停摆。', tab: 'order' });
  if (freeSlots <= 2) items.push({ level: 'mid', title: '库存容量紧张', detail: `剩余库位仅 ${freeSlots} 个，继续订货前建议批售或升级设施。`, tab: 'showroom' });
  if (showroomUsed < facility.showroomSpots && warehouseCount > 0) items.push({ level: 'mid', title: '展厅还有空位', detail: `当前展位 ${showroomUsed}/${facility.showroomSpots}，可一键布展提升转化率。`, tab: 'showroom' });
  if (oldStockCount > 0) items.push({ level: veryOldStockCount > 0 ? 'high' : 'mid', title: '长库龄库存待处理', detail: `${oldStockCount} 台车可申请补贴或考虑二网批售。`, tab: 'showroom' });
  if (totalLeadPool > dccCount * 100) items.push({ level: 'mid', title: '线索池积压', detail: `待处理线索 ${totalLeadPool} 条，已超过DCC日处理能力。`, tab: 'staff' });
  if (salesCount === 0) items.push({ level: 'high', title: '销售团队为空', detail: '无销售顾问将无法接待到店客户。', tab: 'staff' });
  if (dccCount === 0) items.push({ level: 'high', title: 'DCC团队为空', detail: '无DCC专员会让投流线索无法邀约到店。', tab: 'staff' });
  if (csi.score < 90) items.push({ level: 'high', title: 'CSI低于考核线', detail: `当前${Math.round(csi.score)}分，会影响转化率和月底返利。`, tab: 'csi' });
  if (unpreppedUsedCars > 0 && usedCarShowroom.built) items.push({ level: 'mid', title: '二手车待整备', detail: `${unpreppedUsedCars} 台二手车未整备，零售效率受限。`, tab: 'usedcar' });
  if (pendingOrders.some(order => order.arriveDay <= currentDay + 1)) items.push({ level: 'low', title: '在途车辆即将到货', detail: '请确认库位充足，避免到货延迟。', tab: 'order' });

  return items.slice(0, 6);
};

export const buildDailyChecklist = ({
  approvalCases,
  customerDeals,
  salesOpportunities,
  inventory,
  pendingOrders,
  facility,
  finance,
  formatMoney,
}) => {
  const pendingOpportunityTasks = (salesOpportunities?.active || []).filter(item => (item.dueDay || 0) <= 9999).length;
  const pendingLimitTasks = approvalCases.filter(item => item.status === 'pending').length + customerDeals.filter(item => item.status === 'pending').length + pendingOpportunityTasks;
  const showroomUsed = inventory.filter(car => car.location === 'showroom').length;
  return [
    {
      title: '清空限时事项',
      done: pendingLimitTasks === 0,
      detail: pendingLimitTasks === 0 ? '价格、客诉、重点客户和销售机会都已处理。' : `${pendingLimitTasks}个事项会过期，先拍板。`,
      tab: (salesOpportunities?.active || []).length > 0 ? 'opportunities' : customerDeals.some(item => item.status === 'pending') ? 'customer' : approvalCases.some(item => item.status === 'pending') ? 'dashboard' : 'dashboard',
    },
    {
      title: '展厅保持可卖',
      done: inventory.length > 0 && (showroomUsed > 0 || pendingOrders.length > 0),
      detail: inventory.length > 0 ? `当前展车${showroomUsed}/${facility.showroomSpots}。` : '没有现车会让客流和谈判断档。',
      tab: inventory.length > 0 ? 'showroom' : 'order',
    },
    {
      title: '现金风险不过线',
      done: finance.loan <= finance.creditLimit * 0.85 && finance.cash > 0,
      detail: finance.loan > finance.creditLimit * 0.85 ? '负债接近库存融资授信红线，建议回款或还贷。' : `现金${formatMoney(finance.cash)}，库存融资授信仍有缓冲。`,
      tab: 'finance',
    },
  ];
};
