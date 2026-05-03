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
  ArrowRight,
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

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Transactions</h1>
      <p className="text-gray-500 mb-6">
        Import your bank statement to get started
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-green-600 text-white'
                  : ['upload', 'preview', 'done'].indexOf(step) > i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {['upload', 'preview', 'done'].indexOf(step) > i ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm ${step === s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
            >
              {s === 'upload' ? 'Upload' : s === 'preview' ? 'Review' : 'Complete'}
            </span>
            {i < 2 && <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose an account...</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drop your bank statement here, or click to browse
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Supported formats: CSV, OFX, QFX
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
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
              <p className="text-sm text-gray-500 mt-4">Parsing file...</p>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Supported Banks</h3>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="px-2 py-1 bg-white rounded border">FNB</span>
              <span className="px-2 py-1 bg-white rounded border">Nedbank</span>
              <span className="px-2 py-1 bg-white rounded border">Capitec</span>
              <span className="px-2 py-1 bg-white rounded border">Standard Bank</span>
              <span className="px-2 py-1 bg-white rounded border">Absa</span>
              <span className="px-2 py-1 bg-white rounded border">Any OFX</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && parseResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">{parseResult.transactions.length}</span>{' '}
                transactions found
              </span>
              {parseResult.duplicateCount > 0 && (
                <span className="text-amber-600">
                  <span className="font-medium">{parseResult.duplicateCount}</span> possible duplicates
                </span>
              )}
              <span className="text-green-600">
                <span className="font-medium">{selectedIds.size}</span> selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => commitMutation.mutate()}
                disabled={selectedIds.size === 0 || commitMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {commitMutation.isPending
                  ? 'Importing...'
                  : `Import ${selectedIds.size} Transactions`}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.size === parseResult.transactions.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parseResult.transactions.map((tx) => (
                  <tr
                    key={tx.tempId}
                    className={`${tx.isDuplicate ? 'bg-amber-50/50' : ''} ${
                      !selectedIds.has(tx.tempId) ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(tx.tempId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedIds.has(tx.tempId) ? (
                          <CheckSquare className="w-4 h-4 text-green-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 truncate max-w-xs">{tx.description}</p>
                      {tx.merchantName && (
                        <p className="text-xs text-gray-400">{tx.merchantName}</p>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium font-mono-financial text-right whitespace-nowrap ${
                        tx.isDebit ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {tx.isDebit ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.suggestedCategoryName ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          {tx.suggestedCategoryName}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unclassified</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.isDuplicate && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                          Duplicate?
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && commitResult && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Complete!</h2>
          <div className="text-gray-600 space-y-1 mb-6">
            <p>{commitResult.importedCount} transactions imported</p>
            <p>{commitResult.classifiedCount} auto-classified</p>
            {commitResult.totalDebits > 0 && (
              <p className="text-red-600">Total debits: <span className="font-mono-financial">{formatCurrency(commitResult.totalDebits)}</span></p>
            )}
            {commitResult.totalCredits > 0 && (
              <p className="text-green-600">
                Total credits: <span className="font-mono-financial">{formatCurrency(commitResult.totalCredits)}</span>
              </p>
            )}
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setStep('upload');
                setParseResult(null);
                setCommitResult(null);
                setSelectedIds(new Set());
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Import Another
            </button>
            <Link
              to="/transactions"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Transactions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
