import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Loader2,
  Target,
  Star,
  Wallet,
  PiggyBank,
  CreditCard,
  LineChart,
  Upload,
  Circle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { MacroCategoryType, GoalType, type GoalDto } from '../types';

// API response types matching backend DTOs
interface BucketStatusDto {
  type: MacroCategoryType;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
}

interface RecentTransactionDto {
  id: string;
  description: string;
  amount: number;
  transactionDate: string;
  isClassified: boolean;
  categoryName: string | null;
}

interface DashboardSummaryResponse {
  monthlyIncome: number;
  totalSpent: number;
  buckets: BucketStatusDto[];
  unclassifiedCount: number;
  recentTransactions: RecentTransactionDto[];
}

// Tailwind class fragments per bucket (resolve to cactus tokens at build time)
const BUCKET_FILL_CLASS: Record<MacroCategoryType, string> = {
  [MacroCategoryType.Needs]: 'bg-cactus-sage',
  [MacroCategoryType.Wants]: 'bg-cactus-desert',
  [MacroCategoryType.Goals]: 'bg-cactus-prickly',
};

const BUCKET_DOT_CLASS: Record<MacroCategoryType, string> = {
  [MacroCategoryType.Needs]: 'bg-cactus-sage',
  [MacroCategoryType.Wants]: 'bg-cactus-desert',
  [MacroCategoryType.Goals]: 'bg-cactus-prickly',
};

const GOAL_TYPE_INFO: Record<number, { label: string; icon: typeof Target }> = {
  [GoalType.MiniBuffer]: { label: 'Mini Buffer', icon: Wallet },
  [GoalType.DebtPayoff]: { label: 'Debt Payoff', icon: CreditCard },
  [GoalType.EmergencyFund]: { label: 'Emergency Fund', icon: PiggyBank },
  [GoalType.Savings]: { label: 'Savings', icon: Target },
  [GoalType.Investment]: { label: 'Investment', icon: LineChart },
};

