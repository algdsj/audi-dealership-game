import { StoreWorkstation } from './StoreWorkstation.jsx';

const ZONE_META = {
  showroom: { label: '展厅', className: 'lg:col-span-7 border-blue-100 bg-blue-50/40' },
  sales: { label: '销售区', className: 'lg:col-span-5 border-emerald-100 bg-emerald-50/40' },
  office: { label: '办公室', className: 'lg:col-span-4 border-slate-200 bg-white' },
  afterSales: { label: '售后车间', className: 'lg:col-span-5 border-amber-100 bg-amber-50/40' },
  service: { label: '客服区', className: 'lg:col-span-3 border-cyan-100 bg-cyan-50/40' },
  warehouse: { label: '库房', className: 'lg:col-span-4 border-orange-100 bg-orange-50/40' },
  usedCar: { label: '二手车区', className: 'lg:col-span-4 border-violet-100 bg-violet-50/40' },
  market: { label: '市场直播区', className: 'lg:col-span-4 border-fuchsia-100 bg-fuchsia-50/40' },
};

const ZONE_ORDER = ['showroom', 'sales', 'office', 'afterSales', 'service', 'warehouse', 'usedCar', 'market'];

const STREAMER_WORKSTATION = {
  id: 'showroom-streamer-workstation',
  zoneId: 'showroom',
  role: 'streamer',
  label: '展厅直播位',
  occupied: false,
  employee: null,
  tone: 'warn',
  storyMoments: [],
  metrics: {},
  clickTarget: 'staff:streamer',
};

const hasPosition = (workstation) => {
  const position = workstation?.position || workstation?.layout || {};
  return ['left', 'right', 'top', 'bottom', 'width', 'height'].some(key => position[key] !== undefined);
};

const normalizeZoneId = (workstation) => {
  if (workstation?.zoneId) return workstation.zoneId;
  if (workstation?.role === 'streamer') return 'showroom';
  if (workstation?.role === 'tech') return 'afterSales';
  if (workstation?.role === 'service') return 'service';
  if (workstation?.role === 'dcc' || workstation?.role === 'sales') return 'sales';
  return 'office';
};

const ensureStreamerWorkstation = (workstations) => {
  const hasStreamer = workstations.some(workstation => workstation?.role === 'streamer');
  return hasStreamer ? workstations : [...workstations, STREAMER_WORKSTATION];
};

const sortZones = (zones) => (
  [...zones].sort((a, b) => {
    const aIndex = ZONE_ORDER.indexOf(a);
    const bIndex = ZONE_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  })
);

function ZoneGroup({
  zoneId,
  workstations,
  onOpenStaff,
  onTrainMember,
  onToggleRetention,
}) {
  const meta = ZONE_META[zoneId] || { label: zoneId || '未分区', className: 'lg:col-span-4 border-slate-200 bg-white' };

  return (
    <section className={'min-w-0 rounded-xl border p-3 shadow-sm ' + meta.className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-black text-slate-800">{meta.label}</h3>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-500">
          {workstations.length} 工位
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {workstations.map(workstation => (
          <StoreWorkstation
            key={workstation.id}
            workstation={workstation}
            onOpenStaff={onOpenStaff}
            onTrainMember={onTrainMember}
            onToggleRetention={onToggleRetention}
          />
        ))}
      </div>
    </section>
  );
}

export function StoreWorkstationLayer({
  workstations = [],
  onOpenStaff,
  onTrainMember,
  onToggleRetention,
  className = '',
}) {
  const visibleWorkstations = ensureStreamerWorkstation(Array.isArray(workstations) ? workstations : [])
    .map((workstation, index) => ({
      ...workstation,
      id: workstation.id || `${normalizeZoneId(workstation)}-${workstation.role || 'seat'}-${index}`,
      zoneId: normalizeZoneId(workstation),
    }));
  const positioned = visibleWorkstations.filter(hasPosition);
  const unpositioned = visibleWorkstations.filter(workstation => !hasPosition(workstation));

  if (positioned.length > 0 && unpositioned.length === 0) {
    return (
      <div className={'relative min-h-[420px] rounded-xl border border-slate-200 bg-slate-50/80 p-3 ' + className}>
        {positioned.map(workstation => (
          <StoreWorkstation
            key={workstation.id}
            workstation={workstation}
            onOpenStaff={onOpenStaff}
            onTrainMember={onTrainMember}
            onToggleRetention={onToggleRetention}
          />
        ))}
      </div>
    );
  }

  const groupedWorkstations = positioned.length > 0 ? unpositioned : visibleWorkstations;
  const grouped = groupedWorkstations.reduce((groups, workstation) => {
    const zoneId = normalizeZoneId(workstation);
    return {
      ...groups,
      [zoneId]: [...(groups[zoneId] || []), workstation],
    };
  }, {});
  const zoneIds = sortZones(Object.keys(grouped));

  return (
    <div className={'rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm ' + className}>
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-800">员工工位图层</h3>
          <p className="truncate text-[10px] font-bold text-slate-400">空工位、在岗员工、故事和流失风险集中展示</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-500">
          {visibleWorkstations.length} 工位
        </span>
      </div>

      {positioned.length > 0 && (
        <div className="relative mb-3 min-h-[260px] rounded-xl border border-slate-200 bg-white">
          {positioned.map(workstation => (
            <StoreWorkstation
              key={workstation.id}
              workstation={workstation}
              onOpenStaff={onOpenStaff}
              onTrainMember={onTrainMember}
              onToggleRetention={onToggleRetention}
            />
          ))}
        </div>
      )}

      {zoneIds.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {zoneIds.map(zoneId => (
            <ZoneGroup
              key={zoneId}
              zoneId={zoneId}
              workstations={grouped[zoneId]}
              onOpenStaff={onOpenStaff}
              onTrainMember={onTrainMember}
              onToggleRetention={onToggleRetention}
            />
          ))}
        </div>
      )}
    </div>
  );
}
