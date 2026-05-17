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
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-3xl mb-3" aria-hidden="true">
          {c.emoji}
        </div>
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Goal detail
        </p>
        <h1 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          {c.title}
        </h1>
        <p className="font-sans-brand text-[13.5px] text-brand-text-muted m-0 mb-7 leading-relaxed">
          {c.subtitle}
        </p>

        <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Target amount
        </label>
        <MoneyInput value={amount} onChange={setAmount} placeholder={c.amountPlaceholder} />

        <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2 mt-5">
          I want to reach this in
        </label>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 12"
            className="flex-1 bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl py-3 px-4 font-display font-medium tabular-lining text-[1.125rem] text-brand-text placeholder:text-brand-text-faint outline-none transition-all"
          />
          <span className="font-sans-brand font-semibold text-[14px] text-brand-text-muted">
            months
          </span>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl py-4 px-4 mt-6 mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="font-sans-brand text-[12px] text-brand-text-muted">
              Monthly income
            </span>
            <span className="font-display font-medium tabular-lining text-[13px] text-brand-text">
              {fmt(totalIncome)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-sans-brand text-[12px] text-brand-text-muted">
              Estimated expenses
            </span>
            <span className="font-display font-medium tabular-lining text-[13px] text-brand-text-muted">
              − {fmt(totalExpenses)}
            </span>
          </div>
          <div className="flex justify-between border-t border-brand-border pt-2 mt-1">
            <span className="font-sans-brand font-semibold text-[13px] text-brand-text">
              Available for goals
            </span>
            <span
              className={`font-display font-medium tabular-lining text-[14px] ${leftover >= 0 ? 'text-brand-sage' : 'text-brand-terracotta'}`}
            >
              {fmt(leftover)}/mo
            </span>
          </div>
        </div>

        {amtNum > 0 && monthsNum > 0 && (
          <div
            className={`rounded-2xl border-l-[3px] rounded-r-2xl p-4 animate-fade-up ${
              canAfford
                ? 'bg-brand-sage-soft/60 border-brand-sage'
                : 'bg-brand-terracotta-soft border-brand-terracotta'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{canAfford ? '✅' : '⚠️'}</span>
              <span className="font-sans-brand font-semibold text-[14px] text-brand-text">
                {canAfford ? "That's doable!" : 'Might be a stretch'}
              </span>
            </div>
            <div
              className={`font-display font-medium tabular-lining text-[1.75rem] leading-[1.1] tracking-[-0.018em] mb-1.5 ${canAfford ? 'text-brand-sage' : 'text-brand-terracotta'}`}
            >
              {fmt(monthlyNeeded)}/month
            </div>
            <p className="font-sans-brand text-[12px] text-brand-text-muted m-0 leading-relaxed">
              {canAfford
                ? `That's ${Math.round((monthlyNeeded / leftover) * 100)}% of your available ${fmt(leftover)}/mo — totally achievable.`
                : `You have ${fmt(leftover)}/mo available. Consider extending your timeline or adjusting your expenses.`}
            </p>
            {!canAfford && leftover > 0 && (
              <p className="font-sans-brand text-[12px] text-brand-text-faint mt-2 m-0">
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
