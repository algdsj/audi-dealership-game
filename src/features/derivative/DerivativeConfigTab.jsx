import React from 'react';
import { Term } from '../../shared/ui/tooltip.jsx';

export function DerivativeConfigTab({
  strategy,
  monthlyStats,
  formatMoney,
  onStrategyChange,
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold">金融衍生</h2>
        <p className="text-slate-500 text-sm mt-1">集中配置<Term term="精品">精品</Term>、<Term term="延保">延保</Term>、保险<Term term="续保">续保</Term>和二手车收购策略。这里决定前端低毛利成交能不能被 <Term term="GP3">GP3</Term> 补回来。</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-black text-blue-950">保险代理业务</h3>
          <p className="text-xs text-blue-700 mt-2 min-h-12">强制合作主流保险公司，渗透率稳定在 80%，保司固定返佣 25%。</p>
          <div className="mt-4 rounded-lg bg-white border border-blue-100 p-3 text-sm font-bold text-slate-600 text-center">策略固定</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-900"><Term term="精品">精品</Term>装潢采购</h3>
          <p className="text-xs text-slate-500 mt-2 min-h-12">原厂精品信任度高但毛利低；第三方精品更赚钱但更难成交。</p>
          <div className="flex bg-slate-100 p-1 rounded-lg mt-4">
            <button onClick={() => onStrategyChange('accessories', 'OEM')} className={'flex-1 text-sm py-2 rounded-md font-bold transition-all ' + (strategy.accessories === 'OEM' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>原厂采购</button>
            <button onClick={() => onStrategyChange('accessories', '3RD')} className={'flex-1 text-sm py-2 rounded-md font-bold transition-all ' + (strategy.accessories === '3RD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>第三方采购</button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-black text-slate-900"><Term term="延保">延长保修</Term>采购</h3>
          <p className="text-xs text-slate-500 mt-2 min-h-12">原厂延保客单价高、客户易接受；第三方延保利润高但转化更难。</p>
          <div className="flex bg-slate-100 p-1 rounded-lg mt-4">
            <button onClick={() => onStrategyChange('warranty', 'OEM')} className={'flex-1 text-sm py-2 rounded-md font-bold transition-all ' + (strategy.warranty === 'OEM' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>原厂延保</button>
            <button onClick={() => onStrategyChange('warranty', '3RD')} className={'flex-1 text-sm py-2 rounded-md font-bold transition-all ' + (strategy.warranty === '3RD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>第三方延保</button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-900 mb-3">当前衍生贡献</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3"><p className="text-xs text-slate-400"><Term term="衍生业务">衍生收入</Term></p><p className="font-black text-blue-600">{formatMoney(monthlyStats.derivativeRevenue)}</p></div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3"><p className="text-xs text-slate-400"><Term term="衍生业务">衍生成本</Term></p><p className="font-black text-red-600">{formatMoney(monthlyStats.derivativeCost)}</p></div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3"><p className="text-xs text-slate-400"><Term term="金融佣金">金融佣金</Term></p><p className="font-black text-emerald-600">{formatMoney(monthlyStats.financeCommission)}</p></div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3"><p className="text-xs text-slate-400"><Term term="续保">续保佣金</Term></p><p className="font-black text-emerald-600">{formatMoney(monthlyStats.insuranceRenewalRevenue)}</p></div>
        </div>
      </div>
    </div>
  );
}
