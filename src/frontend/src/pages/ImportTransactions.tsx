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
  'inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-6 py-4 rounded-2xl font-cactus font-bold transition-colors';

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
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl mb-2">
          Import Transactions
        </h1>
        <p className="font-cactus text-cactus-charcoal/60 mb-6">
          Import your bank statement to get started
        </p>

        {error && (
          <div className="bg-cactus-goals-bg border border-cactus-overlay rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-cactus-prickly shrink-0" />
            <span className="font-cactus text-sm text-cactus-charcoal">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-cactus-charcoal/40 hover:text-cactus-charcoal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const isCompleted = currentStepIndex > i;
            const isActive = step === s;
            const stepLabel = s === 'upload' ? 'Upload' : s === 'preview' ? 'Review' : 'Complete';
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-cactus font-bold ${
                    isCompleted
                      ? 'bg-cactus-sage text-white'
                      : isActive
                        ? 'bg-cactus-sage-light text-cactus-sage border-2 border-cactus-sage'
                        : 'bg-cactus-overlay text-cactus-charcoal/40'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-sm font-cactus font-semibold ${
                    isActive || isCompleted ? 'text-cactus-charcoal' : 'text-cactus-charcoal/40'
                  }`}
                >
                  {stepLabel}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-2 ${
                      isCompleted ? 'bg-cactus-sage' : 'bg-cactus-overlay'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white border border-cactus-overlay rounded-2xl p-8">
            <div className="mb-6">
              <label className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5">
                Select Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none transition-colors bg-white"
              >
                <option value="">Choose an account...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-cactus-overlay rounded-2xl p-8 text-center hover:border-cactus-sage hover:bg-cactus-sage-light/30 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-cactus-charcoal/40 mx-auto mb-4" />
              <p className="font-cactus text-cactus-charcoal mb-2">
                Drag and drop your bank statement here, or click to select a file
              </p>
              <p className="font-cactus text-sm text-cactus-charcoal/60 mb-4">
                Supported formats: CSV, OFX, QFX
              </p>
              <label className={`${primaryButtonClass} cursor-pointer`}>
                <FileText className="w-4 h-4" />
                Choose File
                <input
                  type="file"
                  accept=".csv,.ofx,.qfx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={!selectedAccountId || parseMutation.isPending}
                />
              </label>
              {parseMutation.isPending && (
                <p className="font-cactus text-sm text-cactus-charcoal/60 mt-4">Parsing file...</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-cactus font-semibold text-sm text-cactus-charcoal mb-2">
                Supported Banks
              </h3>
              <div className="flex flex-wrap gap-2">
                {['FNB', 'Nedbank', 'Capitec', 'Standard Bank', 'Absa', 'Any OFX'].map((bank) => (
                  <span
                    key={bank}
                    className="bg-white border border-cactus-overlay rounded-xl px-3 py-1.5 font-cactus text-cactus-charcoal text-sm"
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
            <div className="bg-white border border-cactus-overlay rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-6 text-sm font-cactus">
                <span className="text-cactus-charcoal/60">
                  <span className="font-bold text-cactus-charcoal tabular-nums">
                    {parseResult.transactions.length}
                  </span>{' '}
                  transactions found
                </span>
                {parseResult.duplicateCount > 0 && (
                  <span className="text-cactus-prickly">
                    <span className="font-bold tabular-nums">{parseResult.duplicateCount}</span>{' '}
                    possible duplicates
                  </span>
                )}
                <span className="text-cactus-sage">
                  <span className="font-bold tabular-nums">{selectedIds.size}</span> selected
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-cactus-sage font-cactus font-semibold hover:brightness-95"
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
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => commitMutation.mutate()}
                  disabled={selectedIds.size === 0 || commitMutation.isPending}
                  className={primaryButtonClass}
                >
                  <Check className="w-4 h-4" />
                  {commitMutation.isPending
                    ? 'Importing...'
                    : `Import ${selectedIds.size} Transactions`}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-cactus-overlay rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-cactus-overlay">
                  <tr className="bg-cactus-sage-light/30">
                    <th className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="text-cactus-sage hover:brightness-95"
                      >
                        {selectedIds.size === parseResult.transactions.length ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-cactus font-semibold text-cactus-charcoal/60 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-cactus font-semibold text-cactus-charcoal/60 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-cactus font-semibold text-cactus-charcoal/60 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-cactus font-semibold text-cactus-charcoal/60 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-cactus font-semibold text-cactus-charcoal/60 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cactus-overlay">
                  {parseResult.transactions.map((tx) => {
                    const isUnclassified = !tx.suggestedCategoryName;
                    return (
                      <tr
                        key={tx.tempId}
                        className={`${
                          isUnclassified ? 'border-l-2 border-l-cactus-prickly' : ''
                        } ${!selectedIds.has(tx.tempId) ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(tx.tempId)}
                            onChange={() => toggleSelect(tx.tempId)}
                            className="accent-cactus-sage w-4 h-4 cursor-pointer"
                            aria-label={`Select ${tx.description}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-cactus text-cactus-charcoal/60 whitespace-nowrap tabular-nums">
                          {formatDate(tx.transactionDate)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-cactus text-cactus-charcoal truncate max-w-xs">
                            {tx.description}
                          </p>
                          {tx.merchantName && (
                            <p className="text-xs font-cactus text-cactus-charcoal/40">
                              {tx.merchantName}
                            </p>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-cactus font-bold tabular-nums text-right whitespace-nowrap ${
                            tx.isDebit ? 'text-cactus-prickly' : 'text-cactus-sage'
                          }`}
                        >
                          {tx.isDebit ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {tx.suggestedCategoryName ? (
                            <span className="px-2 py-1 bg-cactus-sage-light text-cactus-charcoal rounded-xl text-xs font-cactus font-semibold">
                              {tx.suggestedCategoryName}
                            </span>
                          ) : (
                            <span className="text-cactus-charcoal/40 text-xs font-cactus">
                              Unclassified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {tx.isDuplicate && (
                            <span className="px-2 py-1 bg-cactus-goals-bg text-cactus-charcoal rounded-xl text-xs font-cactus font-semibold">
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
        )}

        {/* Step 3: Done */}
        {step === 'done' && commitResult && (
          <div className="bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-white border border-cactus-overlay rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-cactus-sage" />
            </div>
            <h2 className="text-cactus-charcoal font-cactus font-bold text-xl mb-2">
              Import Complete!
            </h2>
            <div className="font-cactus text-cactus-charcoal space-y-1 mb-6">
              <p>
                <span className="font-bold tabular-nums">{commitResult.importedCount}</span>{' '}
                transactions imported
              </p>
              <p>
                <span className="font-bold tabular-nums">{commitResult.classifiedCount}</span>{' '}
                auto-classified
              </p>
              {commitResult.totalDebits > 0 && (
                <p className="text-cactus-prickly">
                  Total debits:{' '}
                  <span className="font-cactus font-bold tabular-nums">
                    {formatCurrency(commitResult.totalDebits)}
                  </span>
                </p>
              )}
              {commitResult.totalCredits > 0 && (
                <p className="text-cactus-sage">
                  Total credits:{' '}
                  <span className="font-cactus font-bold tabular-nums">
                    {formatCurrency(commitResult.totalCredits)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setParseResult(null);
                  setCommitResult(null);
                  setSelectedIds(new Set());
                }}
                className="text-cactus-sage font-cactus font-semibold hover:brightness-95"
              >
                Import Another
              </button>
              <Link
                to="/transactions"
                className="text-cactus-sage font-cactus font-semibold hover:brightness-95"
              >
                View Transactions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
