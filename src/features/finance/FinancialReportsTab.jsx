import React from 'react';
import { MiniTrendChart } from '../../shared/ui/charts.jsx';
import { Icons } from '../../shared/ui/icons.jsx';
import { Term, Tooltip } from '../../shared/ui/tooltip.jsx';
import { DailyLedgerPanel } from './DailyLedgerPanel.jsx';
import { DerivativeStrategyPanel } from './DerivativeStrategyPanel.jsx';
import { ReportArchivePanel } from './ReportArchivePanel.jsx';

export function FinancialReportsTab({
  monthlyStats,
  drafts,
  finance,
  gmWealth,
  feedbackState,
  getRatingMeta,
  excellentMonthCount,
  ownerEquity,
  strategy,
  financeReportView,
  financeSnapshot,
  dailyLedger,
  month,
  formatMoney,
  onFinanceReportViewChange,
  onStrategyChange,
}) {
  const {
    gp1,
    gp2,
    afterSalesProfit,
    financeIncome,
    renewalIncome,
    usedCarProfit,
    gp3,
    opex,
    netProfit,
    unpaidDraftAmount,
    nearestDraft,
    draftCreditUsage,
    cashCoverageDays,
    ledgerIncome,
    ledgerExpense,
    draftDepositPaid,
    draftDuePaid,
    bailoutIn,
    bailoutRepay,
    inventoryAssetValue,
    virtualInventoryValue,
    usedCarAssetValue,
    balanceAssets,
    balanceLiabilities,
    debtRatio,
    realRevenueView,
    realCogsView,
    realRebateView,
    virtualRevenueView,
    virtualCogsView,
    virtualRebateView,
    recentRatingTrend,
  } = financeSnapshot;
  const targetProgress = monthlyStats.target > 0 ? Math.min(100, (monthlyStats.sales / monthlyStats.target) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Wallet /> 财务</h2>
          <p className="text-slate-500 text-sm mt-1">查看利润表、现金流量表、资产负债表和最近12个月趋势。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">本月销量/<Term term="厂家任务">厂家任务</Term></p>
          <p className="text-3xl font-black text-slate-900 mt-1">{monthlyStats.sales}/{monthlyStats.target}</p>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className={(monthlyStats.sales >= monthlyStats.target ? 'bg-green-500' : 'bg-blue-500') + ' h-full'} style={{ width: `${targetProgress}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">月底返利按销量达成、过程指标和<Term term="CSI">CSI</Term>折算。</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400"><Term term="返利池">返利池</Term></p>
          <p className="text-3xl font-black text-green-600 mt-1">{formatMoney(monthlyStats.baseRebatesPool)}</p>
          <p className="text-xs text-slate-500 mt-2">上月实发 {formatMoney(monthlyStats.lastMonthPayout)} · 上月达成 {Math.round((monthlyStats.lastMonthAchieve || 0) * 100)}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400"><Term term="承兑汇票">汇票风险</Term></p>
          <p className="text-3xl font-black text-red-600 mt-1">{formatMoney(unpaidDraftAmount)}</p>
          <p className="text-xs text-slate-500 mt-2"><Term term="银行信用">银行信用</Term> {drafts.bankReputation || 70}/100 · 已用<Term term="承兑汇票专项授信">授信</Term> {draftCreditUsage.toFixed(0)}%</p>
          {nearestDraft && <p className="text-xs font-bold text-amber-600 mt-1">最近到期：{nearestDraft.remainingDays}天后 {formatMoney(nearestDraft.amount * 0.8)}</p>}
        </div>
      </div>

      <ReportArchivePanel
        feedbackState={feedbackState}
        getRatingMeta={getRatingMeta}
        formatMoney={formatMoney}
        excellentMonthCount={excellentMonthCount}
        ownerEquity={ownerEquity}
      />

      <DerivativeStrategyPanel
        strategy={strategy}
        creditLimit={finance.creditLimit}
        formatMoney={formatMoney}
        onStrategyChange={onStrategyChange}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Wallet /> 本月财务损益表 (<Tooltip text="GP1是新车进销差，GP2叠加厂家返利，GP3再叠加金融、精品、延保、二手车和售后等综合毛利。">GP1/GP2/GP3</Tooltip>)</h3>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">随日常经营实时更新</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            ['profit', '利润表'],
            ['cashflow', '现金流量表'],
            ['balance', '资产负债表'],
            ['trend', '趋势图'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => onFinanceReportViewChange(id)} className={'px-3 py-2 rounded-lg text-xs font-bold border transition-colors ' + (financeReportView === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
              {label}
            </button>
          ))}
        </div>
        {financeReportView === 'profit' && <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex justify-between items-center text-sm mb-2"><span className="text-slate-500">新车营业收入（真实）</span><span className="font-bold text-slate-800">{formatMoney(realRevenueView)}</span></div>
            <div className="flex justify-between items-center text-sm mb-2"><span className="text-red-500"><Tooltip text="虚出只增加账面销量和返利池，不代表真实回款；后续真实卖出时才形成现金收入。">新车账面收入（虚出）</Tooltip></span><span className="font-bold text-red-500">{formatMoney(virtualRevenueView)}</span></div>
            <div className="flex justify-between items-center text-sm mb-2"><span className="text-slate-500">新车营业成本（真实）</span><span className="font-bold text-red-500">-{formatMoney(realCogsView)}</span></div>
            <div className="flex justify-between items-center text-sm mb-2"><span className="text-red-500"><Term term="虚出">虚出</Term>车辆成本风险</span><span className="font-bold text-red-500">-{formatMoney(virtualCogsView)}</span></div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center mb-3"><span className="font-bold text-slate-700"><Term term="GP1">GP1</Term> (新车进销差)</span><span className={'text-lg font-bold  ' + (gp1 >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(gp1)}</span></div>
            <div className="flex justify-between items-center text-sm mb-2"><span className="text-slate-500">厂家返利（真实销量）</span><span className="font-bold text-green-500">+{formatMoney(realRebateView)}</span></div>
            <div className="flex justify-between items-center text-sm mb-3"><span className="text-red-500"><Tooltip text="来自虚出冲量的返利入池，稽核风险更高，被查后可能罚款或取消返利。">厂家返利（虚出冲量）</Tooltip></span><span className="font-bold text-red-500">+{formatMoney(virtualRebateView)}</span></div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center"><span className="font-bold text-slate-800"><Term term="GP2">GP2</Term> (进销差+返利)</span><span className={'text-xl font-black  ' + (gp2 >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(gp2)}</span></div>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-3">
              <div className="flex justify-between items-center text-sm"><span className="text-blue-800 font-medium"><Term term="衍生业务">衍生业务</Term>总收入 (保/延/精)</span><span className="font-bold text-blue-800">+{formatMoney(monthlyStats.derivativeRevenue)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-blue-800 font-medium"><Term term="衍生业务">衍生业务</Term>总成本</span><span className="font-bold text-red-400">-{formatMoney(monthlyStats.derivativeCost)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-blue-800 font-medium"><Term term="金融佣金">金融按揭佣金</Term></span><span className="font-bold text-green-600">+{formatMoney(financeIncome)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-blue-800 font-medium">二手车实现毛利</span><span className={'font-bold ' + (usedCarProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{usedCarProfit >= 0 ? '+' : ''}{formatMoney(usedCarProfit)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-blue-800 font-medium">售后毛利</span><span className={'font-bold ' + (afterSalesProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{afterSalesProfit >= 0 ? '+' : ''}{formatMoney(afterSalesProfit)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-blue-800 font-medium"><Term term="续保">续保佣金</Term></span><span className="font-bold text-green-600">+{formatMoney(renewalIncome)}</span></div>
            </div>
            <div className="pt-3 border-t border-blue-200 flex justify-between items-center"><span className="font-bold text-blue-900"><Term term="GP3">GP3</Term> (全业务综合毛利)</span><span className={'text-xl font-black  ' + (gp3 >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(gp3)}</span></div>
          </div>
          <div className="bg-orange-50/30 p-4 rounded-lg border border-orange-100">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-3">
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">土地租金</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.rent)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">折旧摊销</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.depreciation)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">人工薪酬</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.labor)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">营销投流</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.marketingCost)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500">仓储成本</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.storageCost || 0)}</span></div>
              <div className="col-span-2 border-t border-orange-100 pt-2 mt-1">
                <p className="font-black text-slate-700 mb-1">七、财务费用</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">汇票手续费</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.draftBankFee || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">逾期罚息</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.draftPenalty || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">贷款利息</span><span className="font-bold text-orange-500">-{formatMoney(Math.max(0, (monthlyStats.financeCost || 0) - (monthlyStats.draftBankFee || 0) - (monthlyStats.draftPenalty || 0) - (monthlyStats.floatingCost || 0)))}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500"><Term term="浮库">浮库</Term>占用费</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.floatingCost || 0)}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm col-span-2 border-t border-orange-100 pt-1"><span className="text-slate-500 font-bold"><Term term="OPEX">OPEX</Term> 总计</span><span className="font-bold text-red-600">-{formatMoney(opex)}</span></div>
            </div>
            <div className="pt-3 border-t-2 border-orange-200 flex justify-between items-center">
              <span className="font-bold text-lg text-slate-800">预期经营净利润 (Net Profit)</span>
              <span className={'text-2xl font-black  ' + (netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(netProfit)}</span>
            </div>
          </div>
        </div>}
        {financeReportView === 'cashflow' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="font-black text-slate-800 mb-3">经营活动现金流</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>现金收入</span><span className="font-bold text-green-600">+{formatMoney(ledgerIncome)}</span></div>
                <div className="flex justify-between"><span>经营支出</span><span className="font-bold text-red-600">-{formatMoney(ledgerExpense)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-bold">本月账面净现金流</span><span className={(ledgerIncome - ledgerExpense) >= 0 ? 'font-black text-green-600' : 'font-black text-red-600'}>{formatMoney(ledgerIncome - ledgerExpense)}</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <h4 className="font-black text-amber-900 mb-3">汇票与GM资金</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span><Term term="承兑汇票">汇票</Term>保证金/手续费</span><span className="font-bold text-red-600">-{formatMoney(draftDepositPaid)}</span></div>
                <div className="flex justify-between"><span><Term term="承兑汇票">汇票</Term>到期兑付</span><span className="font-bold text-red-600">-{formatMoney(draftDuePaid)}</span></div>
                <div className="flex justify-between"><span>GM<Term term="垫资">垫资</Term>入账</span><span className="font-bold text-green-600">+{formatMoney(bailoutIn)}</span></div>
                <div className="flex justify-between"><span>归还GM<Term term="垫资">垫资</Term></span><span className="font-bold text-red-600">-{formatMoney(bailoutRepay)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-bold"><Term term="现金覆盖">现金覆盖天数</Term></span><span className={cashCoverageDays < 15 ? 'font-black text-red-600' : 'font-black text-green-600'}>{cashCoverageDays}天</span></div>
              </div>
            </div>
          </div>
        )}
        {financeReportView === 'balance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="font-black text-slate-800 mb-3">资产</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>现金及等价物</span><span className="font-bold">{formatMoney(finance.cash)}</span></div>
                <div className="flex justify-between"><span>库存车辆（可售）</span><span className="font-bold">{formatMoney(inventoryAssetValue)}</span></div>
                <div className="flex justify-between"><span>库存车辆（<Term term="虚出">虚出</Term>/<Term term="浮库">浮库</Term>）</span><span className="font-bold text-red-600">{formatMoney(virtualInventoryValue)}</span></div>
                <div className="flex justify-between"><span>二手车库存</span><span className="font-bold">{formatMoney(usedCarAssetValue)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-bold">资产合计</span><span className="font-black">{formatMoney(balanceAssets)}</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <h4 className="font-black text-red-900 mb-3">负债与风险</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>银行贷款余额</span><span className="font-bold text-red-600">{formatMoney(finance.loan)}</span></div>
                <div className="flex justify-between"><span>应付<Term term="承兑汇票">汇票</Term>/逾期</span><span className="font-bold text-red-600">{formatMoney(unpaidDraftAmount)}</span></div>
                <div className="flex justify-between"><span>GM待还<Term term="垫资">垫资</Term></span><span className="font-bold text-red-600">{formatMoney(gmWealth.outstandingBailout || 0)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-bold">负债合计</span><span className="font-black text-red-600">{formatMoney(balanceLiabilities)}</span></div>
                <div className="flex justify-between"><span className="font-bold">所有者权益</span><span className={ownerEquity >= 0 ? 'font-black text-emerald-600' : 'font-black text-red-600'}>{formatMoney(ownerEquity)}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>资产 = 负债 + 权益</span><span>{formatMoney(balanceLiabilities + ownerEquity)}</span></div>
                <div className="flex justify-between"><span className="font-bold"><Term term="资产负债率">资产负债率</Term></span><span className={debtRatio > 0.8 ? 'font-black text-red-600' : debtRatio > 0.6 ? 'font-black text-amber-600' : 'font-black text-green-600'}>{Math.round(debtRatio * 100)}%</span></div>
              </div>
            </div>
          </div>
        )}
        {financeReportView === 'trend' && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <h4 className="font-black text-slate-800 mb-3">最近12个月多指标趋势</h4>
            {recentRatingTrend.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">暂无历史月报，月底结算后会生成趋势。</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: '净利润', values: recentRatingTrend.map(item => item.netProfit || 0), color: '#10b981', format: formatMoney },
                  { label: '销量', values: recentRatingTrend.map(item => item.sales || 0), color: '#2563eb', format: value => `${value}台` },
                  { label: '投资人评分', values: recentRatingTrend.map(item => item.investorScore || 0), color: '#7c3aed', format: value => `${Math.round(value)}分` },
                  { label: 'CSI', values: recentRatingTrend.map(item => item.csiScore || 0), color: '#f59e0b', format: value => `${Math.round(value)}分` },
                ].map(metric => (
                  <div key={metric.label} className="rounded-lg border border-slate-100 bg-white p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">{metric.label === 'CSI' ? <Term term="CSI">CSI</Term> : metric.label}</span>
                      <span className="text-xs font-bold text-slate-400">近{metric.values.length}月</span>
                    </div>
                    <MiniTrendChart values={metric.values} color={metric.color} formatValue={metric.format} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3 text-center">注：此报表为经营管理口径，用于看清现金、<Term term="承兑汇票">汇票</Term>、<Term term="浮库">浮库</Term>和<Term term="垫资">垫资</Term>风险，不替代完整会计准则报表。</p>
      </div>

      <DailyLedgerPanel dailyLedger={dailyLedger} month={month} formatMoney={formatMoney} />
    </div>
  );
}
