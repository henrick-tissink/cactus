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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-brand-cream font-sans-brand animate-fade-up">
      <div className="text-5xl mb-5" aria-hidden="true">
        🌵
      </div>
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
        All set
      </p>
      <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text m-0 mb-3 max-w-sm">
        You're ready.
      </h1>
      <p className="font-sans-brand text-[15px] text-brand-text-muted m-0 mb-2 leading-relaxed max-w-xs">
        Your Spending Plan is ready with{' '}
        <span className="font-display font-medium tabular-lining text-brand-text">
          {fmt(monthlyGoalAmount)}/month
        </span>{' '}
        going toward {goalLabels[goalType] ?? 'your goal'}.
      </p>
      <p className="font-sans-brand text-[13px] text-brand-text-faint m-0 mb-7 leading-relaxed max-w-[280px]">
        Next up: connecting your bank so real transactions start flowing in. The more you use
        Cactus, the smarter it gets. 💪
      </p>
      <div className="bg-brand-sage-soft border border-brand-sage/20 rounded-full py-2.5 px-5 inline-flex items-center gap-2 mb-9">
        <span className="text-base" aria-hidden="true">
          🏦
        </span>
        <span className="font-sans-brand font-semibold text-[13px] text-brand-text">
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
