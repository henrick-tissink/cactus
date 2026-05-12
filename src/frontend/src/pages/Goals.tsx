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
    iconBg: 'bg-cactus-wants-bg',
    iconText: 'text-cactus-charcoal',
    borderActive: 'border-cactus-desert',
  },
  [GoalType.DebtPayoff]: {
    label: 'Debt Payoff',
    icon: CreditCard,
    iconBg: 'bg-cactus-goals-bg',
    iconText: 'text-cactus-prickly',
    borderActive: 'border-cactus-prickly',
  },
  [GoalType.EmergencyFund]: {
    label: 'Emergency Fund',
    icon: PiggyBank,
    iconBg: 'bg-cactus-wants-bg',
    iconText: 'text-cactus-charcoal',
    borderActive: 'border-cactus-desert',
  },
  [GoalType.Savings]: {
    label: 'Savings',
    icon: Target,
    iconBg: 'bg-cactus-sage-light',
    iconText: 'text-cactus-sage',
    borderActive: 'border-cactus-sage',
  },
  [GoalType.Investment]: {
    label: 'Investment',
    icon: LineChart,
    iconBg: 'bg-cactus-overlay',
    iconText: 'text-cactus-charcoal/60',
    borderActive: 'border-cactus-overlay',
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
      <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cactus-overlay rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-cactus-overlay rounded-2xl"></div>
            <div className="h-48 bg-cactus-overlay rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl">Goals</h1>
          <p className="text-cactus-charcoal/60 font-cactus mt-1">
            {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-cactus font-bold text-white bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Recommended Sequence (if no goals yet) */}
      {activeGoals.length === 0 && recommendations && (
        <div className="bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-cactus-sage/15 rounded-xl">
              <Sparkles className="w-5 h-5 text-cactus-sage" />
            </div>
            <div>
              <h2 className="text-cactus-charcoal font-cactus font-bold">
                Recommended Goal Sequence
              </h2>
              <p className="text-cactus-charcoal/70 font-cactus text-sm mt-1">
                Following the Cactus methodology, here's the recommended order for your goals:
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
                  className="flex items-center gap-4 bg-white border border-cactus-overlay rounded-2xl p-4"
                >
                  <div className="bg-cactus-sage text-white font-cactus font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div
                    className={`p-2 rounded-xl ${typeInfo?.iconBg || 'bg-cactus-overlay'} ${typeInfo?.iconText || 'text-cactus-charcoal/60'} shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-cactus-charcoal font-cactus font-semibold">{rec.title}</p>
                      {rec.alreadyExists && (
                        <span className="px-2 py-0.5 bg-cactus-sage text-white text-[10px] uppercase font-cactus font-bold tracking-wide rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-cactus-charcoal/60 font-cactus">{rec.description}</p>
                    {rec.alreadyExists && rec.currentProgress > 0 && rec.suggestedAmount > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-cactus-overlay rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cactus-sage"
                            style={{
                              width: `${Math.min((rec.currentProgress / rec.suggestedAmount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-cactus-charcoal/40 font-cactus mt-1">
                          <span className="font-cactus font-bold tabular-nums">
                            {formatCurrency(rec.currentProgress)}
                          </span>{' '}
                          of{' '}
                          <span className="font-cactus font-bold tabular-nums">
                            {formatCurrency(rec.suggestedAmount)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  {rec.suggestedAmount > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-cactus-charcoal/60 font-cactus">Suggested</p>
                      <p className="text-cactus-charcoal font-cactus font-bold tabular-nums">
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
          <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-4">Primary Focus</h2>
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
          <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-4">
            Other Active Goals
          </h2>
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
          <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cactus-sage" />
            Completed Goals
          </h2>
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
  const iconBg = typeInfo?.iconBg || 'bg-cactus-overlay';
  const iconText = typeInfo?.iconText || 'text-cactus-charcoal/60';

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
    ? 'bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-6 transition-all'
    : completed
      ? 'bg-white border border-cactus-overlay rounded-2xl p-5 transition-all opacity-70'
      : 'bg-white border border-cactus-overlay rounded-2xl p-5 transition-all hover:bg-cactus-sage-light/30';

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${iconBg} ${iconText} rounded-xl w-10 h-10 flex items-center justify-center shrink-0`}
          >
            <Icon className={isPrimary ? 'w-6 h-6' : 'w-5 h-5'} />
          </div>
          <div className="min-w-0">
            <h3
              className={`text-cactus-charcoal font-cactus font-bold ${isPrimary ? 'text-lg' : 'text-base'} truncate`}
            >
              {goal.name}
            </h3>
            <p className="text-cactus-charcoal/60 font-cactus text-sm">{typeInfo?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPrimary && (
            <div className="bg-cactus-sage text-white text-[10px] uppercase font-cactus font-bold tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-cactus-sage bg-white rounded-full" />
              Primary
            </div>
          )}
          {completed && (
            <div className="bg-cactus-sage text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Done
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-cactus-charcoal font-cactus font-bold tabular-nums">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-cactus-charcoal/60 font-cactus font-bold tabular-nums">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="h-3 bg-cactus-overlay rounded-full overflow-hidden">
          <div
            className="h-full bg-cactus-sage transition-all duration-500"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-cactus-charcoal/60 font-cactus">
            {goal.currentAmount === 0
              ? 'Every rand counts. Start your journey today.'
              : `${goal.progressPercentage.toFixed(0)}% complete`}
          </p>
          {!completed && remaining > 0 && (
            <p className="text-sm text-cactus-sage font-cactus font-bold tabular-nums">
              {formatCurrency(remaining)} to go
            </p>
          )}
        </div>
      </div>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            {goal.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex-1 h-1 rounded-full ${
                  milestone.isReached ? 'bg-cactus-sage' : 'bg-cactus-overlay'
                }`}
                title={milestone.name}
              />
            ))}
          </div>
          {nextMilestone && !completed && (
            <p className="text-xs text-cactus-charcoal/60 font-cactus">
              Next: {nextMilestone.name} (
              <span className="font-cactus font-bold tabular-nums">
                {formatCurrency(nextMilestone.targetAmount)}
              </span>
              )
            </p>
          )}
          {completed && (
            <p className="text-xs text-cactus-sage font-cactus font-semibold">
              All {goal.milestones.length} milestones reached!
            </p>
          )}
        </div>
      )}

      {/* Linked Account/Debt */}
      {(goal.linkedAccountName || goal.linkedDebtName) && (
        <p className="text-xs text-cactus-charcoal/40 font-cactus mb-4">
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
              className={`flex-1 py-2 px-4 rounded-xl font-cactus font-semibold flex items-center justify-center gap-2 transition-colors ${
                isPrimary
                  ? 'bg-cactus-sage text-white hover:brightness-95'
                  : 'text-cactus-charcoal/60 hover:text-cactus-sage hover:bg-cactus-sage-light/40 text-sm'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Update Progress
            </button>
          )}
          {onSetPrimary && !isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="py-2 px-4 rounded-xl text-cactus-charcoal/60 hover:text-cactus-sage hover:bg-cactus-sage-light/40 font-cactus font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Star className="w-4 h-4" />
              Set as Primary
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

  return (
    <div className="fixed inset-0 bg-cactus-charcoal/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-cactus-overlay rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-cactus-charcoal font-cactus font-bold text-xl">Create New Goal</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cactus-charcoal/40 hover:text-cactus-charcoal p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-cactus-goals-bg border border-cactus-overlay rounded-xl flex items-center gap-2 text-cactus-prickly">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-cactus">{error}</span>
            </div>
          )}
          <div>
            <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              placeholder="e.g., Emergency Fund"
            />
          </div>

          <div>
            <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
              Goal Type
            </label>
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
                    className={`rounded-xl p-3 font-cactus font-semibold flex flex-col items-center gap-2 transition-all border-2 ${
                      active
                        ? `${info.iconBg} ${info.borderActive} text-cactus-charcoal`
                        : 'bg-white border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40'
                    }`}
                  >
                    <div className={`inline-flex p-1.5 rounded-xl ${info.iconBg} ${info.iconText}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-cactus font-semibold text-cactus-charcoal">
                      {info.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
              Target Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cactus-charcoal/60 font-cactus">
                R
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl pl-8 pr-4 py-3 font-cactus text-cactus-charcoal outline-none tabular-nums"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
              Target Date (optional)
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-6 py-3 rounded-2xl font-cactus font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.targetAmount || createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-cactus font-bold text-white bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
              {createMutation.isPending ? 'Creating...' : 'Create Goal'}
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

  return (
    <div className="fixed inset-0 bg-cactus-charcoal/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-cactus-overlay rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-cactus-charcoal font-cactus font-bold text-xl">Update Progress</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cactus-charcoal/40 hover:text-cactus-charcoal p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">{goal.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-cactus-goals-bg border border-cactus-overlay rounded-xl flex items-center gap-2 text-cactus-prickly">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-cactus">{error}</span>
            </div>
          )}
          {/* Current Progress */}
          <div className="bg-cactus-sage-light/40 border border-cactus-overlay rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-cactus-charcoal/60 font-cactus">Current</span>
              <span className="text-cactus-charcoal font-cactus font-bold tabular-nums">
                {formatCurrency(goal.currentAmount)}
              </span>
            </div>
            <div className="h-2 bg-cactus-overlay rounded-full overflow-hidden">
              <div
                className="h-full bg-cactus-sage transition-all"
                style={{ width: `${goal.progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-cactus-charcoal/60 font-cactus mt-1">
              <span className="tabular-nums">{goal.progressPercentage.toFixed(0)}%</span>
              <span>
                <span className="font-cactus font-bold tabular-nums">
                  {formatCurrency(remaining)}
                </span>{' '}
                remaining
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
              Amount to Add
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cactus-charcoal/60 font-cactus">
                R
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl pl-8 pr-4 py-3 font-cactus text-cactus-charcoal outline-none tabular-nums"
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
                className="flex-1 bg-cactus-sage-light text-cactus-sage font-cactus font-semibold border border-cactus-overlay rounded-xl px-4 py-2 hover:bg-cactus-sage hover:text-white transition-colors text-sm tabular-nums"
              >
                +R{quickAmount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className="flex-1 bg-cactus-sage-light text-cactus-sage font-cactus font-semibold border border-cactus-overlay rounded-xl px-4 py-2 hover:bg-cactus-sage hover:text-white transition-colors text-sm"
            >
              Fill
            </button>
          </div>

          {/* Preview */}
          {parseFloat(amount) > 0 && (
            <div className="bg-cactus-sage-light border border-cactus-overlay rounded-xl p-3">
              <p className="text-sm text-cactus-charcoal font-cactus">
                New balance:{' '}
                <span className="font-cactus font-bold tabular-nums">
                  {formatCurrency(newAmount)}
                </span>{' '}
                <span className="tabular-nums">({newPercentage.toFixed(0)}%)</span>
              </p>
              {newAmount >= goal.targetAmount && (
                <p className="text-sm text-cactus-sage font-cactus font-bold mt-1 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Goal will be complete!
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              placeholder="e.g., Monthly contribution"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-6 py-3 rounded-2xl font-cactus font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) === 0 || updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-cactus font-bold text-white bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Update Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
