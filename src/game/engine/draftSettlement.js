import { getGameDate } from './gameDate.js';

const defaultFormatMoney = (amount) => `¥${Math.round(amount || 0).toLocaleString()}`;

export const settleDueDraftsForDay = ({
  finance,
  drafts,
  gmWealth,
  absoluteDay,
  formatMoney = defaultFormatMoney,
}) => {
  const f = { ...finance };
  const nextDrafts = { ...drafts, activeDrafts: (drafts.activeDrafts || []).map(draft => ({ ...draft })) };
  const nextGmWealth = { ...gmWealth };
  const gameDate = getGameDate(absoluteDay);
  const logs = [];
  const inboxItems = [];
  const ledgerItems = [];
  let draftPenaltyToday = 0;

  nextDrafts.activeDrafts = nextDrafts.activeDrafts.map(draft => {
    if (draft.status === 'defaulted') {
      const penalty = Math.round((draft.overduePrincipal || draft.amount * 0.8) * 0.0005);
      draftPenaltyToday += penalty;
      return { ...draft, overduePenalty: (draft.overduePenalty || 0) + penalty };
    }
    if (draft.status !== 'active') return draft;
    if (draft.dueDate.month !== gameDate.month || draft.dueDate.day !== gameDate.day) return draft;

    const duePayment = Math.round(draft.amount * 0.8);
    if (f.cash >= duePayment) {
      f.cash -= duePayment;
      nextDrafts.creditUsed = Math.max(0, (nextDrafts.creditUsed || 0) - draft.amount);
      nextDrafts.totalDraftsPaid = (nextDrafts.totalDraftsPaid || 0) + draft.amount;
      nextDrafts.bankReputation = Math.min(100, (nextDrafts.bankReputation || 70) + 3);
      nextDrafts.consecutivePaid = (nextDrafts.consecutivePaid || 0) + 1;
      if (nextDrafts.consecutivePaid > 0 && nextDrafts.consecutivePaid % 3 === 0) {
        nextDrafts.bankReputation = Math.min(100, nextDrafts.bankReputation + 5);
        nextGmWealth.morale = Math.min(100, (nextGmWealth.morale || 80) + 5);
      }
      ledgerItems.push({ label: `汇票到期兑付(${draft.carModel} ×${draft.carCount})`, amount: -duePayment, type: 'expense' });
      logs.push({ day: absoluteDay, type: 'success', message: `🏦【汇票兑付】${draft.carModel} ${draft.carCount}台对应汇票按时兑付，支付尾款 ${formatMoney(duePayment)}，银行信用提升。` });
      return { ...draft, status: 'paid', paidDate: { month: gameDate.month, day: gameDate.day } };
    }

    const shortfall = duePayment - Math.max(0, f.cash);
    const paidNow = Math.max(0, f.cash);
    f.cash = 0;
    nextDrafts.creditUsed = Math.max(0, (nextDrafts.creditUsed || 0) - draft.amount);
    nextDrafts.totalDraftsDefaulted = (nextDrafts.totalDraftsDefaulted || 0) + draft.amount;
    nextDrafts.bankReputation = Math.max(0, (nextDrafts.bankReputation || 70) - 15);
    nextDrafts.consecutivePaid = 0;
    nextGmWealth.morale = Math.max(0, (nextGmWealth.morale || 80) - 20);
    ledgerItems.push({ label: `汇票兑付不足(${draft.carModel} ×${draft.carCount})`, amount: -paidNow, type: 'expense' });
    logs.push({ day: absoluteDay, type: 'expense', message: `🚨【汇票逾期】${draft.carModel} ${draft.carCount}台汇票今日到期，应付 ${formatMoney(duePayment)}，缺口 ${formatMoney(shortfall)}。银行信用下降，GM士气受挫。` });
    inboxItems.push({
      id: `inbox_draft_default_${draft.id}`,
      day: absoluteDay,
      from: '合作银行',
      title: '汇票兑付逾期通知',
      body: `${draft.carModel} ${draft.carCount}台对应汇票到期未足额兑付，缺口${formatMoney(shortfall)}。请尽快回款或垫资处理，逾期按日计罚息。`,
    });
    return { ...draft, status: 'defaulted', defaultDate: { month: gameDate.month, day: gameDate.day }, overduePrincipal: shortfall, overduePenalty: 0, creditReleased: true };
  });

  return {
    finance: f,
    drafts: nextDrafts,
    gmWealth: nextGmWealth,
    logs,
    inboxItems,
    ledgerItems,
    draftPenaltyToday,
  };
};
