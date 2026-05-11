import { useState } from 'react';
import { Btn } from '../../../components/brand/Btn';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

interface Phase2SliderProps {
  onContinue: () => void;
}

export function Phase2Slider({ onContinue }: Phase2SliderProps) {
  const [income, setIncome] = useState(35000);
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const [showIncome, setShowIncome] = useState(false);

  const goals = Math.max(0, 100 - needs - wants);
  const nA = Math.round((needs / 100) * income);
  const wA = Math.round((wants / 100) * income);
  const gA = income - nA - wA;
  const monthsToPayoff = gA > 0 ? Math.ceil(20000 / gA) : Infinity;

  const handleNeeds = (v: number) => setNeeds(Math.min(v, 100 - wants));
  const handleWants = (v: number) => setWants(Math.min(v, 100 - needs));

  const sliderStyle = (color: string, value: number, max = 80) => ({
    width: '100%',
    background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / max) * 100}%, #E8E8E8 ${
      (value / max) * 100
    }%, #E8E8E8 100%)`,
    color,
  });

  const bars = [
    { label: 'Needs', percent: needs, color: '#77DD77' },
    { label: 'Wants', percent: wants, color: '#FFCC00' },
    { label: 'Goals', percent: goals, color: '#FF6F61' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="pt-6 text-center mb-4">
        <h2 className="font-cactus font-bold text-xl text-cactus-charcoal m-0 mb-1">
          Play with your plan
        </h2>
        <p className="font-cactus text-[13px] text-cactus-charcoal/40 font-medium m-0">
          Drag the sliders to see how your money moves.
        </p>
      </div>

      <div className="text-center mb-4">
        <button
          type="button"
          onClick={() => setShowIncome((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-cactus-sandstone border-[1.5px] border-cactus-overlay rounded-full py-2 px-4 cursor-pointer font-cactus font-semibold text-[13px] text-cactus-charcoal/50"
          aria-expanded={showIncome}
        >
          Monthly income: {fmt(income)}{' '}
          <span
            className={`text-[10px] transition-transform inline-block ${
              showIncome ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
        {showIncome && (
          <div className="mt-3 animate-fade-up">
            <input
              type="range"
              min="5000"
              max="150000"
              step="1000"
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value))}
              aria-label="Income amount"
              className="cactus-slider w-4/5"
              style={sliderStyle('#999', income - 5000, 145000)}
            />
            <p className="font-cactus text-[11px] text-cactus-charcoal/40 font-medium mt-1.5 m-0">
              Adjust to see your real numbers
            </p>
          </div>
        )}
      </div>

      <div className="flex rounded-xl overflow-hidden h-[52px] mb-6">
        {bars.map((b) => (
          <div
            key={b.label}
            style={{ width: `${b.percent}%`, background: b.color }}
            className="flex flex-col items-center justify-center transition-[width] duration-300 overflow-hidden"
          >
            {b.percent > 5 && (
              <>
                <span className="font-cactus font-bold text-[10px] text-cactus-charcoal/70 uppercase">
                  {b.label}
                </span>
                <span className="font-cactus font-bold text-[15px] text-cactus-charcoal">
                  {b.percent}%
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mb-5">
        <SliderRow
          label="🏠 Needs"
          value={needs}
          colorClass="text-cactus-sage"
          colorHex="#77DD77"
          absolute={nA}
          onChange={handleNeeds}
          sliderStyle={sliderStyle}
          inputAriaLabel="Needs"
        />
        <SliderRow
          label="🛍️ Wants"
          value={wants}
          colorClass="text-cactus-desert"
          colorHex="#FFCC00"
          absolute={wA}
          onChange={handleWants}
          sliderStyle={sliderStyle}
          inputAriaLabel="Wants"
        />
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-cactus font-semibold text-sm text-cactus-charcoal">🎯 Goals</span>
            <span className="font-cactus font-bold text-sm text-cactus-prickly">
              {goals}% · {fmt(gA)}
            </span>
          </div>
          <div className="h-2 rounded bg-cactus-overlay overflow-hidden">
            <div
              className="h-full bg-cactus-prickly rounded transition-[width] duration-300"
              style={{ width: `${(goals / 80) * 100}%` }}
            />
          </div>
          <p className="font-cactus text-[11px] text-cactus-charcoal/40 font-medium mt-1.5 m-0">
            Auto-calculated — this is your future fund
          </p>
        </div>
      </div>

      <div className="bg-cactus-goals-bg rounded-2xl py-3.5 px-4 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base" aria-hidden="true">
            🎯
          </span>
          <span className="font-cactus font-semibold text-[13px] text-cactus-charcoal">
            Example: Pay off R20,000 debt
          </span>
        </div>
        <div className="font-cactus font-bold text-[22px] text-cactus-prickly mb-0.5">
          {monthsToPayoff === Infinity
            ? 'Set a goal % first'
            : monthsToPayoff <= 1
              ? 'Done in 1 month 🎉'
              : `Done in ${monthsToPayoff} months`}
        </div>
        <p className="font-cactus text-xs text-cactus-charcoal/50 font-medium m-0">
          {gA > 0
            ? `Based on putting ${fmt(gA)}/month toward goals`
            : 'Move the sliders to see the magic'}
        </p>
      </div>

      <div className="py-2 pb-7 shrink-0">
        <Btn onClick={onContinue}>Got it — let's build mine</Btn>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  colorClass: string;
  colorHex: string;
  absolute: number;
  onChange: (v: number) => void;
  sliderStyle: (color: string, value: number, max?: number) => React.CSSProperties;
  inputAriaLabel: string;
}

function SliderRow({
  label,
  value,
  colorClass,
  colorHex,
  absolute,
  onChange,
  sliderStyle,
  inputAriaLabel,
}: SliderRowProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-cactus font-semibold text-sm text-cactus-charcoal">{label}</span>
        <span className={`font-cactus font-bold text-sm ${colorClass}`}>
          {value}% · {fmt(absolute)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="80"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        aria-label={inputAriaLabel}
        className="cactus-slider"
        style={sliderStyle(colorHex, value)}
      />
    </div>
  );
}
