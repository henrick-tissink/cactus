import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { apiClient } from '../api/client';
import {
  type InsightsData,
  type MonthlyBreakdown,
  type CategoryAverage,
  MacroCategoryType,
  TrendDirection,
} from '../types';

// Hex strings used directly because Recharts props don't read CSS vars at runtime.
// If brand tokens shift, update this map alongside index.css.
const BRAND_CHART_COLORS = {
  needs: '#1f6f4a', // brand-sage
  wants: '#c9743a', // brand-terracotta
  goals: '#8c4a1e', // brand-accent-ink
  surplus: '#1f6f4a', // brand-sage
  deficit: '#c9743a', // brand-terracotta
  gridline: 'rgba(235, 229, 213, 0.6)', // brand-border at ~0.6
  axisText: '#6b5e4a', // brand-text-muted
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const macroColorMap: Record<
  MacroCategoryType,
  {
    chartHex: string;
    bucketBg: string;
    bucketSoftBg: string;
    dotBg: string;
    accentText: string;
  }
> = {
  [MacroCategoryType.Needs]: {
    chartHex: BRAND_CHART_COLORS.needs,
    bucketBg: 'bg-brand-sage',
    bucketSoftBg: 'bg-brand-sage-soft/60',
    dotBg: 'bg-brand-sage',
    accentText: 'text-brand-sage',
  },
  [MacroCategoryType.Wants]: {
    chartHex: BRAND_CHART_COLORS.wants,
    bucketBg: 'bg-brand-terracotta',
    bucketSoftBg: 'bg-brand-terracotta-soft/60',
    dotBg: 'bg-brand-terracotta',
    accentText: 'text-brand-terracotta',
  },
  [MacroCategoryType.Goals]: {
    chartHex: BRAND_CHART_COLORS.goals,
    bucketBg: 'bg-brand-accent-ink',
    bucketSoftBg: 'bg-brand-accent-ink/10',
    dotBg: 'bg-brand-accent-ink',
    accentText: 'text-brand-accent-ink',
  },
};

const GUIDELINE = {
  needs: 50,
  wants: 30,
  goals: 20,
};

function LoadingState() {
  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-sage" />
        <span className="ml-3 text-[14px] text-brand-text-muted">Loading insights…</span>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-3xl pl-6 pr-6 py-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 shrink-0 text-brand-terracotta mt-0.5" />
            <div>
              <h2 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
                Failed to load insights
              </h2>
              <p className="text-[14px] text-brand-accent-ink mt-2 leading-relaxed">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
            Patterns
          </p>
          <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
            Insights.
          </h1>
          <p className="text-[14px] text-brand-text-muted leading-relaxed mt-2">
            Analyze your spending trends and patterns.
          </p>
        </header>
        <div className="bg-brand-surface border border-brand-border rounded-3xl p-12 text-center shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
          <div className="inline-flex p-4 bg-brand-sage-soft rounded-3xl mb-4">
            <TrendingUp className="w-10 h-10 text-brand-sage" />
          </div>
          <h2 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-2">
            No insights yet
          </h2>
          <p className="text-[14px] text-brand-text-muted max-w-md mx-auto leading-relaxed">
            Start tracking your transactions and spending to see insights about your financial
            trends. Insights will appear after you have transaction data for at least one month.
          </p>
        </div>
      </div>
    </div>
  );
}

