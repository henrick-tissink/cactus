import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { MoneyInput } from '../../../components/brand/MoneyInput';
import { apiClient } from '../../../api/client';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

interface GoalDetailScreenProps {
  goalType: 'save' | 'debt' | 'emergency';
  totalIncome: number;
  totalExpenses: number;
  onContinue: () => void;
}

const config = {
  save: {
    emoji: '💰',
    title: 'How much do you want to save?',
    subtitle: "Pick a target amount and when you'd like to reach it.",
    amountPlaceholder: 'e.g. 50,000',
  },
  debt: {
    emoji: '🔓',
    title: 'How much debt do you want to pay off?',
    subtitle: "Total amount across all your debts. We'll work out a monthly plan.",
    amountPlaceholder: 'e.g. 30,000',
  },
};

export function GoalDetailScreen({
  goalType,
  totalIncome,
  totalExpenses,
  onContinue,
}: GoalDetailScreenProps) {
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const c = config[goalType as 'save' | 'debt'] ?? config.save;

  const leftover = totalIncome - totalExpenses;
  const amtNum = parseInt(amount) || 0;
  const monthsNum = parseInt(months) || 0;
  const monthlyNeeded = monthsNum > 0 ? Math.ceil(amtNum / monthsNum) : 0;
  const canAfford = monthlyNeeded > 0 && monthlyNeeded <= leftover;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 12,
        stepName: 'Goal target amount',
        response: JSON.stringify(amount),
      });
      await apiClient.post('/onboarding/response', {
        stepNumber: 13,
        stepName: 'Goal target months',
        response: JSON.stringify(months),
      });
    },
    onSuccess: () => onContinue(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-4xl mb-3" aria-hidden="true">
          {c.emoji}
        </div>
        <h1 className="font-cactus font-bold text-[21px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          {c.title}
        </h1>
        <p className="font-cactus text-[13.5px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed">
          {c.subtitle}
        </p>

        <label className="font-cactus font-semibold text-[13px] text-cactus-charcoal/50 block mb-2">
          Target amount
        </label>
        <MoneyInput value={amount} onChange={setAmount} placeholder={c.amountPlaceholder} />

        <label className="font-cactus font-semibold text-[13px] text-cactus-charcoal/50 block mb-2 mt-5">
          I want to reach this in
        </label>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 12"
            className="flex-1 bg-white border-2 border-cactus-overlay rounded-xl py-3 px-4 font-cactus font-bold text-lg text-cactus-charcoal outline-none focus:border-cactus-sage"
          />
          <span className="font-cactus font-semibold text-[15px] text-cactus-charcoal/40">
            months
          </span>
        </div>

        <div className="bg-cactus-sandstone/80 border border-cactus-overlay rounded-xl py-3 px-3.5 mt-5 mb-4">
          <div className="flex justify-between mb-1">
            <span className="font-cactus font-medium text-xs text-cactus-charcoal/40">
              Monthly income
            </span>
            <span className="font-cactus font-semibold text-xs text-cactus-charcoal/50">
              {fmt(totalIncome)}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-cactus font-medium text-xs text-cactus-charcoal/40">
              Estimated expenses
            </span>
            <span className="font-cactus font-semibold text-xs text-cactus-charcoal/50">
              – {fmt(totalExpenses)}
            </span>
          </div>
          <div className="flex justify-between border-t border-cactus-overlay pt-1 mt-1">
            <span className="font-cactus font-bold text-[13px] text-cactus-charcoal">
              Available for goals
            </span>
            <span
              className={`font-cactus font-bold text-[13px] ${leftover >= 0 ? 'text-cactus-sage' : 'text-cactus-prickly'}`}
            >
              {fmt(leftover)}/mo
            </span>
          </div>
        </div>

        {amtNum > 0 && monthsNum > 0 && (
          <div
            className={`rounded-2xl p-4 animate-fade-up ${canAfford ? 'bg-cactus-needs-bg' : 'bg-cactus-goals-bg'}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{canAfford ? '✅' : '⚠️'}</span>
              <span className="font-cactus font-bold text-[15px] text-cactus-charcoal">
                {canAfford ? "That's doable!" : 'Might be a stretch'}
              </span>
            </div>
            <div
              className={`font-cactus font-bold text-[22px] mb-1 ${canAfford ? 'text-cactus-sage' : 'text-cactus-prickly'}`}
            >
              {fmt(monthlyNeeded)}/month
            </div>
            <p className="font-cactus text-xs text-cactus-charcoal/50 font-medium m-0">
              {canAfford
                ? `That's ${Math.round((monthlyNeeded / leftover) * 100)}% of your available ${fmt(leftover)}/mo — totally achievable.`
                : `You have ${fmt(leftover)}/mo available. Consider extending your timeline or adjusting your expenses.`}
            </p>
            {!canAfford && leftover > 0 && (
              <p className="font-cactus text-xs text-cactus-charcoal/40 font-medium mt-2 m-0">
                💡 At {fmt(leftover)}/month, it would take {Math.ceil(amtNum / leftover)} months
                instead.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={!amtNum || saveMutation.isPending}>
          Lock in my goal
        </Btn>
      </div>
    </div>
  );
}
