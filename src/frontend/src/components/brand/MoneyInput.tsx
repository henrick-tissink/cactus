interface MoneyInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
}: MoneyInputProps) {
  return (
    <div
      className={`flex items-center gap-1 bg-white border-2 border-cactus-mint rounded-2xl px-4 py-4 focus-within:border-cactus-sage transition-colors ${className}`}
    >
      <span className="font-display font-medium text-2xl text-cactus-charcoal/40">R</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        className="flex-1 border-none bg-transparent outline-none font-display font-medium text-2xl text-cactus-charcoal tabular-lining placeholder:text-cactus-charcoal/30"
      />
    </div>
  );
}
