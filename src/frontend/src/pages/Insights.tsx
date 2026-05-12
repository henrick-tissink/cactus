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

const BRAND_CHART_COLORS = {
  needs: '#77DD77', // cactus-sage
  wants: '#FFCC00', // cactus-desert
  goals: '#FF6F61', // cactus-prickly
  surplus: '#77DD77', // cactus-sage
  deficit: '#FF6F61', // cactus-prickly
  gridline: 'rgba(51, 51, 51, 0.06)', // cactus-overlay
  axisText: '#333333', // cactus-charcoal
};
// Hex strings used directly because Recharts props don't read CSS vars at runtime.
// If brand tokens shift, update this map alongside index.css.

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
    bucketBg: 'bg-cactus-sage',
    bucketSoftBg: 'bg-cactus-needs-bg/40',
    dotBg: 'bg-cactus-sage',
    accentText: 'text-cactus-sage',
  },
  [MacroCategoryType.Wants]: {
    chartHex: BRAND_CHART_COLORS.wants,
    bucketBg: 'bg-cactus-desert',
    bucketSoftBg: 'bg-cactus-wants-bg/40',
    dotBg: 'bg-cactus-desert',
    accentText: 'text-cactus-desert',
  },
  [MacroCategoryType.Goals]: {
    chartHex: BRAND_CHART_COLORS.goals,
    bucketBg: 'bg-cactus-prickly',
    bucketSoftBg: 'bg-cactus-goals-bg/40',
    dotBg: 'bg-cactus-prickly',
    accentText: 'text-cactus-prickly',
  },
};

const GUIDELINE = {
  needs: 50,
  wants: 30,
  goals: 20,
};

