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
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-4xl mb-3" aria-hidden="true">
          💰
        </div>
        <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          What's coming in each month?
        </h1>
        <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed">
          Your take-home pay after tax. We need this to build a plan that actually works for you.
        </p>

        <label className="font-cactus font-bold text-sm text-cactus-charcoal block mb-2">
          💼 Primary income (salary)
        </label>
        <MoneyInput value={primary} onChange={setPrimary} placeholder="e.g. 35,000" />
        <p className="font-cactus text-[11.5px] text-cactus-charcoal/40 font-medium mt-1.5 mb-6">
          After tax — what actually hits your account
        </p>

        {secondary.length > 0 && (
          <div className="mb-4">
            <span className="font-cactus font-bold text-sm text-cactus-charcoal block mb-2.5">
              Other income
            </span>
            {secondary.map((src) => (
              <div key={src.id} className="flex items-center gap-2.5 mb-2.5 animate-fade-up">
                <span className="text-lg" aria-hidden="true">
                  {src.icon}
                </span>
                <div className="flex-1">
                  <span className="font-cactus font-semibold text-[13px] text-cactus-charcoal block mb-1">
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
                  className="bg-transparent border-none text-base text-cactus-charcoal/30 cursor-pointer p-1"
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
          className="flex items-center gap-1.5 bg-transparent border-2 border-dashed border-cactus-overlay rounded-xl py-3 px-4 w-full cursor-pointer font-cactus font-semibold text-[13px] text-cactus-sage mb-3"
        >
          <span className="text-base">+</span> Add other income source
        </button>

        {showAdd && (
          <div className="bg-cactus-sage-light/50 rounded-xl p-3 mb-4 animate-fade-up">
            <p className="font-cactus text-[11px] text-cactus-charcoal/50 font-semibold m-0 mb-2">
              What kind of income?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {incomeSourceTypes
                .filter((t) => !secondary.find((s) => s.id === t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addSource(t)}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-full border-[1.5px] border-cactus-overlay bg-white cursor-pointer font-cactus font-semibold text-xs text-cactus-charcoal"
                  >
                    <span className="text-sm">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {totalIncome > 0 && (
          <div className="bg-cactus-needs-bg rounded-2xl p-3.5 px-4 animate-fade-up">
            <div className="flex justify-between items-center">
              <span className="font-cactus font-bold text-sm text-cactus-charcoal">
                Total monthly income
              </span>
              <span className="font-cactus font-bold text-base text-cactus-sage">
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
