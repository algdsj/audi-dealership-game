import { Term } from '../../shared/ui/tooltip.jsx';

export function GmOfficeTab({
  gmWealth,
  cashCoverageDays,
  investorRelations,
  currentDay,
  formatMoney,
  onAdjustGmSalary,
  onPersonalBailout,
  onOpenNegotiation,
  onSelectTab,
}) {
  return (
    <div className="space-y-6">
      <div className="mb-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold">总经理办公室</h2>
        <p className="text-slate-500 text-sm mt-1">个人财富、<Term term="垫资">垫资</Term>能力和<Term term="承兑汇票">银行承兑汇票</Term>都会直接影响公司的现金安全。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1">个人账户</p>
          <p className="text-3xl font-black">{formatMoney(gmWealth.personalAccount)}</p>
          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div><p className="text-slate-400">月薪</p><p className="font-bold">{formatMoney(gmWealth.monthlySalary)}</p></div>
            <div><p className="text-slate-400">累计收入</p><p className="font-bold">{formatMoney(gmWealth.totalEarned)}</p></div>
            <div><p className="text-slate-400">累计分红</p><p className="font-bold">{formatMoney(gmWealth.totalDividend)}</p></div>
            <div><p className="text-slate-400"><Term term="GM士气">GM士气</Term></p><p className="font-bold">{gmWealth.morale || 80}/100</p></div>
            <div><p className="text-slate-400"><Term term="垫资">待还垫资</Term></p><p className="font-bold">{formatMoney(gmWealth.outstandingBailout || 0)}</p></div>
            <div><p className="text-slate-400">预估分红率</p><p className="font-bold">{Math.round((gmWealth.dividendRate || 0.08) * 100)}%</p></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400">薪资调整</p>
              <p className="text-xl font-black text-slate-900">{formatMoney(gmWealth.monthlySalary)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onAdjustGmSalary(-0.2)} disabled={(gmWealth.monthlySalary || 0) <= 766} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40">-20%</button>
              <button onClick={() => onAdjustGmSalary(0.2)} disabled={(gmWealth.monthlySalary || 0) >= 60000} className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-40">+20%</button>
            </div>
          </div>
          <p className="text-xs text-slate-500">月薪范围：¥766 ~ ¥60,000。每个新月第一天自动从公司现金发放到个人账户，并计入人工成本。</p>
          {(gmWealth.monthlySalary || 0) <= 766 && <p className="text-xs text-amber-600 font-bold mt-2">根据劳动法规定，总经理月薪不得低于当地最低工资标准（¥766/月）。</p>}
          <div className="mt-4 space-y-2">
            {(gmWealth.salaryHistory || []).slice(0, 3).map((item, idx) => (
              <div key={`${item.month}_${idx}`} className="text-xs flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>M{item.month} {item.reason}</span>
                <span className="font-bold">{formatMoney(item.oldSalary)} → {formatMoney(item.newSalary)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={'rounded-xl p-5 shadow-sm border ' + (cashCoverageDays < 7 ? 'bg-red-50 border-red-200' : cashCoverageDays < 15 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200')}>
          <p className="text-xs font-bold text-slate-500"><Term term="垫资">垫资救急</Term></p>
          <p className="text-xl font-black text-slate-900 mt-1">{formatMoney(gmWealth.outstandingBailout || 0)}</p>
          <p className="text-xs text-slate-600 mt-1">公司现金可覆盖约 {cashCoverageDays} 天日常支出；超过安全线后会自动归还垫资。</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[10000, 50000, 100000].map(amount => (
              <button key={amount} onClick={() => onPersonalBailout(amount)} disabled={(gmWealth.personalAccount || 0) * 0.9 < amount} className="py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                垫{formatMoney(amount)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <p className="text-xs text-slate-400">本年累计净利润</p>
            <p className={(gmWealth.yearlyNetProfit || 0) >= 0 ? 'text-xl font-black text-emerald-600' : 'text-xl font-black text-red-600'}>{formatMoney(gmWealth.yearlyNetProfit || 0)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <p className="text-xs text-slate-400">投资人评分样本</p>
            <p className="text-xl font-black text-slate-800">{(gmWealth.investorScoreHistory || []).length} / 12</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <p className="text-xs text-slate-400">年终分红规则</p>
            <p className="text-xs font-bold text-slate-700 mt-1">平均分≥85为12%，70-84为8%，55-69为5%。</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-lg text-violet-950 mb-1">💼 投资人授权与外部谈判</h3>
            <p className="text-sm text-violet-800">你以运营总经理身份对厂家、银行和投资人发起谈判，选择固定口径后按概率判定。</p>
          </div>
          <div className="grid grid-cols-3 gap-2 shrink-0 text-center">
            <div className="bg-white rounded-lg border border-violet-100 px-3 py-2">
              <p className="text-[10px] text-slate-400"><Term term="投资人信任">信任度</Term></p>
              <p className="text-lg font-black text-violet-700">{investorRelations.trust}</p>
            </div>
            <div className="bg-white rounded-lg border border-violet-100 px-3 py-2">
              <p className="text-[10px] text-slate-400">上次评价</p>
              <p className="text-lg font-black text-slate-800">{investorRelations.lastScore ?? '--'}</p>
            </div>
            <div className="bg-white rounded-lg border border-violet-100 px-3 py-2">
              <p className="text-[10px] text-slate-400">预算状态</p>
              <p className="text-xs font-black text-violet-700">{investorRelations.budgetStatus}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-violet-100 p-3 mb-4">
          <p className="text-xs text-slate-600 leading-relaxed">{investorRelations.lastComment}</p>
          {investorRelations.orderRestrictionUntil >= currentDay && <p className="text-xs text-red-600 font-bold mt-2">订车限制生效中：D{((investorRelations.orderRestrictionUntil - 1) % 30) + 1}前单次订车不得超过2台。</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <button onClick={() => onOpenNegotiation('manufacturer_subsidy')} className="rounded-lg bg-white hover:bg-violet-50 border border-violet-100 p-3 text-left transition-colors">
            <p className="text-xs font-black text-slate-800">厂家长库龄补贴</p>
            <p className="text-[10px] text-slate-500 mt-1">清库返利入池</p>
          </button>
          <button onClick={() => onOpenNegotiation('bank_credit')} className="rounded-lg bg-white hover:bg-violet-50 border border-violet-100 p-3 text-left transition-colors">
            <p className="text-xs font-black text-slate-800">银行临时<Term term="授信">授信</Term></p>
            <p className="text-[10px] text-slate-500 mt-1">提升融资额度</p>
          </button>
          <button onClick={() => onOpenNegotiation('investor_cash')} className="rounded-lg bg-white hover:bg-violet-50 border border-violet-100 p-3 text-left transition-colors">
            <p className="text-xs font-black text-slate-800">投资人追加现金</p>
            <p className="text-[10px] text-slate-500 mt-1">换取缓冲</p>
          </button>
          <button onClick={() => onOpenNegotiation('marketing_support')} className="rounded-lg bg-white hover:bg-violet-50 border border-violet-100 p-3 text-left transition-colors">
            <p className="text-xs font-black text-slate-800">厂家营销支持</p>
            <p className="text-[10px] text-slate-500 mt-1">区域线索资源</p>
          </button>
          <button onClick={() => onOpenNegotiation('loss_explain')} className="rounded-lg bg-white hover:bg-violet-50 border border-violet-100 p-3 text-left transition-colors">
            <p className="text-xs font-black text-slate-800">解释本月亏损</p>
            <p className="text-[10px] text-slate-500 mt-1">修复信任</p>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span className="font-bold">利润表、现金流量表和趋势图在“报表”；返利与汇票分别进入对应子页。</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onSelectTab('reports')} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">查看财务报表</button>
          <button onClick={() => onSelectTab('draft')} className="px-3 py-2 rounded-lg bg-white border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50">查看汇票风险</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold text-slate-700">个人财富里程碑</span>
          <span className="text-slate-500">{formatMoney(gmWealth.personalAccount)} / ¥1,000,000</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, ((gmWealth.personalAccount || 0) / 1000000) * 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
}
