import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, AlertCircle, Plus, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { CactusLogo } from '../components/brand/CactusLogo';

interface SaveResponsePayload {
  stepNumber: number;
  stepName: string;
  response: string;
}

interface DebtEntry {
  id: string;
  type: string;
  name: string;
  balance: string;
}

const DEBT_TYPES = [
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Personal Loan', label: 'Personal Loan' },
  { value: 'Overdraft', label: 'Overdraft' },
  { value: 'Buy-now-pay-later', label: 'Buy Now, Pay Later' },
];

const steps = [
  {
    id: 1,
    name: 'Financial Priority',
    question: "What's most important to you right now?",
    options: [
      { value: 'debt', label: 'Getting out of debt', icon: '💳' },
      { value: 'saving', label: 'Building savings', icon: '🏦' },
      { value: 'spending', label: 'Understanding where my money goes', icon: '🔍' },
      { value: 'growing', label: 'Growing my wealth', icon: '📈' },
    ],
  },
  {
    id: 2,
    name: 'Month-End Status',
    question: 'How do you typically feel at the end of the month?',
    options: [
      { value: 'comfortable', label: 'Comfortable - I have money left over', icon: '😊' },
      { value: 'tight', label: "It's tight, but I make it work", icon: '😐' },
      { value: 'stressed', label: "Stressed - I'm often short", icon: '😰' },
      { value: 'varies', label: 'It varies month to month', icon: '🎲' },
    ],
  },
  {
    id: 3,
    name: 'Money Management',
    question: 'How do you currently track your spending?',
    options: [
      { value: 'spreadsheet', label: 'Spreadsheet', icon: '📊' },
      { value: 'app', label: 'Another app', icon: '📱' },
      { value: 'mental', label: 'In my head', icon: '🧠' },
      { value: 'none', label: "I don't track it", icon: '🤷' },
    ],
  },
  {
    id: 4,
    name: 'Tracking Preference',
    question: 'How detailed do you want your budgeting to be?',
    options: [
      { value: 'simple', label: 'Keep it simple - just the basics', icon: '🎯' },
      { value: 'moderate', label: 'Moderate - some categories', icon: '📁' },
      { value: 'detailed', label: 'Detailed - track everything', icon: '🔬' },
    ],
  },
  {
    id: 5,
    name: 'Monthly Income',
    question: "What's your monthly after-tax income?",
    type: 'input',
    inputType: 'currency',
  },
  {
    id: 6,
    name: 'Allocation Estimate',
    question: 'How do you think you currently split your spending?',
    type: 'sliders',
    description: 'Drag the sliders to estimate your current split between Needs, Wants, and Goals.',
  },
  {
    id: 7,
    name: 'High-Interest Debts',
    question: 'Do you have any high-interest debts?',
    description: 'Credit cards, personal loans, store accounts, etc.',
    type: 'debts',
  },
  {
    id: 8,
    name: 'Emergency Savings',
    question: 'How much do you have saved for emergencies?',
    options: [
      { value: 'none', label: 'Nothing yet', icon: '🌱' },
      { value: 'some', label: 'Less than 1 month expenses', icon: '💰' },
      { value: 'good', label: '1-3 months expenses', icon: '💎' },
      { value: 'excellent', label: 'More than 3 months', icon: '🏆' },
    ],
  },
];

