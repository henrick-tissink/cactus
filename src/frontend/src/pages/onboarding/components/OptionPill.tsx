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
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all text-left w-full ${
        selected
          ? 'border-cactus-sage bg-cactus-sage-light'
          : 'border-cactus-overlay bg-white hover:border-cactus-sage/60'
      }`}
    >
      <span className="text-xl shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span
        className={`font-cactus text-[15px] text-cactus-charcoal ${
          selected ? 'font-bold' : 'font-semibold'
        }`}
      >
        {label}
      </span>
      {selected && (
        <span className="ml-auto text-cactus-sage text-lg" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}
