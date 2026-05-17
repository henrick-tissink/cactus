import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  type TransactionsResult,
  type TransactionDto,
  type MacroCategoryWithCategories,
  type Account,
  type CategorizationSuggestion,
  type SimilarTransactionsCount,
  type RecurringPatternDetailDto,
  TransactionType,
  MacroCategoryType,
} from '../types';
import { Link } from 'react-router-dom';
import {
  Filter,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  Check,
  AlertCircle,
  Square,
  CheckSquare,
  Minus,
  Sparkles,
  RefreshCw,
  Repeat,
} from 'lucide-react';

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkClassifyModal, setShowBulkClassifyModal] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [bulkClassifyMode, setBulkClassifyMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDto | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

  // Filters
  const [filters, setFilters] = useState({
    accountId: '',
    isClassified: '',
    startDate: '',
    endDate: '',
  });

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', '20');
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.isClassified) params.append('isClassified', filters.isClassified);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get<TransactionsResult>(`/transactions?${params}`);
      return response.data;
    },
  });

  // Fetch accounts for filter dropdown
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await apiClient.get<Account[]>('/accounts');
      return response.data;
    },
  });

  // Fetch categories for classification
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<MacroCategoryWithCategories[]>('/categories');
      return response.data;
    },
  });

  const openClassifyModal = (transaction: TransactionDto) => {
    setSelectedTransaction(transaction);
    setShowClassifyModal(true);
  };

  // Selection helpers
  const unclassifiedTransactions = useMemo(
    () => transactionsData?.items.filter((t) => !t.isClassified) || [],
    [transactionsData]
  );

  const allUnclassifiedSelected = useMemo(
    () =>
      unclassifiedTransactions.length > 0 &&
      unclassifiedTransactions.every((t) => selectedTransactionIds.has(t.id)),
    [unclassifiedTransactions, selectedTransactionIds]
  );

  const someUnclassifiedSelected = useMemo(
    () =>
      unclassifiedTransactions.some((t) => selectedTransactionIds.has(t.id)) &&
      !allUnclassifiedSelected,
    [unclassifiedTransactions, selectedTransactionIds, allUnclassifiedSelected]
  );

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactionIds((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const toggleSelectAllUnclassified = () => {
    if (allUnclassifiedSelected) {
      // Deselect all unclassified
      setSelectedTransactionIds((prev) => {
        const next = new Set(prev);
        unclassifiedTransactions.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      // Select all unclassified
      setSelectedTransactionIds((prev) => {
        const next = new Set(prev);
        unclassifiedTransactions.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedTransactionIds(new Set());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMacroCategoryColor = (type?: number) => {
    switch (type) {
      case MacroCategoryType.Needs:
        return 'bg-brand-sage-soft text-brand-sage';
      case MacroCategoryType.Wants:
        return 'bg-brand-terracotta-soft text-brand-accent-ink';
      case MacroCategoryType.Goals:
        return 'bg-brand-accent-ink/10 text-brand-accent-ink';
      default:
        return 'bg-brand-border text-brand-text-muted';
    }
  };

  const applyFilters = () => {
    setPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      accountId: '',
      isClassified: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const toolbarBase =
    'flex items-center gap-2 px-4 py-2 rounded-full border font-sans-brand font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors';
  const toolbarActive = 'bg-brand-sage-soft text-brand-text border-brand-sage/40';
  const toolbarIdle =
    'bg-brand-surface text-brand-text-muted border-brand-border hover:bg-brand-sage-soft/60 hover:text-brand-text';

  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
              All activity
            </p>
            <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
              Transactions
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRecurring(!showRecurring)}
              className={`${toolbarBase} ${showRecurring ? toolbarActive : toolbarIdle}`}
            >
              <Repeat className="w-3.5 h-3.5" />
              Recurring
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${toolbarBase} ${showFilters ? toolbarActive : toolbarIdle}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <button
              onClick={() => {
                setBulkClassifyMode(!bulkClassifyMode);
                if (bulkClassifyMode) {
                  clearSelection();
                }
              }}
              className={`${toolbarBase} ${bulkClassifyMode ? toolbarActive : toolbarIdle}`}
            >
              <Tag className="w-3.5 h-3.5" />
              Bulk classify
            </button>
            <Link to="/import" className={`${toolbarBase} ${toolbarIdle}`}>
              <Upload className="w-3.5 h-3.5" />
              Import
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-sans-brand font-semibold text-[13px] text-white bg-brand-sage shadow-[0_6px_20px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_10px_28px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add transaction
            </button>
          </div>
        </header>

        {/* Recurring Patterns Panel */}
        {showRecurring && <RecurringPatternsPanel />}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                  Account
                </label>
                <select
                  value={filters.accountId}
                  onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                  className="w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-2.5 font-sans-brand text-[14px] text-brand-text outline-none transition-all"
                >
                  <option value="">All accounts</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                  Status
                </label>
                <select
                  value={filters.isClassified}
                  onChange={(e) => setFilters({ ...filters, isClassified: e.target.value })}
                  className="w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-2.5 font-sans-brand text-[14px] text-brand-text outline-none transition-all"
                >
                  <option value="">All</option>
                  <option value="true">Classified</option>
                  <option value="false">Unclassified</option>
                </select>
              </div>
              <div>
                <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                  From
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-2.5 font-sans-brand text-[14px] text-brand-text outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                  To
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-2.5 font-sans-brand text-[14px] text-brand-text outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={clearFilters} className={`${toolbarBase} ${toolbarIdle}`}>
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 rounded-full font-sans-brand font-semibold text-[13px] text-white bg-brand-sage shadow-[0_6px_20px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_10px_28px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-all"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedTransactionIds.size > 0 && (
          <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-2xl pl-5 pr-4 py-3.5 mb-6 flex items-center justify-between">
            <span className="font-sans-brand font-semibold text-[14px] text-brand-text">
              <span className="tabular-lining">{selectedTransactionIds.size}</span> transaction
              {selectedTransactionIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button onClick={clearSelection} className={`${toolbarBase} ${toolbarIdle}`}>
                Clear selection
              </button>
              <button
                onClick={() => setShowBulkClassifyModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-sans-brand font-semibold text-[13px] text-white bg-brand-sage shadow-[0_6px_20px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_10px_28px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px transition-all"
              >
                <Tag className="w-3.5 h-3.5" />
                Classify selected
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)] overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-brand-text-muted font-sans-brand text-[14px]">
              Loading transactions…
            </div>
          ) : transactionsData?.items.length === 0 ? (
            <div className="p-12 text-center font-sans-brand">
              <AlertCircle className="w-10 h-10 mx-auto mb-4 text-brand-text-faint" />
              <p className="text-brand-text-muted text-[14px]">No transactions found</p>
            </div>
          ) : (
            <>
              {/* Select All Header - only in bulk classify mode */}
              {bulkClassifyMode && unclassifiedTransactions.length > 0 && (
                <div className="px-5 py-3 border-b border-brand-border bg-brand-cream/60">
                  <button
                    onClick={toggleSelectAllUnclassified}
                    className="flex items-center gap-2 font-sans-brand text-[13px] font-semibold text-brand-text"
                  >
                    {allUnclassifiedSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-sage" />
                    ) : someUnclassifiedSelected ? (
                      <Minus className="w-4 h-4 text-brand-sage" />
                    ) : (
                      <Square className="w-4 h-4 text-brand-text-faint" />
                    )}
                    Select all unclassified ({unclassifiedTransactions.length})
                  </button>
                </div>
              )}
              <div className="divide-y divide-brand-border">
                {transactionsData?.items.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`py-3 px-5 hover:bg-brand-sage-soft/40 transition-colors ${
                      selectedTransactionIds.has(transaction.id) ? 'bg-brand-sage-soft' : ''
                    } ${!transaction.isClassified ? 'border-l-[3px] border-brand-terracotta bg-brand-terracotta-soft/30' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Checkbox - only in bulk classify mode */}
                        {bulkClassifyMode && (
                          <button
                            onClick={() => toggleTransactionSelection(transaction.id)}
                            className="shrink-0"
                          >
                            {selectedTransactionIds.has(transaction.id) ? (
                              <CheckSquare className="w-4 h-4 text-brand-sage" />
                            ) : (
                              <Square className="w-4 h-4 text-brand-text-faint hover:text-brand-text-muted" />
                            )}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-text font-sans-brand font-semibold text-[14px] truncate">
                            {transaction.merchantName || transaction.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-sans-brand text-[12px] text-brand-text-faint tabular-lining">
                              {formatDate(transaction.transactionDate)}
                            </span>
                            <span className="text-brand-text-faint">·</span>
                            <span className="font-sans-brand text-[12px] text-brand-text-muted">
                              {transaction.accountName}
                            </span>
                            {transaction.isClassified && transaction.macroCategoryName && (
                              <>
                                <span className="text-brand-text-faint">·</span>
                                <span
                                  className={`font-sans-brand font-semibold text-[11px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${getMacroCategoryColor(
                                    categories?.find((c) => c.id === transaction.macroCategoryId)
                                      ?.type
                                  )}`}
                                >
                                  {transaction.macroCategoryName}
                                </span>
                                {transaction.categoryName && (
                                  <span className="font-sans-brand text-[12px] text-brand-text-muted">
                                    {transaction.categoryName}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-display font-medium tabular-lining text-[17px] ${
                            transaction.type === TransactionType.Credit
                              ? 'text-brand-sage'
                              : 'text-brand-text'
                          }`}
                        >
                          {transaction.type === TransactionType.Credit ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                        <button
                          onClick={() => openClassifyModal(transaction)}
                          className={`p-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors ${
                            transaction.isClassified
                              ? 'text-brand-text-faint hover:text-brand-text hover:bg-brand-sage-soft/60'
                              : 'text-brand-sage hover:bg-brand-sage-soft'
                          }`}
                          title={transaction.isClassified ? 'Reclassify' : 'Classify'}
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {transactionsData && transactionsData.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border">
                  <p className="font-sans-brand text-[12px] text-brand-text-muted">
                    Page <span className="tabular-lining">{transactionsData.page}</span> of{' '}
                    <span className="tabular-lining">{transactionsData.totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 rounded-full bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-sage-soft/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === transactionsData.totalPages}
                      className="p-2 rounded-full bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-sage-soft/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Classify Modal */}
        {showClassifyModal && selectedTransaction && (
          <ClassifyModal
            transaction={selectedTransaction}
            categories={categories || []}
            onClose={() => {
              setShowClassifyModal(false);
              setSelectedTransaction(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              setShowClassifyModal(false);
              setSelectedTransaction(null);
            }}
          />
        )}

        {/* Add Transaction Modal */}
        {showAddModal && (
          <AddTransactionModal
            accounts={accounts || []}
            categories={categories || []}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              setShowAddModal(false);
            }}
          />
        )}

        {/* Bulk Classify Modal */}
        {showBulkClassifyModal && selectedTransactionIds.size > 0 && (
          <BulkClassifyModal
            transactionIds={Array.from(selectedTransactionIds)}
            categories={categories || []}
            onClose={() => setShowBulkClassifyModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              setShowBulkClassifyModal(false);
              clearSelection();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Classification Modal Component
function ClassifyModal({
  transaction,
  categories,
  onClose,
  onSuccess,
}: {
  transaction: TransactionDto;
  categories: MacroCategoryWithCategories[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'macro' | 'category' | 'sub'>('macro');
  const [selectedMacro, setSelectedMacro] = useState<MacroCategoryWithCategories | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(
    null
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [userOverrideApplyToSimilar, setUserOverrideApplyToSimilar] = useState<boolean | null>(
    null
  );

  // Fetch categorization suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['categorization-suggestions', transaction.description, transaction.merchantName],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('description', transaction.description);
      if (transaction.merchantName) {
        params.append('merchant', transaction.merchantName);
      }
      const response = await apiClient.get<CategorizationSuggestion[]>(
        `/transactions/suggestions?${params}`
      );
      return response.data;
    },
  });

  // Fetch similar transactions count
  const { data: similarCount } = useQuery({
    queryKey: ['similar-transactions-count', transaction.id],
    queryFn: async () => {
      const response = await apiClient.get<SimilarTransactionsCount>(
        `/transactions/${transaction.id}/similar-count`
      );
      return response.data;
    },
  });

  // Auto-check "apply to similar" if there are similar transactions and suggestions found
  const bestSuggestion = suggestions?.find((s) => s.confidence > 0.5);

  // Derive the effective applyToSimilar value: user override takes precedence;
  // otherwise auto-enable when similar transactions and a high-confidence
  // suggestion are both present. Replaces a useMemo-with-side-effect that the
  // react-hooks rule flagged as a potential infinite-loop source.
  const autoApplyToSimilar = !!(similarCount && similarCount.count > 0 && bestSuggestion);
  const applyToSimilar = userOverrideApplyToSimilar ?? autoApplyToSimilar;

  const classifyMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/transactions/${transaction.id}/classify`, {
        macroCategoryId: selectedMacro?.id,
        categoryId: selectedCategory?.id,
        subCategoryId: selectedSubCategory || null,
        notes: notes || null,
        applyToSimilar,
      });
    },
    onSuccess,
    onError: (err: Error) => {
      setError(err.message || 'Failed to classify transaction');
    },
  });

  // Apply suggestion handler
  const applySuggestion = (suggestion: CategorizationSuggestion) => {
    const macro = categories.find((c) => c.id === suggestion.macroCategoryId);
    if (macro) {
      setSelectedMacro(macro);
      const category = macro.categories.find((c) => c.id === suggestion.categoryId);
      if (category) {
        setSelectedCategory({ id: category.id, name: category.name });
        if (suggestion.subCategoryId) {
          setSelectedSubCategory(suggestion.subCategoryId);
        }
        // Skip directly to sub-category step or stay at category step
        if (category.subCategories.length > 0) {
          setStep('sub');
        }
      }
    }
  };

  const handleMacroSelect = (macro: MacroCategoryWithCategories) => {
    setSelectedMacro(macro);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setStep('category');
  };

  const handleCategorySelect = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    const cat = selectedMacro?.categories.find((c) => c.id === category.id);
    if (cat && cat.subCategories.length > 0) {
      setStep('sub');
    }
  };

  const handleSubmit = () => {
    if (selectedMacro && selectedCategory) {
      classifyMutation.mutate();
    }
  };

  const getMacroColor = (type: number) => {
    switch (type) {
      case MacroCategoryType.Needs:
        return 'border-brand-sage/40 bg-brand-sage-soft hover:bg-brand-sage-soft/80';
      case MacroCategoryType.Wants:
        return 'border-brand-terracotta/40 bg-brand-terracotta-soft hover:bg-brand-terracotta-soft/80';
      case MacroCategoryType.Goals:
        return 'border-brand-accent-ink/30 bg-brand-accent-ink/10 hover:bg-brand-accent-ink/15';
      default:
        return 'border-brand-border bg-brand-cream/60 hover:bg-brand-sage-soft/40';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans-brand animate-fade-in">
      <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_72px_-32px_rgba(31,111,74,0.25)]">
        {/* Header */}
        <div className="p-7 border-b border-brand-border">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                Classify
              </p>
              <h2 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
                {transaction.merchantName || transaction.description}
              </h2>
              <p className="font-display font-medium tabular-lining text-[1.5rem] text-brand-text mt-3">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-brand-text-faint hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb */}
          {selectedMacro && (
            <div className="flex items-center gap-2 mt-5 text-[13px]">
              <button
                onClick={() => {
                  setStep('macro');
                  setSelectedMacro(null);
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
              >
                {selectedMacro.name}
              </button>
              {selectedCategory && (
                <>
                  <span className="text-brand-text-faint">/</span>
                  <button
                    onClick={() => {
                      setStep('category');
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                    }}
                    className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
                  >
                    {selectedCategory.name}
                  </button>
                </>
              )}
              {selectedSubCategory && (
                <>
                  <span className="text-brand-text-faint">/</span>
                  <span className="text-brand-text-muted">
                    {
                      selectedMacro.categories
                        .find((c) => c.id === selectedCategory?.id)
                        ?.subCategories.find((s) => s.id === selectedSubCategory)?.name
                    }
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-7">
          {error && (
            <div className="mb-5 bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{error}</span>
            </div>
          )}

          {/* Suggestion Badge */}
          {step === 'macro' && !suggestionsLoading && bestSuggestion && (
            <button
              onClick={() => applySuggestion(bestSuggestion)}
              className="w-full mb-5 p-4 rounded-2xl border border-brand-terracotta/40 bg-brand-terracotta-soft hover:bg-brand-terracotta-soft/80 text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-brand-terracotta" />
                <span className="text-[14px] font-semibold text-brand-text">
                  Suggested: {bestSuggestion.categoryName}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] px-2 py-0.5 bg-brand-sage-soft text-brand-sage font-semibold rounded-full">
                  {Math.round(bestSuggestion.confidence * 100)}% confident
                </span>
              </div>
              <p className="text-[13px] text-brand-text-muted">
                Based on: "{bestSuggestion.matchedPattern}"
              </p>
              <p className="text-[12px] text-brand-text-faint mt-1 group-hover:underline underline-offset-4">
                Click to apply this suggestion
              </p>
            </button>
          )}

          {step === 'macro' && (
            <div className="space-y-3">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-4">
                Is this a Need, Want, or Goal?
              </p>
              {categories.map((macro) => (
                <button
                  key={macro.id}
                  onClick={() => handleMacroSelect(macro)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${getMacroColor(macro.type)}`}
                >
                  <p className="text-brand-text font-semibold text-[15px]">{macro.name}</p>
                  <p className="text-[13px] text-brand-text-muted mt-1 leading-relaxed">
                    {macro.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 'category' && selectedMacro && (
            <div className="space-y-2">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-4">
                What type of {selectedMacro.name.toLowerCase()}?
              </p>
              {selectedMacro.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                    selectedCategory?.id === category.id
                      ? 'border-brand-sage/60 bg-brand-sage-soft'
                      : 'border-brand-border bg-brand-surface hover:bg-brand-sage-soft/40'
                  }`}
                >
                  <p className="text-brand-text font-semibold text-[15px]">{category.name}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'sub' && selectedMacro && selectedCategory && (
            <div className="space-y-2">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-4">
                Optional: more specific
              </p>
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                  !selectedSubCategory
                    ? 'border-brand-sage/60 bg-brand-sage-soft'
                    : 'border-brand-border bg-brand-surface hover:bg-brand-sage-soft/40'
                }`}
              >
                <p className="text-brand-text font-semibold text-[15px]">
                  Skip (use "{selectedCategory.name}")
                </p>
              </button>
              {selectedMacro.categories
                .find((c) => c.id === selectedCategory.id)
                ?.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                      selectedSubCategory === sub.id
                        ? 'border-brand-sage/60 bg-brand-sage-soft'
                        : 'border-brand-border bg-brand-surface hover:bg-brand-sage-soft/40'
                    }`}
                  >
                    <p className="text-brand-text font-semibold text-[15px]">{sub.name}</p>
                  </button>
                ))}
            </div>
          )}

          {/* Notes */}
          {selectedCategory && (
            <div className="mt-6">
              <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3 text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none resize-none transition-all"
                rows={2}
              />
            </div>
          )}

          {/* Apply to Similar Checkbox */}
          {selectedCategory && similarCount && similarCount.count > 0 && (
            <div className="mt-4 bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToSimilar}
                  onChange={(e) => setUserOverrideApplyToSimilar(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-sage focus:ring-brand-sage focus:ring-offset-0"
                />
                <div>
                  <span className="text-[14px] text-brand-text font-semibold">
                    Apply to similar transactions
                  </span>
                  <p className="text-[12px] text-brand-text-muted mt-0.5 leading-relaxed">
                    {similarCount.count} other unclassified transaction
                    {similarCount.count !== 1 ? 's' : ''} matching "{similarCount.matchPattern}"
                    will also be classified
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-cream/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMacro || !selectedCategory || classifyMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-sage text-white font-semibold text-[13px] shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
          >
            <Check className="w-4 h-4" />
            {classifyMutation.isPending
              ? 'Saving...'
              : applyToSimilar && similarCount && similarCount.count > 0
                ? `Classify ${similarCount.count + 1} Transactions`
                : 'Save Classification'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Transaction Modal Component
function AddTransactionModal({
  accounts,
  categories,
  onClose,
  onSuccess,
}: {
  accounts: Account[];
  categories: MacroCategoryWithCategories[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    accountId: accounts[0]?.id || '',
    amount: '',
    type: TransactionType.Debit as number,
    description: '',
    merchantName: '',
    transactionDate: new Date().toISOString().split('T')[0],
    macroCategoryId: '',
    categoryId: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const selectedMacro = categories.find((c) => c.id === formData.macroCategoryId);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount),
        macroCategoryId: formData.macroCategoryId || null,
        categoryId: formData.categoryId || null,
        notes: formData.notes || null,
        merchantName: formData.merchantName || null,
      });
    },
    onSuccess,
    onError: (err: Error) => {
      setError(err.message || 'Failed to create transaction');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const fieldLabel =
    'block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2';
  const fieldInput =
    'w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3 font-sans-brand text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all';

  return (
    <div className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans-brand animate-fade-in">
      <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_72px_-32px_rgba(31,111,74,0.25)]">
        <div className="p-7 border-b border-brand-border">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                New
              </p>
              <h2 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
                Add transaction
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-brand-text-faint hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-7 space-y-5">
          {error && (
            <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Account</label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                required
                className={fieldInput}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                className={fieldInput}
              >
                <option value={TransactionType.Debit}>Expense (Debit)</option>
                <option value={TransactionType.Credit}>Income (Credit)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Amount (R)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className={`${fieldInput} tabular-lining`}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={fieldLabel}>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className={fieldInput}
              placeholder="What was this for?"
            />
          </div>

          <div>
            <label className={fieldLabel}>Merchant (optional)</label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              className={fieldInput}
              placeholder="e.g., Woolworths"
            />
          </div>

          <div>
            <label className={fieldLabel}>Date</label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              required
              className={fieldInput}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Category</label>
              <select
                value={formData.macroCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, macroCategoryId: e.target.value, categoryId: '' })
                }
                className={fieldInput}
              >
                <option value="">Select category…</option>
                {categories.map((macro) => (
                  <option key={macro.id} value={macro.id}>
                    {macro.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Sub-category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={!selectedMacro}
                className={`${fieldInput} disabled:bg-brand-border/30 disabled:text-brand-text-faint disabled:cursor-not-allowed`}
              >
                <option value="">Select…</option>
                {selectedMacro?.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`${fieldInput} resize-none`}
              rows={2}
              placeholder="Additional notes…"
            />
          </div>
        </form>

        <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-cream/30">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={() => createMutation.mutate()}
            disabled={
              !formData.accountId ||
              !formData.amount ||
              !formData.description ||
              createMutation.isPending
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-sage text-white font-semibold text-[13px] shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? 'Adding…' : 'Add transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk Classification Modal Component
function BulkClassifyModal({
  transactionIds,
  categories,
  onClose,
  onSuccess,
}: {
  transactionIds: string[];
  categories: MacroCategoryWithCategories[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'macro' | 'category' | 'sub'>('macro');
  const [selectedMacro, setSelectedMacro] = useState<MacroCategoryWithCategories | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(
    null
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bulkClassifyMutation = useMutation({
    mutationFn: async () => {
      const classifications = transactionIds.map((transactionId) => ({
        transactionId,
        macroCategoryId: selectedMacro?.id,
        categoryId: selectedCategory?.id,
        subCategoryId: selectedSubCategory || null,
      }));
      const response = await apiClient.post<{
        successCount: number;
        failedCount: number;
        errors: string[];
      }>('/transactions/bulk-classify', { classifications });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.failedCount > 0) {
        setError(
          `${data.successCount} classified, ${data.failedCount} failed: ${data.errors.join(', ')}`
        );
      } else {
        onSuccess();
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to classify transactions');
    },
  });

  const handleMacroSelect = (macro: MacroCategoryWithCategories) => {
    setSelectedMacro(macro);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setStep('category');
  };

  const handleCategorySelect = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    const cat = selectedMacro?.categories.find((c) => c.id === category.id);
    if (cat && cat.subCategories.length > 0) {
      setStep('sub');
    }
  };

  const handleSubmit = () => {
    if (selectedMacro && selectedCategory) {
      bulkClassifyMutation.mutate();
    }
  };

  const getMacroColor = (type: number) => {
    switch (type) {
      case MacroCategoryType.Needs:
        return 'border-brand-sage/40 bg-brand-sage-soft hover:bg-brand-sage-soft/80';
      case MacroCategoryType.Wants:
        return 'border-brand-terracotta/40 bg-brand-terracotta-soft hover:bg-brand-terracotta-soft/80';
      case MacroCategoryType.Goals:
        return 'border-brand-accent-ink/30 bg-brand-accent-ink/10 hover:bg-brand-accent-ink/15';
      default:
        return 'border-brand-border bg-brand-cream/60 hover:bg-brand-sage-soft/40';
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans-brand animate-fade-in">
      <div className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_72px_-32px_rgba(31,111,74,0.25)]">
        {/* Header */}
        <div className="p-7 border-b border-brand-border">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                Bulk classify
              </p>
              <h2 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text">
                {transactionIds.length} transaction{transactionIds.length !== 1 ? 's' : ''} selected
              </h2>
              <p className="text-[13px] text-brand-text-muted mt-2">
                Pick a category to apply to all of them at once.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-brand-text-faint hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb */}
          {selectedMacro && (
            <div className="flex items-center gap-2 mt-5 text-[13px]">
              <button
                onClick={() => {
                  setStep('macro');
                  setSelectedMacro(null);
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
              >
                {selectedMacro.name}
              </button>
              {selectedCategory && (
                <>
                  <span className="text-brand-text-faint">/</span>
                  <button
                    onClick={() => {
                      setStep('category');
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                    }}
                    className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
                  >
                    {selectedCategory.name}
                  </button>
                </>
              )}
              {selectedSubCategory && (
                <>
                  <span className="text-brand-text-faint">/</span>
                  <span className="text-brand-text-muted">
                    {
                      selectedMacro.categories
                        .find((c) => c.id === selectedCategory?.id)
                        ?.subCategories.find((s) => s.id === selectedSubCategory)?.name
                    }
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-7">
          {error && (
            <div className="mb-5 bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{error}</span>
            </div>
          )}
          {step === 'macro' && (
            <div className="space-y-3">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-4">
                Is this a Need, Want, or Goal?
              </p>
              {categories.map((macro) => (
                <button
                  key={macro.id}
                  onClick={() => handleMacroSelect(macro)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${getMacroColor(macro.type)}`}
                >
                  <p className="text-brand-text font-semibold text-[15px]">{macro.name}</p>
                  <p className="text-[13px] text-brand-text-muted mt-1 leading-relaxed">
                    {macro.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 'category' && selectedMacro && (
            <div className="space-y-2">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-4">
                What type of {selectedMacro.name.toLowerCase()}?
              </p>
              {selectedMacro.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                    selectedCategory?.id === category.id
                      ? 'border-brand-sage/60 bg-brand-sage-soft'
                      : 'border-brand-border bg-brand-surface hover:bg-brand-sage-soft/40'
                  }`}
                >
                  <p className="text-brand-text font-semibold text-[15px]">{category.name}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'sub' && selectedMacro && selectedCategory && (
            <div className="space-y-2">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-4">
                Optional: more specific
              </p>
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                  !selectedSubCategory
                    ? 'border-brand-sage/60 bg-brand-sage-soft'
                    : 'border-brand-border bg-brand-surface hover:bg-brand-sage-soft/40'
                }`}
              >
                <p className="text-brand-text font-semibold text-[15px]">
                  Skip (use "{selectedCategory.name}")
                </p>
              </button>
              {selectedMacro.categories
                .find((c) => c.id === selectedCategory.id)
                ?.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                      selectedSubCategory === sub.id
                        ? 'border-brand-sage/60 bg-brand-sage-soft'
                        : 'border-brand-border bg-brand-surface hover:bg-brand-sage-soft/40'
                    }`}
                  >
                    <p className="text-brand-text font-semibold text-[15px]">{sub.name}</p>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-cream/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMacro || !selectedCategory || bulkClassifyMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-sage text-white font-semibold text-[13px] shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
          >
            <Check className="w-4 h-4" />
            {bulkClassifyMutation.isPending
              ? 'Classifying…'
              : `Classify ${transactionIds.length} transaction${transactionIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecurringPatternsPanel() {
  const queryClient = useQueryClient();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['recurring-patterns'],
    queryFn: async () => {
      const response = await apiClient.get<RecurringPatternDetailDto[]>('/transactions/recurring');
      return response.data;
    },
  });

  const detectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/transactions/recurring/detect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-patterns'] });
    },
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
        <div>
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
            Recurring
          </p>
          <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text flex items-center gap-2">
            <Repeat className="w-4 h-4 text-brand-sage" />
            Detected patterns
          </h2>
        </div>
        <button
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
          {detectMutation.isPending ? 'Detecting…' : 'Detect patterns'}
        </button>
      </div>

      {isLoading && <p className="text-[14px] text-brand-text-muted">Loading patterns…</p>}

      {patterns && patterns.length === 0 && (
        <p className="text-[14px] text-brand-text-muted leading-relaxed">
          No recurring patterns detected yet. Click{' '}
          <span className="text-brand-text font-semibold">Detect patterns</span> to analyze your
          transactions.
        </p>
      )}

      {patterns && patterns.length > 0 && (
        <div className="space-y-2">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 bg-brand-cream/40 border border-brand-border rounded-2xl hover:bg-brand-sage-soft/40 p-4 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-brand-text font-semibold text-[14px] truncate">
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 items-center">
                  <span className="bg-brand-sage-soft text-brand-sage text-[10px] uppercase font-semibold tracking-[0.14em] px-2 py-0.5 rounded-full">
                    {p.frequencyLabel}
                  </span>
                  {p.categoryName && (
                    <span className="text-[12px] text-brand-text-muted">{p.categoryName}</span>
                  )}
                  {p.nextExpectedDate && (
                    <span className="text-[12px] text-brand-text-faint">
                      Next:{' '}
                      {new Date(p.nextExpectedDate).toLocaleDateString('en-ZA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-display font-medium tabular-lining text-[17px] text-brand-text shrink-0">
                {formatCurrency(p.averageAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