const progressPrompts = [
  "Great start! Let's learn more about your financial situation.",
  "You're doing great! Just a few more questions.",
  'Almost there! This information helps us personalize your experience.',
  "Last few questions - you've got this!",
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, unknown>>({});
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [allocation, setAllocation] = useState({ needs: 50, wants: 30, goals: 20 });
  const [error, setError] = useState<string | null>(null);
  const [hasDebts, setHasDebts] = useState(false);
  const [debts, setDebts] = useState<DebtEntry[]>([]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Mutation to save individual step responses
  const saveResponseMutation = useMutation({
    mutationFn: async (payload: SaveResponsePayload) => {
      await apiClient.post('/onboarding/response', payload);
    },
    onError: (err) => {
      console.error('Failed to save onboarding response:', err);
      setError('Failed to save your response. Please try again.');
    },
    onSuccess: () => {
      setError(null);
    },
  });

  // Mutation to complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/complete');
    },
    onSuccess: () => {
      if (user) {
        setUser({ ...user, isOnboardingComplete: true });
      }
      navigate('/');
    },
    onError: (err) => {
      console.error('Failed to complete onboarding:', err);
      setError('Failed to complete onboarding. Please try again.');
    },
  });

  // Helper to format response value for API
  const formatResponseValue = (value: unknown): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Save response to backend
  const saveStepResponse = (stepId: number, stepName: string, value: unknown) => {
    saveResponseMutation.mutate({
      stepNumber: stepId,
      stepName: stepName,
      response: formatResponseValue(value),
    });
  };

  const handleOptionSelect = (value: string) => {
    setResponses({ ...responses, [step.id]: value });
    // Save response to backend
    saveStepResponse(step.id, step.name, value);
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleNext = () => {
    if (step.type === 'input') {
      setResponses({ ...responses, [step.id]: monthlyIncome });
      // Save income response to backend
      saveStepResponse(step.id, step.name, monthlyIncome);
    } else if (step.type === 'sliders') {
      setResponses({ ...responses, [step.id]: allocation });
      // Save allocation response to backend
      saveStepResponse(step.id, step.name, allocation);
    } else if (step.type === 'debts') {
      // Format debts as JSON array for backend
      const debtData = hasDebts
        ? debts
            .filter((d) => d.balance && parseFloat(d.balance) > 0)
            .map((d) => ({
              type: d.type,
              name: d.name || '',
              balance: parseFloat(d.balance) || 0,
            }))
        : [];
      setResponses({ ...responses, [step.id]: debtData });
      // Save debts response to backend
      saveStepResponse(step.id, step.name, debtData);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const addDebt = () => {
    setDebts([
      ...debts,
      {
        id: crypto.randomUUID(),
        type: 'Credit Card',
        name: '',
        balance: '',
      },
    ]);
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter((d) => d.id !== id));
  };

  const updateDebt = (id: string, field: keyof DebtEntry, value: string) => {
    setDebts(debts.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleComplete = () => {
    // Call complete endpoint - this will also update the auth store on success
    completeOnboardingMutation.mutate();
  };

  const showPrompt = currentStep > 0 && currentStep % 2 === 0 && currentStep < steps.length - 1;
  const promptIndex = Math.floor(currentStep / 2) - 1;

  return (
    <div className="min-h-screen bg-cactus-sandstone font-cactus flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-cactus-overlay">
        <div
          className="h-full bg-cactus-sage transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <CactusLogo />
        <p className="text-sm text-cactus-charcoal/60">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 rounded-lg text-red-800 text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {showPrompt && (
            <div className="mb-6 p-4 bg-cactus-needs-bg rounded-lg text-cactus-charcoal text-center">
              <Check className="w-5 h-5 inline-block mr-2 text-cactus-sage" />
              {progressPrompts[promptIndex]}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-cactus-charcoal mb-2">{step.question}</h2>
            {step.description && <p className="text-cactus-charcoal/60 mb-6">{step.description}</p>}

            {/* Options */}
            {step.options && (
              <div className="space-y-3">
                {step.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      responses[step.id] === option.value
                        ? 'border-cactus-sage bg-cactus-sage-light'
                        : 'border-gray-200 hover:border-cactus-sage/60 hover:bg-cactus-sandstone'
                    }`}
                  >
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <span className="font-medium text-cactus-charcoal">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Currency input */}
            {step.type === 'input' && (
              <div className="mt-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                    R
                  </span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-cactus-sage focus:ring-0"
                    placeholder="30,000"
                  />
                </div>
              </div>
            )}

            {/* Allocation sliders */}
            {step.type === 'sliders' && (
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-cactus-sage">Needs</span>
                    <span className="font-bold text-cactus-sage">{allocation.needs}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={allocation.needs}
                    onChange={(e) => {
                      const needs = Number(e.target.value);
                      const remaining = 100 - needs;
                      const wantsRatio =
                        allocation.wants / (allocation.wants + allocation.goals) || 0.5;
                      setAllocation({
                        needs,
                        wants: Math.round(remaining * wantsRatio),
                        goals: Math.round(remaining * (1 - wantsRatio)),
                      });
                    }}
                    className="w-full h-2 bg-cactus-overlay rounded-lg appearance-none cursor-pointer accent-cactus-sage"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-amber-700">Wants</span>
                    <span className="font-bold text-amber-700">{allocation.wants}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={100 - allocation.needs}
                    value={allocation.wants}
                    onChange={(e) => {
                      const wants = Number(e.target.value);
                      setAllocation({
                        ...allocation,
                        wants,
                        goals: 100 - allocation.needs - wants,
                      });
                    }}
                    className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-cactus-prickly">Goals</span>
                    <span className="font-bold text-cactus-prickly">{allocation.goals}%</span>
                  </div>
                  <div className="w-full h-2 bg-cactus-overlay rounded-lg">
                    <div
                      className="h-full bg-cactus-prickly rounded-lg"
                      style={{ width: `${allocation.goals}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Debt entry form */}
            {step.type === 'debts' && (
              <div className="mt-6 space-y-6">
                {/* Toggle for having debts */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">I have high-interest debts</span>
                  <button
                    onClick={() => {
                      setHasDebts(!hasDebts);
                      if (!hasDebts && debts.length === 0) {
                        addDebt();
                      }
                    }}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      hasDebts ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        hasDebts ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Debt entries */}
                {hasDebts && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 italic">
                      Just estimate - it does not need to be exact
                    </p>

                    {debts.map((debt, index) => (
                      <div
                        key={debt.id}
                        className="p-4 border-2 border-gray-200 rounded-xl space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">
                            Debt {index + 1}
                          </span>
                          {debts.length > 1 && (
                            <button
                              onClick={() => removeDebt(debt.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {/* Debt Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={debt.type}
                            onChange={(e) => updateDebt(debt.id, 'type', e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0"
                          >
                            {DEBT_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Debt Name (optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Name <span className="text-gray-400">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={debt.name}
                            onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                            placeholder="e.g., FNB Gold Card"
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0"
                          />
                        </div>

                        {/* Approximate Balance */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Approximate Balance
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              R
                            </span>
                            <input
                              type="number"
                              value={debt.balance}
                              onChange={(e) => updateDebt(debt.id, 'balance', e.target.value)}
                              placeholder="0"
                              className="w-full pl-8 p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add another debt button */}
                    <button
                      onClick={addDebt}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-green-500 hover:text-green-600 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add another debt
                    </button>
                  </div>
                )}

                {!hasDebts && (
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <span className="text-2xl mb-2 block">No debt is great!</span>
                    <p className="text-gray-600">
                      Toggle above if you do have any debts you want to track.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {(step.type === 'input' ||
              step.type === 'sliders' ||
              step.type === 'debts' ||
              currentStep === steps.length - 1) && (
              <button
                onClick={handleNext}
                disabled={completeOnboardingMutation.isPending || saveResponseMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-cactus-sage text-white font-bold rounded-xl hover:brightness-95 transition-all shadow-[0_4px_16px_rgba(119,221,119,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completeOnboardingMutation.isPending
                  ? 'Completing...'
                  : currentStep === steps.length - 1
                    ? 'Get Started'
                    : 'Continue'}
                {!completeOnboardingMutation.isPending && <ChevronRight className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
