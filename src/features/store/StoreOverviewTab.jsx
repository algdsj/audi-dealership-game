import { Icons } from '../../shared/ui/icons.jsx';
import { buildStoreOverviewViewModel } from './storeOverviewViewModel.js';

const toneClasses = {
  good: {
    panel: 'border-emerald-200 bg-emerald-50/40',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  warn: {
    panel: 'border-amber-200 bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  danger: {
    panel: 'border-red-200 bg-red-50/50',
    badge: 'bg-red-100 text-red-700 border-red-200',
    bar: 'bg-red-500',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

const defaultFormatMoney = (value) => `¥${Math.round(Number(value) || 0).toLocaleString()}`;

function StatusBadge({ status }) {
  const tone = toneClasses[status.tone] || toneClasses.warn;
  return (
    <span className={'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black leading-none whitespace-nowrap ' + tone.badge}>
      <span className={'h-1.5 w-1.5 rounded-full ' + tone.dot}></span>
      {status.label}
    </span>
  );
}

function Meter({ value, tone = 'good', label }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const classes = toneClasses[tone] || toneClasses.warn;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
        <span className="truncate">{label}</span>
        <span className="font-bold text-slate-500">{safeValue}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={'h-full rounded-full transition-all ' + classes.bar} style={{ width: `${safeValue}%` }}></div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, tone = 'slate', compact = false }) {
  const textTone = {
    slate: 'text-slate-800',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  }[tone] || 'text-slate-800';

  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-white/80 px-2 py-2">
      <p className="truncate text-[10px] text-slate-400">{label}</p>
      <p className={(compact ? 'text-xs' : 'text-sm') + ' mt-0.5 truncate font-black ' + textTone}>{value}</p>
    </div>
  );
}

function ZonePanel({ title, icon, status, score, children, className = '' }) {
  const tone = toneClasses[status.tone] || toneClasses.warn;

  return (
    <section className={'min-w-0 rounded-xl border p-3 shadow-sm ' + tone.panel + ' ' + className}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex min-w-0 items-center gap-2 text-sm font-black text-slate-800">
            <span className="shrink-0 text-base">{icon}</span>
            <span className="truncate">{title}</span>
          </h3>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">经营评分 {Math.round(score)}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
    </section>
  );
}

function ShowroomSlots({ slots, hiddenSlotCount }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {slots.map(slot => (
        <div
          key={slot.id}
          title={slot.label}
          className={'flex h-10 min-w-0 items-center justify-center rounded-lg border text-[10px] font-black leading-tight ' + (
            slot.filled
              ? 'border-blue-200 bg-blue-100 text-blue-700'
              : 'border-dashed border-slate-200 bg-white text-slate-300'
          )}
        >
          <span className="max-w-full truncate px-1">{slot.filled ? slot.label : '空位'}</span>
        </div>
      ))}
      {hiddenSlotCount > 0 && (
        <div className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500">
          +{hiddenSlotCount}
        </div>
      )}
    </div>
  );
}

function TeamLane({ team }) {
  const pressureTone = team.tone;
  const moraleTone = team.morale >= 70 ? 'good' : team.morale >= 48 ? 'warn' : 'danger';

  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-white p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-800">{team.label}团队</p>
          <p className="truncate text-[10px] text-slate-400">{team.count} 人 · {team.status}</p>
        </div>
        <span className={'shrink-0 text-[10px] font-black ' + (toneClasses[pressureTone] || toneClasses.warn).text}>{team.pressure}</span>
      </div>
      <div className="mt-2 grid grid-cols-[46px_1fr] items-center gap-2">
        <span className="text-[10px] text-slate-400">压力</span>
        <Meter value={team.pressure} tone={pressureTone} label="" />
        <span className="text-[10px] text-slate-400">士气</span>
        <Meter value={team.morale} tone={moraleTone} label="" />
      </div>
    </div>
  );
}

function AttentionBoard({ items }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-800">经营雷达</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{items.length} 条</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-relaxed text-emerald-700">
            暂无红黄灯事项，当前门店节奏可控。
          </p>
        )}
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-2">
            <p className="break-words text-xs font-bold leading-relaxed text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ModelMix({ items }) {
  if (items.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-200 bg-white p-2 text-center text-[10px] font-bold text-slate-400">暂无车型结构</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item.label} className="max-w-full truncate rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
          {item.label} · {item.count}
        </span>
      ))}
    </div>
  );
}

