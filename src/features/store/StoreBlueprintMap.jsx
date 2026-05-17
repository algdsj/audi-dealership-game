import { useState } from 'react';
import { STAFF_ROLE_META } from '../../game/config/staff.js';
import { StaffAvatar } from '../../shared/ui/StaffAvatar.jsx';
import { StaffStoryBadge } from '../../shared/ui/StaffStoryBadge.jsx';
import { StoreBlueprintLegend } from './StoreBlueprintLegend.jsx';
import { StoreBlueprintZone } from './StoreBlueprintZone.jsx';
import { StoreWorkstation } from './StoreWorkstation.jsx';

const DEFAULT_ZONES = [
  { id: 'showroom', type: 'showroom', label: '新车展厅', subtitle: '临街展示面', x: 7, y: 13, w: 42, h: 31, tone: 'good' },
  { id: 'streamer-pod', type: 'streamer', label: '主播工位', subtitle: '展车直播', x: 34, y: 17, w: 12, h: 10, tone: 'neutral' },
  { id: 'negotiation', type: 'negotiation', label: '洽谈区', subtitle: '接待转化', x: 49, y: 13, w: 19, h: 18, tone: 'good' },
  { id: 'finance-delivery', type: 'finance', label: '金融/交付区', subtitle: '合同与交车', x: 68, y: 13, w: 20, h: 18, tone: 'warn' },
  { id: 'gm-office', type: 'office', label: '总经理办公室', subtitle: '内侧管理位', x: 68, y: 31, w: 20, h: 13, tone: 'neutral' },
  { id: 'used-car', type: 'usedCar', label: '二手车侧翼', subtitle: '置换评估/整备前', x: 7, y: 44, w: 22, h: 23, tone: 'warn' },
  { id: 'warehouse', type: 'warehouse', label: '新车库房', subtitle: '后场库存', x: 29, y: 44, w: 20, h: 40, tone: 'warn' },
  { id: 'service-reception', type: 'serviceReception', label: '售后接待', subtitle: '连接车间', x: 49, y: 44, w: 19, h: 18, tone: 'good' },
  { id: 'workshop', type: 'workshop', label: '售后车间', subtitle: '维修/保养工位', x: 68, y: 44, w: 20, h: 28, tone: 'danger' },
  { id: 'parts', type: 'parts', label: '配件库', subtitle: '后场供应', x: 68, y: 72, w: 20, h: 12, tone: 'good' },
  { id: 'back-corridor', type: 'corridor', label: '后场通道', subtitle: '库存/售后动线', x: 7, y: 84, w: 81, h: 6, tone: 'neutral' },
];

const DEFAULT_VEHICLE_SLOTS = [
  { id: 'car-a', zoneId: 'showroom', label: 'A6L', x: 11, y: 21, w: 8, h: 6, tone: 'good' },
  { id: 'car-b', zoneId: 'showroom', label: 'Q5L', x: 22, y: 21, w: 8, h: 6, tone: 'good' },
  { id: 'car-c', zoneId: 'showroom', label: 'A4L', x: 11, y: 33, w: 8, h: 6, tone: 'warn' },
  { id: 'car-d', zoneId: 'showroom', label: 'Q7', x: 22, y: 33, w: 8, h: 6, tone: 'neutral' },
  { id: 'used-a', zoneId: 'used-car', label: '认证二手', x: 11, y: 52, w: 8, h: 6, tone: 'warn' },
  { id: 'used-b', zoneId: 'used-car', label: '待整备', x: 20, y: 58, w: 7, h: 5, tone: 'danger' },
  { id: 'stock-a', zoneId: 'warehouse', label: '库存', x: 33, y: 52, w: 8, h: 6, tone: 'neutral' },
  { id: 'stock-b', zoneId: 'warehouse', label: '在途', x: 33, y: 66, w: 8, h: 6, tone: 'warn' },
];

const DEFAULT_SERVICE_BAYS = [
  { id: 'bay-1', label: '快保 1', x: 71, y: 51, w: 6, h: 10, tone: 'good' },
  { id: 'bay-2', label: '机修 2', x: 79, y: 51, w: 6, h: 10, tone: 'warn' },
  { id: 'bay-3', label: '钣喷', x: 71, y: 63, w: 14, h: 6, tone: 'danger' },
];

