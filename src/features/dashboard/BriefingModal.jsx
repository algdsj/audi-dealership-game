import { Term } from '../../shared/ui/tooltip.jsx';

export function BriefingModal({
  isOpen,
  month,
  dayOfMonth,
  briefingMetrics,
  marketEnvironment,
  todoQueue,
  onOpenTask,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-2xl font-black text-slate-800">今日晨会简报</h3>
            <p className="text-sm text-slate-500">M{month} D{dayOfMonth} · 店总经营看板</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {briefingMetrics.map(item => (
            <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 mb-1">{item.label}</p>
              <p className="text-sm font-bold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-5">
          <h4 className="font-bold text-sky-900 mb-2">🌐 市场与供应链</h4>
          <p className="text-sm text-sky-800 leading-relaxed">
            {marketEnvironment.seasonName}：{marketEnvironment.seasonDesc} {marketEnvironment.competitorEvent.desc} {marketEnvironment.supplyChain.desc}
          </p>
        </div>

        <div className="mb-5">
          <h4 className="font-bold text-slate-800 mb-3">待办优先级</h4>
          <div className="space-y-2">
            {todoQueue.length === 0 && <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4 text-center">暂无紧急待办，保持经营节奏。</p>}
            {todoQueue.map(item => (
              <button key={`brief-${item.title}-${item.tab}`} onClick={() => onOpenTask(item)} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-sm text-slate-800">{item.title}</p>
                  <span className={'text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ' + (item.level === 'high' ? 'bg-red-100 text-red-600' : item.level === 'mid' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600')}>
                    {item.level === 'high' ? '紧急' : item.level === 'mid' ? '关注' : '提示'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-4">
          <h4 className="font-bold mb-2">晨会口径</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            先保现金流，再保库存结构；前端新车可以薄利，但要用金融、<Term term="精品">精品</Term>、售后和<Term term="续保">续保</Term>把<Term term="GP3">GP3</Term>做起来。月底前重点盯销量达成、<Term term="邀约到店率">邀约到店率</Term>、<Term term="销售转化率">销售转化率</Term>和<Term term="CSI">CSI</Term>。
          </p>
        </div>
      </div>
    </div>
  );
}
