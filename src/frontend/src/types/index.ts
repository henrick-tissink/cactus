// Auth types
export interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isOnboardingComplete: boolean;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isOnboardingComplete: boolean;
  isEmailVerified: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Category types
export const MacroCategoryType = {
  Needs: 1,
  Wants: 2,
  Goals: 3,
} as const;
export type MacroCategoryType = (typeof MacroCategoryType)[keyof typeof MacroCategoryType];

export interface MacroCategory {
  id: string;
  type: MacroCategoryType;
  name: string;
  description: string;
  displayOrder: number;
}

export interface Category {
  id: string;
  macroCategoryId: string;
  name: string;
  icon?: string;
  displayOrder: number;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  displayOrder: number;
}

// Transaction types
export const TransactionType = {
  Debit: 1,
  Credit: 2,
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export interface Transaction {
  id: string;
  accountId: string;
  macroCategoryId?: string;
  categoryId?: string;
  subCategoryId?: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchantName?: string;
  transactionDate: string;
  isClassified: boolean;
  isManual: boolean;
  notes?: string;
}

// Account types
export const AccountType = {
  Cheque: 1,
  Savings: 2,
  CreditCard: 3,
  Investment: 4,
  Loan: 5,
  Other: 6,
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  isManual: boolean;
  isActive: boolean;
}

// Spending Plan types
export interface SpendingPlan {
  id: string;
  year: number;
  month: number;
  monthlyIncome: number;
  needsPercentage: number;
  wantsPercentage: number;
  goalsPercentage: number;
}

export interface BucketStatus {
  macroCategoryType: MacroCategoryType;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

// Goal types
export const GoalType = {
  EmergencyFund: 1,
  DebtPayoff: 2,
  Savings: 3,
  Investment: 4,
  MiniBuffer: 5,
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export interface Goal {
  id: string;
  name: string;
  goalType: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  priority: number;
  isActive: boolean;
  isCompleted: boolean;
  isPrimary: boolean;
}

// Dashboard types
export interface DashboardSummary {
  monthlyIncome: number;
  totalSpent: number;
  buckets: BucketStatus[];
  unclassifiedCount: number;
  recentTransactions: Transaction[];
  activeGoals: Goal[];
}

// Onboarding types
export interface OnboardingStep {
  stepNumber: number;
  stepName: string;
  response: Record<string, unknown>;
}

// Paginated results
export interface TransactionsResult {
  items: TransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransactionDto {
  id: string;
  accountId: string;
  accountName: string;
  macroCategoryId?: string;
  macroCategoryName?: string;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchantName?: string;
  transactionDate: string;
  isClassified: boolean;
  isManual: boolean;
  notes?: string;
}

// Category hierarchy for classification
export interface MacroCategoryWithCategories {
  id: string;
  type: MacroCategoryType;
  name: string;
  description: string;
  categories: CategoryWithSubCategories[];
}

export interface CategoryWithSubCategories {
  id: string;
  name: string;
  icon?: string;
  subCategories: SubCategoryDto[];
}

export interface SubCategoryDto {
  id: string;
  name: string;
}

// Goal DTOs
export interface GoalDto {
  id: string;
  name: string;
  goalType: GoalType;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  targetDate?: string;
  priority: number;
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: string;
  isPrimary: boolean;
  linkedAccountId?: string;
  linkedAccountName?: string;
  linkedDebtId?: string;
  linkedDebtName?: string;
  milestones: GoalMilestoneDto[];
}

export interface GoalMilestoneDto {
  id: string;
  name: string;
  targetAmount: number;
  isReached: boolean;
  reachedAt?: string;
}

export interface GoalRecommendation {
  order: number;
  goalType: GoalType;
  title: string;
  description: string;
  suggestedAmount: number;
  currentProgress: number;
  alreadyExists: boolean;
}

// Spending Plan DTOs
export interface SpendingPlanDto {
  id: string;
  year: number;
  month: number;
  monthlyIncome: number;
  needsPercentage: number;
  wantsPercentage: number;
  goalsPercentage: number;
  needsAmount: number;
  wantsAmount: number;
  goalsAmount: number;
  needsSpent: number;
  wantsSpent: number;
  goalsSpent: number;
}

export interface SpendingPlanSuggestionDto {
  currentNeeds: number;
  currentWants: number;
  currentGoals: number;
  suggestedNeeds: number;
  suggestedWants: number;
  suggestedGoals: number;
  explanation: string;
  hasSuggestion: boolean;
  actualNeeds: number;
  actualWants: number;
  actualGoals: number;
}

// Categorization Suggestion types
export interface CategorizationSuggestion {
  macroCategoryId: string;
  categoryId: string;
  subCategoryId?: string;
  macroCategoryName: string;
  categoryName: string;
  subCategoryName?: string;
  confidence: number;
  matchedPattern: string;
}

export interface SimilarTransactionsCount {
  count: number;
  matchPattern: string;
}

export interface ClassifyTransactionResult {
  classifiedCount: number;
  classifiedTransactionIds: string[];
}

// Insights types
export const TrendDirection = {
  Improving: 1,
  Stable: 2,
  Declining: 3,
} as const;
export type TrendDirection = (typeof TrendDirection)[keyof typeof TrendDirection];

export interface MonthlyBreakdown {
  year: number;
  month: number;
  needsPercent: number;
  wantsPercent: number;
  goalsPercent: number;
  totalIncome: number;
  totalSpent: number;
  surplus: number;
}

export interface CategoryAverage {
  categoryId: string;
  categoryName: string;
  macroCategoryType: MacroCategoryType;
  averageAmount: number;
}

export interface InsightsData {
  monthlyBreakdowns: MonthlyBreakdown[];
  averageNeedsPercent: number;
  averageWantsPercent: number;
  averageGoalsPercent: number;
  averageSurplus: number;
  trendDirection: TrendDirection;
  categoryAverages: CategoryAverage[];
}

// Recurring Pattern types
export interface RecurringPatternDetailDto {
  id: string;
  description: string;
  averageAmount: number;
  frequencyDays: number;
  frequencyLabel: string;
  nextExpectedDate?: string;
  categoryName?: string;
}
