import { useMemo, useState } from 'react';
import { COMPETITOR_BRANDS, COMPETITOR_INTEL_ACTIONS, COMPETITOR_STRATEGIES } from '../../game/config/market.js';
import { VEHICLE_SERIES_COMPETITOR_MAP } from '../../game/config/vehicleStructure.js';
import { buildCompetitorIntelSnapshot, getCompetitorIntelActionCost } from '../../game/engine/competitorIntel.js';
import { MarketSharePie } from '../../shared/ui/charts.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

const COUNTERMEASURES = [
  ['price', '跟价降价', '抢回到店量', 60000],
  ['service', '差异化服务', '提升留存转化', 40000],
  ['referral', '老客转介绍', '低成本补客流', 16000],
  ['alliance', '联合抗竞', '本品店共同抗外部竞品', 20000],
  ['relation', '提升关系', '修复本品店默契', 30000],
  ['subsidy', '厂家补贴申请', '季度限次补贴', 0],
  ['poach', '反挖人', '削弱竞品团队', 50000],
  ['price_war', '价格战宣言', '大幅降价抢量', 90000],
  ['csi_push', '提升CSI', '长期口碑反制', 30000],
];

const parseTargetValue = value => {
  if (!value || value === 'default') return null;
  const [kind, id] = value.split(':');
  if (kind === 'brand') return { brand: id };
  if (kind === 'store') return { storeId: id };
  return null;
};

const uniqueBrands = stores => [...new Set(stores.map(store => store.brand).filter(Boolean))];

const buildTargetOptions = ({ type, visibleCompetitorStores }) => {
  const externalStores = visibleCompetitorStores.filter(store => store.brand !== 'audi_local');
  const audiStores = visibleCompetitorStores.filter(store => store.brand === 'audi_local');
  const externalBrandOptions = uniqueBrands(externalStores).map(brand => ({
    value: `brand:${brand}`,
    label: COMPETITOR_BRANDS[brand]?.label || brand,
  }));

  if (['price', 'service', 'csi_push'].includes(type)) {
    return [
      { value: 'default', label: '外部竞品（全部）' },
      ...externalBrandOptions,
    ];
  }
  if (type === 'price_war') {
    return [
      { value: 'default', label: '全市场' },
      ...uniqueBrands(visibleCompetitorStores).map(brand => ({
        value: `brand:${brand}`,
        label: COMPETITOR_BRANDS[brand]?.label || brand,
      })),
    ];
  }
  if (type === 'poach') {
    return externalStores.length > 0
      ? [
        { value: 'default', label: '威胁最高竞品' },
        ...externalStores.map(store => ({
        value: `store:${store.id}`,
        label: `${COMPETITOR_BRANDS[store.brand]?.label || store.brand} · ${store.name}`,
        })),
      ]
      : [{ value: 'default', label: '可见强势竞品' }];
  }
  if (type === 'alliance' || type === 'relation') {
    return [
      { value: 'default', label: '同城奥迪（全部）' },
      ...audiStores.map(store => ({ value: `store:${store.id}`, label: store.name })),
    ];
  }
  return [];
};