export function StoreOverviewTab({
  inventory,
  pendingOrders,
  usedCars,
  facility,
  afterSales,
  staff,
  finance,
  monthlyStats,
  csi,
  competitors,
  alerts,
  logs,
  carModels,
  usedCarShowroom,
  investorRelations,
  manufacturerPolicy,
  dayOfMonth,
  formatMoney = defaultFormatMoney,
}) {
  const viewModel = buildStoreOverviewViewModel({
    inventory,
    pendingOrders,
    usedCars,
    facility,
    afterSales,
    staff,
    finance,
    monthlyStats,
    csi,
    competitors,
    alerts,
    logs,
    carModels,
    usedCarShowroom,
    investorRelations,
    manufacturerPolicy,
    dayOfMonth,
  });

  const healthTone = viewModel.overview.healthScore >= 80 ? 'good' : viewModel.overview.healthScore >= 58 ? 'warn' : 'danger';

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Icons.Store /> 2D 门店总览</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">展厅、库房、售后、二手车、办公室和员工动线集中看板。</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <MetricCell label="门店健康" value={`${viewModel.overview.healthScore}分`} tone={healthTone === 'danger' ? 'red' : healthTone === 'warn' ? 'amber' : 'emerald'} />
          <MetricCell label="新车库存" value={`${viewModel.showroom.totalInventory}台`} tone="blue" />
          <MetricCell label="现金余额" value={formatMoney(viewModel.office.cash)} tone={viewModel.office.cash < 0 ? 'red' : 'emerald'} compact />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-slate-800">门店平面经营图</h3>
              <p className="truncate text-[10px] text-slate-400">红黄绿灯按容量、资金、CSI、目标进度和团队压力综合判断</p>
            </div>
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-500">Lv.{facility?.level || 1}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <ZonePanel title={viewModel.showroom.title} icon="展" status={viewModel.showroom.status} score={viewModel.showroom.score} className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <MetricCell label="展位占用" value={`${viewModel.showroom.usedSpots}/${viewModel.showroom.showroomSpots}`} tone="blue" />
                <MetricCell label="总库存" value={`${viewModel.showroom.totalInventory}台`} />
                <MetricCell label="最长库龄" value={`${viewModel.showroom.maxStockDays}天`} tone={viewModel.showroom.maxStockDays >= 60 ? 'red' : 'slate'} />
                <MetricCell label="平均库龄" value={`${viewModel.showroom.avgStockDays}天`} />
              </div>
              <div className="mt-3">
                <ShowroomSlots slots={viewModel.showroom.slots} hiddenSlotCount={viewModel.showroom.hiddenSlotCount} />
              </div>
              <div className="mt-3">
                <ModelMix items={viewModel.showroom.modelMix} />
              </div>
            </ZonePanel>

            <ZonePanel title={viewModel.office.title} icon="办" status={viewModel.office.status} score={viewModel.office.score} className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCell label="现金" value={formatMoney(viewModel.office.cash)} tone={viewModel.office.cash < 0 ? 'red' : 'emerald'} compact />
                <MetricCell label="贷款" value={formatMoney(viewModel.office.loan)} tone={viewModel.office.loanUtilization >= 85 ? 'red' : 'amber'} compact />
                <MetricCell label="投资人" value={`${Math.round(viewModel.office.investorScore)}分`} tone={viewModel.office.investorScore < 60 ? 'red' : 'slate'} />
                <MetricCell label="厂家压力" value={`${viewModel.office.manufacturerPressure}%`} tone={viewModel.office.manufacturerPressure >= 74 ? 'red' : 'amber'} />
              </div>
              <div className="mt-3 space-y-2">
                <Meter value={viewModel.office.loanUtilization} tone={viewModel.office.loanUtilization >= 85 ? 'danger' : viewModel.office.loanUtilization >= 60 ? 'warn' : 'good'} label="银行授信使用" />
                <Meter value={viewModel.office.salesPace} tone={viewModel.office.salesPace >= 85 ? 'good' : viewModel.office.salesPace >= 55 ? 'warn' : 'danger'} label="厂家目标节奏" />
              </div>
            </ZonePanel>

            <ZonePanel title={viewModel.warehouse.title} icon="库" status={viewModel.warehouse.status} score={viewModel.warehouse.score} className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCell label="库房水位" value={`${viewModel.warehouse.stock}/${viewModel.warehouse.capacity}`} tone={viewModel.warehouse.occupancy >= 90 ? 'red' : 'amber'} />
                <MetricCell label="在途车辆" value={`${viewModel.warehouse.inTransitCount}台`} tone="blue" />
                <MetricCell label="3日到店" value={`${viewModel.warehouse.arrivalSoonCount}台`} />
                <MetricCell label="综合压力" value={`${viewModel.warehouse.totalStockPressure}%`} tone={viewModel.warehouse.totalStockPressure >= 90 ? 'red' : 'slate'} />
              </div>
              <div className="mt-3 space-y-2">
                <Meter value={viewModel.warehouse.occupancy} tone={viewModel.warehouse.occupancy >= 90 ? 'danger' : viewModel.warehouse.occupancy >= 75 ? 'warn' : 'good'} label="库位占用" />
                <Meter value={viewModel.warehouse.totalStockPressure} tone={viewModel.warehouse.totalStockPressure >= 90 ? 'danger' : viewModel.warehouse.totalStockPressure >= 74 ? 'warn' : 'good'} label="含在途压力" />
              </div>
            </ZonePanel>

            <ZonePanel title={viewModel.afterSales.title} icon="修" status={viewModel.afterSales.status} score={viewModel.afterSales.score} className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCell label="技师/客服" value={`${viewModel.afterSales.techCount}/${viewModel.afterSales.serviceCount}`} />
                <MetricCell label="日工位" value={`${viewModel.afterSales.techCapacityPerDay}单`} tone="blue" />
                <MetricCell label="CSI" value={`${Math.round(viewModel.afterSales.csiScore)}分`} tone={viewModel.afterSales.csiScore < 85 ? 'red' : 'emerald'} />
                <MetricCell label="投诉" value={`${viewModel.afterSales.complaintCount}起`} tone={viewModel.afterSales.complaintCount > 0 ? 'red' : 'slate'} />
              </div>
              <div className="mt-3 space-y-2">
                <Meter value={viewModel.afterSales.load} tone={viewModel.afterSales.load >= 95 ? 'danger' : viewModel.afterSales.load >= 76 ? 'warn' : 'good'} label="工位负荷" />
                <p className={'truncate text-xs font-black ' + (viewModel.afterSales.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  售后毛利 {viewModel.afterSales.profit >= 0 ? '+' : ''}{formatMoney(viewModel.afterSales.profit)}
                </p>
              </div>
            </ZonePanel>

            <ZonePanel title={viewModel.usedCar.title} icon="旧" status={viewModel.usedCar.status} score={viewModel.usedCar.score} className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCell label="在库二手车" value={`${viewModel.usedCar.stock}台`} tone="amber" />
                <MetricCell label="已整备" value={`${viewModel.usedCar.prepped}台`} tone="emerald" />
                <MetricCell label="待整备" value={`${viewModel.usedCar.pendingPrep}台`} tone={viewModel.usedCar.pendingPrep > 0 ? 'red' : 'slate'} />
                <MetricCell label="本月置换" value={`${viewModel.usedCar.tradeInCount}台`} />
              </div>
              <div className="mt-3">
                <Meter value={viewModel.usedCar.occupancy} tone={viewModel.usedCar.occupancy >= 90 ? 'danger' : viewModel.usedCar.occupancy >= 70 ? 'warn' : 'good'} label="二手车区水位" />
              </div>
            </ZonePanel>

            <ZonePanel title={viewModel.teams.title} icon="动" status={viewModel.teams.status} score={viewModel.teams.score} className="lg:col-span-12">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                {viewModel.teams.lanes.map(team => <TeamLane key={team.key} team={team} />)}
              </div>
            </ZonePanel>
          </div>
        </div>

        <AttentionBoard items={viewModel.overview.attentionItems} />
      </div>
    </div>
  );
}
