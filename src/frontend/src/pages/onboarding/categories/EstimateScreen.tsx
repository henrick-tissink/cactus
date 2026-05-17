import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { defaultCategories, extraCategories, type CategoryDef } from './data';

const allCategories: CategoryDef[] = [...defaultCategories, ...extraCategories];
const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

interface EstimateScreenProps {
  selectedNeeds: string[];
  selectedWants: string[];
  onContinue: (estimates: Record<string, number>) => void;
}

export function EstimateScreen({ selectedNeeds, selectedWants, onContinue }: EstimateScreenProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const needsRows = useMemo(
    () =>
      selectedNeeds
        .map((name) => allCategories.find((c) => c.name === name))
        .filter(Boolean) as CategoryDef[],
    [selectedNeeds]
  );
  const wantsRows = useMemo(
    () =>
      selectedWants
        .map((name) => allCategories.find((c) => c.name === name))
        .filter(Boolean) as CategoryDef[],
    [selectedWants]
  );

  const totalNeeds = needsRows.reduce((s, c) => s + (parseInt(amounts[c.name]) || 0), 0);
  const totalWants = wantsRows.reduce((s, c) => s + (parseInt(amounts[c.name]) || 0), 0);
  const grandTotal = totalNeeds + totalWants;

  const setAmount = (name: string, raw: string) => {
    setAmounts((prev) => ({ ...prev, [name]: raw.replace(/[^0-9]/g, '') }));
  };

  const buildPayload = (): Record<string, number> => {
    const payload: Record<string, number> = {};
    for (const row of [...needsRows, ...wantsRows]) {
      payload[row.name] = parseInt(amounts[row.name]) || 0;
    }
    return payload;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 4,
        stepName: 'Per-category estimates',
        response: JSON.stringify(buildPayload()),
      });
    },
    onSuccess: () => onContinue(buildPayload()),
  });

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-3xl mb-3" aria-hidden="true">
          ⚡
        </div>
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Ballpark
        </p>
        <h1 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          Quick estimates.
        </h1>
        <p className="font-sans-brand text-[13.5px] text-brand-text-muted m-0 mb-3 leading-relaxed">
          Roughly how much do you spend per month on each? Don't overthink it — ballpark is perfect.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-brand-sage-soft/60 border border-brand-sage/20 rounded-full py-1 px-3 mb-5">
          <span className="text-sm" aria-hidden="true">
            ⏱️
          </span>
          <span className="font-sans-brand text-[11px] uppercase tracking-[0.14em] font-semibold text-brand-sage">
            Less than 5 minutes
          </span>
        </div>
        <p className="font-sans-brand text-[12px] text-brand-text-faint m-0 mb-6 leading-relaxed">
          The real numbers will flow in once your bank is connected. This is just to get you started
          — momentum is what matters. 🚀
        </p>

        <EstimateBucket
          label="Needs"
          dotClass="bg-brand-sage"
          rows={needsRows}
          amounts={amounts}
          setAmount={setAmount}
          total={totalNeeds}
        />
        <EstimateBucket
          label="Wants"
          dotClass="bg-brand-terracotta"
          rows={wantsRows}
          amounts={amounts}
          setAmount={setAmount}
          total={totalWants}
        />

        {grandTotal > 0 && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl py-3.5 px-4 flex justify-between items-center mb-3">
            <span className="font-sans-brand font-semibold text-[14px] text-brand-text">
              Estimated monthly spend
            </span>
            <span className="font-display font-medium tabular-lining text-[1.125rem] text-brand-text">
              {fmt(grandTotal)}
            </span>
          </div>
        )}
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Next
        </Btn>
      </div>
    </div>
  );
}

interface EstimateBucketProps {
  label: string;
  dotClass: string;
  rows: CategoryDef[];
  amounts: Record<string, string>;
  setAmount: (name: string, raw: string) => void;
  total: number;
}

function EstimateBucket({ label, dotClass, rows, amounts, setAmount, total }: EstimateBucketProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text">
          {label}
        </span>
        <span className="font-display font-medium tabular-lining text-[13px] text-brand-text-faint ml-auto">
          {fmt(total)}
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-3 py-3 border-b border-brand-border">
          <span className="text-lg shrink-0" aria-hidden="true">
            {row.icon}
          </span>
          <span className="font-sans-brand font-semibold text-[14px] text-brand-text flex-1">
            {row.name}
          </span>
          <div className="flex items-center gap-1 bg-brand-cream/60 border border-brand-border focus-within:border-brand-sage focus-within:bg-brand-surface focus-within:ring-2 focus-within:ring-brand-sage/15 rounded-xl py-2 px-3 w-[120px] transition-all">
            <span className="font-display font-medium tabular-lining text-[14px] text-brand-text-faint">
              R
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amounts[row.name] ?? ''}
              onChange={(e) => setAmount(row.name, e.target.value)}
              placeholder="0"
              className="border-none bg-transparent outline-none font-display font-medium tabular-lining text-[14px] text-brand-text placeholder:text-brand-text-faint w-full text-right"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