const DEFAULT_WORKSTATIONS = [
  { id: 'front-desk', type: 'sales', label: '前台', x: 43, y: 34, tone: 'good' },
  { id: 'live-desk', type: 'streamer', label: '直播', x: 40, y: 22, tone: 'neutral' },
  { id: 'consult-a', type: 'sales', label: '洽谈', x: 56, y: 23, tone: 'good' },
  { id: 'finance-a', type: 'finance', label: '金融', x: 75, y: 23, tone: 'warn' },
  { id: 'service-advisor', type: 'service', label: 'SA', x: 58, y: 54, tone: 'good' },
  { id: 'parts-desk', type: 'parts', label: '配件', x: 79, y: 78, tone: 'good' },
];

const DEFAULT_FLOORS = [
  { id: 'floor1', label: '1F 客户与后场', subtitle: '展厅 / 交付 / 库房 / 售后' },
  { id: 'floor2', label: '2F 管理办公', subtitle: '总经理 / 投资人 / DCC / 会议' },
];

const toneClass = {
  good: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    stroke: '#10b981',
  },
  warn: {
    border: 'border-amber-400',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    stroke: '#f59e0b',
  },
  danger: {
    border: 'border-red-400',
    bg: 'bg-red-100',
    text: 'text-red-700',
    stroke: '#ef4444',
  },
  neutral: {
    border: 'border-slate-300',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    stroke: '#64748b',
  },
  empty: {
    border: 'border-slate-300',
    bg: 'bg-white',
    text: 'text-slate-400',
    stroke: '#94a3b8',
  },
};

const asArray = value => Array.isArray(value) ? value : [];

const safeNumber = (value, fallback) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getItemRect = (item, fallback = {}) => {
  const rect = item.rect || item.bounds || item.position || item;
  return {
    x: safeNumber(rect.x ?? rect.left, fallback.x || 0),
    y: safeNumber(rect.y ?? rect.top, fallback.y || 0),
    w: safeNumber(rect.w ?? rect.width, fallback.w || 6),
    h: safeNumber(rect.h ?? rect.height, fallback.h || 5),
  };
};

const getItemTone = item => item.tone || item.status?.tone || item.health?.tone || 'neutral';

const getItemFloor = (item, zoneFloorById) => item.floor || zoneFloorById.get(item.zoneId || item.from) || 'floor1';

const getRoleLabel = role => STAFF_ROLE_META[role]?.label || '员工';

const getEmployeeName = employee => employee?.nickname || employee?.name || '未命名员工';

const getMetricValue = (workstation, key, fallback) => {
  const metrics = workstation?.metrics || {};
  return metrics[key] ?? metrics[`${key}Percent`] ?? fallback;
};

const clampPercent = (value, fallback = 0) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
};

const getWorkstationPayload = workstation => {
  const employee = workstation?.employee || {};
  const role = workstation?.role || employee.role || employee.type || 'sales';
  return {
    workstation,
    employee,
    role,
    employeeId: employee.id,
    clickTarget: workstation?.clickTarget,
  };
};

const normalizeWorkstationForMap = workstation => ({
  ...workstation,
  position: workstation.position || workstation.layout || {
    left: workstation.x,
    top: workstation.y,
    width: workstation.role === 'streamer' ? 58 : 54,
    height: 28,
  },
});

const normalizeZones = zones => {
  const source = asArray(zones);
  if (source.length === 0) return DEFAULT_ZONES;

  return source.map((zone, index) => {
    const defaultZone = DEFAULT_ZONES[index] || {};
    const hasRect = zone.rect || zone.bounds || zone.position || zone.x !== undefined || zone.left !== undefined;
    return {
      ...defaultZone,
      ...zone,
      ...(hasRect ? {} : {
        x: defaultZone.x ?? 8 + (index % 4) * 20,
        y: defaultZone.y ?? 12 + Math.floor(index / 4) * 18,
        w: defaultZone.w ?? 18,
        h: defaultZone.h ?? 14,
      }),
    };
  });
};

const normalizeItems = (items, defaults) => {
  const source = asArray(items);
  return source.length > 0 ? source : defaults;
};

function BlueprintShell({ zones = [], floor }) {
  const zoneRects = zones.map(zone => ({ id: zone.id, rect: getItemRect(zone, { w: 10, h: 10 }) }));
  const isSecondFloor = floor === 'floor2';

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect x="4" y="8" width="92" height="82" rx="0.8" fill="none" stroke="#1e3a8a" strokeWidth="0.7" />
      {isSecondFloor ? (
        <>
          <path d="M10 80H28V90 M16 84H28 M22 88H28" fill="none" stroke="#2563eb" strokeWidth="0.45" opacity="0.75" />
          <path d="M72 16H90V28 H72Z" fill="none" stroke="#1e3a8a" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.55" />
        </>
      ) : null}
      {zoneRects.map(({ id, rect }) => (
        <rect
          key={`wall-${id}`}
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill="none"
          stroke="#1e3a8a"
          strokeWidth="0.32"
          opacity="0.58"
        />
      ))}
      <path d="M4 90H96" fill="none" stroke="#1e40af" strokeWidth="0.55" strokeDasharray="2 1" />
    </svg>
  );
}