function getMonthTitle(): string {
  const now = new Date();
  return now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

function estimateClassifyTime(count: number): string {
  const minutes = Math.max(1, Math.ceil(count * 0.2));
  return `~${minutes} min`;
}

function LoadingState() {
  return (
    <div className="p-8 bg-cactus-sandstone font-cactus min-h-full">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cactus-sage" />
        <span className="ml-3 text-cactus-charcoal/60 font-cactus">Loading dashboard...</span>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-8 bg-cactus-sandstone font-cactus min-h-full">
      <div className="bg-white border border-cactus-overlay rounded-2xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-cactus-prickly mx-auto mb-4" />
        <h2 className="text-lg font-cactus font-bold text-cactus-charcoal mb-2">
          Failed to load dashboard
        </h2>
        <p className="text-cactus-charcoal/60 font-cactus">{error.message}</p>
      </div>
    </div>
  );
}

function OnboardingChecklist() {
  return (
    <div className="p-8 bg-cactus-sandstone font-cactus min-h-full">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-cactus font-bold text-cactus-charcoal mb-2">
          {getMonthTitle()}
        </h1>
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-white border border-cactus-overlay rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-cactus-sage-light">
              <Upload className="w-8 h-8 text-cactus-sage" />
            </div>
            <h2 className="text-xl font-cactus font-bold text-cactus-charcoal mb-2">
              Let's get your finances in order
            </h2>
            <p className="text-cactus-charcoal/60 font-cactus mb-8">
              Start by importing a bank statement.
            </p>

            <div className="space-y-4 text-left">
              <Link
                to="/import"
                className="flex items-center gap-3 p-4 rounded-xl border border-cactus-overlay hover:bg-cactus-sage-light transition-colors"
              >
                <Circle className="w-5 h-5 text-cactus-charcoal/40 flex-shrink-0" />
                <span className="font-cactus font-semibold text-cactus-charcoal">
                  Import your first bank statement
                </span>
                <ArrowRight className="w-4 h-4 text-cactus-charcoal/40 ml-auto" />
              </Link>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-cactus-overlay opacity-50">
                <Circle className="w-5 h-5 text-cactus-charcoal/40 flex-shrink-0" />
                <span className="font-cactus font-semibold text-cactus-charcoal/40">
                  Classify your transactions
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-cactus-overlay opacity-50">
                <Circle className="w-5 h-5 text-cactus-charcoal/40 flex-shrink-0" />
                <span className="font-cactus font-semibold text-cactus-charcoal/40">
                  Review your budget
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryGoalCard({ goal }: { goal: GoalDto }) {
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

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-5 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white">
            <Icon className="w-4 h-4 text-cactus-sage" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-cactus font-bold text-cactus-charcoal text-base">{goal.name}</h3>
              <div className="bg-cactus-sage text-white font-cactus font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Primary
              </div>
            </div>
          </div>
        </div>
        <Link
          to="/goals"
          className="text-cactus-sage font-cactus font-semibold flex items-center gap-1 text-xs"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-cactus-charcoal/60 font-cactus tabular-nums">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-cactus-charcoal/60 font-cactus tabular-nums">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="h-2 bg-cactus-overlay rounded-full overflow-hidden">
          <div
            className="h-full bg-cactus-sage transition-all duration-500"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-cactus-charcoal/60 font-cactus">
            {goal.progressPercentage.toFixed(0)}% complete
          </span>
          <span className="text-cactus-sage font-cactus font-bold tabular-nums">
            {formatCurrency(remaining)} to go
          </span>
        </div>
        {goal.currentAmount === 0 && (
          <p className="text-xs text-cactus-charcoal/60 font-cactus mt-2 italic">
            Every rand counts. Start your journey today.
          </p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
      return response.data;
    },
  });

  // Fetch goals to get the primary goal
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiClient.get<GoalDto[]>('/goals');
      return response.data;
    },
  });

  const primaryGoal = goals?.find((g) => g.isPrimary && g.isActive && !g.isCompleted);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} />;
  }

  if (!summary) {
    return <LoadingState />;
  }

  // Empty state: no transactions at all — show onboarding
  if (
    summary.recentTransactions.length === 0 &&
    summary.totalSpent === 0 &&
    summary.monthlyIncome === 0
  ) {
    return <OnboardingChecklist />;
  }

  const remaining = summary.monthlyIncome - summary.totalSpent;
  const spentPercentage =
    summary.monthlyIncome > 0
      ? Math.min((summary.totalSpent / summary.monthlyIncome) * 100, 100)
      : 0;

  // Bucket bar calculations
  const totalAllocated = summary.buckets.reduce((sum, b) => sum + b.allocated, 0);

  return (
    <div className="p-8 bg-cactus-sandstone font-cactus min-h-full">
      <div className="animate-fade-in">
        {/* Header — dynamic month title */}
        <div className="mb-8">
          <h1 className="text-2xl font-cactus font-bold text-cactus-charcoal">{getMonthTitle()}</h1>
        </div>

        {/* Unclassified transactions banner */}
        {summary.unclassifiedCount > 0 && (
          <div className="mb-6 p-4 bg-cactus-goals-bg border border-cactus-overlay rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-cactus-prickly flex-shrink-0" />
            <p className="text-cactus-charcoal font-cactus">
              <strong>{summary.unclassifiedCount}</strong> transactions need classifying (
              {estimateClassifyTime(summary.unclassifiedCount)})
            </p>
            <Link
              to="/transactions?filter=unclassified"
              className="ml-auto text-cactus-charcoal font-cactus font-semibold underline flex items-center gap-1"
            >
              Classify now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Hero metric — single remaining amount */}
        <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-8">
          <p
            className={`text-4xl font-cactus font-bold tabular-nums ${
              remaining >= 0 ? 'text-cactus-charcoal' : 'text-cactus-prickly'
            }`}
          >
            R{remaining.toLocaleString()}
          </p>
          <p className="text-cactus-charcoal/40 font-cactus mt-1">
            remaining of{' '}
            <span className="tabular-nums">R{summary.monthlyIncome.toLocaleString()}</span> income
          </p>

          {/* Spent vs remaining bar */}
          <div className="mt-4">
            <div className="h-2 bg-cactus-overlay rounded-full overflow-hidden">
              <div
                className="h-full bg-cactus-sage rounded-full transition-all duration-500"
                style={{ width: `${spentPercentage}%` }}
              />
            </div>
            {summary.totalSpent > 0 && (
              <p className="text-xs text-cactus-charcoal/40 font-cactus mt-1.5">
                <span className="tabular-nums">R{summary.totalSpent.toLocaleString()}</span> spent
              </p>
            )}
          </div>
        </div>

        {/* Buckets — stacked horizontal bar */}
        {summary.buckets.length > 0 && (
          <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-cactus font-bold text-cactus-charcoal mb-3">
              Spending Plan
            </h2>

            {/* Stacked bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-cactus-overlay">
              {summary.buckets.map((bucket) => {
                const widthPct = totalAllocated > 0 ? (bucket.spent / totalAllocated) * 100 : 0;
                return (
                  <div
                    key={bucket.type}
                    className={`h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full ${BUCKET_FILL_CLASS[bucket.type]}`}
                    style={{ width: `${widthPct}%` }}
                  />
                );
              })}
            </div>

            {/* Labels */}
            <div className="stagger-children flex items-center gap-6 mt-3">
              {summary.buckets.map((bucket) => (
                <div key={bucket.type} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${BUCKET_DOT_CLASS[bucket.type]}`}
                  />
                  <span className="text-cactus-charcoal font-cactus">{bucket.name}</span>
                  <span className="text-cactus-charcoal font-cactus tabular-nums">
                    R{bucket.spent.toLocaleString()}
                  </span>
                  <span className="text-cactus-charcoal/40 font-cactus">/</span>
                  <span className="text-cactus-charcoal/60 font-cactus tabular-nums">
                    R{bucket.allocated.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Goal Focus */}
        {primaryGoal && (
          <div className="mb-8">
            <h2 className="text-sm font-cactus font-bold text-cactus-charcoal mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-cactus-sage" />
              Current Focus
            </h2>
            <PrimaryGoalCard goal={primaryGoal} />
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-white border border-cactus-overlay rounded-2xl">
          <div className="p-6 border-b border-cactus-overlay flex items-center justify-between">
            <h2 className="text-sm font-cactus font-bold text-cactus-charcoal">
              Recent Transactions
            </h2>
            <div className="flex items-center gap-4">
              <Link
                to="/import"
                className="text-cactus-sage font-cactus font-semibold flex items-center gap-1 text-sm"
              >
                <Upload className="w-4 h-4" />
                Import
              </Link>
              <Link
                to="/transactions"
                className="text-cactus-sage font-cactus font-semibold text-sm"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-cactus-overlay">
            {summary.recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-cactus-charcoal/60 font-cactus">
                No recent transactions
              </div>
            ) : (
              summary.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 flex items-center gap-4 ${
                    !transaction.isClassified ? 'border-l-2 border-l-cactus-prickly' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.amount > 0 ? 'bg-cactus-sage-light' : 'bg-cactus-overlay'
                    }`}
                  >
                    {transaction.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-cactus-sage" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-cactus-prickly" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-cactus font-semibold text-cactus-charcoal">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-cactus-charcoal/50 font-cactus">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`font-cactus font-bold tabular-nums ${
                      transaction.amount > 0 ? 'text-cactus-sage' : 'text-cactus-prickly'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : ''}R
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
