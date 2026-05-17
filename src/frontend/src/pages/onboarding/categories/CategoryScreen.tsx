import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { defaultCategories, extraCategories, type CategoryDef } from './data';

interface CategoryScreenProps {
  onContinue: (selectedNeeds: string[], selectedWants: string[]) => void;
}

export function CategoryScreen({ onContinue }: CategoryScreenProps) {
  const defaultNeeds = defaultCategories.filter((c) => c.bucket === 'needs');
  const defaultWants = defaultCategories.filter((c) => c.bucket === 'wants');

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(defaultNeeds.map((c) => c.name));
  const [selectedWants, setSelectedWants] = useState<string[]>(defaultWants.map((c) => c.name));
  const [showAddNeeds, setShowAddNeeds] = useState(false);
  const [showAddWants, setShowAddWants] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 3,
        stepName: 'Category selection',
        response: JSON.stringify({ needs: selectedNeeds, wants: selectedWants }),
      });
    },
    onSuccess: () => onContinue(selectedNeeds, selectedWants),
  });

  const toggle = (cat: CategoryDef) => {
    if (cat.bucket === 'needs') {
      setSelectedNeeds((prev) =>
        prev.includes(cat.name) ? prev.filter((n) => n !== cat.name) : [...prev, cat.name]
      );
    } else {
      setSelectedWants((prev) =>
        prev.includes(cat.name) ? prev.filter((n) => n !== cat.name) : [...prev, cat.name]
      );
    }
  };

  const extraNeedsAvailable = extraCategories.filter(
    (c) => c.bucket === 'needs' && !selectedNeeds.includes(c.name)
  );
  const extraWantsAvailable = extraCategories.filter(
    (c) => c.bucket === 'wants' && !selectedWants.includes(c.name)
  );

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-3xl mb-3" aria-hidden="true">
          🗂️
        </div>
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Categories
        </p>
        <h1 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          Customise the buckets.
        </h1>
        <p className="font-sans-brand text-[13.5px] text-brand-text-muted m-0 mb-7 leading-relaxed">
          We've started you off with the common ones. Remove what doesn't apply, add what's missing.
        </p>

        <Bucket
          label="Needs"
          dotClass="bg-brand-sage"
          accentClass="text-brand-sage"
          activeBgClass="bg-brand-sage-soft"
          activeBorderClass="border-brand-sage/60"
          defaults={defaultNeeds}
          selected={selectedNeeds}
          onToggle={toggle}
          showAdd={showAddNeeds}
          onShowAdd={() => setShowAddNeeds((s) => !s)}
          extras={extraNeedsAvailable}
          extraSelectedFromNonDefaults={extraCategories.filter(
            (c) => c.bucket === 'needs' && selectedNeeds.includes(c.name)
          )}
        />
        <Bucket
          label="Wants"
          dotClass="bg-brand-terracotta"
          accentClass="text-brand-terracotta"
          activeBgClass="bg-brand-terracotta-soft"
          activeBorderClass="border-brand-terracotta/60"
          defaults={defaultWants}
          selected={selectedWants}
          onToggle={toggle}
          showAdd={showAddWants}
          onShowAdd={() => setShowAddWants((s) => !s)}
          extras={extraWantsAvailable}
          extraSelectedFromNonDefaults={extraCategories.filter(
            (c) => c.bucket === 'wants' && selectedWants.includes(c.name)
          )}
        />
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Looks good
        </Btn>
      </div>
    </div>
  );
}

interface BucketProps {
  label: string;
  dotClass: string;
  accentClass: string;
  activeBgClass: string;
  activeBorderClass: string;
  defaults: CategoryDef[];
  selected: string[];
  onToggle: (cat: CategoryDef) => void;
  showAdd: boolean;
  onShowAdd: () => void;
  extras: CategoryDef[];
  extraSelectedFromNonDefaults: CategoryDef[];
}

function Bucket({
  label,
  dotClass,
  accentClass,
  activeBgClass,
  activeBorderClass,
  defaults,
  selected,
  onToggle,
  showAdd,
  onShowAdd,
  extras,
  extraSelectedFromNonDefaults,
}: BucketProps) {
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={onShowAdd}
          className={`bg-transparent border-none font-sans-brand font-semibold text-[12px] cursor-pointer underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline transition-colors ${accentClass}`}
        >
          + Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...defaults, ...extraSelectedFromNonDefaults].map((cat) => {
          const active = selected.includes(cat.name);
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onToggle(cat)}
              className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full border cursor-pointer transition-all font-sans-brand font-semibold text-[13px] text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream ${
                active
                  ? `${activeBorderClass} ${activeBgClass}`
                  : 'border-brand-border bg-brand-surface hover:border-brand-sage/30'
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {cat.icon}
              </span>
              {cat.name}
              {active && (
                <span className="text-[10px] text-brand-text-faint ml-0.5" aria-hidden="true">
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showAdd && extras.length > 0 && (
        <div className={`mt-3 py-3 px-4 ${activeBgClass} rounded-2xl animate-fade-up`}>
          <p className="font-sans-brand text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-text-faint m-0 mb-2">
            Tap to add
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extras.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => onToggle(cat)}
                className="inline-flex items-center gap-1 py-1.5 px-3 rounded-full border border-brand-border bg-brand-surface cursor-pointer font-sans-brand font-semibold text-[12px] text-brand-text hover:border-brand-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-colors"
              >
                <span className="text-sm" aria-hidden="true">
                  {cat.icon}
                </span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
