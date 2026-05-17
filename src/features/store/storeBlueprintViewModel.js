const DEFAULT_FACILITY = {
  level: 1,
  showroomSpots: 5,
  warehouseCapacity: 25,
};

const DEFAULT_FINANCE = {
  cash: 0,
  loan: 0,
  creditLimit: 0,
};

const DEFAULT_MONTHLY_STATS = {
  target: 15,
  sales: 0,
  leads: 0,
  walkIns: 0,
  dccWalkIns: 0,
  afterSalesRevenue: 0,
  afterSalesCost: 0,
  afterSalesReturnVisits: 0,
  tradeInCount: 0,
  csiScore: 90,
};

const ROLE_META = {
  dcc: { label: 'DCC专员', zoneId: 'dccOffice', stationLabel: '电话邀约工位' },
  sales: { label: '销售顾问', zoneId: 'lounge', stationLabel: '洽谈桌' },
  service: { label: '售后接待', zoneId: 'serviceDrive', stationLabel: '售后接待台' },
  tech: { label: '售后技师', zoneId: 'workshop', stationLabel: '维修工位' },
  streamer: { label: '展厅主播', zoneId: 'streamerBooth', stationLabel: '直播工位' },
};

const FLOOR_META = [
  { id: 'floor1', label: '1F 客户与后场', subtitle: '展厅 / 交付 / 库房 / 售后' },
  { id: 'floor2', label: '2F 管理办公', subtitle: '总经理 / 投资人 / DCC / 金融保险' },
];

const BLUEPRINT_AREAS = {
  showroom: { x: 4, y: 8, w: 44, h: 34 },
  lounge: { x: 48, y: 8, w: 24, h: 28 },
  streamerBooth: { x: 72, y: 8, w: 10, h: 28 },
  financeDelivery: { x: 66, y: 16, w: 26, h: 38 },
  office: { x: 8, y: 16, w: 30, h: 38 },
  dccOffice: { x: 38, y: 16, w: 28, h: 38 },
  usedCarLot: { x: 4, y: 42, w: 30, h: 25 },
  warehouse: { x: 34, y: 42, w: 34, h: 25 },
  serviceDrive: { x: 68, y: 48, w: 28, h: 17 },
  workshop: { x: 68, y: 65, w: 22, h: 21 },
  parts: { x: 90, y: 65, w: 6, h: 21 },
};

const ZONE_FLOORS = {
  showroom: 'floor1',
  lounge: 'floor1',
  streamerBooth: 'floor1',
  financeDelivery: 'floor2',
  dccOffice: 'floor2',
  usedCarLot: 'floor1',
  warehouse: 'floor1',
  serviceDrive: 'floor1',
  workshop: 'floor1',
  parts: 'floor1',
  office: 'floor2',
};

const ZONE_LABELS = {
  showroom: '新车展厅',
  lounge: '客户洽谈区',
  streamerBooth: '展厅主播工位',
  financeDelivery: '金融保险中心',
  office: '总经理/投资人办公室',
  dccOffice: 'DCC 外呼区',
  usedCarLot: '二手车区',
  warehouse: '新车库房',
  serviceDrive: '售后接待',
  workshop: '售后车间',
  parts: '配件库',
};

const ZONE_CLICK_TARGETS = {
  showroom: 'showroom',
  lounge: 'customer',
  streamerBooth: 'marketing',
  financeDelivery: 'derivConfig',
  office: 'finance',
  dccOffice: 'staff',
  usedCarLot: 'usedcar',
  warehouse: 'order',
  serviceDrive: 'aftersales',
  workshop: 'aftersales',
  parts: 'aftersales',
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const asArray = (value) => (Array.isArray(value) ? value : []);

const asObject = (value) => (value && typeof value === 'object' ? value : {});

const asNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const ratio = (value, total) => {
  const safeTotal = Math.max(1, asNumber(total, 0));
  return clamp(Math.round((asNumber(value, 0) / safeTotal) * 100));
};

const toneFromScore = (score) => {
  if (score >= 80) return 'good';
  if (score >= 58) return 'warn';
  return 'danger';
};

const roundCoord = (value) => Math.round(value * 100) / 100;

const getZoneRect = (zoneId) => {
  const area = BLUEPRINT_AREAS[zoneId] || { x: 0, y: 0, w: 10, h: 10 };
  return { ...area };
};

const getZoneFloor = (zoneId) => ZONE_FLOORS[zoneId] || 'floor1';

const getZoneCenter = (zoneId) => {
  const rect = getZoneRect(zoneId);
  return {
    x: roundCoord(rect.x + rect.w / 2),
    y: roundCoord(rect.y + rect.h / 2),
  };
};

const getZonePort = (zoneId, targetZoneId) => {
  const rect = getZoneRect(zoneId);
  const center = getZoneCenter(zoneId);
  const target = getZoneCenter(targetZoneId);
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: roundCoord(dx >= 0 ? rect.x + rect.w : rect.x),
      y: roundCoord(clamp(target.y, rect.y + 3, rect.y + rect.h - 3)),
    };
  }

  return {
    x: roundCoord(clamp(target.x, rect.x + 3, rect.x + rect.w - 3)),
    y: roundCoord(dy >= 0 ? rect.y + rect.h : rect.y),
  };
};

