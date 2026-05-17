import { Icons } from '../../shared/ui/icons.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

export function GameHeader({
  dayOfMonth,
  month,
  activeScenario,
  activeDifficulty,
  activeInvestor,
  investorRelations,
  scenarioProgress,
  finance,
  gameState,
  isAdvancingDay,
  hasAnySaveData,
  formatMoney,
  onManualRepayLoan,
  onNextDay,
  onOpenSave,
  onOpenLoad,
  onRestart,
}) {
  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1 bg-blue-500/30 w-full">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(dayOfMonth / 30) * 100}%` }}></div>
      </div>
      <div className="flex gap-8 items-center flex-wrap z-10">
        <div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">经营日历</p>
          <p className="text-3xl font-black">M{month} <span className="text-xl text-slate-400 font-normal">D{dayOfMonth}</span></p>
        </div>
        <div className="h-12 w-px bg-slate-700 hidden md:block"></div>
        <div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">经营剧本</p>
          <p className="text-sm font-black text-slate-100">{activeScenario.name}</p>
          <p className="text-xs text-blue-300">{activeDifficulty.name} · {activeInvestor.name} · 信任{investorRelations.trust}</p>
          <div className="mt-2 h-1.5 w-40 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${scenarioProgress}%` }}></div>
          </div>
        </div>
        <div className="h-12 w-px bg-slate-700 hidden md:block"></div>
        <div>
          <p className="text-slate-400 text-xs font-bold tracking-widest flex items-center gap-1"><Icons.Wallet /> 自有现金</p>
          <p className={'text-2xl font-bold  ' + (finance.cash > 0 ? 'text-green-400' : 'text-red-400')}>{formatMoney(finance.cash)}</p>
        </div>
        <div className="h-12 w-px bg-slate-700 hidden md:block"></div>
        <div>
          <p className="text-slate-400 text-xs font-bold tracking-widest flex items-center gap-1"><Icons.Bank /> <Term term="库存融资授信">库存融资负债 / 授信</Term></p>
          <div className="flex items-end gap-2">
            <p className={'text-2xl font-bold  ' + (finance.loan > finance.creditLimit * 0.8 ? 'text-red-400' : 'text-orange-400')}>
              {formatMoney(finance.loan)}
            </p>
            <p className="text-sm font-bold text-slate-400 mb-1 ml-2"> / {formatMoney(finance.creditLimit)}</p>
          </div>
          <button onClick={onManualRepayLoan} disabled={finance.loan <= 0 || finance.cash <= 0} className="mt-2 text-xs font-bold px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            手工还贷
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onNextDay}
          disabled={gameState !== 'playing' || isAdvancingDay}
          className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            gameState === 'bankrupt' ? 'bg-red-600 text-white cursor-not-allowed' :
            gameState === 'dismissed' ? 'bg-red-700 text-white cursor-not-allowed' :
            gameState === 'won' ? 'bg-green-600 text-white cursor-not-allowed' :
            isAdvancingDay ? 'bg-slate-500 text-white cursor-wait' :
            'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {gameState === 'bankrupt' ? '经营破产' : gameState === 'dismissed' ? '已被解聘' : gameState === 'won' ? '🏆 经营成功' : isAdvancingDay ? '日结中...' : '进入下一天 ➔'}
        </button>
        <div className="flex gap-2">
          <button onClick={onOpenSave} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
            💾 存档
          </button>
          <button onClick={onOpenLoad} disabled={!hasAnySaveData} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            📂 读档
          </button>
          <button onClick={onRestart} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
            🔄 重开
          </button>
        </div>
      </div>
    </div>
  );
}
