import { Btn } from '../../../components/brand/Btn';
import { frameworkCards } from './data';

interface Phase2IntroProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function Phase2Intro({ onContinue, onSkip }: Phase2IntroProps) {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-center mb-7">
          <div className="text-3xl mb-3" aria-hidden="true">
            💡
          </div>
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
            Three buckets
          </p>
          <h1 className="font-display font-medium text-[1.875rem] leading-[1.05] tracking-[-0.018em] text-brand-text m-0 mb-3 max-w-[300px] mx-auto">
            Meet your Spending Plan.
          </h1>
          <p className="font-sans-brand text-[14px] text-brand-text-muted m-0 leading-relaxed max-w-[320px] mx-auto">
            We split your money into three simple buckets. No spreadsheets, no stress.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {frameworkCards.map((card) => (
            <div
              key={card.title}
              className={`${card.bgClass} border border-brand-border rounded-2xl p-4 px-[18px] flex items-start gap-3.5 animate-fade-up`}
            >
              <div className="text-3xl shrink-0 pt-0.5" aria-hidden="true">
                {card.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-medium text-[1.125rem] tracking-[-0.018em] text-brand-text">
                    {card.title}
                  </span>
                  <span
                    className={`font-display font-medium tabular-lining text-[1.25rem] ${card.colorClass}`}
                  >
                    {card.percent}%
                  </span>
                </div>
                <p className="font-sans-brand text-[13px] text-brand-text font-semibold m-0 mb-1">
                  {card.subtitle}
                </p>
                <p className="font-sans-brand text-[12px] text-brand-text-muted m-0 leading-relaxed">
                  e.g. {card.examples}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center font-sans-brand text-[12px] text-brand-text-faint mt-5 mb-0 leading-relaxed">
          Based on the 50/30/20 guideline — a great starting point.
          <br />
          You can always adjust it to fit your life.
        </p>
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={onContinue}>See it in action</Btn>
        <button
          type="button"
          onClick={onSkip}
          className="block mx-auto mt-3 bg-transparent border-none font-sans-brand font-semibold text-[13px] text-brand-text-faint hover:text-brand-text-muted cursor-pointer transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
