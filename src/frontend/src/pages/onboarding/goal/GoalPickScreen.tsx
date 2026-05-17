import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { goalOptions, type GoalPickValue } from './data';

interface GoalRecommendationResponse {
  recommendedType: GoalPickValue;
  reason: string;
}

interface GoalPickScreenProps {
  onContinue: (goalType: GoalPickValue) => void;
}

export function GoalPickScreen({ onContinue }: GoalPickScreenProps) {
  const [selected, setSelected] = useState<GoalPickValue | null>(null);

  const { data: recommendation } = useQuery({
    queryKey: ['/onboarding/goal-recommendation'],
    queryFn: async () => {
      const response = await apiClient.get<GoalRecommendationResponse>(
        '/onboarding/goal-recommendation'
      );
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (value: GoalPickValue) => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 6,
        stepName: 'Goal type pick',
        response: JSON.stringify([value]),
      });
    },
    onSuccess: () => onContinue(selected!),
  });

  const handleLockIn = () => {
    if (!selected) return;
    saveMutation.mutate(selected);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="flex-1 pt-7">
        <div className="text-3xl mb-3" aria-hidden="true">
          🏁
        </div>
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          First goal
        </p>
        <h1 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          Pick where to start.
        </h1>
        <p className="font-sans-brand text-[13.5px] text-brand-text-muted m-0 mb-1.5 leading-relaxed">
          Just one for now — you can always add more later.
        </p>
        <p className="font-sans-brand text-[12px] text-brand-text-faint m-0 mb-6 leading-relaxed">
          Starting small keeps things manageable. Once this one's rolling, we'll help you stack more
          goals on top. 🧱
        </p>

        {recommendation && (
          <div className="bg-brand-sage-soft/60 border-l-[3px] border-brand-sage rounded-r-xl px-4 py-3 mb-5 animate-fade-up">
            <p className="font-sans-brand text-[13px] text-brand-text m-0 leading-relaxed">
              💡 Based on what you told us: {recommendation.reason}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {goalOptions.map((opt) => {
            const isSelected = selected === opt.value;
            const isRecommended = recommendation?.recommendedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(isSelected ? null : opt.value)}
                className={`flex items-center gap-3.5 p-4 px-[18px] rounded-2xl border cursor-pointer transition-all text-left animate-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream ${
                  isSelected
                    ? `${opt.bgClass} border-brand-sage/60`
                    : 'bg-brand-surface border-brand-border hover:border-brand-sage/30'
                }`}
              >
                <div className="text-3xl shrink-0" aria-hidden="true">
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-display font-medium text-[1.0625rem] tracking-[-0.012em] text-brand-text">
                      {opt.label}
                    </span>
                    {isRecommended && (
                      <span className="font-sans-brand font-semibold text-[10px] uppercase tracking-[0.14em] text-brand-sage bg-brand-surface border border-brand-sage/40 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="font-sans-brand text-[13px] text-brand-text-muted leading-relaxed block">
                    {opt.subtitle}
                  </span>
                </div>
                {isSelected && (
                  <span className={`${opt.colorClass} text-xl shrink-0`} aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="py-5 pb-7 shrink-0">
        <Btn onClick={handleLockIn} disabled={!selected || saveMutation.isPending}>
          Lock in this goal
        </Btn>
      </div>
    </div>
  );
}
