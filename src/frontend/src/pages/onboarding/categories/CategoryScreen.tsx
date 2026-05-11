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
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-4xl mb-2.5" aria-hidden="true">
          🗂️
        </div>
        <h1 className="font-cactus font-bold text-[21px] text-cactus-charcoal m-0 mb-1.5">
          Customise your categories
        </h1>
        <p className="font-cactus text-[13.5px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed">
          We've started you off with the common ones. Remove what doesn't apply, add what's missing.
        </p>

        <Bucket
          label="Needs"
          dotClass="bg-cactus-sage"
          accentClass="text-cactus-sage"
          activeBgClass="bg-cactus-needs-bg"
          activeBorderClass="border-cactus-sage"
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
          dotClass="bg-cactus-desert"
          accentClass="text-cactus-desert"
          activeBgClass="bg-cactus-wants-bg"
          activeBorderClass="border-cactus-desert"
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${dotClass}`} />
          <span className="font-cactus font-bold text-[15px] text-cactus-charcoal">{label}</span>
        </div>
        <button
          type="button"
          onClick={onShowAdd}
          className={`bg-transparent border-none font-cactus font-semibold text-xs cursor-pointer ${accentClass}`}
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
              className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full border-2 cursor-pointer transition-all font-cactus font-semibold text-[13px] text-cactus-charcoal ${
                active ? `${activeBorderClass} ${activeBgClass}` : 'border-cactus-overlay bg-white'
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {cat.icon}
              </span>
              {cat.name}
              {active && (
                <span className="text-xs text-cactus-charcoal/30 ml-0.5" aria-hidden="true">
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showAdd && extras.length > 0 && (
        <div className={`mt-2.5 py-2.5 px-3 ${activeBgClass} rounded-xl animate-fade-up`}>
          <p className="font-cactus text-[11px] text-cactus-charcoal/40 font-semibold m-0 mb-2">
            Tap to add:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extras.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => onToggle(cat)}
                className="inline-flex items-center gap-1 py-1.5 px-3 rounded-full border-2 border-cactus-overlay bg-white cursor-pointer font-cactus font-semibold text-xs text-cactus-charcoal"
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
