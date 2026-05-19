import React from 'react';
import { VEHICLE_SERIES_STRATEGY } from '../../game/config/vehicleStructure.js';

function getPaymentMethodLabel(paymentMethod) {
  if (paymentMethod === 'cash') return '现金采购';
  if (paymentMethod === 'loan') return '库存融资采购';
  if (paymentMethod === 'draft6') return '6个月汇票采购';
  return '3个月汇票采购';
}

export function OrderTab({
  pendingOrders,
  currentDay,
  carModels,
  manufacturerPolicy,
  getDynamicRebate,
  getDynamicMsrp,
  onOpenOrderForm,
}) {
  const purchaseTarget = manufacturerPolicy?.purchaseTarget || { targetUnits: 0, purchasedUnits: 0 };
  const activeCommitments = manufacturerPolicy?.commitments?.active || [];
  const regionRole = manufacturerPolicy?.roles?.region || { relationship: 64, attitudeLabel: '稳定', tone: 'text-blue-700 bg-blue-50 border-blue-200' };
  const targetProgress = purchaseTarget.targetUnits > 0
    ? Math.min(160, Math.round((purchaseTarget.purchasedUnits / purchaseTarget.targetUnits) * 100))
    : 0;
  const extraUnits = Math.max(0, (purchaseTarget.purchasedUnits || 0) - (purchaseTarget.targetUnits || 0));
  const structureItems = purchaseTarget.structure?.items || [];
  const structureGapItems = structureItems.filter(item => (item.purchasedUnits || 0) < (item.targetUnits || 0));
  const seriesList = [...new Set(carModels.map(model => model.series).filter(Boolean))]
    .sort((a, b) => (VEHICLE_SERIES_STRATEGY[b]?.showroomWeight || 0) - (VEHICLE_SERIES_STRATEGY[a]?.showroomWeight || 0));

  return (
    <div>
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold">向厂家订货采购</h2>
        <p className="text-slate-500 text-sm mt-1">下单后车辆需经厂家排产发运，物流周期3~7天。资金不足时可使用银行库存融资。</p>
      </div>

      <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h3 className="font-black text-indigo-950">厂家采购目标 M{purchaseTarget.month || manufacturerPolicy?.policyMonth || 1}</h3>
            <p className="mt-1 text-sm text-indigo-800">
              本月累计采购 <b>{purchaseTarget.purchasedUnits || 0}</b> / {purchaseTarget.targetUnits || 0} 台。
              {extraUnits > 0 ? ` 当前已超采 ${extraUnits} 台，月底将随机结算厂家奖励。` : ' 超过目标后，月底有机会获得随机商务奖励。'}
            </p>
            <p className="mt-2 text-xs font-bold text-indigo-700">
              大区关系：{Math.round(regionRole.relationship || 0)}/100 · {regionRole.attitudeLabel || '稳定'}
            </p>
          </div>
          {purchaseTarget.lastReward && (
            <div className="rounded-lg border border-white/70 bg-white px-3 py-2 text-xs text-indigo-800">
              <p className="font-black">上次奖励：{purchaseTarget.lastReward.label}</p>
              <p className="mt-1">{purchaseTarget.lastReward.desc}</p>
            </div>
          )}
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full border border-indigo-100 bg-white">
          <div
            className={(extraUnits > 0 ? 'bg-emerald-500' : 'bg-indigo-500') + ' h-full transition-all'}
            style={{ width: `${Math.min(100, targetProgress)}%` }}
          ></div>
        </div>
        <p className="mt-2 text-[10px] font-bold text-indigo-700">
          超采奖励可能是现金奖励、市场共投或库存融资支持函；多采会换支持，也会带来库容和资金压力。
        </p>
        {structureItems.length > 0 && (
          <div className="mt-3 rounded-lg border border-white/70 bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black text-indigo-500">车型结构任务预警</p>
              <span className="text-[10px] font-black text-indigo-700">
                {structureItems.length - structureGapItems.length}/{structureItems.length}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {structureItems.map(item => {
                const gap = Math.max(0, (item.targetUnits || 0) - (item.purchasedUnits || 0));
                return (
                  <div key={item.id} className={(gap > 0 ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-emerald-100 bg-emerald-50 text-emerald-800') + ' rounded border px-2 py-1.5 text-[10px] font-bold'}>
                    {item.label}：{item.purchasedUnits || 0}/{item.targetUnits || 0}{gap > 0 ? ` · 还差${gap}台` : ' · 已达成'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeCommitments.length > 0 && (
          <div className="mt-3 rounded-lg border border-white/70 bg-white px-3 py-2">
            <p className="text-[10px] font-black text-indigo-500">厂家承诺</p>
            {activeCommitments.map(commitment => (
              <p key={commitment.id} className="mt-1 text-xs font-bold text-indigo-900">
                {commitment.label}：{commitment.metricLabel}不少于 {commitment.targetValue}
                <span className="ml-2 text-indigo-500">来源：{commitment.sourceRewardLabel}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {pendingOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">🚛 在途车辆 ({pendingOrders.reduce((sum, order) => sum + order.quantity, 0)} 台)</h3>
          <div className="space-y-2">
            {pendingOrders.map(order => (
              <div key={order.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100">
                <div>
                  <p className="font-bold text-sm text-slate-700">{order.modelName} × {order.quantity} ({order.color}色)</p>
                  <p className="text-[10px] text-slate-400">{getPaymentMethodLabel(order.paymentMethod)}{order.draftId ? ` · ${order.draftId}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-600 font-bold">
                    {order.arriveDay - currentDay > 0 ? `${order.arriveDay - currentDay}天后到货` : '明日到货'}
                  </p>
                  <p className="text-[10px] text-slate-400">预计D{((order.arriveDay - 1) % 30) + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {seriesList.map(series => {
          const seriesModels = carModels.filter(model => model.series === series);
          if (seriesModels.length === 0) return null;

          return (
            <div key={series} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                <span className="font-black text-xl text-slate-800">{series} 车系</span>
                <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600">主打: {seriesModels[0].segment}群体</span>
                {VEHICLE_SERIES_STRATEGY[series]?.role && (
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded-full text-blue-700">{VEHICLE_SERIES_STRATEGY[series].role}</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {seriesModels.map(model => (
                  <div key={model.id} className="p-5 hover:bg-slate-50 transition-colors relative overflow-hidden flex flex-col">
                    <div className={'absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full  ' + model.color + ' opacity-30'}></div>
                    <h3 className="font-bold text-lg mb-3 relative z-10">{model.trim}</h3>
                    <div className="space-y-1 text-sm text-slate-600 mb-5 relative z-10">
                      <p className="flex justify-between"><span>提车成本:</span> <span className="font-bold text-slate-800">¥{model.baseCost.toLocaleString()}</span></p>
                      <p className="flex justify-between"><span>厂家返利:</span> <span className="font-bold text-green-600">¥{getDynamicRebate(model.id).toLocaleString()}</span></p>
                      <p className="flex justify-between"><span>官方指导价:</span> <span className="font-bold text-slate-700">¥{getDynamicMsrp(model.id).toLocaleString()}</span></p>
                    </div>
                    <div className="flex flex-col gap-2 relative z-10 mt-auto">
                      <button onClick={() => onOpenOrderForm({ isOpen: true, model, quantity: 1, color: '黑', paymentMethod: 'draft3' })} className="w-full py-2.5 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm font-bold shadow-sm transition-colors">
                        配置并采购车辆
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
