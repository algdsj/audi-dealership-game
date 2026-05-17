import { COMPETITOR_EVENTS, SEASON_MARKET_FACTORS, SUPPLY_CHAIN_EVENTS } from '../config/market.js';

export const createNextMarketEnvironment = ({
  currentEnvironment,
  nextMonth,
  activeRegion,
  random = Math.random,
}) => {
  const season = SEASON_MARKET_FACTORS[(nextMonth - 1) % SEASON_MARKET_FACTORS.length];
  const competitorEvent = random() < (activeRegion?.competitorChance ?? 0.65)
    ? COMPETITOR_EVENTS[Math.floor(random() * COMPETITOR_EVENTS.length)]
    : { name: '暂无重大竞品动作', desc: '竞品维持常规销售节奏。', affectedSegments: [], priceDrift: 0, demandImpact: 0 };
  const supplyChain = SUPPLY_CHAIN_EVENTS[Math.floor(random() * SUPPLY_CHAIN_EVENTS.length)];
  return {
    seasonName: season.name,
    seasonIndex: season.index,
    seasonDesc: season.desc,
    competitorEvent,
    supplyChain,
    history: [
      ...(currentEnvironment?.history || []).slice(-5),
      { month: nextMonth, desc: `${season.name}｜${competitorEvent.name}｜${supplyChain.name}` },
    ],
  };
};

export const buildMarketEnvironmentMonthlyMessages = ({
  environment,
  policyMonth,
  absoluteDay,
}) => ({
  log: {
    day: absoluteDay,
    type: 'info',
    message: `🌐【市场月报】${environment.seasonName}，需求指数×${environment.seasonIndex.toFixed(2)}。${environment.competitorEvent.name}；${environment.supplyChain.name}。`,
  },
  inboxItem: {
    id: `inbox_market_report_${absoluteDay}`,
    day: absoluteDay,
    from: '市场情报组',
    title: `M${policyMonth}月市场月报`,
    body: `${environment.seasonName}，需求指数×${environment.seasonIndex.toFixed(2)}。${environment.competitorEvent.desc} ${environment.supplyChain.desc}`,
  },
});

export const buildMarketEnvironmentStartMessages = ({
  environment,
  absoluteDay,
}) => ({
  log: {
    day: absoluteDay,
    type: 'info',
    message: `🌐【市场环境】${environment.seasonName}：${environment.seasonDesc} ${environment.competitorEvent.name !== '暂无重大竞品动作' ? `竞品事件：${environment.competitorEvent.desc}` : ''} 供应链：${environment.supplyChain.desc}`,
  },
  inboxItem: {
    id: `inbox_market_${absoluteDay}`,
    day: absoluteDay,
    from: '市场情报组',
    title: `${environment.seasonName}市场环境提醒`,
    body: `${environment.seasonDesc}${environment.competitorEvent.name !== '暂无重大竞品动作' ? ` ${environment.competitorEvent.desc}` : ' 竞品暂无重大动作。'} ${environment.supplyChain.desc}`,
  },
});
