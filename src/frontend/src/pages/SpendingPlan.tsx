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
  needs: 'bg-brand-sage',
  wants: 'bg-brand-terracotta',
  goals: 'bg-brand-accent-ink',
};

const bucketSoftBg: Record<Bucket, string> = {
  needs: 'bg-brand-sage-soft/40',
  wants: 'bg-brand-terracotta-soft/40',
  goals: 'bg-brand-accent-ink/10',
};

const bucketAccentText: Record<Bucket, string> = {
  needs: 'text-brand-sage',
  wants: 'text-brand-terracotta',
  goals: 'text-brand-accent-ink',
};

const bucketAccent: Record<Bucket, string> = {
  needs: 'accent-brand-sage',
  wants: 'accent-brand-terracotta',
  goals: 'accent-brand-accent-ink',
};

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] text-white transition-all bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0';

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
      <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-brand-border/50 rounded-2xl w-1/3"></div>
          <div className="h-64 bg-brand-border/50 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
              {currentMonth}
            </p>
            <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
              Budget.
            </h1>
          </div>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || !isValid || saveMutation.isPending}
            className={primaryButtonClass}
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestion Card */}
        {suggestion?.hasSuggestion && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-brand-sage-soft rounded-2xl shrink-0">
                <Lightbulb className="w-5 h-5 text-brand-sage" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-sage" />
                  <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                    Suggested adjustment
                  </p>
                </div>
                <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-3">
                  Rebalance your allocations
                </h3>
                <p className="text-[14px] text-brand-text-muted leading-relaxed mb-5">
                  {suggestion.explanation}
                </p>

                {/* Visual Comparison: Current -> Suggested */}
                <div className="bg-brand-cream/40 border border-brand-border rounded-2xl p-4 mb-5">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      {
                        label: 'Needs',
                        current: suggestion.currentNeeds,
                        suggested: suggestion.suggestedNeeds,
                        accent: bucketAccentText.needs,
                      },
                      {
                        label: 'Wants',
                        current: suggestion.currentWants,
                        suggested: suggestion.suggestedWants,
                        accent: bucketAccentText.wants,
                      },
                      {
                        label: 'Goals',
                        current: suggestion.currentGoals,
                        suggested: suggestion.suggestedGoals,
                        accent: bucketAccentText.goals,
                      },
                    ].map((row) => (
                      <div key={row.label}>
                        <span className="block text-[11px] uppercase tracking-[0.14em] font-semibold text-brand-text-faint mb-1.5">
                          {row.label}
                        </span>
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-display font-medium tabular-lining text-[15px] ${row.accent} opacity-60`}
                          >
                            {row.current}%
                          </span>
                          <ArrowRight className="w-3 h-3 text-brand-text-faint" />
                          <span
                            className={`font-display font-medium tabular-lining text-[17px] ${row.accent}`}
                          >
                            {row.suggested}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className={primaryButtonClass}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply suggestion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Income Input */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
          <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
            Monthly income (after tax)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-medium tabular-lining text-[1.5rem] text-brand-text-muted">
              R
            </span>
            <input
              type="number"
              value={income || ''}
              onChange={(e) => handleIncomeChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-3 bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl font-display font-medium tabular-lining text-brand-text text-[1.75rem] outline-none transition-all"
              placeholder="0"
            />
          </div>
        </div>

        {/* Allocation Sliders */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
            Split
          </p>
          <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
            Allocations
          </h2>

          {/* Validation Warning */}
          {!isValid && (
            <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>Allocations must total 100%. Currently at {totalPercentage}%.</span>
            </div>
          )}

          {/* Visual Bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-brand-border/60 mb-8">
            <div
              className="bg-brand-sage transition-all duration-300"
              style={{ width: `${percentages.needs}%` }}
            />
            <div
              className="bg-brand-terracotta transition-all duration-300"
              style={{ width: `${percentages.wants}%` }}
            />
            <div
              className="bg-brand-accent-ink transition-all duration-300"
              style={{ width: `${percentages.goals}%` }}
            />
          </div>

          {/* Sliders */}
          <div className="space-y-7">
            {[
              {
                key: 'needs' as const,
                label: 'Needs',
                desc: 'Essential expenses',
                amount: needsAmount,
              },
              {
                key: 'wants' as const,
                label: 'Wants',
                desc: 'Discretionary spending',
                amount: wantsAmount,
              },
              {
                key: 'goals' as const,
                label: 'Goals',
                desc: 'Savings & debt payoff',
                amount: goalsAmount,
              },
            ].map(({ key, label, desc, amount }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${bucketBgFill[key]} shrink-0`} />
                    <span className="text-brand-text font-semibold text-[15px]">{label}</span>
                    <span className="text-[12px] text-brand-text-muted hidden sm:inline">
                      {desc}
                    </span>
                  </div>
                  <div className="text-right flex items-baseline gap-2 shrink-0">
                    <span className="font-display font-medium tabular-lining text-brand-text text-[1.25rem]">
                      {percentages[key]}%
                    </span>
                    <span className="font-display font-medium tabular-lining text-brand-text-muted text-[13px]">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={percentages[key]}
                  onChange={(e) => handlePercentageChange(key, parseInt(e.target.value))}
                  className={`w-full h-2 bg-brand-border/60 rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${bucketAccent[key]}`}
                />
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-8 pt-6 border-t border-brand-border">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                Total
              </span>
              <span
                className={`font-display font-medium tabular-lining text-[1.5rem] ${
                  isValid ? 'text-brand-sage' : 'text-brand-terracotta'
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
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
                6-month average
              </p>
              <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-5">
                Actual vs allocated
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
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-brand-sage-soft rounded-2xl shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-sage" />
              </div>
              <div>
                <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
                  Starting point
                </p>
                <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-2">
                  The 50 / 30 / 20 rule
                </h3>
                <p className="text-[14px] text-brand-text-muted leading-relaxed">
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
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mt-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
              This month
            </p>
            <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
              Plan vs actual
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

  const fillClass = isOverBudget ? 'bg-brand-terracotta' : bucketBgFill[bucket];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
        <span className="text-[15px] text-brand-text font-semibold">{label}</span>
        <div className="text-[13px] flex items-baseline gap-1">
          <span
            className={`font-display font-medium tabular-lining text-[15px] ${
              isOverBudget ? 'text-brand-terracotta' : 'text-brand-text'
            }`}
          >
            {formatCurrency(spent)}
          </span>
          <span className="text-brand-text-faint">/</span>
          <span className="font-display font-medium tabular-lining text-[13px] text-brand-text-muted">
            {formatCurrency(allocated)}
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-brand-border/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${fillClass} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[12px] text-brand-text-muted tabular-lining">
          {isOverBudget
            ? `${formatCurrency(spent - allocated)} over budget`
            : `${formatCurrency(allocated - spent)} remaining`}
        </span>
        <span className="text-[12px] text-brand-text-faint tabular-lining">
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
  const trackColor = 'rgba(235, 229, 213, 0.6)'; // brand-border
  const bucketStrokeHex: Record<Bucket, string> = {
    needs: '#1f6f4a', // brand-sage
    wants: '#c9743a', // brand-terracotta
    goals: '#8c4a1e', // brand-accent-ink
  };
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(actual, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`border border-brand-border rounded-2xl p-4 ${bucketSoftBg[bucket]}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-brand-text-faint mb-3">
        {label}
      </p>
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
            <span className="font-display font-medium tabular-lining text-[15px] text-brand-text">
              {actual.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      <p className="text-center text-[12px] text-brand-text-muted">of {allocated}% allocated</p>
      {Math.abs(diff) > 2 && (
        <p
          className={`text-center font-semibold tabular-lining text-[12px] mt-2 ${
            diff > 0 ? 'text-brand-terracotta' : 'text-brand-sage'
          }`}
        >
          {diff > 0 ? '+' : ''}
          {diff.toFixed(0)}% {diff > 0 ? 'over' : 'under'}
        </p>
      )}
    </div>
  );
}
