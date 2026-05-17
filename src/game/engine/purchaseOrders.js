export const executeVehicleOrder = ({
  orderForm,
  investorRelations,
  currentDay,
  facility,
  inventory,
  pendingOrders,
  finance,
  drafts,
  monthlyStats,
  month,
  dayOfMonth,
  marketEnvironment,
  manufacturerPolicy,
  getDraftFeeRate,
  addMonthsToGameDate,
  formatMoney = value => String(value),
  random = Math.random,
}) => {
  const { model, quantity, color } = orderForm;
  if (!model || quantity <= 0) return { status: 'invalid' };

  const paymentMethod = orderForm.paymentMethod || (orderForm.useLoan ? 'draft3' : 'cash');
  if (investorRelations.orderRestrictionUntil >= currentDay && quantity > 2) {
    return {
      status: 'restricted',
      alert: {
        title: '投资人限制订车',
        message: `当前预算状态为「${investorRelations.budgetStatus}」，D${((investorRelations.orderRestrictionUntil - 1) % 30) + 1}前单次订车不得超过2台。`,
      },
    };
  }

  const totalSlots = facility.showroomSpots + facility.warehouseCapacity;
  const currentTotal = inventory.length + pendingOrders.reduce((sum, order) => sum + order.quantity, 0);
  if (currentTotal + quantity > totalSlots) {
    return { status: 'capacity_full', alert: { title: '库存预警', message: `展厅及库房余位不足！当前空余位（含在途）: ${totalSlots - currentTotal} 台。` } };
  }

  const totalCost = model.baseCost * quantity;
  const nextFinance = { ...finance };
  const nextDrafts = { ...drafts, activeDrafts: [...(drafts.activeDrafts || [])] };
  let nextMonthlyStats = monthlyStats;
  let draftId = null;
  let cashOut = totalCost;
  let ledgerLabel = `厂家订车付款(${model.name} ×${quantity})`;

  if (paymentMethod === 'cash') {
    if (nextFinance.cash < totalCost) return { status: 'insufficient_cash', alert: { title: '资金不足', message: '自有现金不足，请减少数量或选择使用库存融资！' } };
    nextFinance.cash -= totalCost;
  } else if (paymentMethod === 'loan') {
    const availableLoanCredit = Math.max(0, (nextFinance.creditLimit || 0) - (nextFinance.loan || 0));
    if (totalCost > availableLoanCredit) {
      return { status: 'loan_limit', alert: { title: '库存融资授信不足', message: `本次库存融资需要 ${formatMoney(totalCost)}，当前库存融资授信可用 ${formatMoney(availableLoanCredit)}。` } };
    }
    nextFinance.loan = (nextFinance.loan || 0) + totalCost;
    cashOut = 0;
    ledgerLabel = `银行库存融资采购(${model.name} ×${quantity})`;
  } else {
    const term = paymentMethod === 'draft6' ? 6 : 3;
    const feeRate = getDraftFeeRate(term);
    const deposit = Math.round(totalCost * 0.2);
    const bankFee = Math.round(totalCost * feeRate);
    cashOut = deposit + bankFee;
    if ((drafts.bankReputation || 70) < 30) {
      return { status: 'bank_rejected', alert: { title: '银行拒票', message: '银行信用评分低于30，合作银行暂停开具新汇票，只能现金采购。' } };
    }
    if ((drafts.creditUsed || 0) + totalCost > (drafts.creditLimit || 0)) {
      return {
        status: 'draft_limit',
        alert: {
          title: '承兑汇票专项授信不足',
          message: `本次需占用承兑汇票专项授信 ${formatMoney(totalCost)}，当前可用 ${formatMoney(Math.max(0, (drafts.creditLimit || 0) - (drafts.creditUsed || 0)))}。\n\n提示：顶部的 ${formatMoney(finance.creditLimit)} 是库存融资授信，请选择“库存融资”付款方式才会使用那笔额度。`,
        },
      };
    }
    if (nextFinance.cash < cashOut) return { status: 'insufficient_cash', alert: { title: '资金不足', message: `汇票采购仍需支付保证金和手续费 ${formatMoney(cashOut)}，当前现金不足。` } };

    nextFinance.cash -= cashOut;
    draftId = `draft_${currentDay}_${random().toString(36).slice(2, 8)}`;
    const dueDate = addMonthsToGameDate(month, dayOfMonth, term);
    nextDrafts.activeDrafts.push({
      id: draftId,
      amount: totalCost,
      carModel: model.name,
      carCount: quantity,
      costPricePerCar: model.baseCost,
      issueDate: { month, day: dayOfMonth },
      dueDate,
      term,
      bankFee,
      deposit,
      status: 'active',
      isVirtualCar: false,
    });
    nextDrafts.totalDraftAmount = (nextDrafts.totalDraftAmount || 0) + totalCost;
    nextDrafts.totalBankFeePaid = (nextDrafts.totalBankFeePaid || 0) + bankFee;
    nextDrafts.creditUsed = (nextDrafts.creditUsed || 0) + totalCost;
    nextMonthlyStats = { ...monthlyStats, financeCost: (monthlyStats.financeCost || 0) + bankFee, draftBankFee: (monthlyStats.draftBankFee || 0) + bankFee };
    ledgerLabel = `银行承兑汇票采购(${term}个月·${model.name} ×${quantity})`;
  }

  const baseLeadTime = 3 + Math.floor(random() * 5);
  const leadTime = Math.max(2, baseLeadTime + marketEnvironment.supplyChain.delayDays);
  const arriveDay = currentDay + leadTime;
  const order = {
    id: random().toString(36).slice(2, 11),
    modelId: model.id,
    modelName: model.name,
    color,
    quantity,
    arriveDay,
    paymentMethod,
    draftId,
  };
  const paymentText = paymentMethod === 'cash'
    ? '现金全款'
    : paymentMethod === 'loan'
    ? `库存融资（银行负债增加${formatMoney(totalCost)}）`
    : `${paymentMethod === 'draft6' ? '6个月' : '3个月'}银行承兑汇票（本次支付${formatMoney(cashOut)}）`;
  const finalMonthlyStats = {
    ...nextMonthlyStats,
    purchaseUnits: (nextMonthlyStats.purchaseUnits || 0) + quantity,
  };

  return {
    status: 'settled',
    finance: nextFinance,
    drafts: nextDrafts,
    monthlyStats: finalMonthlyStats,
    pendingOrders: [...pendingOrders, order],
    ledgerItem: {
      label: ledgerLabel,
      amount: paymentMethod === 'loan' ? totalCost : -cashOut,
      type: paymentMethod === 'loan' ? 'pending' : 'expense',
    },
    log: {
      type: 'info',
      message: `📋 订购了 ${quantity} 台 ${model.name} (${color}色)，总成本 ${formatMoney(totalCost)}，使用${paymentText}。预计 ${leadTime} 天后到货(D${((arriveDay - 1) % 30) + 1})。${marketEnvironment.supplyChain.delayDays !== 0 ? `供应链影响：${marketEnvironment.supplyChain.name}` : ''}`,
    },
    orderForm: { isOpen: false, model: null, quantity: 1, color: '黑', paymentMethod: 'draft3' },
    purchaseTargetUpdate: manufacturerPolicy?.purchaseTarget
      ? {
        purchasedUnits: (manufacturerPolicy.purchaseTarget.purchasedUnits || 0) + quantity,
        targetUnits: manufacturerPolicy.purchaseTarget.targetUnits || 0,
      }
      : null,
  };
};
