const legendItems = [
  { type: 'showroom', label: '新车展厅', className: 'border-blue-500 bg-blue-50' },
  { type: 'negotiation', label: '洽谈/金融/交付', className: 'border-cyan-500 bg-cyan-50' },
  { type: 'service', label: '售后接待/车间', className: 'border-rose-500 bg-rose-50' },
  { type: 'warehouse', label: '库房/后场', className: 'border-stone-500 bg-stone-50' },
  { type: 'office', label: '办公室', className: 'border-slate-500 bg-slate-50' },
  { type: 'risk', label: '风险点', className: 'border-red-500 bg-red-50' },
];

const toneClass = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
};

export function StoreBlueprintLegend({ viewModel = {} }) {
  const riskBadges = Array.isArray(viewModel.riskBadges) ? viewModel.riskBadges : [];
  const summary = viewModel.summary || {};

  return (
    <aside className="min-w-0 rounded-lg border border-slate-200 bg-white/85 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-800">图纸图例</h3>
          <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
            {summary.title || summary.label || '4S 店功能分区'}
          </p>
        </div>
        {summary.level && (
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500">
            Lv.{summary.level}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
        {legendItems.map(item => (
          <div key={item.type} className="flex min-w-0 items-center gap-2">
            <span className={`h-3 w-5 shrink-0 rounded-[2px] border-2 ${item.className}`}></span>
            <span className="truncate text-[10px] font-black text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {['good', 'warn', 'danger'].map(tone => (
          <span key={tone} className={`rounded-full border px-2 py-1 text-[10px] font-black ${toneClass[tone]}`}>
            {tone === 'good' ? '健康' : tone === 'warn' ? '关注' : '高危'}
          </span>
        ))}
      </div>

      {riskBadges.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {riskBadges.slice(0, 4).map((badge, index) => (
            <div key={badge.id || `${badge.label}-${index}`} className={`min-w-0 rounded-md border px-2 py-1.5 ${toneClass[badge.tone] || toneClass.neutral}`}>
              <p className="truncate text-[10px] font-black">{badge.label || badge.title || '风险提示'}</p>
              {badge.detail && <p className="mt-0.5 truncate text-[9px] font-bold opacity-70">{badge.detail}</p>}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