const makeGridRects = ({
  zoneId,
  count,
  columns,
  padding = 2,
  topPadding,
  slotW,
  slotH,
}) => {
  const rect = getZoneRect(zoneId);
  const safeCount = Math.max(0, count);
  if (safeCount === 0) return [];

  const safeColumns = Math.max(1, Math.min(safeCount, columns || Math.ceil(Math.sqrt(safeCount))));
  const rows = Math.max(1, Math.ceil(safeCount / safeColumns));
  const gap = 1;
  const innerW = Math.max(1, rect.w - padding * 2);
  const safeTopPadding = topPadding ?? padding;
  const innerH = Math.max(1, rect.h - safeTopPadding - padding);
  const cellW = Math.max(0.5, (innerW - gap * (safeColumns - 1)) / safeColumns);
  const cellH = Math.max(0.5, (innerH - gap * (rows - 1)) / rows);
  const safeSlotW = Math.min(slotW || cellW, cellW);
  const safeSlotH = Math.min(slotH || cellH, cellH);

  return Array.from({ length: safeCount }, (_, index) => {
    const col = index % safeColumns;
    const row = Math.floor(index / safeColumns);
    const cellX = rect.x + padding + col * (cellW + gap);
    const cellY = rect.y + safeTopPadding + row * (cellH + gap);
    return {
      x: roundCoord(cellX + (cellW - safeSlotW) / 2),
      y: roundCoord(cellY + (cellH - safeSlotH) / 2),
      w: roundCoord(safeSlotW),
      h: roundCoord(safeSlotH),
    };
  });
};

const makeStationPoints = ({
  zoneId,
  count,
  columns,
  padding = 2,
  topPadding,
}) => {
  const rects = makeGridRects({
    zoneId,
    count,
    columns,
    padding,
    topPadding,
    slotW: 3,
    slotH: 3,
  });
  return rects.map(rect => ({
    x: roundCoord(rect.x + rect.w / 2),
    y: roundCoord(rect.y + rect.h / 2),
  }));
};

const getZoneBadgePoint = (zoneId, index = 0) => {
  const rect = getZoneRect(zoneId);
  const x = rect.w >= 14
    ? rect.x + rect.w - 3
    : rect.x + rect.w / 2;
  const y = rect.y + Math.min(rect.h - 2, 4 + index * 3);
  return {
    x: roundCoord(x),
    y: roundCoord(Math.max(rect.y + 2, y)),
  };
};

const getOrderQuantity = (order) => Math.max(0, asNumber(order?.quantity ?? order?.count ?? order?.total, 0));

const getStockDays = (car) => Math.max(0, asNumber(car?.stockDays ?? car?.daysInStock, 0));

const getModelById = (carModels) => new Map(asArray(carModels).map(model => [model.id, model]));

const getCarModelLabel = (car, modelById) => {
  const model = modelById.get(car?.modelId);
  return model?.name || [model?.series, model?.trim].filter(Boolean).join(' ') || car?.modelName || car?.series || car?.modelId || '未标注车型';
};

const getCarIdentity = (car, index, prefix) => car?.id || `${prefix}_${index + 1}`;

const getStaffMembers = ({ staff, afterSales, role }) => {
  if (role === 'tech') {
    if (Array.isArray(afterSales?.technicians)) return afterSales.technicians;
    if (Array.isArray(staff?.tech?.members)) return staff.tech.members;
    if (Array.isArray(staff?.technicians)) return staff.technicians;
    return [];
  }
  if (Array.isArray(staff?.[role]?.members)) return staff[role].members;
  if (Array.isArray(staff?.[role])) return staff[role];
  return [];
};

const getEmployeeId = (employee, role, index) => employee?.id || `${role}_${index + 1}`;

const getEmployeeName = (employee, role, index) => employee?.nickname || employee?.name || `${ROLE_META[role]?.label || '员工'}${index + 1}`;

const getEmployeeTone = (employee) => {
  const stress = asNumber(employee?.stress, 0);
  const loyalty = asNumber(employee?.loyalty, 70);
  if (stress >= 85 || loyalty <= 30) return 'danger';
  if (stress >= 62 || loyalty <= 48) return 'warn';
  return 'good';
};

const buildEmployee = (employee, role, index) => {
  if (!employee) return null;
  return {
    id: getEmployeeId(employee, role, index),
    name: getEmployeeName(employee, role, index),
    role,
    roleLabel: ROLE_META[role]?.label || '员工',
    skill: clamp(asNumber(employee.skill, 0)),
    stress: clamp(asNumber(employee.stress, 0)),
    loyalty: clamp(asNumber(employee.loyalty, 70)),
    retained: Boolean(employee.retained),
    traitId: employee.traitId || null,
    avatarId: Number.isFinite(employee.avatarId) ? employee.avatarId : null,
  };
};

const getRecentStoryMoments = ({ employee, staffStoryMemory, limit = 3 }) => {
  if (!employee?.id) return [];
  const timeline = asArray(staffStoryMemory?.[employee.id]?.timeline);
  return timeline
    .slice(-limit)
    .reverse()
    .map(moment => ({
      id: moment.id || `${employee.id}_story_${moment.day || 'unknown'}`,
      type: moment.type || 'staff_story',
      label: moment.label || moment.storyType || '员工故事',
      title: moment.title || moment.summary || '员工故事',
      day: asNumber(moment.day, null),
      month: asNumber(moment.month, null),
      severity: moment.severity || 'normal',
      memoryWeight: asNumber(moment.memoryWeight, 1),
    }));
};

const average = (items, selector, fallback = 0) => {
  if (items.length === 0) return fallback;
  return Math.round(items.reduce((sum, item) => sum + asNumber(selector(item), fallback), 0) / items.length);
};

