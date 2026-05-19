import test from 'node:test';
import assert from 'node:assert/strict';

import { ONBOARDING_TRAINING_DAYS } from '../config/onboardingTraining.js';
import {
  evaluateOnboardingTraining,
  getOnboardingTrainingDay,
  getOnboardingTrainingPlan,
} from './onboardingTraining.js';

test('onboarding training config covers the first 7 days in order', () => {
  const plan = getOnboardingTrainingPlan();

  assert.equal(plan.length, 7);
  assert.deepEqual(plan.map(item => item.day), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(plan.map(item => item.targetTab), ['bi', 'order', 'showroom', 'marketing', 'opportunities', 'csi', 'reports']);
  assert.ok(plan.every(item => item.id && item.title && item.summary && item.actionHint));
  assert.ok(plan.every(item => item.reward || item.completionText));
  assert.ok(plan.every(item => item.checklist.length >= 2));
});

test('getOnboardingTrainingDay returns the matching config item', () => {
  assert.equal(getOnboardingTrainingDay(2)?.id, 'day2_order');
  assert.equal(getOnboardingTrainingDay(99), null);
});

test('evaluateOnboardingTraining returns first incomplete unlocked day and next checklist step', () => {
  const result = evaluateOnboardingTraining({
    dayOfMonth: 4,
    visitedTabs: ['bi', 'order'],
    activity: {
      reviewedBusinessIntelligence: true,
      hasPendingOrderOrInventory: true,
    },
  });

  assert.equal(result.currentTrainingDay.id, 'day3_showroom');
  assert.equal(result.nextStep.targetTab, 'showroom');
  assert.equal(result.nextStep.checklistItem.id, 'open_showroom');
  assert.equal(result.progress.unlockedCompletedDays, 2);
});

test('evaluateOnboardingTraining supports explicit checklist completion ids', () => {
  const result = evaluateOnboardingTraining({
    dayOfMonth: 1,
    completedChecklistIds: ['day1_bi.open_bi', 'review_risk'],
  });

  assert.equal(result.currentTrainingDay.id, 'day2_order');
  assert.equal(result.days[0].completed, true);
});

test('evaluateOnboardingTraining reports finished state when all training ids are complete', () => {
  const result = evaluateOnboardingTraining({
    dayOfMonth: 7,
    completedTrainingIds: ONBOARDING_TRAINING_DAYS.map(item => item.id),
  });

  assert.equal(result.isFinished, true);
  assert.equal(result.nextStep.id, 'finished');
  assert.equal(result.progress.percent, 100);
});
