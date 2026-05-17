import React from 'react';
import { Term } from '../../shared/ui/tooltip.jsx';

export function VirtualSprintTab({
  virtualSales,
  monthlyStats,
  dayOfMonth,
  carModels,
  inventory,
  virtualPlan,
  setVirtualPlan,
  formatMoney,
  getDynamicRebate,
  onVirtualSprint,
}) {
  const suspicionLevel = virtualSales.suspicionLevel || 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold">月底冲刺</h2>
        <p className="text-slate-500 text-sm mt-1">销售运营里的高风险冲量工具。<Term term="虚出">虚出</Term>能补账面销量和<Term term="返利池">返利池</Term>，但会留下<Term term="浮库">浮库</Term>和厂家稽核风险。</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-black text-slate-900"><Term term="月结">月底</Term>冲刺操作台</h3>
            <p className="text-xs text-slate-500 mt-1">D25-D28开放。<Term term="虚出">虚出</Term>车辆会从可售库存移入<Term term="浮库">浮库</Term>，后续真实成交优先消化。</p>
          </div>
          <div className="text-right">
            <p className={suspicionLevel >= 70 ? 'text-xl font-black text-red-600' : suspicionLevel >= 40 ? 'text-xl font-black text-amber-600' : 'text-xl font-black text-emerald-600'}>{suspicionLevel}/100</p>
            <p className="text-[10px] text-slate-400">厂家怀疑度</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700 mb-4">
          虚出操作存在风险：虚出车辆占用资金、可能被厂家抽查罚款、多次违规将面临退网。当前厂家怀疑度：{suspicionLevel}/100
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100"><p className="text-xs text-slate-400">销量进度</p><p className="font-black text-slate-800">{monthlyStats.sales}/{monthlyStats.target}</p></div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100"><p className="text-xs text-slate-400">任务缺口</p><p className="font-black text-amber-600">{Math.max(0, monthlyStats.target - monthlyStats.sales)} 台</p></div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100"><p className="text-xs text-slate-400"><Term term="浮库">当前浮库</Term></p><p className="font-black text-red-600">{(virtualSales.virtualCars || []).length} 台</p></div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100"><p className="text-xs text-slate-400"><Term term="虚出">虚出</Term>返利累计</p><p className="font-black text-green-600">{formatMoney(virtualSales.rebateEarnedFromVirtual || 0)}</p></div>
        </div>
        {dayOfMonth >= 25 && dayOfMonth <= 28 ? (
          <div className="space-y-3">
            {carModels.filter(model => inventory.some(car => car.modelId === model.id)).map(model => {
              const count = inventory.filter(car => car.modelId === model.id).length;

              return (
                <div key={model.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{model.name}</p>
                    <p className="text-xs text-slate-500">库存{count}台 · 单台返利{formatMoney(getDynamicRebate(model.id))}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={count}
                    value={virtualPlan[model.id] || 0}
                    onChange={event => setVirtualPlan(prev => ({ ...prev, [model.id]: Math.max(0, Math.min(count, parseInt(event.target.value, 10) || 0)) }))}
                    className="w-24 rounded-lg border border-slate-300 p-2 text-center font-bold"
                  />
                  <p className="text-xs text-slate-500">怀疑度 +{(virtualPlan[model.id] || 0) * 5}</p>
                </div>
              );
            })}
            <button onClick={onVirtualSprint} disabled={inventory.length === 0} className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black disabled:opacity-40 disabled:cursor-not-allowed">确认虚出（风险自负）</button>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">月底冲刺窗口尚未开启，D25-D28可操作。</div>
        )}
      </div>
    </div>
  );
}
