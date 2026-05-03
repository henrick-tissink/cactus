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

const BUCKET_COLORS: Record<MacroCategoryType, string> = {
  [MacroCategoryType.Needs]: '#2563EB',
  [MacroCategoryType.Wants]: '#8B5CF6',
  [MacroCategoryType.Goals]: '#10B981',
};


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
    <div className="p-8">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to load dashboard</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    </div>
  );
}

function OnboardingChecklist() {
  return (
    <div className="p-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{getMonthTitle()}</h1>
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'var(--cactus-mint, #E8F5EE)' }}
            >
              <Upload className="w-8 h-8" style={{ color: 'var(--cactus-green, #1B7A4A)' }} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Let's get your finances in order
            </h2>
            <p className="text-gray-500 mb-8">Start by importing a bank statement.</p>

            <div className="space-y-4 text-left">
              <Link
                to="/import"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <span className="font-medium text-gray-900">Import your first bank statement</span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 opacity-50">
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <span className="font-medium text-gray-500">Classify your transactions</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 opacity-50">
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <span className="font-medium text-gray-500">Review your budget</span>
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
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 shadow-sm border border-amber-200 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${typeInfo?.color || 'bg-gray-100'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{goal.name}</h3>
              <div className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Primary
              </div>
            </div>
          </div>
        </div>
        <Link
          to="/goals"
          className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1 text-xs"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 font-mono-financial">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-gray-500 font-mono-financial">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-amber-600 font-medium">
            {goal.progressPercentage.toFixed(0)}% complete
          </span>
          <span className="text-gray-500 font-mono-financial">{formatCurrency(remaining)} to go</span>
        </div>
        {goal.currentAmount === 0 && (
          <p className="text-xs text-amber-600 mt-2 italic">
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
  if (summary.recentTransactions.length === 0 && summary.totalSpent === 0 && summary.monthlyIncome === 0) {
    return <OnboardingChecklist />;
  }

  const remaining = summary.monthlyIncome - summary.totalSpent;
  const spentPercentage =
    summary.monthlyIncome > 0 ? Math.min((summary.totalSpent / summary.monthlyIncome) * 100, 100) : 0;

  // Bucket bar calculations
  const totalAllocated = summary.buckets.reduce((sum, b) => sum + b.allocated, 0);

  return (
    <div className="p-8">
      <div className="animate-fade-in">
        {/* Header — dynamic month title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{getMonthTitle()}</h1>
        </div>

        {/* Unclassified transactions banner */}
        {summary.unclassifiedCount > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800">
              <strong>{summary.unclassifiedCount}</strong> transactions need classifying ({estimateClassifyTime(summary.unclassifiedCount)})
            </p>
            <Link
              to="/transactions?filter=unclassified"
              className="ml-auto text-amber-700 font-medium hover:text-amber-800 flex items-center gap-1"
            >
              Classify now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Hero metric — single remaining amount */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <p
            className={`text-4xl font-bold font-mono-financial ${remaining >= 0 ? 'text-gray-900' : 'text-red-600'}`}
          >
            R{remaining.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">
            remaining of{' '}
            <span className="font-mono-financial">R{summary.monthlyIncome.toLocaleString()}</span>{' '}
            income
          </p>

          {/* Spent vs remaining bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${spentPercentage}%`,
                  backgroundColor: 'var(--cactus-green, #1B7A4A)',
                }}
              />
            </div>
            {summary.totalSpent > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                <span className="font-mono-financial">R{summary.totalSpent.toLocaleString()}</span> spent
              </p>
            )}
          </div>
        </div>

        {/* Buckets — stacked horizontal bar */}
        {summary.buckets.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Spending Plan</h2>

            {/* Stacked bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
              {summary.buckets.map((bucket) => {
                const widthPct = totalAllocated > 0 ? (bucket.spent / totalAllocated) * 100 : 0;
                return (
                  <div
                    key={bucket.type}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: BUCKET_COLORS[bucket.type],
                    }}
                  />
                );
              })}
            </div>

            {/* Labels */}
            <div className="stagger-children flex items-center gap-6 mt-3">
              {summary.buckets.map((bucket) => (
                <div key={bucket.type} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: BUCKET_COLORS[bucket.type] }}
                  />
                  <span className="text-gray-600">{bucket.name}</span>
                  <span className="font-mono-financial text-gray-900">
                    R{bucket.spent.toLocaleString()}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="font-mono-financial text-gray-400">
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
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Current Focus
            </h2>
            <PrimaryGoalCard goal={primaryGoal} />
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
            <div className="flex items-center gap-4">
              <Link
                to="/import"
                className="text-gray-500 font-medium hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                <Upload className="w-4 h-4" />
                Import
              </Link>
              <Link
                to="/transactions"
                className="font-medium hover:text-green-700 text-sm"
                style={{ color: 'var(--cactus-green, #1B7A4A)' }}
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {summary.recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No recent transactions</div>
            ) : (
              summary.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 flex items-center gap-4 ${
                    !transaction.isClassified ? 'border-l-[3px] border-l-amber-400' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    {transaction.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`font-semibold font-mono-financial ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
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