function TrendSummaryCard({ trendDirection }: { trendDirection: TrendDirection }) {
  const trendConfig = {
    [TrendDirection.Improving]: {
      icon: TrendingUp,
      iconColor: 'text-brand-sage',
      iconBg: 'bg-brand-sage-soft',
      accentBorder: 'border-brand-sage',
      title: 'Improving',
      message: "You're improving! Your savings rate has increased in recent months.",
    },
    [TrendDirection.Stable]: {
      icon: Minus,
      iconColor: 'text-brand-text-muted',
      iconBg: 'bg-brand-border/50',
      accentBorder: 'border-brand-border',
      title: 'Stable',
      message: "You're maintaining a consistent spending pattern. Keep it up!",
    },
    [TrendDirection.Declining]: {
      icon: TrendingDown,
      iconColor: 'text-brand-terracotta',
      iconBg: 'bg-brand-terracotta-soft',
      accentBorder: 'border-brand-terracotta',
      title: 'Declining',
      message: 'Consider adjusting your spending. Your savings rate has decreased recently.',
    },
  };

  const config = trendConfig[trendDirection] || trendConfig[TrendDirection.Stable];
  const Icon = config.icon;

  return (
    <div
      className={`bg-brand-surface border border-brand-border border-l-[3px] ${config.accentBorder} rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${config.iconBg}`}>
          <Icon className={`w-7 h-7 ${config.iconColor}`} />
        </div>
        <div>
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
            Trend
          </p>
          <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
            {config.title}
          </h3>
          <p className="text-[14px] text-brand-text-muted mt-1.5 leading-relaxed">
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({
  percentage,
  guideline,
  label,
  macroType,
}: {
  percentage: number;
  guideline: number;
  label: string;
  macroType: MacroCategoryType;
}) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const guidelineOffset = circumference - (guideline / 100) * circumference;

  const isAboveGuideline = percentage > guideline;
  const diff = Math.abs(percentage - guideline).toFixed(1);
  const color = macroColorMap[macroType];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={BRAND_CHART_COLORS.gridline}
            strokeWidth={strokeWidth}
          />
          {/* Guideline marker */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={BRAND_CHART_COLORS.axisText}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={guidelineOffset}
            strokeLinecap="round"
            opacity={0.4}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.chartHex}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-medium tabular-lining text-[1.625rem] text-brand-text">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
        {label}
      </p>
      <p className="text-[12px] mt-1">
        {isAboveGuideline ? (
          <span className="text-brand-terracotta">
            +{diff}% above {guideline}% guideline
          </span>
        ) : percentage === guideline ? (
          <span className="text-brand-sage">On target ({guideline}%)</span>
        ) : (
          <span className="text-brand-sage">
            {diff}% below {guideline}% guideline
          </span>
        )}
      </p>
    </div>
  );
}

function AverageSplitCard({ data }: { data: InsightsData }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
        Average
      </p>
      <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
        N/W/G split
      </h3>
      <div className="grid grid-cols-3 gap-8">
        <CircularProgress
          percentage={data.averageNeedsPercent}
          guideline={GUIDELINE.needs}
          label="Needs"
          macroType={MacroCategoryType.Needs}
        />
        <CircularProgress
          percentage={data.averageWantsPercent}
          guideline={GUIDELINE.wants}
          label="Wants"
          macroType={MacroCategoryType.Wants}
        />
        <CircularProgress
          percentage={data.averageGoalsPercent}
          guideline={GUIDELINE.goals}
          label="Goals"
          macroType={MacroCategoryType.Goals}
        />
      </div>
      <div className="mt-6 pt-4 border-t border-brand-border">
        <p className="text-[12px] text-brand-text-faint text-center">
          Compared to the 50/30/20 guideline (Needs / Wants / Goals)
        </p>
      </div>
    </div>
  );
}

