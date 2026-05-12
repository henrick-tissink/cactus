import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

const goalLabels: Record<string, string> = {
  save: 'saving',
  debt: 'debt payoff',
  emergency: 'emergency fund',
};

interface FinalScreenProps {
  goalType: 'save' | 'debt' | 'emergency';
  monthlyGoalAmount: number;
}

export function FinalScreen({ goalType, monthlyGoalAmount }: FinalScreenProps) {
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/complete');
    },
    onSuccess: () => {
      updateUser({ isOnboardingComplete: true });
      navigate('/');
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <div className="text-6xl mb-4" aria-hidden="true">
        🌵
      </div>
      <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal m-0 mb-2">
        You're all set!
      </h1>
      <p className="font-cactus text-[15px] text-cactus-charcoal/60 font-medium m-0 mb-1.5 leading-relaxed max-w-xs">
        Your Spending Plan is ready with {fmt(monthlyGoalAmount)}/month going toward{' '}
        {goalLabels[goalType] ?? 'your goal'}.
      </p>
      <p className="font-cactus text-[13px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed max-w-[260px]">
        Next up: connecting your bank so real transactions start flowing in. The more you use
        Cactus, the smarter it gets. 💪
      </p>
      <div className="bg-cactus-sage-light rounded-xl py-3.5 px-5 inline-flex items-center gap-2 mb-8">
        <span className="text-lg" aria-hidden="true">
          🏦
        </span>
        <span className="font-cactus font-semibold text-sm text-cactus-charcoal">
          Bank connection coming next…
        </span>
      </div>
      <div className="w-auto">
        <Btn
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="px-12"
        >
          Take me to my Dashboard
        </Btn>
      </div>
    </div>
  );
}
