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

const colorMap: Record<
  MacroCategoryType,
  { bg: string; light: string; text: string; hex: string }
> = {
  [MacroCategoryType.Needs]: {
    bg: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    hex: '#22c55e',
  },
  [MacroCategoryType.Wants]: {
    bg: 'bg-amber-500',
    light: 'bg-amber-100',
    text: 'text-amber-700',
    hex: '#f59e0b',
  },
  [MacroCategoryType.Goals]: {
    bg: 'bg-blue-500',
    light: 'bg-blue-100',
    text: 'text-blue-700',
    hex: '#3b82f6',
  },
};

const GUIDELINE = {
  needs: 50,
  wants: 30,
  goals: 20,
};

function LoadingState() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading insights...</span>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to load insights</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600">Analyze your spending trends and patterns.</p>
      </div>
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No insights yet</h2>
        <p className="text-gray-500 max-w-md mx-auto">
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
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'Improving',
      message: "You're improving! Your savings rate has increased in recent months.",
    },
    [TrendDirection.Stable]: {
      icon: Minus,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'Stable',
      message: "You're maintaining a consistent spending pattern. Keep it up!",
    },
    [TrendDirection.Declining]: {
      icon: TrendingDown,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      title: 'Declining',
      message: 'Consider adjusting your spending. Your savings rate has decreased recently.',
    },
  };

  const config = trendConfig[trendDirection] || trendConfig[TrendDirection.Stable];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} rounded-xl p-6 shadow-sm border ${config.border}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${config.bg}`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${config.color}`}>Trend: {config.title}</h3>
          <p className="text-gray-600 mt-1">{config.message}</p>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({
  percentage,
  guideline,
  label,
  color,
}: {
  percentage: number;
  guideline: number;
  label: string;
  color: { bg: string; light: string; text: string; hex: string };
}) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const guidelineOffset = circumference - (guideline / 100) * circumference;

  const isAboveGuideline = percentage > guideline;
  const diff = Math.abs(percentage - guideline).toFixed(1);

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
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Guideline marker */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#d1d5db"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={guidelineOffset}
            strokeLinecap="round"
            opacity={0.5}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.hex}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color.text}`}>{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="mt-3 font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">
        {isAboveGuideline ? (
          <span className="text-amber-600">
            +{diff}% above {guideline}% guideline
          </span>
        ) : percentage === guideline ? (
          <span className="text-green-600">On target ({guideline}%)</span>
        ) : (
          <span className="text-green-600">
            {diff}% below {guideline}% guideline
          </span>
        )}
      </p>
    </div>
  );
}

function AverageSplitCard({ data }: { data: InsightsData }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Average N/W/G Split</h3>
      <div className="grid grid-cols-3 gap-8">
        <CircularProgress
          percentage={data.averageNeedsPercent}
          guideline={GUIDELINE.needs}
          label="Needs"
          color={colorMap[MacroCategoryType.Needs]}
        />
        <CircularProgress
          percentage={data.averageWantsPercent}
          guideline={GUIDELINE.wants}
          label="Wants"
          color={colorMap[MacroCategoryType.Wants]}
        />
        <CircularProgress
          percentage={data.averageGoalsPercent}
          guideline={GUIDELINE.goals}
          label="Goals"
          color={colorMap[MacroCategoryType.Goals]}
        />
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 text-center">
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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Spending Trend</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Needs"
              stroke={colorMap[MacroCategoryType.Needs].hex}
              strokeWidth={2}
              dot={{ fill: colorMap[MacroCategoryType.Needs].hex, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Wants"
              stroke={colorMap[MacroCategoryType.Wants].hex}
              strokeWidth={2}
              dot={{ fill: colorMap[MacroCategoryType.Wants].hex, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Goals"
              stroke={colorMap[MacroCategoryType.Goals].hex}
              strokeWidth={2}
              dot={{ fill: colorMap[MacroCategoryType.Goals].hex, strokeWidth: 2 }}
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
    fill: m.surplus >= 0 ? '#22c55e' : '#ef4444',
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Surplus/Deficit</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Average:</span>
          <span
            className={`text-lg font-semibold font-mono-financial ${averageSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            R{Math.abs(averageSurplus).toLocaleString()}
            {averageSurplus >= 0 ? ' surplus' : ' deficit'}
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `R${Math.abs(value / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => {
                const numValue = Number(value);
                return [
                  `R${Math.abs(numValue).toLocaleString()}`,
                  numValue >= 0 ? 'Surplus' : 'Deficit',
                ];
              }}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Bar dataKey="surplus" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600">Surplus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600">Deficit</span>
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Averages</h3>
        <p className="text-gray-500 text-center py-8">
          Classify your transactions to unlock spending insights by category.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Averages</h3>
      <div className="space-y-6">
        {macroOrder.map((macroType) => {
          const categories = groupedCategories[macroType];
          if (!categories || categories.length === 0) return null;

          const color = colorMap[macroType];

          return (
            <div key={macroType}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                <h4 className={`font-medium ${color.text}`}>{macroNames[macroType]}</h4>
              </div>
              <div className="space-y-2">
                {categories.slice(0, 5).map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                  >
                    <span className="text-gray-700">{cat.categoryName}</span>
                    <span className="font-medium text-gray-900 font-mono-financial">
                      R{cat.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-gray-500 text-sm font-normal">/mo</span>
                    </span>
                  </div>
                ))}
                {categories.length > 5 && (
                  <p className="text-sm text-gray-500 text-center py-1">
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
      color: colorMap[MacroCategoryType.Needs],
    },
    {
      label: 'Wants',
      actual: data.averageWantsPercent,
      guideline: GUIDELINE.wants,
      color: colorMap[MacroCategoryType.Wants],
    },
    {
      label: 'Goals',
      actual: data.averageGoalsPercent,
      guideline: GUIDELINE.goals,
      color: colorMap[MacroCategoryType.Goals],
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">vs. 50/30/20 Guideline</h3>
      <div className="space-y-4">
        {comparisons.map(({ label, actual, guideline, color }) => {
          const diff = actual - guideline;
          const isGood =
            (label === 'Needs' && diff <= 0) ||
            (label === 'Wants' && diff <= 0) ||
            (label === 'Goals' && diff >= 0);

          return (
            <div key={label} className="flex items-center gap-4">
              <div className="w-16">
                <span className={`font-medium ${color.text}`}>{label}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600">{actual.toFixed(1)}%</span>
                  <span className="text-sm text-gray-400">vs</span>
                  <span className="text-sm text-gray-600">{guideline}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bg} transition-all duration-500`}
                    style={{ width: `${Math.min(actual, 100)}%` }}
                  />
                </div>
              </div>
              <div className="w-24 text-right">
                {isGood ? (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    On track
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    {Math.abs(diff).toFixed(1)}% {diff > 0 ? 'over' : 'under'}
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
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600">
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
