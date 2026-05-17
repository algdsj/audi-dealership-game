import { useState } from 'react';
import {
  createInitialStaffStoryMemory,
  createInitialStoryState,
  createOpeningInbox,
  createOpeningLogs,
} from '../game/state/initialState.js';

export function useNarrativeState({ currentDay }) {
  const [logs, setLogs] = useState(createOpeningLogs);
  const [managerInbox, setManagerInbox] = useState(createOpeningInbox);
  const [storyState, setStoryState] = useState(createInitialStoryState);
  const [staffStoryMemory, setStaffStoryMemory] = useState(createInitialStaffStoryMemory);

  const addLog = (type, message) => {
    setLogs(prev => [...prev, { day: currentDay, type, message }]);
  };

  return {
    addLog,
    logs,
    managerInbox,
    setLogs,
    setManagerInbox,
    setStaffStoryMemory,
    setStoryState,
    staffStoryMemory,
    storyState,
  };
}