const getStaffCapacity = ({ role, members, facility, afterSales, showroomSpots }) => {
  const configured = {
    dcc: facility.dccSeats,
    sales: facility.salesDesks,
    service: facility.serviceCounters,
    tech: afterSales.bayCount ?? afterSales.bays ?? facility.serviceBays,
    streamer: facility.streamerBooths,
  }[role];
  const fallback = {
    dcc: 2,
    sales: Math.max(3, Math.ceil(showroomSpots / 2)),
    service: 2,
    tech: 2,
    streamer: 1,
  }[role];
  return Math.max(1, members.length, asNumber(configured, fallback));
};

const buildVehicleCar = ({ car, index, kind, modelById }) => {
  if (!car) return null;
  return {
    id: getCarIdentity(car, index, kind),
    modelId: car.modelId || null,
    label: getCarModelLabel(car, modelById),
    color: car.color || null,
    stockDays: getStockDays(car),
    price: Number.isFinite(car.price) ? car.price : null,
    status: car.status || null,
    prepped: Boolean(car.prepped),
  };
};

const getVehicleSlotTone = ({ car, emptyTone = 'empty' }) => {
  if (!car) return emptyTone;
  const stockDays = getStockDays(car);
  if (stockDays >= 90) return 'danger';
  if (stockDays >= 60 || car.prepped === false) return 'warn';
  return 'good';
};

const buildVehicleSlots = ({ zoneId, kind, capacity, cars, modelById, emptyLabel, columns, padding, topPadding, slotW, slotH, maxVisible }) => {
  const safeCapacity = Math.max(0, capacity);
  const visibleCount = Math.min(safeCapacity, maxVisible || safeCapacity);
  const slotRects = makeGridRects({ zoneId, count: visibleCount, columns, padding, topPadding, slotW, slotH });
  return Array.from({ length: visibleCount }, (_, index) => {
    const car = cars[index] || null;
    const carView = buildVehicleCar({ car, index, kind, modelById });
    const label = carView?.label || emptyLabel;
    return {
    id: `${zoneId}_${kind}_${index + 1}`,
    zoneId,
    floor: getZoneFloor(zoneId),
    kind,
      label,
      occupied: Boolean(car),
      tone: getVehicleSlotTone({ car }),
      rect: slotRects[index],
      car: carView,
      tooltip: carView
        ? `${label} · 库龄${carView.stockDays}天`
        : `${ZONE_LABELS[zoneId] || '区域'}空位`,
    };
  });
};

const buildWorkstationsForRole = ({
  role,
  members,
  capacity,
  staffStoryMemory,
  metricsForRole,
}) => {
  const meta = ROLE_META[role] || {};
  const stationPoints = makeStationPoints({
    zoneId: meta.zoneId || 'office',
    count: capacity,
    columns: role === 'sales' ? 2 : role === 'tech' ? 2 : 1,
    padding: role === 'streamer' ? 3 : 2,
    topPadding: role === 'tech' ? 7 : role === 'sales' ? 8 : role === 'service' ? 7 : role === 'dcc' ? 7 : 6,
  });
  return Array.from({ length: capacity }, (_, index) => {
  const rawEmployee = members[index] || null;
  const employee = buildEmployee(rawEmployee, role, index);
  const occupied = Boolean(employee);
  return {
    id: `${role}_workstation_${index + 1}`,
    zoneId: meta.zoneId || 'office',
    floor: getZoneFloor(meta.zoneId || 'office'),
    role,
    label: `${meta.stationLabel || '工位'} ${index + 1}`,
    x: stationPoints[index]?.x ?? getZoneCenter(meta.zoneId || 'office').x,
    y: stationPoints[index]?.y ?? getZoneCenter(meta.zoneId || 'office').y,
    occupied,
    employee,
    tone: occupied ? getEmployeeTone(rawEmployee) : 'empty',
    storyMoments: getRecentStoryMoments({ employee, staffStoryMemory }),
    metrics: metricsForRole(role, rawEmployee, index),
    clickTarget: role === 'tech' ? 'aftersales' : 'staff',
  };
});
};

const makeRiskBadge = ({ id, zoneId, label, tone, detail }) => ({
  id,
  zoneId,
  label,
  tone,
  detail,
});

const withRiskBadgePoints = (badges) => {
  const zoneCounts = {};
  return badges.map(badge => {
    const index = zoneCounts[badge.zoneId] || 0;
    zoneCounts[badge.zoneId] = index + 1;
    return {
      ...badge,
      ...getZoneBadgePoint(badge.zoneId, index),
    };
  });
};

