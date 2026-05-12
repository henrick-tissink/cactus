import { useState } from 'react';
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

type Bucket = 'needs' | 'wants' | 'goals';

const bucketBgFill: Record<Bucket, string> = {
  needs: 'bg-cactus-sage',
  wants: 'bg-cactus-desert',
  goals: 'bg-cactus-prickly',
};

const bucketSoftBg: Record<Bucket, string> = {
  needs: 'bg-cactus-needs-bg',
  wants: 'bg-cactus-wants-bg',
  goals: 'bg-cactus-goals-bg',
};

const bucketAccent: Record<Bucket, string> = {
  needs: 'accent-cactus-sage',
  wants: 'accent-cactus-desert',
  goals: 'accent-cactus-prickly',
};

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-cactus font-bold text-sm text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed';

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
      const response = await apiClient.get<SpendingPlanSuggestionDto>('/spending-plans/suggestion');
      return response.data;
    },
  });

  // Sync local form state when a new plan arrives. The conditional
  // setState during render is the React 19-recommended pattern (replaces
  // useEffect-with-setState which the lint rule flags).
  const [prevPlanId, setPrevPlanId] = useState<string | undefined>(plan?.id);
  if (plan && plan.id !== prevPlanId) {
    setPrevPlanId(plan.id);
    setPercentages({
      needs: plan.needsPercentage,
      wants: plan.wantsPercentage,
      goals: plan.goalsPercentage,
    });
    setIncome(plan.monthlyIncome);
  }

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

  const handlePercentageChange = (category: Bucket, value: number) => {
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
      <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-cactus-overlay rounded-xl w-1/4"></div>
          <div className="h-64 bg-cactus-overlay rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl">Budget</h1>
            <p className="text-cactus-charcoal/60 font-cactus mt-1">{currentMonth}</p>
          </div>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || !isValid || saveMutation.isPending}
            className={primaryButtonClass}
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
          <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestion Card */}
        {suggestion?.hasSuggestion && (
          <div className="bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white border border-cactus-overlay rounded-xl shrink-0">
                <Lightbulb className="w-5 h-5 text-cactus-sage" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-cactus-sage" />
                  <h3 className="text-cactus-charcoal font-cactus font-bold">
                    Suggested Adjustment
                  </h3>
                </div>
                <p className="text-cactus-charcoal/70 font-cactus text-sm leading-relaxed mb-4">
                  {suggestion.explanation}
                </p>

                {/* Visual Comparison: Current -> Suggested */}
                <div className="bg-white border border-cactus-overlay rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-cactus-charcoal/60 font-cactus text-xs block mb-1">
                        Needs
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-cactus font-semibold tabular-nums text-sm text-cactus-sage">
                          {suggestion.currentNeeds}%
                        </span>
                        <ArrowRight className="w-3 h-3 text-cactus-charcoal/40" />
                        <span className="font-cactus font-bold tabular-nums text-sm text-cactus-sage">
                          {suggestion.suggestedNeeds}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-cactus-charcoal/60 font-cactus text-xs block mb-1">
                        Wants
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-cactus font-semibold tabular-nums text-sm text-cactus-desert">
                          {suggestion.currentWants}%
                        </span>
                        <ArrowRight className="w-3 h-3 text-cactus-charcoal/40" />
                        <span className="font-cactus font-bold tabular-nums text-sm text-cactus-desert">
                          {suggestion.suggestedWants}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-cactus-charcoal/60 font-cactus text-xs block mb-1">
                        Goals
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-cactus font-semibold tabular-nums text-sm text-cactus-prickly">
                          {suggestion.currentGoals}%
                        </span>
                        <ArrowRight className="w-3 h-3 text-cactus-charcoal/40" />
                        <span className="font-cactus font-bold tabular-nums text-sm text-cactus-prickly">
                          {suggestion.suggestedGoals}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className={primaryButtonClass}
                >
                  <Sparkles className="w-4 h-4" />
                  Apply Suggestion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Income Input */}
        <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-6">
          <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-2">
            Monthly Income (after tax)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cactus-charcoal font-cactus font-bold">
              R
            </span>
            <input
              type="number"
              value={income || ''}
              onChange={(e) => handleIncomeChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-9 pr-4 py-3 border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl font-cactus font-bold tabular-nums text-cactus-charcoal text-xl outline-none transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        {/* Allocation Sliders */}
        <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-6">
          <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-6">Allocations</h2>

          {/* Validation Warning */}
          {!isValid && (
            <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cactus-prickly shrink-0" />
              <span>Allocations must total 100%. Currently at {totalPercentage}%.</span>
            </div>
          )}

          {/* Visual Bar */}
          <div className="h-8 rounded-full overflow-hidden flex bg-cactus-overlay mb-8">
            <div
              className="bg-cactus-sage transition-all duration-300"
              style={{ width: `${percentages.needs}%` }}
            />
            <div
              className="bg-cactus-desert transition-all duration-300"
              style={{ width: `${percentages.wants}%` }}
            />
            <div
              className="bg-cactus-prickly transition-all duration-300"
              style={{ width: `${percentages.goals}%` }}
            />
          </div>

          {/* Sliders */}
          <div className="space-y-8">
            {/* Needs */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cactus-sage" />
                  <span className="text-cactus-charcoal font-cactus font-bold">Needs</span>
                  <span className="text-cactus-charcoal/60 font-cactus text-sm">
                    Essential expenses
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-cactus font-bold tabular-nums text-cactus-charcoal text-lg">
                    {percentages.needs}%
                  </span>
                  <span className="text-cactus-charcoal/60 font-cactus font-bold tabular-nums text-sm ml-2">
                    {formatCurrency(needsAmount)}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={percentages.needs}
                onChange={(e) => handlePercentageChange('needs', parseInt(e.target.value))}
                className={`w-full h-2 bg-cactus-overlay rounded-lg appearance-none cursor-pointer ${bucketAccent.needs}`}
              />
            </div>

            {/* Wants */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cactus-desert" />
                  <span className="text-cactus-charcoal font-cactus font-bold">Wants</span>
                  <span className="text-cactus-charcoal/60 font-cactus text-sm">
                    Discretionary spending
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-cactus font-bold tabular-nums text-cactus-charcoal text-lg">
                    {percentages.wants}%
                  </span>
                  <span className="text-cactus-charcoal/60 font-cactus font-bold tabular-nums text-sm ml-2">
                    {formatCurrency(wantsAmount)}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={percentages.wants}
                onChange={(e) => handlePercentageChange('wants', parseInt(e.target.value))}
                className={`w-full h-2 bg-cactus-overlay rounded-lg appearance-none cursor-pointer ${bucketAccent.wants}`}
              />
            </div>

            {/* Goals */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cactus-prickly" />
                  <span className="text-cactus-charcoal font-cactus font-bold">Goals</span>
                  <span className="text-cactus-charcoal/60 font-cactus text-sm">
                    Savings &amp; debt payoff
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-cactus font-bold tabular-nums text-cactus-charcoal text-lg">
                    {percentages.goals}%
                  </span>
                  <span className="text-cactus-charcoal/60 font-cactus font-bold tabular-nums text-sm ml-2">
                    {formatCurrency(goalsAmount)}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={percentages.goals}
                onChange={(e) => handlePercentageChange('goals', parseInt(e.target.value))}
                className={`w-full h-2 bg-cactus-overlay rounded-lg appearance-none cursor-pointer ${bucketAccent.goals}`}
              />
            </div>
          </div>

          {/* Total */}
          <div className="mt-8 pt-6 border-t border-cactus-overlay">
            <div className="flex justify-between items-center">
              <span className="text-cactus-charcoal/60 font-cactus">Total</span>
              <span
                className={`font-cactus font-bold tabular-nums text-xl ${
                  isValid ? 'text-cactus-sage' : 'text-cactus-prickly'
                }`}
              >
                {totalPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Actual Spending Ratios */}
        {suggestion &&
          (suggestion.actualNeeds > 0 ||
            suggestion.actualWants > 0 ||
            suggestion.actualGoals > 0) && (
            <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-6">
              <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-4">
                Actual vs Allocated (6-month average)
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <ActualVsAllocated
                  label="Needs"
                  bucket="needs"
                  allocated={percentages.needs}
                  actual={suggestion.actualNeeds}
                />
                <ActualVsAllocated
                  label="Wants"
                  bucket="wants"
                  allocated={percentages.wants}
                  actual={suggestion.actualWants}
                />
                <ActualVsAllocated
                  label="Goals"
                  bucket="goals"
                  allocated={percentages.goals}
                  actual={suggestion.actualGoals}
                />
              </div>
            </div>
          )}

        {/* Quick Tips — only show for new users without a plan */}
        {!plan && (
          <div className="bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white border border-cactus-overlay rounded-xl shrink-0">
                <TrendingUp className="w-5 h-5 text-cactus-sage" />
              </div>
              <div>
                <h3 className="text-cactus-charcoal font-cactus font-bold mb-2">
                  The 50/30/20 Rule
                </h3>
                <p className="text-cactus-charcoal font-cactus text-sm leading-relaxed">
                  A popular starting point is 50% for Needs, 30% for Wants, and 20% for Goals. But
                  the best plan is one that works for YOUR situation. If you have debt, consider
                  increasing your Goals allocation to pay it off faster.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan vs Actual (if we have spent data) */}
        {plan && (plan.needsSpent > 0 || plan.wantsSpent > 0 || plan.goalsSpent > 0) && (
          <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mt-6">
            <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-6">
              Plan vs Actual
            </h2>
            <div className="space-y-6">
              <BudgetBar
                label="Needs"
                bucket="needs"
                allocated={plan.needsAmount}
                spent={plan.needsSpent}
              />
              <BudgetBar
                label="Wants"
                bucket="wants"
                allocated={plan.wantsAmount}
                spent={plan.wantsSpent}
              />
              <BudgetBar
                label="Goals"
                bucket="goals"
                allocated={plan.goalsAmount}
                spent={plan.goalsSpent}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetBar({
  label,
  bucket,
  allocated,
  spent,
}: {
  label: string;
  bucket: Bucket;
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

  const fillClass = isOverBudget ? 'bg-cactus-prickly' : bucketBgFill[bucket];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-cactus-charcoal font-cactus font-semibold">{label}</span>
        <div className="text-sm">
          <span
            className={`font-cactus font-bold tabular-nums ${
              isOverBudget ? 'text-cactus-prickly' : 'text-cactus-charcoal'
            }`}
          >
            {formatCurrency(spent)}
          </span>
          <span className="text-cactus-charcoal/40 font-cactus"> / </span>
          <span className="text-cactus-charcoal font-cactus font-bold tabular-nums">
            {formatCurrency(allocated)}
          </span>
        </div>
      </div>
      <div className="h-3 bg-cactus-overlay rounded-xl overflow-hidden">
        <div
          className={`h-full ${fillClass} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-cactus-charcoal/60 font-cactus font-bold tabular-nums text-xs">
          {isOverBudget
            ? `${formatCurrency(spent - allocated)} over budget`
            : `${formatCurrency(allocated - spent)} remaining`}
        </span>
        <span className="text-cactus-charcoal/60 font-cactus font-bold tabular-nums text-xs">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function ActualVsAllocated({
  label,
  bucket,
  allocated,
  actual,
}: {
  label: string;
  bucket: Bucket;
  allocated: number;
  actual: number;
}) {
  const diff = actual - allocated;
  const trackColor = 'rgba(51, 51, 51, 0.06)';
  const bucketStrokeHex: Record<Bucket, string> = {
    needs: '#77DD77',
    wants: '#FFCC00',
    goals: '#FF6F61',
  };
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(actual, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className={`bg-white border border-cactus-overlay rounded-2xl p-4 ${bucketSoftBg[bucket]}`}
    >
      <p className="text-cactus-charcoal/60 font-cactus text-xs mb-3">{label}</p>
      <div className="flex items-center justify-center mb-2">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke={trackColor} strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={bucketStrokeHex[bucket]}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-cactus-charcoal font-cactus font-bold tabular-nums text-sm">
              {actual.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      <p className="text-center text-cactus-charcoal/60 font-cactus text-xs">
        of {allocated}% allocated
      </p>
      {Math.abs(diff) > 2 && (
        <p
          className={`text-center font-cactus font-bold tabular-nums text-xs mt-2 ${
            diff > 0 ? 'text-cactus-prickly' : 'text-cactus-sage'
          }`}
        >
          {diff > 0 ? '+' : ''}
          {diff.toFixed(0)}% {diff > 0 ? 'over' : 'under'}
        </p>
      )}
    </div>
  );
}
