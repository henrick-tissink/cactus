import { Btn } from '../../../components/brand/Btn';
import { frameworkCards } from './data';

interface Phase2IntroProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function Phase2Intro({ onContinue, onSkip }: Phase2IntroProps) {
  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2" aria-hidden="true">
            💡
          </div>
          <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5">
            Meet your Spending Plan
          </h1>
          <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 leading-relaxed max-w-[300px] mx-auto">
            We split your money into three simple buckets. No spreadsheets. No stress.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {frameworkCards.map((card) => (
            <div
              key={card.title}
              className={`${card.bgClass} rounded-2xl p-4 px-[18px] flex items-start gap-3.5 animate-fade-up`}
            >
              <div className="text-3xl shrink-0 pt-0.5" aria-hidden="true">
                {card.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-cactus font-bold text-[17px] text-cactus-charcoal">
                    {card.title}
                  </span>
                  <span className={`font-cactus font-bold text-xl ${card.colorClass}`}>
                    {card.percent}%
                  </span>
                </div>
                <p className="font-cactus text-[13px] text-cactus-charcoal/50 font-semibold m-0 mb-1">
                  {card.subtitle}
                </p>
                <p className="font-cactus text-[11.5px] text-cactus-charcoal/40 font-medium m-0">
                  e.g. {card.examples}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center font-cactus text-[12.5px] text-cactus-charcoal/40 font-medium mt-4 mb-0 leading-relaxed">
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
          className="block mx-auto mt-3 bg-transparent border-none font-cactus font-semibold text-[13px] text-cactus-charcoal/40 cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
