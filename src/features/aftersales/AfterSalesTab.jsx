import React from 'react';

export function AfterSalesTab({
  techCount,
  techAvgSkill,
  serviceCount,
  serviceAvgSkill,
  monthlyStats,
  insuranceRenewals,
  formatMoney,
  onOpenStaff,
}) {
  const afterSalesProfit = monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-2xl">🔧</span> 售后服务与续保管理</h2>
          <p className="text-slate-500 text-sm mt-1">技师维修保养 + 续保佣金，占4S店利润60%+。二手车业务请前往"二手车"Tab。</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-blue-900">售后技师已归入组织人事</h3>
          <p className="text-sm text-blue-700 mt-1">当前技师 {techCount} 人，平均能力 {techAvgSkill}，维修产能 {techCount * 3} 单/天。客服专员 {serviceCount} 人，平均能力 {serviceAvgSkill}，会提升CSI恢复和客户回厂台次。</p>
        </div>
        <button onClick={onOpenStaff} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shrink-0">
          前往人事
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4">📊 本月售后统计</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">售后收入</span><span className="font-bold text-green-600">{formatMoney(monthlyStats.afterSalesRevenue)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">售后成本</span><span className="font-bold text-red-500">-{formatMoney(monthlyStats.afterSalesCost)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">本月回厂台次</span><span className="font-bold text-blue-600">{monthlyStats.afterSalesReturnVisits || 0} 单</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold">售后毛利</span><span className={'font-bold ' + (afterSalesProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(afterSalesProfit)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">金融佣金</span><span className="font-bold text-green-600">+{formatMoney(monthlyStats.financeCommission)}</span></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4">♻️ 续保管理</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">待续保车辆</span><span className="font-bold">{insuranceRenewals.pending}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">已续保</span><span className="font-bold text-green-600">{insuranceRenewals.renewed}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">续保佣金收入</span><span className="font-bold text-green-600">+{formatMoney(monthlyStats.insuranceRenewalRevenue)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
