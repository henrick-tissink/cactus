import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type Account } from '../types';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  CheckSquare,
  Square,
  ArrowLeft,
} from 'lucide-react';

interface ParsedTransaction {
  tempId: string;
  transactionDate: string;
  description: string;
  amount: number;
  isDebit: boolean;
  merchantName?: string;
  isDuplicate: boolean;
  suggestedMacroCategoryId?: string;
  suggestedCategoryId?: string;
  suggestedSubCategoryId?: string;
  suggestedCategoryName?: string;
  suggestionConfidence?: number;
}

interface ParseResult {
  transactions: ParsedTransaction[];
  duplicateCount: number;
}

interface CommitResult {
  importedCount: number;
  classifiedCount: number;
  totalDebits: number;
  totalCredits: number;
}

type Step = 'upload' | 'preview' | 'done';

const STEPS: Step[] = ['upload', 'preview', 'done'];

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] text-white transition-all bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 bg-brand-surface border border-brand-border text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text px-5 py-2.5 rounded-full font-semibold text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors';

export function ImportTransactionsPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('upload');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await apiClient.get<Account[]>('/accounts');
      return response.data;
    },
  });

  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<ParseResult>(
        `/transactions/import/parse?accountId=${selectedAccountId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setParseResult(data);
      // Select non-duplicates by default
      const nonDuplicates = new Set(
        data.transactions.filter((t) => !t.isDuplicate).map((t) => t.tempId)
      );
      setSelectedIds(nonDuplicates);
      setStep('preview');
      setError(null);
    },
    onError: () => {
      setError('Failed to parse file. Check the format and try again.');
    },
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      const selected = parseResult!.transactions.filter((t) => selectedIds.has(t.tempId));
      const response = await apiClient.post<CommitResult>('/transactions/import/commit', {
        accountId: selectedAccountId,
        transactions: selected.map((t) => ({
          transactionDate: t.transactionDate,
          description: t.description,
          amount: t.amount,
          isDebit: t.isDebit,
          merchantName: t.merchantName,
          macroCategoryId: t.suggestedMacroCategoryId || null,
          categoryId: t.suggestedCategoryId || null,
          subCategoryId: t.suggestedSubCategoryId || null,
        })),
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCommitResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: () => {
      setError('Failed to import transactions.');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedAccountId) {
      setError('Please select an account first');
      return;
    }
    parseMutation.mutate(file);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!parseResult) return;
    if (selectedIds.size === parseResult.transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parseResult.transactions.map((t) => t.tempId)));
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
            Import
          </p>
          <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
            Transactions.
          </h1>
          <p className="text-[14px] text-brand-text-muted leading-relaxed mt-2">
            Bring in your bank statement to get started.
          </p>
        </header>

        {error && (
          <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
            <span className="text-[14px] text-brand-accent-ink">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss"
              className="ml-auto text-brand-accent-ink/60 hover:text-brand-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage rounded-full p-0.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {STEPS.map((s, i) => {
            const isCompleted = currentStepIndex > i;
            const isActive = step === s;
            const stepLabel = s === 'upload' ? 'Upload' : s === 'preview' ? 'Review' : 'Complete';
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-display font-medium tabular-lining transition-colors ${
                    isCompleted
                      ? 'bg-brand-sage text-white'
                      : isActive
                        ? 'bg-brand-sage-soft text-brand-sage ring-2 ring-brand-sage ring-offset-2 ring-offset-brand-cream'
                        : 'bg-brand-border/60 text-brand-text-faint'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${
                    isActive || isCompleted ? 'text-brand-text' : 'text-brand-text-faint'
                  }`}
                >
                  {stepLabel}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-2 ${isCompleted ? 'bg-brand-sage' : 'bg-brand-border'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-7 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <div className="mb-6">
              <label className="block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
                Select account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3 text-[15px] text-brand-text outline-none transition-all"
              >
                <option value="">Choose an account…</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <label
              className={`block border-2 border-dashed border-brand-border rounded-2xl p-10 text-center hover:border-brand-sage/60 hover:bg-brand-sage-soft/30 transition-colors ${selectedAccountId && !parseMutation.isPending ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            >
              <div className="inline-flex p-3 bg-brand-sage-soft rounded-2xl mb-4">
                <Upload className="w-7 h-7 text-brand-sage" />
              </div>
              <p className="font-display font-medium text-[1.125rem] leading-[1.15] tracking-[-0.018em] text-brand-text mb-1">
                Drop your bank statement here
              </p>
              <p className="text-[14px] text-brand-text-muted mb-4">
                Or click to choose a file. CSV, OFX, or QFX.
              </p>
              <span className={`${primaryButtonClass} inline-flex`}>
                <FileText className="w-3.5 h-3.5" />
                Choose file
              </span>
              <input
                type="file"
                accept=".csv,.ofx,.qfx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={!selectedAccountId || parseMutation.isPending}
              />
              {parseMutation.isPending && (
                <p className="text-[13px] text-brand-text-muted mt-4">Parsing file…</p>
              )}
            </label>

            <div className="mt-7 pt-6 border-t border-brand-border">
              <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-3">
                Supported banks
              </p>
              <div className="flex flex-wrap gap-2">
                {['FNB', 'Nedbank', 'Capitec', 'Standard Bank', 'Absa', 'Any OFX'].map((bank) => (
                  <span
                    key={bank}
                    className="bg-brand-cream/50 border border-brand-border rounded-full px-3 py-1 text-[12px] text-brand-text-muted font-semibold"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && parseResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
              <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
                <span className="text-[13px] text-brand-text-muted">
                  <span className="font-display font-medium tabular-lining text-[15px] text-brand-text">
                    {parseResult.transactions.length}
                  </span>{' '}
                  transactions
                </span>
                {parseResult.duplicateCount > 0 && (
                  <span className="text-[13px] text-brand-terracotta">
                    <span className="font-display font-medium tabular-lining text-[15px]">
                      {parseResult.duplicateCount}
                    </span>{' '}
                    possible duplicates
                  </span>
                )}
                <span className="text-[13px] text-brand-sage">
                  <span className="font-display font-medium tabular-lining text-[15px]">
                    {selectedIds.size}
                  </span>{' '}
                  selected
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[13px] text-brand-sage hover:text-brand-accent-ink font-semibold underline-offset-4 hover:underline transition-colors"
                >
                  {selectedIds.size === parseResult.transactions.length
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className={secondaryButtonClass}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => commitMutation.mutate()}
                  disabled={selectedIds.size === 0 || commitMutation.isPending}
                  className={primaryButtonClass}
                >
                  <Check className="w-3.5 h-3.5" />
                  {commitMutation.isPending
                    ? 'Importing…'
                    : `Import ${selectedIds.size} transaction${selectedIds.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-cream/40 border-b border-brand-border">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={toggleAll}
                          aria-label="Toggle all"
                          className="text-brand-sage hover:text-brand-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage rounded p-0.5 transition-colors"
                        >
                          {selectedIds.size === parseResult.transactions.length ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {parseResult.transactions.map((tx) => {
                      const isUnclassified = !tx.suggestedCategoryName;
                      return (
                        <tr
                          key={tx.tempId}
                          className={`${
                            isUnclassified ? 'border-l-2 border-l-brand-terracotta' : ''
                          } ${!selectedIds.has(tx.tempId) ? 'opacity-50' : ''} hover:bg-brand-sage-soft/20 transition-colors`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(tx.tempId)}
                              onChange={() => toggleSelect(tx.tempId)}
                              className="accent-brand-sage w-4 h-4 cursor-pointer"
                              aria-label={`Select ${tx.description}`}
                            />
                          </td>
                          <td className="px-4 py-3 text-[13px] text-brand-text-muted whitespace-nowrap tabular-lining">
                            {formatDate(tx.transactionDate)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[14px] text-brand-text truncate max-w-xs">
                              {tx.description}
                            </p>
                            {tx.merchantName && (
                              <p className="text-[12px] text-brand-text-faint">{tx.merchantName}</p>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right whitespace-nowrap font-display font-medium tabular-lining text-[15px] ${
                              tx.isDebit ? 'text-brand-terracotta' : 'text-brand-sage'
                            }`}
                          >
                            {tx.isDebit ? '−' : '+'}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-3 text-[13px]">
                            {tx.suggestedCategoryName ? (
                              <span className="px-2 py-0.5 bg-brand-sage-soft text-brand-sage rounded-full text-[11px] uppercase tracking-[0.14em] font-semibold">
                                {tx.suggestedCategoryName}
                              </span>
                            ) : (
                              <span className="text-[12px] text-brand-text-faint">
                                Unclassified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[13px]">
                            {tx.isDuplicate && (
                              <span className="px-2 py-0.5 bg-brand-terracotta-soft text-brand-accent-ink rounded-full text-[11px] uppercase tracking-[0.14em] font-semibold">
                                Duplicate?
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && commitResult && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-10 text-center shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
            <div className="w-16 h-16 bg-brand-sage-soft rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-7 h-7 text-brand-sage" />
            </div>
            <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
              Done
            </p>
            <h2 className="font-display font-medium text-[2rem] leading-[1.05] tracking-[-0.018em] text-brand-text mb-6">
              Import complete.
            </h2>
            <div className="space-y-1.5 mb-7 text-[14px] text-brand-text-muted">
              <p>
                <span className="font-display font-medium tabular-lining text-[17px] text-brand-text">
                  {commitResult.importedCount}
                </span>{' '}
                transactions imported
              </p>
              <p>
                <span className="font-display font-medium tabular-lining text-[17px] text-brand-text">
                  {commitResult.classifiedCount}
                </span>{' '}
                auto-classified
              </p>
              {commitResult.totalDebits > 0 && (
                <p className="text-brand-terracotta">
                  Total debits:{' '}
                  <span className="font-display font-medium tabular-lining text-[15px]">
                    {formatCurrency(commitResult.totalDebits)}
                  </span>
                </p>
              )}
              {commitResult.totalCredits > 0 && (
                <p className="text-brand-sage">
                  Total credits:{' '}
                  <span className="font-display font-medium tabular-lining text-[15px]">
                    {formatCurrency(commitResult.totalCredits)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setParseResult(null);
                  setCommitResult(null);
                  setSelectedIds(new Set());
                }}
                className={secondaryButtonClass}
              >
                Import another
              </button>
              <Link to="/transactions" className={primaryButtonClass}>
                View transactions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
