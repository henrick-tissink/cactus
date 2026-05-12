import { useState } from 'react';
import { Phase2Welcome } from './onboarding/phase2/Phase2Welcome';
import { Phase2Intro } from './onboarding/phase2/Phase2Intro';
import { Phase2Slider } from './onboarding/phase2/Phase2Slider';
import { GoalPickScreen } from './onboarding/goal/GoalPickScreen';
import { GoalDetailScreen } from './onboarding/goal/GoalDetailScreen';
import { CategoryScreen } from './onboarding/categories/CategoryScreen';
import { EstimateScreen } from './onboarding/categories/EstimateScreen';
import { IncomeScreen } from './onboarding/income/IncomeScreen';
import { FinalScreen } from './onboarding/final/FinalScreen';

export function OnboardingPage() {
  const [phase, setPhase] = useState<
    | 'phase2-welcome'
    | 'phase2-intro'
    | 'phase2-slider'
    | 'goal-pick'
    | 'categories'
    | 'estimates'
    | 'income'
    | 'goal-detail'
    | 'final'
  >('phase2-welcome');

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedWants, setSelectedWants] = useState<string[]>([]);
  const [perCategoryEstimates, setPerCategoryEstimates] = useState<Record<string, number>>({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [goalType, setGoalType] = useState<'save' | 'debt' | 'emergency'>('save');
  const [monthlyGoalAmount, setMonthlyGoalAmount] = useState(0);

  const totalExpenses = Object.values(perCategoryEstimates).reduce((a, b) => a + b, 0);

  if (phase === 'phase2-welcome')
    return <Phase2Welcome onContinue={() => setPhase('phase2-intro')} />;

  if (phase === 'phase2-intro')
    return (
      <Phase2Intro
        onContinue={() => setPhase('phase2-slider')}
        onSkip={() => setPhase('goal-pick')}
      />
    );

  if (phase === 'phase2-slider') return <Phase2Slider onContinue={() => setPhase('goal-pick')} />;

  if (phase === 'goal-pick')
    return (
      <GoalPickScreen
        onContinue={(picked) => {
          setGoalType(picked);
          setPhase('categories');
        }}
      />
    );

  if (phase === 'categories')
    return (
      <CategoryScreen
        onContinue={(needs, wants) => {
          setSelectedNeeds(needs);
          setSelectedWants(wants);
          setPhase('estimates');
        }}
      />
    );

  if (phase === 'estimates')
    return (
      <EstimateScreen
        selectedNeeds={selectedNeeds}
        selectedWants={selectedWants}
        onContinue={(estimates) => {
          setPerCategoryEstimates(estimates);
          setPhase('income');
        }}
      />
    );

  if (phase === 'income')
    return (
      <IncomeScreen
        onContinue={(income) => {
          setTotalIncome(income);
          setPhase(goalType === 'emergency' ? 'final' : 'goal-detail');
        }}
      />
    );

  if (phase === 'goal-detail')
    return (
      <GoalDetailScreen
        goalType={goalType}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        onContinue={() => {
          // monthlyGoalAmount is computed best-effort from leftover for emergency,
          // or recomputed from the stored target+months elsewhere later.
          const leftover = Math.max(0, totalIncome - totalExpenses);
          setMonthlyGoalAmount(leftover);
          setPhase('final');
        }}
      />
    );

  return <FinalScreen goalType={goalType} monthlyGoalAmount={monthlyGoalAmount} />;
}