const collectRisks = ({
  showroomOccupancy,
  warehouseOccupancy,
  totalStockPressure,
  maxStockDays,
  usedPendingPrep,
  usedOccupancy,
  serviceLoad,
  csiScore,
  complaintCount,
  loanUtilization,
  cashPressure,
  investorScore,
  manufacturerPressure,
  draftPressure,
  competitorPressure,
  emptyCoreStations,
}) => [
  showroomOccupancy < 35 ? makeRiskBadge({
    id: 'risk_showroom_sparse',
    zoneId: 'showroom',
    label: '展厅偏空',
    tone: 'warn',
    detail: `展位占用仅 ${showroomOccupancy}%，自然客流转化会受影响。`,
  }) : null,
  maxStockDays >= 90 ? makeRiskBadge({
    id: 'risk_aged_stock_red',
    zoneId: 'showroom',
    label: '长库龄红区',
    tone: 'danger',
    detail: `最长库龄 ${maxStockDays} 天，需要尽快促销或申请补贴。`,
  }) : null,
  maxStockDays >= 60 && maxStockDays < 90 ? makeRiskBadge({
    id: 'risk_aged_stock_warn',
    zoneId: 'showroom',
    label: '库龄偏长',
    tone: 'warn',
    detail: `最长库龄 ${maxStockDays} 天，展厅陈列需要关注。`,
  }) : null,
  warehouseOccupancy >= 92 ? makeRiskBadge({
    id: 'risk_warehouse_full',
    zoneId: 'warehouse',
    label: '库房高水位',
    tone: 'danger',
    detail: `库房占用 ${warehouseOccupancy}%，在途车到店可能挤压库位。`,
  }) : null,
  totalStockPressure >= 88 ? makeRiskBadge({
    id: 'risk_inbound_pressure',
    zoneId: 'warehouse',
    label: '含在途承压',
    tone: totalStockPressure >= 100 ? 'danger' : 'warn',
    detail: `库存加在途压力 ${totalStockPressure}%，订货节奏需要收紧。`,
  }) : null,
  usedPendingPrep > 0 ? makeRiskBadge({
    id: 'risk_usedcar_prep',
    zoneId: 'usedCarLot',
    label: '二手车待整备',
    tone: usedPendingPrep >= 3 ? 'danger' : 'warn',
    detail: `${usedPendingPrep} 台二手车未完成整备，零售效率受限。`,
  }) : null,
  usedOccupancy >= 90 ? makeRiskBadge({
    id: 'risk_usedcar_capacity',
    zoneId: 'usedCarLot',
    label: '二手车位紧张',
    tone: 'warn',
    detail: `二手车区占用 ${usedOccupancy}%，置换承接空间不足。`,
  }) : null,
  serviceLoad >= 95 ? makeRiskBadge({
    id: 'risk_service_overload',
    zoneId: 'workshop',
    label: '售后超负荷',
    tone: 'danger',
    detail: `售后负荷 ${serviceLoad}%，技师和工位可能成为瓶颈。`,
  }) : null,
  csiScore < 85 ? makeRiskBadge({
    id: 'risk_csi_low',
    zoneId: 'serviceDrive',
    label: 'CSI偏低',
    tone: csiScore < 78 ? 'danger' : 'warn',
    detail: `CSI ${Math.round(csiScore)} 分，影响口碑、返利和回厂。`,
  }) : null,
  complaintCount > 0 ? makeRiskBadge({
    id: 'risk_complaints',
    zoneId: 'serviceDrive',
    label: '客诉待处理',
    tone: complaintCount >= 3 ? 'danger' : 'warn',
    detail: `${complaintCount} 起投诉需要前台闭环。`,
  }) : null,
  loanUtilization >= 85 ? makeRiskBadge({
    id: 'risk_bank_credit',
    zoneId: 'office',
    label: '授信高占用',
    tone: 'danger',
    detail: `银行授信使用 ${loanUtilization}%，抽贷和利息压力升高。`,
  }) : null,
  cashPressure >= 84 ? makeRiskBadge({
    id: 'risk_cash',
    zoneId: 'office',
    label: '现金紧张',
    tone: cashPressure >= 100 ? 'danger' : 'warn',
    detail: '现金余额不足，日常经营和到期汇票需要盯紧。',
  }) : null,
  investorScore < 60 ? makeRiskBadge({
    id: 'risk_investor',
    zoneId: 'office',
    label: '投资人信任低',
    tone: 'danger',
    detail: `投资人信任 ${Math.round(investorScore)} 分，月底授权可能收紧。`,
  }) : null,
  manufacturerPressure >= 74 ? makeRiskBadge({
    id: 'risk_manufacturer',
    zoneId: 'financeDelivery',
    label: '厂家目标压力',
    tone: manufacturerPressure >= 90 ? 'danger' : 'warn',
    detail: `厂家目标压力 ${manufacturerPressure}%，交付和金融区会承压。`,
  }) : null,
  draftPressure >= 85 ? makeRiskBadge({
    id: 'risk_drafts',
    zoneId: 'financeDelivery',
    label: '汇票占用高',
    tone: 'danger',
    detail: `汇票授信占用 ${draftPressure}%，交付资金链需要预案。`,
  }) : null,
  competitorPressure >= 70 ? makeRiskBadge({
    id: 'risk_competitor',
    zoneId: 'lounge',
    label: '竞品动作强',
    tone: 'warn',
    detail: '同城竞品施压，洽谈桌上的价格和人才稳定性都要关注。',
  }) : null,
  emptyCoreStations > 0 ? makeRiskBadge({
    id: 'risk_empty_workstations',
    zoneId: 'office',
    label: '关键工位空缺',
    tone: 'warn',
    detail: `${emptyCoreStations} 个关键工位无人值守。`,
  }) : null,
].filter(Boolean);

const buildZone = ({ id, subtitle, type, score, metrics, riskBadges }) => ({
  id,
  floor: getZoneFloor(id),
  label: ZONE_LABELS[id],
  subtitle,
  type,
  blueprintArea: getZoneRect(id),
  rect: getZoneRect(id),
  tone: toneFromScore(score),
  score: Math.round(clamp(score)),
  clickTarget: ZONE_CLICK_TARGETS[id],
  metrics,
  badges: riskBadges.filter(badge => badge.zoneId === id).map(badge => ({
    id: badge.id,
    label: badge.label,
    tone: badge.tone,
  })),
});

const getCompetitorPressure = (competitors) => {
  const items = Array.isArray(competitors)
    ? competitors
    : Object.values(asObject(competitors));
  return items.reduce((max, item) => Math.max(max, asNumber(item?.pressure ?? item?.pricePressure ?? item?.aggression, 0)), 0);
};

