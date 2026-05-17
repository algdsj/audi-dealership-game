export const expirePendingCases = ({
  approvalCases = [],
  customerDeals = [],
  absoluteDay,
}) => {
  const pendingApprovalCases = approvalCases.filter(item => item.status === 'pending');
  const pendingCustomerDeals = customerDeals.filter(item => item.status === 'pending');
  const expiredApprovalCases = pendingApprovalCases.filter(item => item.dueDay < absoluteDay);
  const nextApprovalCases = pendingApprovalCases.filter(item => item.dueDay >= absoluteDay);
  const expiredCustomerDeals = pendingCustomerDeals.filter(item => item.dueDay < absoluteDay);
  const nextCustomerDeals = pendingCustomerDeals.filter(item => item.dueDay >= absoluteDay);
  const logs = [];
  let expiredCsiPenalty = 0;
  let expiredComplaintCount = 0;

  for (const item of expiredApprovalCases) {
    if (item.type === 'price') {
      logs.push({ day: absoluteDay, type: 'warning', message: `🧾【价格审批过期】${item.modelName} 客户因未及时批价流失，销售顾问反馈客户转向竞品。` });
    } else if (item.type === 'negotiation') {
      logs.push({ day: absoluteDay, type: 'warning', message: `📨【谈判过期】${item.title} 未及时选择口径，对方窗口期关闭。` });
    } else {
      const penalty = item.impact + 2;
      logs.push({ day: absoluteDay, type: 'warning', message: `😤【客诉升级】${item.title} 未及时处理，CSI下降 ${penalty} 分。` });
      expiredCsiPenalty += penalty;
      expiredComplaintCount++;
    }
  }
  for (const item of expiredCustomerDeals) {
    logs.push({ day: absoluteDay, type: 'warning', message: `👤【重点客户流失】${item.customerName}（${item.archetypeName}）没有及时谈判，转向竞品门店。` });
  }

  return {
    approvalCases: nextApprovalCases,
    customerDeals: nextCustomerDeals,
    expiredCsiPenalty,
    expiredComplaintCount,
    logs,
  };
};