function VehicleSlot({ slot, onSlotClick }) {
  const rect = getItemRect(slot, { w: 7, h: 5 });
  const tone = getItemTone(slot);
  const classes = toneClass[tone] || toneClass.neutral;
  const isInteractive = typeof onSlotClick === 'function';
  const Element = isInteractive ? 'button' : 'div';

  return (
    <Element
      type={isInteractive ? 'button' : undefined}
      onClick={isInteractive ? () => onSlotClick(slot) : undefined}
      title={slot.label || slot.model || '车辆展位'}
      className={[
        'absolute z-20 flex items-center justify-center rounded-[3px] border bg-white/80 px-1 text-[7px] font-black shadow-sm outline-none transition',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        isInteractive ? 'cursor-pointer hover:scale-105' : '',
        classes.border,
        classes.text,
      ].filter(Boolean).join(' ')}
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
      }}
    >
      <span className="absolute left-1 right-1 top-1 h-0.5 rounded-full border border-current/30"></span>
      <span className="truncate pt-0.5">{slot.label || slot.model || '展车'}</span>
    </Element>
  );
}

function ServiceBay({ bay }) {
  const rect = getItemRect(bay, { w: 7, h: 8 });
  const tone = getItemTone(bay);
  const classes = toneClass[tone] || toneClass.neutral;

  return (
    <div
      title={bay.label || '售后工位'}
      className={`absolute z-20 rounded-[3px] border-2 bg-white/70 p-1 text-center text-[7px] font-black ${classes.border} ${classes.text}`}
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
      }}
    >
      <div className="mx-auto h-full max-h-12 w-1/2 border-x-2 border-current/50"></div>
      <span className="absolute inset-x-0 bottom-0.5 truncate px-1">{bay.label || '工位'}</span>
    </div>
  );
}

function RiskBadge({ badge }) {
  const tone = getItemTone(badge);
  const classes = toneClass[tone] || toneClass.danger;

  return (
    <div
      title={badge.detail || badge.label || '风险'}
      className={`absolute z-[25] max-w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[8px] font-black shadow-sm ${classes.border} ${classes.bg} ${classes.text}`}
      style={{
        left: `${safeNumber(badge.x ?? badge.left, 50)}%`,
        top: `${safeNumber(badge.y ?? badge.top, 50)}%`,
      }}
    >
      <span className="block truncate">{badge.label || badge.title || '风险'}</span>
    </div>
  );
}

