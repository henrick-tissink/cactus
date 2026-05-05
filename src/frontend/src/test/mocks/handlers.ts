import { http, HttpResponse } from 'msw';
import type { GoalDto, MacroCategoryWithCategories, TransactionsResult } from '../../types';
import { GoalType, MacroCategoryType, TransactionType } from '../../types';

const dashboardSummary = {
  monthlyIncome: 50000,
  totalSpent: 12000,
  buckets: [
    { type: MacroCategoryType.Needs, name: 'Needs', allocated: 25000, spent: 8000, remaining: 17000 },
    { type: MacroCategoryType.Wants, name: 'Wants', allocated: 15000, spent: 4000, remaining: 11000 },
    { type: MacroCategoryType.Goals, name: 'Goals', allocated: 10000, spent: 0, remaining: 10000 },
  ],
  unclassifiedCount: 0,
  recentTransactions: [
    {
      id: 'tx-1',
      description: 'Woolworths',
      amount: -450,
      transactionDate: '2026-05-01T00:00:00Z',
      isClassified: true,
      categoryName: 'Groceries',
    },
  ],
};

const goalsList: GoalDto[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    goalType: GoalType.EmergencyFund,
    targetAmount: 30000,
    currentAmount: 5000,
    progressPercentage: 16.67,
    priority: 1,
    isActive: true,
    isCompleted: false,
    isPrimary: true,
    milestones: [],
  },
];

const transactionsResult: TransactionsResult = {
  items: [
    {
      id: 'tx-1',
      accountId: 'acc-1',
      accountName: 'FNB Cheque',
      amount: 450,
      type: TransactionType.Debit,
      description: 'Woolworths',
      transactionDate: '2026-05-01T00:00:00Z',
      isClassified: true,
      isManual: false,
      macroCategoryName: 'Needs',
      categoryName: 'Groceries',
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const categories: MacroCategoryWithCategories[] = [
  {
    id: 'macro-needs',
    type: MacroCategoryType.Needs,
    name: 'Needs',
    description: 'Essential expenses',
    categories: [],
  },
];

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'fail@example.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      userId: 'u-1',
      email: body.email,
      firstName: 'Test',
      lastName: 'User',
      isOnboardingComplete: true,
      isEmailVerified: true,
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
    });
  }),
  http.get('/api/dashboard/summary', () => HttpResponse.json(dashboardSummary)),
  http.get('/api/goals', () => HttpResponse.json(goalsList)),
  http.get('/api/goals/recommended-sequence', () => HttpResponse.json([])),
  http.get('/api/transactions', () => HttpResponse.json(transactionsResult)),
  http.get('/api/accounts', () => HttpResponse.json([])),
  http.get('/api/categories', () => HttpResponse.json(categories)),
];