function LoadingState() {
  return (
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cactus-sage" />
        <span className="ml-3 text-cactus-charcoal/60 font-cactus">Loading insights...</span>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="bg-cactus-goals-bg border border-cactus-overlay rounded-2xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-cactus-prickly mx-auto mb-4" />
        <h2 className="text-lg font-cactus font-bold text-cactus-charcoal mb-2">
          Failed to load insights
        </h2>
        <p className="text-cactus-charcoal font-cactus">{error.message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl">Insights</h1>
        <p className="text-cactus-charcoal/60 font-cactus">
          Analyze your spending trends and patterns.
        </p>
      </div>
      <div className="bg-white border border-cactus-overlay rounded-2xl p-12 text-center">
        <TrendingUp className="w-16 h-16 text-cactus-charcoal/40 mx-auto mb-4" />
        <h2 className="text-xl font-cactus font-bold text-cactus-charcoal mb-2">No insights yet</h2>
        <p className="text-cactus-charcoal/60 font-cactus max-w-md mx-auto">
          Start tracking your transactions and spending to see insights about your financial trends.
          Insights will appear after you have transaction data for at least one month.
        </p>
      </div>
    </div>
  );
}

function TrendSummaryCard({ trendDirection }: { trendDirection: TrendDirection }) {
  const trendConfig = {
    [TrendDirection.Improving]: {
      icon: TrendingUp,
      iconColor: 'text-cactus-sage',
      cardBg: 'bg-cactus-sage-light',
      iconBg: 'bg-cactus-sage-light',
      title: 'Improving',
      message: "You're improving! Your savings rate has increased in recent months.",
    },
    [TrendDirection.Stable]: {
      icon: Minus,
      iconColor: 'text-cactus-charcoal/60',
      cardBg: 'bg-white',
      iconBg: 'bg-cactus-sandstone',
      title: 'Stable',
      message: "You're maintaining a consistent spending pattern. Keep it up!",
    },
    [TrendDirection.Declining]: {
      icon: TrendingDown,
      iconColor: 'text-cactus-prickly',
      cardBg: 'bg-cactus-goals-bg',
      iconBg: 'bg-cactus-goals-bg',
      title: 'Declining',
      message: 'Consider adjusting your spending. Your savings rate has decreased recently.',
    },
  };

  const config = trendConfig[trendDirection] || trendConfig[TrendDirection.Stable];
  const Icon = config.icon;

  return (
    <div className={`${config.cardBg} border border-cactus-overlay rounded-2xl p-6`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${config.iconBg}`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>
        <div>
          <h3 className="text-lg font-cactus font-bold text-cactus-charcoal">
            Trend: {config.title}
          </h3>
          <p className="text-cactus-charcoal/70 font-cactus mt-1">{config.message}</p>
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
          <span className="text-2xl text-cactus-charcoal font-cactus font-bold tabular-nums">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="mt-3 font-cactus font-semibold text-cactus-charcoal">{label}</p>
      <p className="text-sm font-cactus text-cactus-charcoal/60">
        {isAboveGuideline ? (
          <span className="text-cactus-prickly">
            +{diff}% above {guideline}% guideline
          </span>
        ) : percentage === guideline ? (
          <span className="text-cactus-sage">On target ({guideline}%)</span>
        ) : (
          <span className="text-cactus-sage">
            {diff}% below {guideline}% guideline
          </span>
        )}
      </p>
    </div>
  );
}

function AverageSplitCard({ data }: { data: InsightsData }) {
  return (
    <div className="bg-white border border-cactus-overlay rounded-2xl p-6">
      <h3 className="text-lg text-cactus-charcoal font-cactus font-bold mb-6">
        Average N/W/G Split
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
      <div className="mt-6 pt-4 border-t border-cactus-overlay">
        <p className="text-sm font-cactus text-cactus-charcoal/60 text-center">
          Compared to the 50/30/20 guideline (Needs/Wants/Goals)
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
    <div className="bg-white border border-cactus-overlay rounded-2xl p-5">
      <h3 className="text-lg text-cactus-charcoal font-cactus font-bold mb-6">
        Monthly Spending Trend
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
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(51,51,51,0.06)',
                borderRadius: 12,
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
            />
            <Legend />
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
    <div className="bg-white border border-cactus-overlay rounded-2xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg text-cactus-charcoal font-cactus font-bold">
          Monthly Surplus/Deficit
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-cactus text-cactus-charcoal/60">Average:</span>
          <span
            className={`text-lg font-cactus font-bold tabular-nums ${averageSurplus >= 0 ? 'text-cactus-sage' : 'text-cactus-prickly'}`}
          >
            R{Math.abs(averageSurplus).toLocaleString()}
            {averageSurplus >= 0 ? ' surplus' : ' deficit'}
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
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(51,51,51,0.06)',
                borderRadius: 12,
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
      <div className="mt-4 flex items-center justify-center gap-6 text-sm font-cactus">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cactus-sage" />
          <span className="text-cactus-charcoal/60">Surplus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cactus-prickly" />
          <span className="text-cactus-charcoal/60">Deficit</span>
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
      <div className="bg-white border border-cactus-overlay rounded-2xl p-6">
        <h3 className="text-lg text-cactus-charcoal font-cactus font-bold mb-4">
          Category Averages
        </h3>
        <p className="text-cactus-charcoal/60 font-cactus text-center py-8">
          Classify your transactions to unlock spending insights by category.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-cactus-overlay rounded-2xl p-6">
      <h3 className="text-lg text-cactus-charcoal font-cactus font-bold mb-6">Category Averages</h3>
      <div className="space-y-6">
        {macroOrder.map((macroType) => {
          const categories = groupedCategories[macroType];
          if (!categories || categories.length === 0) return null;

          const color = macroColorMap[macroType];

          return (
            <div
              key={macroType}
              className={`${color.bucketSoftBg} border border-cactus-overlay rounded-2xl p-4`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${color.dotBg}`} />
                <h4 className="font-cactus font-bold text-cactus-charcoal">
                  {macroNames[macroType]}
                </h4>
              </div>
              <div className="space-y-2">
                {categories.slice(0, 5).map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-white border border-cactus-overlay"
                  >
                    <span className="text-cactus-charcoal font-cactus font-semibold">
                      {cat.categoryName}
                    </span>
                    <span className="font-cactus font-bold tabular-nums text-cactus-charcoal">
                      R{cat.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-cactus-charcoal/60 text-sm font-normal">/mo</span>
                    </span>
                  </div>
                ))}
                {categories.length > 5 && (
                  <p className="text-sm font-cactus text-cactus-charcoal/60 text-center py-1">
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
    <div className="bg-white border border-cactus-overlay rounded-2xl p-6">
      <h3 className="text-lg text-cactus-charcoal font-cactus font-bold mb-4">
        vs. 50/30/20 Guideline
      </h3>
      <div className="space-y-4">
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
                <span className={`font-cactus font-semibold ${color.accentText}`}>{label}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-cactus font-bold tabular-nums text-cactus-charcoal">
                    {actual.toFixed(1)}%
                  </span>
                  <span className="text-sm font-cactus text-cactus-charcoal/40">vs</span>
                  <span className="text-sm font-cactus font-bold tabular-nums text-cactus-charcoal/60">
                    {guideline}%
                  </span>
                </div>
                <div className="relative h-2 bg-cactus-overlay rounded-xl overflow-hidden">
                  <div
                    className={`h-full ${color.bucketBg} transition-all duration-500`}
                    style={{ width: `${Math.min(actual, 100)}%` }}
                  />
                  {/* Guideline marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cactus-charcoal/40"
                    style={{ left: `${guidelineLeftPct}%` }}
                  />
                </div>
              </div>
              <div className="w-24 text-right">
                {isGood ? (
                  <span className="inline-flex items-center gap-1 text-sm font-cactus text-cactus-sage">
                    <CheckCircle className="w-4 h-4" />
                    On track
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-cactus text-cactus-prickly">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-bold tabular-nums">
                      {Math.abs(diff).toFixed(1)}%
                    </span>{' '}
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
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl">Insights</h1>
        <p className="text-cactus-charcoal/60 font-cactus">
          {startMonth} - {endMonth}
        </p>
      </div>

      {/* Trend Summary */}
      <div className="mb-6">
        <TrendSummaryCard trendDirection={insights.trendDirection} />
      </div>

      {/* Average Split and Guideline Comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
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
  );
}