function FloorSwitch({ floors, activeFloor, onChange, countsByFloor }) {
  return (
    <div className="flex flex-wrap gap-2">
      {floors.map(floor => {
        const active = floor.id === activeFloor;
        const counts = countsByFloor[floor.id] || {};
        return (
          <button
            key={floor.id}
            type="button"
            onClick={() => onChange(floor.id)}
            className={[
              'rounded-lg border px-3 py-2 text-left transition',
              active ? 'border-blue-400 bg-blue-50 text-blue-900 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50/60',
            ].join(' ')}
          >
            <span className="block text-xs font-black">{floor.label}</span>
            <span className="mt-0.5 block text-[10px] font-bold opacity-70">{floor.subtitle}</span>
            <span className="mt-1 block text-[10px] font-black opacity-60">
              {counts.zones || 0} 区域 · {counts.workstations || 0} 工位
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MetricPill({ label, value, tone = 'slate' }) {
  const toneClassName = {
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    slate: 'text-slate-700',
  }[tone] || 'text-slate-700';

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-black ${toneClassName}`}>{value}</p>
    </div>
  );
}

function WorkstationDetailPanel({
  workstation,
  onOpenStaff,
  onTrainMember,
  onToggleRetention,
}) {
  if (!workstation) {
    return (
      <aside className="rounded-xl border border-dashed border-slate-200 bg-white p-3">
        <p className="text-xs font-black text-slate-700">员工工位</p>
        <p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-400">
          点击图纸上的员工头像或空工位，右侧会显示员工故事、压力和可执行操作。
        </p>
      </aside>
    );
  }

  const payload = getWorkstationPayload(workstation);
  const { employee, role } = payload;
  const occupied = Boolean(workstation.occupied && workstation.employee);
  const roleLabel = role === 'streamer' ? '展厅直播位' : getRoleLabel(role);
  const storyMoments = Array.isArray(workstation.storyMoments) ? workstation.storyMoments.slice(0, 3) : [];
  const ability = Math.round(Number(getMetricValue(workstation, 'ability', getMetricValue(workstation, 'skill', employee.skill || employee.baseSkill))) || 0);
  const loyalty = clampPercent(getMetricValue(workstation, 'loyalty', employee.loyalty), 62);
  const stress = clampPercent(getMetricValue(workstation, 'stress', employee.stress), 18);

  if (!occupied) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">{workstation.label || roleLabel}</p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">{roleLabel} · 空工位</p>
          </div>
          <span className="shrink-0 rounded-full border border-dashed border-slate-300 px-2 py-1 text-[10px] font-black text-slate-400">
            空缺
          </span>
        </div>
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2 text-[11px] font-bold leading-relaxed text-slate-500">
          这个物理工位已经预留，但当前还没有员工入驻。补齐人员后，工位会显示头像和个人故事。
        </p>
        <button
          type="button"
          onClick={() => onOpenStaff?.(payload)}
          className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
        >
          去人事页
        </button>
      </aside>
    );
  }

  const loyaltyTone = loyalty <= 45 ? 'red' : loyalty <= 62 ? 'amber' : 'emerald';
  const stressTone = stress >= 70 ? 'red' : stress >= 55 ? 'amber' : 'blue';

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <StaffAvatar type={role} member={employee} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">{getEmployeeName(employee)}</p>
          <p className="truncate text-[10px] font-bold text-slate-400">{workstation.label || roleLabel}</p>
          <p className="truncate text-[10px] font-black text-indigo-600">{roleLabel} · 能力 {ability}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MetricPill label="能力" value={ability} tone="blue" />
        <MetricPill label="忠诚" value={loyalty} tone={loyaltyTone} />
        <MetricPill label="压力" value={stress} tone={stressTone} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black text-slate-500">最近故事</p>
          {storyMoments.length > 0 && <span className="text-[10px] font-bold text-slate-300">{storyMoments.length}/3</span>}
        </div>
        <div className="space-y-1.5">
          {storyMoments.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2 text-[10px] font-bold text-slate-400">
              暂无员工故事记录。
            </p>
          )}
          {storyMoments.map((moment, index) => (
            <div key={moment?.id || `${moment?.type || 'story'}-${index}`} className="rounded-lg border border-slate-100 bg-white p-2">
              <div className="mb-1 flex items-center gap-1.5">
                <StaffStoryBadge moment={moment} compact />
                {moment?.day && <span className="text-[10px] font-bold text-slate-300">D{moment.day}</span>}
              </div>
              <p className="text-[10px] font-bold leading-relaxed text-slate-600">
                {moment?.summary || moment?.message || moment?.title || '员工状态有变化'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => onOpenStaff?.(payload)} className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-[10px] font-black text-blue-700 hover:bg-blue-100">
          去人事页
        </button>
        <button type="button" onClick={() => onTrainMember?.(payload)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-[10px] font-black text-indigo-700 hover:bg-indigo-100">
          培训
        </button>
        <button type="button" onClick={() => onToggleRetention?.(payload)} className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-[10px] font-black text-amber-700 hover:bg-amber-100">
          留任
        </button>
      </div>
    </aside>
  );
}

export function StoreBlueprintMap({
  viewModel = {},
  onZoneClick,
  onOpenStaff,
  onTrainMember,
  onToggleRetention,
  onSlotClick,
}) {
  const zones = normalizeZones(viewModel.zones);
  const floors = normalizeItems(viewModel.floors, DEFAULT_FLOORS);
  const vehicleSlots = normalizeItems(viewModel.vehicleSlots, DEFAULT_VEHICLE_SLOTS);
  const serviceBays = normalizeItems(viewModel.serviceBays, DEFAULT_SERVICE_BAYS);
  const workstations = normalizeItems(viewModel.workstations, DEFAULT_WORKSTATIONS);
  const riskBadges = asArray(viewModel.riskBadges);
  const summary = viewModel.summary || {};
  const [activeFloor, setActiveFloor] = useState(floors[0]?.id || 'floor1');
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const zoneFloorById = new Map(zones.map(zone => [zone.id, zone.floor || 'floor1']));
  const visibleZones = zones.filter(zone => (zone.floor || 'floor1') === activeFloor);
  const visibleVehicleSlots = vehicleSlots.filter(slot => getItemFloor(slot, zoneFloorById) === activeFloor);
  const visibleServiceBays = serviceBays.filter(bay => getItemFloor(bay, zoneFloorById) === activeFloor);
  const visibleWorkstations = workstations.filter(workstation => getItemFloor(workstation, zoneFloorById) === activeFloor);
  const visibleRiskBadges = riskBadges.filter(badge => getItemFloor(badge, zoneFloorById) === activeFloor);
  const activeFloorMeta = floors.find(floor => floor.id === activeFloor) || floors[0] || DEFAULT_FLOORS[0];
  const countsByFloor = floors.reduce((counts, floor) => ({
    ...counts,
    [floor.id]: {
      zones: zones.filter(zone => (zone.floor || 'floor1') === floor.id).length,
      workstations: workstations.filter(workstation => getItemFloor(workstation, zoneFloorById) === floor.id).length,
    },
  }), {});

  const handleWorkstationSelect = payload => {
    const workstation = payload?.workstation || payload;
    setSelectedWorkstation(workstation || null);
  };

  const handleFloorChange = floorId => {
    setActiveFloor(floorId);
    setSelectedWorkstation(null);
  };

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-slate-900">{summary.name || '建筑图纸版 4S 店'}</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-relaxed text-slate-500">
            {summary.description || '临街展厅、洽谈金融、后场库房与售后车间按商业平面图方式呈现。'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black text-slate-500">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1">{activeFloorMeta.label}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">楼层示意图</span>
        </div>
      </div>

      <div className="mb-3">
        <FloorSwitch floors={floors} activeFloor={activeFloor} onChange={handleFloorChange} countsByFloor={countsByFloor} />
      </div>

      <div className="space-y-3">
        <div className="min-w-0 overflow-x-auto rounded-lg border border-sky-200 bg-sky-50 p-2">
          <div
            className="relative min-h-[620px] min-w-[980px] overflow-hidden rounded-md border border-blue-200 bg-sky-50 shadow-inner"
            style={{
              backgroundImage: 'linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)',
              backgroundSize: '49px 49px, 49px 49px, 9.8px 9.8px, 9.8px 9.8px',
            }}
          >
            <BlueprintShell zones={visibleZones} floor={activeFloor} />

            {visibleZones.map(zone => (
              <StoreBlueprintZone key={zone.id || zone.label} zone={zone} onClick={onZoneClick}>
                <span className="text-[8px] font-black uppercase tracking-[0.18em] opacity-45">
                  {zone.code || zone.id || zone.type || 'zone'}
                </span>
              </StoreBlueprintZone>
            ))}

            {visibleVehicleSlots.map(slot => (
              <VehicleSlot key={slot.id || slot.label} slot={slot} onSlotClick={onSlotClick} />
            ))}

            {visibleServiceBays.map(bay => (
              <ServiceBay key={bay.id || bay.label} bay={bay} />
            ))}

            {visibleWorkstations.map(workstation => (
              <StoreWorkstation
                key={workstation.id || workstation.label}
                workstation={{
                  ...normalizeWorkstationForMap(workstation),
                  selected: selectedWorkstation?.id === workstation.id,
                }}
                variant="marker"
                onOpenStaff={handleWorkstationSelect}
                onTrainMember={onTrainMember}
                onToggleRetention={onToggleRetention}
              />
            ))}

            {visibleRiskBadges.map((badge, index) => (
              <RiskBadge key={badge.id || `${badge.label}-${index}`} badge={badge} />
            ))}

            <div className="pointer-events-none absolute bottom-[2%] left-[4%] right-[4%] flex items-center justify-between border-t border-blue-700/40 pt-1 text-[9px] font-black text-blue-800/70">
              <span>STORE BLUEPRINT / AUDI 4S / {activeFloorMeta.label}</span>
              <span>车辆、员工工位与风险按楼层过滤渲染</span>
            </div>
          </div>
        </div>

        <StoreBlueprintLegend viewModel={{ ...viewModel, riskBadges: visibleRiskBadges }} />
        <WorkstationDetailPanel
          workstation={selectedWorkstation}
          onOpenStaff={onOpenStaff}
          onTrainMember={onTrainMember}
          onToggleRetention={onToggleRetention}
        />
      </div>
    </section>
  );
}

export default StoreBlueprintMap;
