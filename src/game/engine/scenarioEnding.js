const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const calculateNetAssets = ({
  finance,
  inventory = [],
  usedCars = [],
  carModels = [],
  usedCarShowroom,
  drafts,
  gmWealth,
}) => {
  const totalAssets = (finance.cash || 0) + inventory.reduce((sum, car) => {
    const modelDef = carModels.find(model => model.id === car.modelId);
    return sum + (modelDef ? modelDef.baseCost * 0.9 : 0);
  }, 0) + usedCars
    .filter(car => car.status === 'stock')
    .reduce((sum, car) => sum + car.purchasePrice * (usedCarShowroom?.built ? 0.9 : 0.8), 0);
  const draftLiabilities = (drafts.activeDrafts || [])
    .filter(draft => draft.status === 'active' || draft.status === 'defaulted')
    .reduce((sum, draft) => sum + (draft.status === 'active' ? draft.amount : (draft.overduePrincipal || 0)), 0);
  const totalLiabilities = (finance.loan || 0) + draftLiabilities + (gmWealth.outstandingBailout || 0);
  return {
    totalAssets,
    totalLiabilities,
    netAssets: totalAssets - totalLiabilities,
  };
};

export const evaluateScenarioEnding = ({
  terminalStop,
  isFreeScenario,
  absoluteDay,
  scenarioDurationDays,
  gameState,
  dismissedByInvestor,
  activeScenario,
  activeDifficulty,
  investorRelations,
  feedback,
  monthlyFeedbackReport,
  formatMoney = defaultFormatMoney,
  ...assetContext
}) => {
  if (terminalStop || isFreeScenario || absoluteDay < scenarioDurationDays || gameState === 'bankrupt' || dismissedByInvestor) {
    return null;
  }

  const { totalAssets, totalLiabilities, netAssets } = calculateNetAssets(assetContext);
  const excellentMonths = (feedback.ratingHistory || []).filter(item => (item.score || 0) >= 82 || (item.investorScore || 0) >= 82).length +
    (monthlyFeedbackReport && ((monthlyFeedbackReport.score || 0) >= 82 || (monthlyFeedbackReport.investorScore || 0) >= 82) ? 1 : 0);
  const passedScenario = activeScenario.id === 'survive6'
    ? netAssets >= activeScenario.targetNetAssets * 0.75 && investorRelations.badReviews < 3
    : activeScenario.id === 'star12'
    ? netAssets >= activeScenario.targetNetAssets && excellentMonths >= (activeScenario.minExcellentMonths || 3)
    : netAssets >= activeScenario.targetNetAssets;
  const endingRank = !passedScenario ? 'failed' : netAssets >= 6000000 && excellentMonths >= 4 ? 'regional_star' : netAssets >= 4500000 || excellentMonths >= 3 ? 'excellent' : 'renewed';
  const endingSummary = {
    rank: endingRank,
    scenarioName: activeScenario.name,
    difficultyName: activeDifficulty.name,
    day: absoluteDay,
    netAssets,
    totalAssets,
    loan: assetContext.finance.loan,
    liabilities: totalLiabilities,
    excellentMonths,
  };

  return {
    passedScenario,
    gameState: passedScenario ? 'won' : 'dismissed',
    endingSummary,
    dismissedByInvestor: !passedScenario,
    log: {
      day: absoluteDay,
      type: passedScenario ? 'success' : 'expense',
      message: passedScenario
        ? `【剧本达成】${activeScenario.name}结束，净资产${formatMoney(netAssets)}，优秀月评${excellentMonths}次，董事会决定续约。`
        : `【剧本失败】${activeScenario.name}结束，净资产${formatMoney(netAssets)}，优秀月评${excellentMonths}次，未达到董事会目标。`,
    },
  };
};
