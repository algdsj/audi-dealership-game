import { resolveStoryInboxAction } from '../game/engine/storyActions.js';

export function useStoryInboxActions({
  storyState,
  setStoryState,
  setManagerInbox,
  setLogs,
  setReadInboxIds,
  currentDay,
}) {
  const handleResolveStoryAction = ({ message, actionId }) => {
    const result = resolveStoryInboxAction({
      storyState,
      message,
      actionId,
      day: currentDay,
    });

    setStoryState(result.storyState);
    setManagerInbox(prev => prev.map(item => (
      item.id === message.id ? { ...item, ...result.inboxPatch } : item
    )));
    setLogs(prev => [...prev, result.log]);
    setReadInboxIds(prev => new Set([...prev, message.id]));
  };

  return {
    handleResolveStoryAction,
  };
}
