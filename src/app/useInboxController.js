import { useState } from 'react';
import { filterInboxMessages } from '../game/viewModels/messageFeed.js';

export function useInboxController({ managerInbox, currentDay }) {
  const [selectedInboxDay, setSelectedInboxDay] = useState(null);
  const [inboxFilter, setInboxFilter] = useState({ type: 'all', dayRange: 'all', specificDay: '' });
  const [readInboxIds, setReadInboxIds] = useState(() => new Set());
  const [expandedInboxIds, setExpandedInboxIds] = useState(() => new Set());
  const [expandedMessageIds, setExpandedMessageIds] = useState(() => new Set());

  const toggleInboxRead = (id) => setReadInboxIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleExpandedInbox = (id) => setExpandedInboxIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleExpandedMessage = (id) => setExpandedMessageIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openInboxForDay = (targetDay = null) => {
    setSelectedInboxDay(targetDay);
  };

  const filteredInboxMessages = filterInboxMessages({ managerInbox, selectedInboxDay, inboxFilter, currentDay });
  const unreadInboxCount = managerInbox.filter(msg => !readInboxIds.has(msg.id)).length;

  return {
    selectedInboxDay,
    setSelectedInboxDay,
    inboxFilter,
    setInboxFilter,
    readInboxIds,
    setReadInboxIds,
    expandedInboxIds,
    setExpandedInboxIds,
    expandedMessageIds,
    toggleInboxRead,
    toggleExpandedInbox,
    toggleExpandedMessage,
    openInboxForDay,
    filteredInboxMessages,
    unreadInboxCount,
  };
}