export function MarketTab({
  activeDifficulty,
  competitors,
  normalizedMarketShare,
  marketShareSegments,
  visibleCompetitorStores,
  hiddenCompetitorCount,
  activeRegion,
  marketEnvironment,
  finance,
  formatMoney,
  onCompetitorCountermeasure,
  onCompetitorIntelAction,
}) {
  const [countermeasureTargets, setCountermeasureTargets] = useState({});
  const audiLocalStores = visibleCompetitorStores.filter(store => store.brand === 'audi_local');
  const audiLocalRelationship = Math.round(audiLocalStores.reduce((sum, store) => sum + (store.relationship || 50), 0) / Math.max(1, audiLocalStores.length));
  const targetOptionsByType = useMemo(() => COUNTERMEASURES.reduce((options, [type]) => ({
    ...options,
    [type]: buildTargetOptions({ type, visibleCompetitorStores }),
  }), {}), [visibleCompetitorStores]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold">竞品市场</h2>
        <p className="text-slate-500 text-sm mt-1">同城竞品会降价、办活动和截流客户。<Term term="市场份额">市场份额</Term>会在每月月底更新。</p>
        {competitors.priceWarActive && <p className="mt-2 inline-flex rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-black text-red-700">本品价格战第{competitors.priceWarRound || 1}轮：毛利、转化和厂家关系承压</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-black text-slate-900 mb-4"><Term term="市场份额">市场份额</Term>结构</h3>
          <div className="flex items-center gap-5">
            <MarketSharePie items={marketShareSegments} />
            <div className="flex-1 space-y-2">
              {marketShareSegments.map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600"><i className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></i>{item.label}</span>
                  <span className="font-black text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-black text-slate-900 mb-3">月度竞争判断</h3>
          <p className="text-sm text-slate-600 leading-6">玩家奥迪当前份额 <b className="text-blue-600">{normalizedMarketShare.audi || 0}%</b>；同城本品店关系 <b>{audiLocalRelationship}</b>。若价格战持续，厂家会先警告再罚款；若选择关系修复和服务反制，短期销量慢一些，但长期毛利更稳。</p>
          {hiddenCompetitorCount > 0 && <p className="text-xs text-slate-400 mt-2">仍有 {hiddenCompetitorCount} 家低可见度竞品，可通过市场摸底识别；竞品出现明显动作后也会进入明细列表。</p>}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {['market_scout', 'customer_feedback'].map(actionId => {
              const action = COMPETITOR_INTEL_ACTIONS[actionId];
              const cost = getCompetitorIntelActionCost({ actionId, activeDifficulty });
              return (
                <button
                  key={actionId}
                  type="button"
                  onClick={() => onCompetitorIntelAction(actionId)}
                  disabled={!onCompetitorIntelAction || finance.cash < cost}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-left hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-sky-800">{action.name}</span>
                    <span className="text-xs font-black text-sky-600">{formatMoney(cost)}</span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{action.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200 rounded-xl p-5 mb-6 shadow-sm">
        <h3 className="font-bold text-lg text-sky-900 mb-3 flex items-center gap-2">🌐 市场环境系统</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-sky-100">
            <p className="text-[10px] text-slate-400 mb-1">区域竞争度</p>
            <p className="text-lg font-black text-slate-800">{activeRegion.name}</p>
            <p className="text-xs text-slate-500 mt-1">{activeRegion.desc}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-sky-100">
            <p className="text-[10px] text-slate-400 mb-1"><Term term="季节需求">季节需求</Term></p>
            <p className="text-xl font-black text-sky-700">{marketEnvironment.seasonName} ×{marketEnvironment.seasonIndex.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">{marketEnvironment.seasonDesc}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-sky-100">
            <p className="text-[10px] text-slate-400 mb-1">竞品事件</p>
            <p className="text-lg font-black text-orange-600">{marketEnvironment.competitorEvent.name}</p>
            <p className="text-xs text-slate-500 mt-1">{marketEnvironment.competitorEvent.desc}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-sky-100">
            <p className="text-[10px] text-slate-400 mb-1">供应链</p>
            <p className="text-lg font-black text-emerald-700">{marketEnvironment.supplyChain.name}</p>
            <p className="text-xs text-slate-500 mt-1">{marketEnvironment.supplyChain.desc}{marketEnvironment.supplyChain.delayDays > 0 ? ` 到货+${marketEnvironment.supplyChain.delayDays}天。` : ''}</p>
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-sky-100 p-3">
          <p className="text-[10px] font-bold text-slate-500 mb-1">近期市场历史</p>
          <div className="flex flex-wrap gap-2">
            {marketEnvironment.history.slice(-6).map((item, index) => (
              <span key={`${item.month}-${index}`} className="text-[10px] px-2 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200">M{item.month} {item.desc}</span>
            ))}
          </div>
        </div>
        <div className="mt-3 bg-white/70 rounded-lg border border-sky-100 p-3">
          <p className="text-[10px] font-bold text-slate-500 mb-2">车系竞品映射</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {Object.entries(VEHICLE_SERIES_COMPETITOR_MAP).map(([series, meta]) => (
              <div key={series} className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                <p className="text-xs font-black text-slate-800">{series}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-500">{meta.rivals.join(' / ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          ['玩家奥迪', normalizedMarketShare.audi || 0, 'text-blue-600'],
          ['宝马系', normalizedMarketShare.bmw || 0, 'text-sky-600'],
          ['奔驰系', normalizedMarketShare.benz || 0, 'text-slate-700'],
          ['新能源', normalizedMarketShare.ev || 0, 'text-emerald-600'],
          ['本品店', normalizedMarketShare.audiLocal || 0, 'text-indigo-600'],
          ['其他', normalizedMarketShare.other || 0, 'text-slate-500'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-[10px] text-slate-400">{label}</p>
            <p className={'text-2xl font-black ' + color}>{value}%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-3">
          {visibleCompetitorStores.map(store => {
            const strategyLabel = COMPETITOR_STRATEGIES.find(strategy => strategy.id === store.strategy)?.label || store.strategy;
            const intelSnapshot = buildCompetitorIntelSnapshot(store);
            const threat = intelSnapshot.threat;
            const threatTone = threat >= 90 ? 'text-red-600 bg-red-50 border-red-200' : threat >= 70 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
            const probeCost = getCompetitorIntelActionCost({ actionId: 'store_probe', activeDifficulty });

            return (
              <div key={store.id} className={'rounded-xl border p-4 shadow-sm ' + (store.currentActivity ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200')}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{store.brand === 'audi_local' ? '同城奥迪' : COMPETITOR_BRANDS[store.brand]?.label} · {store.name}</p>
                    <p className="text-xs text-slate-500 mt-1">策略：{strategyLabel} · <Term term="价格指数">价格指数</Term> {intelSnapshot.priceIndexLabel} · 上月销量{intelSnapshot.monthlySalesLabel}</p>
                    <p className="text-xs text-slate-600 mt-2">当前动态：{store.currentActivity ? `${store.currentActivity.effect}（剩${store.currentActivity.remainingDays}天）` : store.lastAction}</p>
                  </div>
                  <div className="text-right">
                    <span className={'inline-flex px-2 py-1 rounded-full border text-xs font-bold ' + threatTone}><Term term="竞品威胁">威胁</Term> {intelSnapshot.threatLabel}</span>
                    <p className={'mt-2 inline-flex px-2 py-1 rounded-full border text-[10px] font-black ' + intelSnapshot.level.tone}>情报 {intelSnapshot.confidence}/100 · {intelSnapshot.level.label}</p>
                    {store.brand === 'audi_local' && <p className="text-xs text-slate-500 mt-2">关系 {store.relationship}/100</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-400">数据来源：{intelSnapshot.dataLabel}</p>
                  <button
                    type="button"
                    onClick={() => onCompetitorIntelAction('store_probe', { storeId: store.id })}
                    disabled={!onCompetitorIntelAction || finance.cash < probeCost}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    定向摸底 · {formatMoney(probeCost)}
                  </button>
                </div>
                {store.brand === 'audi_local' && (
                  <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={(store.relationship >= 70 ? 'bg-emerald-500' : store.relationship >= 50 ? 'bg-amber-500' : 'bg-red-500') + ' h-full'} style={{ width: `${store.relationship || 0}%` }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-black text-slate-900 mb-3">反制措施</h3>
            {COUNTERMEASURES.map(([type, name, desc, cost]) => {
              const cooldown = competitors.cooldowns?.[type] || 0;
              const targetOptions = targetOptionsByType[type] || [];
              const targetValue = countermeasureTargets[type] || targetOptions[0]?.value || 'default';

              return (
                <div key={type} className="mb-2 rounded-lg border border-slate-200 p-3">
                  <div className="flex justify-between gap-3">
                    <p className="font-bold text-sm text-slate-800">{name}</p>
                    <span className="text-xs font-bold text-blue-600">{cooldown > 0 ? `${cooldown}天` : formatMoney(cost)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  {targetOptions.length > 0 ? (
                    <label className="mt-2 block">
                      <span className="text-[10px] font-black text-slate-400">目标</span>
                      <select
                        value={targetValue}
                        onChange={event => setCountermeasureTargets(prev => ({ ...prev, [type]: event.target.value }))}
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-300"
                      >
                        {targetOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="mt-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400">
                      目标：{type === 'subsidy' ? '厂家/区域政策' : '客户池防守'}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onCompetitorCountermeasure(type, parseTargetValue(targetValue))}
                    disabled={cooldown > 0 || finance.cash < cost}
                    className="mt-2 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-black text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    发起{name}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-black text-slate-900 mb-3">正在生效</h3>
            {(competitors.playerCountermeasures || []).length === 0 ? (
              <p className="text-sm text-slate-400">暂无反制措施。</p>
            ) : (
              <div className="space-y-2">
                {competitors.playerCountermeasures.map((item, index) => (
                  <div key={`${item.type}_${index}`} className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="font-bold">{item.name}</span>
                      <span className="text-slate-500">剩{item.remainingDays}天</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-blue-600">
                      目标：{item.targetSummary || '全市场竞品'}
                    </p>
                    {typeof item.intelConfidence === 'number' && (
                      <p className="mt-1 text-[10px] font-bold text-slate-400">情报可信度 {item.intelConfidence}/100</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-900 mb-3">情报时间线</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {(competitors.intelHistory || []).slice(0, 10).map((item, index) => (
            <div key={`${item.month}_${item.day}_${index}`} className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm">
              <p className="font-bold text-slate-800">M{item.month} D{item.day} · {item.source} · {item.reliability}</p>
              <p className="text-slate-600 mt-1">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
