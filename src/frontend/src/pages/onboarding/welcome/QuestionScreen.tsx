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
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="pt-4">
        <Dots current={stepIndex} total={totalSteps} />
      </div>
      <div className="flex-1 flex flex-col pt-4">
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Question {stepIndex + 1} of {totalSteps}
        </p>
        <div className="text-3xl mb-3" aria-hidden="true">
          {question.emoji}
        </div>
        <h1 className="font-display font-medium text-[1.625rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          {question.headline}
        </h1>
        <p className="font-sans-brand text-[13px] text-brand-text-muted m-0 mb-3 leading-relaxed">
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
            className="shrink-0 px-6 py-3.5 rounded-2xl border border-brand-border bg-brand-surface font-sans-brand font-semibold text-[14px] text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors cursor-pointer"
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
