import { DEFAULT_FEEDBACK } from '../game/config/achievements.js';
import { CAR_MODELS, INITIAL_MARKET_PRICES } from '../game/config/vehicles.js';
import { createCompetitorState as createCompetitorStateCore } from '../game/engine/competitorState.js';
import { createInitialCustomerLifecycle, createInitialOperatingEvents, createInitialSalesOpportunities } from '../game/state/initialState.js';

export function useGameSetupActions({
  activeDifficulty,
  activeInvestor,
  activeMarketSize,
  activeRegion,
  activeScenario,
  formatMoney,
  setCompetitors,
  setCsi,
  setCustomerLifecycle,
  setEndingModalDismissed,
  setEndingSummary,
  setFeedback,
  setFinance,
  setGameState,
  setLogs,
  setManagerInbox,
  setMarketEnvironment,
  setMarketPrices,
  setMonthlyStats,
  setOperatingEvents,
  setSalesOpportunities,
  setStoryState,
  setStaffStoryMemory,
  setTutorial,
  createInitialStoryState,
  createInitialStaffStoryMemory,
}) {
  const startNewGame = () => {
    const startingCash = Math.round(3000000 * activeDifficulty.cashMultiplier);
    const startingCredit = Math.round(10000000 * (activeRegion.credit || 1) * activeDifficulty.creditMultiplier);
    const startingTarget = Math.max(8, Math.round(15 * activeDifficulty.targetMultiplier));
    const openingCompetitors = createCompetitorStateCore({ marketSize: activeMarketSize });
    setFinance(finance => ({ ...finance, cash: startingCash, loan: 0, creditLimit: startingCredit }));
    setMonthlyStats(prev => ({ ...prev, target: startingTarget, sales: 0, leads: 0, walkIns: 0, dccWalkIns: 0, naturalWalkIns: 0 }));
    setCsi(prev => ({ ...prev, score: Math.max(50, Math.min(100, 90 + activeDifficulty.csiBonus)), complaints: 0, monthScore: 0 }));
    setCustomerLifecycle(createInitialCustomerLifecycle());
    setSalesOpportunities(createInitialSalesOpportunities());
    setCompetitors(openingCompetitors);
    setMarketPrices(() => {
      const prices = {};
      CAR_MODELS.forEach(car => {
        prices[car.id] = Math.round(INITIAL_MARKET_PRICES[car.id] * (1 + (activeRegion.pricePressure || 0)));
      });
      return prices;
    });
    setMarketEnvironment(prev => ({
      ...prev,
      history: [{ month: 1, desc: `${activeRegion.name}开局` }],
    }));
    setManagerInbox([
      { id: 'inbox_opening_goal', day: 1, from: '董事会', title: `${activeScenario.name}任命书`, body: `本局目标：${activeScenario.goal} ${activeScenario.months > 0 ? `任期${activeScenario.months}个月。` : '不限固定任期。'}难度：${activeDifficulty.name}，首月厂家任务${startingTarget}台。` },
      { id: 'inbox_opening_region', day: 1, from: '市场情报组', title: `${activeRegion.name}经营环境`, body: `${activeRegion.desc} 区域需求系数×${activeRegion.demand.toFixed(2)}，获客成本×${activeRegion.leadCost.toFixed(2)}，竞品事件概率${Math.round(activeRegion.competitorChance * 100)}%。` },
      { id: 'inbox_opening_competitors', day: 1, from: '市场情报组', title: `${activeMarketSize.name}竞品版图`, body: `本地月需求约${activeMarketSize.totalMarketSize}台，已识别${openingCompetitors.stores.length}家竞品门店。竞品降价和活动会分流到店量，请关注市场Tab。` },
      { id: 'inbox_opening_investor', day: 1, from: '投资人办公室', title: `${activeInvestor.name}授权函`, body: `你是运营总经理，不是老板。${activeInvestor.desc} 月底会根据销量、净利润、现金安全、库存周转、CSI和人员稳定评价你。` },
      { id: 'inbox_bank_credit', day: 1, from: '合作银行', title: '库存融资授信已开通', body: `当前库存融资授信额度为${formatMoney(startingCredit)}。卖车回款将优先归还库存融资，月底根据经营数据重新评估额度。` },
    ]);
    setLogs([{ day: 1, type: 'info', message: `你被任命为这家奥迪4S店运营总经理。剧本：${activeScenario.name}；难度：${activeDifficulty.name}；开局区域：${activeRegion.name}；市场规模：${activeMarketSize.name}；投资人：${activeInvestor.name}。` }]);
    setFeedback(DEFAULT_FEEDBACK);
    setOperatingEvents(createInitialOperatingEvents());
    setStoryState(createInitialStoryState());
    setStaffStoryMemory(createInitialStaffStoryMemory());
    setTutorial({ enabled: true, dismissed: false });
    setEndingSummary(null);
    setEndingModalDismissed(false);
    setGameState('playing');
  };

  return {
    startNewGame,
  };
}
