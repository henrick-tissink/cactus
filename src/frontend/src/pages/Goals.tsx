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

const GOAL_TYPE_INFO: Record<number, { label: string; icon: typeof Target; color: string }> = {
  [GoalType.MiniBuffer]: {
    label: 'Mini Buffer',
    icon: Wallet,
    color: 'bg-amber-100 text-amber-600',
  },
  [GoalType.DebtPayoff]: {
    label: 'Debt Payoff',
    icon: CreditCard,
    color: 'bg-red-100 text-red-600',
  },
  [GoalType.EmergencyFund]: {
    label: 'Emergency Fund',
    icon: PiggyBank,
    color: 'bg-blue-100 text-blue-600',
  },
  [GoalType.Savings]: {
    label: 'Savings',
    icon: Target,
    color: 'bg-green-100 text-green-600',
  },
  [GoalType.Investment]: {
    label: 'Investment',
    icon: LineChart,
    color: 'bg-purple-100 text-purple-600',
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
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-xl"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500 mt-1">
            {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Recommended Sequence (if no goals yet) */}
      {activeGoals.length === 0 && recommendations && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Recommended Goal Sequence</h2>
              <p className="text-sm text-gray-600 mt-1">
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
                  className="flex items-center gap-4 bg-white rounded-lg p-4 border border-green-100"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                    {index + 1}
                  </div>
                  <div className={`p-2 rounded-lg ${typeInfo?.color || 'bg-gray-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{rec.title}</p>
                      {rec.alreadyExists && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{rec.description}</p>
                    {rec.alreadyExists && rec.currentProgress > 0 && rec.suggestedAmount > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min((rec.currentProgress / rec.suggestedAmount) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          <span className="font-mono-financial">{formatCurrency(rec.currentProgress)}</span> of <span className="font-mono-financial">{formatCurrency(rec.suggestedAmount)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  {rec.suggestedAmount > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Suggested</p>
                      <p className="font-semibold text-gray-900 font-mono-financial">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="border-b-2 border-amber-400 pb-1">Primary Focus</span>
          </h2>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Active Goals</h2>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
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

  return (
    <div
      className={`rounded-xl shadow-sm border transition-all ${
        isPrimary
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 ring-2 ring-amber-200 p-8'
          : completed
            ? 'bg-green-50/30 border-green-200 p-6'
            : 'bg-white border-gray-100 p-6'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeInfo?.color || 'bg-gray-100'}`}>
            <Icon className={isPrimary ? 'w-6 h-6' : 'w-5 h-5'} />
          </div>
          <div>
            <h3 className={`font-semibold text-gray-900 ${isPrimary ? 'text-lg' : ''}`}>
              {goal.name}
            </h3>
            <p className="text-sm text-gray-500">{typeInfo?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPrimary && (
            <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Primary Goal
            </div>
          )}
          {completed && (
            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Complete
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-mono-financial">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-gray-500 font-mono-financial">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {goal.currentAmount === 0
            ? 'Every rand counts. Start your journey today.'
            : `${goal.progressPercentage.toFixed(0)}% complete`}
        </p>
      </div>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            {goal.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex-1 h-1 rounded-full ${
                  milestone.isReached ? 'bg-green-500' : 'bg-gray-200'
                }`}
                title={milestone.name}
              />
            ))}
          </div>
          {nextMilestone && !completed && (
            <p className="text-xs text-gray-500">
              Next: {nextMilestone.name} (<span className="font-mono-financial">{formatCurrency(nextMilestone.targetAmount)}</span>)
            </p>
          )}
          {completed && (
            <p className="text-xs text-green-600">
              All {goal.milestones.length} milestones reached!
            </p>
          )}
        </div>
      )}

      {/* Linked Account/Debt */}
      {(goal.linkedAccountName || goal.linkedDebtName) && (
        <p className="text-xs text-gray-500 mb-4">
          Linked to: {goal.linkedAccountName || goal.linkedDebtName}
        </p>
      )}

      {/* Action Buttons */}
      {!completed && (
        <div className={`flex gap-2 ${isPrimary ? 'flex-col' : ''}`}>
          {onUpdateProgress && (
            <button
              onClick={onUpdateProgress}
              className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                isPrimary
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Update Progress
            </button>
          )}
          {onSetPrimary && !isPrimary && (
            <button
              onClick={onSetPrimary}
              className="py-2 px-4 border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-50 font-medium flex items-center justify-center gap-2"
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

function CreateGoalModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Create New Goal</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Emergency Fund"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GOAL_TYPE_INFO).map(([type, info]) => {
                const Icon = info.icon;
                const typeNum = parseInt(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, goalType: typeNum })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.goalType === typeNum
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`inline-flex p-1.5 rounded-lg ${info.color} mb-2`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{info.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date (optional)
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!formData.name || !formData.targetAmount || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
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

  const remaining = goal.targetAmount - goal.currentAmount;
  const newAmount = goal.currentAmount + (parseFloat(amount) || 0);
  const newPercentage = (newAmount / goal.targetAmount) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Update Progress</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{goal.name}</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {/* Current Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Current</span>
              <span className="font-medium font-mono-financial">{formatCurrency(goal.currentAmount)}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${goal.progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{goal.progressPercentage.toFixed(0)}%</span>
              <span><span className="font-mono-financial">{formatCurrency(remaining)}</span> remaining</span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Add
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2">
            {[100, 500, 1000].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="flex-1 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                +R{quickAmount}
              </button>
            ))}
            <button
              onClick={() => setAmount(remaining.toString())}
              className="flex-1 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
            >
              Fill
            </button>
          </div>

          {/* Preview */}
          {parseFloat(amount) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                New balance: <span className="font-semibold font-mono-financial">{formatCurrency(newAmount)}</span>
                {' '}({newPercentage.toFixed(0)}%)
              </p>
              {newAmount >= goal.targetAmount && (
                <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Goal will be complete!
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Monthly contribution"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!amount || parseFloat(amount) === 0 || updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Update Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}

