import React from 'react';
import { Icons } from '../../shared/ui/icons.jsx';

export function FacilityUpgradeTab({
  facility,
  inventory,
  monthlyStats,
  formatMoney,
  onUpgradeFacility,
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Store /> 设施升级</h2>
        <p className="text-slate-500 text-sm mt-1">展厅展位、库房容量、租金和折旧集中管理。设施升级会提高可展示库存，也会推高固定成本。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900 text-white p-5">
          <p className="text-xs text-slate-400 font-bold">当前等级</p>
          <p className="text-4xl font-black mt-1">Lv.{facility.level}</p>
          <p className="text-xs text-slate-400 mt-2">标准奥迪4S店</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400 font-bold">展厅展位</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{facility.showroomSpots}</p>
          <p className="text-xs text-slate-400 mt-2">当前已用 {inventory.filter(car => car.location === 'showroom').length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400 font-bold">库房容量</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{facility.warehouseCapacity}</p>
          <p className="text-xs text-slate-400 mt-2">仓储车 ¥50/天</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400 font-bold">固定成本</p>
          <p className="text-xl font-black text-slate-900 mt-1">{formatMoney((monthlyStats.rent || 0) + (monthlyStats.depreciation || 0))}</p>
          <p className="text-xs text-slate-400 mt-2">本月租金+折旧</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900">门店硬件升级</h3>
            <p className="text-sm text-slate-500 mt-1">每次升级增加 1 个展厅展位和 8 台库房容量。展车提升转化率，库房容量提升订货弹性。</p>
          </div>
          <button onClick={onUpgradeFacility} className="px-6 py-3 bg-slate-900 text-white font-black rounded-lg hover:bg-slate-800 transition-colors">
            升级 {formatMoney(facility.level * 100000)}
          </button>
        </div>
      </div>
    </div>
  );
}
