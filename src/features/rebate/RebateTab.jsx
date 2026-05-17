import React from 'react';
import { Icons } from '../../shared/ui/icons.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

export function RebateTab({
  aiAdvice,
  isGeneratingAdvice,
  manufacturerPolicy,
  monthlyStats,
  targetProgress,
  dayOfMonth,
  inviteRateVal,
  convertRateVal,
  csi,
  formatMoney,
  onAskAIConsultant,
}) {
  const purchaseTarget = manufacturerPolicy.purchaseTarget || { targetUnits: 0, purchasedUnits: 0, history: [] };
  const hqRole = manufacturerPolicy.roles?.hq || { label: '厂家总部', relationship: 62, attitudeLabel: '稳定', tone: 'text-blue-700 bg-blue-50 border-blue-200', focus: [] };
  const regionRole = manufacturerPolicy.roles?.region || { label: '区域大区', relationship: 64, attitudeLabel: '稳定', tone: 'text-blue-700 bg-blue-50 border-blue-200', focus: [] };
  const purchaseProgress = purchaseTarget.targetUnits > 0
    ? Math.round((purchaseTarget.purchasedUnits / purchaseTarget.targetUnits) * 100)
    : 0;
  const purchaseExtraUnits = Math.max(0, (purchaseTarget.purchasedUnits || 0) - (purchaseTarget.targetUnits || 0));
  const activeCommitments = manufacturerPolicy.commitments?.active || [];
  const commitmentHistory = manufacturerPolicy.commitments?.history || [];
  const getCommitmentActual = commitment => (
    commitment.typeId === 'purchase_floor'
      ? (monthlyStats.purchaseUnits || 0)
      : commitment.typeId === 'sales_floor'
      ? (monthlyStats.sales || 0)
      : Math.round(csi.score || 0)
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Sparkles /> <Term term="返利系数">返利</Term>考核与经营诊断</h2>
          <p className="text-slate-500 text-sm mt-1">实时监控厂家任务进度，获取 AI 经营专家的毒舌建议。</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 mb-6 shadow-md border border-slate-700 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg"><Icons.Sparkles /></div>
        <div className="flex-1 text-slate-300">
          <h3 className="text-white font-bold text-lg mb-1">✨ AI 店总经营顾问</h3>
          <p className="text-sm italic mb-2">"{aiAdvice}"</p>
        </div>
        <button onClick={onAskAIConsultant} disabled={isGeneratingAdvice} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0">
          {isGeneratingAdvice ? '分析中...' : '免费咨询建议'}
        </button>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6 shadow-sm">
        <h3 className="font-bold text-lg text-emerald-900 mb-3 flex items-center gap-2">📋 厂家商务政策 (M{manufacturerPolicy.policyMonth}月生效)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[
            { role: hqRole, subtitle: '总部：返利、指导价、CSI、品牌纪律' },
            { role: regionRole, subtitle: '大区：采购配额、区域份额、库存消化、市场共投' },
          ].map(({ role, subtitle }) => (
            <div key={role.label} className="rounded-lg border border-white/70 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{role.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                </div>
                <span className={(role.tone || 'text-blue-700 bg-blue-50 border-blue-200') + ' rounded-full border px-2 py-1 text-[10px] font-black'}>
                  {role.attitudeLabel || '稳定'} · {Math.round(role.relationship || 0)}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400">{role.lastChange || '关系稳定。'}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
            <p className="text-[10px] text-slate-400 mb-1"><Term term="返利系数">返利系数</Term></p>
            <p className={'text-2xl font-black  ' + (manufacturerPolicy.rebateMultiplier >= 1 ? 'text-green-600' : 'text-red-600')}>×{manufacturerPolicy.rebateMultiplier.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">{manufacturerPolicy.rebateMultiplier >= 1 ? '返利加成' : '返利缩减'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
            <p className="text-[10px] text-slate-400 mb-1">指导价调整</p>
            <p className={'text-2xl font-black  ' + (manufacturerPolicy.msrpTrend >= 0 ? 'text-orange-600' : 'text-blue-600')}>{manufacturerPolicy.msrpTrend >= 0 ? '+' : ''}{manufacturerPolicy.msrpTrend.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400">{manufacturerPolicy.msrpTrend >= 0 ? '指导价上浮' : '指导价下调'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
            <p className="text-[10px] text-slate-400 mb-1">最近调整</p>
            <p className="text-xs font-bold text-slate-700 leading-tight">{manufacturerPolicy.lastChange}</p>
          </div>
        </div>
        <div className="bg-white/60 p-3 rounded-lg border border-emerald-100">
          <p className="text-xs text-slate-600 leading-relaxed">
            <b>政策关联规则：</b>达成率越高，<Term term="返利系数">返利系数</Term>越大（厂家奖励优秀经销商）；未达标时厂家可能加大返利促销救市，但指导价承压下调。
            随机政策事件（新车上市/原材料涨价等）会叠加影响。<Term term="二网批售">二网批售</Term>价 = 动态指导价 × 90%。
          </p>
        </div>
        {manufacturerPolicy.history.length > 1 && (
          <div className="mt-3 max-h-32 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-500 mb-1">政策历史</p>
            <div className="space-y-1">
              {[...manufacturerPolicy.history].reverse().slice(0, 6).map((historyItem, index) => (
                <div key={index} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="font-bold text-slate-400 shrink-0">M{historyItem.month}</span>
                  <span className="truncate">{historyItem.desc}</span>
                  <span className="shrink-0 ml-auto">返利×{historyItem.rebate.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="font-bold text-lg text-slate-800">本月厂家考核指标</h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">进度: D{dayOfMonth}/30</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">月度销量任务 <span className="text-blue-600 font-normal">(占返利80%)</span></p>
            <div className="flex items-end gap-2 mb-2"><span className="text-3xl font-black text-slate-800">{monthlyStats.sales}</span><span className="text-slate-500">/ {monthlyStats.target} 台</span></div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className={'h-full  ' + (monthlyStats.sales >= monthlyStats.target ? 'bg-green-500' : 'bg-blue-500')} style={{ width: `${targetProgress}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">阶梯折算：&lt;80%折半，&gt;120%拿1.2倍。</p>
          </div>
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <p className="text-sm font-bold text-slate-700 mb-1">过程漏斗考核 <span className="text-blue-600 font-normal">(占返利20%)</span></p>
            <div>
              <p className="text-xs text-slate-500 flex justify-between">
                <span>邀约到店率 (目标 10%)</span>
                <span className={inviteRateVal >= 0.1 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{(inviteRateVal * 100).toFixed(1)}%</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 flex justify-between">
                <span>销售转化率 (目标 20%)</span>
                <span className={convertRateVal >= 0.2 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{(convertRateVal * 100).toFixed(1)}%</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-tight mt-2">单项达标拿一半，两项均达标拿满，不达标扣除当项份额。</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200 flex flex-col justify-center text-center shadow-inner">
            <p className="text-xs text-slate-500 mb-1">CSI满意度</p>
            <p className={'text-2xl font-black  ' + (csi.score < 85 ? 'text-red-600' : csi.score >= 95 ? 'text-green-600' : 'text-blue-600')}>{Math.round(csi.score)}分</p>
            <p className="text-[10px] text-slate-400">本月投诉: {csi.complaints}次</p>
            {csi.score < 85 && <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ CSI过低，返利将打折！</p>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-[10px] text-green-600 font-bold">转介绍线索数</p>
            <p className="text-xl font-black text-green-700">{monthlyStats.referralLeads || 0} 条</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-[10px] text-blue-600 font-bold">置换台数</p>
            <p className="text-xl font-black text-blue-700">{monthlyStats.tradeInCount || 0} 台</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-[10px] text-amber-600 font-bold">置换补贴</p>
            <p className="text-xl font-black text-amber-700">{formatMoney(monthlyStats.tradeInSubsidy)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-center text-center shadow-inner">
            <p className="text-xs text-slate-500 mb-1">当前预期最高总返利池</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(monthlyStats.baseRebatesPool)}</p>
            <p className="text-[10px] text-slate-400 mt-1">上月实发: {formatMoney(monthlyStats.lastMonthPayout)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">厂家采购目标</h3>
            <p className="text-sm text-slate-500 mt-1">厂家鼓励经销商提前锁定配额，超采会随机给商务奖励，但库存和融资压力由门店承担。</p>
          </div>
          <span className={(purchaseExtraUnits > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200') + ' rounded-full border px-3 py-1 text-xs font-black'}>
            {purchaseExtraUnits > 0 ? `已超采 ${purchaseExtraUnits} 台` : `进度 ${purchaseProgress}%`}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
            <p className="text-[10px] font-bold text-indigo-600">本月采购</p>
            <p className="text-2xl font-black text-indigo-800">{purchaseTarget.purchasedUnits || 0} / {purchaseTarget.targetUnits || 0} 台</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-bold text-emerald-600">超采状态</p>
            <p className="text-xl font-black text-emerald-700">{purchaseExtraUnits > 0 ? `超采 ${purchaseExtraUnits} 台` : '尚未超采'}</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] font-bold text-amber-600">最近奖励</p>
            <p className="text-sm font-black text-amber-800">{purchaseTarget.lastReward ? `${purchaseTarget.lastReward.label} ${formatMoney(purchaseTarget.lastReward.amount)}` : '暂无'}</p>
          </div>
        </div>
        {(purchaseTarget.history || []).length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-500">采购目标历史</p>
            {(purchaseTarget.history || []).slice(0, 4).map(item => (
              <div key={`${item.month}_${item.targetUnits}_${item.purchasedUnits}`} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-black text-slate-800">M{item.month}</span>
                <span>{item.purchasedUnits}/{item.targetUnits} 台</span>
                <span className="ml-auto font-bold">{item.reward ? item.reward.label : '未触发奖励'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">厂家承诺条件</h3>
            <p className="text-sm text-slate-500 mt-1">拿到厂家支持后，下月可能附带采购、销量或 CSI 承诺；兑现改善返利支持，违约会压低厂家政策。</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {activeCommitments.length > 0 ? `${activeCommitments.length} 个进行中` : '暂无进行中'}
          </span>
        </div>
        {activeCommitments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-400">
            当前没有厂家承诺。超采拿到奖励后，厂家可能在下月附带承诺条件。
          </p>
        ) : (
          <div className="space-y-3">
            {activeCommitments.map(commitment => {
              const actual = getCommitmentActual(commitment);
              const progress = commitment.targetValue ? Math.min(100, Math.round((actual / commitment.targetValue) * 100)) : 0;
              const achieved = actual >= (commitment.targetValue || 0);
              return (
                <div key={commitment.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-indigo-900">{commitment.label}</p>
                      <p className="mt-1 text-xs text-indigo-700">{commitment.desc}</p>
                    </div>
                    <span className={(achieved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-indigo-700 border-indigo-200') + ' shrink-0 rounded-full border px-2 py-1 text-[10px] font-black'}>
                      {actual}/{commitment.targetValue}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className={(achieved ? 'bg-emerald-500' : 'bg-indigo-500') + ' h-full'} style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-indigo-500">来源：{commitment.sourceRewardLabel}</p>
                </div>
              );
            })}
          </div>
        )}
        {commitmentHistory.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-500">承诺历史</p>
            {commitmentHistory.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-black text-slate-800">M{item.month}</span>
                <span>{item.label}</span>
                <span className={(item.achieved ? 'text-emerald-700' : 'text-red-600') + ' ml-auto font-bold'}>{item.achieved ? '已兑现' : '已违约'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
