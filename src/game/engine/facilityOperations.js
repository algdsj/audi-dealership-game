export const prepareFacilityUpgrade = ({
  facility,
  finance,
}) => {
  const cost = facility.level * 100000;
  if (facility.level >= 5) return { status: 'max_level', alert: { title: '提示', message: '展厅已是最高级别的旗舰店！' } };
  if (finance.cash < cost) return { status: 'insufficient_cash', alert: { title: '资金不足', message: '现金不足！' } };

  return {
    status: 'ready',
    cost,
    nextLevel: facility.level + 1,
    confirm: {
      title: '确认升级展厅',
      message: `确定花费 ¥${cost.toLocaleString()} 将展厅升级至 Lv.${facility.level + 1} 吗？\n这将提升客户转化率，但同时会增加每月的房租和折旧成本。`,
    },
  };
};

export const settleFacilityUpgrade = ({
  upgradePlan,
  facility,
  finance,
}) => {
  if (!upgradePlan || upgradePlan.status !== 'ready') return { status: 'invalid' };

  return {
    status: 'settled',
    finance: { ...finance, cash: finance.cash - upgradePlan.cost },
    facility: {
      ...facility,
      level: facility.level + 1,
      showroomSpots: facility.showroomSpots + 1,
      warehouseCapacity: facility.warehouseCapacity + 8,
    },
    ledgerItem: { label: `展厅升级至Lv.${facility.level + 1}`, amount: -upgradePlan.cost, type: 'expense' },
    log: { type: 'success', message: `展厅升级完毕，目前为 ${facility.level + 1} 级标准店。展厅展位 +1，仓储容量 +8。` },
  };
};
