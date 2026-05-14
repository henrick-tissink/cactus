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

const BUCKET_FILL_CLASS: Record<MacroCategoryType, string> = {
  [MacroCategoryType.Needs]: 'bg-brand-sage',
  [MacroCategoryType.Wants]: 'bg-brand-terracotta',
  [MacroCategoryType.Goals]: 'bg-brand-accent-ink',
};

const BUCKET_DOT_CLASS: Record<MacroCategoryType, string> = {
  [MacroCategoryType.Needs]: 'bg-brand-sage',
  [MacroCategoryType.Wants]: 'bg-brand-terracotta',
  [MacroCategoryType.Goals]: 'bg-brand-accent-ink',
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
    <div className="p-8 bg-brand-cream font-sans-brand min-h-full">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-sage" />
        <span className="ml-3 text-brand-text-muted font-sans-brand">Loading dashboard…</span>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-8 bg-brand-cream font-sans-brand min-h-full">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 text-center max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-brand-terracotta mx-auto mb-4" />
        <h2 className="font-display font-medium text-xl text-brand-text mb-2">
          Failed to load dashboard
        </h2>
        <p className="text-brand-text-muted text-[14px] leading-relaxed">{error.message}</p>
      </div>
    </div>
  );
}

const SECTION_KICKER =
  'font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted';

