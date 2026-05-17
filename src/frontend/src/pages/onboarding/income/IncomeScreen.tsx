import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { MoneyInput } from '../../../components/brand/MoneyInput';
import { apiClient } from '../../../api/client';
import { incomeSourceTypes, type IncomeSourceType } from './data';

interface SecondaryEntry {
  id: string;
  label: string;
  icon: string;
  amount: string;
}

interface IncomeScreenProps {
  onContinue: (totalIncome: number) => void;
}

export function IncomeScreen({ onContinue }: IncomeScreenProps) {
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState<SecondaryEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const primaryNum = parseInt(primary) || 0;
  const secondaryTotal = secondary.reduce((s, e) => s + (parseInt(e.amount) || 0), 0);
  const totalIncome = primaryNum + secondaryTotal;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 5,
        stepName: 'Monthly Income',
        response: String(primaryNum),
      });
      const secondaryPayload = secondary.map((s) => ({
        type: s.id,
        amount: parseInt(s.amount) || 0,
      }));
      await apiClient.post('/onboarding/response', {
        stepNumber: 11,
        stepName: 'Secondary income sources',
        response: JSON.stringify(secondaryPayload),
      });
    },
    onSuccess: () => onContinue(totalIncome),
  });

  const addSource = (type: IncomeSourceType) => {
    if (secondary.find((s) => s.id === type.id)) return;
    setSecondary((prev) => [...prev, { ...type, amount: '' }]);
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-3xl mb-3" aria-hidden="true">
          💰
        </div>
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Income
        </p>
        <h1 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          What's coming in?
        </h1>
        <p className="font-sans-brand text-[13.5px] text-brand-text-muted m-0 mb-6 leading-relaxed">
          Your take-home pay after tax. We need this to build a plan that actually works for you.
        </p>

        <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          💼 Primary income (salary)
        </label>
        <MoneyInput value={primary} onChange={setPrimary} placeholder="e.g. 35,000" />
        <p className="font-sans-brand text-[12px] text-brand-text-faint mt-2 mb-6 leading-relaxed">
          After tax — what actually hits your account
        </p>

        {secondary.length > 0 && (
          <div className="mb-4">
            <span className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
              Other income
            </span>
            {secondary.map((src) => (
              <div key={src.id} className="flex items-center gap-2.5 mb-3 animate-fade-up">
                <span className="text-lg" aria-hidden="true">
                  {src.icon}
                </span>
                <div className="flex-1">
                  <span className="font-sans-brand font-semibold text-[13px] text-brand-text block mb-1">
                    {src.label}
                  </span>
                  <MoneyInput
                    value={src.amount}
                    onChange={(v) =>
                      setSecondary((prev) =>
                        prev.map((s) => (s.id === src.id ? { ...s, amount: v } : s))
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSecondary((prev) => prev.filter((s) => s.id !== src.id))}
                  aria-label={`Remove ${src.label}`}
                  className="bg-transparent border-none text-base text-brand-text-faint hover:text-brand-text-muted cursor-pointer p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center justify-center gap-2 bg-transparent border-2 border-dashed border-brand-border hover:border-brand-sage/40 rounded-2xl py-3 px-4 w-full cursor-pointer font-sans-brand font-semibold text-[13px] text-brand-sage mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors"
        >
          <span className="text-base">+</span> Add other income source
        </button>

        {showAdd && (
          <div className="bg-brand-sage-soft/40 border border-brand-sage/15 rounded-2xl p-4 mb-4 animate-fade-up">
            <p className="font-sans-brand text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-text-muted m-0 mb-2.5">
              What kind of income?
            </p>
            <div className="flex flex-wrap gap-2">
              {incomeSourceTypes
                .filter((t) => !secondary.find((s) => s.id === t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addSource(t)}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full border border-brand-border bg-brand-surface hover:border-brand-sage/40 cursor-pointer font-sans-brand font-semibold text-[12px] text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
                  >
                    <span className="text-sm">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {totalIncome > 0 && (
          <div className="bg-brand-sage-soft/60 border-l-[3px] border-brand-sage rounded-r-2xl py-4 px-4 animate-fade-up">
            <div className="flex justify-between items-center">
              <span className="font-sans-brand font-semibold text-[14px] text-brand-text">
                Total monthly income
              </span>
              <span className="font-display font-medium tabular-lining text-[1.25rem] text-brand-sage">
                R{totalIncome.toLocaleString('en-ZA')}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={!primaryNum || saveMutation.isPending}>
          Next
        </Btn>
      </div>
    </div>
  );
}
