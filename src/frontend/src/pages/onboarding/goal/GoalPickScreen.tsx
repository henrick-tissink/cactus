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
  onContinue: () => void;
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
    onSuccess: () => onContinue(),
  });

  const handleLockIn = () => {
    if (!selected) return;
    saveMutation.mutate(selected);
  };

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-7">
        <div className="text-4xl mb-3" aria-hidden="true">
          🏁
        </div>
        <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          Let's set your first goal
        </h1>
        <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-1.5 leading-relaxed">
          Pick one to start with. Just one — you can always add more later.
        </p>
        <p className="font-cactus text-[12.5px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-snug">
          Starting small keeps things manageable. Once this one's rolling, we'll help you stack more
          goals on top. 🧱
        </p>

        {recommendation && (
          <div className="bg-cactus-sage-light/40 rounded-2xl px-4 py-3 mb-5 animate-fade-up">
            <p className="font-cactus text-[13px] text-cactus-charcoal/70 font-medium m-0 leading-relaxed">
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
                className={`flex items-center gap-3.5 p-4 px-[18px] rounded-2xl border-[2.5px] cursor-pointer transition-all text-left animate-fade-up ${
                  isSelected
                    ? `${opt.bgClass} border-current ${opt.colorClass}`
                    : 'bg-white border-cactus-overlay'
                }`}
              >
                <div className="text-3xl shrink-0" aria-hidden="true">
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-cactus font-bold text-base text-cactus-charcoal">
                      {opt.label}
                    </span>
                    {isRecommended && (
                      <span className="font-cactus font-bold text-[10px] uppercase tracking-wide text-cactus-sage bg-cactus-sage-light px-2 py-0.5 rounded-full">
                        Recommended for you
                      </span>
                    )}
                  </div>
                  <span className="font-cactus font-medium text-[12.5px] text-cactus-charcoal/40 leading-snug block">
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
