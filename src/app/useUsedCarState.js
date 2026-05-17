import { useState } from 'react';
import { createInitialUsedCarShowroom } from '../game/state/initialState.js';

export function useUsedCarState() {
  const [usedCarShowroom, setUsedCarShowroom] = useState(createInitialUsedCarShowroom);
  const [usedCars, setUsedCars] = useState([]);

  return {
    setUsedCars,
    setUsedCarShowroom,
    usedCars,
    usedCarShowroom,
  };
}
