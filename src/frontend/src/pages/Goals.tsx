import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type GoalDto, type GoalRecommendation, GoalType } from '../types';
import {
  Plus,
  Target,
  Sparkles,
  X,
  TrendingUp,
  Check,
  Trophy,
  Wallet,
  PiggyBank,
  CreditCard,
  LineChart,
  AlertCircle,
  Star,
} from 'lucide-react';

type GoalTypeStyle = {
  label: string;
  icon: typeof Target;
  iconBg: string;
  iconText: string;
  borderActive: string;
};

const GOAL_TYPE_INFO: Record<number, GoalTypeStyle> = {
  [GoalType.MiniBuffer]: {
    label: 'Mini Buffer',
    icon: Wallet,
    iconBg: 'bg-brand-terracotta-soft',
    iconText: 'text-brand-accent-ink',
    borderActive: 'border-brand-terracotta/60',
  },
  [GoalType.DebtPayoff]: {
    label: 'Debt Payoff',
    icon: CreditCard,
    iconBg: 'bg-brand-accent-ink/10',
    iconText: 'text-brand-accent-ink',
    borderActive: 'border-brand-accent-ink/40',
  },
  [GoalType.EmergencyFund]: {
    label: 'Emergency Fund',
    icon: PiggyBank,
    iconBg: 'bg-brand-terracotta-soft',
    iconText: 'text-brand-accent-ink',
    borderActive: 'border-brand-terracotta/60',
  },
  [GoalType.Savings]: {
    label: 'Savings',
    icon: Target,
    iconBg: 'bg-brand-sage-soft',
    iconText: 'text-brand-sage',
    borderActive: 'border-brand-sage/60',
  },
  [GoalType.Investment]: {
    label: 'Investment',
    icon: LineChart,
    iconBg: 'bg-brand-border/50',
    iconText: 'text-brand-text-muted',
    borderActive: 'border-brand-border',
  },
};

