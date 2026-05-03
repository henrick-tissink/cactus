import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type SpendingPlanDto, type SpendingPlanSuggestionDto } from '../types';
import {
  Save,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function SpendingPlanPage() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for sliders
  const [percentages, setPercentages] = useState({
    needs: 50,
    wants: 30,
    goals: 20,
  });
  const [income, setIncome] = useState(0);

  // Fetch current spending plan
  const { data: plan, isLoading } = useQuery({
    queryKey: ['spending-plan'],
    queryFn: async () => {
      const response = await apiClient.get<SpendingPlanDto>('/spending-plans/current');
      return response.data;
    },
  });

  // Fetch spending plan suggestion
  const { data: suggestion } = useQuery({
    queryKey: ['spending-plan-suggestion'],
    queryFn: async () => {
      const response = await apiClient.get<SpendingPlanSuggestionDto>(
        '/spending-plans/suggestion'
      );
      return response.data;
    },
  });

  // Update local state when plan loads
  useEffect(() => {
    if (plan) {
      setPercentages({
        needs: plan.needsPercentage,
        wants: plan.wantsPercentage,
        goals: plan.goalsPercentage,
      });
      setIncome(plan.monthlyIncome);
    }
  }, [plan]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/spending-plans', {
        monthlyIncome: income,
        needsPercentage: percentages.needs,
        wantsPercentage: percentages.wants,
        goalsPercentage: percentages.goals,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-plan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setHasChanges(false);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to save spending plan');
    },
  });

  const totalPercentage = percentages.needs + percentages.wants + percentages.goals;
  const isValid = totalPercentage === 100;

  const handlePercentageChange = (category: 'needs' | 'wants' | 'goals', value: number) => {
    setPercentages((prev) => ({ ...prev, [category]: value }));
    setHasChanges(true);
  };

  const handleIncomeChange = (value: number) => {
    setIncome(value);
    setHasChanges(true);
  };

  const handleApplySuggestion = () => {
    if (suggestion && suggestion.hasSuggestion) {
      setPercentages({
        needs: suggestion.suggestedNeeds,
        wants: suggestion.suggestedWants,
        goals: suggestion.suggestedGoals,
      });
      setHasChanges(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const needsAmount = (income * percentages.needs) / 100;
  const wantsAmount = (income * percentages.wants) / 100;
  const goalsAmount = (income * percentages.goals) / 100;

  const currentMonth = new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-gray-500 mt-1">{currentMonth}</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || !isValid || saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Suggestion Card */}
      {suggestion?.hasSuggestion && (
        <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Suggested Adjustment</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {suggestion.explanation}
              </p>

              {/* Visual Comparison: Current -> Suggested */}
              <div className="bg-white/60 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Needs</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-blue-600">
                        {suggestion.currentNeeds}%
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-blue-700">
                        {suggestion.suggestedNeeds}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Wants</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-purple-600">
                        {suggestion.currentWants}%
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-purple-700">
                        {suggestion.suggestedWants}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Goals</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-green-600">
                        {suggestion.currentGoals}%
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-green-700">
                        {suggestion.suggestedGoals}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleApplySuggestion}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Apply Suggestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income Input */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Income (after tax)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
          <input
            type="number"
            value={income || ''}
            onChange={(e) => handleIncomeChange(parseFloat(e.target.value) || 0)}
            className="w-full pl-8 pr-4 py-3 text-xl font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      {/* Allocation Sliders */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Allocations</h2>

        {/* Validation Warning */}
        {!isValid && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700">
              Allocations must total 100%. Currently at {totalPercentage}%.
            </p>
          </div>
        )}

        {/* Visual Bar */}
        <div className="h-8 rounded-full overflow-hidden flex mb-8">
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${percentages.needs}%` }}
          />
          <div
            className="bg-purple-500 transition-all duration-300"
            style={{ width: `${percentages.wants}%` }}
          />
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${percentages.goals}%` }}
          />
        </div>

        {/* Sliders */}
        <div className="space-y-8">
          {/* Needs */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-gray-900">Needs</span>
                <span className="text-sm text-gray-500">Essential expenses</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{percentages.needs}%</span>
                <span className="text-sm text-gray-500 ml-2 font-mono-financial">{formatCurrency(needsAmount)}</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percentages.needs}
              onChange={(e) => handlePercentageChange('needs', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Wants */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="font-medium text-gray-900">Wants</span>
                <span className="text-sm text-gray-500">Discretionary spending</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{percentages.wants}%</span>
                <span className="text-sm text-gray-500 ml-2 font-mono-financial">{formatCurrency(wantsAmount)}</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percentages.wants}
              onChange={(e) => handlePercentageChange('wants', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Goals */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium text-gray-900">Goals</span>
                <span className="text-sm text-gray-500">Savings & debt payoff</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{percentages.goals}%</span>
                <span className="text-sm text-gray-500 ml-2 font-mono-financial">{formatCurrency(goalsAmount)}</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percentages.goals}
              onChange={(e) => handlePercentageChange('goals', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>
        </div>

        {/* Total */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total</span>
            <span
              className={`text-xl font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}
            >
              {totalPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Actual Spending Ratios */}
      {suggestion && (suggestion.actualNeeds > 0 || suggestion.actualWants > 0 || suggestion.actualGoals > 0) && (
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actual vs Allocated (6-month average)</h2>
          <div className="grid grid-cols-3 gap-4">
            <ActualVsAllocated
              label="Needs"
              color="blue"
              allocated={percentages.needs}
              actual={suggestion.actualNeeds}
            />
            <ActualVsAllocated
              label="Wants"
              color="purple"
              allocated={percentages.wants}
              actual={suggestion.actualWants}
            />
            <ActualVsAllocated
              label="Goals"
              color="green"
              allocated={percentages.goals}
              actual={suggestion.actualGoals}
            />
          </div>
        </div>
      )}

      {/* Quick Tips — only show for new users without a plan */}
      {!plan && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">The 50/30/20 Rule</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                A popular starting point is 50% for Needs, 30% for Wants, and 20% for Goals.
                But the best plan is one that works for YOUR situation. If you have debt,
                consider increasing your Goals allocation to pay it off faster.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan vs Actual (if we have spent data) */}
      {plan && (plan.needsSpent > 0 || plan.wantsSpent > 0 || plan.goalsSpent > 0) && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Plan vs Actual</h2>
          <div className="space-y-6">
            <BudgetBar
              label="Needs"
              color="blue"
              allocated={plan.needsAmount}
              spent={plan.needsSpent}
            />
            <BudgetBar
              label="Wants"
              color="purple"
              allocated={plan.wantsAmount}
              spent={plan.wantsSpent}
            />
            <BudgetBar
              label="Goals"
              color="green"
              allocated={plan.goalsAmount}
              spent={plan.goalsSpent}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetBar({
  label,
  color,
  allocated,
  spent,
}: {
  label: string;
  color: 'blue' | 'purple' | 'green';
  allocated: number;
  spent: number;
}) {
  const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
  const isOverBudget = spent > allocated;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      fill: isOverBudget ? 'bg-red-500' : 'bg-blue-500',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-100',
      fill: isOverBudget ? 'bg-red-500' : 'bg-purple-500',
      text: 'text-purple-600',
    },
    green: {
      bg: 'bg-green-100',
      fill: isOverBudget ? 'bg-red-500' : 'bg-green-500',
      text: 'text-green-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-900">{label}</span>
        <div className="text-sm">
          <span className={`font-mono-financial ${isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {formatCurrency(spent)}
          </span>
          <span className="text-gray-400"> / </span>
          <span className="text-gray-600 font-mono-financial">{formatCurrency(allocated)}</span>
        </div>
      </div>
      <div className={`h-3 ${colors.bg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colors.fill} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500 font-mono-financial">
          {isOverBudget
            ? `${formatCurrency(spent - allocated)} over budget`
            : `${formatCurrency(allocated - spent)} remaining`}
        </span>
        <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function ActualVsAllocated({
  label,
  color,
  allocated,
  actual,
}: {
  label: string;
  color: 'blue' | 'purple' | 'green';
  allocated: number;
  actual: number;
}) {
  const diff = actual - allocated;
  const colorMap = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
  };
  const bgMap = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
  };

  return (
    <div className={`p-4 rounded-lg ${bgMap[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-semibold ${colorMap[color]}`}>{actual.toFixed(0)}%</span>
        <span className="text-xs text-gray-400">actual</span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-sm text-gray-600">{allocated}%</span>
        <span className="text-xs text-gray-400">allocated</span>
      </div>
      {Math.abs(diff) > 2 && (
        <p className={`text-xs mt-2 ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(0)}% {diff > 0 ? 'over' : 'under'}
        </p>
      )}
    </div>
  );
}
