import { getStoryInboxDetails, isStoryInboxMessage } from './storyInbox.js';

export const INBOX_TYPE_LABELS = {
  all: '全部',
  story: '剧情',
  operating_event: '事件',
  crm: '客户',
  sales_opportunity: '机会',
  manufacturer: '厂家',
  bank: '银行',
  market: '市场',
  system: '系统',
};

export const getInboxType = (message = {}) => {
  if (isStoryInboxMessage(message)) return 'story';
  if (message.type === 'operating_event') return 'operating_event';
  if (message.type === 'sales_opportunity') return 'sales_opportunity';
  if (message.type === 'crm') return 'crm';
  const text = `${message.from || ''}${message.title || ''}${message.body || ''}`;
  if (/厂家|商务|返利|政策/.test(text)) return 'manufacturer';
  if (/银行|授信|汇票|贷款|兑付/.test(text)) return 'bank';
  if (/市场|竞品|情报|区域/.test(text)) return 'market';
  return 'system';
};

export const buildMessageFeed = ({
  managerInbox,
  logs,
  limit = 40,
}) => {
  const messageFeed = [
    ...managerInbox.map((message, index) => {
      const sourceType = getInboxType(message);
      const storyDetails = getStoryInboxDetails(message);
      return {
        id: message.id,
        kind: 'inbox',
        order: index,
        day: message.day,
        label: sourceType === 'story' ? '剧情' : sourceType === 'operating_event' ? '事件' : sourceType === 'sales_opportunity' ? '机会' : sourceType === 'crm' ? '客户' : '收件',
        title: message.title,
        body: `${message.from}：${message.body}`,
        tone: storyDetails?.severityMeta?.tone || 'info',
        sourceType,
      };
    }),
    ...logs.map((log, index) => ({
      id: `log_${index}_${log.day}`,
      kind: 'log',
      order: managerInbox.length + index,
      day: log.day,
      label: log.type === 'expense' ? '财务' : log.type === 'success' ? '完成' : log.type === 'warning' ? '预警' : '事件',
      title: log.type === 'expense' ? '资金变动' : log.type === 'success' ? '经营事件' : log.type === 'warning' ? '风险提示' : '经营事件',
      body: log.message,
      tone: log.type,
      sourceType: 'system',
    })),
  ].sort((a, b) => (b.day - a.day) || (b.order - a.order));

  return {
    messageFeed,
    visibleMessageFeed: messageFeed.slice(0, limit),
  };
};

export const filterInboxMessages = ({
  managerInbox,
  selectedInboxDay,
  inboxFilter,
  currentDay,
}) => [...managerInbox].reverse().filter(message => {
  const messageType = getInboxType(message);
  if (selectedInboxDay !== null) return message.day === selectedInboxDay;
  if (inboxFilter.type !== 'all' && messageType !== inboxFilter.type) return false;
  const rawSpecificDay = String(inboxFilter.specificDay || '').replace(/[^\d]/g, '');
  if (rawSpecificDay && message.day !== Number(rawSpecificDay)) return false;
  if (inboxFilter.dayRange === 'today') return message.day === currentDay;
  if (inboxFilter.dayRange === '7') return message.day >= Math.max(1, currentDay - 6);
  if (inboxFilter.dayRange === '30') return message.day >= Math.max(1, currentDay - 29);
  return true;
});

export const countUrgentOperations = ({
  approvalCases,
  customerDeals,
  salesOpportunities,
  defaultedDrafts,
  currentDay,
}) => approvalCases.filter(item => item.status === 'pending').length
  + customerDeals.filter(item => item.status === 'pending' && item.dueDay <= currentDay + 1).length
  + (salesOpportunities?.active || []).filter(item => (item.dueDay || currentDay) <= currentDay + 1).length
  + defaultedDrafts.length;
