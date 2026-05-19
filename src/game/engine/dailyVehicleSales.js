import {
  buildShowroomStrategySnapshot,
  getSeriesCompetitorImpact,
} from './vehicleStructure.js';

const USED_CAR_BRANDS = ['大众帕萨特', '本田雅阁', '丰田凯美瑞', '别克君威', '日产天籁', '福特蒙迪欧'];

export const settleDailyVehicleSales = ({
  carModels,
  inventory,
  virtualSales,
  approvalCases,
  customerDeals,
  monthlyStats,
  stats,
  handledCustomers,
  testDriveCars,
  marketPrices,
  marketEnvironment,
  activeRegion,
  competitors = {},
  facility,
  salesAvgSkill,
  salesFinanceBonus = 0,
  salesPriceKillerBonus = 0,
  salesSeriesBonusBySeries = {},
  strategy,
  csi,
  gmMoraleScore,
  activeConvBonus,
  competitorPressure,
  playerServiceBoost,
  processedByChannel,
  naturalWalkIns,
  leadChannels,
  absoluteDay,
  getPriceReality,
  getDynamicMsrp,
  getDynamicRebate,
  createPriceApprovalCase,
  createCustomerDealCase,
  formatMoney,
  random = Math.random,
}) => {
  let nextInventory = [...inventory];
  let nextVirtualSales = {
    ...virtualSales,
    virtualCars: (virtualSales.virtualCars || []).map(car => ({ ...car })),
  };
  let nextApprovalCases = [...approvalCases];
  let nextCustomerDeals = [...customerDeals];
  const nextMonthlyStats = { ...monthlyStats };
  const nextStats = { ...stats };
  const logs = [];
  let revenue = 0;
  let cogs = 0;
  let rebates = 0;
  let dailyDerivRev = 0;
  let dailyDerivCost = 0;
  let dailyFinanceComm = 0;
  let dailyTradeInCount = 0;
  let dailyTradeInSubsidy = 0;
  let dailyUsedCarPurchaseCost = 0;
  const soldCarsSummary = {};
  const newSoldVehicles = [];
  const testDriveModelIds = new Set((testDriveCars || []).map(item => item.modelId));
  const showroomStrategy = buildShowroomStrategySnapshot({ inventory, carModels });

  for (const segment of handledCustomers) {
    if (nextInventory.length === 0 && (nextVirtualSales.virtualCars || []).length === 0) break;
    const matchingCars = nextInventory.filter(car => carModels.find(model => model.id === car.modelId)?.segment === segment);
    const matchingVirtualCars = (nextVirtualSales.virtualCars || []).filter(car => {
      const model = carModels.find(item => item.id === car.modelId);
      return model?.segment === segment && !car.realSold;
    });
    if (matchingCars.length === 0 && matchingVirtualCars.length === 0) continue;

    const useVirtualCar = matchingVirtualCars.length > 0;
    const car = useVirtualCar
      ? matchingVirtualCars[Math.floor(random() * matchingVirtualCars.length)]
      : matchingCars[Math.floor(random() * matchingCars.length)];
    const randomIdx = useVirtualCar ? -1 : nextInventory.findIndex(item => item.id === car.id);
    const modelDef = carModels.find(model => model.id === car.modelId);
    const currentMarketPrice = marketPrices[modelDef.id] || getDynamicMsrp(modelDef.id);

    const baseConv = facility.level * 0.02;
    const skillConv = (salesAvgSkill / 100) * 0.20;
    const priceReality = getPriceReality(car.price, currentMarketPrice);
    const csiConv = csi.score >= 95 ? 0.08 : csi.score >= 90 ? 0.04 : csi.score >= 85 ? -0.03 : -0.08;
    const competitorImpact = getSeriesCompetitorImpact({ modelDef, marketEnvironment, competitors });
    const competitorDemandConv = competitorImpact.demandImpact + Math.min(showroomStrategy.competitorShield, Math.max(0, -competitorImpact.demandImpact));
    const regionDemandConv = activeRegion.segmentPressure?.includes(modelDef.segment) ? (activeRegion.segmentDemandImpact || 0) : 0;
    const moraleConv = gmMoraleScore >= 90 ? 0.05 : gmMoraleScore >= 70 ? 0 : gmMoraleScore >= 45 ? -0.04 : -0.10;
    const seriesShowroomBonus = showroomStrategy.conversionBonusBySeries[modelDef.series] || 0;
    const segmentShowroomBonus = showroomStrategy.segmentBonus[modelDef.segment] || 0;
    const salesSpecialtyBonus = Math.min(0.12, salesSeriesBonusBySeries[modelDef.series] || 0);
    let finalConv = Math.max(0.01, Math.min(0.95, baseConv + skillConv + priceReality.conversionAdj + csiConv + moraleConv + activeConvBonus + competitorDemandConv + regionDemandConv + seriesShowroomBonus + segmentShowroomBonus + salesSpecialtyBonus + salesPriceKillerBonus - competitorPressure * 0.16 + playerServiceBoost * 0.2));

    if (car.location === 'showroom') finalConv = Math.min(0.95, finalConv + 0.12);
    if (testDriveModelIds.has(modelDef.id)) finalConv = Math.min(0.95, finalConv + 0.05);
    const isTradeIn = random() < (0.20 + (activeRegion.tradeInBoost || 0) + showroomStrategy.tradeInBonus);
    if (isTradeIn) finalConv = Math.min(0.95, finalConv + 0.08);
    finalConv = Math.max(0.01, Math.min(finalConv, priceReality.closeCap));

    if (random() < finalConv) {
      const dynamicRebate = getDynamicRebate(modelDef.id);
      const dynamicMsrp = getDynamicMsrp(modelDef.id);
      revenue += car.price;
      nextMonthlyStats.realRevenue = (nextMonthlyStats.realRevenue || 0) + car.price;
      nextVirtualSales.monthlyActual = (nextVirtualSales.monthlyActual || 0) + 1;

      if (useVirtualCar) {
        nextVirtualSales.virtualCars = nextVirtualSales.virtualCars.filter(item => item.id !== car.id);
        const summaryKey = `${modelDef.name}虚出消化(${car.color || '黑'})`;
        soldCarsSummary[summaryKey] = (soldCarsSummary[summaryKey] || 0) + 1;
        logs.push({ day: absoluteDay, type: 'success', message: `✅【虚出消化】${modelDef.name} 一台虚出车被真实客户买走，回款 ${formatMoney(car.price)}，不重复计入销量、返利和成本。` });
      } else {
        nextInventory.splice(randomIdx, 1);
        cogs += modelDef.baseCost;
        nextMonthlyStats.realCogs = (nextMonthlyStats.realCogs || 0) + modelDef.baseCost;
        rebates += dynamicRebate;
        nextMonthlyStats.realRebate = (nextMonthlyStats.realRebate || 0) + dynamicRebate;
        nextStats.sales++;
        nextMonthlyStats.sales++;
        const summaryKey = `${modelDef.name}(${car.color || '黑'})`;
        soldCarsSummary[summaryKey] = (soldCarsSummary[summaryKey] || 0) + 1;
      }

      if (random() < 0.70) {
        const isOemFinance = random() < 0.60;
        const loanAmount = dynamicMsrp * 0.7;
        const commRate = isOemFinance ? 0.03 : 0.04;
        const financeBoost = 1 + salesFinanceBonus;
        const financeComm = Math.round(loanAmount * commRate * financeBoost);
        const gpsFee = 2000;
        const serviceFee = Math.round(loanAmount * 0.01);
        dailyFinanceComm += financeComm + gpsFee + serviceFee;
      }

      if (isTradeIn) {
        dailyTradeInCount++;
        const tradeInValue = 30000 + Math.floor(random() * 120000);
        const purchasePrice = Math.round(tradeInValue * 0.85);
        dailyUsedCarPurchaseCost += purchasePrice;
        const tradeInSubsidy = 5000;
        dailyTradeInSubsidy += tradeInSubsidy;
        if (!useVirtualCar) rebates += tradeInSubsidy;
        const brand = USED_CAR_BRANDS[Math.floor(random() * USED_CAR_BRANDS.length)];
        newSoldVehicles.push({ type: 'usedCar', brand, purchasePrice, retailPrice: Math.round(purchasePrice * 1.2) });
      }

      let carDerivRev = 0;
      let carDerivCost = 0;
      const msrp = dynamicMsrp;
      if (random() < 0.80) {
        carDerivRev += msrp * 0.02;
        carDerivCost += msrp * 0.02 * 0.75;
      }
      if (strategy.accessories === 'OEM') {
        if (random() < 0.60) {
          carDerivRev += msrp * 0.015;
          carDerivCost += msrp * 0.010;
        }
      } else if (random() < 0.35) {
        carDerivRev += msrp * 0.012;
        carDerivCost += msrp * 0.003;
      }
      if (strategy.warranty === 'OEM') {
        if (random() < 0.25) {
          carDerivRev += msrp * 0.02;
          carDerivCost += msrp * 0.012;
        }
      } else if (random() < 0.10) {
        carDerivRev += msrp * 0.015;
        carDerivCost += msrp * 0.005;
      }
      dailyDerivRev += carDerivRev;
      dailyDerivCost += carDerivCost;

      newSoldVehicles.push({ type: 'newCar', modelId: modelDef.id, modelName: modelDef.name, soldDay: absoluteDay });
    } else if (!useVirtualCar && finalConv >= 0.18 && random() < 0.28 && nextApprovalCases.filter(item => item.type === 'price').length < 2) {
      const approvalCase = createPriceApprovalCase(car, modelDef, finalConv);
      nextApprovalCases.push(approvalCase);
      logs.push({ day: absoluteDay, type: 'info', message: `🧾【价格审批】${modelDef.name} 客户要求总经理批价 ${formatMoney(approvalCase.requestedPrice)}，已进入审批中心。` });
    }
  }

  if (nextInventory.length > 0 && handledCustomers.length > 0 && nextCustomerDeals.length < 6) {
    const channelCandidates = leadChannels.flatMap(channel => Array.from({ length: Math.max(0, processedByChannel[channel.id] || 0) }, () => channel.id));
    if (naturalWalkIns > 0) channelCandidates.push(...Array.from({ length: Math.min(8, naturalWalkIns) }, () => 'showroom'));
    const maxNewCases = Math.min(3, 6 - nextCustomerDeals.length, Math.max(1, Math.floor(handledCustomers.length / 3)));
    const generatedCases = [];
    const reservedCarIds = new Set(nextCustomerDeals.map(item => item.carId));
    for (let i = 0; i < maxNewCases; i++) {
      if (random() > 0.75 && generatedCases.length > 0) continue;
      const stockForCase = nextInventory.filter(car => !reservedCarIds.has(car.id));
      if (stockForCase.length === 0) break;
      const channelId = channelCandidates.length > 0
        ? channelCandidates[Math.floor(random() * channelCandidates.length)]
        : 'showroom';
      const segment = handledCustomers[Math.floor(random() * handledCustomers.length)];
      const dealCase = createCustomerDealCase({ channelId, segment, sourceDay: absoluteDay, stockList: stockForCase });
      if (dealCase) {
        generatedCases.push(dealCase);
        reservedCarIds.add(dealCase.carId);
      }
    }
    if (generatedCases.length > 0) {
      nextCustomerDeals = [...nextCustomerDeals, ...generatedCases];
      logs.push({ day: absoluteDay, type: 'info', message: `👤【重点客户】销售团队筛出 ${generatedCases.length} 位可谈判客户，请在“客户谈判”中及时处理。` });
    }
  }

  nextMonthlyStats.revenue += revenue;
  nextMonthlyStats.cogs += cogs;
  nextMonthlyStats.derivativeRevenue += dailyDerivRev;
  nextMonthlyStats.derivativeCost += dailyDerivCost;
  nextMonthlyStats.baseRebatesPool += rebates;
  nextMonthlyStats.financeCommission += dailyFinanceComm;
  nextMonthlyStats.tradeInCount += dailyTradeInCount;
  nextMonthlyStats.tradeInSubsidy += dailyTradeInSubsidy;

  return {
    inventory: nextInventory,
    virtualSales: nextVirtualSales,
    approvalCases: nextApprovalCases,
    customerDeals: nextCustomerDeals,
    monthlyStats: nextMonthlyStats,
    stats: nextStats,
    newSoldVehicles,
    soldCarsSummary,
    revenue,
    cogs,
    rebates,
    dailyDerivRev,
    dailyDerivCost,
    dailyFinanceComm,
    dailyTradeInCount,
    dailyTradeInSubsidy,
    dailyUsedCarPurchaseCost,
    logs,
  };
};
