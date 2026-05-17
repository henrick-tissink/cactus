import { useState } from 'react';
import { Btn } from '../../../components/brand/Btn';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

// Brand-* hex used inline because native range inputs and inline gradients
// can't read CSS vars at runtime. If brand tokens shift, update alongside
// index.css.
const COLOR_NEEDS = '#1f6f4a'; // brand-sage
const COLOR_WANTS = '#c9743a'; // brand-terracotta
const COLOR_GOALS = '#8c4a1e'; // brand-accent-ink
const COLOR_TRACK = '#ebe5d5'; // brand-border
const COLOR_MUTED = '#6b5e4a'; // brand-text-muted

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
    background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / max) * 100}%, ${COLOR_TRACK} ${
      (value / max) * 100
    }%, ${COLOR_TRACK} 100%)`,
    color,
  });

  const bars = [
    { label: 'Needs', percent: needs, color: COLOR_NEEDS },
    { label: 'Wants', percent: wants, color: COLOR_WANTS },
    { label: 'Goals', percent: goals, color: COLOR_GOALS },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans-brand px-6 animate-fade-up">
      <div className="pt-6 text-center mb-5">
        <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
          Try it
        </p>
        <h2 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text m-0 mb-2">
          Play with your plan.
        </h2>
        <p className="font-sans-brand text-[13px] text-brand-text-muted m-0 leading-relaxed">
          Drag the sliders to see how your money moves.
        </p>
      </div>

      <div className="text-center mb-5">
        <button
          type="button"
          onClick={() => setShowIncome((s) => !s)}
          className="inline-flex items-center gap-2 bg-brand-surface border border-brand-border rounded-full py-2 px-4 cursor-pointer font-sans-brand font-semibold text-[13px] text-brand-text-muted hover:bg-brand-sage-soft/40 hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors"
          aria-expanded={showIncome}
        >
          <span>Monthly income</span>
          <span className="font-display font-medium tabular-lining text-brand-text">
            {fmt(income)}
          </span>
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
              style={sliderStyle(COLOR_MUTED, income - 5000, 145000)}
            />
            <p className="font-sans-brand text-[12px] text-brand-text-faint mt-2 m-0">
              Adjust to see your real numbers
            </p>
          </div>
        )}
      </div>

      <div className="flex rounded-2xl overflow-hidden h-[56px] mb-7 border border-brand-border">
        {bars.map((b) => (
          <div
            key={b.label}
            style={{ width: `${b.percent}%`, background: b.color }}
            className="flex flex-col items-center justify-center transition-[width] duration-300 overflow-hidden text-white"
          >
            {b.percent > 5 && (
              <>
                <span className="font-sans-brand font-semibold text-[9px] tracking-[0.14em] uppercase opacity-80">
                  {b.label}
                </span>
                <span className="font-display font-medium tabular-lining text-[15px]">
                  {b.percent}%
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5 mb-6">
        <SliderRow
          label="🏠 Needs"
          value={needs}
          colorClass="text-brand-sage"
          colorHex={COLOR_NEEDS}
          absolute={nA}
          onChange={handleNeeds}
          sliderStyle={sliderStyle}
          inputAriaLabel="Needs"
        />
        <SliderRow
          label="🛍️ Wants"
          value={wants}
          colorClass="text-brand-terracotta"
          colorHex={COLOR_WANTS}
          absolute={wA}
          onChange={handleWants}
          sliderStyle={sliderStyle}
          inputAriaLabel="Wants"
        />
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-sans-brand font-semibold text-[14px] text-brand-text">
              🎯 Goals
            </span>
            <span className="font-display font-medium tabular-lining text-[14px] text-brand-accent-ink">
              {goals}% · {fmt(gA)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-brand-border/60 overflow-hidden">
            <div
              className="h-full bg-brand-accent-ink rounded-full transition-[width] duration-300"
              style={{ width: `${(goals / 80) * 100}%` }}
            />
          </div>
          <p className="font-sans-brand text-[12px] text-brand-text-faint mt-2 m-0">
            Auto-calculated — this is your future fund
          </p>
        </div>
      </div>

      <div className="bg-brand-accent-ink/10 border-l-[3px] border-brand-accent-ink rounded-r-2xl py-4 px-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base" aria-hidden="true">
            🎯
          </span>
          <span className="font-sans-brand font-semibold text-[13px] text-brand-text">
            Example: Pay off R20,000 debt
          </span>
        </div>
        <div className="font-display font-medium tabular-lining text-[1.5rem] text-brand-accent-ink mb-1 leading-[1.1] tracking-[-0.018em]">
          {monthsToPayoff === Infinity
            ? 'Set a goal % first'
            : monthsToPayoff <= 1
              ? 'Done in 1 month 🎉'
              : `Done in ${monthsToPayoff} months`}
        </div>
        <p className="font-sans-brand text-[12px] text-brand-text-muted m-0">
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
        <span className="font-sans-brand font-semibold text-[14px] text-brand-text">{label}</span>
        <span className={`font-display font-medium tabular-lining text-[14px] ${colorClass}`}>
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
