import { Term } from '../../shared/ui/tooltip.jsx';

export function ApprovalCenter({
  pendingApprovalCases,
  investorRelations,
  formatMoney,
  onPriceApproval,
  onResolveNegotiation,
  onComplaintResolution,
}) {
  if (pendingApprovalCases.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-slate-800">总经理审批中心</h3>
          <p className="text-xs text-slate-500 mt-1">价格权限、客户投诉、临门一脚事项都在这里拍板。</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
          {pendingApprovalCases.length} 项待处理
        </span>
      </div>
      <div className="space-y-3">
        {pendingApprovalCases.map(item => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {item.type === 'price' ? (
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-blue-600">价格审批 · {item.customerTag} · D{item.dueDay}前有效</p>
                    <h4 className="font-bold text-slate-800 mt-1">{item.modelName}</h4>
                    <p className="text-xs text-slate-500 mt-1">挂牌 {formatMoney(item.currentPrice)}，客户要求 {formatMoney(item.requestedPrice)}，竞品报价约 {formatMoney(item.competitorPrice)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className={(item.grossProfit >= 0 ? 'text-green-600' : 'text-red-600') + ' text-lg font-black'}>{formatMoney(item.grossProfit)}</p>
                    <p className="text-[10px] text-slate-400">预计综合毛利</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                  <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400">底线预警</p><p className="font-bold">{formatMoney(item.minimumGuardPrice)}</p></div>
                  <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400">成交把握</p><p className="font-bold text-blue-600">{item.closeChance}%</p></div>
                  <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400"><Term term="返利池">返利入池</Term></p><p className="font-bold text-green-600">{formatMoney(item.rebate)}</p></div>
                  <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400"><Term term="衍生业务">衍生金融</Term></p><p className="font-bold text-green-600">{formatMoney(item.derivativeProfit + item.financeCommission)}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onPriceApproval(item.id, 'requested')} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors">同意 {formatMoney(item.requestedPrice)}</button>
                  <button onClick={() => onPriceApproval(item.id, 'counter')} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors">反批 {formatMoney(item.counterPrice)}</button>
                  <button onClick={() => onPriceApproval(item.id, 'list')} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors">坚持原价</button>
                  <button onClick={() => onPriceApproval(item.id, 'reject')} className="px-3 py-2 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition-colors">放弃客户</button>
                </div>
              </>
            ) : item.type === 'negotiation' ? (
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-violet-600">外部谈判 · {item.from} · D{item.dueDay}前有效</p>
                    <h4 className="font-bold text-slate-800 mt-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-lg font-black text-violet-600">{investorRelations.trust}</p>
                    <p className="text-[10px] text-slate-400">投资人信任</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {item.options.map(option => (
                    <button key={option.id} onClick={() => onResolveNegotiation(item.id, option.id)} className="text-left rounded-lg bg-white hover:bg-violet-50 border border-violet-100 hover:border-violet-300 p-3 transition-colors">
                      <p className="text-xs font-bold text-slate-800">{option.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{option.desc}</p>
                      <p className="text-[10px] text-violet-600 font-bold mt-2">基础成功率 {Math.round(option.successRate * 100)}%</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-red-600">客诉处理 · {item.source}端 · D{item.dueDay}前有效</p>
                    <h4 className="font-bold text-slate-800 mt-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-lg font-black text-red-600">-{item.impact}</p>
                    <p className="text-[10px] text-slate-400">放任<Term term="CSI">CSI</Term>风险</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onComplaintResolution(item.id, 'call')} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors">电话安抚</button>
                  <button onClick={() => onComplaintResolution(item.id, 'care')} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors">补偿 {formatMoney(item.careCost)}</button>
                  <button onClick={() => onComplaintResolution(item.id, 'strong')} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors">强力闭环 {formatMoney(item.strongCost)}</button>
                  <button onClick={() => onComplaintResolution(item.id, 'reject')} className="px-3 py-2 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition-colors">拒绝处理</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