const getActiveStoryCount = (storyState) => {
  const explicitEvents = asArray(storyState.activeEvents).length;
  const activeChains = Object.values(asObject(storyState.chains))
    .filter(chain => ['active', 'critical'].includes(chain?.status)).length;
  return explicitEvents + activeChains;
};

const makeFlowLine = ({ id, from, to, label, tone, points }) => {
  if (Array.isArray(points) && points.length >= 2) {
    return {
      id,
      floor: getZoneFloor(from),
      from,
      to,
      label,
      tone,
      points: points.map(point => ({
        x: roundCoord(point.x),
        y: roundCoord(point.y),
      })),
    };
  }

  const start = getZonePort(from, to);
  const end = getZonePort(to, from);
  const routedPoints = Math.abs(start.x - end.x) < 1 || Math.abs(start.y - end.y) < 1
    ? [start, end]
    : [start, { x: roundCoord(end.x), y: roundCoord(start.y) }, end];

  return {
    id,
    floor: getZoneFloor(from),
    from,
    to,
    label,
    tone,
    points: routedPoints,
  };
};

const makeFlowLines = ({ showroomTone, serviceTone, financeTone, warehouseTone, usedTone }) => [
  makeFlowLine({ id: 'flow_lead_to_showroom', from: 'showroom', to: 'showroom', label: '客流入口', tone: showroomTone, points: [{ x: 25, y: 5 }, { x: 25, y: 8 }] }),
  makeFlowLine({ id: 'flow_showroom_to_lounge', from: 'showroom', to: 'lounge', label: '看车洽谈', tone: showroomTone, points: [{ x: 48, y: 21 }, { x: 50, y: 21 }] }),
  makeFlowLine({ id: 'flow_dcc_to_finance', from: 'dccOffice', to: 'financeDelivery', label: '线索核保', tone: financeTone, points: [{ x: 66, y: 34 }, { x: 68, y: 34 }] }),
  makeFlowLine({ id: 'flow_office_to_dcc', from: 'office', to: 'dccOffice', label: '经营调度', tone: financeTone, points: [{ x: 38, y: 34 }, { x: 40, y: 34 }] }),
  makeFlowLine({ id: 'flow_warehouse_to_showroom', from: 'warehouse', to: 'showroom', label: '库房布展', tone: warehouseTone, points: [{ x: 42, y: 42 }, { x: 42, y: 40 }] }),
  makeFlowLine({ id: 'flow_trade_in', from: 'showroom', to: 'usedCarLot', label: '置换收车', tone: usedTone, points: [{ x: 23, y: 42 }, { x: 23, y: 44 }] }),
  makeFlowLine({ id: 'flow_service_drive', from: 'serviceDrive', to: 'workshop', label: '接待派工', tone: serviceTone, points: [{ x: 78, y: 65 }, { x: 78, y: 67 }] }),
  makeFlowLine({ id: 'flow_parts_supply', from: 'parts', to: 'workshop', label: '配件供应', tone: serviceTone, points: [{ x: 88, y: 76 }, { x: 86.5, y: 76 }] }),
];