export function GoalsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalDto | null>(null);

  // Fetch goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiClient.get<GoalDto[]>('/goals');
      return response.data;
    },
  });

  // Fetch recommended sequence
  const { data: recommendations } = useQuery({
    queryKey: ['goal-recommendations'],
    queryFn: async () => {
      const response = await apiClient.get<GoalRecommendation[]>('/goals/recommended-sequence');
      return response.data;
    },
  });

  // Set primary goal mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (goalId: string) => {
      await apiClient.post(`/goals/${goalId}/set-primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const activeGoals = goals?.filter((g) => g.isActive && !g.isCompleted) || [];
  const completedGoals = goals?.filter((g) => g.isCompleted) || [];
  const primaryGoal = activeGoals.find((g) => g.isPrimary);
  const nonPrimaryActiveGoals = activeGoals.filter((g) => !g.isPrimary);

  const handleSetPrimary = (goalId: string) => {
    setPrimaryMutation.mutate(goalId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const openProgressModal = (goal: GoalDto) => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  if (isLoading) {
    return (
      <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-brand-border/50 rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-brand-border/50 rounded-3xl"></div>
            <div className="h-48 bg-brand-border/50 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
              {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
            </p>
            <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
              Goals.
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] text-white bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New goal
          </button>
        </header>

        {/* Recommended Sequence (if no goals yet) */}
        {activeGoals.length === 0 && recommendations && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2.5 bg-brand-sage-soft rounded-2xl shrink-0">
                <Sparkles className="w-5 h-5 text-brand-sage" />
              </div>
              <div>
                <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
                  Recommended
                </p>
                <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
                  Your goal sequence
                </h2>
                <p className="text-[14px] text-brand-text-muted leading-relaxed mt-2">
                  Following the Cactus methodology, here's the recommended order for your goals.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const typeInfo = GOAL_TYPE_INFO[rec.goalType];
                const Icon = typeInfo?.icon || Target;
                return (
                  <div
                    key={rec.order}
                    className="flex items-center gap-4 bg-brand-cream/40 border border-brand-border rounded-2xl p-4"
                  >
                    <div className="bg-brand-sage text-white font-display font-medium tabular-lining text-[15px] rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div
                      className={`p-2 rounded-xl ${typeInfo?.iconBg || 'bg-brand-border/50'} ${typeInfo?.iconText || 'text-brand-text-muted'} shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-brand-text font-semibold text-[14px]">{rec.title}</p>
                        {rec.alreadyExists && (
                          <span className="px-2 py-0.5 bg-brand-sage-soft text-brand-sage text-[10px] uppercase font-semibold tracking-[0.14em] rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-brand-text-muted leading-relaxed mt-0.5">
                        {rec.description}
                      </p>
                      {rec.alreadyExists && rec.currentProgress > 0 && rec.suggestedAmount > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-brand-border/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-sage"
                              style={{
                                width: `${Math.min((rec.currentProgress / rec.suggestedAmount) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[12px] text-brand-text-faint mt-1">
                            <span className="font-semibold tabular-lining">
                              {formatCurrency(rec.currentProgress)}
                            </span>{' '}
                            of{' '}
                            <span className="font-semibold tabular-lining">
                              {formatCurrency(rec.suggestedAmount)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    {rec.suggestedAmount > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-faint font-semibold">
                          Suggested
                        </p>
                        <p className="font-display font-medium tabular-lining text-[17px] text-brand-text mt-0.5">
                          {formatCurrency(rec.suggestedAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Goal (Highlighted) */}
        {primaryGoal && (
          <div className="mb-8">
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
              Primary focus
            </p>
            <GoalCard
              goal={primaryGoal}
              isPrimary={true}
              onUpdateProgress={() => openProgressModal(primaryGoal)}
            />
          </div>
        )}

        {/* Other Active Goals */}
        {nonPrimaryActiveGoals.length > 0 && (
          <div className="mb-8">
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
              Other active goals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nonPrimaryActiveGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={() => openProgressModal(goal)}
                  onSetPrimary={() => handleSetPrimary(goal.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-brand-sage" />
              Completed
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} completed />
              ))}
            </div>
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateModal && (
          <CreateGoalModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['goals'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              setShowCreateModal(false);
            }}
          />
        )}

        {/* Update Progress Modal */}
        {showProgressModal && selectedGoal && (
          <UpdateProgressModal
            goal={selectedGoal}
            onClose={() => {
              setShowProgressModal(false);
              setSelectedGoal(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['goals'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              setShowProgressModal(false);
              setSelectedGoal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  completed,
  isPrimary,
  onUpdateProgress,
  onSetPrimary,
}: {
  goal: GoalDto;
  completed?: boolean;
  isPrimary?: boolean;
  onUpdateProgress?: () => void;
  onSetPrimary?: () => void;
}) {
  const typeInfo = GOAL_TYPE_INFO[goal.goalType];
  const Icon = typeInfo?.icon || Target;
  const iconBg = typeInfo?.iconBg || 'bg-brand-border/50';
  const iconText = typeInfo?.iconText || 'text-brand-text-muted';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Find the next milestone
  const nextMilestone = goal.milestones.find((m) => !m.isReached);

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  const containerClass = isPrimary
    ? 'bg-brand-surface border border-brand-sage/30 rounded-3xl p-6 shadow-[0_24px_56px_-24px_rgba(31,111,74,0.12)] transition-all'
    : completed
      ? 'bg-brand-surface border border-brand-border rounded-3xl p-5 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.08)] opacity-75 transition-all'
      : 'bg-brand-surface border border-brand-border rounded-3xl p-5 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)] hover:border-brand-sage/30 transition-all';

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between mb-5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${iconBg} ${iconText} rounded-2xl w-10 h-10 flex items-center justify-center shrink-0`}
          >
            <Icon className={isPrimary ? 'w-6 h-6' : 'w-5 h-5'} />
          </div>
          <div className="min-w-0">
            <h3
              className={`font-display font-medium tracking-[-0.018em] text-brand-text ${isPrimary ? 'text-[1.5rem] leading-[1.1]' : 'text-[1.125rem] leading-[1.15]'} truncate`}
            >
              {goal.name}
            </h3>
            <p className="text-[12px] uppercase tracking-[0.14em] text-brand-text-faint font-semibold mt-0.5">
              {typeInfo?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPrimary && (
            <div className="bg-brand-sage text-white text-[10px] uppercase font-semibold tracking-[0.14em] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Primary
            </div>
          )}
          {completed && (
            <div className="bg-brand-sage-soft text-brand-sage text-[10px] uppercase font-semibold tracking-[0.14em] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Done
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-1.5">
          <span className="font-display font-medium tabular-lining text-[1.25rem] text-brand-text">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="font-display font-medium tabular-lining text-[0.875rem] text-brand-text-muted">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="h-2.5 bg-brand-border/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sage transition-all duration-500"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <p className="text-[13px] text-brand-text-muted">
            {goal.currentAmount === 0
              ? 'Every rand counts. Start your journey today.'
              : `${goal.progressPercentage.toFixed(0)}% complete`}
          </p>
          {!completed && remaining > 0 && (
            <p className="text-[13px] text-brand-sage font-semibold tabular-lining">
              {formatCurrency(remaining)} to go
            </p>
          )}
        </div>
      </div>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1 mb-2">
            {goal.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex-1 h-1 rounded-full ${
                  milestone.isReached ? 'bg-brand-sage' : 'bg-brand-border/60'
                }`}
                title={milestone.name}
              />
            ))}
          </div>
          {nextMilestone && !completed && (
            <p className="text-[12px] text-brand-text-muted">
              Next: {nextMilestone.name} (
              <span className="font-semibold tabular-lining text-brand-text">
                {formatCurrency(nextMilestone.targetAmount)}
              </span>
              )
            </p>
          )}
          {completed && (
            <p className="text-[12px] text-brand-sage font-semibold">
              All {goal.milestones.length} milestones reached!
            </p>
          )}
        </div>
      )}

      {/* Linked Account/Debt */}
      {(goal.linkedAccountName || goal.linkedDebtName) && (
        <p className="text-[12px] text-brand-text-faint mb-4">
          Linked to: {goal.linkedAccountName || goal.linkedDebtName}
        </p>
      )}

      {/* Action Buttons */}
      {!completed && (
        <div className={`flex gap-2 ${isPrimary ? 'flex-col' : ''}`}>
          {onUpdateProgress && (
            <button
              type="button"
              onClick={onUpdateProgress}
              className={
                isPrimary
                  ? 'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-brand-sage text-white font-semibold text-[13px] shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-all'
                  : 'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors'
              }
            >
              <TrendingUp className="w-4 h-4" />
              Update progress
            </button>
          )}
          {onSetPrimary && !isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
            >
              <Star className="w-4 h-4" />
              Set as primary
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CreateGoalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    goalType: GoalType.Savings as number,
    targetAmount: '',
    targetDate: '',
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/goals', {
        name: formData.name,
        goalType: formData.goalType,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate || null,
      });
    },
    onSuccess,
    onError: (err: Error) => {
      setError(err.message || 'Failed to create goal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const fieldLabel =
    'block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2';
  const fieldInput =
    'w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3 text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all';

  return (
    <div className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans-brand animate-fade-in">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-7 max-w-md w-full max-h-[90vh] overflow-auto shadow-[0_32px_72px_-32px_rgba(31,111,74,0.25)]">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
              New
            </p>
            <h2 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
              Create a goal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-brand-text-faint hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className={fieldLabel}>Goal name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={fieldInput}
              placeholder="e.g., Emergency Fund"
            />
          </div>

          <div>
            <label className={fieldLabel}>Goal type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GOAL_TYPE_INFO).map(([type, info]) => {
                const Icon = info.icon;
                const typeNum = parseInt(type);
                const active = formData.goalType === typeNum;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, goalType: typeNum })}
                    className={`rounded-2xl p-3 flex flex-col items-center gap-2 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                      active
                        ? `${info.iconBg} ${info.borderActive}`
                        : 'bg-brand-surface border-brand-border hover:bg-brand-sage-soft/40'
                    }`}
                  >
                    <div className={`inline-flex p-1.5 rounded-xl ${info.iconBg} ${info.iconText}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-[13px] font-semibold text-brand-text">{info.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Target amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted font-display font-medium tabular-lining">
                R
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                className={`${fieldInput} pl-8 tabular-lining`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Target date (optional)</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={fieldInput}
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.targetAmount || createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-sage text-white font-semibold text-[13px] shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              {createMutation.isPending ? 'Creating…' : 'Create goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateProgressModal({
  goal,
  onClose,
  onSuccess,
}: {
  goal: GoalDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/goals/${goal.id}/progress`, {
        amount: parseFloat(amount),
        note: note || null,
      });
    },
    onSuccess,
    onError: (err: Error) => {
      setError(err.message || 'Failed to update progress');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const remaining = goal.targetAmount - goal.currentAmount;
  const newAmount = goal.currentAmount + (parseFloat(amount) || 0);
  const newPercentage = (newAmount / goal.targetAmount) * 100;

  const fieldLabel =
    'block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2';
  const fieldInput =
    'w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3 text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all';

  return (
    <div className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans-brand animate-fade-in">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-7 max-w-md w-full max-h-[90vh] overflow-auto shadow-[0_32px_72px_-32px_rgba(31,111,74,0.25)]">
        <div className="flex justify-between items-start mb-1 gap-4">
          <div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
              Update
            </p>
            <h2 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
              {goal.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-brand-text-faint hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {error && (
            <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{error}</span>
            </div>
          )}
          {/* Current Progress */}
          <div className="bg-brand-cream/50 border border-brand-border rounded-2xl p-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-brand-text-muted font-semibold">
                Current
              </span>
              <span className="font-display font-medium tabular-lining text-[1.125rem] text-brand-text">
                {formatCurrency(goal.currentAmount)}
              </span>
            </div>
            <div className="h-2 bg-brand-border/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-sage transition-all"
                style={{ width: `${goal.progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[12px] text-brand-text-muted mt-1.5">
              <span className="tabular-lining">{goal.progressPercentage.toFixed(0)}%</span>
              <span>
                <span className="font-semibold tabular-lining text-brand-text">
                  {formatCurrency(remaining)}
                </span>{' '}
                remaining
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className={fieldLabel}>Amount to add</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted font-display font-medium tabular-lining">
                R
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldInput} pl-8 tabular-lining`}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2 flex-wrap">
            {[100, 500, 1000].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="flex-1 bg-brand-sage-soft text-brand-sage font-semibold border border-brand-sage/30 rounded-full px-4 py-2 hover:bg-brand-sage hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors text-[13px] tabular-lining"
              >
                +R{quickAmount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className="flex-1 bg-brand-sage-soft text-brand-sage font-semibold border border-brand-sage/30 rounded-full px-4 py-2 hover:bg-brand-sage hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors text-[13px]"
            >
              Fill
            </button>
          </div>

          {/* Preview */}
          {parseFloat(amount) > 0 && (
            <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3">
              <p className="text-[14px] text-brand-text">
                New balance:{' '}
                <span className="font-display font-medium tabular-lining text-brand-text">
                  {formatCurrency(newAmount)}
                </span>{' '}
                <span className="tabular-lining text-brand-text-muted">
                  ({newPercentage.toFixed(0)}%)
                </span>
              </p>
              {newAmount >= goal.targetAmount && (
                <p className="text-[13px] text-brand-sage font-semibold mt-1 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Goal will be complete!
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className={fieldLabel}>Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={fieldInput}
              placeholder="e.g., Monthly contribution"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) === 0 || updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-sage text-white font-semibold text-[13px] shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving…' : 'Update progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
