import { Btn } from '../../../components/brand/Btn';
import { Dots } from '../components/Dots';
import { OptionPill } from '../components/OptionPill';
import { WhyDisclosure } from '../components/WhyDisclosure';
import type { WizardQuestion } from '../data';

interface QuestionScreenProps {
  question: WizardQuestion;
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function QuestionScreen({
  question,
  selectedValues,
  onSelect,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: QuestionScreenProps) {
  const isExclusive = (v: string) => question.exclusiveValue === v;

  const pick = (value: string) => {
    if (!question.multi) {
      onSelect([value]);
      return;
    }
    if (isExclusive(value)) {
      onSelect(selectedValues.includes(value) ? [] : [value]);
      return;
    }
    const without = selectedValues.filter((v) => !isExclusive(v));
    onSelect(without.includes(value) ? without.filter((v) => v !== value) : [...without, value]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="pt-3">
        <Dots current={stepIndex} total={totalSteps} />
      </div>
      <div className="flex-1 flex flex-col pt-3">
        <div className="text-4xl mb-3" aria-hidden="true">
          {question.emoji}
        </div>
        <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          {question.headline}
        </h1>
        <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-2 leading-snug">
          {question.subtitle}
        </p>
        <WhyDisclosure reason={question.why} />
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => (
            <OptionPill
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={selectedValues.includes(opt.value)}
              onClick={() => pick(opt.value)}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 py-5 pb-7">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 px-6 py-3.5 rounded-2xl border-2 border-cactus-overlay bg-transparent font-cactus font-semibold text-[15px] text-cactus-charcoal/40 cursor-pointer"
          >
            Back
          </button>
        )}
        <Btn onClick={onNext} disabled={selectedValues.length === 0}>
          {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
        </Btn>
      </div>
    </div>
  );
}