function MonthlyTrendChart({ monthlyBreakdowns }: { monthlyBreakdowns: MonthlyBreakdown[] }) {
  const chartData = monthlyBreakdowns.map((m) => ({
    name: `${MONTH_NAMES[m.month - 1]} ${m.year.toString().slice(-2)}`,
    Needs: m.needsPercent,
    Wants: m.wantsPercent,
    Goals: m.goalsPercent,
  }));

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
        Monthly
      </p>
      <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
        Spending trend
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND_CHART_COLORS.gridline} />
            <XAxis
              dataKey="name"
              tick={{ fill: BRAND_CHART_COLORS.axisText, fontSize: 12 }}
              axisLine={{ stroke: BRAND_CHART_COLORS.gridline }}
            />
            <YAxis
              tick={{ fill: BRAND_CHART_COLORS.axisText, fontSize: 12 }}
              axisLine={{ stroke: BRAND_CHART_COLORS.gridline }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #ebe5d5',
                borderRadius: 12,
                fontSize: 13,
                color: '#2d2418',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#6b5e4a' }} />
            <Line
              type="monotone"
              dataKey="Needs"
              stroke={BRAND_CHART_COLORS.needs}
              strokeWidth={2}
              dot={{ fill: BRAND_CHART_COLORS.needs, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Wants"
              stroke={BRAND_CHART_COLORS.wants}
              strokeWidth={2}
              dot={{ fill: BRAND_CHART_COLORS.wants, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Goals"
              stroke={BRAND_CHART_COLORS.goals}
              strokeWidth={2}
              dot={{ fill: BRAND_CHART_COLORS.goals, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SurplusDeficitChart({
  monthlyBreakdowns,
  averageSurplus,
}: {
  monthlyBreakdowns: MonthlyBreakdown[];
  averageSurplus: number;
}) {
  const chartData = monthlyBreakdowns.map((m) => ({
    name: `${MONTH_NAMES[m.month - 1]} ${m.year.toString().slice(-2)}`,
    surplus: m.surplus,
    fill: m.surplus >= 0 ? BRAND_CHART_COLORS.surplus : BRAND_CHART_COLORS.deficit,
  }));

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
            Monthly
          </p>
          <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
            Surplus / deficit
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-brand-text-faint">
            Average
          </span>
          <span
            className={`font-display font-medium tabular-lining text-[1.25rem] ${averageSurplus >= 0 ? 'text-brand-sage' : 'text-brand-terracotta'}`}
          >
            R{Math.abs(averageSurplus).toLocaleString()}
          </span>
          <span className="text-[12px] text-brand-text-muted">
            {averageSurplus >= 0 ? 'surplus' : 'deficit'}
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND_CHART_COLORS.gridline} />
            <XAxis
              dataKey="name"
              tick={{ fill: BRAND_CHART_COLORS.axisText, fontSize: 12 }}
              axisLine={{ stroke: BRAND_CHART_COLORS.gridline }}
            />
            <YAxis
              tick={{ fill: BRAND_CHART_COLORS.axisText, fontSize: 12 }}
              axisLine={{ stroke: BRAND_CHART_COLORS.gridline }}
              tickFormatter={(value) => `R${Math.abs(value / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #ebe5d5',
                borderRadius: 12,
                fontSize: 13,
                color: '#2d2418',
              }}
              formatter={(value) => {
                const numValue = Number(value);
                return [
                  `R${Math.abs(numValue).toLocaleString()}`,
                  numValue >= 0 ? 'Surplus' : 'Deficit',
                ];
              }}
            />
            <ReferenceLine y={0} stroke={BRAND_CHART_COLORS.axisText} strokeDasharray="3 3" />
            <Bar dataKey="surplus" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-[12px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-brand-sage" />
          <span className="text-brand-text-muted">Surplus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-brand-terracotta" />
          <span className="text-brand-text-muted">Deficit</span>
        </div>
      </div>
    </div>
  );
}

function CategoryAveragesCard({ categoryAverages }: { categoryAverages: CategoryAverage[] }) {
  // Group categories by macro category
  const groupedCategories = categoryAverages.reduce(
    (acc, cat) => {
      const type = cat.macroCategoryType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(cat);
      return acc;
    },
    {} as Record<MacroCategoryType, CategoryAverage[]>
  );

  const macroOrder = [MacroCategoryType.Needs, MacroCategoryType.Wants, MacroCategoryType.Goals];
  const macroNames: Record<MacroCategoryType, string> = {
    [MacroCategoryType.Needs]: 'Needs',
    [MacroCategoryType.Wants]: 'Wants',
    [MacroCategoryType.Goals]: 'Goals',
  };

  if (categoryAverages.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
          By category
        </p>
        <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-4">
          Category averages
        </h3>
        <p className="text-[14px] text-brand-text-muted text-center py-8 leading-relaxed">
          Classify your transactions to unlock spending insights by category.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
        By category
      </p>
      <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
        Category averages
      </h3>
      <div className="space-y-6">
        {macroOrder.map((macroType) => {
          const categories = groupedCategories[macroType];
          if (!categories || categories.length === 0) return null;

          const color = macroColorMap[macroType];

          return (
            <div
              key={macroType}
              className={`${color.bucketSoftBg} border border-brand-border rounded-2xl p-4`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${color.dotBg}`} />
                <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text">
                  {macroNames[macroType]}
                </h4>
              </div>
              <div className="space-y-2">
                {categories.slice(0, 5).map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-brand-surface border border-brand-border"
                  >
                    <span className="text-[14px] text-brand-text font-semibold truncate">
                      {cat.categoryName}
                    </span>
                    <span className="font-display font-medium tabular-lining text-[15px] text-brand-text shrink-0">
                      R{cat.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-brand-text-faint text-[12px] font-sans-brand font-normal ml-0.5">
                        /mo
                      </span>
                    </span>
                  </div>
                ))}
                {categories.length > 5 && (
                  <p className="text-[12px] text-brand-text-faint text-center py-1">
                    +{categories.length - 5} more categories
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GuidelineComparisonCard({ data }: { data: InsightsData }) {
  const comparisons = [
    {
      label: 'Needs',
      actual: data.averageNeedsPercent,
      guideline: GUIDELINE.needs,
      macroType: MacroCategoryType.Needs,
    },
    {
      label: 'Wants',
      actual: data.averageWantsPercent,
      guideline: GUIDELINE.wants,
      macroType: MacroCategoryType.Wants,
    },
    {
      label: 'Goals',
      actual: data.averageGoalsPercent,
      guideline: GUIDELINE.goals,
      macroType: MacroCategoryType.Goals,
    },
  ];

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
      <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
        Benchmark
      </p>
      <h3 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-5">
        vs. 50/30/20
      </h3>
      <div className="space-y-5">
        {comparisons.map(({ label, actual, guideline, macroType }) => {
          const diff = actual - guideline;
          const isGood =
            (label === 'Needs' && diff <= 0) ||
            (label === 'Wants' && diff <= 0) ||
            (label === 'Goals' && diff >= 0);
          const color = macroColorMap[macroType];
          const guidelineLeftPct = Math.min(guideline, 100);

          return (
            <div key={label} className="flex items-center gap-4">
              <div className="w-16">
                <span
                  className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${color.accentText}`}
                >
                  {label}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-display font-medium tabular-lining text-[15px] text-brand-text">
                    {actual.toFixed(1)}%
                  </span>
                  <span className="text-[12px] text-brand-text-faint">vs</span>
                  <span className="font-display font-medium tabular-lining text-[13px] text-brand-text-muted">
                    {guideline}%
                  </span>
                </div>
                <div className="relative h-2 bg-brand-border/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bucketBg} transition-all duration-500`}
                    style={{ width: `${Math.min(actual, 100)}%` }}
                  />
                  {/* Guideline marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-brand-text/40"
                    style={{ left: `${guidelineLeftPct}%` }}
                  />
                </div>
              </div>
              <div className="w-24 text-right">
                {isGood ? (
                  <span className="inline-flex items-center gap-1 text-[12px] text-brand-sage font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    On track
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] text-brand-terracotta font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="tabular-lining">{Math.abs(diff).toFixed(1)}%</span>{' '}
                    {diff > 0 ? 'over' : 'under'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InsightsPage() {
  const {
    data: insights,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const response = await apiClient.get<InsightsData>('/insights');
      return response.data;
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} />;
  }

  if (!insights || insights.monthlyBreakdowns.every((m) => m.totalSpent === 0)) {
    return <EmptyState />;
  }

  const now = new Date();
  const endMonth = now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startMonth = sixMonthsAgo.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
            {startMonth} – {endMonth}
          </p>
          <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
            Insights.
          </h1>
        </header>

        {/* Trend Summary */}
        <div className="mb-6">
          <TrendSummaryCard trendDirection={insights.trendDirection} />
        </div>

        {/* Average Split and Guideline Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AverageSplitCard data={insights} />
          <GuidelineComparisonCard data={insights} />
        </div>

        {/* Monthly Trend Chart */}
        <div className="mb-6">
          <MonthlyTrendChart monthlyBreakdowns={insights.monthlyBreakdowns} />
        </div>

        {/* Surplus/Deficit Chart */}
        <div className="mb-6">
          <SurplusDeficitChart
            monthlyBreakdowns={insights.monthlyBreakdowns}
            averageSurplus={insights.averageSurplus}
          />
        </div>

        {/* Category Averages */}
        <div className="mb-6">
          <CategoryAveragesCard categoryAverages={insights.categoryAverages} />
        </div>
      </div>
    </div>
  );
}
