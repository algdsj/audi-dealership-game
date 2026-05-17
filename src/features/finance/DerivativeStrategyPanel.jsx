import React from 'react';
import { Icons } from '../../shared/ui/icons.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

function StrategyToggle({ active, leftLabel, rightLabel, onLeft, onRight }) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg">
      <button onClick={onLeft} className={'flex-1 text-sm py-1.5 rounded-md font-bold transition-all  ' + (active === 'OEM' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>{leftLabel}</button>
      <button onClick={onRight} className={'flex-1 text-sm py-1.5 rounded-md font-bold transition-all  ' + (active === '3RD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>{rightLabel}</button>
    </div>
  );
}

export function DerivativeStrategyPanel({
  strategy,
  creditLimit,
  formatMoney,
  onStrategyChange,
}) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
      <h3 className="font-bold text-lg text-blue-900 mb-1 flex items-center gap-2"><Icons.Shield /> <Term term="衍生业务">衍生业务</Term>采购策略 (高毛利板块)</h3>
      <p className="text-xs text-blue-700 mb-4">前端卖车往往倒挂亏本，必须配合销售<Term term="衍生业务">衍生业务</Term>来弥补毛利。根据厂家政策合理分配原厂件比例。</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-2">保险代理业务</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-3 h-10">强制合作主流保险公司。渗透率稳定在 80%，保司固定返佣 25%。</p>
          <div className="w-full py-2 bg-slate-100 text-slate-500 text-sm font-bold text-center rounded">策略固定 (无法更改)</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-2"><Term term="精品">精品</Term>装潢采购</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-3 h-10">原厂精品信任度高但毛利低；三方副厂件难推销但利润极高。</p>
          <StrategyToggle
            active={strategy.accessories}
            leftLabel="原厂采购"
            rightLabel="第三方采购"
            onLeft={() => onStrategyChange('accessories', 'OEM')}
            onRight={() => onStrategyChange('accessories', '3RD')}
          />
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-2"><Term term="延保">延长保修</Term>采购</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-3 h-10">原厂延保客单价高客户易接受；三方延保难推销但利润率夸张。</p>
          <StrategyToggle
            active={strategy.warranty}
            leftLabel="原厂延保"
            rightLabel="第三方延保"
            onLeft={() => onStrategyChange('warranty', 'OEM')}
            onRight={() => onStrategyChange('warranty', '3RD')}
          />
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm md:col-span-3 mt-2">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Icons.Bank /> 银企关系与动态<Term term="库存融资授信">授信</Term></h4>
          <p className="text-sm text-slate-500 mb-3">银行是"晴天送伞、雨天收伞"。您的<Term term="库存融资授信">库存融资授信</Term>额度将在每月最后一天重新评估，取决于您的【展厅硬件级别】、【上月营业收入】与【账上自有资金】。</p>
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">当前评估公式</p>
              <p className="text-sm font-bold text-slate-700">基础800万 + (展厅Lv × 200万) + (上月营收 × 40%) + (账上现金 × 30%)</p>
            </div>
            <div className="flex-1 text-center md:text-right">
              <p className="text-xs text-slate-500 mb-1">本月生效可用额度</p>
              <p className="text-2xl font-black text-blue-600">{formatMoney(creditLimit)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
