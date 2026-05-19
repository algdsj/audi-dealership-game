import React from 'react';
import { BI_RISK_META } from '../../game/config/businessIntelligence.js';
import { MiniTrendChart } from '../../shared/ui/charts.jsx';
import { Icons } from '../../shared/ui/icons.jsx';

const percent = value => `${Math.round((Number(value) || 0) * 100)}%`;
const number = value => Math.round(Number(value) || 0).toLocaleString();

function RiskBadge({ level }) {
  const meta = BI_RISK_META[level] || BI_RISK_META.healthy;
  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

function KpiCard({ label, value, detail, tone = 'slate' }) {
  const toneClass = {
    slate: 'text-slate-900',
    green: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
  }[tone] || 'text-slate-900';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function FunnelBar({ item }) {
  const width = Math.max(4, Math.min(100, Math.round((Number(item.rate) || 0) * 100)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-500">
        <span>{item.label}</span>
        <span>{number(item.value)} · {percent(item.rate)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ProfitMixBar({ item, maxAbsValue, formatMoney }) {
  const width = maxAbsValue > 0 ? Math.max(4, Math.round((Math.abs(item.value) / maxAbsValue) * 100)) : 4;
  const valueClass = item.value >= 0 ? 'text-emerald-700' : 'text-red-700';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-slate-500">{item.label}</span>
        <span className={valueClass}>{item.value >= 0 ? '+' : ''}{formatMoney(item.value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ActionCard({ action, onSelectTab }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <RiskBadge level={action.level} />
          <h4 className="font-black text-slate-900">{action.title}</h4>
        </div>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{action.body}</p>
      </div>
      <button
        type="button"
        onClick={() => onSelectTab(action.tab)}
        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100"
      >
        去处理
      </button>
    </div>
  );
}

function TrendCard({ label, values, color, formatValue }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-black text-slate-400">{label}</p>
        <p className="text-xs font-bold text-slate-500">近6期</p>
      </div>
      <MiniTrendChart values={values} color={color} formatValue={formatValue} />
    </div>
  );
}

function VehicleStructureCard({ vehicleStructure, formatMoney, onSelectTab }) {
  const rows = (vehicleStructure?.rows || []).filter(row => row.inventory + row.transit + row.showroom + row.sales > 0).slice(0, 5);
  const recommendations = vehicleStructure?.recommendations || [];
  const summary = vehicleStructure?.summary || {};

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">车型结构</h3>
          <p className="text-xs font-bold text-slate-400">
            库存 {summary.totalInventory || 0} · 在途 {summary.totalTransit || 0} · 展车 {summary.totalShowroom || 0}
          </p>
        </div>
        {recommendations[0] && (
          <button
            type="button"
            onClick={() => onSelectTab(recommendations[0].tab || 'showroom')}
            className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100"
          >
            处理结构建议
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2">
          {rows.length > 0 ? rows.map(row => {
            const width = Math.max(5, Math.round((row.share || 0) * 100));
            return (
              <div key={row.series} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{row.label} · {row.role}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">
                      库存 {row.inventory} / 展厅 {row.showroom} / 在途 {row.transit} / 销量 {row.sales}
                    </p>
                  </div>
                  <p className="text-right text-xs font-black text-slate-600">{formatMoney(row.capital)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          }) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
              暂无车型结构样本，订车或成交后生成诊断。
            </div>
          )}
        </div>

        <div className="space-y-2">
          {recommendations.length > 0 ? recommendations.map(item => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1 flex items-center gap-2">
                <RiskBadge level={item.level} />
                <p className="text-sm font-black text-slate-900">{item.title}</p>
              </div>
              <p className="text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              车型结构暂无明显风险，继续观察线索和展厅转化。
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function BusinessIntelligenceTab({ businessIntelligence, formatMoney, onSelectTab }) {
  const bi = businessIntelligence || {};
  const kpis = bi.kpis || {};
  const riskItems = bi.riskItems || [];
  const actions = bi.actions || [];
  const profitMix = bi.profitMix || [];
  const maxProfitAbs = Math.max(1, ...profitMix.map(item => Math.abs(Number(item.value) || 0)));
  const cashTone = kpis.cashCoverageDays < 10 ? 'red' : kpis.cashCoverageDays < 18 ? 'amber' : 'green';
  const profitTone = kpis.netProfit >= 0 ? 'green' : 'red';

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Icons.Wallet /> 经营BI</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">把销量、现金、库存、CSI 和厂家目标压缩成一张经营驾驶舱。</p>
        </div>
        <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
          M{bi.month} · D{bi.dayOfMonth}
        </span>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-blue-500">今日经营判断</p>
            <h3 className="mt-1 text-xl font-black text-slate-900">{bi.headline}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{bi.headlineDetail}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab(actions[0]?.tab || 'reports')}
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            打开处理页
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="销量达成" value={percent(kpis.salesProgress)} detail={`节奏 ${percent(kpis.salesPace)} · 目标跟进`} tone={kpis.salesPace < 0.65 ? 'red' : kpis.salesPace < 0.85 ? 'amber' : 'green'} />
        <KpiCard label="净利润" value={formatMoney(kpis.netProfit)} detail={`净利率 ${percent(kpis.netMargin)} · 毛利率 ${percent(kpis.grossMargin)}`} tone={profitTone} />
        <KpiCard label="现金覆盖" value={`${kpis.cashCoverageDays || 0}天`} detail={`资产负债率 ${percent(kpis.debtRatio)} · 汇票/贷款要跟进`} tone={cashTone} />
        <KpiCard label="库存健康" value={`${kpis.agedInventoryCount || 0}/${kpis.inventoryCount || 0}`} detail={`长库龄/总库存 · 在途 ${kpis.orderUnits || 0} 台`} tone={kpis.agedInventoryCount > 0 ? 'amber' : 'green'} />
        <KpiCard label="客户转化" value={percent(kpis.leadConversion)} detail={`邀约 ${percent(kpis.inviteConversion)} · 机会 ${kpis.activeOpportunities || 0} 个`} tone={kpis.leadConversion < 0.07 ? 'red' : kpis.leadConversion < 0.12 ? 'amber' : 'blue'} />
        <KpiCard label="厂家采购" value={percent(kpis.purchaseProgress)} detail={`二手库存 ${kpis.usedCarStock || 0} · 待回访 ${kpis.followUps || 0}`} tone={kpis.purchaseProgress < 0.75 ? 'amber' : 'green'} />
      </div>

      <VehicleStructureCard vehicleStructure={bi.vehicleStructure} formatMoney={formatMoney} onSelectTab={onSelectTab} />

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black text-slate-900">客户漏斗</h3>
          <div className="space-y-4">
            {(bi.funnel || []).map(item => <FunnelBar key={item.id} item={item} />)}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black text-slate-900">利润来源</h3>
          <div className="space-y-4">
            {profitMix.map(item => (
              <ProfitMixBar key={item.id} item={item} maxAbsValue={maxProfitAbs} formatMoney={formatMoney} />
            ))}
          </div>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">风险雷达</h3>
            <p className="text-xs font-bold text-slate-400">用于判断下一步经营动作</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {riskItems.map(item => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-slate-400">{item.label}</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{item.value}</p>
                  </div>
                  <RiskBadge level={item.level} />
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">优先动作</h3>
            <p className="text-xs font-bold text-slate-400">{actions.length} 项</p>
          </div>
          <div className="space-y-3">
            {actions.length > 0 ? actions.map(action => (
              <ActionCard key={action.id} action={action} onSelectTab={onSelectTab} />
            )) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                暂无高优先级动作，继续盯住现金、库存和厂家目标。
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TrendCard label="净利润趋势" values={bi.trends?.netProfit || []} color="#059669" formatValue={formatMoney} />
        <TrendCard label="销量趋势" values={bi.trends?.sales || []} color="#2563eb" formatValue={value => `${number(value)}台`} />
        <TrendCard label="CSI趋势" values={bi.trends?.csi || []} color="#f59e0b" formatValue={value => `${number(value)}分`} />
      </div>
    </div>
  );
}
