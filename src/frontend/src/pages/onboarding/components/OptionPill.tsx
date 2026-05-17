interface OptionPillProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function OptionPill({ icon, label, selected, onClick }: OptionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream ${
        selected
          ? 'border-brand-sage/60 bg-brand-sage-soft'
          : 'border-brand-border bg-brand-surface hover:border-brand-sage/40 hover:bg-brand-sage-soft/40'
      }`}
    >
      <span className="text-xl shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span
        className={`font-sans-brand text-[15px] text-brand-text ${
          selected ? 'font-semibold' : 'font-medium'
        }`}
      >
        {label}
      </span>
      {selected && (
        <span className="ml-auto text-brand-sage text-lg" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}
