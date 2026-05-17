import { DIFFICULTY_MODES, GAME_SCENARIOS } from '../../game/config/scenarios.js';
import { DEALER_REGIONS, MARKET_SIZE_OPTIONS } from '../../game/config/market.js';
import { INVESTOR_PROFILES, INVESTOR_WEIGHT_LABELS } from '../../game/config/investors.js';
import { Term } from '../../shared/ui/tooltip.jsx';

export function SetupScreen({
  dealerRegionId,
  setDealerRegionId,
  setMarketSizeId,
  investorProfileId,
  setInvestorProfileId,
  difficultyMode,
  setDifficultyMode,
  scenarioId,
  setScenarioId,
  activeMarketSize,
  activeRegion,
  activeInvestor,
  activeDifficulty,
  activeScenario,
  hasAnySaveData,
  onLoadSave,
  onStartNewGame,
  formatMoney,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-bold text-blue-300 tracking-widest uppercase">Audi 4S Operation Simulator</p>
          <h1 className="text-4xl md:text-5xl font-black mt-2">接任运营总经理</h1>
          <p className="text-slate-300 mt-3 max-w-3xl">你不是老板。你拿到的是一个区域市场、一位投资人和一份月度授权。选局面，接压力，然后活下来。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">选择市场环境</h2>
              <span className="text-xs font-bold text-slate-400">区域 + 规模</span>
            </div>
            <p className="text-xs font-black text-slate-500 mb-2">经营区域</p>
            <div className="space-y-3">
              {DEALER_REGIONS.map(region => (
                <button
                  key={region.id}
                  onClick={() => {
                    setDealerRegionId(region.id);
                    setMarketSizeId(region.marketSizeId || 'medium');
                  }}
                  className={'w-full text-left rounded-xl border p-4 transition-all ' + (dealerRegionId === region.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-slate-50 border-slate-200 hover:border-blue-200')}
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-black text-slate-900">{region.name}</p>
                    <span className="text-xs font-bold text-blue-600 shrink-0">需求×{region.demand.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{region.desc}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200">获客成本×{region.leadCost.toFixed(2)}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200">人才流失×{region.turnover.toFixed(2)}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200"><Term term="授信">授信</Term>×{region.credit.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-black text-slate-500 mb-2">绑定市场规模</p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-black text-slate-900">{activeMarketSize.icon} {activeMarketSize.name}</p>
                  <span className="text-xs font-bold text-amber-700 shrink-0">{Object.values(activeMarketSize.counts).reduce((s, n) => s + n, 0)}店</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{activeMarketSize.desc}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-amber-200">月需求约{activeMarketSize.totalMarketSize}台</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-amber-200"><Term term="本品店">本品店</Term>{activeMarketSize.counts.audiLocal}家</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-amber-200">新能源{activeMarketSize.counts.ev}家</span>
                </div>
                <p className="text-[10px] font-bold text-amber-700 mt-3">市场规模由所选经营区域自动决定。</p>
              </div>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">选择投资人</h2>
              <span className="text-xs font-bold text-slate-400">决定经营约束</span>
            </div>
            <div className="space-y-3">
              {INVESTOR_PROFILES.map(investor => (
                <button
                  key={investor.id}
                  onClick={() => setInvestorProfileId(investor.id)}
                  className={'w-full text-left rounded-xl border p-4 transition-all ' + (investorProfileId === investor.id ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-200')}
                >
                  <p className="font-black text-slate-900">{investor.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{investor.desc}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">月底评分关注点（合计 {Math.round(Object.values(investor.weights).reduce((sum, weight) => sum + weight, 0) * 100)}%）</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-[10px]">
                    {INVESTOR_WEIGHT_LABELS.map(([key, label]) => (
                      <span key={key} className="rounded-full bg-white border border-slate-200 px-2 py-1">{label} {Math.round((investor.weights[key] || 0) * 100)}%</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">选择剧本目标</h2>
              <span className="text-xs font-bold text-slate-400">决定输赢条件</span>
            </div>
            <div className="space-y-3">
              {GAME_SCENARIOS.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setScenarioId(scenario.id)}
                  className={'w-full text-left rounded-xl border p-4 transition-all ' + (scenarioId === scenario.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-slate-50 border-slate-200 hover:border-blue-200')}
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-black text-slate-900">{scenario.name}</p>
                    <span className="text-xs font-bold text-blue-600 shrink-0">{scenario.months > 0 ? `${scenario.months}个月` : '不限期'}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{scenario.goal}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">选择难度模式</h2>
              <span className="text-xs font-bold text-slate-400">影响开局资源</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {DIFFICULTY_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setDifficultyMode(mode.id)}
                  className={'w-full text-left rounded-xl border p-4 transition-all ' + (difficultyMode === mode.id ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-200')}
                >
                  <p className="font-black text-slate-900">{mode.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{mode.desc}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200">现金×{mode.cashMultiplier.toFixed(2)}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200">授信×{mode.creditMultiplier.toFixed(2)}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200">任务×{mode.targetMultiplier.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">本局设定</p>
            <p className="text-xl font-black mt-1">{activeScenario.name} × {activeDifficulty.name} × {activeRegion.name} × {activeInvestor.name}</p>
            <p className="text-sm text-slate-300 mt-1">初始现金 {formatMoney(Math.round(3000000 * activeDifficulty.cashMultiplier))}，初始<Term term="库存融资授信">授信</Term> {formatMoney(Math.round(10000000 * (activeRegion.credit || 1) * activeDifficulty.creditMultiplier))}，首月任务约{Math.max(8, Math.round(15 * activeDifficulty.targetMultiplier))}台。</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {hasAnySaveData && (
              <button onClick={onLoadSave} className="px-5 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-black text-sm shadow-lg transition-colors">
                读取存档
              </button>
            )}
            <button onClick={onStartNewGame} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-lg shadow-lg transition-colors">
              开始接任
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
