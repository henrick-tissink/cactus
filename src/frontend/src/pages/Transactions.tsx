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
        return 'bg-cactus-needs-bg text-cactus-charcoal';
      case MacroCategoryType.Wants:
        return 'bg-cactus-wants-bg text-cactus-charcoal';
      case MacroCategoryType.Goals:
        return 'bg-cactus-goals-bg text-cactus-charcoal';
      default:
        return 'bg-cactus-overlay text-cactus-charcoal/60';
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

  return (
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl">Transactions</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRecurring(!showRecurring)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-cactus font-semibold ${
              showRecurring
                ? 'bg-cactus-sage-light text-cactus-charcoal border-cactus-sage'
                : 'bg-white text-cactus-charcoal border-cactus-overlay hover:bg-cactus-sage-light/40'
            }`}
          >
            <Repeat className="w-4 h-4" />
            Recurring
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-cactus font-semibold ${
              showFilters
                ? 'bg-cactus-sage-light text-cactus-charcoal border-cactus-sage'
                : 'bg-white text-cactus-charcoal border-cactus-overlay hover:bg-cactus-sage-light/40'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => {
              setBulkClassifyMode(!bulkClassifyMode);
              if (bulkClassifyMode) {
                clearSelection();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-cactus font-semibold ${
              bulkClassifyMode
                ? 'bg-cactus-sage-light text-cactus-charcoal border-cactus-sage'
                : 'bg-white text-cactus-charcoal border-cactus-overlay hover:bg-cactus-sage-light/40'
            }`}
          >
            <Tag className="w-4 h-4" />
            Bulk Classify
          </button>
          <Link
            to="/import"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 font-cactus font-semibold"
          >
            <Upload className="w-4 h-4" />
            Import Statement
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cactus-sage text-white font-cactus font-bold shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Recurring Patterns Panel */}
      {showRecurring && <RecurringPatternsPanel />}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Account
              </label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none bg-white"
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
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Status
              </label>
              <select
                value={filters.isClassified}
                onChange={(e) => setFilters({ ...filters, isClassified: e.target.value })}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none bg-white"
              >
                <option value="">All</option>
                <option value="true">Classified</option>
                <option value="false">Unclassified</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={clearFilters}
              className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-4 py-2 rounded-xl font-cactus font-semibold"
            >
              Clear
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-xl bg-cactus-sage text-white font-cactus font-bold shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedTransactionIds.size > 0 && (
        <div className="bg-cactus-sage-light border border-cactus-sage rounded-2xl p-4 mb-6 flex items-center justify-between">
          <span className="text-cactus-charcoal font-cactus font-semibold">
            {selectedTransactionIds.size} transaction{selectedTransactionIds.size !== 1 ? 's' : ''}{' '}
            selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={clearSelection}
              className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-4 py-2 rounded-xl font-cactus font-semibold"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkClassifyModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cactus-sage text-white font-cactus font-bold shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90"
            >
              <Tag className="w-4 h-4" />
              Classify Selected
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white border border-cactus-overlay rounded-2xl">
        {isLoading ? (
          <div className="p-8 text-center text-cactus-charcoal/60 font-cactus">
            Loading transactions...
          </div>
        ) : transactionsData?.items.length === 0 ? (
          <div className="p-8 text-center font-cactus">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-cactus-charcoal/40" />
            <p className="text-cactus-charcoal/60">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Select All Header - only in bulk classify mode */}
            {bulkClassifyMode && unclassifiedTransactions.length > 0 && (
              <div className="px-4 py-3 border-b border-cactus-overlay bg-cactus-sandstone">
                <button
                  onClick={toggleSelectAllUnclassified}
                  className="flex items-center gap-2 text-sm font-cactus font-semibold text-cactus-charcoal hover:text-cactus-charcoal"
                >
                  {allUnclassifiedSelected ? (
                    <CheckSquare className="w-5 h-5 text-cactus-sage" />
                  ) : someUnclassifiedSelected ? (
                    <Minus className="w-5 h-5 text-cactus-sage" />
                  ) : (
                    <Square className="w-5 h-5 text-cactus-charcoal/40" />
                  )}
                  Select all unclassified ({unclassifiedTransactions.length})
                </button>
              </div>
            )}
            <div className="divide-y divide-cactus-overlay">
              {transactionsData?.items.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`py-2.5 px-4 hover:bg-cactus-sage-light/30 transition-colors ${
                    selectedTransactionIds.has(transaction.id) ? 'bg-cactus-sage-light' : ''
                  } ${!transaction.isClassified ? 'border-l-2 border-cactus-prickly' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Checkbox - only in bulk classify mode */}
                      {bulkClassifyMode && (
                        <button
                          onClick={() => toggleTransactionSelection(transaction.id)}
                          className="shrink-0"
                        >
                          {selectedTransactionIds.has(transaction.id) ? (
                            <CheckSquare className="w-5 h-5 text-cactus-sage" />
                          ) : (
                            <Square className="w-5 h-5 text-cactus-charcoal/40 hover:text-cactus-charcoal/60" />
                          )}
                        </button>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-cactus-charcoal font-cactus font-semibold">
                            {transaction.merchantName || transaction.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-cactus-charcoal/60 font-cactus">
                            {formatDate(transaction.transactionDate)}
                          </span>
                          <span className="text-sm text-cactus-charcoal/40">-</span>
                          <span className="text-sm text-cactus-charcoal/60 font-cactus">
                            {transaction.accountName}
                          </span>
                          {transaction.isClassified && transaction.macroCategoryName && (
                            <>
                              <span className="text-sm text-cactus-charcoal/40">-</span>
                              <span
                                className={`font-cactus font-semibold text-xs px-2 py-0.5 rounded-full ${getMacroCategoryColor(
                                  categories?.find((c) => c.id === transaction.macroCategoryId)
                                    ?.type
                                )}`}
                              >
                                {transaction.macroCategoryName}
                              </span>
                              {transaction.categoryName && (
                                <span className="text-sm text-cactus-charcoal/60 font-cactus">
                                  {transaction.categoryName}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-cactus font-bold tabular-nums ${
                          transaction.type === TransactionType.Credit
                            ? 'text-cactus-sage'
                            : 'text-cactus-prickly'
                        }`}
                      >
                        {transaction.type === TransactionType.Credit ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <button
                        onClick={() => openClassifyModal(transaction)}
                        className={`p-2 rounded-xl ${
                          transaction.isClassified
                            ? 'text-cactus-charcoal/40 hover:text-cactus-charcoal hover:bg-cactus-sage-light/40'
                            : 'text-cactus-sage hover:bg-cactus-sage-light'
                        }`}
                        title={transaction.isClassified ? 'Reclassify' : 'Classify'}
                      >
                        <Tag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {transactionsData && transactionsData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-cactus-overlay">
                <p className="text-sm text-cactus-charcoal/60 font-cactus">
                  Page {transactionsData.page} of {transactionsData.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 disabled:opacity-40 disabled:cursor-not-allowed font-cactus font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === transactionsData.totalPages}
                    className="p-2 rounded-xl bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 disabled:opacity-40 disabled:cursor-not-allowed font-cactus font-semibold"
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
        return 'border-cactus-sage bg-cactus-needs-bg hover:bg-cactus-needs-bg/80';
      case MacroCategoryType.Wants:
        return 'border-cactus-desert bg-cactus-wants-bg hover:bg-cactus-wants-bg/80';
      case MacroCategoryType.Goals:
        return 'border-cactus-prickly bg-cactus-goals-bg hover:bg-cactus-goals-bg/80';
      default:
        return 'border-cactus-overlay bg-cactus-sandstone hover:bg-cactus-sage-light/40';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-cactus-charcoal/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-cactus-overlay rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cactus-overlay">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg text-cactus-charcoal font-cactus font-bold">
                Classify Transaction
              </h2>
              <p className="text-sm text-cactus-charcoal/60 font-cactus mt-1">
                {transaction.merchantName || transaction.description}
              </p>
              <p className="text-lg text-cactus-charcoal font-cactus font-bold tabular-nums mt-2">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-cactus-charcoal/40 hover:text-cactus-charcoal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb */}
          {selectedMacro && (
            <div className="flex items-center gap-2 mt-4 text-sm font-cactus">
              <button
                onClick={() => {
                  setStep('macro');
                  setSelectedMacro(null);
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                className="text-cactus-sage font-semibold hover:underline"
              >
                {selectedMacro.name}
              </button>
              {selectedCategory && (
                <>
                  <span className="text-cactus-charcoal/40">/</span>
                  <button
                    onClick={() => {
                      setStep('category');
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                    }}
                    className="text-cactus-sage font-semibold hover:underline"
                  >
                    {selectedCategory.name}
                  </button>
                </>
              )}
              {selectedSubCategory && (
                <>
                  <span className="text-cactus-charcoal/40">/</span>
                  <span className="text-cactus-charcoal/60">
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
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-cactus-goals-bg border border-cactus-prickly rounded-xl flex items-center gap-2 text-cactus-charcoal font-cactus">
              <AlertCircle className="w-4 h-4 shrink-0 text-cactus-prickly" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Suggestion Badge */}
          {step === 'macro' && !suggestionsLoading && bestSuggestion && (
            <button
              onClick={() => applySuggestion(bestSuggestion)}
              className="w-full mb-4 p-4 rounded-xl border-2 border-cactus-desert bg-cactus-wants-bg hover:bg-cactus-wants-bg/70 text-left transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-cactus-desert" />
                <span className="text-sm font-cactus font-semibold text-cactus-charcoal">
                  Suggested: {bestSuggestion.categoryName}
                </span>
                <span className="text-xs px-2 py-0.5 bg-cactus-sage-light text-cactus-sage border border-cactus-overlay font-cactus font-semibold rounded-full">
                  {Math.round(bestSuggestion.confidence * 100)}% confident
                </span>
              </div>
              <p className="text-sm text-cactus-charcoal/60 font-cactus">
                Based on: "{bestSuggestion.matchedPattern}"
              </p>
              <p className="text-xs text-cactus-charcoal/60 font-cactus mt-1 group-hover:underline">
                Click to apply this suggestion
              </p>
            </button>
          )}

          {step === 'macro' && (
            <div className="space-y-3">
              <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">
                Is this a Need, Want, or Goal?
              </p>
              {categories.map((macro) => (
                <button
                  key={macro.id}
                  onClick={() => handleMacroSelect(macro)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getMacroColor(macro.type)}`}
                >
                  <p className="text-cactus-charcoal font-cactus font-semibold">{macro.name}</p>
                  <p className="text-sm text-cactus-charcoal/60 font-cactus mt-1">
                    {macro.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 'category' && selectedMacro && (
            <div className="space-y-2">
              <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">
                What type of {selectedMacro.name.toLowerCase()}?
              </p>
              {selectedMacro.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedCategory?.id === category.id
                      ? 'border-cactus-sage bg-cactus-sage-light'
                      : 'border-cactus-overlay bg-white hover:bg-cactus-sage-light/30'
                  }`}
                >
                  <p className="text-cactus-charcoal font-cactus font-semibold">{category.name}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'sub' && selectedMacro && selectedCategory && (
            <div className="space-y-2">
              <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">
                Optional: More specific category
              </p>
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  !selectedSubCategory
                    ? 'border-cactus-sage bg-cactus-sage-light'
                    : 'border-cactus-overlay bg-white hover:bg-cactus-sage-light/30'
                }`}
              >
                <p className="text-cactus-charcoal font-cactus font-semibold">
                  Skip (use "{selectedCategory.name}")
                </p>
              </button>
              {selectedMacro.categories
                .find((c) => c.id === selectedCategory.id)
                ?.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedSubCategory === sub.id
                        ? 'border-cactus-sage bg-cactus-sage-light'
                        : 'border-cactus-overlay bg-white hover:bg-cactus-sage-light/30'
                    }`}
                  >
                    <p className="text-cactus-charcoal font-cactus font-semibold">{sub.name}</p>
                  </button>
                ))}
            </div>
          )}

          {/* Notes */}
          {selectedCategory && (
            <div className="mt-6">
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Apply to Similar Checkbox */}
          {selectedCategory && similarCount && similarCount.count > 0 && (
            <div className="mt-4 p-3 bg-cactus-sage-light border border-cactus-sage rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToSimilar}
                  onChange={(e) => setUserOverrideApplyToSimilar(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-cactus-overlay text-cactus-sage focus:ring-cactus-sage"
                />
                <div>
                  <span className="text-sm text-cactus-charcoal font-cactus font-semibold">
                    Apply to similar transactions
                  </span>
                  <p className="text-xs text-cactus-charcoal/60 font-cactus mt-0.5">
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
        <div className="p-6 border-t border-cactus-overlay flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-4 py-2 rounded-xl font-cactus font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMacro || !selectedCategory || classifyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cactus-sage text-white font-cactus font-bold shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
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

  return (
    <div className="fixed inset-0 bg-cactus-charcoal/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-cactus-overlay rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-cactus-overlay">
          <div className="flex justify-between items-center">
            <h2 className="text-lg text-cactus-charcoal font-cactus font-bold">Add Transaction</h2>
            <button
              onClick={onClose}
              className="text-cactus-charcoal/40 hover:text-cactus-charcoal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-cactus-goals-bg border border-cactus-prickly rounded-xl flex items-center gap-2 text-cactus-charcoal font-cactus">
              <AlertCircle className="w-4 h-4 shrink-0 text-cactus-prickly" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Account
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                required
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none bg-white"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none bg-white"
              >
                <option value={TransactionType.Debit}>Expense (Debit)</option>
                <option value={TransactionType.Credit}>Income (Credit)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
              Amount (R)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              placeholder="What was this for?"
            />
          </div>

          <div>
            <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
              Merchant (optional)
            </label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
              placeholder="e.g., Woolworths"
            />
          </div>

          <div>
            <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              required
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Category
              </label>
              <select
                value={formData.macroCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, macroCategoryId: e.target.value, categoryId: '' })
                }
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none bg-white"
              >
                <option value="">Select category...</option>
                {categories.map((macro) => (
                  <option key={macro.id} value={macro.id}>
                    {macro.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
                Sub-category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={!selectedMacro}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none bg-white disabled:bg-cactus-sandstone disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                {selectedMacro?.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-cactus font-semibold text-cactus-charcoal mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none resize-none"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-cactus-overlay flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-4 py-2 rounded-xl font-cactus font-semibold"
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cactus-sage text-white font-cactus font-bold shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? 'Adding...' : 'Add Transaction'}
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
        return 'border-cactus-sage bg-cactus-needs-bg hover:bg-cactus-needs-bg/80';
      case MacroCategoryType.Wants:
        return 'border-cactus-desert bg-cactus-wants-bg hover:bg-cactus-wants-bg/80';
      case MacroCategoryType.Goals:
        return 'border-cactus-prickly bg-cactus-goals-bg hover:bg-cactus-goals-bg/80';
      default:
        return 'border-cactus-overlay bg-cactus-sandstone hover:bg-cactus-sage-light/40';
    }
  };

  return (
    <div className="fixed inset-0 bg-cactus-charcoal/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-cactus-overlay rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cactus-overlay">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg text-cactus-charcoal font-cactus font-bold">
                Bulk Classification
              </h2>
              <p className="text-sm text-cactus-charcoal/60 font-cactus mt-1">
                Classifying{' '}
                <span className="inline-block bg-cactus-sage-light text-cactus-sage border border-cactus-overlay text-xs font-cactus font-semibold px-2 py-0.5 rounded-full align-middle">
                  {transactionIds.length}
                </span>{' '}
                transaction{transactionIds.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-cactus-charcoal/40 hover:text-cactus-charcoal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb */}
          {selectedMacro && (
            <div className="flex items-center gap-2 mt-4 text-sm font-cactus">
              <button
                onClick={() => {
                  setStep('macro');
                  setSelectedMacro(null);
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                className="text-cactus-sage font-semibold hover:underline"
              >
                {selectedMacro.name}
              </button>
              {selectedCategory && (
                <>
                  <span className="text-cactus-charcoal/40">/</span>
                  <button
                    onClick={() => {
                      setStep('category');
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                    }}
                    className="text-cactus-sage font-semibold hover:underline"
                  >
                    {selectedCategory.name}
                  </button>
                </>
              )}
              {selectedSubCategory && (
                <>
                  <span className="text-cactus-charcoal/40">/</span>
                  <span className="text-cactus-charcoal/60">
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
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-cactus-goals-bg border border-cactus-prickly rounded-xl flex items-center gap-2 text-cactus-charcoal font-cactus">
              <AlertCircle className="w-4 h-4 shrink-0 text-cactus-prickly" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {step === 'macro' && (
            <div className="space-y-3">
              <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">
                Is this a Need, Want, or Goal?
              </p>
              {categories.map((macro) => (
                <button
                  key={macro.id}
                  onClick={() => handleMacroSelect(macro)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getMacroColor(macro.type)}`}
                >
                  <p className="text-cactus-charcoal font-cactus font-semibold">{macro.name}</p>
                  <p className="text-sm text-cactus-charcoal/60 font-cactus mt-1">
                    {macro.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 'category' && selectedMacro && (
            <div className="space-y-2">
              <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">
                What type of {selectedMacro.name.toLowerCase()}?
              </p>
              {selectedMacro.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedCategory?.id === category.id
                      ? 'border-cactus-sage bg-cactus-sage-light'
                      : 'border-cactus-overlay bg-white hover:bg-cactus-sage-light/30'
                  }`}
                >
                  <p className="text-cactus-charcoal font-cactus font-semibold">{category.name}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'sub' && selectedMacro && selectedCategory && (
            <div className="space-y-2">
              <p className="text-sm text-cactus-charcoal/60 font-cactus mb-4">
                Optional: More specific category
              </p>
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  !selectedSubCategory
                    ? 'border-cactus-sage bg-cactus-sage-light'
                    : 'border-cactus-overlay bg-white hover:bg-cactus-sage-light/30'
                }`}
              >
                <p className="text-cactus-charcoal font-cactus font-semibold">
                  Skip (use "{selectedCategory.name}")
                </p>
              </button>
              {selectedMacro.categories
                .find((c) => c.id === selectedCategory.id)
                ?.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedSubCategory === sub.id
                        ? 'border-cactus-sage bg-cactus-sage-light'
                        : 'border-cactus-overlay bg-white hover:bg-cactus-sage-light/30'
                    }`}
                  >
                    <p className="text-cactus-charcoal font-cactus font-semibold">{sub.name}</p>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cactus-overlay flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-4 py-2 rounded-xl font-cactus font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMacro || !selectedCategory || bulkClassifyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cactus-sage text-white font-cactus font-bold shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {bulkClassifyMutation.isPending
              ? 'Classifying...'
              : `Classify ${transactionIds.length} Transaction${transactionIds.length !== 1 ? 's' : ''}`}
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
    <div className="bg-white border border-cactus-overlay rounded-2xl p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-cactus-sage" />
          <h2 className="text-cactus-charcoal font-cactus font-bold">Recurring Patterns</h2>
        </div>
        <button
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 rounded-xl font-cactus font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
          {detectMutation.isPending ? 'Detecting...' : 'Detect Patterns'}
        </button>
      </div>

      {isLoading && (
        <p className="text-sm text-cactus-charcoal/60 font-cactus">Loading patterns...</p>
      )}

      {patterns && patterns.length === 0 && (
        <p className="text-sm text-cactus-charcoal/60 font-cactus">
          No recurring patterns detected yet. Click "Detect Patterns" to analyze your transactions.
        </p>
      )}

      {patterns && patterns.length > 0 && (
        <div className="space-y-2">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-white border border-cactus-overlay rounded-xl hover:bg-cactus-sage-light/30 p-4"
            >
              <div>
                <p className="text-cactus-charcoal font-cactus font-semibold">{p.description}</p>
                <div className="flex gap-3 mt-1 items-center">
                  <span className="bg-cactus-sage text-white text-[10px] uppercase font-cactus font-bold tracking-wide px-2 py-0.5 rounded-full">
                    {p.frequencyLabel}
                  </span>
                  {p.categoryName && (
                    <span className="text-xs text-cactus-charcoal/60 font-cactus">
                      {p.categoryName}
                    </span>
                  )}
                  {p.nextExpectedDate && (
                    <span className="text-xs text-cactus-charcoal/40 font-cactus">
                      Next:{' '}
                      {new Date(p.nextExpectedDate).toLocaleDateString('en-ZA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-cactus-charcoal font-cactus font-bold tabular-nums">
                {formatCurrency(p.averageAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