function OnboardingChecklist() {
  return (
    <div className="p-8 bg-brand-cream font-sans-brand min-h-full">
      <div className="animate-fade-in">
        <h1 className="font-display font-medium text-[2.5rem] leading-[1.05] tracking-[-0.018em] text-brand-text mb-2 capitalize">
          {getMonthTitle()}
        </h1>
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-10 text-center shadow-[0_24px_48px_-16px_rgba(31,111,74,0.08)]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-brand-sage-soft">
              <Upload className="w-7 h-7 text-brand-sage" />
            </div>
            <h2 className="font-display font-medium text-2xl text-brand-text mb-2 tracking-tight">
              Let's get your finances in order.
            </h2>
            <p className="text-brand-text-muted font-sans-brand text-[15px] leading-relaxed mb-8">
              Start by importing a bank statement.
            </p>

            <div className="space-y-3 text-left">
              <Link
                to="/import"
                className="flex items-center gap-3 p-4 rounded-xl border border-brand-border hover:bg-brand-sage-soft/60 hover:border-brand-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
              >
                <Circle className="w-5 h-5 text-brand-text-faint shrink-0" />
                <span className="font-sans-brand font-semibold text-brand-text">
                  Import your first bank statement
                </span>
                <ArrowRight className="w-4 h-4 text-brand-text-faint ml-auto" />
              </Link>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-border opacity-50">
                <Circle className="w-5 h-5 text-brand-text-faint shrink-0" />
                <span className="font-sans-brand font-semibold text-brand-text-faint">
                  Classify your transactions
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-border opacity-50">
                <Circle className="w-5 h-5 text-brand-text-faint shrink-0" />
                <span className="font-sans-brand font-semibold text-brand-text-faint">
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 max-w-md shadow-[0_16px_40px_-16px_rgba(31,111,74,0.10)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-sage-soft">
            <Icon className="w-4 h-4 text-brand-sage" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-medium text-brand-text text-lg tracking-tight">
              {goal.name}
            </h3>
            <span className="bg-brand-sage text-brand-cream font-sans-brand font-semibold text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              Primary
            </span>
          </div>
        </div>
        <Link
          to="/goals"
          className="font-sans-brand text-[13px] font-semibold text-brand-sage hover:text-brand-accent-ink flex items-center gap-1 underline-offset-4 hover:underline transition-colors"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div>
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="text-brand-text-muted font-sans-brand tabular-lining">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-brand-text-muted font-sans-brand tabular-lining">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sage transition-all duration-500"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[12px] mt-2">
          <span className="text-brand-text-faint font-sans-brand">
            {goal.progressPercentage.toFixed(0)}% complete
          </span>
          <span className="text-brand-sage font-sans-brand font-semibold tabular-lining">
            {formatCurrency(remaining)} to go
          </span>
        </div>
        {goal.currentAmount === 0 && (
          <p className="text-[12px] text-brand-text-muted font-display italic mt-3">
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

  const totalAllocated = summary.buckets.reduce((sum, b) => sum + b.allocated, 0);

  return (
    <div className="p-6 md:p-10 bg-brand-cream font-sans-brand min-h-full">
      <div className="animate-fade-in max-w-5xl mx-auto">
        {/* Header — month title as Fraunces hero */}
        <header className="mb-10">
          <p className={`${SECTION_KICKER} mb-2`}>This month</p>
          <h1 className="font-display font-medium text-[2.75rem] leading-[1.05] tracking-[-0.018em] text-brand-text capitalize">
            {getMonthTitle()}
          </h1>
        </header>

        {/* Unclassified banner — left-accent terracotta strip */}
        {summary.unclassifiedCount > 0 && (
          <div className="mb-8 bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-2xl pl-5 pr-4 py-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand-terracotta shrink-0" />
            <p className="text-brand-accent-ink font-sans-brand text-[14px]">
              <span className="font-semibold tabular-lining">{summary.unclassifiedCount}</span>{' '}
              transactions need classifying
              <span className="text-brand-text-faint">
                {' '}
                ({estimateClassifyTime(summary.unclassifiedCount)})
              </span>
            </p>
            <Link
              to="/transactions?filter=unclassified"
              className="ml-auto font-sans-brand text-[13px] font-semibold text-brand-accent-ink hover:text-brand-text underline-offset-4 hover:underline flex items-center gap-1 transition-colors"
            >
              Classify now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Hero metric — remaining amount in Fraunces */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 mb-6 shadow-[0_24px_56px_-24px_rgba(31,111,74,0.12)]">
          <p className={SECTION_KICKER}>Remaining</p>
          <p
            className={`mt-2 font-display font-medium tabular-lining text-[3.25rem] leading-[1.02] tracking-[-0.02em] ${
              remaining >= 0 ? 'text-brand-text' : 'text-brand-terracotta'
            }`}
          >
            R{remaining.toLocaleString()}
          </p>
          <p className="text-brand-text-muted font-sans-brand text-[14px] mt-1">
            of <span className="tabular-lining">R{summary.monthlyIncome.toLocaleString()}</span>{' '}
            income
          </p>

          <div className="mt-6">
            <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-sage rounded-full transition-all duration-500"
                style={{ width: `${spentPercentage}%` }}
              />
            </div>
            {summary.totalSpent > 0 && (
              <p className="text-[12px] text-brand-text-faint font-sans-brand mt-2">
                <span className="tabular-lining">R{summary.totalSpent.toLocaleString()}</span> spent
              </p>
            )}
          </div>
        </div>

        {/* Buckets — refined stacked bar */}
        {summary.buckets.length > 0 && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-7 mb-8 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <h2 className={`${SECTION_KICKER} mb-4`}>Spending plan</h2>

            <div className="h-2 rounded-full overflow-hidden flex bg-brand-border">
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

            <div className="stagger-children flex flex-wrap items-center gap-x-7 gap-y-3 mt-4">
              {summary.buckets.map((bucket) => (
                <div
                  key={bucket.type}
                  className="flex items-center gap-2 font-sans-brand text-[13px]"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${BUCKET_DOT_CLASS[bucket.type]}`}
                  />
                  <span className="text-brand-text">{bucket.name}</span>
                  <span className="text-brand-text tabular-lining font-semibold">
                    R{bucket.spent.toLocaleString()}
                  </span>
                  <span className="text-brand-text-faint">/</span>
                  <span className="text-brand-text-muted tabular-lining">
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
            <h2 className={`${SECTION_KICKER} mb-4 flex items-center gap-2`}>
              <Star className="w-3.5 h-3.5 text-brand-sage" />
              Current focus
            </h2>
            <PrimaryGoalCard goal={primaryGoal} />
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
          <div className="px-7 py-5 border-b border-brand-border flex items-center justify-between">
            <h2 className={SECTION_KICKER}>Recent transactions</h2>
            <div className="flex items-center gap-5">
              <Link
                to="/import"
                className="font-sans-brand text-[13px] font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline flex items-center gap-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </Link>
              <Link
                to="/transactions"
                className="font-sans-brand text-[13px] font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-brand-border">
            {summary.recentTransactions.length === 0 ? (
              <div className="p-10 text-center text-brand-text-muted font-sans-brand">
                No recent transactions
              </div>
            ) : (
              summary.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`px-7 py-4 flex items-center gap-4 ${
                    !transaction.isClassified
                      ? 'border-l-[3px] border-l-brand-terracotta bg-brand-terracotta-soft/30'
                      : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      transaction.amount > 0 ? 'bg-brand-sage-soft' : 'bg-brand-border'
                    }`}
                  >
                    {transaction.amount > 0 ? (
                      <TrendingUp className="w-4 h-4 text-brand-sage" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-brand-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans-brand font-semibold text-brand-text text-[14px] truncate">
                      {transaction.description}
                    </p>
                    <p className="text-[12px] text-brand-text-faint font-sans-brand">
                      {new Date(transaction.transactionDate).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <p
                    className={`font-display font-medium tabular-lining text-[17px] ${
                      transaction.amount > 0 ? 'text-brand-sage' : 'text-brand-text'
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