export function buildStoreBlueprintViewModel({
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
} = {}) {
  const safeInventory = asArray(inventory);
  const safePendingOrders = asArray(pendingOrders);
  const safeUsedCars = asArray(usedCars);
  const safeFacility = { ...DEFAULT_FACILITY, ...asObject(facility) };
  const safeAfterSales = asObject(afterSales);
  const safeStaff = asObject(staff);
  const safeFinance = { ...DEFAULT_FINANCE, ...asObject(finance) };
  const safeDrafts = asObject(drafts);
  const safeInvestorRelations = asObject(investorRelations);
  const safeManufacturerPolicy = asObject(manufacturerPolicy);
  const safeMonthlyStats = { ...DEFAULT_MONTHLY_STATS, ...asObject(monthlyStats) };
  const safeCsi = asObject(csi);
  const safeMarketing = asObject(marketing);
  const safeStoryState = asObject(storyState);
  const safeStoryMemory = asObject(staffStoryMemory);
  const safeLogs = asArray(logs);
  const modelById = getModelById(carModels);

  const showroomSpots = Math.max(1, asNumber(safeFacility.showroomSpots, DEFAULT_FACILITY.showroomSpots));
  const warehouseCapacity = Math.max(1, asNumber(safeFacility.warehouseCapacity, DEFAULT_FACILITY.warehouseCapacity));
  const dayProgress = clamp(asNumber(dayOfMonth, 15), 1, 31);
  const showroomCars = safeInventory.filter(car => car?.location === 'showroom');
  const warehouseCars = safeInventory.filter(car => car?.location !== 'showroom');
  const stockDays = safeInventory.map(getStockDays);
  const maxStockDays = stockDays.length > 0 ? Math.max(...stockDays) : 0;
  const avgStockDays = stockDays.length > 0 ? average(safeInventory, getStockDays, 0) : 0;
  const inTransitCount = safePendingOrders.reduce((sum, order) => sum + getOrderQuantity(order), 0);
  const totalSlots = showroomSpots + warehouseCapacity;
  const totalStockPressure = ratio(safeInventory.length + inTransitCount, totalSlots);
  const showroomOccupancy = ratio(showroomCars.length, showroomSpots);
  const warehouseOccupancy = ratio(warehouseCars.length, warehouseCapacity);

  const stockUsedCars = safeUsedCars.filter(car => !car?.status || car.status === 'stock');
  const usedCapacity = Math.max(1, asNumber(usedCarShowroom?.capacity, usedCarShowroom?.built ? 6 : Math.max(4, stockUsedCars.length)));
  const preppedUsedCars = stockUsedCars.filter(car => car?.prepped);
  const usedPendingPrep = Math.max(0, stockUsedCars.length - preppedUsedCars.length);
  const usedOccupancy = ratio(stockUsedCars.length, usedCapacity);

  const dccMembers = getStaffMembers({ staff: safeStaff, afterSales: safeAfterSales, role: 'dcc' });
  const salesMembers = getStaffMembers({ staff: safeStaff, afterSales: safeAfterSales, role: 'sales' });
  const serviceMembers = getStaffMembers({ staff: safeStaff, afterSales: safeAfterSales, role: 'service' });
  const techMembers = getStaffMembers({ staff: safeStaff, afterSales: safeAfterSales, role: 'tech' });
  const streamerMembers = getStaffMembers({ staff: safeStaff, afterSales: safeAfterSales, role: 'streamer' });

  const techCapacityPerDay = Math.max(0, techMembers.length * 3);
  const monthlyCapacity = Math.max(1, techCapacityPerDay * dayProgress);
  const serviceVisits = asNumber(safeMonthlyStats.afterSalesReturnVisits, 0);
  const serviceLoad = ratio(serviceVisits, monthlyCapacity);
  const csiScore = asNumber(safeCsi.score ?? safeMonthlyStats.csiScore, DEFAULT_MONTHLY_STATS.csiScore);
  const complaintCount = asNumber(safeCsi.complaints ?? safeAfterSales.complaints, 0);
  const afterSalesProfit = asNumber(safeMonthlyStats.afterSalesRevenue, 0) - asNumber(safeMonthlyStats.afterSalesCost, 0);

  const cash = asNumber(safeFinance.cash, 0);
  const loan = asNumber(safeFinance.loan, 0);
  const creditLimit = asNumber(safeFinance.creditLimit, 0);
  const loanUtilization = creditLimit > 0 ? ratio(loan, creditLimit) : 0;
  const investorScore = asNumber(safeInvestorRelations.trust ?? safeInvestorRelations.lastScore ?? safeMonthlyStats.lastInvestorScore, 72);
  const target = Math.max(1, asNumber(safeMonthlyStats.target, DEFAULT_MONTHLY_STATS.target));
  const expectedSalesByDay = target * (dayProgress / 30);
  const salesPace = ratio(safeMonthlyStats.sales, expectedSalesByDay);
  const manufacturerPressure = clamp(100 - salesPace + (safeManufacturerPolicy.orderRestrictionUntil ? 18 : 0));
  const cashPressure = cash < 0 ? 100 : cash < 300000 ? 84 : cash < 800000 ? 58 : 28;
  const draftPressure = safeDrafts.creditLimit > 0 ? ratio(safeDrafts.creditUsed, safeDrafts.creditLimit) : ratio(safeDrafts.totalDraftAmount, creditLimit || 1);
  const competitorPressure = getCompetitorPressure(competitors);

  const showroomScore = clamp(100 - Math.abs(75 - showroomOccupancy) - (safeInventory.length + inTransitCount < showroomSpots ? 18 : 0) - (maxStockDays >= 90 ? 18 : maxStockDays >= 60 ? 8 : 0));
  const warehouseScore = clamp(100 - Math.max(0, warehouseOccupancy - 82) * 1.4 - Math.max(0, totalStockPressure - 90) * 1.1 - (avgStockDays >= 60 ? 10 : 0));
  const usedCarScore = clamp(100 - Math.max(0, usedOccupancy - 85) * 1.2 - usedPendingPrep * 8);
  const serviceScore = clamp(100 - Math.max(0, serviceLoad - 82) * 1.2 - Math.max(0, 90 - csiScore) * 2 - complaintCount * 8);
  const officeScore = clamp(100 - loanUtilization * 0.28 - Math.max(0, 70 - investorScore) * 0.75 - manufacturerPressure * 0.2 - cashPressure * 0.25 - draftPressure * 0.12);

  const dccCapacity = getStaffCapacity({ role: 'dcc', members: dccMembers, facility: safeFacility, afterSales: safeAfterSales, showroomSpots });
  const salesCapacity = getStaffCapacity({ role: 'sales', members: salesMembers, facility: safeFacility, afterSales: safeAfterSales, showroomSpots });
  const serviceCapacity = getStaffCapacity({ role: 'service', members: serviceMembers, facility: safeFacility, afterSales: safeAfterSales, showroomSpots });
  const techCapacity = getStaffCapacity({ role: 'tech', members: techMembers, facility: safeFacility, afterSales: safeAfterSales, showroomSpots });
  const streamerCapacity = getStaffCapacity({ role: 'streamer', members: streamerMembers, facility: safeFacility, afterSales: safeAfterSales, showroomSpots });
  const emptyCoreStations = Math.max(0, dccCapacity - dccMembers.length)
    + Math.max(0, salesCapacity - salesMembers.length)
    + Math.max(0, serviceCapacity - serviceMembers.length)
    + Math.max(0, techCapacity - techMembers.length)
    + Math.max(0, streamerCapacity - streamerMembers.length);

  const riskBadges = withRiskBadgePoints(collectRisks({
    showroomOccupancy,
    warehouseOccupancy,
    totalStockPressure,
    maxStockDays,
    usedPendingPrep,
    usedOccupancy,
    serviceLoad,
    csiScore,
    complaintCount,
    loanUtilization,
    cashPressure,
    investorScore,
    manufacturerPressure,
    draftPressure,
    competitorPressure,
    emptyCoreStations,
  }));

  const metricsForRole = (role, rawEmployee) => ({
    skill: rawEmployee ? clamp(asNumber(rawEmployee.skill, 0)) : 0,
    stress: rawEmployee ? clamp(asNumber(rawEmployee.stress, 0)) : 0,
    loyalty: rawEmployee ? clamp(asNumber(rawEmployee.loyalty, 70)) : 0,
    roleLoad: {
      dcc: ratio(safeMonthlyStats.leads, Math.max(1, dccCapacity * 120)),
      sales: ratio(safeMonthlyStats.walkIns, Math.max(1, salesCapacity * 45)),
      service: ratio(complaintCount + serviceVisits, Math.max(1, serviceCapacity * dayProgress * 4)),
      tech: serviceLoad,
      streamer: ratio(safeMarketing.livestreamBudget, Math.max(1, safeMarketing.budget || 1)),
    }[role] || 0,
  });

  const workstations = [
    ...buildWorkstationsForRole({ role: 'dcc', members: dccMembers, capacity: dccCapacity, staffStoryMemory: safeStoryMemory, metricsForRole }),
    ...buildWorkstationsForRole({ role: 'sales', members: salesMembers, capacity: salesCapacity, staffStoryMemory: safeStoryMemory, metricsForRole }),
    ...buildWorkstationsForRole({ role: 'service', members: serviceMembers, capacity: serviceCapacity, staffStoryMemory: safeStoryMemory, metricsForRole }),
    ...buildWorkstationsForRole({ role: 'tech', members: techMembers, capacity: techCapacity, staffStoryMemory: safeStoryMemory, metricsForRole }),
    ...buildWorkstationsForRole({ role: 'streamer', members: streamerMembers, capacity: streamerCapacity, staffStoryMemory: safeStoryMemory, metricsForRole }),
  ];

  const vehicleSlots = [
    ...buildVehicleSlots({ zoneId: 'showroom', kind: 'showroom-display', capacity: showroomSpots, cars: showroomCars, modelById, emptyLabel: '空展位', columns: Math.min(4, showroomSpots), padding: 3, topPadding: 9, slotW: 9, slotH: 5 }),
    ...buildVehicleSlots({ zoneId: 'warehouse', kind: 'warehouse-stock', capacity: warehouseCapacity, cars: warehouseCars, modelById, emptyLabel: '空库位', columns: 4, padding: 3, topPadding: 8, slotW: 5.8, slotH: 3.4, maxVisible: 12 }),
    ...buildVehicleSlots({ zoneId: 'usedCarLot', kind: 'used-car-lot', capacity: usedCapacity, cars: stockUsedCars, modelById, emptyLabel: '空车位', columns: Math.min(3, usedCapacity), padding: 2, topPadding: 8, slotW: 7, slotH: 4 }),
  ];

  const serviceBayRects = makeGridRects({
    zoneId: 'workshop',
    count: techCapacity,
    columns: Math.min(2, techCapacity),
    padding: 2,
    topPadding: 7,
    slotW: 9,
    slotH: 5,
  });
  const serviceBays = Array.from({ length: techCapacity }, (_, index) => {
    const rawTechnician = techMembers[index] || null;
    const technician = buildEmployee(rawTechnician, 'tech', index);
    return {
      id: `service_bay_${index + 1}`,
      zoneId: 'workshop',
      floor: getZoneFloor('workshop'),
      label: `维修工位 ${index + 1}`,
      occupied: Boolean(technician),
      tone: technician ? getEmployeeTone(rawTechnician) : 'empty',
      rect: serviceBayRects[index],
      technician,
      tooltip: technician
        ? `${technician.name} · 技能${technician.skill} · 压力${technician.stress}`
        : '空维修工位',
    };
  });

  const zoneScores = {
    showroom: showroomScore,
    lounge: clamp(100 - Math.max(0, ratio(safeMonthlyStats.walkIns, Math.max(1, salesCapacity * 45)) - 85) - competitorPressure * 0.18),
    streamerBooth: streamerMembers.length > 0 ? clamp(76 - Math.max(0, asNumber(safeMarketing.livestreamBudget, 0) === 0 ? 10 : 0)) : 58,
    financeDelivery: clamp(100 - manufacturerPressure * 0.25 - draftPressure * 0.22 - Math.max(0, 70 - salesPace) * 0.18),
    office: officeScore,
    dccOffice: clamp(100 - Math.max(0, dccCapacity - dccMembers.length) * 14 - ratio(safeMonthlyStats.leads, Math.max(1, dccCapacity * 120)) * 0.18),
    usedCarLot: usedCarScore,
    warehouse: warehouseScore,
    serviceDrive: serviceScore,
    workshop: serviceScore,
    parts: clamp(100 - Math.max(0, serviceLoad - 88) * 0.8 - complaintCount * 4),
  };

  const zones = [
    buildZone({
      id: 'showroom',
      subtitle: `${showroomCars.length}/${showroomSpots} 个展位 · 最长库龄 ${maxStockDays} 天`,
      type: 'sales-floor',
      score: zoneScores.showroom,
      metrics: { occupiedSlots: showroomCars.length, capacity: showroomSpots, occupancy: showroomOccupancy, totalInventory: safeInventory.length, maxStockDays, avgStockDays },
      riskBadges,
    }),
    buildZone({
      id: 'lounge',
      subtitle: `${salesMembers.length}/${salesCapacity} 名销售 · 本月到店 ${asNumber(safeMonthlyStats.walkIns, 0)} 批`,
      type: 'customer-area',
      score: zoneScores.lounge,
      metrics: { salesStaff: salesMembers.length, desks: salesCapacity, walkIns: asNumber(safeMonthlyStats.walkIns, 0), competitorPressure },
      riskBadges,
    }),
    buildZone({
      id: 'streamerBooth',
      subtitle: `${streamerMembers.length}/${streamerCapacity} 名主播 · 直播预算 ${asNumber(safeMarketing.livestreamBudget, 0)}`,
      type: 'media-station',
      score: zoneScores.streamerBooth,
      metrics: { streamers: streamerMembers.length, booths: streamerCapacity, livestreamBudget: asNumber(safeMarketing.livestreamBudget, 0), leads: asNumber(safeMarketing.leads ?? safeMonthlyStats.leads, 0) },
      riskBadges,
    }),
    buildZone({
      id: 'financeDelivery',
      subtitle: `金融保险/衍生 · 厂家压力 ${manufacturerPressure}%`,
      type: 'finance',
      score: zoneScores.financeDelivery,
      metrics: { sales: asNumber(safeMonthlyStats.sales, 0), target, salesPace, manufacturerPressure, draftPressure },
      riskBadges,
    }),
    buildZone({
      id: 'office',
      subtitle: `现金 ${Math.round(cash).toLocaleString()} · 授信占用 ${loanUtilization}%`,
      type: 'management',
      score: zoneScores.office,
      metrics: { cash, loan, creditLimit, loanUtilization, investorScore, cashPressure, activeStoryCount: getActiveStoryCount(safeStoryState), logCount: safeLogs.length },
      riskBadges,
    }),
    buildZone({
      id: 'dccOffice',
      subtitle: `${dccMembers.length}/${dccCapacity} 名DCC · 本月线索 ${asNumber(safeMonthlyStats.leads, 0)}`,
      type: 'office',
      score: zoneScores.dccOffice,
      metrics: { dccStaff: dccMembers.length, seats: dccCapacity, leads: asNumber(safeMonthlyStats.leads, 0), dccWalkIns: asNumber(safeMonthlyStats.dccWalkIns, 0) },
      riskBadges,
    }),
    buildZone({
      id: 'usedCarLot',
      subtitle: `${stockUsedCars.length}/${usedCapacity} 个车位 · 待整备 ${usedPendingPrep} 台`,
      type: 'used-car',
      score: zoneScores.usedCarLot,
      metrics: { stock: stockUsedCars.length, capacity: usedCapacity, occupancy: usedOccupancy, prepped: preppedUsedCars.length, pendingPrep: usedPendingPrep, tradeInCount: asNumber(safeMonthlyStats.tradeInCount, 0) },
      riskBadges,
    }),
    buildZone({
      id: 'warehouse',
      subtitle: `${warehouseCars.length}/${warehouseCapacity} 个库位 · 在途 ${inTransitCount} 台`,
      type: 'inventory',
      score: zoneScores.warehouse,
      metrics: { stock: warehouseCars.length, capacity: warehouseCapacity, occupancy: warehouseOccupancy, inTransitCount, totalStockPressure },
      riskBadges,
    }),
    buildZone({
      id: 'serviceDrive',
      subtitle: `${serviceMembers.length}/${serviceCapacity} 名前台 · CSI ${Math.round(csiScore)} 分`,
      type: 'service-reception',
      score: zoneScores.serviceDrive,
      metrics: { serviceStaff: serviceMembers.length, counters: serviceCapacity, csiScore, complaintCount, serviceLoad },
      riskBadges,
    }),
    buildZone({
      id: 'workshop',
      subtitle: `${techMembers.length}/${techCapacity} 个维修工位 · 负荷 ${serviceLoad}%`,
      type: 'workshop',
      score: zoneScores.workshop,
      metrics: { technicians: techMembers.length, bays: techCapacity, serviceVisits, techCapacityPerDay, serviceLoad, afterSalesProfit },
      riskBadges,
    }),
    buildZone({
      id: 'parts',
      subtitle: `售后毛利 ${Math.round(afterSalesProfit).toLocaleString()} · 工位负荷 ${serviceLoad}%`,
      type: 'parts-storage',
      score: zoneScores.parts,
      metrics: { afterSalesRevenue: asNumber(safeMonthlyStats.afterSalesRevenue, 0), afterSalesCost: asNumber(safeMonthlyStats.afterSalesCost, 0), afterSalesProfit, serviceLoad },
      riskBadges,
    }),
  ];

  const healthScore = Math.round(zones.reduce((sum, zone) => sum + zone.score, 0) / Math.max(1, zones.length));
  const dangerCount = riskBadges.filter(badge => badge.tone === 'danger').length;
  const warnCount = riskBadges.filter(badge => badge.tone === 'warn').length;
  const riskLevel = dangerCount > 0 ? 'danger' : warnCount >= 3 ? 'warn' : 'good';
  const headline = riskLevel === 'danger'
    ? '门店图纸显示关键区域已进入红区'
    : riskLevel === 'warn'
      ? '门店图纸显示多区域承压'
      : '门店图纸显示经营节奏可控';

  return {
    summary: {
      healthScore,
      headline,
      riskLevel,
    },
    floors: FLOOR_META,
    zones,
    vehicleSlots,
    serviceBays,
    workstations,
    flowLines: makeFlowLines({
      showroomTone: toneFromScore(zoneScores.showroom),
      serviceTone: toneFromScore(serviceScore),
      financeTone: toneFromScore(zoneScores.financeDelivery),
      warehouseTone: toneFromScore(warehouseScore),
      usedTone: toneFromScore(usedCarScore),
    }),
    riskBadges,
  };
}
