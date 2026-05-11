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
  onContinue: () => void;
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, number> = {};
      for (const row of [...needsRows, ...wantsRows]) {
        payload[row.name] = parseInt(amounts[row.name]) || 0;
      }
      await apiClient.post('/onboarding/response', {
        stepNumber: 4,
        stepName: 'Per-category estimates',
        response: JSON.stringify(payload),
      });
    },
    onSuccess: () => onContinue(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-4xl mb-2.5" aria-hidden="true">
          ⚡
        </div>
        <h1 className="font-cactus font-bold text-[21px] text-cactus-charcoal m-0 mb-1.5">
          Quick estimates
        </h1>
        <p className="font-cactus text-[13.5px] text-cactus-charcoal/40 font-medium m-0 mb-1 leading-relaxed">
          Roughly how much do you spend per month on each? Don't overthink it — ballpark is perfect.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-cactus-needs-bg rounded-lg py-1.5 px-2.5 mb-5 mt-2">
          <span className="text-sm" aria-hidden="true">
            ⏱️
          </span>
          <span className="font-cactus text-xs font-semibold text-cactus-charcoal/50">
            Should take less than 5 minutes
          </span>
        </div>
        <p className="font-cactus text-[11.5px] text-cactus-charcoal/40 font-medium m-0 mb-4 leading-relaxed">
          The real numbers will flow in once your bank is connected. This is just to get you started
          — momentum is what matters. 🚀
        </p>

        <EstimateBucket
          label="Needs"
          dotClass="bg-cactus-sage"
          rows={needsRows}
          amounts={amounts}
          setAmount={setAmount}
          total={totalNeeds}
        />
        <EstimateBucket
          label="Wants"
          dotClass="bg-cactus-desert"
          rows={wantsRows}
          amounts={amounts}
          setAmount={setAmount}
          total={totalWants}
        />

        {grandTotal > 0 && (
          <div className="bg-cactus-sandstone/80 border border-cactus-overlay rounded-xl py-3 px-3.5 flex justify-between items-center mb-2">
            <span className="font-cactus font-bold text-sm text-cactus-charcoal">
              Estimated monthly spend
            </span>
            <span className="font-cactus font-bold text-base text-cactus-charcoal">
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
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2.5 h-2.5 rounded-sm ${dotClass}`} />
        <span className="font-cactus font-bold text-sm text-cactus-charcoal">{label}</span>
        <span className="font-cactus font-semibold text-xs text-cactus-charcoal/30 ml-auto">
          {fmt(total)}
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center gap-2.5 py-2.5 border-b border-cactus-overlay"
        >
          <span className="text-lg shrink-0" aria-hidden="true">
            {row.icon}
          </span>
          <span className="font-cactus font-semibold text-sm text-cactus-charcoal flex-1">
            {row.name}
          </span>
          <div className="flex items-center gap-0.5 bg-cactus-sandstone rounded-lg py-2 px-3 w-[110px]">
            <span className="font-cactus font-semibold text-sm text-cactus-charcoal/40">R</span>
            <input
              type="text"
              inputMode="numeric"
              value={amounts[row.name] ?? ''}
              onChange={(e) => setAmount(row.name, e.target.value)}
              placeholder="0"
              className="border-none bg-transparent outline-none font-cactus font-semibold text-sm text-cactus-charcoal w-full text-right"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
